"""评估报告 API。"""
from fastapi import APIRouter
from backend.api.sessions import get_session_store
from backend.models.schemas import EvaluationReport, ProgressData

router = APIRouter(prefix="/api/evaluation", tags=["评估"])


@router.get("/{session_id}/report", response_model=EvaluationReport)
def get_session_report(session_id: str):
    store = get_session_store()
    s = store.get(session_id)
    if not s:
        return EvaluationReport(session_id=session_id)

    segments = s.get("segments", [])
    pose_scores = [seg.get("pose_score", 0) for seg in segments if seg.get("pose_score", 0) > 0]
    audio_scores = [seg.get("audio_score", 0) for seg in segments if seg.get("audio_score", 0) > 0]

    avg_pose = sum(pose_scores) / len(pose_scores) if pose_scores else 0
    avg_audio = sum(audio_scores) / len(audio_scores) if audio_scores else 0
    overall = s.get("composite_score", 0)

    strengths, weaknesses = _analyze(avg_pose, avg_audio)
    suggestions = _generate_suggestions(strengths, weaknesses, s.get("script_id", ""))

    return EvaluationReport(
        session_id=session_id,
        overall_score=round(overall, 2),
        pose_score=round(avg_pose, 2),
        audio_score=round(avg_audio, 2),
        strengths=strengths,
        weaknesses=weaknesses,
        suggestions=suggestions,
    )


@router.get("/progress", response_model=ProgressData)
def get_progress():
    store = get_session_store()
    sessions = sorted(store.values(), key=lambda s: s.get("created_at", ""))
    curve = [s.get("composite_score", 0) for s in sessions]
    if len(curve) >= 2 and curve[-1] > curve[0]:
        trend = "improving"
    elif len(curve) >= 2 and curve[-1] < curve[0]:
        trend = "declining"
    else:
        trend = "stable"
    return ProgressData(
        sessions=[{k: v for k, v in s.items() if k != "segments"} for s in sessions],
        progress_curve=curve,
        trend=trend,
    )


def _analyze(pose: float, audio: float) -> tuple[list[str], list[str]]:
    strengths, weaknesses = [], []
    if pose >= 0.7:
        strengths.append("身段姿态较为标准")
    else:
        weaknesses.append("身段姿态有待改善")
    if audio >= 0.7:
        strengths.append("唱腔音准较好")
    else:
        weaknesses.append("唱腔音准需要加强")
    if not strengths:
        strengths.append("有进步空间，继续加油")
    return strengths, weaknesses


def _generate_suggestions(strengths: list[str], weaknesses: list[str], script_id: str) -> list[str]:
    suggestions = []
    for w in weaknesses:
        if "姿态" in w:
            suggestions.append("建议对着镜子练习水袖和亮相动作，注意关节角度")
        if "音准" in w:
            suggestions.append("建议跟随淮调原声带反复跟唱，注意润腔和滑音的处理")
    if not suggestions:
        suggestions.append("表现不错！可以尝试更高难度的唱段。")
    return suggestions
