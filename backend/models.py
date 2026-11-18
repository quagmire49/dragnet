from typing import Literal, Optional, List, Dict
from pydantic import BaseModel, Field

Category = Literal["security", "slop", "gap", "loose_end"]
Severity = Literal["critical", "high", "medium", "low", "info"]

class Finding(BaseModel):
    id: str
    category: Category
    severity: Severity
    rule: str
    title: str
    explanation: str
    file: str
    line_start: int
    line_end: int
    snippet: str
    confidence: float = Field(ge=0.0, le=1.0)
    fix_diff: Optional[str] = None
    source: Literal["semgrep", "gitleaks", "tree-sitter", "llm", "osv", "pypi-check"]
    is_hallucinated: bool = False

class ScanContext(BaseModel):
    job_id: str
    repo_path: str
    repo_url: Optional[str] = None
    files: List[str] = []
    languages: Dict[str, int] = {}
    total_loc: int = 0
