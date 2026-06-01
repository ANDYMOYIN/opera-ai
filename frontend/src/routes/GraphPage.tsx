import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGraphStore } from '../store'
import KnowledgeGraph3D from '../components/graph/KnowledgeGraph3D'

export default function GraphPage() {
  const { nodes, edges, loading, loadGraph } = useGraphStore()

  useEffect(() => { loadGraph() }, [loadGraph])

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ fontSize: 28, color: '#d4a843', margin: 0, fontFamily: 'var(--font-opera)' }}
      >
        知识图谱
      </motion.h1>
      <div style={{
        flex: 1,
        background: 'rgba(26, 18, 16, 0.4)',
        borderRadius: 12,
        border: '1px solid rgba(212, 168, 67, 0.15)',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        {loading && !nodes.length ? (
          <div style={{
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#8a7a6a', fontSize: 16, fontFamily: 'var(--font-opera)',
          }}>
            加载图谱数据...
          </div>
        ) : (
          <KnowledgeGraph3D />
        )}
      </div>
    </div>
  )
}
