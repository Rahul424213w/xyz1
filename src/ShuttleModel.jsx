import { useRef, useEffect } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from './scrollState'

/*
 * Flight path:
 * Starts in deep space on the upper right (z = -55, x = 22, y = 2.5)
 * Arrives in the foreground on the left (z = 0.5, x = -3.2, y = -0.6)
 */
const START = { x: 22.0, y:  2.5, z: -55.0 }
const END   = { x: -3.2, y: -0.6, z:   0.5 }

/*
 * Dynamic scale — larger shuttle:
 * - At START: clearly visible distant ship
 * - At END: big, majestic shuttle filling the foreground
 */
const START_SCALE = 0.16
const END_SCALE   = 0.30

const MODEL_CENTER = [-0.207, -1.370, -5.849]

// Scratch objects reused every frame (zero per-frame allocation)
const _dir  = new THREE.Vector3()
const _fwd  = new THREE.Vector3(0, 0, 1)
const _look = new THREE.Object3D()

export default function ShuttleModel({ onArrival }) {
  const group               = useRef()
  const innerGroup          = useRef()
  const engineGlow          = useRef()
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

  // High-quality material pass: stronger environment reflections, tuned metal/rough
  useEffect(() => {
    scene.traverse((o) => {
      if (!o.isMesh || !o.material) return
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      mats.forEach((m) => {
        if (!m) return
        if ('envMapIntensity' in m) m.envMapIntensity = 2.0
        if (m.metalness !== undefined) m.metalness = Math.min(1, m.metalness * 1.15)
        if (m.roughness !== undefined) m.roughness = Math.max(0.15, m.roughness * 0.9)
        m.needsUpdate = true
      })
    })
  }, [scene])

  // Sync refs on mount / replay and snap orientation to the flight path
  useEffect(() => {
    hasTriggeredArrival.current = false
    const p = scrollState.progress
    smooth.current = {
      x: START.x + p * (END.x - START.x),
      y: START.y + p * (END.y - START.y),
      z: START.z + p * (END.z - START.z),
    }
    smoothScale.current = START_SCALE + p * (END_SCALE - START_SCALE)

    _dir.set(END.x - START.x, END.y - START.y, END.z - START.z).normalize()
    _fwd.copy(_dir)
    // Nose points along local -Z, so aim local +Z opposite the travel direction
    _look.position.set(0, 0, 0)
    _look.up.set(0, 1, 0)
    _look.lookAt(-_dir.x, -_dir.y, -_dir.z)
    if (group.current) group.current.quaternion.copy(_look.quaternion)
  }, [])

  useFrame((state, delta) => {
    if (!group.current || !innerGroup.current) return

    const p = scrollState.progress
    const t = state.clock.elapsedTime

    // Frame-rate independent smoothing factors
    const kPos = 1 - Math.exp(-3.2 * delta)
    const kDir = 1 - Math.exp(-4.0 * delta)
    const kRot = 1 - Math.exp(-4.5 * delta)

    // Target position along flight path
    const targetX = START.x + p * (END.x - START.x)
    const targetY = START.y + p * (END.y - START.y)
    const targetZ = START.z + p * (END.z - START.z)

    // Travel direction (smoothed) drives orientation
    _dir.set(targetX - smooth.current.x, targetY - smooth.current.y, targetZ - smooth.current.z)

    // Smooth inertia lerp for position
    smooth.current.x += _dir.x * kPos
    smooth.current.y += _dir.y * kPos
    smooth.current.z += _dir.z * kPos

    // Gentle floating bob for a living, weightless feel
    const bob = Math.sin(t * 1.1) * 0.10 * (0.4 + 0.6 * p)
    group.current.position.set(smooth.current.x, smooth.current.y + bob, smooth.current.z)

    if (_dir.lengthSq() > 1e-8) {
      _dir.normalize()
      _fwd.lerp(_dir, kDir).normalize()
    }

    // Dynamic orientation: nose (local -Z) tracks the flight path,
    // with cinematic banking that levels out on arrival + subtle idle roll
    _look.position.set(0, 0, 0)
    _look.up.set(0, 1, 0)
    _look.lookAt(-_fwd.x, -_fwd.y, -_fwd.z)
    const bank = -0.35 * Math.sin(Math.PI * p) + Math.sin(t * 1.3) * 0.02
    _look.rotateZ(bank)
    group.current.quaternion.slerp(_look.quaternion, kRot)

    // Smooth lerp for scale (grows larger as it approaches)
    const targetScale = START_SCALE + p * (END_SCALE - START_SCALE)
    smoothScale.current += (targetScale - smoothScale.current) * kPos
    innerGroup.current.scale.setScalar(smoothScale.current)

    // Engine exhaust glow: pulses like a real thruster, brighter up close
    if (engineGlow.current) {
      engineGlow.current.intensity = (8 + 30 * p) * (0.85 + 0.15 * Math.sin(t * 14))
    }

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
     * Orientation is driven dynamically each frame:
     * - Nose points along the travel direction (local -Z)
     * - Dorsal fin stays up via world +Y up-vector
     * - Bank roll mid-flight, leveling out at the destination
     */
    <group
      ref={group}
      position={[START.x, START.y, START.z]}
      dispose={null}
    >
      {/* Warm engine exhaust glow behind the shuttle (local +Z = aft) */}
      <pointLight
        ref={engineGlow}
        position={[0, -0.4, 3.2]}
        color="#ff7a1a"
        intensity={10}
        distance={20}
        decay={2}
      />
      {/* Cool rim light for silhouette separation from deep space */}
      <pointLight
        position={[0, 1.5, -3.0]}
        color="#7fb2ff"
        intensity={2.5}
        distance={14}
        decay={2}
      />

      <group ref={innerGroup} scale={START_SCALE}>
        <primitive object={scene} position={MODEL_CENTER} />
      </group>
    </group>
  )
}

useGLTF.preload('/space_shuttle_discovery.glb')
