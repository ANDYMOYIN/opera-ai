import { Canvas } from '@react-three/fiber'
import SkeletonOverlay from './SkeletonOverlay'
import { useRecognitionStore } from '../../store'

export default function ComparisonView() {
  const landmarks = useRecognitionStore(s => s.landmarks)
  const masterLandmarks = useRecognitionStore(s => s.masterLandmarks)
  const masterFrameName = useRecognitionStore(s => s.masterFrameName)
  const masterFrameDesc = useRecognitionStore(s => s.masterFrameDesc)

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'grid', gridTemplateColumns: '1fr 1fr',
    }}>
      {/* User skeleton */}
      <div style={{ position: 'relative', borderRight: '1px solid rgba(212,168,67,0.1)' }}>
        <Canvas camera={{ position: [0, 0.2, 2.5], fov: 45 }}>
          <ambientLight intensity={0.4} />
          <SkeletonOverlay landmarks={landmarks} color="#c41e3a" />
        </Canvas>
        <div style={{
          position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
          color: '#c41e3a', fontSize: 11, fontFamily: 'var(--font-opera)',
          background: 'rgba(13,10,8,0.6)', padding: '2px 8px', borderRadius: 4,
        }}>
          你的动作
        </div>
      </div>

      {/* Master skeleton */}
      <div style={{ position: 'relative' }}>
        <Canvas camera={{ position: [0, 0.2, 2.5], fov: 45 }}>
          <ambientLight intensity={0.4} />
          <SkeletonOverlay landmarks={masterLandmarks} color="#d4a843" />
        </Canvas>
        <div style={{
          position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
          color: '#d4a843', fontSize: 11, fontFamily: 'var(--font-opera)',
          background: 'rgba(13,10,8,0.6)', padding: '2px 8px', borderRadius: 4,
          textAlign: 'center',
          maxWidth: '90%',
        }}>
          {masterFrameName}
        </div>
        <div style={{
          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
          color: '#8a7a6a', fontSize: 9, fontFamily: 'var(--font-opera)',
          maxWidth: '85%', textAlign: 'center', lineHeight: 1.4,
        }}>
          {masterFrameDesc.substring(0, 40)}
        </div>
      </div>
    </div>
  )
}
