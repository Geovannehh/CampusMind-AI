from fastapi import HTTPException
from sqlalchemy import select

from ..models import Chunk, Conversation


def document_json(d, db):
    chunks = db.scalars(select(Chunk).where(Chunk.document_id == d.id).order_by(Chunk.index)).all()
    return {
        "id": d.id,
        "title": d.title,
        "category": d.category,
        "pages": d.pages,
        "updated": d.updated.isoformat(),
        "status": "ready",
        "chunks": [{"page": c.page, "text": c.text} for c in chunks],
    }


def message_json(m):
    return {
        "id": m.id,
        "role": m.role,
        "content": m.content,
        "sources": m.sources,
        "feedback": m.feedback,
    }


def own_conversation(db, id, user):
    c = db.scalar(
        select(Conversation).where(Conversation.id == id, Conversation.user_id == user.id)
    )
    if not c:
        raise HTTPException(404, "Conversa não encontrada")
    return c


def question_text(q):
    value = q.question.strip()
    if not value:
        raise HTTPException(422, "A pergunta não pode estar vazia.")
    return value
