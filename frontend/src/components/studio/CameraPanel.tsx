import { useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import SkeletonOverlay from './SkeletonOverlay'
import { useRecognitionStore } from '../../store'

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>
}

export default function CameraPanel({ videoRef }: Props) {
  const landmarks = useRecognitionStore(s => s.landmarks)

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid rgba(212, 168, 67, 0.15)',
      background: '#0d0a08',
    }}>
      {/* Real video feed — mirrored for natural self-view */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
          opacity: 0.8,
        }}
      />
      {/* 3D skeleton overlay on top of video */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Canvas camera={{ position: [0, 0, 2], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[2, 2, 2]} intensity={0.8} color="#d4a843" />
          <SkeletonOverlay landmarks={landmarks.length > 0 ? landmarks : _defaultPose()} color="#c41e3a" />
          <OrbitControls enableZoom={true} enablePan={true} />
        </Canvas>
      </div>
      {/* Info label */}
      <div style={{
        position: 'absolute', bottom: 8, left: 12,
        color: '#8a7a6a', fontSize: 12, fontFamily: 'var(--font-opera)',
        background: 'rgba(13,10,8,0.6)', padding: '2px 8px', borderRadius: 4,
      }}>
        {landmarks.length >= 15 ? `实时姿态 · ${landmarks.length} 关键点` : '等待识别...'}
      </div>
    </div>
  )
}

function _defaultPose() {
  const pts = []
  for (let i = 0; i < 33; i++) {
    pts.push({
      x: 0.45 + Math.sin(i * 0.5) * 0.15 + (Math.random() - 0.5) * 0.02,
      y: 0.15 + i * 0.025 + (Math.random() - 0.5) * 0.02,
      z: (Math.random() - 0.5) * 0.05,
      visibility: 0.7 + Math.random() * 0.25,
    })
  }
  return pts
}
