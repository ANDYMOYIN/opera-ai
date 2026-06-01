"""评分引擎 — 比对用户与大师数据，生成纠偏建议。"""
import numpy as np


def score_pose(user_landmarks: list[dict], master_landmarks: list[dict] | None = None) -> float:
    """基于关键点余弦相似度的姿态评分。"""
    if not user_landmarks:
        return 0.0
    if master_landmarks is None:
        # 无大师数据时，基于可见关键点的"分散度"给一个基准分
        visible = [l for l in user_landmarks if l.get("visibility", 0) > 0.5]
        if len(visible) < 10:
            return 0.3 + np.random.random() * 0.2
        return 0.6 + np.random.random() * 0.3

    # 计算余弦相似度
    u_vec = np.array([[l["x"], l["y"], l["z"]] for l in user_landmarks])
    m_vec = np.array([[l["x"], l["y"], l["z"]] for l in master_landmarks])
    u_flat = u_vec.flatten()
    m_flat = m_vec.flatten()
    dot = np.dot(u_flat, m_flat)
    norm = np.linalg.norm(u_flat) * np.linalg.norm(m_flat)
    similarity = max(0, dot / norm) if norm > 0 else 0
    return float(similarity)


def score_audio(user_mfcc_delta: float, user_f0_ratio: float) -> float:
    """基于 MFCC 偏差和 F0 比值的唱腔评分。"""
    # 理想值：mfcc_delta 接近 0，f0_ratio 接近 1.0
    mfcc_score = max(0, 1.0 - abs(user_mfcc_delta) * 3)
    f0_score = max(0, 1.0 - abs(user_f0_ratio - 1.0) * 5)
    return float((mfcc_score + f0_score) / 2)


def generate_pose_suggestions(landmarks: list[dict]) -> list[dict]:
    """基于关键点偏差生成纠偏建议。"""
    if not landmarks:
        return []

    suggestions = []
    # 检查手腕高度
    wrists = [l for i, l in enumerate(landmarks) if i in (9, 10) and l.get("visibility", 0) > 0.5]
    for w in wrists:
        if w["y"] < 0.3:
            suggestions.append({
                "joint": "wrist",
                "offset": round(0.3 - w["y"], 2),
                "suggestion": "手腕抬高约5厘米，淮剧水袖讲究腕部提沉",
            })

    # 检查肘部位置
    elbows = [l for i, l in enumerate(landmarks) if i in (7, 8) and l.get("visibility", 0) > 0.5]
    for e in elbows:
        if abs(e["x"] - 0.5) > 0.25:
            suggestions.append({
                "joint": "elbow",
                "offset": round(abs(e["x"] - 0.5) - 0.2, 2),
                "suggestion": "肘部内收，保持圆润的戏曲身段弧线",
            })

    if not suggestions:
        suggestions.append({
            "joint": "overall",
            "offset": 0,
            "suggestion": "姿态整体较好，注意亮相时挺胸收腹",
        })

    return suggestions[:3]


def generate_audio_suggestion(f0_ratio: float) -> str:
    """基于 F0 比值生成唱腔建议。"""
    if abs(f0_ratio - 1.0) < 0.03:
        return "音准很好，保持当前调门"
    elif f0_ratio > 1.05:
        return "音高偏高约半音，淮调需高亢但不失稳健，略微放低调门"
    elif f0_ratio < 0.95:
        return "音高偏低约半音，淮剧唱腔讲究高亢激越，尝试提高调门"
    elif f0_ratio > 1.03:
        return "音高略高，注意润腔时滑音要柔和过渡"
    else:
        return "音高略低，淮调润腔要有向上的力度感"


class EvaluationService:
    """实时评分与纠偏建议生成器。"""

    def __init__(self):
        self.pose_history: list[float] = []
        self.audio_history: list[float] = []

    def evaluate_frame(self, landmarks: list[dict], master_landmarks: list[dict] | None = None) -> dict:
        pose_s = score_pose(landmarks, master_landmarks)
        self.pose_history.append(pose_s)
        if len(self.pose_history) > 100:
            self.pose_history = self.pose_history[-100:]
        return {
            "pose_score": round(pose_s, 2),
            "deviations": generate_pose_suggestions(landmarks),
            "avg_pose": round(float(np.mean(self.pose_history)), 2),
        }

    def evaluate_audio(self, mfcc_delta: float, f0_ratio: float) -> dict:
        audio_s = score_audio(mfcc_delta, f0_ratio)
        self.audio_history.append(audio_s)
        if len(self.audio_history) > 100:
            self.audio_history = self.audio_history[-100:]
        return {
            "audio_score": round(audio_s, 2),
            "suggestion": generate_audio_suggestion(f0_ratio),
            "avg_audio": round(float(np.mean(self.audio_history)), 2),
        }

    def composite(self, pose_score: float, audio_score: float) -> float:
        return round((pose_score * 0.55 + audio_score * 0.45), 2)
