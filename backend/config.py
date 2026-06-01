"""
戏曲多模态 AI 传习平台 — 后端配置

API 密钥通过 .env 文件配置（不提交到 Git）。
复制 .env.example 为 .env 后填入自己的密钥即可。
"""

import os
import sys


def _load_env():
    """加载 .env 文件（优先查找 exe 同目录，其次项目根目录）。"""
    candidates = []
    if getattr(sys, 'frozen', False):
        candidates.append(os.path.join(os.path.dirname(sys.executable), '.env'))
    else:
        candidates.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))
    candidates.append(os.path.join(os.path.expanduser('~'), '.opera-ai.env'))

    for env_path in candidates:
        if os.path.isfile(env_path):
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        # Only set if not already in environment
                        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
            break


_load_env()


# Neo4j
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "opera123")

# Server
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8090"))

# CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")

# Output
OUTPUT_DIR = os.getenv("OPERA_OUTPUT_DIR", os.path.join(
    os.path.expanduser("~"), ".claude", "common histories", "opera-ai"
))
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Master reference data paths
REFERENCE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "reference")
os.makedirs(REFERENCE_DIR, exist_ok=True)

# ── 百度智能云 · 人体动作分析 ──
# 申请地址：https://console.bce.baidu.com/ai/#/ai/body/overview/index
BAIDU_APP_ID = os.getenv("BAIDU_APP_ID", "")
BAIDU_API_KEY = os.getenv("BAIDU_API_KEY", "")
BAIDU_SECRET_KEY = os.getenv("BAIDU_SECRET_KEY", "")

# ── 讯飞开放平台 · 语音识别 ──
# 申请地址：https://console.xfyun.cn/services/iat
XUNFEI_APP_ID = os.getenv("XUNFEI_APP_ID", "")
XUNFEI_API_KEY = os.getenv("XUNFEI_API_KEY", "")
XUNFEI_API_SECRET = os.getenv("XUNFEI_API_SECRET", "")
