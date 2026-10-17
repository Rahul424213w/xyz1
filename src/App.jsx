import { Suspense, useState, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, PerspectiveCamera, Html, useProgress } from '@react-three/drei'
import ShuttleModel from './ShuttleModel'
import { Stars } from './SceneExtras'
import { initScroll, resetScroll, scrollState } from './scrollState'
import LandingPage from './LandingPage'
import './App.css'

/* ── Loader ── */
function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="loader-wrap">
        <div className="loader-ring">
          <svg viewBox="0 0 100 100" className="loader-svg">
            <defs>
              <linearGradient id="loaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d2ff" />
                <stop offset="100%" stopColor="#0072ff" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="42" className="loader-track" />
            <circle
              cx="50" cy="50" r="42"
              className="loader-fill"
              style={{ strokeDashoffset: 264 - (264 * progress) / 100 }}
            />
          </svg>
          <span className="loader-pct">{Math.round(progress)}%</span>
        </div>
        <p className="loader-label">Warping in…</p>
      </div>
    </Html>
  )
}

/* ── Main App ── */
export default function App() {
  const [currentPage, setCurrentPage] = useState('intro') // 'intro' | 'landing'
  const [flashStage, setFlashStage] = useState('idle')    // 'idle' | 'flashing-in' | 'flashing-out'

  // Register wheel/keyboard listeners for the 3D flight
  useEffect(() => {
    const cleanup = initScroll()
    return cleanup
  }, [])

  // Allow pressing 'r' or 'R' or Escape on keyboard to replay the 3D intro anytime
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === 'r' || e.key === 'R' || e.key === 'Escape') && currentPage === 'landing') {
        handleReplay()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentPage])

  // Quick flash transition to landing page when shuttle arrives
  const handleArrival = useCallback(() => {
    if (flashStage !== 'idle') return

    // Quick white flash in (80ms)
    setFlashStage('flashing-in')

    // At peak flash (90ms), switch to full-screen hero landing page
    setTimeout(() => {
      scrollState.enabled = false
      setCurrentPage('landing')
      setFlashStage('flashing-out')

      // Fade out flash quickly (220ms)
      setTimeout(() => {
        setFlashStage('idle')
      }, 220)
    }, 90)
  }, [flashStage])

  // Replay intro
  const handleReplay = useCallback(() => {
    setFlashStage('flashing-in')

    setTimeout(() => {
      resetScroll()
      setCurrentPage('intro')
      setFlashStage('flashing-out')

      setTimeout(() => {
        setFlashStage('idle')
      }, 200)
    }, 80)
  }, [])

  return (
    <div className="app">
      {/* ── Quick White Flash Overlay ── */}
      <div
        className={`white-flash ${flashStage === 'flashing-in' ? 'flashing-in' : flashStage === 'flashing-out' ? 'flashing-out' : ''}`}
        style={{ display: flashStage === 'idle' ? 'none' : 'block' }}
      />

      {/* ── Page 1: 3D Shuttle Discovery Flight ── */}
      {currentPage === 'intro' && (
        <main className="canvas-wrap" id="shuttle-canvas">
          <Canvas
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
            style={{ background: '#000' }}
          >
            {/* Fixed camera */}
            <PerspectiveCamera makeDefault position={[0, 0.5, 10]} fov={50} />

            {/* Cinematic lighting */}
            <ambientLight intensity={0.2} />
            <directionalLight position={[6, 8, 6]} intensity={2.2} color="#ffffff" />
            <directionalLight position={[-6, -3, -6]} intensity={0.4} color="#a0c0ff" />

            {/* Deep space stars */}
            <Environment preset="night" />
            <Stars count={2000} />

            <Suspense fallback={<Loader />}>
              <ShuttleModel onArrival={handleArrival} />
            </Suspense>
          </Canvas>
        </main>
      )}

      {/* ── Page 2: Fullscreen 4K Hero Section ── */}
      {currentPage === 'landing' && (
        <LandingPage />
      )}
    </div>
  )
}
