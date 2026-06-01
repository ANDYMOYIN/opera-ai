"""会话管理 API。"""
import uuid
import time
from fastapi import APIRouter
from backend.models.schemas import SessionCreate, SessionUpdate, SessionInfo

router = APIRouter(prefix="/api/sessions", tags=["会话"])

# 内存存储（后续可迁移到 Neo4j）
_sessions: dict[str, dict] = {}


@router.post("", response_model=SessionInfo)
def create_session(data: SessionCreate):
    sid = str(uuid.uuid4())[:8]
    session = {
        "session_id": sid,
        "script_id": data.script_id,
        "mode": data.mode,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "duration_seconds": 0,
        "avg_pose_score": 0,
        "avg_audio_score": 0,
        "composite_score": 0,
        "status": "idle",
        "segments": [],
    }
    _sessions[sid] = session
    return SessionInfo(**session)


@router.get("/{session_id}", response_model=SessionInfo)
def get_session(session_id: str):
    s = _sessions.get(session_id)
    if not s:
        return SessionInfo(session_id=session_id, script_id="", created_at="", status="not_found")
    return SessionInfo(**s)


@router.patch("/{session_id}", response_model=SessionInfo)
def update_session(session_id: str, data: SessionUpdate):
    s = _sessions.get(session_id)
    if not s:
        return SessionInfo(session_id=session_id, script_id="", created_at="", status="not_found")
    if data.status:
        s["status"] = data.status
    if data.notes:
        s["notes"] = data.notes
    return SessionInfo(**s)


def get_session_store():
    return _sessions


def add_segment(session_id: str, segment: dict):
    s = _sessions.get(session_id)
    if s:
        s["segments"].append(segment)
        scores = [seg["composite_score"] for seg in s["segments"] if seg.get("composite_score", 0) > 0]
        if scores:
            s["composite_score"] = sum(scores) / len(scores)
