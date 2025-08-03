from pydantic import BaseModel, Field, Literal


class AnalysisItem(BaseModel):
    slideNumber: int = Field(..., ge=1)
    category: Literal["誤植", "表現", "出典"]
    basis: str
    issue: str
    suggestion: str


class LegalBasisItem(BaseModel):
    originalIssue: str
    legalBasis: str


initial_analysis_schema = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "slideNumber": {"type": "integer", "minimum": 1},
            "category": {"type": "string", "enum": ["誤植", "表現", "出典"]},
            "basis": {"type": "string"},
            "issue": {"type": "string"},
            "suggestion": {"type": "string"},
        },
        "required": [
            "slideNumber",
            "category",
            "basis",
            "issue",
            "suggestion",
        ],
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
