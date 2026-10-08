from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core import get_db
from ..core.security import issue_token, verify_password
from ..models import User
from ..schemas import Login

router = APIRouter()


@router.post("/auth/login")
def login(body: Login, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.lower().strip()))
    # Dummy work keeps unknown-account and bad-password responses similarly expensive.
    encoded = (
        user.password
        if user
        else "pbkdf2$600000$MDAwMDAwMDAwMDAwMDAwMA==$MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA="
    )
    if not verify_password(body.password, encoded) or not user:
        raise HTTPException(401, "E-mail ou senha incorretos")
    return {"access_token": issue_token(user), "token_type": "bearer", "role": user.role}
