from typing import Literal

from pydantic import BaseModel, Field


class AnalysisItem(BaseModel):
    slideNumber: int = Field(..., ge=1)
    category: Literal["誤植", "表現", "出典"]
    basis: str
    issue: str
    suggestion: str