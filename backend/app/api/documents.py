import hashlib
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..core import get_db
from ..core.security import admin, current_user
from ..models import Chunk, Document, User
from ..rag.ingestion import prepare
from ..services.records import document_json

router = APIRouter()


@router.get("/documents")
def documents(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return [
        document_json(d, db)
        for d in db.scalars(select(Document).order_by(Document.updated.desc())).all()
    ]


@router.get("/documents/{id}")
def get_document(id: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    d = db.get(Document, id)
    if not d:
        raise HTTPException(404, "Documento não encontrado")
    return document_json(d, db)


@router.get("/documents/{id}/file")
def document_file(id: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    d = db.get(Document, id)
    if not d:
        raise HTTPException(404, "Documento não encontrado")
    return Response(
        d.original,
        media_type=d.mime,
        headers={
            "Content-Disposition": 'attachment; filename="document'
            + (".pdf" if d.mime == "application/pdf" else ".txt")
            + '"',
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.post("/documents", status_code=201)
def upload(
    file: UploadFile = File(...),
    category: str = Form("Outros"),
    user: User = Depends(admin),
    db: Session = Depends(get_db),
):
    raw = file.file.read(10 * 1024 * 1024 + 1)
    if not raw:
        raise HTTPException(422, "Arquivo vazio")
    if len(raw) > 10 * 1024 * 1024:
        raise HTTPException(413, "O limite é de 10 MB.")
    digest = hashlib.sha256(raw).hexdigest()
    if db.scalar(select(Document.id).where(Document.digest == digest)):
        raise HTTPException(409, "Este documento já está na base.")
    filename = Path(file.filename or "documento").name
    pages, chunks, mime, vectors = prepare(raw, filename)
    doc = Document(
        title=Path(filename).stem[:255],
        category=category.strip()[:100] or "Outros",
        pages=len(pages),
        digest=digest,
        original=raw,
        mime=mime,
    )
    try:
        db.add(doc)
        db.flush()
        db.add_all(
            Chunk(document_id=doc.id, text=c["text"], page=c["page"], index=c["index"], embedding=v)
            for c, v in zip(chunks, vectors)
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Este documento já está na base.")
    return document_json(doc, db)


@router.delete("/documents/{id}", status_code=204)
def remove_document(id: str, user: User = Depends(admin), db: Session = Depends(get_db)):
    doc = db.get(Document, id)
    if not doc:
        raise HTTPException(404, "Documento não encontrado")
    db.delete(doc)
    db.commit()
    return Response(status_code=204)


@router.post("/documents/{id}/index")
def reindex(id: str, user: User = Depends(admin), db: Session = Depends(get_db)):
    doc = db.get(Document, id)
    if not doc:
        raise HTTPException(404, "Documento não encontrado")
    extension = ".pdf" if doc.mime == "application/pdf" else ".txt"
    pages, chunks, mime, vectors = prepare(doc.original, doc.title + extension)
    # Only replace old data after all new embeddings succeeded.
    db.execute(delete(Chunk).where(Chunk.document_id == id))
    db.add_all(
        Chunk(document_id=id, text=c["text"], page=c["page"], index=c["index"], embedding=v)
        for c, v in zip(chunks, vectors)
    )
    doc.updated = datetime.now(timezone.utc)
    db.commit()
    return document_json(doc, db)
