from typing import Literal, Optional

from pydantic import BaseModel, Field


class AnalysisItem(BaseModel):
    slideNumber: int = Field(..., ge=1)
    category: Literal["誤植", "表現", "出典"]
    basis: str
    issue: str
    suggestion: str


class AnalysisItemCreate(BaseModel):
    slideNumber: int = Field(..., ge=1)
    category: Literal["誤植", "表現", "出典"]
    basis: str
    issue: str
    suggestion: str


class AnalysisItemUpdate(BaseModel):
    slideNumber: Optional[int] = Field(None, ge=1)
    category: Optional[Literal["誤植", "表現", "出典"]] = None
    basis: Optional[str] = None
    issue: Optional[str] = None
    suggestion: Optional[str] = None
