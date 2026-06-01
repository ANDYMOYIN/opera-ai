"""
戏曲多模态知识图谱 — 总控脚本
按序执行：音频特征提取 → 视频骨架提取 → 知识图谱构建
"""

import os
import sys
import logging
from datetime import datetime

# 将项目根目录加入 sys.path
ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)

# 配置日志
LOG_PATH = os.path.join(ROOT, "output", "run.log")
os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.FileHandler(LOG_PATH, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)

logger = logging.getLogger(__name__)


def create_output_dirs():
    """确保所有输出目录存在。"""
    dirs = [
        os.path.join(ROOT, "output", "audio"),
        os.path.join(ROOT, "output", "pose"),
        os.path.join(ROOT, "output", "graph"),
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
    logger.info(f"输出目录已就绪: {len(dirs)} 个")


def run_audio():
    """音频特征提取。"""
    logger.info("=" * 50)
    logger.info("阶段 1/3: 音频特征提取 (librosa)")
    logger.info("=" * 50)
    try:
        from audio.extract_audio import run as audio_run
        audio_run()
    except Exception as e:
        logger.error(f"音频模块异常: {e}", exc_info=True)
        logger.warning("音频模块失败，继续下一阶段。")


def run_video():
    """视频骨架提取。"""
    logger.info("=" * 50)
    logger.info("阶段 2/3: 视频骨架提取 (MediaPipe)")
    logger.info("=" * 50)
    try:
        from video.extract_pose import run as video_run
        video_run()
    except Exception as e:
        logger.error(f"视频模块异常: {e}", exc_info=True)
        logger.warning("视频模块失败，继续下一阶段。")


def run_graph():
    """知识图谱构建。"""
    logger.info("=" * 50)
    logger.info("阶段 3/3: 知识图谱构建 (networkx / Neo4j)")
    logger.info("=" * 50)
    try:
        from graph.neo4j_import import run as graph_run
        graph_run(use_neo4j=False)
    except Exception as e:
        logger.error(f"图谱模块异常: {e}", exc_info=True)
        logger.warning("图谱模块失败。")


def main():
    logger.info("╔══════════════════════════════════════════╗")
    logger.info("║  戏曲多模态知识图谱 — 自动流水线       ║")
    logger.info("╚══════════════════════════════════════════╝")
    logger.info(f"启动时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"项目目录: {ROOT}")

    create_output_dirs()
    run_audio()
    run_video()
    run_graph()

    logger.info("=" * 50)
    logger.info("流水线执行完毕。")
    logger.info(f"输出文件位于: {os.path.join(ROOT, 'output')}")
    logger.info(f"运行日志: {LOG_PATH}")


if __name__ == "__main__":
    main()
