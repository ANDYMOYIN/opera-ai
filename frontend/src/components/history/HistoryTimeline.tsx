import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useHistoryStore } from '../../store'

export default function HistoryTimeline() {
  const { sessions, loading, loadHistory } = useHistoryStore()

  useEffect(() => { loadHistory() }, [loadHistory])

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingRight: 8 }}>
      {loading ? (
        <div style={{ color: '#8a7a6a', textAlign: 'center', marginTop: 40 }}>加载中...</div>
      ) : sessions.length === 0 ? (
        <div style={{
          color: '#8a7a6a', textAlign: 'center', marginTop: 60,
          fontSize: 16, fontFamily: 'var(--font-opera)',
        }}>
          尚无训练记录
          <br />
          <span style={{ fontSize: 13 }}>去传习工坊开始第一次练习吧</span>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 24 }}>
          {/* Timeline line */}
          <div style={{
            position: 'absolute', left: 8, top: 0, bottom: 0,
            width: 2, background: 'linear-gradient(to bottom, rgba(212,168,67,0.4), rgba(212,168,67,0.05))',
          }} />
          {sessions.map((s, i) => (
            <motion.div
              key={s.session_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                position: 'relative',
                padding: '12px 16px',
                marginBottom: 12,
                marginLeft: 16,
                background: 'rgba(26, 18, 16, 0.6)',
                borderRadius: 8,
                border: '1px solid rgba(212, 168, 67, 0.1)',
              }}
            >
              {/* Dot on timeline */}
              <div style={{
                position: 'absolute', left: -22, top: 16,
                width: 10, height: 10,
                borderRadius: '50%',
                background: s.composite_score > 0.7 ? '#2d8b6e' : s.composite_score > 0.4 ? '#d4a843' : '#c41e3a',
                border: '2px solid rgba(212, 168, 67, 0.3)',
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#f5f0e8', fontSize: 14, fontFamily: 'var(--font-opera)' }}>
                    {s.script_id}
                  </div>
                  <div style={{ color: '#8a7a6a', fontSize: 11, marginTop: 2 }}>
                    {s.created_at} · {Math.round(s.duration_seconds)}秒
                  </div>
                </div>
                <div style={{
                  color: '#d4a843', fontSize: 20, fontWeight: 'bold',
                  fontFamily: 'var(--font-opera)',
                }}>
                  {s.composite_score > 0 ? `${Math.round(s.composite_score * 100)}` : '--'}
                  <span style={{ fontSize: 12, color: '#8a7a6a' }}> 分</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
