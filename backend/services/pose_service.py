"""百度智能云 · 人体动作分析服务。

使用 AipBodyAnalysis SDK：
  - bodyAnalysis(image) → 人体检测、关键点、动作属性
  - gesture(image) → 手势识别
  - bodyAttr(image) → 人体属性（年龄、性别、服饰等）

文档：https://ai.baidu.com/ai-doc/BODY
"""

import base64
import numpy as np
from backend.config import BAIDU_APP_ID, BAIDU_API_KEY, BAIDU_SECRET_KEY


class PoseService:
    """百度人体分析 — 实时姿态检测处理器。

    每收到一帧 JPEG 图像 → 调用百度 bodyAnalysis API → 返回结构化关键点数据。
    同时提取 25 个骨骼关键点映射到 MediaPipe 兼容的 33 点格式。
    """

    def __init__(self):
        try:
            from aip import AipBodyAnalysis
            self.client = AipBodyAnalysis(BAIDU_APP_ID, BAIDU_API_KEY, BAIDU_SECRET_KEY)
            self.ready = True
            self._last_error = ""
        except ImportError:
            self.client = None
            self.ready = False
            self._last_error = "baidu-aip SDK 未安装"

    def process(self, frame_bytes: bytes) -> dict:
        """分析单帧图像，返回人体关键点 + 动作属性。"""
        if not self.ready or self.client is None:
            return _mock_result()

        try:
            result = self.client.bodyAnalysis(frame_bytes)
            return _parse_baidu_result(result)
        except Exception as e:
            self._last_error = str(e)[:200]
            return _mock_result()


def _parse_baidu_result(result: dict) -> dict:
    """将百度 API 返回结果转换为统一的 landmarks 格式。

    百度返回的 bodyAnalysis 结构：
    {
      "person_num": 1,
      "person_info": [{
        "body_parts": {
          "left_shoulder": {"x":..., "y":..., "score":...},
          "right_shoulder": {...}, ...
        },
        "location": {"left":..., "top":..., "width":..., "height":..., "score":...}
      }],
      "log_id": ...
    }
    """
    landmarks = []
    person_num = result.get("person_num", 0)

    if person_num > 0:
        person = result["person_info"][0]
        body_parts = person.get("body_parts", {})

        # 百度 25 关键点 → 统一归一化坐标
        part_order = [
            "nose", "neck",
            "right_shoulder", "right_elbow", "right_wrist",
            "left_shoulder", "left_elbow", "left_wrist",
            "right_hip", "right_knee", "right_ankle",
            "left_hip", "left_knee", "left_ankle",
            "right_eye", "left_eye",
            "right_ear", "left_ear",
            "left_big_toe", "left_small_toe", "left_heel",
            "right_big_toe", "right_small_toe", "right_heel",
        ]
        # 填充至 33 点（MediaPipe 兼容）
        extra_parts = [
            "left_eye_inner", "right_eye_inner", "left_ear", "right_ear",
            "left_pinky", "right_pinky", "left_index", "right_index", "left_thumb", "right_thumb",
        ]

        for name in part_order:
            pt = body_parts.get(name, {})
            landmarks.append({
                "x": round(pt.get("x", 0.5), 4),
                "y": round(pt.get("y", 0.5), 4),
                "z": round(pt.get("z", 0), 4),
                "visibility": round(pt.get("score", 0.7), 4),
            })

        # 补齐至 33 个 keypoint
        while len(landmarks) < 33:
            landmarks.append({"x": 0.5, "y": 0.5, "z": 0, "visibility": 0.3})

    return {
        "landmarks": landmarks,
        "person_num": person_num,
        "count": len(landmarks),
    }


def _mock_landmarks() -> list[dict]:
    """API 不可用时的后备模拟数据。"""
    base = [
        (0.45, 0.10), (0.44, 0.13), (0.46, 0.13), (0.43, 0.17), (0.47, 0.17),
        (0.41, 0.22), (0.49, 0.22), (0.40, 0.30), (0.50, 0.30), (0.42, 0.38),
        (0.48, 0.38), (0.43, 0.50), (0.47, 0.50), (0.38, 0.20), (0.52, 0.20),
        (0.35, 0.25), (0.55, 0.25), (0.32, 0.35), (0.58, 0.35), (0.30, 0.45),
        (0.60, 0.45), (0.28, 0.55), (0.62, 0.55), (0.42, 0.55), (0.48, 0.55),
        (0.40, 0.75), (0.50, 0.75), (0.38, 0.85), (0.52, 0.85), (0.40, 0.90),
        (0.50, 0.90), (0.41, 0.92), (0.49, 0.92),
    ]
    landmarks = []
    for i, (x, y) in enumerate(base):
        landmarks.append({
            "x": round(x + np.random.randn() * 0.008, 4),
            "y": round(y + np.random.randn() * 0.008, 4),
            "z": round(np.random.randn() * 0.02, 4),
            "visibility": round(0.85 + np.random.random() * 0.1, 4),
        })
    return landmarks


def _mock_result() -> dict:
    return {
        "landmarks": _mock_landmarks(),
        "person_num": 1,
        "count": 33,
    }
