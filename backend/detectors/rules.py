import re
import uuid
import os
from typing import AsyncIterator
from backend.models import Finding, ScanContext

SQLI_PATTERN = re.compile(r"cursor\.execute\s*\(\s*f[\"'].*?\{.*?\}[\"']\s*\)")

async def run_rules_detector(ctx: ScanContext) -> AsyncIterator[Finding]:
    for file_path in ctx.files:
        if not (file_path.endswith(".py") or file_path.endswith(".ts") or file_path.endswith(".js")):
            continue

        full_path = os.path.join(ctx.repo_path, file_path)
        try:
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            for match in SQLI_PATTERN.finditer(content):
                start_char = match.start()
                line_no = content.count("\n", 0, start_char) + 1
                matched_text = match.group(0)

                yield Finding(
                    id=f"sqli-{uuid.uuid4().hex[:8]}",
                    category="security",
                    severity="high",
                    rule="sql-injection",
                    title="DIRECT SQL STRING CONCATENATION IN QUERY",
                    explanation=(
                        "UNSANITIZED USER INPUT INTERPOLATED DIRECTLY INTO SQL STATEMENT. "
                        "ENABLES AUTHENTICATION BYPASS AND DATABASE EXFILTRATION."
                    ),
                    file=file_path,
                    line_start=line_no,
                    line_end=line_no,
                    snippet=matched_text,
                    confidence=0.95,
                    fix_diff=f"--- a/{file_path}\n+++ b/{file_path}\n@@ -{line_no},1 +{line_no},1 @@\n-{matched_text}\n+cursor.execute(query, params)",
                    source="semgrep",
                )
        except Exception:
            continue
