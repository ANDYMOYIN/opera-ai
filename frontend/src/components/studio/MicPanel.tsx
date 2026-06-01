import { useRef, useEffect } from 'react'
import { useRecognitionStore } from '../../store'

export default function MicPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioScore = useRecognitionStore(s => s.audioScore)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = 0
    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      // Background
      ctx.fillStyle = '#0d0a08'
      ctx.fillRect(0, 0, w, h)

      // Simulated waveform
      ctx.beginPath()
      ctx.strokeStyle = '#d4a843'
      ctx.lineWidth = 2
      for (let i = 0; i < w; i++) {
        const t = Date.now() / 200 + i * 0.03
        const y = h / 2 + Math.sin(t) * (h / 3) * (0.3 + audioScore * 0.7)
        if (i === 0) ctx.moveTo(i, y)
        else ctx.lineTo(i, y)
      }
      ctx.stroke()

      // Glow effect
      ctx.shadowBlur = 10
      ctx.shadowColor = '#d4a843'
      ctx.stroke()
      ctx.shadowBlur = 0

      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animId)
  }, [audioScore])

  return (
    <div style={{
      width: '100%', height: '100%',
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid rgba(212, 168, 67, 0.15)',
      position: 'relative',
    }}>
      <canvas ref={canvasRef} width={400} height={200} style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute', bottom: 8, left: 12,
        color: '#8a7a6a', fontSize: 12, fontFamily: 'var(--font-opera)',
      }}>
        声腔波形 · 评分: {Math.round(audioScore * 100)}
      </div>
    </div>
  )
}
