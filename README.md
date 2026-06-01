# 戏曲多模态 AI 传习平台 v2.0

淮剧智能化教学系统 — 基于 React + Three.js 3D 前端、FastAPI 后端、MediaPipe 姿态识别、librosa 声腔分析、Neo4j 知识图谱。

## 核心功能

| 功能 | 说明 |
|------|------|
| 🎭 传习工坊 | 摄像头实时姿态捕捉 + 声腔分析 + 大师对比 + 五级递进评分 |
| 🔮 知识图谱 | 3D 力导向球面分布，26 节点 33 关系，点击展开山水画卷详情 |
| 📜 剧本工坊 | 剧种→剧目→场次三级菜单，场次唱词全文 + 参考资源链接 |
| 🔬 识别分析 | 上传音频/视频/图像自动分析，生成 ZIP 报告 |
| 📊 学艺记录 | 历史训练会话时间线 + 评分回顾 |
| 📐 分析图表 | 系统架构图、姿态热力图、声腔频谱、能力雷达图 |

## 技术栈

| 层 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Three.js (R3F) + Vite + Framer Motion |
| 后端 | FastAPI + WebSocket + Uvicorn |
| 音频 | librosa (MFCC/F0/频谱质心/色度/能量包络/唱句切分) |
| 视频 | MediaPipe Pose (33 骨骼关键点 + 关节角度序列) |
| 图像 | OpenCV (Canny 边缘/轮廓/HSV 直方图) |
| 图数据库 | Neo4j + networkx 回退 |
| 打包 | PyInstaller |

## 快速启动

```bash
# 1. 安装依赖
cd opera-ai
pip install -r requirements.txt
cd frontend && npm install && cd ..

# 2. 启动后端（端口 8090）
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8090

# 3. 启动前端（另开终端）
cd frontend && npm run dev

# 4. 浏览器访问 http://localhost:5173
```

## 项目结构

```
opera-ai/
├── backend/
│   ├── api/           # RESTful API 路由
│   │   ├── diagrams.py      # 图表生成
│   │   ├── evaluation.py    # 评估报告
│   │   ├── graph.py         # 知识图谱
│   │   ├── history.py       # 历史记录
│   │   ├── import_files.py  # 文件导入分析
│   │   ├── scripts.py       # 剧本数据
│   │   ├── search.py        # 搜索
│   │   └── sessions.py      # 会话管理
│   ├── core/          # 数据库连接 (Neo4j)
│   ├── models/        # Pydantic schemas
│   ├── services/      # 音频/视频/图谱/评估服务
│   ├── ws/            # WebSocket 实时识别
│   ├── config.py      # 配置
│   └── main.py        # 入口
├── frontend/
│   └── src/
│       ├── components/  # studio/ graph/ diagrams/ layout/ scripts/ history/
│       ├── routes/      # 页面路由 (6 个页面)
│       ├── hooks/       # useCamera/useMicrophone/useRecognition/useWebSocket
│       ├── store/       # Zustand 状态管理
│       └── utils/       # 常量 + 大师动作数据
├── graph/              # Neo4j schema + 导入脚本
├── data/               # 剧本 JSON 数据
├── requirements.txt
├── launcher.py         # PyInstaller 打包入口
└── 使用手册.md
```

## API 路由

| 方法 | 路由 | 功能 |
|------|------|------|
| GET | /api/health | 健康检查 |
| GET | /api/scripts/tiers | 剧本三级菜单 |
| GET | /api/scripts/scene/{id} | 场次唱词全文 |
| POST | /api/sessions | 创建会话 |
| GET | /api/history | 历史记录 |
| GET | /api/evaluation/{id}/report | 评估报告 |
| GET | /api/graph/full | 全图数据 |
| POST | /api/diagrams/generate | 生成图表 |
| POST | /api/import/audio | 导入音频分析 |
| POST | /api/import/video | 导入视频分析 |
| POST | /api/import/image | 导入图像分析 |
| GET | /api/import/list | 分析结果列表 |
| GET | /api/import/download/{rid} | 下载 ZIP 报告 |
| DELETE | /api/import/{rid} | 删除分析记录 |
| WS | /ws/recognize | 实时识别 |

## Neo4j（可选）

```bash
# 已安装在 C:\Users\...\neo4j-community-4.4.39\
# 启动：.\bin\neo4j.bat console
# 浏览器：http://localhost:7474（neo4j/opera123）
```

## 分析输出

分析结果保存到 `~/.claude/common histories/opera-ai/analysis_results/`，每个 ZIP 报告包含：
- `analysis.json` — 完整分析数据
- `mfcc.png` / `f0.png` / `centroid.png` / `chroma.png` / `energy.png` / `waveform.png` — 音频图谱
- `angles.png` / `skeleton.png` — 视频骨架图

## 独立知识图谱页面

`output/graph/opera-knowledge-graph.html` 可双击浏览器直接打开，无需任何环境。

## 参考文献

- 邱楷洋, 高奥宁. 戏剧知识图谱如何构建？——以越调《收姜维》知识图谱的构建为例[J/OL]. 哲学社会科学预印本平台, 2026.
- 漳州机器人"唱"歌仔戏：AI多模态资料库的戏曲实践[EB/OL]. 中国新闻网, 2026-02-06.
