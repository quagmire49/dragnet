import uuid
import asyncio
from fastapi import FastAPI, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.models import ScanContext
from backend.bus import bus
from backend.pipeline import execute_scan_pipeline

app = FastAPI(title="Dragnet Audit API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScanRequest(BaseModel):
    repo_url: str = "https://github.com/dragnet-audit/demo-vulnerable-repo"

@app.post("/scan")
async def trigger_scan(req: ScanRequest, background_tasks: BackgroundTasks):
    job_id = f"job-{uuid.uuid4().hex[:8]}"
    ctx = ScanContext(
        job_id=job_id,
        repo_path="demo-repos",
        repo_url=req.repo_url,
    )
    background_tasks.add_task(execute_scan_pipeline, ctx)
    return {"job_id": job_id, "status": "started"}

@app.get("/scan/{job_id}/stream")
async def stream_scan(job_id: str):
    async def event_generator():
        queue = bus.subscribe(job_id)
        try:
            while True:
                ev = await queue.get()
                ev_type = ev.get("type", "message")
                import json
                yield f"event: {ev_type}\ndata: {json.dumps(ev.get('data', {}))}\n\n"
                if ev_type == "done":
                    break
        finally:
            bus.unsubscribe(job_id, queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
