"""Neo4j 知识图谱查询服务 — 含离线回退。"""
from backend.core.database import get_driver, check_connection
from backend.models.schemas import GraphData, GraphNode, GraphEdge

# ── 硬编码回退数据（Neo4j 不可用时使用）────

FALLBACK_ENTITIES = [
    ("人物", "包公", {"行当": "净", "朝代": "宋", "description": "铁面无私的清官形象"}),
    ("人物", "秦香莲", {"行当": "旦", "朝代": "宋", "description": "《女审》女主角"}),
    ("人物", "陈世美", {"行当": "生", "朝代": "宋", "description": "负心汉典型"}),
    ("人物", "穆桂英", {"行当": "旦", "朝代": "宋", "description": "巾帼英雄形象"}),
    ("人物", "杨六郎", {"行当": "生", "朝代": "宋", "description": "杨家将核心人物"}),
    ("剧目", "女审", {"剧种": "淮剧", "类型": "传统戏", "description": "包公案系列经典剧目"}),
    ("剧目", "秦香莲", {"剧种": "京剧", "类型": "传统戏", "description": "又名《铡美案》"}),
    ("剧目", "穆桂英挂帅", {"剧种": "豫剧", "类型": "新编历史剧", "description": "杨家将代表剧目"}),
    ("唱腔", "淮调", {"剧种": "淮剧", "特点": "高亢激越，富于表现力"}),
    ("唱腔", "自由调", {"剧种": "淮剧", "特点": "节奏自由，抒情性强"}),
    ("唱腔", "西皮", {"剧种": "京剧", "特点": "明快激昂"}),
    ("唱腔", "二黄", {"剧种": "京剧", "特点": "沉稳庄重"}),
    ("唱腔", "豫西调", {"剧种": "豫剧", "特点": "朴实豪放"}),
    ("动作", "水袖", {"类别": "身段", "description": "甩动衣袖的表演技法"}),
    ("动作", "云手", {"类别": "身段", "description": "基本身段动作"}),
    ("动作", "亮相", {"类别": "身段", "description": "定格式亮相动作"}),
    ("动作", "台步", {"类别": "步法", "description": "舞台行走步法"}),
    ("动作", "兰花指", {"类别": "手势", "description": "女性经典手势"}),
    ("乐器", "京胡", {"类别": "拉弦", "description": "京剧主要伴奏乐器"}),
    ("乐器", "二胡", {"类别": "拉弦", "description": "淮剧主要伴奏乐器"}),
    ("乐器", "锣鼓", {"类别": "打击", "description": "节奏核心打击乐器"}),
    ("乐器", "琵琶", {"类别": "弹拨", "description": "文场伴奏乐器"}),
    ("行当", "生", {"description": "男性角色"}),
    ("行当", "旦", {"description": "女性角色"}),
    ("行当", "净", {"description": "花脸角色"}),
    ("行当", "丑", {"description": "喜剧角色"}),
]

FALLBACK_RELATIONS = [
    ("包公", "演唱", "淮调"), ("秦香莲", "演唱", "自由调"),
    ("陈世美", "演唱", "西皮"), ("穆桂英", "演唱", "豫西调"),
    ("包公", "出演", "女审"), ("秦香莲", "出演", "女审"),
    ("陈世美", "出演", "女审"), ("穆桂英", "出演", "穆桂英挂帅"),
    ("杨六郎", "出演", "穆桂英挂帅"),
    ("淮调", "用于", "女审"), ("自由调", "用于", "女审"),
    ("西皮", "用于", "秦香莲"), ("豫西调", "用于", "穆桂英挂帅"),
    ("秦香莲", "使用", "水袖"), ("秦香莲", "使用", "兰花指"),
    ("包公", "使用", "亮相"), ("穆桂英", "使用", "云手"),
    ("女审", "伴奏", "二胡"), ("女审", "伴奏", "锣鼓"),
    ("秦香莲", "伴奏", "京胡"), ("穆桂英挂帅", "伴奏", "琵琶"),
    ("包公", "行当", "净"), ("秦香莲", "行当", "旦"),
    ("陈世美", "行当", "生"), ("穆桂英", "行当", "旦"),
    ("杨六郎", "行当", "生"),
]


