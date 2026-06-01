import { motion } from 'framer-motion'
import DiagramViewer from '../components/diagrams/DiagramViewer'

export default function DiagramsPage() {
  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ fontSize: 28, color: '#d4a843', margin: 0, fontFamily: 'var(--font-opera)' }}
      >
        分析图表
      </motion.h1>
      <div style={{ flex: 1, minHeight: 0 }}>
        <DiagramViewer />
      </div>
    </div>
  )
}
