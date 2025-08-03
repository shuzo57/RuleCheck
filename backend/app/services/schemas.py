from typing import Literal

from pydantic import BaseModel


class AnalysisItem(BaseModel):
    slideNumber: int
    category: Literal["誤植", "表現", "出典"]
    basis: str
    issue: str
    suggestion: str

initial_analysis_schema = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "slideNumber": {"type": "integer"},
            "category": {"type": "string"},
            "basis": {"type": "string"},
            "issue": {"type": "string"},
            "suggestion": {"type": "string"},
        },
        "required": ["slideNumber", "category", "basis", "issue", "suggestion"],
    },
}

legal_basis_schema = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "originalIssue": {"type": "string"},
            "legalBasis": {"type": "string"},
        },
        "required": ["originalIssue", "legalBasis"],
    },
}
