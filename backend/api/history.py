"""历史记录 API。"""
from fastapi import APIRouter, Query
from backend.api.sessions import get_session_store

router = APIRouter(prefix="/api/history", tags=["历史"])


@router.get("")
def list_history(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100)):
    store = get_session_store()
    all_sessions = sorted(store.values(), key=lambda s: s.get("created_at", ""), reverse=True)
    start = (page - 1) * limit
    items = all_sessions[start:start + limit]
    return {"items": items, "total": len(all_sessions), "page": page, "limit": limit}


@router.get("/{session_id}")
def get_session_history(session_id: str):
    store = get_session_store()
    s = store.get(session_id)
    if not s:
        return {"session_id": session_id, "segments": [], "found": False}
    return {"session_id": session_id, "segments": s.get("segments", []), "found": True}
