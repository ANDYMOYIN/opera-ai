import { create } from 'zustand'
import { API_BASE } from '../utils/constants'

interface GraphNode {
  id: string
  name: string
  category: string
  properties: Record<string, string>
}

interface GraphEdge {
  source: string
  target: string
  label: string
}

interface GraphState {
  fullNodes: GraphNode[]
  fullEdges: GraphEdge[]
  nodes: GraphNode[]
  edges: GraphEdge[]
  selectedNode: string | null
  loading: boolean
  focusMode: boolean        // true = 只显示选中节点的邻居子图
  loadGraph: () => Promise<void>
  selectNode: (id: string | null) => void
  expandNeighbors: (id: string) => Promise<void>
  showAll: () => void
  searchNodes: (q: string) => Promise<void>
}

export const useGraphStore = create<GraphState>((set, get) => ({
  fullNodes: [],
  fullEdges: [],
  nodes: [],
  edges: [],
  selectedNode: null,
  loading: false,
  focusMode: false,

  loadGraph: async () => {
    set({ loading: true })
    try {
      const res = await fetch(`${API_BASE}/graph/full`)
      const data = await res.json()
      const ns = data.nodes || []
      const es = data.edges || []
      set({ fullNodes: ns, fullEdges: es, nodes: ns, edges: es, loading: false, focusMode: false })
    } catch (e) {
      console.error('Failed to load graph:', e)
      set({ loading: false })
    }
  },

  selectNode: (id) => set({ selectedNode: id }),

  // "展开关联" — 切换到聚焦子图模式
  expandNeighbors: async (nodeId) => {
    set({ loading: true })
    try {
      const { fullNodes, fullEdges } = get()

      // 从全图数据中提取邻居子图
      const neighborIds = new Set<string>([nodeId])
      const subEdges: GraphEdge[] = []
      for (const e of fullEdges) {
        if (e.source === nodeId || e.target === nodeId) {
          neighborIds.add(e.source)
          neighborIds.add(e.target)
          subEdges.push(e)
        }
      }
      const subNodes = fullNodes.filter(n => neighborIds.has(n.id))

      if (subNodes.length > 1) {
        set({ nodes: subNodes, edges: subEdges, focusMode: true, loading: false })
      } else {
        set({ loading: false })
      }
    } catch (e) {
      console.error('Failed to expand neighbors:', e)
      set({ loading: false })
    }
  },

  // "显示全部" — 回到全景图
  showAll: () => {
    const { fullNodes, fullEdges } = get()
    set({ nodes: fullNodes, edges: fullEdges, focusMode: false })
  },

  searchNodes: async (q) => {
    if (!q) return
    set({ loading: true })
    try {
      const res = await fetch(`${API_BASE}/graph/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data.length > 0) {
        // 搜索结果：显示匹配节点，自动展开它们的关系
        const srchIds = new Set(data.map((n: GraphNode) => n.id))
        const { fullEdges } = get()
        const subEdges = fullEdges.filter(e => srchIds.has(e.source) || srchIds.has(e.target))
        const subIds = new Set<string>()
        subEdges.forEach(e => { subIds.add(e.source); subIds.add(e.target) })
        data.forEach((n: GraphNode) => subIds.add(n.id))
        const subNodes = get().fullNodes.filter(n => subIds.has(n.id))
        set({
          nodes: subNodes, edges: subEdges,
          selectedNode: data[0].id,
          focusMode: true, loading: false,
        })
      } else {
        set({ loading: false })
      }
    } catch (e) {
      console.error('Failed to search:', e)
      set({ loading: false })
    }
  },
}))
