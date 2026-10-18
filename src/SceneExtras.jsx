import { useMemo } from 'react'
import * as THREE from 'three'

// Deep space star field
export function Stars({ count = 4000 }) {
  const positions = useMemo(() => {
    const pos = []
    for (let i = 0; i < count; i++) {
      // Distribute stars in a sphere around the shuttle
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 80 + Math.random() * 200
      pos.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      )
    }
    return new Float32Array(pos)
  }, [count])

  // Vary star sizes for depth
  const sizes = useMemo(() => {
    const s = []
    for (let i = 0; i < count; i++) {
      s.push(0.4 + Math.random() * 1.2)
    }
    return new Float32Array(s)
  }, [count])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          array={sizes}
          count={count}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.9}
        color="#d4e8ff"
        sizeAttenuation
        transparent
        opacity={0.85}
      />
    </points>
  )
}
