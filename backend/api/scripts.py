"""剧本管理 API — 三级级联菜单。"""
from fastapi import APIRouter
from backend.models.schemas import ScriptTier, ScriptDetail, ScriptReference

router = APIRouter(prefix="/api/scripts", tags=["剧本"])


# 硬编码剧本数据（后续可从 Neo4j 动态加载）
SCRIPT_TIERS = [
    {
        "id": "huai",
        "name": "淮剧",
        "children": [
            {
                "id": "nvshen",
                "name": "女审",
                "children": [
                    {"id": "nvshen_act1", "name": "第一幕·告状", "children": []},
                    {"id": "nvshen_act2", "name": "第二幕·审案", "children": []},
                    {"id": "nvshen_act3", "name": "第三幕·铡美", "children": []},
                ],
            },
            {
                "id": "qinxianglian",
                "name": "秦香莲",
                "children": [
                    {"id": "qxl_act1", "name": "第一幕·寻夫", "children": []},
                    {"id": "qxl_act2", "name": "第二幕·闯宫", "children": []},
                ],
            },
        ],
    },
    {
        "id": "jing",
        "name": "京剧",
        "children": [
            {
                "id": "qxl_jing",
                "name": "秦香莲（京剧版）",
                "children": [
                    {"id": "qxl_jing_act1", "name": "第一幕", "children": []},
                ],
            },
        ],
    },
    {
        "id": "yu",
        "name": "豫剧",
        "children": [
            {
                "id": "muguiying",
                "name": "穆桂英挂帅",
                "children": [
                    {"id": "mgy_act1", "name": "第一幕·挂帅", "children": []},
                    {"id": "mgy_act2", "name": "第二幕·出征", "children": []},
                ],
            },
        ],
    },
]

SCRIPT_DETAILS: dict[str, dict] = {
    "nvshen": {
        "id": "nvshen", "name": "女审", "category": "淮剧", "era": "宋代",
        "difficulty": "中级",
        "description": "包公案系列经典剧目，讲述秦香莲状告陈世美，包公铁面无私审理此案的故事。",
        "characters": ["包公", "秦香莲", "陈世美"],
        "vocal_styles": ["淮调", "自由调"],
        "movements": ["水袖", "兰花指", "亮相"],
        "instruments": ["二胡", "锣鼓"],
    },
    "qinxianglian": {
        "id": "qinxianglian", "name": "秦香莲", "category": "淮剧", "era": "宋代",
        "difficulty": "中级",
        "description": "秦香莲千里寻夫，陈世美不认糟糠之妻，最终包公秉公执法。",
        "characters": ["秦香莲", "陈世美", "包公"],
        "vocal_styles": ["自由调", "淮调"],
        "movements": ["水袖", "台步"],
        "instruments": ["二胡", "京胡"],
    },
    "muguiying": {
        "id": "muguiying", "name": "穆桂英挂帅", "category": "豫剧", "era": "宋代",
        "difficulty": "高级",
        "description": "杨家将故事，穆桂英挂帅出征，巾帼不让须眉。",
        "characters": ["穆桂英", "杨六郎"],
        "vocal_styles": ["豫西调"],
        "movements": ["云手", "亮相"],
        "instruments": ["琵琶"],
    },
}


def _build_tiers(data: list[dict]) -> list[ScriptTier]:
    result = []
    for item in data:
        tier = ScriptTier(
            id=item["id"], name=item["name"],
            children=_build_tiers(item.get("children", [])),
        )
        result.append(tier)
    return result


@router.get("/tiers", response_model=list[ScriptTier])
def get_tiers():
    return _build_tiers(SCRIPT_TIERS)


# ── 场次内容数据（预置剧本全文）────

