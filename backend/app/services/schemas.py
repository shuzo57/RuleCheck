from typing import Literal, Optional

from pydantic import BaseModel, Field

# correctionType は「必須」または「任意」を受け付ける
CorrectionType = Literal["必須", "任意"]


class AnalysisItem(BaseModel):
    slideNumber: int = Field(..., ge=1)
    # カテゴリは自由入力を許可
    category: str
    basis: str
    issue: str
    suggestion: str
    correctionType: Optional[CorrectionType] = None


class AnalysisItemCreate(BaseModel):
    slideNumber: int = Field(..., ge=1)
    category: str
    basis: str
    issue: str
    suggestion: str
    correctionType: Optional[CorrectionType] = "任意"


class AnalysisItemUpdate(BaseModel):
    slideNumber: Optional[int] = Field(None, ge=1)
    category: Optional[str] = None
    basis: Optional[str] = None
    issue: Optional[str] = None
    suggestion: Optional[str] = None
    correctionType: Optional[CorrectionType] = None

