import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Particles({ count = 200 }: { count?: number }) {
  const meshRef = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6
    }
    return pos
  }, [count])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += delta * 0.015
    meshRef.current.rotation.x += delta * 0.005
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} itemSize={3} count={count} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#d4a843" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

export default function Background() {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0,
      width: '100vw', height: '100vh',
      zIndex: 0,
      pointerEvents: 'none',
    }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: false, alpha: true, preserveDrawingBuffer: false }}
        dpr={[1, 1.5]}
        performance={{ min: 0.3 }}
      >
        <color attach="background" args={['#0d0a08']} />
        <Particles count={200} />
      </Canvas>
    </div>
  )
}
