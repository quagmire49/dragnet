import asyncio
import os
from typing import List
from backend.models import ScanContext, Finding
from backend.bus import bus
from backend.detectors.deps import run_deps_detector
from backend.detectors.secrets import run_secrets_detector
from backend.detectors.rules import run_rules_detector
from backend.detectors.looseends import run_looseends_detector
from backend.scoring import compute_health_score

async def execute_scan_pipeline(ctx: ScanContext):
    job_id = ctx.job_id
    await bus.emit(job_id, "stage", {"stage": "ingest", "status": "OK", "message": "INGESTING REPOSITORY CONTEXT"})

    # Inventory
    all_files = []
    for root, dirs, files in os.walk(ctx.repo_path):
        dirs[:] = [d for d in dirs if d not in [".git", "node_modules", "dist", ".next", "__pycache__"]]
        for f in files:
            rel = os.path.relpath(os.path.join(root, f), ctx.repo_path).replace("\\", "/")
            all_files.append(rel)

    ctx.files = all_files
    await bus.emit(job_id, "stage", {"stage": "inventory", "status": "OK", "message": f"INVENTORY: {len(all_files)} FILES CATALOGUED"})

    # Run detectors in parallel
    all_findings: List[Finding] = []

    async def collect_detector(detector_gen, name: str):
        async for finding in detector_gen:
            all_findings.append(finding)
            await bus.emit(job_id, "finding", finding.model_dump())

    await bus.emit(job_id, "stage", {"stage": "detect_secrets", "status": "RUNNING", "message": "RUNNING DETECTORS IN PARALLEL"})

    await asyncio.gather(
        collect_detector(run_secrets_detector(ctx), "secrets"),
        collect_detector(run_rules_detector(ctx), "rules"),
        collect_detector(run_deps_detector(ctx), "deps"),
        collect_detector(run_looseends_detector(ctx), "looseends"),
    )

    # Scoring
    score = compute_health_score(all_findings)
    await bus.emit(job_id, "done", {"healthScore": score, "totalFindings": len(all_findings)})
