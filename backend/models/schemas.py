"""Pydantic 数据模型。"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


# ── 知识图谱 ──

class GraphNode(BaseModel):
    id: str
    name: str
    category: str
    properties: dict[str, Any] = {}


class GraphEdge(BaseModel):
    source: str
    target: str
    label: str


class GraphData(BaseModel):
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []


# ── 剧本 ──

class ScriptTier(BaseModel):
    id: str
    name: str
    children: list[ScriptTier] = []


class ScriptDetail(BaseModel):
    id: str
    name: str
    category: str = ""
    era: str = ""
    difficulty: str = ""
    description: str = ""
    characters: list[str] = []
    vocal_styles: list[str] = []
    movements: list[str] = []
    instruments: list[str] = []


class ScriptReference(BaseModel):
    script_id: str
    role: str = ""
    pose_keypoints_url: str = ""
    audio_features_url: str = ""
    duration_seconds: float = 0


# ── 会话 ──

class SessionCreate(BaseModel):
    script_id: str
    mode: str = "both"


class SessionUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class SessionInfo(BaseModel):
    session_id: str
    script_id: str
    created_at: str
    duration_seconds: float = 0
    avg_pose_score: float = 0
    avg_audio_score: float = 0
    composite_score: float = 0
    status: str = "idle"


# ── 评估 ──

class EvaluationReport(BaseModel):
    session_id: str
    overall_score: float = 0
    pose_score: float = 0
    audio_score: float = 0
    strengths: list[str] = []
    weaknesses: list[str] = []
    suggestions: list[str] = []


class ProgressData(BaseModel):
    sessions: list[dict[str, Any]] = []
    progress_curve: list[float] = []
    trend: str = "stable"


# ── 图表 ──

class DiagramRequest(BaseModel):
    type: str  # heatmap | spectrogram | architecture | radar
    session_id: str = ""
    params: dict[str, Any] = {}


class DiagramResult(BaseModel):
    diagram_id: str
    svg_data: str = ""
    description: str = ""


# ── 搜索 ──

class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    type: str = "web"


# ── WebSocket 消息 ──

class WSControlMessage(BaseModel):
    type: str  # start | pause | resume | stop
    session_id: str = ""
    script_id: str = ""


class WSPoseResult(BaseModel):
    type: str = "pose_result"
    timestamp: float = 0
    landmarks: list[dict[str, float]] = []
    score: float = 0
    deviations: list[dict[str, Any]] = []


class WSAudioResult(BaseModel):
    type: str = "audio_result"
    timestamp: float = 0
    mfcc_delta: float = 0
    f0_ratio: float = 1.0
    score: float = 0
    suggestion: str = ""


class WSEvaluationTick(BaseModel):
    type: str = "evaluation_tick"
    timestamp: float = 0
    composite_score: float = 0
    pose_score: float = 0
    audio_score: float = 0
