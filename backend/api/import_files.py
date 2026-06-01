"""文件导入 API — 六步架构完整分析流水线。所有结果落盘到 OUTPUT_DIR。"""

import os, sys, uuid, json, zipfile, base64
from io import BytesIO
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import FileResponse, StreamingResponse

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, ROOT)

from backend.config import OUTPUT_DIR

# ffmpeg 路径
_FFMPEG_CANDIDATES = [
    r"D:\APP\ffmpeg-2026-05-28-git-7b46c6a2a3-full_build\bin\ffmpeg.exe",
    "ffmpeg",
]
FFMPEG = None
for cand in _FFMPEG_CANDIDATES:
    if os.path.isfile(cand) or (cand == "ffmpeg" and __import__('shutil').which("ffmpeg")):
        FFMPEG = cand
        break

RESULTS_DIR = os.path.join(OUTPUT_DIR, "analysis_results")
UPLOAD_DIR = os.path.join(OUTPUT_DIR, "uploads")
os.makedirs(RESULTS_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/api/import", tags=["导入"])


@router.get("/list")
def list_analyses():
    """列出所有历史分析结果。"""
    return {"items": _get_saved_list()}


def _save_b64_png(fig, rid: str, name: str) -> str:
    import matplotlib
    buf = BytesIO()
    fig.savefig(buf, format="png", dpi=100, bbox_inches="tight")
    matplotlib.pyplot.close(fig)
    b64 = base64.b64encode(buf.getvalue()).decode()
    png_path = os.path.join(RESULTS_DIR, f"{rid}_{name}.png")
    with open(png_path, "wb") as f:
        f.write(buf.getvalue())
    return b64


def _save_result_json(rid: str, data: dict):
    json_path = os.path.join(RESULTS_DIR, f"{rid}.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, default=str)


def _get_saved_list() -> list[dict]:
    items = []
    for fname in sorted(os.listdir(RESULTS_DIR), reverse=True):
        if not fname.endswith(".json") or fname.startswith("_"):
            continue
        path = os.path.join(RESULTS_DIR, fname)
        try:
            with open(path, "r", encoding="utf-8") as f:
                item = json.load(f)
            items.append(item)
        except Exception:
            pass
    return items[:50]


def _load_result_json(rid: str) -> dict | None:
    json_path = os.path.join(RESULTS_DIR, f"{rid}.json")
    if not os.path.isfile(json_path):
        return None
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)


def _sniff_type(header: bytes) -> str:
    """检测文件真实类型。"""
    h = header.lower()
    if b'ftyp' in h or b'moov' in h:
        return "video"       # MP4 / MOV
    if b'id3' in h or h[:2] in (b'\xff\xfb', b'\xff\xfa', b'\xff\xf3'):
        return "audio"       # MP3
    if b'riff' in h:
        return "audio"       # WAV
    if b'flac' in h:
        return "audio"
    if b'oggs' in h:
        return "audio"
    if b'\x89png' in h:
        return "image"
    if b'\xff\xd8\xff' in h:
        return "image"       # JPEG
    return "unknown"


# ════════════════════════════════════════════════════════════════

@router.post("/audio")
async def import_audio(file: UploadFile = File(...)):
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "wav"
    rid = uuid.uuid4().hex[:8]
    fpath = os.path.join(UPLOAD_DIR, f"{rid}.{ext}")

    content = await file.read()
    with open(fpath, "wb") as f:
        f.write(content)

    # 格式检测
    real = _sniff_type(content[:256])

    result = {"filename": file.filename, "id": rid, "kind": "audio", "features": {
        "文件大小": f"{len(content)/1024:.1f} KB",
        "格式": ext.upper(),
    }, "plots": {}, "error": None}
    _save_result_json(rid, result)

    if real == "video" and ext not in ("mp4", "avi", "mov", "mkv", "webm"):
        if not FFMPEG:
            result["error"] = (
                "无法解码此文件。Windows 缺少 FFmpeg。\n"
                "解决方法: 1) 用任意在线转换网站将此文件转为 WAV 格式后重新上传\n"
                "          2) 在命令行执行: winget install ffmpeg\n"
                "          3) 或改后缀为 .mp4 用视频导入"
            )
            _save_result_json(rid, result)
            return result
        # 有 ffmpeg → 静默转码放行

    try:
        import librosa, librosa.display
        import matplotlib; matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import numpy as np

        # 优先用 ffmpeg 解码 -> WAV -> librosa（限 10 分钟）
        y = sr = None
        load_error = None

        if FFMPEG:
            import subprocess as sp
            wav_tmp = os.path.join(UPLOAD_DIR, f"{rid}_converted.wav")
            try:
                sp.run(
                    [FFMPEG, "-y", "-i", fpath, "-vn", "-acodec", "pcm_s16le",
                     "-ar", "22050", "-ac", "1", "-t", "600", wav_tmp],
                    capture_output=True, timeout=180, check=True,
                )
                y, sr = librosa.load(wav_tmp, sr=None, duration=600.0)
                os.unlink(wav_tmp)
            except Exception as e:
                load_error = f"FFmpeg: {e}" if str(e) else type(e).__name__

        # 回退：librosa 直接读
        if y is None:
            try:
                y, sr = librosa.load(fpath, sr=None, duration=600.0)
            except Exception as le:
                load_error = f"{type(le).__name__}: {le}" if str(le) else type(le).__name__
        if y is None or sr is None:
            raise RuntimeError(f"无法解析音频文件: {load_error or '未知错误 · 建议安装 FFmpeg 或转换为 WAV 格式后重试'}")

        duration = len(y) / sr

        # 1. MFCC
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        fig, ax = plt.subplots(figsize=(10, 3))
        img = librosa.display.specshow(mfcc, x_axis="time", sr=sr, ax=ax, cmap="magma")
        fig.colorbar(img, ax=ax); ax.set_title("MFCC 频谱图")
        result["plots"]["mfcc"] = _save_b64_png(fig, rid, "mfcc")
        _save_result_json(rid, result)

        # 2. F0 — 改用 librosa.yin 代替 pyin，快 10-50 倍
        f0 = librosa.yin(y, fmin=librosa.note_to_hz("C2"), fmax=librosa.note_to_hz("C7"), sr=sr)
        times_f0 = np.linspace(0, len(f0) * (512 / sr), len(f0))
        fig, ax = plt.subplots(figsize=(10, 3))
        ax.plot(times_f0, f0, color="#d62728", linewidth=0.8)
        ax.set_title("F0 基频曲线"); ax.grid(True, alpha=0.3)
        result["plots"]["f0"] = _save_b64_png(fig, rid, "f0")
        _save_result_json(rid, result)

        # 3. 频谱质心
        centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        times_c = np.linspace(0, duration, len(centroid))
        fig, ax = plt.subplots(figsize=(10, 3))
        ax.plot(times_c, centroid, color="#2ecc71", linewidth=0.8)
        ax.set_title("频谱质心"); ax.grid(True, alpha=0.3)
        result["plots"]["centroid"] = _save_b64_png(fig, rid, "centroid")
        _save_result_json(rid, result)

        # 4. 色度
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        fig, ax = plt.subplots(figsize=(10, 3))
        librosa.display.specshow(chroma, x_axis="time", y_axis="chroma", sr=sr, ax=ax, cmap="viridis")
        ax.set_title("色度特征 (Chroma)")
        result["plots"]["chroma"] = _save_b64_png(fig, rid, "chroma")
        _save_result_json(rid, result)

        # 5. 能量 + 语谱图 + 切句
        rms = librosa.feature.rms(y=y)[0]
        times_r = np.linspace(0, duration, len(rms))
        threshold = np.mean(rms) * 1.2
        phrase_starts, in_phrase = [], False
        for i, v in enumerate(rms):
            if v > threshold and not in_phrase: phrase_starts.append(times_r[i]); in_phrase = True
            elif v < threshold * 0.5 and in_phrase: phrase_starts.append(times_r[i]); in_phrase = False
        if in_phrase: phrase_starts.append(duration)

        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 4))
        ax1.plot(times_r, rms, color="#f39c12", linewidth=0.8)
        ax1.set_title("能量包络 + 唱句切分"); ax1.grid(True, alpha=0.3)
        for t in phrase_starts: ax1.axvline(x=t, color="#e74c3c", linestyle="--", alpha=0.5, linewidth=0.6)
        ax2.specgram(y, NFFT=2048, Fs=sr, cmap="magma")
        ax2.set_title("语谱图"); ax2.set_xlabel("时间 (秒)"); ax2.set_ylabel("频率 (Hz)")
        fig.tight_layout()
        result["plots"]["energy"] = _save_b64_png(fig, rid, "energy")
        _save_result_json(rid, result)

        # 6. 波形
        fig, ax = plt.subplots(figsize=(10, 2))
        ax.plot(np.linspace(0, duration, len(y)), y, color="#1f77b4", linewidth=0.5)
        ax.set_title("音频波形图")
        result["plots"]["waveform"] = _save_b64_png(fig, rid, "waveform")
        _save_result_json(rid, result)

        # 戏曲参数
        valid_f0 = f0[~np.isnan(f0)]
        opera = {}
        if len(valid_f0) > 10:
            diffs = np.diff(valid_f0)
            glide_count = sum(1 for d in diffs if abs(d) > 2.0)
            from scipy.signal import welch
            try:
                f_psd, psd = welch(valid_f0 - np.mean(valid_f0), fs=50, nperseg=min(128, len(valid_f0)))
                vibrato = float(np.sqrt(np.mean(psd[(f_psd>=4)&(f_psd<=8)]))) if np.any((f_psd>=4)&(f_psd<=8)) else 0
            except: vibrato = 0
            stable = sum(1 for i in range(1, len(valid_f0)-1) if abs(valid_f0[i]-valid_f0[i-1]) < 2.0)
            opera = {
                "滑音片段数": glide_count,
                "最大滑音斜率": f"{max((abs(d) for d in diffs), default=0):.1f} Hz/帧",
                "颤音幅度": f"{vibrato:.2f} Hz",
                "润腔稳定帧数": f"{stable} ({(stable/len(valid_f0)*100):.0f}%)",
            }
        result["opera_params"] = opera
        result["features"] = {
            "采样率": f"{sr} Hz", "时长": f"{duration:.1f} 秒",
            "文件大小": f"{len(content)/1024:.1f} KB",
            "唱句切分段": f"{len(phrase_starts)//2}",
            "平均频谱质心": f"{np.mean(centroid):.0f} Hz",
            **opera,
        }

    except Exception as e:
        err_msg = f"{type(e).__name__}: {e}" if str(e) else type(e).__name__
        result["error"] = err_msg[:500]

    _save_result_json(rid, result)
    return result


