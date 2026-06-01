"""戏曲多模态 AI 传习平台 — FastAPI 主入口。"""
import sys
import os

# 路径处理
if getattr(sys, 'frozen', False):
    ROOT = sys._MEIPASS
else:
    ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

sys.path.insert(0, os.path.join(ROOT, "backend") if os.path.isdir(os.path.join(ROOT, "backend")) else ROOT)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# 配置
HOST = "127.0.0.1"
PORT = 8090
OUTPUT_DIR = os.path.join(os.path.expanduser("~"), ".opera-ai-output")
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(os.path.join(OUTPUT_DIR, "diagrams"), exist_ok=True)
os.makedirs(os.path.join(OUTPUT_DIR, "sessions"), exist_ok=True)

# 前端静态文件目录（构建产物）
FRONTEND_DIR = os.path.join(ROOT, "frontend", "dist")
if not os.path.isdir(FRONTEND_DIR):
    FRONTEND_DIR = os.path.join(ROOT, "dist")
if not os.path.isdir(FRONTEND_DIR):
    FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist")
FRONTEND_DIR = os.path.abspath(FRONTEND_DIR)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[启动] 戏曲多模态 AI 传习平台 v2.0")
    print(f"[启动] 前端目录: {FRONTEND_DIR}")
    print(f"[启动] 输出目录: {OUTPUT_DIR}")
    yield
    print("[关闭] 服务已停止")


app = FastAPI(
    title="戏曲多模态 AI 传习平台",
    description="淮剧 AI 教学系统",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 延迟导入 API 路由 ──
from backend.api.graph import router as graph_router
from backend.api.scripts import router as scripts_router
from backend.api.sessions import router as sessions_router
from backend.api.history import router as history_router
from backend.api.evaluation import router as evaluation_router
from backend.api.search import router as search_router
from backend.api.diagrams import router as diagrams_router
from backend.api.import_files import router as import_router
from backend.ws.recognition import router as ws_router

app.include_router(graph_router)
app.include_router(scripts_router)
app.include_router(sessions_router)
app.include_router(history_router)
app.include_router(evaluation_router)
app.include_router(search_router)
app.include_router(diagrams_router)
app.include_router(import_router)
app.include_router(ws_router)


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


# ── 托管前端静态文件 ──
if os.path.isdir(FRONTEND_DIR) and os.path.isfile(os.path.join(FRONTEND_DIR, "index.html")):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
    print(f"[启动] 前端已挂载: {FRONTEND_DIR}")
else:
    print("[启动] 前端目录缺失，仅提供 API 服务")


def main():
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT, log_level="info")


if __name__ == "__main__":
    main()
