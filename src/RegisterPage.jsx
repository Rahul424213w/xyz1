import { useEffect } from 'react'
import './RegisterPage.css'

export default function RegisterPage({ onNavigate }) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="register-wrapper">
      {/* Top Floating Return Navigation Bar */}
      <nav className="register-floating-nav">
        <button
          type="button"
          className="register-nav-btn register-back-btn"
          onClick={() => onNavigate && onNavigate('landing', '#home')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="register-nav-icon">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back to Home</span>
        </button>

        <div className="register-nav-right">
          <button
            type="button"
            className="register-nav-btn"
            onClick={() => onNavigate && onNavigate('landing', '#timeline')}
          >
            Timeline
          </button>
          <button
            type="button"
            className="register-nav-btn"
            onClick={() => onNavigate && onNavigate('contact')}
          >
            Contact Us
          </button>
        </div>
      </nav>

      {/* Fullscreen embed of Sarthak branch registration experience */}
      <div className="register-iframe-container">
        <iframe
          src="/register/index.html"
          title="Hack Vally Registration"
          className="register-iframe"
          allow="clipboard-write; autoplay"
        />
      </div>
    </div>
  )
}
