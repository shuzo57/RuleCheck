from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.crud import create_message, delete_message, list_messages
from app.db import get_db
from app.models import Message

router = APIRouter()


class MessageResponse(BaseModel):
    id: int
    created_at: str = Field(..., description="ISO 8601 timestamp in JST")
    text: str

    @classmethod
    def from_orm(cls, message: Message) -> "MessageResponse":
        return cls(id=message.id, created_at=message.created_at.isoformat(), text=message.text)


class MessageCreateRequest(BaseModel):
    text: str = Field(..., min_length=1, description="メッセージ本文")


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/messages", response_model=List[MessageResponse])
def get_messages(db: Session = Depends(get_db)) -> List[MessageResponse]:
    messages = list_messages(db)
    return [MessageResponse.from_orm(message) for message in messages]


@router.post("/messages", response_model=MessageResponse)
def post_message(payload: MessageCreateRequest, db: Session = Depends(get_db)) -> MessageResponse:
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="テキストを入力してください")
    message = create_message(db, text=text)
    return MessageResponse.from_orm(message)


@router.delete("/messages/{message_id}", status_code=204)
def remove_message(message_id: int, db: Session = Depends(get_db)) -> None:
    deleted = delete_message(db, message_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Message not found")
