import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch

os.environ["JWT_SECRET"] = "unit-test-secret-123456789012345678901234567890"
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core import Base, get_db
from app.core.security import hash_password, issue_token, verify_password
from app.main import app
from app.models import Chunk, User
from app.rag import retriever
from app.rag.chunking import chunk_pages
from app.rag.generator import REFUSAL, generate
from app.rag.ingestion import extract


class PipelineTests(unittest.TestCase):
    def test_chunk_pages_preserves_page_and_all_words(self):
        words = ["word" + str(i) for i in range(400)]
        chunks = chunk_pages([" ".join(words), "A segunda página."], size=200, overlap=30)
        self.assertEqual(chunks[-1]["page"], 2)
        for word in words:
            self.assertTrue(any(word in c["text"] for c in chunks))
        self.assertTrue(all(len(c["text"]) <= 200 for c in chunks))
        with self.assertRaises(ValueError):
            chunk_pages(["test"], size=10, overlap=10)

    def test_pdf_page_extraction(self):
        import pymupdf

        pdf = pymupdf.open()
        pdf.new_page().insert_text((40, 40), "First page second diploma copy")
        pdf.new_page().insert_text((40, 40), "Second page internship")
        pages, chunks, mime = extract(pdf.tobytes(), "manual.pdf")
        self.assertEqual(len(pages), 2)
        self.assertEqual([c["page"] for c in chunks], [1, 2])
        self.assertEqual(mime, "application/pdf")
        blank = pymupdf.open()
        blank.new_page()
        from fastapi import HTTPException

        with self.assertRaises(HTTPException):
            extract(blank.tobytes(), "scan.pdf")

    def test_generator_refuses_missing_or_invalid_sources(self):
        self.assertEqual(generate("Pergunta", [], []), (REFUSAL, []))
        source = {"title": "Manual", "text": "Trecho", "page": 1, "document_id": "d"}
        with patch(
            "app.rag.generator.provider_post",
            return_value={
                "choices": [
                    {
                        "message": {
                            "content": '{"answered":true,"answer":"Inventada","source_ids":[9]}'
                        }
                    }
                ]
            },
        ):
            self.assertEqual(generate("Pergunta", [source], []), (REFUSAL, []))
        with patch(
            "app.rag.generator.provider_post",
            return_value={
                "choices": [
                    {
                        "message": {
                            "content": '{"answered":true,"answer":"Fundamentada","source_ids":[1,1]}'
                        }
                    }
                ]
            },
        ):
            self.assertEqual(generate("Pergunta", [source], []), ("Fundamentada", [source]))

    def test_vector_retrieval_filters_weak_matches(self):
        chunk = SimpleNamespace(document_id="d", text="Trecho", page=2)
        db = SimpleNamespace(
            execute=lambda statement: SimpleNamespace(
                all=lambda: [(chunk, "Manual", 0.2), (chunk, "Irrelevante", 0.95)]
            )
        )
        with patch("app.rag.retriever.embed", return_value=[[1.0] + [0.0] * 1535]):
            result = retriever.retrieve(db, "Pergunta")
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["page"], 2)
        self.assertAlmostEqual(result[0]["score"], 0.8)


class AccessTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
        )

        @event.listens_for(cls.engine, "connect")
        def enable_fk(connection, record):
            connection.execute("PRAGMA foreign_keys=ON")

        Base.metadata.create_all(cls.engine)
        cls.Session = sessionmaker(cls.engine, expire_on_commit=False)

        def override():
            with cls.Session() as db:
                yield db

        app.dependency_overrides[get_db] = override
        # No lifespan: these tests deliberately use SQLite, not a PostgreSQL substitute for vector queries.
        cls.client = TestClient(app)
        with cls.Session() as db:
            cls.users = {}
            for email, role in [
                ("admin@test.local", "admin"),
                ("alice@test.local", "user"),
                ("bob@test.local", "user"),
            ]:
                user = User(email=email, password=hash_password("correct-password-123"), role=role)
                db.add(user)
                db.flush()
                cls.users[email] = user
            db.commit()
        cls.headers = {
            email: {"Authorization": "Bearer " + issue_token(user)}
            for email, user in cls.users.items()
        }

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()
        cls.client.close()
        cls.engine.dispose()

    def test_login_and_password_hash(self):
        self.assertEqual(self.client.get("/health").status_code, 200)
        self.assertEqual(
            self.client.post(
                "/auth/login", json={"email": "alice@test.local", "password": "wrong-password"}
            ).status_code,
            401,
        )
        good = self.client.post(
            "/auth/login", json={"email": "alice@test.local", "password": "correct-password-123"}
        )
        self.assertEqual(good.status_code, 200)
        self.assertEqual(good.json()["role"], "user")
        self.assertFalse(verify_password("wrong-password", self.users["alice@test.local"].password))
        self.assertEqual(self.client.get("/documents").status_code, 401)

    def test_document_permissions_ingestion_and_duplicate(self):
        files = {"file": ("sample.txt", b"Documento exemplo de segunda via.", "text/plain")}
        self.assertEqual(
            self.client.post(
                "/documents", files=files, headers=self.headers["alice@test.local"]
            ).status_code,
            403,
        )
        with patch("app.rag.ingestion.embed", return_value=[[1.0] + [0.0] * 1535]):
            result = self.client.post(
                "/documents", files=files, headers=self.headers["admin@test.local"]
            )
        self.assertEqual(result.status_code, 201, result.text)
        id = result.json()["id"]
        self.assertEqual(result.json()["chunks"][0]["page"], 1)
        self.assertEqual(
            self.client.post(
                "/documents", files=files, headers=self.headers["admin@test.local"]
            ).status_code,
            409,
        )
        self.assertEqual(
            self.client.delete(
                "/documents/" + id, headers=self.headers["alice@test.local"]
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.delete(
                "/documents/" + id, headers=self.headers["admin@test.local"]
            ).status_code,
            204,
        )
        with self.Session() as db:
            self.assertEqual(len(db.scalars(select(Chunk).where(Chunk.document_id == id)).all()), 0)

    def test_conversations_and_feedback_are_owner_only(self):
        with patch("app.api.chat.retrieve", return_value=[]):
            result = self.client.post(
                "/chat",
                json={"question": "Uma pergunta sem fonte"},
                headers=self.headers["alice@test.local"],
            )
        self.assertEqual(result.status_code, 200, result.text)
        id = result.json()["conversation_id"]
        message_id = result.json()["id"]
        self.assertEqual(result.json()["content"], REFUSAL)
        self.assertEqual(
            self.client.get(
                "/conversations/" + id, headers=self.headers["bob@test.local"]
            ).status_code,
            404,
        )
        self.assertEqual(
            self.client.post(
                "/messages/" + message_id + "/feedback",
                json={"value": 1},
                headers=self.headers["bob@test.local"],
            ).status_code,
            404,
        )
        self.assertEqual(
            self.client.delete(
                "/conversations/" + id, headers=self.headers["bob@test.local"]
            ).status_code,
            404,
        )
        self.assertEqual(
            self.client.post(
                "/messages/" + message_id + "/feedback",
                json={"value": -1},
                headers=self.headers["alice@test.local"],
            ).status_code,
            200,
        )
        self.assertEqual(
            self.client.delete(
                "/conversations/" + id, headers=self.headers["alice@test.local"]
            ).status_code,
            204,
        )
        self.assertEqual(
            self.client.get("/admin/stats", headers=self.headers["alice@test.local"]).status_code,
            403,
        )


if __name__ == "__main__":
    unittest.main()
