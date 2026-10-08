import base64
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from ..models import User
from .database import get_db

bearer = HTTPBearer()


def secret():
    value = os.getenv("JWT_SECRET", "")
    if len(value) < 32:
        raise RuntimeError("Set a random JWT_SECRET with at least 32 characters")
    return value


def hash_password(password: str):
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 600_000)
    return (
        "pbkdf2$600000$" + base64.b64encode(salt).decode() + "$" + base64.b64encode(digest).decode()
    )


def verify_password(password: str, encoded: str):
    try:
        kind, rounds, salt, digest = encoded.split("$")
        if kind != "pbkdf2":
            return False
        actual = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), base64.b64decode(salt), int(rounds)
        )
        return hmac.compare_digest(actual, base64.b64decode(digest))
    except (ValueError, TypeError):
        return False


def issue_token(user: User):
    return jwt.encode(
        {
            "sub": user.id,
            "exp": datetime.now(timezone.utc) + timedelta(hours=2),
            "iss": "campusmind",
        },
        secret(),
        algorithm="HS256",
    )


def current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)
):
    try:
        data = jwt.decode(
            credentials.credentials,
            secret(),
            algorithms=["HS256"],
            issuer="campusmind",
            options={"require": ["exp", "sub", "iss"]},
        )
        user = db.get(User, data["sub"])
        if user is None:
            raise ValueError()
        return user
    except (jwt.PyJWTError, ValueError):
        raise HTTPException(401, "Sessão inválida ou expirada")


def admin(user: User = Depends(current_user)):
    if user.role != "admin":
        raise HTTPException(403, "Acesso restrito ao administrador")
    return user
