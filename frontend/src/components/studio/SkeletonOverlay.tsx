import { useMemo } from 'react'

interface Landmark {
  x: number
  y: number
  z: number
  visibility: number
}

const POSE_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 7],  // face + left arm
  [0, 4], [4, 5], [5, 6], [6, 8],  // right arm
  [9, 10],                          // shoulders
  [11, 12],                         // hips
  [11, 13], [13, 15],              // left leg
  [12, 14], [14, 16],              // right leg
  [11, 23], [12, 24],              // torso
  [23, 24], [23, 25], [24, 26],    // lower body
  [25, 27], [27, 29], [27, 31],    // left foot
  [26, 28], [28, 30], [28, 32],    // right foot
]

export default function SkeletonOverlay({ landmarks, color = '#c41e3a' }: { landmarks: Landmark[]; color?: string }) {
  const points = useMemo(() => {
    if (!landmarks.length) return []
    return landmarks.map(l => ({
      x: (l.x - 0.5) * 3,
      y: -(l.y - 0.5) * 3,
      z: l.z * 3,
      v: l.visibility,
    }))
  }, [landmarks])

  if (points.length === 0) return null

  return (
    <group>
      {/* Joint spheres */}
      {points.map((p, i) => (
        p.v > 0.5 ? (
          <mesh key={`j-${i}`} position={[p.x, p.y, p.z]}>
            <sphereGeometry args={[0.03, 12, 12]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
          </mesh>
        ) : null
      ))}
      {/* Connection lines */}
      {POSE_CONNECTIONS.map(([a, b], i) => {
        const pa = points[a]
        const pb = points[b]
        if (!pa || !pb || pa.v < 0.3 || pb.v < 0.3) return null
        return (
          <line key={`l-${i}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={new Float32Array([pa.x, pa.y, pa.z, pb.x, pb.y, pb.z])}
                itemSize={3}
                count={2}
              />
            </bufferGeometry>
            <lineBasicMaterial color={color} transparent opacity={0.6} />
          </line>
        )
      })}
    </group>
  )
}
