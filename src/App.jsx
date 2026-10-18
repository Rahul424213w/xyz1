import { useState, useEffect, useCallback, useRef } from 'react'
import LandingPage from './LandingPage'
import ContactPage from './ContactPage'
import RegisterPage from './RegisterPage'
import './App.css'

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#contact') return 'contact'
      if (window.location.hash === '#register') return 'register'
    }
    return 'landing'
  })

  // Quick 2-second video intro state
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window !== 'undefined' && (window.location.hash === '#contact' || window.location.hash === '#register')) {
      return false
    }
    return true
  })
  const [introFading, setIntroFading] = useState(false)
  const introVideoRef = useRef(null)

  // Smooth quick finish transition
  const handleIntroFinish = useCallback(() => {
    setIntroFading(true)
    setTimeout(() => {
      setShowIntro(false)
    }, 280)
  }, [])

  // Auto-seek to last 2 seconds and play
  useEffect(() => {
    if (!showIntro) return
    const vid = introVideoRef.current
    if (!vid) return

    let fallbackTimer

    const onLoadedMetadata = () => {
      const dur = vid.duration
      if (dur && isFinite(dur)) {
        // Jump directly to last 4.5 seconds
        vid.currentTime = Math.max(0, dur - 4.5)
      }
      vid.play().catch(() => {})
    }

    const onTimeUpdate = () => {
      if (vid.duration && vid.currentTime >= vid.duration - 0.08) {
        handleIntroFinish()
      }
    }

    // Safety fallback: maximum 4.8 seconds then immediately transition
    fallbackTimer = setTimeout(() => {
      handleIntroFinish()
    }, 4800)

    vid.addEventListener('loadedmetadata', onLoadedMetadata)
    vid.addEventListener('timeupdate', onTimeUpdate)
    vid.addEventListener('ended', handleIntroFinish)

    return () => {
      vid.removeEventListener('loadedmetadata', onLoadedMetadata)
      vid.removeEventListener('timeupdate', onTimeUpdate)
      vid.removeEventListener('ended', handleIntroFinish)
      clearTimeout(fallbackTimer)
    }
  }, [showIntro, handleIntroFinish])

  // Sync with browser hash changes for back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#contact') {
        setCurrentPage('contact')
      } else if (window.location.hash === '#register') {
        setCurrentPage('register')
      } else {
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

  return (
    <div className="app">
      {/* ── Quick 2-Second Start Video Only, then Direct Clean Transition ── */}
      {showIntro && (
        <div
          className={`intro-video-overlay ${introFading ? 'fade-out' : ''}`}
          onClick={handleIntroFinish}
        >
          <video
            ref={introVideoRef}
            className="intro-video"
            autoPlay
            muted
            playsInline
            preload="auto"
          >
            <source src="/6797-196071980.mp4#t=35.5" type="video/mp4" />
          </video>
          <button
            type="button"
            className="intro-skip-btn"
            onClick={(e) => {
              e.stopPropagation()
              handleIntroFinish()
            }}
          >
            SKIP ➔
          </button>
        </div>
      )}

      {currentPage === 'landing' && (
        <LandingPage onNavigate={handleNavigate} />
      )}

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
