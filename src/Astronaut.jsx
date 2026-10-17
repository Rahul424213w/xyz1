import { useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, useAnimations, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function Model() {
  const group = useRef()
  const { scene, animations } = useGLTF('/animated_floating_astronaut_in_space_suit_loop.glb')
  const { actions, names } = useAnimations(animations, group)

  // Start the floating astronaut loop animation
  useEffect(() => {
    if (actions && names.length > 0) {
      names.forEach((name) => {
        const action = actions[name]
        if (action) {
          action.reset().fadeIn(0.5).play()
        }
      })
    }
  }, [actions, names])

  // Center and normalize scale
  useEffect(() => {
    if (!scene) return
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    // Center model at origin with slight left & down offset
    scene.position.x = -center.x - 0.16
    scene.position.y = -center.y - 0.18
    scene.position.z = -center.z

    const maxDim = Math.max(size.x, size.y, size.z)
    if (maxDim > 0) {
      scene.scale.setScalar(2.85 / maxDim)
    }
  }, [scene])

  return (
    /* Facing squarely forward matching Image 1 reference */
    <group ref={group} rotation={[0.02, 0.0, 0.0]} dispose={null}>
      <primitive object={scene} />
    </group>
  )
}

export default function Astronaut() {
  return (
    <div className="astronaut-canvas-container">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.9} />
        {/* Electric cyan rim light matching the blue nebula */}
        <directionalLight position={[-4, 3, 2]} intensity={2.5} color="#00d2ff" />
        {/* Soft white key light */}
        <directionalLight position={[3, 4, 3]} intensity={1.8} color="#ffffff" />
        {/* Deep blue fill light from below */}
        <directionalLight position={[0, -3, -1]} intensity={0.8} color="#0044ff" />

        <Model />

        {/* Mouse rotation control: rotate around astronaut, no translate/move */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableDamping={true}
          dampingFactor={0.06}
          rotateSpeed={0.8}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={(3 * Math.PI) / 4}
        />
      </Canvas>
    </div>
  )
}

useGLTF.preload('/animated_floating_astronaut_in_space_suit_loop.glb')
