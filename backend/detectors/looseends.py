import re
import uuid
import os
from typing import AsyncIterator
from backend.models import Finding, ScanContext

EMPTY_EXCEPT = re.compile(r"except\s+.*:\s*\n\s*pass")
TODO_PATTERN = re.compile(r"(#|//)\s*(TODO|FIXME):\s*(.*)")

async def run_looseends_detector(ctx: ScanContext) -> AsyncIterator[Finding]:
    for file_path in ctx.files:
        full_path = os.path.join(ctx.repo_path, file_path)
        try:
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            # Empty except check
            for match in EMPTY_EXCEPT.finditer(content):
                line_no = content.count("\n", 0, match.start()) + 1
                yield Finding(
                    id=f"gap-{uuid.uuid4().hex[:8]}",
                    category="gap",
                    severity="medium",
                    rule="empty-except",
                    title="SILENT EXCEPTION SUPPRESSION (EXCEPT: PASS)",
                    explanation="EMPTY EXCEPT BLOCK SILENTLY SUPPRESSES ALL RUNTIME ERRORS WITHOUT LOGGING.",
                    file=file_path,
                    line_start=line_no,
                    line_end=line_no + 1,
                    snippet=match.group(0),
                    confidence=0.92,
                    fix_diff=f"--- a/{file_path}\n+++ b/{file_path}\n@@ -{line_no},2 +{line_no},3 @@\n-except Exception:\n-    pass\n+except Exception as err:\n+    logger.error('Unhandled fault: %s', err)",
                    source="tree-sitter",
                )

            # TODO stubs
            for match in TODO_PATTERN.finditer(content):
                line_no = content.count("\n", 0, match.start()) + 1
                todo_msg = match.group(3).strip()
                yield Finding(
                    id=f"loose-{uuid.uuid4().hex[:8]}",
                    category="loose_end",
                    severity="low",
                    rule="todo-stub",
                    title=f"UNRESOLVED TODO: {todo_msg[:30].upper()}",
                    explanation="INCOMPLETE IMPLEMENTATION MARKER FOUND IN ACTIVE CODEBASE PATH.",
                    file=file_path,
                    line_start=line_no,
                    line_end=line_no,
                    snippet=match.group(0),
                    confidence=0.99,
                    fix_diff=None,
                    source="tree-sitter",
                )
        except Exception:
            continue
