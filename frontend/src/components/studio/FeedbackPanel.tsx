import { motion, AnimatePresence } from 'framer-motion'
import { useRecognitionStore } from '../../store'
import { MASTER_SEQUENCE, LEVELS } from '../../utils/masterPoses'

export default function FeedbackPanel() {
  const {
    poseScore, audioScore, compositeScore, suggestion,
    currentFrameIndex, currentThreshold, currentLevel,
    masterFrameName, masterFrameDesc,
    consecutivePasses,
    jumpToFrame, resetProgression,
  } = useRecognitionStore()

  const scorePercent = Math.round(compositeScore)
  const scoreColor = scorePercent >= currentThreshold
    ? '#2d8b6e'
    : scorePercent >= currentThreshold - 15
      ? '#d4a843'
      : '#c41e3a'
  const passReady = scorePercent >= currentThreshold && currentThreshold > 0

  const progressPercent = Math.round((currentFrameIndex / (MASTER_SEQUENCE.length - 1)) * 100)
  const totalFrames = MASTER_SEQUENCE.length

  return (
    <div style={{
      width: '100%', height: '100%',
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      overflow: 'auto',
    }}>
      {/* 当前等级 + 动作名 */}
      <div style={{
        textAlign: 'center',
        padding: '6px 14px',
        background: passReady ? 'rgba(45,139,110,0.15)' : 'rgba(212,168,67,0.08)',
        border: `1px solid ${passReady ? 'rgba(45,139,110,0.4)' : 'rgba(212,168,67,0.2)'}`,
        borderRadius: 16,
      }}>
        <div style={{ color: '#8a7a6a', fontSize: 9, letterSpacing: '0.1em' }}>
          {currentLevel} · 第 {currentFrameIndex + 1}/{totalFrames} 帧
        </div>
        <div style={{
          color: passReady ? '#2d8b6e' : '#d4a843',
          fontSize: 13, fontWeight: 'bold',
          fontFamily: 'var(--font-opera)',
        }}>
          {masterFrameName}
        </div>
      </div>

      {/* Score Ring */}
      <div style={{ position: 'relative', width: 100, height: 100 }}>
        <svg width="100" height="100" viewBox="0 0 120 120">
          {/* Background */}
          <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          {/* Threshold marker */}
          <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(212,168,67,0.2)" strokeWidth="2"
            strokeDasharray={`${currentThreshold * 2.76} 276`}
            transform="rotate(-90 60 60)" />
          {/* Score arc */}
          <motion.circle
            cx="60" cy="60" r="48" fill="none" stroke={scoreColor} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${scorePercent * 3.01} 301`}
            transform="rotate(-90 60 60)"
            initial={{ strokeDasharray: '0 301' }}
            animate={{ strokeDasharray: `${scorePercent * 3.01} 301` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: scoreColor, fontWeight: 'bold',
        }}>
          <span style={{ fontSize: 24 }}>{scorePercent}</span>
          <span style={{ fontSize: 9, color: '#8a7a6a' }}>
            目标 {currentThreshold || '--'}
          </span>
        </div>
      </div>

      {/* Sub-scores */}
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#c41e3a', fontSize: 16, fontWeight: 'bold' }}>{Math.round(poseScore)}</div>
          <div style={{ color: '#8a7a6a', fontSize: 10 }}>身段</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#d4a843', fontSize: 16, fontWeight: 'bold' }}>{Math.round(audioScore)}</div>
          <div style={{ color: '#8a7a6a', fontSize: 10 }}>唱腔</div>
        </div>
      </div>

      {/* Progression bar */}
      <div style={{ width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#8a7a6a', marginBottom: 2 }}>
          {LEVELS.map(l => (
            <span key={l.name}
              style={{
                color: currentLevel === l.name ? l.color : '#5a4a3a',
                fontWeight: currentLevel === l.name ? 'bold' : 'normal',
              }}>
              {l.name}
            </span>
          ))}
        </div>
        <div style={{
          height: 4, background: 'rgba(255,255,255,0.06)',
          borderRadius: 2, overflow: 'hidden',
        }}>
          <motion.div
            animate={{ width: `${Math.min(100, (1 + currentFrameIndex) / totalFrames * 100)}%` }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #9b59b6, #3498db, #2d8b6e, #f39c12, #e74c3c)', borderRadius: 2 }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Suggestion + Pass progress */}
      <AnimatePresence mode="wait">
        {passReady && currentThreshold > 0 ? (
          <motion.div
            key="pass"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: 'rgba(45,139,110,0.12)',
              border: '1px solid rgba(45,139,110,0.3)',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 11, color: '#2d8b6e',
              fontFamily: 'var(--font-opera)',
              textAlign: 'center',
            }}>
            <div style={{ marginBottom: 2 }}>
              {consecutivePasses >= 2 ? '✓ 过关！正在进入下一动作' : `达标 ${consecutivePasses}/2 次 · 再坚持一下`}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
              {[0, 1].map(idx => (
                <div key={idx} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: idx < consecutivePasses ? '#2d8b6e' : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(45,139,110,0.3)',
                }} />
              ))}
            </div>
          </motion.div>
        ) : suggestion ? (
          <motion.div
            key="hint"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(212,168,67,0.06)',
              border: '1px solid rgba(212,168,67,0.12)',
              borderRadius: 6,
              padding: '5px 8px',
              color: '#e8dcc8', fontSize: 10, lineHeight: 1.5,
              fontFamily: 'var(--font-opera)', textAlign: 'center', maxWidth: 240,
            }}>
            {suggestion}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Frame nav buttons */}
      <div style={{ display: 'flex', gap: 4 }}>
        <NavBtn label="◀" disabled={currentFrameIndex === 0}
          onClick={() => jumpToFrame(currentFrameIndex - 1)} />
        <NavBtn label="起" onClick={resetProgression} />
        <NavBtn label="▶"
          disabled={currentFrameIndex >= totalFrames - 1}
          onClick={() => jumpToFrame(currentFrameIndex + 1)} />
      </div>
    </div>
  )
}

function NavBtn({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        width: 28, height: 24,
        background: disabled ? 'rgba(255,255,255,0.03)' : 'rgba(212,168,67,0.08)',
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.05)' : 'rgba(212,168,67,0.2)'}`,
        borderRadius: 6,
        color: disabled ? '#3a3a3a' : '#d4a843',
        fontSize: 11, cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
      {label}
    </button>
  )
}