# ════════════════════════════════════════════════════════════════
# 视频分析
# ════════════════════════════════════════════════════════════════

JOINT_PAIRS = [
    ("右肩","右肘", 11, 13), ("右肘","右腕", 13, 15),
    ("左肩","左肘", 12, 14), ("左肘","左腕", 14, 16),
    ("右髋","右膝", 23, 25), ("右膝","右踝", 25, 27),
    ("左髋","左膝", 24, 26), ("左膝","左踝", 26, 28),
]

def _angle_3d(a, b, c):
    import numpy as np
    ba, bc = np.array(a) - np.array(b), np.array(c) - np.array(b)
    dot, norm = np.dot(ba, bc), np.linalg.norm(ba) * np.linalg.norm(bc)
    return float(np.degrees(np.arccos(np.clip(dot / max(1e-8, norm), -1, 1))))


@router.post("/video")
async def import_video(file: UploadFile = File(...)):
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "mp4"
    rid = uuid.uuid4().hex[:8]
    fpath = os.path.join(UPLOAD_DIR, f"{rid}.{ext}")

    content = await file.read()
    with open(fpath, "wb") as f: f.write(content)

    result = {"filename": file.filename, "id": rid, "kind": "video", "features": {
        "文件大小": f"{len(content)/1024/1024:.1f} MB",
        "格式": ext.upper(),
    }, "plots": {}, "plot": None, "error": None}
    _save_result_json(rid, result)

    try:
        import cv2, mediapipe as mp
        import matplotlib; matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import numpy as np

        cap = cv2.VideoCapture(fpath)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        mp_pose, mp_draw = mp.solutions.pose, mp.solutions.drawing_utils
        mp_styles = mp.solutions.drawing_styles

        best_visible, best_frame, best_landmarks, best_idx = 0, None, None, 0
        all_angles: list[dict] = []

        with mp_pose.Pose(model_complexity=1, min_detection_confidence=0.5) as pose:
            idx = 0
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret: break
                if idx % 10 == 0:
                    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    res = pose.process(rgb)
                    if res.pose_landmarks:
                        lm = res.pose_landmarks.landmark
                        visible = sum(1 for p in lm if p.visibility > 0.5)
                        fa = {"frame": idx}
                        for name_a, name_b, i, j in JOINT_PAIRS:
                            mid = ((lm[i].x+lm[j].x)/2, (lm[i].y+lm[j].y)/2, (lm[i].z+lm[j].z)/2)
                            fa[f"{name_a}-{name_b}"] = round(_angle_3d(
                                (lm[i].x,lm[i].y,lm[i].z), mid, (lm[j].x,lm[j].y,lm[j].z)), 1)
                        all_angles.append(fa)
                        if visible > best_visible:
                            best_visible = visible
                            annotated = frame.copy()
                            mp_draw.draw_landmarks(annotated, res.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                                landmark_drawing_spec=mp_styles.get_default_pose_landmarks_style())
                            best_frame, best_landmarks = annotated, res.pose_landmarks
                            best_idx = idx
                idx += 1
        cap.release()

        # Joint angles chart
        key_frames = all_angles[::max(1, len(all_angles)//10)][:10]
        if key_frames:
            fig, ax = plt.subplots(figsize=(10, 3.5))
            fig.patch.set_facecolor("#1a1210"); ax.set_facecolor("#1a1210")
            for pair in ["右肩-右肘", "右肘-右腕", "左膝-左踝", "右膝-右踝"]:
                ax.plot(range(len(key_frames)), [f.get(pair,0) for f in key_frames],
                        marker="o", markersize=4, linewidth=1.5, label=pair)
            ax.set_title("关键关节角度序列", color="#d4a843"); ax.legend(fontsize=8); ax.grid(True, alpha=0.15)
            ax.tick_params(colors="#8a7a6a")
            result["plots"]["angles"] = _save_b64_png(fig, rid, "angles")

        # Skeleton extraction
        if best_frame is not None:
            fig, axes = plt.subplots(1, 2, figsize=(12, 5))
            fig.patch.set_facecolor("#1a1210")
            for ax in axes: ax.set_facecolor("#1a1210")
            axes[0].imshow(cv2.cvtColor(best_frame, cv2.COLOR_BGR2RGB)); axes[0].set_title("最佳帧", color="#d4a843"); axes[0].axis("off")
            axes[1].imshow(cv2.cvtColor(best_frame, cv2.COLOR_BGR2RGB)); axes[1].set_title(f"骨架 (帧{best_idx})", color="#d4a843"); axes[1].axis("off")
            result["plot"] = _save_b64_png(fig, rid, "skeleton")

        # Kinematics params
        if len(all_angles) >= 2:
            rw = [f.get("右肘-右腕", 0) for f in all_angles]
            rw_vel = np.diff(rw) * fps / 10
            result["features"] = {
                "总帧数": total_frames, "FPS": f"{fps:.1f}",
                "文件大小": f"{len(content)/1024/1024:.1f} MB",
                "可见关键点": best_visible,
                "平均右肘角": f"{np.mean(rw):.1f}°",
                "右腕角速度": f"{np.max(np.abs(rw_vel)):.1f}°/采样",
            }
        else:
            result["features"] = {"总帧数": total_frames, "FPS": f"{fps:.1f}", "文件大小": f"{len(content)/1024/1024:.1f} MB"}

    except Exception as e:
        err_msg = f"{type(e).__name__}: {e}" if str(e) else type(e).__name__
        result["error"] = err_msg[:500]

    _save_result_json(rid, result)
    return result


# ════════════════════════════════════════════════════════════════
# 图像分析
# ════════════════════════════════════════════════════════════════

@router.post("/image")
async def import_image(file: UploadFile = File(...)):
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    rid = uuid.uuid4().hex[:8]
    fpath = os.path.join(UPLOAD_DIR, f"{rid}.{ext}")

    content = await file.read()
    with open(fpath, "wb") as f: f.write(content)

    result = {"filename": file.filename, "id": rid, "kind": "image", "features": {}, "plots": {}, "error": None}
    _save_result_json(rid, result)

    try:
        import cv2, matplotlib; matplotlib.use("Agg")
        import matplotlib.pyplot as plt, numpy as np

        img = cv2.imread(fpath)
        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

        # Canny
        edges = cv2.Canny(gray, 50, 150)
        fig, ax = plt.subplots(figsize=(6, 5))
        ax.imshow(edges, cmap="gray"); ax.set_title("Canny 边缘检测"); ax.axis("off")
        result["plots"]["canny"] = _save_b64_png(fig, rid, "canny")

        # Contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cimg = np.zeros((h, w, 3), dtype=np.uint8)
        cv2.drawContours(cimg, contours, -1, (0, 255, 100), 2)
        fig, ax = plt.subplots(figsize=(6, 5))
        ax.imshow(cv2.cvtColor(cimg, cv2.COLOR_BGR2RGB))
        ax.set_title(f"轮廓 ({len(contours)} 个)"); ax.axis("off")
        result["plots"]["contours"] = _save_b64_png(fig, rid, "contours")

        # HSV
        fig, axes = plt.subplots(1, 3, figsize=(12, 3))
        for ax, ch, name, color in [(axes[0], 0, "色相 H", "#e74c3c"), (axes[1], 1, "饱和度 S", "#3498db"), (axes[2], 2, "明度 V", "#2ecc71")]:
            hist = cv2.calcHist([hsv], [ch], None, [256], [0, 256])
            ax.plot(hist, color=color); ax.set_title(name)
        fig.tight_layout()
        result["plots"]["hsv"] = _save_b64_png(fig, rid, "hsv")

        # Comparison
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 5))
        ax1.imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)); ax1.set_title("原图"); ax1.axis("off")
        ax2.imshow(edges, cmap="plasma"); ax2.set_title("边缘热力图"); ax2.axis("off")
        result["plots"]["comparison"] = _save_b64_png(fig, rid, "comparison")

        hm, sm, vm = float(np.median(hsv[:,:,0])), float(np.median(hsv[:,:,1])), float(np.median(hsv[:,:,2]))
        result["features"] = {
            "尺寸": f"{w}×{h}", "文件大小": f"{len(content)/1024:.1f} KB",
            "轮廓数": len(contours), "边缘密度": f"{np.sum(edges>0)/(w*h)*100:.1f}%",
            "色相中值": f"{hm:.0f}°", "饱和度": f"{sm:.0f}/255", "明度": f"{vm:.0f}/255",
            "主色调": ("暖" if 0<=hm<=30 or 150<=hm<=180 else ("冷" if 80<=hm<=140 else "中性")),
        }

    except Exception as e:
        err_msg = f"{type(e).__name__}: {e}" if str(e) else type(e).__name__
        result["error"] = err_msg[:500]

    _save_result_json(rid, result)
    return result


