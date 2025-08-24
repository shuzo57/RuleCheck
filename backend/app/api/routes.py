# routes.py
import hashlib
import logging
import os
from io import BytesIO
from typing import List, Optional

from app.core.settings import settings
from app.crud import (bulk_create_analysis_items, create_analysis, create_file,
                      delete_file, get_analysis_with_items, get_file,
                      get_latest_analysis, list_analyses_by_file, list_files)
from app.db import get_db
from app.models import Analysis, AnalysisItemRow
from app.services.analysis import analyze_xml
from app.services.pptx_parser import PptxConverter
from app.services.schemas import (AnalysisItem, AnalysisItemCreate,
                                  AnalysisItemUpdate)
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)
router = APIRouter()

FAKE_USER_ID = "localuser"


@router.get("/health")
def health():
    return {"status": "ok"}


def _sha256(b: bytes) -> str:
    h = hashlib.sha256()
    h.update(b)
    return h.hexdigest()


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

    rec = create_file(
        db,
        user_id=FAKE_USER_ID,
        filename=file.filename,
        path=rel_path,
        sha256=digest,
        size_bytes=len(data),
    )
    return {
        "file_id": rec.id,
        "filename": rec.filename,
        "size_bytes": rec.size_bytes,
        "sha256": rec.sha256
    }


@router.get("/files")
def get_files(db: Session = Depends(get_db)):
    files = list_files(db, user_id=FAKE_USER_ID)
    result = []
    for f in files:
        # そのファイルの最新解析があるかを見る（簡易実装：存在すれば success、なければ pending）
        analyses = list_analyses_by_file(db, file_id=f.id, user_id=FAKE_USER_ID)
        status = "success" if len(analyses) > 0 else "pending"
        result.append({
            "id": str(f.id),
            "file": None,
            "name": f.filename,
            "size": f.size_bytes,
            "uploadDate": f.created_at.isoformat(),
            "status": status,
            "analysisResult": [],   # 一覧では返さない（詳細APIで取得）
            "error": None,
            "isBasisAugmented": False,
            "augmentationStatus": "idle",
        })
    return result



@router.delete("/files/{file_id}")
def remove_file(file_id: int, db: Session = Depends(get_db)):
    f = get_file(db, file_id)
    if not f or f.user_id != FAKE_USER_ID:
        raise HTTPException(404, "not found")
    try:
        os.remove(os.path.join(settings.STORAGE_DIR, f.path))
    except FileNotFoundError:
        pass
    delete_file(db, file_id)
    return {"ok": True}


@router.post("/pptx/xml")
async def pptx_to_xml(file: UploadFile = File(...), pretty: Optional[bool] = Form(True)):
    if not (file.filename or "").lower().endswith(".pptx"):
        raise HTTPException(400, "pptx ファイルをアップロードしてください。")
    data = await file.read()
    bio = BytesIO(data)
    bio.seek(0)
    xml_str = PptxConverter.convert_to_xml(bio, pretty=bool(pretty))
    return Response(content=xml_str, media_type="application/xml")


# @router.post("/analyze", response_model=List[AnalysisItem])
# async def analyze(
#     file_id: int = Form(...),
#     rules: Optional[str] = Form(None),
#     db: Session = Depends(get_db),
# ):
#     f = get_file(db, file_id)
#     if not f or f.user_id != FAKE_USER_ID:
#         raise HTTPException(404, "file not found")

#     abs_path = os.path.join(settings.STORAGE_DIR, f.path)
#     xml_str = PptxConverter.convert_to_xml(abs_path, pretty=False)

#     try:
#         items = analyze_xml(xml_str, rules)
#         # correctionType が無い場合は既定で「任意」に揃える
#         for i in items:
#             if getattr(i, "correctionType", None) is None:
#                 setattr(i, "correctionType", "任意")
#         payload = [i.model_dump() for i in items]

#         analysis = create_analysis(
#             db,
#             user_id=FAKE_USER_ID,
#             file_id=file_id,
#             model="gemini-2.5-flash",
#             rules_version=None,
#             result_json=payload,
#         )
#         bulk_create_analysis_items(db, analysis_id=analysis.id, items=items)

