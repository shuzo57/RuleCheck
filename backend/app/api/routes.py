from app.services.analysis import analyze
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class AnalyzeRequest(BaseModel):
    slide_text: str
    rules_text: str
    yakukihou_summary: str

@router.post("/analyze")
async def analyze_route(data: AnalyzeRequest):
    return await analyze(data.slide_text, data.rules_text, data.yakukihou_summary)
