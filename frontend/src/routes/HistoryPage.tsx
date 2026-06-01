import { motion } from 'framer-motion'
import HistoryTimeline from '../components/history/HistoryTimeline'

export default function HistoryPage() {
  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ fontSize: 28, color: '#d4a843', margin: 0, fontFamily: 'var(--font-opera)' }}
      >
        学艺记录
      </motion.h1>
      <div style={{ flex: 1, minHeight: 0 }}>
        <HistoryTimeline />
      </div>
    </div>
  )
}
