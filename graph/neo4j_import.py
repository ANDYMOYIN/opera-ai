"""
戏曲多模态知识图谱 — Neo4j 导入与可视化模块
支持两种模式：
  1. Neo4j 可用时：连接数据库，执行 Cypher 建图
  2. Neo4j 不可用时：使用 networkx + matplotlib 本地生成知识图谱可视化
"""

import os
import sys
import warnings
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

warnings.filterwarnings("ignore")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(ROOT, "output", "graph")

# 中文字体
plt.rcParams["font.sans-serif"] = ["SimHei", "Microsoft YaHei", "DejaVu Sans"]
plt.rcParams["axes.unicode_minus"] = False

# ============================================================
# 图谱数据定义
# ============================================================

ENTITIES = {
    "人物": [
        ("包公", "净"),
        ("秦香莲", "旦"),
        ("陈世美", "生"),
        ("穆桂英", "旦"),
        ("杨六郎", "生"),
    ],
    "剧目": [
        ("女审", "淮剧"),
        ("秦香莲", "京剧"),
        ("穆桂英挂帅", "豫剧"),
    ],
    "唱腔": [
        ("淮调", "淮剧"),
        ("自由调", "淮剧"),
        ("西皮", "京剧"),
        ("二黄", "京剧"),
        ("豫西调", "豫剧"),
    ],
    "动作": [
        ("水袖", "身段"),
        ("云手", "身段"),
        ("亮相", "身段"),
        ("台步", "步法"),
        ("兰花指", "手势"),
    ],
    "乐器": [
        ("京胡", "拉弦"),
        ("二胡", "拉弦"),
        ("锣鼓", "打击"),
        ("琵琶", "弹拨"),
    ],
    "行当": [
        ("生", ""),
        ("旦", ""),
        ("净", ""),
        ("丑", ""),
    ],
}

RELATIONS = [
    ("包公", "演唱", "淮调"),
    ("秦香莲", "演唱", "自由调"),
    ("陈世美", "演唱", "西皮"),
    ("穆桂英", "演唱", "豫西调"),
    ("包公", "出演", "女审"),
    ("秦香莲", "出演", "女审"),
    ("陈世美", "出演", "女审"),
    ("穆桂英", "出演", "穆桂英挂帅"),
    ("杨六郎", "出演", "穆桂英挂帅"),
    ("淮调", "用于", "女审"),
    ("自由调", "用于", "女审"),
    ("西皮", "用于", "秦香莲"),
    ("豫西调", "用于", "穆桂英挂帅"),
    ("秦香莲", "使用", "水袖"),
    ("秦香莲", "使用", "兰花指"),
    ("包公", "使用", "亮相"),
    ("穆桂英", "使用", "云手"),
    ("女审", "伴奏", "二胡"),
    ("女审", "伴奏", "锣鼓"),
    ("秦香莲", "伴奏", "京胡"),
    ("穆桂英挂帅", "伴奏", "琵琶"),
    ("包公", "行当", "净"),
    ("秦香莲", "行当", "旦"),
    ("陈世美", "行当", "生"),
    ("穆桂英", "行当", "旦"),
    ("杨六郎", "行当", "生"),
]