#         return JSONResponse(content=payload, headers={"X-Analysis-Id": str(analysis.id)})
#     except Exception as e:
#         logger.exception("analyze failed")
#         raise HTTPException(500, f"解析に失敗しました: {e}")

@router.post("/analyze", response_model=List[AnalysisItem])
async def analyze(
    file_id: int = Form(...),
    rules: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    f = get_file(db, file_id)
    if not f or f.user_id != FAKE_USER_ID:
        raise HTTPException(404, "file not found")

    abs_path = os.path.join(settings.STORAGE_DIR, f.path)
    xml_str = PptxConverter.convert_to_xml(abs_path, pretty=False)

    try:
        items = [
            AnalysisItem(
                slideNumber=1,
                category="誤植",
                basis="1",
                issue="「こんな事をる患者さんがよくいます」という表現は、助詞の使い方に誤りがあるように見受けられます。読者に違和感を与える可能性がございます。",
                suggestion="「こんなことを言う患者さんがよくいます」など、自然な表現へご修正いただけますと幸いです。",
                correctionType="必須"
            ),
            AnalysisItem(
                slideNumber=1,
                category="表現",
                basis="2",
                issue="「オングリザという糖尿病治療剤がありますよ」という表現について、製品名の直接的な記載は薬機法上、広告と見なされる可能性がございます。",
                suggestion="「サキサグリプチン（DPP-4阻害薬）」など一般名でのご記載を推奨いたします。対象読者が医療関係者であることも明示いただけますと安心です。",
                correctionType="必須"
            ),
            AnalysisItem(
                slideNumber=1,
                category="出典",
                basis="3",
                issue="本スライドには出典情報や作成者名の記載が確認できませんでした。",
                suggestion="承認時評価資料、添付文書、学術論文などの出典を明記いただき、加えて作成者名や所属もご記載いただけますと、資料の信頼性が一層高まるかと存じます。",
                correctionType="推奨"
            ),
            AnalysisItem(
                slideNumber=2,
                category="誤植",
                basis="1",
                issue="「C18He25N3O2・H2O」との表記について、元素記号に誤りがあるようでございます。",
                suggestion="正しくは「C18H25N3O2・H2O」かと存じます。ご確認のうえ、ご修正をお願いいたします。",
                correctionType="必須"
            ),
            AnalysisItem(
                slideNumber=2,
                category="表現",
                basis="2",
                issue="「軽度の肥満であっても 糖尿病が絶対に発症してしまう」という表現は、過度に不安を与える可能性がございます。",
                suggestion="「軽度の肥満でも発症リスクが高まる可能性がある」などの表現に見直し、あわせて根拠となる文献をご提示いただけますと説得力が増すかと存じます。",
                correctionType="必須"
            ),
            AnalysisItem(
                slideNumber=2,
                category="表現",
                basis="2",
                issue="「血糖値が効果的にコントロールされる」という表現は、効果を断定的に印象付ける恐れがございます。",
                suggestion="「血糖コントロールの改善が期待される」や「食事・運動療法と併用することで効果が見込まれる」といった、慎重な表現への修正をお勧めいたします。",
                correctionType="推奨"
            ),
            AnalysisItem(
                slideNumber=2,
                category="出典",
                basis="3",
                issue="本スライドにも、出典や作成者の記載が見受けられませんでした。",
                suggestion="添付文書やPMDA資料、査読付き論文など、信頼性の高い出典を明記いただくことで、資料の正確性がより一層高まるものと存じます。",
                correctionType="推奨"
            )
        ]


        payload = [i.model_dump() for i in items]

        analysis = create_analysis(
            db,
            user_id=FAKE_USER_ID,
            file_id=file_id,
            model="mock",              # ← gemini ではなく "mock" として保存
            rules_version=None,
            result_json=payload,
        )
        bulk_create_analysis_items(db, analysis_id=analysis.id, items=items)

        return JSONResponse(content=payload, headers={"X-Analysis-Id": str(analysis.id)})
    except Exception as e:
        logger.exception("analyze failed")
        raise HTTPException(500, f"解析に失敗しました: {e}")

@router.get("/files/{file_id}/analyses")
def list_analyses(file_id: int, db: Session = Depends(get_db)):
    f = get_file(db, file_id)
    if not f or f.user_id != FAKE_USER_ID:
        raise HTTPException(404, "not found")
    lst = list_analyses_by_file(db, file_id=file_id, user_id=FAKE_USER_ID)
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
    if not a or a.user_id != FAKE_USER_ID:
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
                "correctionType": r.correction_type,
            }
            for r in rows
        ],
    }


