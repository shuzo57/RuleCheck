from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase): pass

class File(Base):
    __tablename__ = "files"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str | None] = mapped_column(String, nullable=True)
    filename: Mapped[str] = mapped_column(String, nullable=False)
    path: Mapped[str] = mapped_column(String, nullable=False)
    sha256: Mapped[str] = mapped_column(String, nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())

    analyses: Mapped[list["Analysis"]] = relationship(back_populates="file", cascade="all,delete")

class Analysis(Base):
    __tablename__ = "analyses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str | None] = mapped_column(String, nullable=True)
    file_id: Mapped[int] = mapped_column(ForeignKey("files.id"))
    status: Mapped[str] = mapped_column(String, default="succeeded")
    model: Mapped[str] = mapped_column(String, nullable=False)
    rules_version: Mapped[str] = mapped_column(String, nullable=True)
    result_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())

    file: Mapped[File] = relationship(back_populates="analyses")
