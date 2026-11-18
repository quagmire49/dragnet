from typing import List
from backend.models import Finding

def compute_health_score(findings: List[Finding]) -> int:
    score = 100
    for f in findings:
        if f.severity == "critical":
            score -= 22
        elif f.severity == "high":
            score -= 12
        elif f.severity == "medium":
            score -= 5
        elif f.severity == "low":
            score -= 2
    return max(0, min(100, score))
