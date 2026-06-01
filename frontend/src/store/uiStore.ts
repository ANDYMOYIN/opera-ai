import { create } from 'zustand'

interface ImportResult {
  filename: string
  kind: 'audio' | 'video' | 'image'
  features: Record<string, string>
  plots?: Record<string, string>
  plot?: string
  plots_angle?: string
  opera_params?: Record<string, string | number>
  error?: string
  id?: string
}

interface UIState {
  sidebarOpen: boolean
  activeRoute: string
  loading: boolean
  notification: string
  importResult: ImportResult | null
  importModalOpen: boolean
  toggleSidebar: () => void
  setActiveRoute: (route: string) => void
  setLoading: (v: boolean) => void
  notify: (msg: string) => void
  setImportResult: (r: ImportResult | null) => void
  openImportModal: () => void
  closeImportModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeRoute: '/studio',
  loading: false,
  notification: '',
  importResult: null,
  importModalOpen: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveRoute: (route) => set({ activeRoute: route }),
  setLoading: (v) => set({ loading: v }),
  notify: (msg) => {
    set({ notification: msg })
    setTimeout(() => set({ notification: '' }), 3000)
  },
  setImportResult: (r) => set({ importResult: r }),
  openImportModal: () => set({ importModalOpen: true }),
  closeImportModal: () => set({ importModalOpen: false }),
}))
