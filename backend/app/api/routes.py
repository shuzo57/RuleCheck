import hashlib
import logging
import os
from io import BytesIO
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session

from app.core.settings import settings
from app.crud import (create_analysis, create_file, delete_file, get_file,
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
    if not f: raise HTTPException(404, "not found")
    try:
        os.remove(os.path.join(settings.STORAGE_DIR, f.path))
    except FileNotFoundError:
        pass
    delete_file(db, file_id)
    return {"ok": True}

@router.get("/files/{file_id}/analyses")
def list_analyses(file_id: int, db: Session = Depends(get_db)):
    return [ {"id": a.id, "created_at": str(a.created_at), "model": a.model, "status": a.status} for a in list_analyses_by_file(db, file_id) ]

@router.post("/analyze", response_model=List[AnalysisItem])
async def analyze(
    file_id: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    rules: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    if not file_id and not file:
        raise HTTPException(400, "file または file_id を指定してください。")

    if file_id:
        rec = get_file(db, file_id)
        if not rec: raise HTTPException(404, "file not found")
        abs_path = os.path.join(settings.STORAGE_DIR, rec.path)
        xml_str = PptxConverter.convert_to_xml(abs_path, pretty=False)
    else:
        if not (file.filename or "").lower().endswith(".pptx"):
            raise HTTPException(400, "pptx ファイルをアップロードしてください。")
        data = await file.read()
        bio = BytesIO(data); bio.seek(0)
        xml_str = PptxConverter.convert_to_xml(bio, pretty=False)

    try:
        items = analyze_xml(xml_str, rules)
        payload = [i.model_dump() for i in items]
        model_name = "gemini-2.5-flash"
        if file_id:
            rec = create_analysis(db, file_id=file_id, model=model_name, result_json=payload)
            return JSONResponse(content=payload, headers={"X-Analysis-Id": str(rec.id)})
        return JSONResponse(content=payload)
    except Exception as e:
        logger.exception("analyze failed")
        raise HTTPException(500, f"解析に失敗しました: {e}")

@router.post("/pptx/xml")
async def pptx_to_xml(file: UploadFile = File(...), pretty: Optional[bool] = Form(True)):
    if not (file.filename or "").lower().endswith(".pptx"):
        raise HTTPException(400, "pptx ファイルをアップロードしてください。")
    data = await file.read()
    bio = BytesIO(data); bio.seek(0)
    xml_str = PptxConverter.convert_to_xml(bio, pretty=bool(pretty))
    return Response(content=xml_str, media_type="application/xml")
