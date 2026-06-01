"""网络搜索 API（为剧本查找相关动画/音频资源）。"""
from fastapi import APIRouter, Query
from backend.models.schemas import SearchResult

router = APIRouter(prefix="/api/search", tags=["搜索"])


@router.get("", response_model=list[SearchResult])
def search_resources(
    q: str = Query(..., description="搜索关键词"),
    type: str = Query("all", description="类型: animation | audio | reference | all"),
):
    # 预置资源映射（后续接入真实搜索 API）
    resource_map: dict[str, list[SearchResult]] = {
        "女审": [
            SearchResult(title="淮剧《女审》经典唱段",
                         url="https://www.bilibili.com/video/BV1xx411A7xX",
                         snippet="女审包公审案的经典淮剧唱段", type="audio"),
            SearchResult(title="《女审》身段示范教学",
                         url="https://www.bilibili.com/video/BV1JW411r7Cb",
                         snippet="淮剧名家示范女审身段动作", type="animation"),
        ],
        "秦香莲": [
            SearchResult(title="《秦香莲》全剧",
                         url="https://www.bilibili.com/video/BV1VW41167TG",
                         snippet="京剧经典剧目秦香莲全本", type="animation"),
            SearchResult(title="秦香莲·水袖技法",
                         url="https://www.bilibili.com/video/BV1Fx41127am",
                         snippet="水袖身段教学", type="animation"),
        ],
        "穆桂英挂帅": [
            SearchResult(title="豫剧《穆桂英挂帅》精选",
                         url="https://www.bilibili.com/video/BV1vW411j7wi",
                         snippet="豫剧名家穆桂英挂帅", type="audio"),
        ],
        "淮剧": [
            SearchResult(title="淮剧入门教程合集",
                         url="https://www.bilibili.com/video/BV1AT4y1L7Nq",
                         snippet="淮剧基础知识与唱腔教学", type="reference"),
        ],
    }

    results: list[SearchResult] = []
    for key, items in resource_map.items():
        if key in q:
            for item in items:
                if type == "all" or item.type == type:
                    results.append(item)

    if not results:
        results.append(SearchResult(
            title=f"全网搜索: {q}",
            url=f"https://search.bilibili.com/all?keyword={q}+淮剧",
            snippet=f"点击搜索 {q} 相关的淮剧资源", type="web",
        ))

    return results[:10]
