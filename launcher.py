"""戏曲多模态 AI 传习平台 — 启动入口。"""
import sys
import os
import socket
import signal
import time
import webbrowser
import threading
import subprocess

# PyInstaller 打包后路径
if getattr(sys, 'frozen', False):
    BASE = sys._MEIPASS
    sys.path.insert(0, BASE)
else:
    BASE = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, BASE)

HOST = "127.0.0.1"
DEFAULT_PORT = 8000
URL = ""


def _port_free(port: int) -> bool:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.5)
    try:
        s.bind((HOST, port))
        s.close()
        return True
    except OSError:
        return False


def _kill_old_instances():
    """杀掉所有旧 opera-ai 进程，释放端口。"""
    killed = 0
    try:
        result = subprocess.run(
            ['netstat', '-ano'], capture_output=True, text=True, timeout=5
        )
        for line in result.stdout.splitlines():
            if f'{HOST}:{DEFAULT_PORT}' in line and 'LISTENING' in line:
                parts = line.strip().split()
                pid = int(parts[-1])
                try:
                    os.kill(pid, signal.SIGTERM)
                    killed += 1
                except Exception:
                    pass
    except Exception:
        pass
    return killed


def main():
    global URL

    # 1. 清理旧进程
    killed = _kill_old_instances()
    if killed:
        time.sleep(1)

    # 2. 找可用端口
    port = DEFAULT_PORT
    if not _port_free(port):
        for p in range(8001, 8006):
            if _port_free(p):
                port = p
                break

    URL = f"http://{HOST}:{port}"
    print(f"[启动] 戏曲多模态 AI 传习平台")
    print(f"[启动] 地址: {URL}")
    if port != DEFAULT_PORT:
        print(f"[启动] 注意: 默认端口 8000 被占用，使用端口 {port}")

    # 3. 延迟打开浏览器
    def open_browser():
        time.sleep(2.0)
        webbrowser.open(URL)

    threading.Thread(target=open_browser, daemon=True).start()

    # 4. 启动后端
    from backend.main import app
    from backend.main import FRONTEND_DIR, OUTPUT_DIR
    import uvicorn

    uvicorn.run(app, host=HOST, port=port, log_level="info")


if __name__ == "__main__":
    main()