@router.post("/files/{file_id}/analyses/latest/items")
def add_item_to_latest_analysis(
    file_id: int,
    item: AnalysisItemCreate,
    db: Session = Depends(get_db),
):
    f = get_file(db, file_id)
    if not f or f.user_id != FAKE_USER_ID:
        raise HTTPException(404, "file not found")

    analyses = list_analyses_by_file(db, file_id=file_id, user_id=FAKE_USER_ID)
    if analyses:
        a = analyses[0]
    else:
        a = create_analysis(
            db,
            user_id=FAKE_USER_ID,
            file_id=file_id,
            model="manual-edit",
            rules_version=None,
            result_json=[],
        )

    row = AnalysisItemRow(
        analysis_id=a.id,
        slide_number=item.slideNumber,
        category=item.category,
        basis=item.basis,
        issue=item.issue,
        suggestion=item.suggestion,
        correction_type=item.correctionType or "任意",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "id": row.id,
        "slideNumber": row.slide_number,
        "category": row.category,
        "basis": row.basis,
        "issue": row.issue,
        "suggestion": row.suggestion,
        "correctionType": row.correction_type,
    }


@router.patch("/analysis-items/{item_id}")
def update_analysis_item(
    item_id: int,
    patch: AnalysisItemUpdate,
    db: Session = Depends(get_db),
):
    row = db.get(AnalysisItemRow, item_id)
    if not row:
        raise HTTPException(404, "item not found")
    # Permission: ensure owner matches
    if not row.analysis or row.analysis.user_id != FAKE_USER_ID:
        raise HTTPException(403, "forbidden")

    if patch.slideNumber is not None:
        row.slide_number = patch.slideNumber
    if patch.category is not None:
        row.category = patch.category
    if patch.basis is not None:
        row.basis = patch.basis
    if patch.issue is not None:
        row.issue = patch.issue
    if patch.suggestion is not None:
        row.suggestion = patch.suggestion
    if patch.correctionType is not None:
        row.correction_type = patch.correctionType

    db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "id": row.id,
        "slideNumber": row.slide_number,
        "category": row.category,
        "basis": row.basis,
        "issue": row.issue,
        "suggestion": row.suggestion,
        "correctionType": row.correction_type,
    }


@router.delete("/analysis-items/{item_id}")
def delete_analysis_item(item_id: int, db: Session = Depends(get_db)):
    row = db.get(AnalysisItemRow, item_id)
    if not row:
        raise HTTPException(404, "item not found")
    if not row.analysis or row.analysis.user_id != FAKE_USER_ID:
        raise HTTPException(403, "forbidden")
    db.delete(row)
    db.commit()
    return {"ok": True}


@router.get("/files/{file_id}/analyses/latest")
def get_latest_analysis_for_file(file_id: int, db: Session = Depends(get_db)):
    latest, items = get_latest_analysis(db, file_id=file_id, user_id=FAKE_USER_ID)
    if not latest:
        raise HTTPException(404, "no analysis found")

    return {
        "id": latest.id,
        "created_at": str(latest.created_at),
        "model": latest.model,
        "status": latest.status,
        "items": [
            {
                "id": r.id,
                "slideNumber": r.slide_number,
                "category": r.category,
                "basis": r.basis,
                "issue": r.issue,
                "suggestion": r.suggestion,
                "correctionType": r.correction_type,
            }
            for r in items
        ],
    }
