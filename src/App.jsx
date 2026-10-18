import { Suspense, useState, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, PerspectiveCamera, Html, useProgress } from '@react-three/drei'
import ShuttleModel from './ShuttleModel'
import { Stars } from './SceneExtras'
import { initScroll, resetScroll, scrollState } from './scrollState'
import LandingPage from './LandingPage'
import ContactPage from './ContactPage'
import RegisterPage from './RegisterPage'
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
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#contact') return 'contact'
      if (window.location.hash === '#register') return 'register'
    }
    return 'intro' // 'intro' | 'landing' | 'contact' | 'register'
  })
  const [flashStage, setFlashStage] = useState('idle') // 'idle' | 'flashing-in' | 'flashing-out'

  // Register wheel/keyboard listeners for the 3D flight
  useEffect(() => {
    const cleanup = initScroll()
    return cleanup
  }, [])

  // Allow pressing 'r' or 'R' or Escape on keyboard to replay the 3D intro anytime
  useEffect(() => {
    const onKey = (e) => {
      if (
        (e.key === 'r' || e.key === 'R' || e.key === 'Escape') &&
        (currentPage === 'landing' || currentPage === 'contact' || currentPage === 'register')
      ) {
        handleReplay()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentPage])

  // Sync with browser hash changes for back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#contact') {
        scrollState.enabled = false
        setCurrentPage('contact')
      } else if (window.location.hash === '#register') {
        scrollState.enabled = false
        setCurrentPage('register')
      } else if (
        window.location.hash === '#home' ||
        window.location.hash === '#about' ||
        window.location.hash === '#timeline'
      ) {
        scrollState.enabled = false
        setCurrentPage('landing')
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('popstate', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('popstate', handleHashChange)
    }
  }, [])

  // Navigation handler between pages
  const handleNavigate = useCallback((page, targetHash) => {
    scrollState.enabled = false
    setCurrentPage(page)
    if (page === 'contact') {
      window.history.pushState(null, '', '#contact')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (page === 'register') {
      window.history.pushState(null, '', '#register')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (page === 'landing') {
      window.history.pushState(null, '', targetHash || '#home')
      if (targetHash) {
        setTimeout(() => {
          const el = document.querySelector(targetHash)
          if (el) el.scrollIntoView({ behavior: 'smooth' })
        }, 50)
      }
    }
  }, [])

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

      {/* ── Page 1: 3D Shuttle Discovery Flight (Scroll to pilot & fly) ── */}
      {currentPage === 'intro' && (
        <main className="canvas-wrap" id="shuttle-canvas">
          <Canvas
            dpr={[1, 2]}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: 'high-performance',
              stencil: false,
              toneMappingExposure: 1.15,
            }}
            style={{ background: '#000' }}
          >
            {/* Fixed camera */}
            <PerspectiveCamera makeDefault position={[0, 0.5, 10]} fov={48} near={0.1} far={800} />

            {/* Cinematic lighting */}
            <ambientLight intensity={0.25} />
            <directionalLight position={[6, 8, 6]} intensity={2.4} color="#ffffff" />
            <directionalLight position={[-6, -3, -6]} intensity={0.5} color="#a0c0ff" />

            {/* Deep space stars */}
            <Environment preset="night" />
            <Stars count={4000} />

            <Suspense fallback={<Loader />}>
              <ShuttleModel onArrival={handleArrival} />
            </Suspense>
          </Canvas>
        </main>
      )}

      {/* ── Page 2: Fullscreen 4K Hero Section ── */}
      {currentPage === 'landing' && (
        <LandingPage onNavigate={handleNavigate} />
      )}

      {/* ── Page 3: Meet The Team Behind & Contact Us ── */}
      {currentPage === 'contact' && (
        <ContactPage onNavigate={handleNavigate} />
      )}

      {/* ── Page 4: Sarthak Branch Hack Vally Registration Page ── */}
      {currentPage === 'register' && (
        <RegisterPage onNavigate={handleNavigate} />
      )}
    </div>
  )
}
