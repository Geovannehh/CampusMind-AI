from pydantic import BaseModel, Field


class Login(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=256)


class Question(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    conversation_id: str | None = None
    mode: str = Field(default="chat", pattern="^(chat|search)$")


class Feedback(BaseModel):
    value: int = Field(ge=-1, le=1)
