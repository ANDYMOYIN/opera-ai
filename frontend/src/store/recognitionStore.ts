import { create } from 'zustand'
import { MASTER_SEQUENCE, LEVELS, comparePoses, type MasterFrame } from '../utils/masterPoses'

interface Landmark {
  x: number; y: number; z: number; visibility: number
}

interface RecognitionState {
  isRunning: boolean
  isPaused: boolean
  sessionId: string
  poseScore: number
  audioScore: number
  compositeScore: number
  landmarks: Landmark[]
  suggestion: string
  // 大师动作递进系统
  currentFrameIndex: number      // 当前大师帧编号
  currentThreshold: number       // 当前过关阈值百分比
  currentLevel: string           // 当前等级名称
  currentLevelDesc: string       // 当前等级描述
  masterLandmarks: Landmark[]    // 当前大师帧的关键点
  masterFrameName: string        // 当前大师帧名称
  masterFrameDesc: string        // 当前大师帧描述
  consecutivePasses: number      // 连续通过次数
  start: (sessionId: string) => void
  pause: () => void
  resume: () => void
  stop: () => void
  setRecognitionData: (data: {
    landmarks: Landmark[]
    poseScore: number
    audioScore: number
    compositeScore: number
    suggestion: string
  }) => void
  /** 检查分数是否达到阈值，自动前进 */
  checkProgression: (score: number) => void
  /** 手动跳转到指定帧 */
  jumpToFrame: (index: number) => void
  resetProgression: () => void
}

function frameState(idx: number) {
  const frame: MasterFrame = MASTER_SEQUENCE[idx] ?? MASTER_SEQUENCE[0]
  const level = LEVELS.find(l => l.pct === frame.threshold) ?? LEVELS[0]
  return {
    currentFrameIndex: idx,
    currentThreshold: frame.threshold,
    currentLevel: frame.level,
    currentLevelDesc: level.desc,
    masterLandmarks: frame.landmarks,
    masterFrameName: frame.name,
    masterFrameDesc: frame.description,
  }
}

export const useRecognitionStore = create<RecognitionState>((set, get) => ({
  isRunning: false,
  isPaused: false,
  sessionId: '',
  poseScore: 0,
  audioScore: 0,
  compositeScore: 0,
  landmarks: [],
  suggestion: '',
  currentFrameIndex: 0,
  currentThreshold: 0,
  currentLevel: '初学入门',
  currentLevelDesc: '起步阶段',
  masterLandmarks: MASTER_SEQUENCE[0].landmarks,
  masterFrameName: MASTER_SEQUENCE[0].name,
  masterFrameDesc: MASTER_SEQUENCE[0].description,
  consecutivePasses: 0,

  start: (sessionId) => {
    const init = frameState(0)
    set({
      isRunning: true, isPaused: false, sessionId,
      poseScore: 0, audioScore: 0, compositeScore: 0,
      suggestion: '', consecutivePasses: 0,
      ...init,
    })
  },

  pause: () => set({ isPaused: true }),
  resume: () => set({ isPaused: false }),
  stop: () => set({ isRunning: false, isPaused: false }),

  setRecognitionData: (data) => set({
    landmarks: data.landmarks,
    poseScore: data.poseScore,
    audioScore: data.audioScore,
    compositeScore: data.compositeScore,
    suggestion: data.suggestion,
  }),

  checkProgression: (score) => {
    const { currentFrameIndex, consecutivePasses } = get()
    const frame = MASTER_SEQUENCE[currentFrameIndex]
    if (!frame || frame.threshold === 0) return // 起式不递进

    if (score >= frame.threshold) {
      const newPasses = consecutivePasses + 1
      // 连续2次达标即推进，让递进感受更即时
      if (newPasses >= 2) {
        const nextIdx = Math.min(currentFrameIndex + 1, MASTER_SEQUENCE.length - 1)
        // 如果已经是最后一帧则循环回第 1 帧
        const loopedIdx = currentFrameIndex >= MASTER_SEQUENCE.length - 1 ? 0 : nextIdx
        set({ ...frameState(loopedIdx), consecutivePasses: 0 })
      } else {
        set({ consecutivePasses: newPasses })
      }
    } else {
      set({ consecutivePasses: 0 })
    }
  },

  jumpToFrame: (idx) => {
    const clamped = Math.max(0, Math.min(idx, MASTER_SEQUENCE.length - 1))
    set({
      ...frameState(clamped),
      consecutivePasses: 0,
    })
  },

  resetProgression: () => {
    set({
      ...frameState(0),
      consecutivePasses: 0,
    })
  },
}))
