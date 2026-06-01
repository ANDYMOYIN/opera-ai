"""Neo4j 数据库连接管理。"""
from neo4j import GraphDatabase
from backend.config import NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD

_driver = None


def get_driver():
    global _driver
    if _driver is None:
        _driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    return _driver


def close_driver():
    global _driver
    if _driver:
        _driver.close()
        _driver = None


def check_connection() -> bool:
    try:
        driver = get_driver()
        with driver.session() as session:
            result = session.run("MATCH (n) RETURN count(n) AS cnt")
            record = result.single()
            return record is not None
    except Exception:
        return False


def init_schema(cypher_path: str) -> int:
    """执行 Cypher 建图脚本，返回已存在的节点数。"""
    import os

    if not os.path.isfile(cypher_path):
        return 0

    with open(cypher_path, "r", encoding="utf-8") as f:
        cypher_text = f.read()

    statements = []
    for stmt in cypher_text.split(";"):
        stmt = stmt.strip()
        if not stmt:
            continue
        lines = [l for l in stmt.split("\n") if not l.strip().startswith("//") and l.strip()]
        clean = "\n".join(lines).strip()
        if clean and not clean.startswith("//"):
            statements.append(clean)

    driver = get_driver()
    with driver.session() as session:
        for stmt in statements:
            try:
                session.run(stmt)
            except Exception:
                pass

    with driver.session() as session:
        result = session.run("MATCH (n) RETURN count(n) AS cnt")
        record = result.single()
        return record["cnt"] if record else 0
