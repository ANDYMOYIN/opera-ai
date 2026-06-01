import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CameraPanel from './CameraPanel'
import MicPanel from './MicPanel'
import ComparisonView from './ComparisonView'
import FeedbackPanel from './FeedbackPanel'
import { useRecognition } from '../../hooks/useRecognition'
import { useRecognitionStore } from '../../store'
import { API_BASE } from '../../utils/constants'

interface ScriptTier {
  id: string
  name: string
  children: ScriptTier[]
}

export default function PerformanceStudio() {
  const { start, pause, resume, stop, videoRef } = useRecognition()
  const { isRunning, isPaused } = useRecognitionStore()
  const [tiers, setTiers] = useState<ScriptTier[]>([])
  const [selCat, setSelCat] = useState('')
  const [selPlay, setSelPlay] = useState('')
  const [selAct, setSelAct] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/scripts/tiers`).then(r => r.json()).then(setTiers)
  }, [])

  const cat = tiers.find(t => t.id === selCat)
  const play = cat?.children?.find(p => p.id === selPlay)
  const actLabel = play?.children?.find(a => a.id === selAct)?.name
  const ready = selCat && selPlay && selAct
  const noScript = !isRunning && !ready

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{
          fontSize: 28, color: '#d4a843', fontFamily: 'var(--font-opera)', margin: 0, flex: 1,
        }}>
          传习工坊
        </h1>

        {/* Script selector */}
        {!isRunning && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                padding: '8px 14px',
                background: ready ? 'rgba(45,139,110,0.2)' : 'rgba(196,30,58,0.1)',
                border: `1px solid ${ready ? 'rgba(45,139,110,0.4)' : 'rgba(196,30,58,0.3)'}`,
                borderRadius: 8,
                color: ready ? '#2d8b6e' : '#c41e3a',
                fontSize: 13,
                fontFamily: 'var(--font-opera)',
                cursor: 'pointer',
                minWidth: 180,
                textAlign: 'left',
              }}
            >
              {ready ? `${cat?.name} · ${play?.name} · ${actLabel}` : '选择练唱剧本 ▲'}
            </button>
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute', top: 40, right: 0,
                    zIndex: 50,
                    display: 'flex', gap: 8,
                    background: 'rgba(26,18,16,0.97)',
                    border: '1px solid rgba(212,168,67,0.3)',
                    borderRadius: 12,
                    padding: 12,
                    backdropFilter: 'blur(12px)',
                    minWidth: 500,
                  }}
                >
                  {/* Tier 1 */}
                  <div style={{ width: 120 }}>
                    <div style={{ color: '#8a7a6a', fontSize: 10, marginBottom: 6 }}>剧种</div>
                    {tiers.map(t => (
                      <div key={t.id}
                        onClick={() => { setSelCat(t.id); setSelPlay(''); setSelAct('') }}
                        style={{
                          padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 13,
                          fontFamily: 'var(--font-opera)',
                          color: selCat === t.id ? '#d4a843' : '#8a7a6a',
                          background: selCat === t.id ? 'rgba(212,168,67,0.15)' : 'transparent',
                          marginBottom: 2,
                        }}
                      >{t.name}</div>
                    ))}
                  </div>
                  {/* Tier 2 */}
                  {cat && (
                    <div style={{ width: 140, borderLeft: '1px solid rgba(212,168,67,0.2)', paddingLeft: 8 }}>
                      <div style={{ color: '#8a7a6a', fontSize: 10, marginBottom: 6 }}>剧目</div>
                      {cat.children?.map(p => (
                        <div key={p.id}
                          onClick={() => { setSelPlay(p.id); setSelAct('') }}
                          style={{
                            padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 13,
                            fontFamily: 'var(--font-opera)',
                            color: selPlay === p.id ? '#c41e3a' : '#8a7a6a',
                            background: selPlay === p.id ? 'rgba(196,30,58,0.15)' : 'transparent',
                            marginBottom: 2,
                          }}
                        >{p.name}</div>
                      ))}
                    </div>
                  )}
                  {/* Tier 3 */}
                  {play && (
                    <div style={{ width: 140, borderLeft: '1px solid rgba(212,168,67,0.2)', paddingLeft: 8 }}>
                      <div style={{ color: '#8a7a6a', fontSize: 10, marginBottom: 6 }}>场次</div>
                      {play.children?.map(a => (
                        <div key={a.id}
                          onClick={() => { setSelAct(a.id); setDropdownOpen(false) }}
                          style={{
                            padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 13,
                            fontFamily: 'var(--font-opera)',
                            color: selAct === a.id ? '#2d8b6e' : '#8a7a6a',
                            background: selAct === a.id ? 'rgba(45,139,110,0.15)' : 'transparent',
                            marginBottom: 2,
                          }}
                        >{a.name}</div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Control buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          {!isRunning ? (
            <ControlButton label="开始识别" color="#c41e3a" onClick={() => { if (ready) start() }} disabled={noScript} />
          ) : isPaused ? (
            <ControlButton label="继续" color="#2d8b6e" onClick={resume} />
          ) : (
            <ControlButton label="暂停" color="#d4a843" onClick={pause} />
          )}
          {isRunning && <ControlButton label="停止" color="#8a7a6a" onClick={stop} />}
        </div>
      </div>

      {/* Studio grid */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 12,
        minHeight: 0,
      }}>
        <div style={{ background: 'rgba(26, 18, 16, 0.4)', borderRadius: 12, overflow: 'hidden' }}>
          <CameraPanel videoRef={videoRef} />
        </div>
        <div style={{ background: 'rgba(26, 18, 16, 0.4)', borderRadius: 12, overflow: 'hidden' }}>
          <MicPanel />
        </div>
        <div style={{ background: 'rgba(26, 18, 16, 0.4)', borderRadius: 12, overflow: 'hidden', minHeight: 0 }}>
          <ComparisonView />
        </div>
        <div style={{ background: 'rgba(26, 18, 16, 0.4)', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(212,168,67,0.15)' }}>
          <FeedbackPanel />
        </div>
      </div>

    </div>
  )
}

function ControlButton({ label, color, onClick, disabled }: { label: string; color: string; onClick: () => void; disabled?: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={disabled ? undefined : onClick}
      style={{
        padding: '8px 20px',
        background: disabled ? '#333' : color,
        border: 'none',
        borderRadius: 8,
        color: disabled ? '#555' : '#f5f0e8',
        fontSize: 14,
        fontFamily: 'var(--font-opera)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 'bold',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </motion.button>
  )
}
