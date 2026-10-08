from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core import get_db
from ..core.security import current_user
from ..models import Conversation, Message, User
from ..schemas import Feedback
from ..services.records import message_json, own_conversation

router = APIRouter()


@router.get("/conversations")
def conversations(user: User = Depends(current_user), db: Session = Depends(get_db)):
    result = []
    for c in db.scalars(
        select(Conversation)
        .where(Conversation.user_id == user.id)
        .order_by(Conversation.updated.desc())
    ).all():
        messages = db.scalars(
            select(Message).where(Message.conversation_id == c.id).order_by(Message.created)
        ).all()
        result.append(
            {
                "id": c.id,
                "title": c.title,
                "updated": c.updated.isoformat(),
                "messages": [message_json(m) for m in messages],
            }
        )
    return result


@router.get("/conversations/{id}")
def conversation_detail(id: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    c = own_conversation(db, id, user)
    return {
        "id": c.id,
        "title": c.title,
        "updated": c.updated.isoformat(),
        "messages": [
            message_json(m)
            for m in db.scalars(
                select(Message).where(Message.conversation_id == id).order_by(Message.created)
            )
        ],
    }


@router.delete("/conversations/{id}", status_code=204)
def delete_conversation(id: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    c = own_conversation(db, id, user)
    db.delete(c)
    db.commit()
    return Response(status_code=204)


@router.post("/messages/{id}/feedback")
def feedback(
    id: str, body: Feedback, user: User = Depends(current_user), db: Session = Depends(get_db)
):
    m = db.get(Message, id)
    if not m or m.role != "assistant":
        raise HTTPException(404, "Resposta não encontrada")
    own_conversation(db, m.conversation_id, user)
    if body.value not in (-1, 1):
        raise HTTPException(422, "Use 1 ou -1")
    m.feedback = body.value
    db.commit()
    return {"value": body.value}
