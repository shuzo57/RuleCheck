from pathlib import Path

from app.core.settings import settings
from app.models import Base
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session, sessionmaker

engine = create_engine(
    settings.DB_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

def init_db():
    Path(settings.STORAGE_DIR).mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    # 既存DBへの軽量マイグレーション（SQLite想定）: analysis_items.correction_type を追加
    try:
        inspector = inspect(engine)
        tables = set(inspector.get_table_names())
        if "analysis_items" in tables:
            cols = {c["name"] for c in inspector.get_columns("analysis_items")}
            if "correction_type" not in cols:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE analysis_items ADD COLUMN correction_type VARCHAR"))
    except Exception:
        # 失敗してもアプリ起動は継続（初期環境や権限の問題を考慮）
        pass

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
