import { create } from 'zustand'
import { API_BASE } from '../utils/constants'

interface ScriptTier {
  id: string
  name: string
  children: ScriptTier[]
}

interface ScriptDetail {
  id: string
  name: string
  category: string
  era: string
  difficulty: string
  description: string
  characters: string[]
  vocal_styles: string[]
  movements: string[]
  instruments: string[]
}

interface ScriptState {
  tiers: ScriptTier[]
  selectedCategory: string
  selectedPlay: string
  selectedAct: string
  scriptDetail: ScriptDetail | null
  loading: boolean
  loadTiers: () => Promise<void>
  selectCategory: (id: string) => void
  selectPlay: (id: string) => void
  selectAct: (id: string) => void
  loadDetail: (id: string) => Promise<void>
}

export const useScriptStore = create<ScriptState>((set) => ({
  tiers: [],
  selectedCategory: '',
  selectedPlay: '',
  selectedAct: '',
  scriptDetail: null,
  loading: false,

  loadTiers: async () => {
    try {
      const res = await fetch(`${API_BASE}/scripts/tiers`)
      const data = await res.json()
      set({ tiers: data })
    } catch (e) { console.error('Failed to load tiers:', e) }
  },

  selectCategory: (id) => set({ selectedCategory: id, selectedPlay: '', selectedAct: '', scriptDetail: null }),
  selectPlay: (id) => set({ selectedPlay: id, selectedAct: '', scriptDetail: null }),
  selectAct: (id) => set({ selectedAct: id }),

  loadDetail: async (id) => {
    set({ loading: true })
    try {
      const res = await fetch(`${API_BASE}/scripts/${id}`)
      const data = await res.json()
      set({ scriptDetail: data, loading: false })
    } catch (e) {
      console.error('Failed to load detail:', e)
      set({ loading: false })
    }
  },
}))