SCENE_CONTENT: dict[str, dict] = {
    "nvshen_act1": {
        "name": "第一幕·告状",
        "summary": "秦香莲携儿女千里寻夫至京城，得知陈世美已招为驸马。她到开封府衙击鼓鸣冤。",
        "lyrics": "（秦香莲唱）\n离家乡，行千里，\n风吹日晒雨打衣。\n只为寻夫到京地，\n谁知他已另娶妻。\n\n（白）\n包大人！民妇秦香莲，状告当朝驸马陈世美！",
        "key_vocals": ["自由调"],
        "key_movements": ["水袖", "台步", "兰花指"],
        "duration_min": 8,
    },
    "nvshen_act2": {
        "name": "第二幕·审案",
        "summary": "包公升堂审案，陈世美拒不认妻。包公以理相劝，陈世美以权势相压。双方针锋相对。",
        "lyrics": "（包公唱·淮调）\n堂下民妇泪满面，\n本官心中已了然。\n国有国法家有规，\n王子犯法与民同。\n\n（陈世美唱·自由调）\n本宫乃是皇家婿，\n谁敢动我半毫分！",
        "key_vocals": ["淮调", "自由调"],
        "key_movements": ["亮相", "云手"],
        "duration_min": 15,
    },
    "nvshen_act3": {
        "name": "第三幕·铡美",
        "summary": "包公铁面无私，查明真相后下令开铡。陈世美伏法，秦香莲终得昭雪。",
        "lyrics": "（包公唱·淮调）\n王朝马汉听令行，\n抬上龙头铡一尊！\n皇亲国戚我不惧，\n为民做主是本分！\n\n（合唱）\n包公执法如青天，\n淮调高亢传千年。",
        "key_vocals": ["淮调"],
        "key_movements": ["亮相", "水袖"],
        "duration_min": 10,
    },
    "qxl_act1": {
        "name": "第一幕·寻夫",
        "summary": "秦香莲离开家乡，带着一对儿女踏上寻夫之路。沿途艰辛，以唱腔倾诉思念与期盼。",
        "lyrics": "（秦香莲唱·自由调）\n一别三年音信断，\n夫君可曾念故园？\n儿唤爹爹声声泪，\n为妻寻你到天边。",
        "key_vocals": ["自由调"],
        "key_movements": ["台步", "兰花指"],
        "duration_min": 6,
    },
    "qxl_act2": {
        "name": "第二幕·闯宫",
        "summary": "秦香莲闯入驸马府，与陈世美当面对质。陈世美冷漠相待，命人将其逐出。",
        "lyrics": "（秦香莲唱·自由调）\n当年恩爱化云烟，\n富贵荣华迷了眼。\n我今跪在你面前，\n只求把儿看一眼！",
        "key_vocals": ["自由调"],
        "key_movements": ["水袖", "台步"],
        "duration_min": 10,
    },
    "mgy_act1": {
        "name": "第一幕·挂帅",
        "summary": "穆桂英接帅印，披挂上阵。巾帼不让须眉，英姿飒爽。",
        "lyrics": "（穆桂英唱·豫西调）\n头戴金冠压双鬓，\n身披铠甲护我心。\n杨家将门出女将，\n不让须眉立乾坤！",
        "key_vocals": ["豫西调"],
        "key_movements": ["云手", "亮相", "台步"],
        "duration_min": 8,
    },
    "mgy_act2": {
        "name": "第二幕·出征",
        "summary": "穆桂英率军出征，阵前擂鼓，气势如虹。",
        "lyrics": "（穆桂英唱·豫西调）\n战鼓擂动天地惊，\n帅旗猎猎正招展。\n今日出征为家国，\n不破敌军誓不还！",
        "key_vocals": ["豫西调"],
        "key_movements": ["云手", "亮相"],
        "duration_min": 10,
    },
}


@router.get("/scene/{scene_id}")
def get_scene_content(scene_id: str):
    """获取场次的完整内容：剧情概要 + 唱词 + 唱腔/身段 + 参考资源。"""
    data = SCENE_CONTENT.get(scene_id)
    if not data:
        return {"found": False, "scene_id": scene_id}

    # 附带搜索结果
    return {
        "found": True,
        "scene_id": scene_id,
        **data,
        "references": [
            {"title": f"搜狗搜索: {data['name']} 淮剧视频", "url": f"https://v.sogou.com/v?query={data['name']}+淮剧"},
            {"title": f"百度百科: {data['name']} 剧情", "url": f"https://baike.baidu.com/item/{data['name']}"},
        ],
    }


@router.get("/{script_id}", response_model=ScriptDetail)
def get_script_detail(script_id: str):
    data = SCRIPT_DETAILS.get(script_id)
    if not data:
        return ScriptDetail(id=script_id, name=script_id)
    return ScriptDetail(**data)


@router.get("/{script_id}/reference", response_model=ScriptReference)
def get_script_reference(script_id: str):
    detail = SCRIPT_DETAILS.get(script_id)
    role = detail.get("characters", [""])[0] if detail else ""
    return ScriptReference(
        script_id=script_id,
        role=role,
        pose_keypoints_url=f"/data/reference/{script_id}_pose.json",
        audio_features_url=f"/data/reference/{script_id}_audio.json",
        duration_seconds=180,
    )
