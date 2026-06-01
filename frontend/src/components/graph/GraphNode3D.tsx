import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { CATEGORY_COLORS_3D } from '../../utils/constants'

interface Props {
  id: string
  name: string
  category: string
  position: [number, number, number]
  onSelect: (id: string) => void
  isSelected: boolean
}

export default function GraphNode3D({ id, name, category, position, onSelect, isSelected }: Props) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const color = CATEGORY_COLORS_3D[category] || '#d4a843'

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    meshRef.current.scale.setScalar(
      THREE.MathUtils.lerp(meshRef.current.scale.x, hovered || isSelected ? 1.3 : 1, 0.1)
    )
  })

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onSelect(id) }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.8 : 0.3}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      {/* Outer glow ring */}
      {(hovered || isSelected) && (
        <mesh>
          <ringGeometry args={[0.3, 0.35, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* Label */}
      <Html position={[0, -0.45, 0]} center distanceFactor={8}>
        <div style={{
          color: '#f5f0e8',
          fontSize: 10,
          fontFamily: 'var(--font-opera)',
          whiteSpace: 'nowrap',
          textShadow: '0 0 6px rgba(0,0,0,0.8)',
          pointerEvents: 'none',
        }}>
          {name}
        </div>
      </Html>
    </group>
  )
}
