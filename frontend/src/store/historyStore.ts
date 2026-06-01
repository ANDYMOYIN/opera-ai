import { create } from 'zustand'
import { API_BASE } from '../utils/constants'

interface SessionData {
  session_id: string
  script_id: string
  created_at: string
  composite_score: number
  duration_seconds: number
  status: string
}

interface HistoryState {
  sessions: SessionData[]
  progressCurve: number[]
  trend: string
  loading: boolean
  loadHistory: () => Promise<void>
  loadProgress: () => Promise<void>
}

export const useHistoryStore = create<HistoryState>((set) => ({
  sessions: [],
  progressCurve: [],
  trend: 'stable',
  loading: false,

  loadHistory: async () => {
    set({ loading: true })
    try {
      const res = await fetch(`${API_BASE}/history`)
      const data = await res.json()
      set({ sessions: data.items || [], loading: false })
    } catch (e) {
      console.error('Failed to load history:', e)
      set({ loading: false })
    }
  },

  loadProgress: async () => {
    try {
      const res = await fetch(`${API_BASE}/evaluation/progress`)
      const data = await res.json()
      set({ progressCurve: data.progress_curve || [], trend: data.trend })
    } catch (e) { console.error('Failed to load progress:', e) }
  },
}))
