"""知识图谱 API。"""
from fastapi import APIRouter, HTTPException
from backend.services.graph_service import get_full_graph, get_node_neighbors, search_nodes
from backend.models.schemas import GraphData, GraphNode

router = APIRouter(prefix="/api/graph", tags=["图谱"])


@router.get("/full", response_model=GraphData)
def api_get_full_graph():
    try:
        return get_full_graph()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"图谱查询失败: {e}")


@router.get("/node/{node_id}/neighbors", response_model=GraphData)
def api_get_node_neighbors(node_id: str):
    try:
        return get_node_neighbors(node_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"邻居查询失败: {e}")


@router.get("/search", response_model=list[GraphNode])
def api_search_nodes(q: str = ""):
    if not q:
        return []
    try:
        return search_nodes(q)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索失败: {e}")
