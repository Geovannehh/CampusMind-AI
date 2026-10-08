from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core import get_db
from ..core.security import current_user
from ..models import Conversation, Message, User
from ..rag.generator import generate
from ..rag.retriever import retrieve
from ..schemas import Question
from ..services.records import message_json, own_conversation, question_text

router = APIRouter()


@router.post("/search")
def search(body: Question, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return {"mode": "semantic", "sources": retrieve(db, question_text(body))}


@router.post("/chat")
def chat(body: Question, user: User = Depends(current_user), db: Session = Depends(get_db)):
    q = question_text(body)
    conversation = (
        own_conversation(db, body.conversation_id, user) if body.conversation_id else None
    )
    history = (
        list(
            db.scalars(
                select(Message)
                .where(Message.conversation_id == conversation.id)
                .order_by(Message.created)
            ).all()
        )
        if conversation
        else []
    )
    # Brief follow-ups include the last user question in retrieval, not assistant assertions.
    query = q
    if len(q.split()) < 7 and history:
        previous = next((m.content for m in reversed(history) if m.role == "user"), "")
        query = previous + "\nPergunta atual: " + q
    sources = retrieve(db, query)
    if body.mode == "search":
        answer = (
            "Encontrei estes trechos semanticamente relacionados."
            if sources
            else "Não encontrei trechos relevantes na base."
        )
    else:
        answer, sources = generate(q, sources, history)
    if not conversation:
        conversation = Conversation(user_id=user.id, title=q[:100])
        db.add(conversation)
        db.flush()
    conversation.updated = datetime.now(timezone.utc)
    db.add(Message(conversation_id=conversation.id, role="user", content=q, sources=[]))
    msg = Message(
        conversation_id=conversation.id, role="assistant", content=answer, sources=sources
    )
    db.add(msg)
    db.commit()
    return {"conversation_id": conversation.id, **message_json(msg)}