# ════════════════════════════════════════════════════════════════
# 下载 & 删除
# ════════════════════════════════════════════════════════════════

@router.delete("/{rid}")
def delete_analysis(rid: str):
    """删除指定分析结果及其所有 PNG 文件。"""
    json_path = os.path.join(RESULTS_DIR, f"{rid}.json")
    deleted = 0
    if os.path.isfile(json_path):
        os.unlink(json_path)
        deleted += 1
    for fname in os.listdir(RESULTS_DIR):
        if fname.startswith(rid) and (fname.endswith(".png") or fname.endswith(".zip")):
            os.unlink(os.path.join(RESULTS_DIR, fname))
            deleted += 1
    return {"deleted": deleted, "rid": rid}

@router.get("/download/{rid}")
def download_result(rid: str):
    import re

    json_path = os.path.join(RESULTS_DIR, f"{rid}.json")
    if not os.path.isfile(json_path):
        from fastapi.responses import JSONResponse
        return JSONResponse({"error": "not_found", "rid": rid}, status_code=404)

    with open(json_path, "r", encoding="utf-8") as f:
        meta = json.load(f)

    safe_name = meta.get("filename", "analysis").rsplit(".", 1)[0]
    safe_name = re.sub(r'[<>:"/\\|?*]', '_', safe_name)

    tmp_zip = os.path.join(RESULTS_DIR, f"_download_{rid}.zip")

    try:
        with zipfile.ZipFile(tmp_zip, "w", zipfile.ZIP_DEFLATED) as zf:
            # Always include the analysis JSON
            export: dict[str, object] = {}
            for k in ("filename", "features", "opera_params", "error"):
                if k in meta:
                    export[k] = meta[k]
            zf.writestr("analysis.json", json.dumps(export, ensure_ascii=False, indent=2))

            # Attach any PNGs that exist for this analysis
            png_count = 0
            for fname in sorted(os.listdir(RESULTS_DIR)):
                if fname.startswith(rid) and fname.endswith(".png"):
                    label = fname[len(rid) + 1:-4]
                    zf.write(os.path.join(RESULTS_DIR, fname), f"{label}.png")
                    png_count += 1

            # Also export base64 images from the JSON if PNGs are missing
            if png_count == 0 and meta.get("plots"):
                for name, b64 in meta["plots"].items():
                    try:
                        zf.writestr(f"{name}.png", base64.b64decode(b64))
                    except Exception:
                        pass
                if meta.get("plot"):
                    try:
                        zf.writestr("skeleton.png", base64.b64decode(meta["plot"]))
                    except Exception:
                        pass
    except Exception as exc:
        if os.path.isfile(tmp_zip):
            os.unlink(tmp_zip)
        from fastapi.responses import JSONResponse
        return JSONResponse({"error": "zip_failed", "detail": str(exc)[:200]}, status_code=500)

    if not os.path.isfile(tmp_zip):
        from fastapi.responses import JSONResponse
        return JSONResponse({"error": "zip_empty"}, status_code=500)

    file_size = os.path.getsize(tmp_zip)

    # Clean up old temp zips (> 1 hour old)
    for fname in os.listdir(RESULTS_DIR):
        if fname.startswith("_download_") and fname.endswith(".zip"):
            fpath = os.path.join(RESULTS_DIR, fname)
            if os.path.getmtime(fpath) < os.path.getmtime(tmp_zip) - 3600:
                try:
                    os.unlink(fpath)
                except Exception:
                    pass

    return FileResponse(
        tmp_zip,
        media_type="application/zip",
        filename=f"{safe_name}-analysis-report.zip",
    )
