"""讯飞开放平台 · 实时语音识别服务。

使用讯飞 WebSocket 流式语音转写 API (iFlytek IAT v2)。
支持：中文识别大模型、方言识别、多语种识别。

文档：https://www.xfyun.cn/doc/asr/voicedictation/API.html

流程：
  1. 建立 WebSocket 连接（携带鉴权参数）
  2. 发送音频帧（16kHz, 16bit, 单声道 PCM）
  3. 接收实时识别结果
"""

import json
import time
import base64
import hashlib
import hmac
import asyncio
import numpy as np
from datetime import datetime
from urllib.parse import urlencode

from backend.config import XUNFEI_APP_ID, XUNFEI_API_KEY, XUNFEI_API_SECRET

# 讯飞 IAT 实时语音转写 WebSocket 地址
IAT_HOST_URL = "https://iat-api.xfyun.cn/v2/iat"
IAT_WS_URL = "wss://iat-api.xfyun.cn/v2/iat"


def _build_auth_url() -> str:
    """构建带 HMAC-SHA256 签名的讯飞 WebSocket URL。"""
    host = "iat-api.xfyun.cn"
    path = "/v2/iat"
    now = datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S GMT")

    # 签名原料
    signature_origin = f"host: {host}\ndate: {now}\nGET {path} HTTP/1.1"
    signature_sha = hmac.new(
        XUNFEI_API_SECRET.encode("utf-8"),
        signature_origin.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).digest()
    signature = base64.b64encode(signature_sha).decode()

    # 授权参数
    authorization_origin = (
        f'api_key="{XUNFEI_API_KEY}", '
        f'algorithm="hmac-sha256", '
        f'headers="host date request-line", '
        f'signature="{signature}"'
    )
    authorization = base64.b64encode(authorization_origin.encode("utf-8")).decode()

    params = {
        "authorization": authorization,
        "date": now,
        "host": host,
    }
    return f"{IAT_WS_URL}?{urlencode(params)}"


class AudioService:
    """讯飞实时语音识别处理器。

    使用讯飞 IAT WebSocket 流式接口：
      - 支持中文识别大模型
      - 自动 VAD（语音端点检测）
      - 实时返回识别文本
    """

    def __init__(self):
        self.sample_rate = 16000
        self.chunk_size = 4096
        self.buffer: list[bytes] = []
        self.ready = False
        self._last_error = ""
        self._ws = None
        self._recv_task = None

        # 验证配置
        if XUNFEI_APP_ID and XUNFEI_API_KEY and XUNFEI_API_SECRET:
            self.ready = True
        else:
            self._last_error = "讯飞 API 凭据未配置"

    async def connect(self):
        """建立到讯飞 IAT 服务的 WebSocket 连接。"""
        import websockets

        url = _build_auth_url()
        try:
            self._ws = await websockets.connect(url, ping_interval=30)
            self.ready = True
            self._last_error = ""
        except Exception as e:
            self._last_error = f"讯飞连接失败: {e}"
            self.ready = False

    async def send_start_frame(self):
        """发送第一帧 — 告诉讯飞音频参数。"""
        if not self._ws:
            return
        params = {
            "common": {"app_id": XUNFEI_APP_ID},
            "business": {
                "language": "zh_cn",
                "domain": "iat",
                "accent": "mandarin",
                "dwa": "wpgs",         # 动态修正
                "pd": "game",          # 领域：游戏/娱乐
                "rlang": "zh-cn",      # 结果语言
                "vad_eos": 3000,       # 尾部静音时长（ms）
                "nbest": 1,
            },
            "data": {
                "status": 0,            # 0=第一帧, 1=中间帧, 2=最后一帧
                "format": "audio/L16;rate=16000",
                "encoding": "raw",
                "audio": "",
            },
        }
        await self._ws.send(json.dumps(params))

    async def send_audio_chunk(self, pcm_data: bytes):
        """发送一个音频块。"""
        if not self._ws or not self.ready:
            return
        payload = {
            "data": {
                "status": 1,
                "format": "audio/L16;rate=16000",
                "encoding": "raw",
                "audio": base64.b64encode(pcm_data).decode(),
            },
        }
        try:
            await self._ws.send(json.dumps(payload))
        except Exception:
            self.ready = False

    async def send_end_frame(self):
        """发送结束帧。"""
        if not self._ws:
            return
        payload = {
            "data": {
                "status": 2,
                "format": "audio/L16;rate=16000",
                "encoding": "raw",
                "audio": "",
            },
        }
        try:
            await self._ws.send(json.dumps(payload))
        except Exception:
            pass

    async def receive_results(self) -> list[dict]:
        """接收识别结果。"""
        results = []
        if not self._ws:
            return results

        try:
            while True:
                msg = await asyncio.wait_for(self._ws.recv(), timeout=1.0)
                data = json.loads(msg)
                code = data.get("code", 0)
                if code != 0:
                    self._last_error = f"讯飞错误[{code}]: {data.get('message', '')}"
                    break

                # 解析识别结果
                if "data" in data:
                    result_data = data["data"]
                    if result_data.get("status") == 2:
                        # 最终结果
                        text = _extract_text(result_data)
                        if text:
                            results.append({"text": text, "is_final": True})
                        break
                    else:
                        text = _extract_text(result_data)
                        if text:
                            results.append({"text": text, "is_final": False})
        except asyncio.TimeoutError:
            pass
        except Exception as e:
            self._last_error = str(e)[:200]

        return results

    async def disconnect(self):
        """关闭 WebSocket 连接。"""
        if self._ws:
            try:
                await self._ws.close()
            except Exception:
                pass
            self._ws = None

    def process(self, pcm_data: np.ndarray) -> dict:
        """同步接口 — 返回模拟分析结果（实时流式识别由 WebSocket handler 直接调用）。"""
        if pcm_data is None or len(pcm_data) == 0:
            return {"mfcc_delta": 0, "f0_ratio": 1.0, "voiced": False}

        return {
            "mfcc_delta": round(np.random.random() * 0.15, 4),
            "f0_ratio": round(0.95 + np.random.random() * 0.08, 4),
            "voiced": True,
            "rms": round(float(np.sqrt(np.mean(np.square(pcm_data[:100])))) if len(pcm_data) > 0 else 0.01, 6),
        }


def _extract_text(data: dict) -> str:
    """从讯飞返回数据中提取识别文本。"""
    try:
        if "result" in data:
            ws = data["result"].get("ws", [])
            words = []
            for w in ws:
                cw = w.get("cw", [])
                for c in cw:
                    words.append(c.get("w", ""))
            return "".join(words)
    except (KeyError, TypeError):
        pass
    return ""


async def recognize_pcm(pcm_data: bytes, duration_ms: int = 2000) -> list[str]:
    """独立函数 — 对一段 PCM 音频执行完整识别流程，返回识别的文本列表。"""
    service = AudioService()
    await service.connect()
    await service.send_start_frame()

    # 按块发送音频
    chunk_size = 4096
    for i in range(0, len(pcm_data), chunk_size):
        chunk = pcm_data[i:i + chunk_size]
        await service.send_audio_chunk(chunk)
        await asyncio.sleep(0.01)

    await service.send_end_frame()
    results = await service.receive_results()
    await service.disconnect()

    return [r["text"] for r in results if r.get("text")]
