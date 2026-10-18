import { useRef, useEffect } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { scrollState } from './scrollState'

/*
 * Flight path:
 * Starts in deep space on the upper right (z = -55, x = 22, y = 2.5)
 * Arrives in the foreground on the left (z = 0.5, x = -3.2, y = -0.6)
 * Perfectly framed with full nose, body, and engine fire visible
 */
const START = { x: 22.0, y:  2.5, z: -55.0 }
const END   = { x: -3.2, y: -0.6, z:   0.5 }

/*
 * Dynamic scale:
 * - At START: small, neat, and clearly visible with fiery exhaust ("small but litt big")
 * - As user scrolls: gets smoothly bigger
 * - At END: nice and big, majestic shuttle in the foreground
 */
const START_SCALE = 0.08
const END_SCALE   = 0.15

const MODEL_CENTER = [-0.207, -1.370, -5.849]

export default function ShuttleModel({ onArrival }) {
  const group               = useRef()
  const innerGroup          = useRef()
  const smooth              = useRef({ x: START.x, y: START.y, z: START.z })
  const smoothScale         = useRef(START_SCALE)
  const hasTriggeredArrival = useRef(false)

  const { scene, animations } = useGLTF('/space_shuttle_discovery.glb')
  const { actions } = useAnimations(animations, group)

  // Start embedded engine thruster animations
  useEffect(() => {
    if (actions) {
      Object.values(actions).forEach(a => a.play())
    }
  }, [actions])

  // Sync refs on mount / replay
  useEffect(() => {
    hasTriggeredArrival.current = false
    const p = scrollState.progress
    smooth.current = {
      x: START.x + p * (END.x - START.x),
      y: START.y + p * (END.y - START.y),
      z: START.z + p * (END.z - START.z),
    }
    smoothScale.current = START_SCALE + p * (END_SCALE - START_SCALE)
  }, [])

  useFrame(() => {
    if (!group.current || !innerGroup.current) return

    const p = scrollState.progress

    // Target position along flight path
    const targetX = START.x + p * (END.x - START.x)
    const targetY = START.y + p * (END.y - START.y)
    const targetZ = START.z + p * (END.z - START.z)

    // Smooth inertia lerp for position
    smooth.current.x += (targetX - smooth.current.x) * 0.05
    smooth.current.y += (targetY - smooth.current.y) * 0.05
    smooth.current.z += (targetZ - smooth.current.z) * 0.05

    group.current.position.set(smooth.current.x, smooth.current.y, smooth.current.z)

    // Smooth lerp for scale (grows larger as it approaches)
    const targetScale = START_SCALE + p * (END_SCALE - START_SCALE)
    smoothScale.current += (targetScale - smoothScale.current) * 0.05
    innerGroup.current.scale.setScalar(smoothScale.current)

    // Trigger arrival when user reaches destination
    if (p >= 0.96 && !hasTriggeredArrival.current) {
      if (Math.abs(smooth.current.x - END.x) < 0.6) {
        hasTriggeredArrival.current = true
        onArrival?.()
      }
    }
  })

  return (
    /*
     * Shuttle rotation aligned with motion direction:
     * - Ship nose/cockpit points directly toward where it is moving: [-0.43, -0.09, +0.90] (forward, left, down)
     * - Dorsal fin points up: [-0.04, 0.99, 0.10]
     * - Engines push from behind along the flight trajectory
     */
    <group
      ref={group}
      rotation={[0.10, 2.70, -0.05]}
      position={[START.x, START.y, START.z]}
      dispose={null}
    >
      <group ref={innerGroup} scale={START_SCALE}>
        <primitive object={scene} position={MODEL_CENTER} />
      </group>
    </group>
  )
}

useGLTF.preload('/space_shuttle_discovery.glb')
