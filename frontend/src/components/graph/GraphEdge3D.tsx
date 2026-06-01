import { Html } from '@react-three/drei'

interface Props {
  start: [number, number, number]
  end: [number, number, number]
  label: string
}

export default function GraphEdge3D({ start, end, label }: Props) {
  const midX = (start[0] + end[0]) / 2
  const midY = (start[1] + end[1]) / 2
  const midZ = (start[2] + end[2]) / 2

  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array([...start, ...end])}
            itemSize={3}
            count={2}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#8a7a6a" transparent opacity={0.3} />
      </line>
      <Html position={[midX, midY, midZ]} center distanceFactor={10}>
        <span style={{
          color: '#8a7a6a',
          fontSize: 8,
          fontFamily: 'sans-serif',
          background: 'rgba(13, 10, 8, 0.7)',
          padding: '1px 4px',
          borderRadius: 4,
          whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
      </Html>
    </group>
  )
}
