import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, text

from .api import admin, auth, chat, conversations, documents, health
from .core import Base, SessionLocal, engine
from .core.security import hash_password, secret
from .models import User


@asynccontextmanager
async def lifespan(app):
    secret()
    # A small MVP uses create_all. Add versioned migrations before evolving a live schema.
    with engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        for prefix, role in [("ADMIN", "admin"), ("STUDENT", "user")]:
            email, password = os.getenv(prefix + "_EMAIL"), os.getenv(prefix + "_PASSWORD")
            if (
                email
                and password
                and not db.scalar(select(User).where(User.email == email.lower().strip()))
            ):
                if len(password) < 12:
                    raise RuntimeError(prefix + "_PASSWORD must contain at least 12 characters")
                db.add(
                    User(email=email.lower().strip(), password=hash_password(password), role=role)
                )
        db.commit()
    yield


app = FastAPI(title="CampusMind AI", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        s.strip()
        for s in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
        if s.strip()
    ],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
for module in (health, auth, documents, chat, conversations, admin):
    app.include_router(module.router, tags=[module.__name__.rsplit(".", 1)[-1]])
