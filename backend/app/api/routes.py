import logging
from io import BytesIO
from typing import List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse, Response

from app.services.analysis import analyze_xml
from app.services.pptx_parser import PptxConverter
from app.services.schemas import AnalysisItem

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/health")
def health():
    return {"status": "ok"}

@router.post("/analyze", response_model=List[AnalysisItem])
async def analyze(file: UploadFile = File(...), rules: Optional[str] = Form(None)):
    if not (file.filename or "").lower().endswith(".pptx"):
        raise HTTPException(400, "pptx ファイルをアップロードしてください。")
    try:
        xml_str = PptxConverter.convert_to_xml(file.file, pretty=False)
        items = analyze_xml(xml_str, rules)
        return JSONResponse(content=[i.model_dump() for i in items])
    except Exception as e:
        logger.exception("analyze failed")
        raise HTTPException(500, f"解析に失敗しました: {e}")

@router.post("/pptx/xml")
async def pptx_to_xml(file: UploadFile = File(...), pretty: Optional[bool] = Form(True)):
    if not (file.filename or "").lower().endswith(".pptx"):
        raise HTTPException(400, "pptx ファイルをアップロードしてください。")
    try:
        data = await file.read()
        bio = BytesIO(data)
        bio.seek(0)
        xml_str = PptxConverter.convert_to_xml(bio, pretty=bool(pretty))
        return Response(content=xml_str, media_type="application/xml")
    except Exception as e:
        raise HTTPException(500, f"XML 変換に失敗しました: {e}")