def _build_fallback_graph() -> GraphData:
    nodes = []
    node_ids = set()
    idx = 0
    for category, name, props in FALLBACK_ENTITIES:
        nid = str(idx)
        idx += 1
        node_ids.add(nid)
        nodes.append(GraphNode(id=nid, name=name, category=category, properties=props))

    name_to_id = {n.name: n.id for n in nodes}

    edges = []
    for src_name, rel, tgt_name in FALLBACK_RELATIONS:
        s = name_to_id.get(src_name)
        t = name_to_id.get(tgt_name)
        if s and t:
            edges.append(GraphEdge(source=s, target=t, label=rel))

    return GraphData(nodes=nodes, edges=edges)


def _neo4j_available() -> bool:
    try:
        return check_connection()
    except Exception:
        return False


def get_full_graph() -> GraphData:
    if not _neo4j_available():
        return _build_fallback_graph()

    driver = get_driver()
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []
    node_ids: set[str] = set()

    try:
        with driver.session() as session:
            result = session.run("MATCH (n) RETURN n, labels(n) AS labels")
            for record in result:
                node = record["n"]
                labels = record["labels"]
                category = labels[0] if labels else "Unknown"
                props = dict(node)
                name = props.pop("name", str(node.id))
                node_id = str(node.id)
                node_ids.add(node_id)
                nodes.append(GraphNode(id=node_id, name=name, category=category, properties=props))

            rel_result = session.run(
                "MATCH (a)-[r]->(b) RETURN id(a) AS src, id(b) AS tgt, type(r) AS rel"
            )
            for record in rel_result:
                src = str(record["src"])
                tgt = str(record["tgt"])
                if src in node_ids and tgt in node_ids:
                    edges.append(GraphEdge(source=src, target=tgt, label=record["rel"]))
    except Exception:
        return _build_fallback_graph()

    return GraphData(nodes=nodes, edges=edges)


def get_node_neighbors(node_id: str) -> GraphData:
    if not _neo4j_available():
        # 回退：从完整图中提取邻居
        full = _build_fallback_graph()
        nid_set = {n.id for n in full.nodes}
        related_edges = [e for e in full.edges if e.source == node_id or e.target == node_id]
        related_ids = set()
        for e in related_edges:
            related_ids.add(e.source)
            related_ids.add(e.target)
        related_nodes = [n for n in full.nodes if n.id in related_ids]
        return GraphData(nodes=related_nodes, edges=related_edges)

    driver = get_driver()
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []
    node_ids: set[str] = set()

    try:
        with driver.session() as session:
            result = session.run(
                "MATCH (n)-[r]-(m) WHERE id(n)=$nid OR id(m)=$nid "
                "RETURN DISTINCT n, m, r, labels(n) AS ln, labels(m) AS lm",
                nid=int(node_id),
            )
            for record in result:
                n = record["n"]
                m = record["m"]
                r = record["r"]
                for node, labels_key in [(n, "ln"), (m, "lm")]:
                    nnid = str(node.id)
                    if nnid not in node_ids:
                        node_ids.add(nnid)
                        labels = record[labels_key]
                        category = labels[0] if labels else "Unknown"
                        props = dict(node)
                        name = props.pop("name", str(node.id))
                        nodes.append(GraphNode(id=nnid, name=name, category=category, properties=props))
                edges.append(GraphEdge(source=str(n.id), target=str(m.id), label=type(r).__name__))
    except Exception:
        return get_node_neighbors(node_id)

    return GraphData(nodes=nodes, edges=edges)


def search_nodes(query: str) -> list[GraphNode]:
    if not _neo4j_available():
        # 回退搜索
        full = _build_fallback_graph()
        results = []
        q = query.lower()
        for n in full.nodes:
            if q in n.name.lower() or q in str(n.properties).lower():
                results.append(n)
        return results[:20]

    driver = get_driver()
    nodes: list[GraphNode] = []
    try:
        with driver.session() as session:
            result = session.run(
                "MATCH (n) WHERE n.name CONTAINS $q OR n.description CONTAINS $q "
                "RETURN n, labels(n) AS labels LIMIT 20",
                q=query,
            )
            for record in result:
                node = record["n"]
                labels = record["labels"]
                category = labels[0] if labels else "Unknown"
                props = dict(node)
                name = props.pop("name", str(node.id))
                nodes.append(GraphNode(id=str(node.id), name=name, category=category, properties=props))
    except Exception:
        return search_nodes(query)

    return nodes
