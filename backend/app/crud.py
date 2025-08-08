from sqlalchemy.orm import Session

from app.models import Analysis, File


def create_file(db: Session, *, filename: str, path: str, sha256: str, size_bytes: int, user_id: str | None = None) -> File:
    f = File(filename=filename, path=path, sha256=sha256, size_bytes=size_bytes, user_id=user_id)
    db.add(f); db.commit(); db.refresh(f)
    return f

def get_file(db: Session, file_id: int) -> File | None:
    return db.get(File, file_id)

def delete_file(db: Session, file_id: int) -> None:
    f = db.get(File, file_id)
    if f: db.delete(f); db.commit()

def create_analysis(db: Session, *, file_id: int, model: str, result_json: list[dict], rules_version: str | None = None, user_id: str | None = None) -> Analysis:
    a = Analysis(file_id=file_id, model=model, result_json=result_json, rules_version=rules_version, user_id=user_id, status="succeeded")
    db.add(a); db.commit(); db.refresh(a)
    return a

def get_analysis(db: Session, analysis_id: int) -> Analysis | None:
    return db.get(Analysis, analysis_id)

def list_analyses_by_file(db: Session, file_id: int) -> list[Analysis]:
    return db.query(Analysis).filter(Analysis.file_id == file_id).order_by(Analysis.created_at.desc()).all()