def build_with_networkx():
    """使用 networkx + matplotlib 在本地生成知识图谱可视化。"""
    import networkx as nx

    print("[图谱模块] 使用 networkx 本地生成知识图谱...")

    G = nx.DiGraph()

    # 节点颜色映射
    color_map = {
        "人物": "#e74c3c",
        "剧目": "#3498db",
        "唱腔": "#2ecc71",
        "动作": "#f39c12",
        "乐器": "#9b59b6",
        "行当": "#1abc9c",
    }

    # 添加实体节点
    node_colors = []
    node_labels = {}
    for category, items in ENTITIES.items():
        for name, attr in items:
            label = f"{name}\n({category})"
            G.add_node(name, category=category, attr=attr)
            node_colors.append(color_map.get(category, "#95a5a6"))
            node_labels[name] = name

    # 添加关系边
    for src, rel, tgt in RELATIONS:
        if src in G.nodes and tgt in G.nodes:
            G.add_edge(src, tgt, label=rel)
        else:
            # 如果节点不在图中（如"用于"关系中的目标），跳过
            pass

    # 绘制
    fig, ax = plt.subplots(figsize=(18, 14))

    # Kamada-Kawai 布局（比 spring layout 更稳定）
    try:
        pos = nx.kamada_kawai_layout(G)
    except Exception:
        pos = nx.spring_layout(G, k=3, iterations=50, seed=42)

    # 按类别分开绘制节点以支持图例
    for category, color in color_map.items():
        nodes = [n for n in G.nodes if G.nodes[n].get("category") == category]
        if nodes:
            nx.draw_networkx_nodes(
                G, pos, nodelist=nodes, node_color=color,
                node_size=1800, alpha=0.9, ax=ax,
                edgecolors="white", linewidths=1.5, label=category,
            )

    # 边
    nx.draw_networkx_edges(
        G, pos, edge_color="#888888", arrows=True,
        arrowsize=15, width=1.2, alpha=0.6,
        connectionstyle="arc3,rad=0.1", ax=ax,
    )

    # 节点标签
    nx.draw_networkx_labels(
        G, pos, font_size=9, font_weight="bold",
        font_color="white", ax=ax,
    )

    # 边标签
    edge_labels = {(u, v): d["label"] for u, v, d in G.edges(data=True)}
    nx.draw_networkx_edge_labels(
        G, pos, edge_labels=edge_labels, font_size=7,
        font_color="#555555", ax=ax,
    )

    ax.set_title("戏曲多模态知识图谱 (Opera Knowledge Graph)", fontsize=16, fontweight="bold", pad=20)
    ax.legend(loc="upper left", fontsize=7, framealpha=0.9)
    ax.axis("off")
    ax.set_facecolor("#fafafa")
    fig.patch.set_facecolor("white")

    save_path = os.path.join(OUTPUT_DIR, "knowledge_graph.png")
    fig.savefig(save_path, dpi=200, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print(f"  [OK] 知识图谱已保存: {save_path}")
    return True


def build_with_neo4j(uri="bolt://localhost:7687", user="neo4j", password="neo4j"):
    """通过 Neo4j Python Driver 连接数据库并执行 Cypher。"""
    from neo4j import GraphDatabase

    print("[图谱模块] 尝试连接 Neo4j 数据库...")

    # 读取 schema.cypher
    schema_path = os.path.join(os.path.dirname(__file__), "schema.cypher")
    if not os.path.isfile(schema_path):
        print(f"  [错误] 找不到 schema.cypher: {schema_path}")
        return False

    with open(schema_path, "r", encoding="utf-8") as f:
        cypher_text = f.read()

    # 按分号拆分语句，过滤空行和注释块
    statements = []
    for stmt in cypher_text.split(";"):
        stmt = stmt.strip()
        # 跳过纯注释块和空的
        if not stmt:
            continue
        lines = [l for l in stmt.split("\n") if not l.strip().startswith("//") and l.strip()]
        clean = "\n".join(lines).strip()
        if clean and not clean.startswith("//"):
            statements.append(clean)

    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        with driver.session() as session:
            for i, stmt in enumerate(statements):
                try:
                    session.run(stmt)
                except Exception as e:
                    # 某些查询（如 MATCH...RETURN n）在无数据时报错是正常的
                    if "RETURN" not in stmt.upper():
                        print(f"  [警告] 语句 {i+1} 执行异常: {e}")
        driver.close()
        print("  [OK] Neo4j 知识图谱构建完成。请在 Neo4j Browser 中运行 MATCH (n) RETURN n 查看。")
        return True
    except Exception as e:
        print(f"  [错误] Neo4j 连接失败: {e}")
        print("  [提示] 请确认 Neo4j Desktop 已启动且数据库正在运行。")
        print("  [提示] 默认连接: bolt://localhost:7687, 用户名: neo4j")
        return False


def run(use_neo4j=False, **neo4j_kwargs):
    """
    执行知识图谱构建主流程。

    Args:
        use_neo4j: 是否尝试连接 Neo4j 数据库
        **neo4j_kwargs: Neo4j 连接参数 (uri, user, password)
    """
    print("[图谱模块] 开始知识图谱构建...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    success = False

    if use_neo4j:
        success = build_with_neo4j(**neo4j_kwargs)

    if not success:
        # fallback to networkx
        success = build_with_networkx()

    print("[图谱模块] 完成。")
    return success


if __name__ == "__main__":
    run(use_neo4j=False)
