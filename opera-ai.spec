# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller — 戏曲多模态 AI 传习平台 v2.0

关键：PyInstaller datas 格式是 (src_path, dst_directory)，
不是 (src_path, dst_path)。dst 是目标目录，文件名保持不变。
"""

import os, sys
from PyInstaller.utils.hooks import collect_all

ROOT = SPECPATH

datas = []
binaries = []

# ── 前端构建产物 ──
frontend_dist = os.path.join(ROOT, 'frontend', 'dist')
if os.path.isdir(frontend_dist):
    for root_dir, dirs, files in os.walk(frontend_dist):
        rel_dir = os.path.relpath(root_dir, ROOT).replace('\\', '/')
        for f in files:
            src = os.path.join(root_dir, f)
            datas.append((src, rel_dir))
    print(f"[spec] 前端: {len(datas)} files")

# ── graph schema ──
graph_dir = os.path.join(ROOT, 'graph')
if os.path.isdir(graph_dir):
    for f in os.listdir(graph_dir):
        if f.endswith('.cypher'):
            datas.append((os.path.join(graph_dir, f), 'graph'))

# ── backend Python 模块 ──
backend_datas, backend_bins, backend_hidden = collect_all('backend')
datas += backend_datas
binaries += backend_bins

hiddenimports = [
    'uvicorn', 'uvicorn.loops', 'uvicorn.loops.auto', 'uvicorn.protocols',
    'uvicorn.protocols.http', 'uvicorn.protocols.http.auto',
    'aip',
    'matplotlib', 'matplotlib.backends.backend_agg',
    'scipy', 'scipy.signal', 'scipy.signal._spectral',
    'librosa', 'cv2', 'mediapipe',
    'websockets', 'websockets.legacy',
    'fastapi', 'starlette',
    'networkx',
    'backend', 'backend.main', 'backend.config',
    'backend.api', 'backend.api.graph', 'backend.api.scripts',
    'backend.api.sessions', 'backend.api.history', 'backend.api.evaluation',
    'backend.api.search', 'backend.api.diagrams', 'backend.api.import_files',
    'backend.core', 'backend.core.database',
    'backend.models', 'backend.models.schemas',
    'backend.services', 'backend.services.pose_service',
    'backend.services.audio_service', 'backend.services.evaluation_service',
    'backend.services.graph_service',
    'backend.ws', 'backend.ws.manager', 'backend.ws.recognition',
]
hiddenimports += backend_hidden

a = Analysis(
    ['launcher.py'],
    pathex=[ROOT],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'jupyter', 'IPython', 'pandas', 'sqlalchemy',
              'alembic', 'pytest', 'setuptools'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=None,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='opera-ai',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=os.path.join(ROOT, 'huai.ico'),
)
