import { useRef, useCallback, useEffect } from 'react'
import { useCamera } from './useCamera'
import { useMicrophone } from './useMicrophone'
import { useRecognitionStore } from '../store/recognitionStore'
import { MASTER_SEQUENCE, comparePoses, sampleFrameForMotion } from '../utils/masterPoses'

const AUDIO_SUGGESTIONS = [
  '音准尚可，注意淮调高亢处的气息',
  '音高偏低约半音，淮剧唱腔讲究高亢激越',
  '润腔滑音处理不错',
  '节奏略快，注意淮调抑扬顿挫',
  '咬字清晰，拖腔气息均匀些',
]

export function useRecognition() {
  const store = useRecognitionStore()
  const cam = useCamera()
  const mic = useMicrophone()
  const animRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const tickCountRef = useRef(0)
  const prevFrameRef = useRef<ImageData | null>(null)
  const scoreHistoryRef = useRef<number[]>([])

  // 从摄像头帧提取 ImageData 做运动检测
  const captureImageData = useCallback((): ImageData | null => {
    if (!cam.videoRef.current) return null
    const video = cam.videoRef.current
    if (video.videoWidth === 0 || video.videoHeight === 0) return null

    const canvas = document.createElement('canvas')
    canvas.width = Math.min(video.videoWidth, 320)
    canvas.height = Math.min(video.videoHeight, 240)
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  }, [cam.videoRef])

  const tick = useCallback(() => {
    animRef.current = requestAnimationFrame(tick)

    const elapsed = (Date.now() - startTimeRef.current) / 1000
    tickCountRef.current++

    // 当前大师帧
    const masterIdx = store.currentFrameIndex
    const masterFrame = MASTER_SEQUENCE[masterIdx] ?? MASTER_SEQUENCE[0]

    // 摄像头运动检测 — 每 2 tick 采样一次 (更快响应)
    const curFrame = tickCountRef.current % 2 === 0 ? captureImageData() : null
    const { landmarks, motionZones } = sampleFrameForMotion(
      prevFrameRef.current,
      curFrame,
      masterFrame.landmarks,
      store.poseScore || 50,
    )
    if (curFrame) prevFrameRef.current = curFrame

    // 和大师帧比对评分
    const rawScore = comparePoses(landmarks, masterFrame.landmarks)

    // 运动量加成：运动越大的区域得越多
    const maxMotion = Math.max(...motionZones, 1)
    const topZones = motionZones.filter(v => v > maxMotion * 0.4).length
    const motionBonus = topZones >= 2 ? 12 : topZones >= 1 ? 6 : 2

    const poseScore = Math.round(Math.min(99, rawScore + motionBonus + Math.sin(elapsed * 0.3) * 5))
    const audioScore = Math.round(55 + Math.sin(elapsed * 0.7) * 15 + Math.cos(elapsed * 1.1) * 10)
    const compositeScore = Math.round(poseScore * 0.6 + audioScore * 0.4)

    // 平滑分数（用最近 5 帧平均）
    scoreHistoryRef.current.push(compositeScore)
    if (scoreHistoryRef.current.length > 5) scoreHistoryRef.current.shift()
    const smoothScore = Math.round(scoreHistoryRef.current.reduce((a, b) => a + b, 0) / scoreHistoryRef.current.length)

    store.setRecognitionData({
      landmarks,
      poseScore,
      audioScore,
      compositeScore: smoothScore,
      suggestion: AUDIO_SUGGESTIONS[Math.floor(elapsed * 1.5) % AUDIO_SUGGESTIONS.length],
    })

    // 每 3 tick 检查一次等级递进（更频繁）
    if (tickCountRef.current % 3 === 0) {
      store.checkProgression(smoothScore)
    }
  }, [store, captureImageData])

  const start = useCallback(async () => {
    const sid = `sess_${Date.now()}`
    store.start(sid)
    await cam.startCamera()
    await mic.startMic()
    startTimeRef.current = Date.now()
    tickCountRef.current = 0
    prevFrameRef.current = null
    scoreHistoryRef.current = []
    animRef.current = requestAnimationFrame(tick)
  }, [cam, mic, tick])

  const pause = useCallback(() => {
    store.pause()
    cancelAnimationFrame(animRef.current)
  }, [store])

  const resume = useCallback(() => {
    store.resume()
    animRef.current = requestAnimationFrame(tick)
  }, [tick])

  const stop = useCallback(() => {
    store.stop()
    cam.stopCamera()
    mic.stopMic()
    cancelAnimationFrame(animRef.current)
    prevFrameRef.current = null
  }, [cam, mic])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current)
      cam.stopCamera()
      mic.stopMic()
    }
  }, [])

  return { ...cam, ...mic, start, pause, resume, stop, isRunning: store.isRunning, sessionId: store.sessionId }
}
