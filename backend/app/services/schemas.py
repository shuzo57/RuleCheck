from typing import Literal, Optional

from pydantic import BaseModel, Field

# correctionType は「必須」または「任意」で管理
CorrectionType = Literal["必須", "任意"]


class AnalysisItem(BaseModel):
    slideNumber: int = Field(..., ge=1)
    # 既存のカテゴリ定義は環境依存で文字化けしやすいため、型は str にすると緩やかだが
    # 互換性のため Literal を維持（元の値はそのまま）。
    category: Literal["誤植", "表現", "出典"]
    basis: str
    issue: str
    suggestion: str
    correctionType: Optional[CorrectionType] = None


class AnalysisItemCreate(BaseModel):
    slideNumber: int = Field(..., ge=1)
    category: Literal["誤植", "表現", "出典"]
    basis: str
    issue: str
    suggestion: str
    correctionType: Optional[CorrectionType] = "任意"


class AnalysisItemUpdate(BaseModel):
    slideNumber: Optional[int] = Field(None, ge=1)
    category: Optional[Literal["誤植", "表現", "出典"]] = None
    basis: Optional[str] = None
    issue: Optional[str] = None
    suggestion: Optional[str] = None
    correctionType: Optional[CorrectionType] = None

