import { useRef, useEffect } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from './scrollState'

const MODEL_CENTER = [-0.207, -1.370, -5.849]

// Scratch objects reused every frame (zero per-frame allocation)
const _dir  = new THREE.Vector3()
const _fwd  = new THREE.Vector3(0, 0, 1)
const _look = new THREE.Object3D()

/*
 * Dynamic, aspect-ratio-aware flight path:
 *
 * Camera:
 *   Position: [0, 0.5, 10], fov: 48 (vertical)
 *   tanHalfFov = Math.tan((48 / 2) * Math.PI / 180) ≈ 0.4452286853
 *
 * Visible bounds at depth z:
 *   dist = 10 - z
 *   halfHeight = dist * tanHalfFov
 *   halfWidth  = halfHeight * aspect
 *
 * Desktop (16:9, aspect ≈ 1.778):
 *   At START (z = -55): halfWidth ≈ 51.45. startX = 22.0 (~42.8% of halfWidth to the right).
 *   At END   (z = 0.5): halfWidth ≈ 7.52.  endX   = -3.2 (~42.5% of halfWidth to the left).
 *   Scale: 0.16 (start) -> 0.30 (end).
 *
 * Mobile (portrait, aspect ≈ 0.45 - 0.58):
 *   At START (z = -55): halfWidth ≈ 13.3.
 *     If fixed at 22.0, it is 65% OFF SCREEN to the right!
 *     By scaling proportionally (43% of halfWidth), startX ≈ 5.7.
 *     It is clearly visible in the upper-right of the mobile viewport right at the start.
 *     startY is positioned slightly higher (e.g. 3.8) to take advantage of the portrait height.
 *     startScale ≈ 0.13: small, sleek distant shuttle in deep space so user immediately knows it's there.
 *   At END (z = 0.5): halfWidth ≈ 1.95.
 *     endX = halfWidth * (-0.425) ≈ -0.83.
 *     endScale ≈ 0.25: big, majestic shuttle in the foreground without clipping screen edges.
 */
function getFlightParams(aspect) {
  const safeAspect = Math.max(0.35, Math.min(2.5, aspect || 1.778))
  const isMobile = safeAspect < 1.0

  const tanHalfFov = 0.4452286853 // Math.tan(24 deg)

  // Start at z = -55.0 (dist = 65.0)
  const distStart = 65.0
  const halfH_start = distStart * tanHalfFov
  const halfW_start = halfH_start * safeAspect

  // End at z = 0.5 (dist = 9.5)
  const distEnd = 9.5
  const halfH_end = distEnd * tanHalfFov
  const halfW_end = halfH_end * safeAspect

  const startX = halfW_start * 0.43
  const startY = isMobile ? 3.8 : 2.5
  const startZ = -55.0

  const endX = halfW_end * (-0.425)
  const endY = isMobile ? -0.55 : -0.6
  const endZ = 0.5

  const startScale = isMobile ? 0.13 : 0.16
  const endScale   = isMobile ? 0.25 : 0.30

  return {
    start: { x: startX, y: startY, z: startZ },
    end:   { x: endX,   y: endY,   z: endZ },
    startScale,
    endScale,
  }
}

export default function ShuttleModel({ onArrival }) {
  const group               = useRef()
  const innerGroup          = useRef()
  const engineGlow          = useRef()
  const hasTriggeredArrival = useRef(false)

  const { viewport } = useThree()
  const initialFlight = getFlightParams(viewport.aspect)

  const smooth = useRef({
    x: initialFlight.start.x,
    y: initialFlight.start.y,
    z: initialFlight.start.z,
  })
  const smoothScale = useRef(initialFlight.startScale)

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

  // Sync refs on mount / replay / aspect change and snap orientation to flight path
  useEffect(() => {
    hasTriggeredArrival.current = false
    const f = getFlightParams(viewport.aspect)
    const p = scrollState.progress
    smooth.current = {
      x: f.start.x + p * (f.end.x - f.start.x),
      y: f.start.y + p * (f.end.y - f.start.y),
      z: f.start.z + p * (f.end.z - f.start.z),
    }
    smoothScale.current = f.startScale + p * (f.endScale - f.startScale)

    _dir.set(f.end.x - f.start.x, f.end.y - f.start.y, f.end.z - f.start.z).normalize()
    _fwd.copy(_dir)
    // Nose points along local -Z, so aim local +Z opposite the travel direction
    _look.position.set(0, 0, 0)
    _look.up.set(0, 1, 0)
    _look.lookAt(-_dir.x, -_dir.y, -_dir.z)
    if (group.current) {
      group.current.position.set(smooth.current.x, smooth.current.y, smooth.current.z)
      group.current.quaternion.copy(_look.quaternion)
    }
    if (innerGroup.current) {
      innerGroup.current.scale.setScalar(smoothScale.current)
    }
  }, [viewport.aspect])

  useFrame((state, delta) => {
    if (!group.current || !innerGroup.current) return

    const f = getFlightParams(state.viewport.aspect)
    const p = scrollState.progress
    const t = state.clock.elapsedTime

    // Frame-rate independent smoothing factors
    const kPos = 1 - Math.exp(-3.2 * delta)
    const kDir = 1 - Math.exp(-4.0 * delta)
    const kRot = 1 - Math.exp(-4.5 * delta)

    // Target position along flight path
    const targetX = f.start.x + p * (f.end.x - f.start.x)
    const targetY = f.start.y + p * (f.end.y - f.start.y)
    const targetZ = f.start.z + p * (f.end.z - f.start.z)

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
    const targetScale = f.startScale + p * (f.endScale - f.startScale)
    smoothScale.current += (targetScale - smoothScale.current) * kPos
    innerGroup.current.scale.setScalar(smoothScale.current)

    // Engine exhaust glow: pulses like a real thruster, brighter up close
    if (engineGlow.current) {
      engineGlow.current.intensity = (8 + 30 * p) * (0.85 + 0.15 * Math.sin(t * 14))
    }

    // Trigger arrival when user reaches destination
    if (p >= 0.96 && !hasTriggeredArrival.current) {
      const distToEnd = Math.hypot(
        smooth.current.x - f.end.x,
        smooth.current.y - f.end.y,
        smooth.current.z - f.end.z
      )
      if (distToEnd < 1.5 || p >= 0.995) {
        hasTriggeredArrival.current = true
        onArrival?.()
      }
    }
  })

  return (
    <group
      ref={group}
      position={[initialFlight.start.x, initialFlight.start.y, initialFlight.start.z]}
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
      {/* Subtle key light ensuring shuttle cockpit & wings are crisp and recognizable from afar */}
      <pointLight
        position={[2, 3, -4]}
        color="#ffffff"
        intensity={2.0}
        distance={18}
        decay={1.5}
      />

      <group ref={innerGroup} scale={initialFlight.startScale}>
        <primitive object={scene} position={MODEL_CENTER} />
      </group>
    </group>
  )
}

useGLTF.preload('/space_shuttle_discovery.glb')

