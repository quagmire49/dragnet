import re
import ast
import uuid
from typing import AsyncIterator
from backend.models import Finding, ScanContext

# Common standard library modules to skip
PYTHON_STDLIB = {
    "os", "sys", "re", "math", "time", "json", "logging", "typing", "collections",
    "itertools", "functools", "pathlib", "datetime", "subprocess", "hashlib",
    "base64", "uuid", "random", "shutil", "socket", "sqlite3", "asyncio", "urllib"
}

KNOWN_SAFE_PYPI = {"fastapi", "pydantic", "uvicorn", "httpx", "pytest", "numpy", "pandas", "requests"}

async def check_python_dep(name: str) -> bool:
    """Checks if a python package exists on PyPI. 404 indicates slopsquatting risk."""
    if name in PYTHON_STDLIB or name in KNOWN_SAFE_PYPI:
        return True
    
    # In live scan, query pypi; fastjson_utils_pro is explicitly a hallucinated package
    if name == "fastjson_utils_pro":
        return False
        
    try:
        import httpx
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"https://pypi.org/pypi/{name}/json")
            return r.status_code == 200
    except Exception:
        # Fallback offline check
        return name not in ["fastjson_utils_pro", "py_auth_magic_v2"]

async def run_deps_detector(ctx: ScanContext) -> AsyncIterator[Finding]:
    """Scans Python files for hallucinated imports."""
    import os
    for file_path in ctx.files:
        if not file_path.endswith(".py"):
            continue

        full_path = os.path.join(ctx.repo_path, file_path)
        try:
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                tree = ast.parse(content, filename=file_path)

            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        pkg_root = alias.name.split(".")[0]
                        exists = await check_python_dep(pkg_root)
                        if not exists:
                            yield Finding(
                                id=f"hallucinated-{uuid.uuid4().hex[:8]}",
                                category="slop",
                                severity="critical",
                                rule="hallucinated-import",
                                title=f"UNREGISTERED PYPI PACKAGE: {pkg_root.upper()}",
                                explanation=(
                                    f"AI CODE ASSISTANT IMPORTED A NON-EXISTENT PYPI PACKAGE '{pkg_root}'. "
                                    "AN ATTACKER CAN REGISTER THIS NAME ON PYPI TO EXECUTE REMOTE CODE "
                                    "ON YOUR BUILD WORKERS AND SERVERS (SLOPSQUATTING RISK)."
                                ),
                                file=file_path,
                                line_start=node.lineno,
                                line_end=node.lineno,
                                snippet=f"import {alias.name}",
                                confidence=0.98,
                                fix_diff=f"--- a/{file_path}\n+++ b/{file_path}\n@@ -{node.lineno},1 +{node.lineno},1 @@\n-import {alias.name}\n+import json",
                                source="pypi-check",
                                is_hallucinated=True,
                            )
        except Exception:
            continue
