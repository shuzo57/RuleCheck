import hashlib
import json
import logging
import os
from io import BytesIO
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session

from app.core.settings import settings
from app.crud import (bulk_create_analysis_items, create_analysis, create_file,
                      delete_file, get_analysis_with_items, get_file,
                      list_analyses_by_file)
from app.db import get_db
from app.services.analysis import analyze_xml
from app.services.pptx_parser import PptxConverter
from app.services.schemas import AnalysisItem

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


def _sha256(b: bytes) -> str:
    h = hashlib.sha256(); h.update(b); return h.hexdigest()


# ============ ファイル ============

@router.post("/files")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not (file.filename or "").lower().endswith(".pptx"):
        raise HTTPException(400, "pptx ファイルをアップロードしてください。")

    data = await file.read()
    digest = _sha256(data)
    rel_path = f"{digest[:2]}/{digest}.pptx"
    abs_path = os.path.join(settings.STORAGE_DIR, rel_path)
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    with open(abs_path, "wb") as f:
        f.write(data)

    rec = create_file(db, filename=file.filename, path=rel_path, sha256=digest, size_bytes=len(data))
    return {"file_id": rec.id, "filename": rec.filename, "sha256": rec.sha256}


@router.delete("/files/{file_id}")
def remove_file(file_id: int, db: Session = Depends(get_db)):
    f = get_file(db, file_id)
    if not f:
        raise HTTPException(404, "not found")
    try:
        os.remove(os.path.join(settings.STORAGE_DIR, f.path))
    except FileNotFoundError:
        pass
    delete_file(db, file_id)
    return {"ok": True}


# ============ XML 変換（アップロード直変換） ============

@router.post("/pptx/xml")
async def pptx_to_xml(file: UploadFile = File(...), pretty: Optional[bool] = Form(True)):
    if not (file.filename or "").lower().endswith(".pptx"):
        raise HTTPException(400, "pptx ファイルをアップロードしてください。")
    data = await file.read()
    bio = BytesIO(data); bio.seek(0)
    xml_str = PptxConverter.convert_to_xml(bio, pretty=bool(pretty))
    return Response(content=xml_str, media_type="application/xml")


# ============ 解析 ============

@router.post("/analyze", response_model=List[AnalysisItem])
async def analyze(
    file_id: int = Form(...),
    rules: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    f = get_file(db, file_id)
    if not f:
        raise HTTPException(404, "file not found")

    abs_path = os.path.join(settings.STORAGE_DIR, f.path)
    xml_str = PptxConverter.convert_to_xml(abs_path, pretty=False)

    try:
        items = analyze_xml(xml_str, rules)  # List[AnalysisItem]
        payload = [i.model_dump() for i in items]

        analysis = create_analysis(
            db,
            file_id=file_id,
            model="gemini-2.5-flash",
            rules_version=None,
            result_json=payload,
        )
        bulk_create_analysis_items(db, analysis_id=analysis.id, items=items)

        return JSONResponse(content=payload, headers={"X-Analysis-Id": str(analysis.id)})
    except Exception as e:
        logger.exception("analyze failed")
        raise HTTPException(500, f"解析に失敗しました: {e}")


# ============ 解析結果の取得 ============

@router.get("/files/{file_id}/analyses")
def list_analyses(file_id: int, db: Session = Depends(get_db)):
    lst = list_analyses_by_file(db, file_id)
    return [
        {
            "id": a.id,
            "created_at": str(a.created_at),
            "model": a.model,
            "status": a.status,
            "items_count": len(a.items),
        }
        for a in lst
    ]


@router.get("/analyses/{analysis_id}")
def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    a, rows = get_analysis_with_items(db, analysis_id)
    if not a:
        raise HTTPException(404, "analysis not found")

    return {
        "id": a.id,
        "file_id": a.file_id,
        "created_at": str(a.created_at),
        "model": a.model,
        "status": a.status,
        "rules_version": a.rules_version,
        "result_json": a.result_json,
        "items": [
            {
                "id": r.id,
                "slideNumber": r.slide_number,
                "category": r.category,
                "basis": r.basis,
                "issue": r.issue,
                "suggestion": r.suggestion,
            }
            for r in rows
        ],
    }
