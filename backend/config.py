"""
戏曲多模态 AI 传习平台 — 后端配置
"""

import os

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
BAIDU_APP_ID = os.getenv("BAIDU_APP_ID", "123533267")
BAIDU_API_KEY = os.getenv("BAIDU_API_KEY", "Vyclhx2SB9h0cWZ2vM4uaGUV")
BAIDU_SECRET_KEY = os.getenv("BAIDU_SECRET_KEY", "EZXYqSnJI76zU8soBLYgxUtONw8i96hg")

# ── 讯飞开放平台 · 语音识别 ──
XUNFEI_APP_ID = os.getenv("XUNFEI_APP_ID", "107a1e29")
XUNFEI_API_KEY = os.getenv("XUNFEI_API_KEY", "bf755b11b2cc21d107fc3b3ed5f84954")
XUNFEI_API_SECRET = os.getenv("XUNFEI_API_SECRET", "MTk3NmYwODdiY2E2YmM4ZDAyOGYwZDll")
