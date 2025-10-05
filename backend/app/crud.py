"""Database operations for messages."""
from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Message

JST = ZoneInfo("Asia/Tokyo")


def create_message(db: Session, *, text: str) -> Message:
    message = Message(created_at=datetime.now(tz=JST), text=text)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def list_messages(db: Session) -> list[Message]:
    query = select(Message).order_by(Message.created_at.asc(), Message.id.asc())
    return list(db.execute(query).scalars().all())


def delete_message(db: Session, message_id: int) -> bool:
    message = db.get(Message, message_id)
    if not message:
        return False
    db.delete(message)
    db.commit()
    return True
