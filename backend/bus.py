import asyncio
from typing import Dict, List, Any

class EventBus:
    def __init__(self):
        self._subscribers: Dict[str, List[asyncio.Queue]] = {}

    def subscribe(self, job_id: str) -> asyncio.Queue:
        queue = asyncio.Queue()
        if job_id not in self._subscribers:
            self._subscribers[job_id] = []
        self._subscribers[job_id].append(queue)
        return queue

    def unsubscribe(self, job_id: str, queue: asyncio.Queue):
        if job_id in self._subscribers:
            if queue in self._subscribers[job_id]:
                self._subscribers[job_id].remove(queue)
            if not self._subscribers[job_id]:
                del self._subscribers[job_id]

    async def emit(self, job_id: str, event_type: str, data: Any):
        if job_id in self._subscribers:
            for q in list(self._subscribers[job_id]):
                await q.put({"type": event_type, "data": data})

bus = EventBus()
