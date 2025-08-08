from typing import Iterable, Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Analysis, AnalysisItemRow, File
from app.services.schemas import AnalysisItem


# ---- files ----
def create_file(
    db: Session,
    *,
    filename: str,
    path: str,
    sha256: str,
    size_bytes: int,
    user_id: str | None = None,
) -> File:
    f = File(filename=filename, path=path, sha256=sha256, size_bytes=size_bytes, user_id=user_id)
    db.add(f)
    db.commit()
    db.refresh(f)
    return f


def get_file(db: Session, file_id: int) -> File | None:
    return db.get(File, file_id)


def delete_file(db: Session, file_id: int) -> None:
    f = db.get(File, file_id)
    if f:
        db.delete(f)
        db.commit()


# ---- analyses ----
def create_analysis(
    db: Session,
    *,
    file_id: int,
    model: str,
    rules_version: str | None = None,
    result_json: list[dict] | None = None,
    user_id: str | None = None,
) -> Analysis:
    a = Analysis(
        file_id=file_id,
        model=model,
        rules_version=rules_version,
        result_json=result_json,
        user_id=user_id,
        status="succeeded",
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


def bulk_create_analysis_items(db: Session, *, analysis_id: int, items: Iterable[AnalysisItem]) -> Sequence[AnalysisItemRow]:
    rows = [
        AnalysisItemRow(
            analysis_id=analysis_id,
            slide_number=i.slideNumber,
            category=i.category,
            basis=i.basis,
            issue=i.issue,
            suggestion=i.suggestion,
        )
        for i in items
    ]
    db.add_all(rows)
    db.commit()
    # 再取得してID付きで返す
    q = select(AnalysisItemRow).where(AnalysisItemRow.analysis_id == analysis_id).order_by(AnalysisItemRow.id.asc())
    return db.execute(q).scalars().all()


def list_analyses_by_file(db: Session, file_id: int) -> list[Analysis]:
    q = select(Analysis).where(Analysis.file_id == file_id).order_by(Analysis.created_at.desc())
    return list(db.execute(q).scalars().all())


def get_analysis_with_items(db: Session, analysis_id: int) -> tuple[Analysis | None, list[AnalysisItemRow]]:
    a = db.get(Analysis, analysis_id)
    if not a:
        return None, []
    q = select(AnalysisItemRow).where(AnalysisItemRow.analysis_id == analysis_id).order_by(AnalysisItemRow.id.asc())
    items = list(db.execute(q).scalars().all())
    return a, items