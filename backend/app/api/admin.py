from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..core import get_db
from ..core.security import admin
from ..models import Chunk, Conversation, Document, Message, User

router = APIRouter()


@router.get("/admin/stats")
def stats(user: User = Depends(admin), db: Session = Depends(get_db)):
    return {
        "documents": db.scalar(select(func.count()).select_from(Document)),
        "chunks": db.scalar(select(func.count()).select_from(Chunk)),
        "conversations": db.scalar(select(func.count()).select_from(Conversation)),
        "negative_feedback": db.scalar(
            select(func.count()).select_from(Message).where(Message.feedback == -1)
        ),
    }
