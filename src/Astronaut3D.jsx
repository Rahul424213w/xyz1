import { Suspense, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, useAnimations, Center, Float, OrbitControls } from '@react-three/drei'

function Model() {
  const group = useRef()
  const { scene, animations } = useGLTF('/animated_floating_astronaut_in_space_suit_loop.glb')
  const { actions } = useAnimations(animations, group)

  useEffect(() => {
    if (actions) {
      // Auto-play the embedded looping animation clip
      Object.values(actions).forEach((action) => {
        action.reset().fadeIn(0.4).play()
      })
    }
  }, [actions])

  return (
    <group ref={group} rotation={[0.06, -0.3, 0.03]} dispose={null}>
      <group position={[0, -2.25, 0]} scale={0.96}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

useGLTF.preload('/animated_floating_astronaut_in_space_suit_loop.glb')

export default function Astronaut3D() {
  return (
    <div className="astronaut-3d-canvas-container">
      <Canvas
        camera={{ position: [0, 0, 4.8], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}
      >
        <ambientLight intensity={1.7} />
        <directionalLight position={[5, 8, 6]} intensity={2.6} />
        <directionalLight position={[-5, 2, -3]} intensity={1.8} color="#2dd4bf" />
        <pointLight position={[0, -2, 3]} intensity={1.2} color="#38bdf8" />
        <pointLight position={[0, 3, 2]} intensity={0.9} color="#ffffff" />

        <Suspense fallback={null}>
          <Float speed={1.8} rotationIntensity={0.25} floatIntensity={0.3} floatingRange={[-0.04, 0.04]}>
            <Model />
          </Float>
        </Suspense>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 1.6}
          minPolarAngle={Math.PI / 2.6}
        />
      </Canvas>
    </div>
  )
}
