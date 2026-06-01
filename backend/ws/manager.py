"""WebSocket 连接管理。"""
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active: dict[str, set[WebSocket]] = {}

    async def connect(self, room: str, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(room, set()).add(ws)

    def disconnect(self, room: str, ws: WebSocket):
        if room in self.active:
            self.active[room].discard(ws)
            if not self.active[room]:
                del self.active[room]

    async def send_json(self, ws: WebSocket, data: dict):
        try:
            await ws.send_json(data)
        except Exception:
            pass

    async def broadcast(self, room: str, data: dict, exclude: WebSocket | None = None):
        for ws in self.active.get(room, set()):
            if ws != exclude:
                await self.send_json(ws, data)

manager = ConnectionManager()
