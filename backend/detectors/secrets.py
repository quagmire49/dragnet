import re
import uuid
import os
from typing import AsyncIterator
from backend.models import Finding, ScanContext

PATTERNS = [
    (
        r"(AKIA[0-9A-Z]{16})",
        "hardcoded-secret",
        "critical",
        "AWS ACCESS KEY ID DETECTED",
        "HARDCODED AWS CREDENTIAL LEAKS ACCESS TO PRODUCTION INFRASTRUCTURE AND S3 STORAGE.",
    ),
    (
        r"(wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY|[A-Za-z0-9/+=]{40})",
        "hardcoded-secret",
        "critical",
        "AWS SECRET ACCESS KEY DETECTED",
        "COMMITTING AWS SECRET ACCESS KEYS ENABLES COMPLETE PRIVILEGE ESCALATION.",
    ),
]

async def run_secrets_detector(ctx: ScanContext) -> AsyncIterator[Finding]:
    for file_path in ctx.files:
        full_path = os.path.join(ctx.repo_path, file_path)
        try:
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()

            for line_no, line in enumerate(lines, start=1):
                for pattern, rule, severity, title, explanation in PATTERNS:
                    match = re.search(pattern, line)
                    if match:
                        yield Finding(
                            id=f"secret-{uuid.uuid4().hex[:8]}",
                            category="security",
                            severity=severity,
                            rule=rule,
                            title=title,
                            explanation=explanation,
                            file=file_path,
                            line_start=line_no,
                            line_end=line_no,
                            snippet=line.strip(),
                            confidence=0.99,
                            fix_diff=f"--- a/{file_path}\n+++ b/{file_path}\n@@ -{line_no},1 +{line_no},1 @@\n-{line.strip()}\n+os.getenv('AWS_SECRET_ACCESS_KEY')",
                            source="gitleaks",
                        )
                        break
        except Exception:
            continue
