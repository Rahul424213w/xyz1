import React, { useState } from 'react'
import './Navbar.css'

export default function Navbar({
  currentPage = 'landing', // 'landing' | 'contact' | 'register'
  activeSection = 'home',   // 'home' | 'about' | 'timeline' | 'rewards' | 'faq'
  onNavigate,
  onSectionClick,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleNavClick = (e, targetHash, sectionId) => {
    e.preventDefault()
    setMobileMenuOpen(false)

    if (currentPage === 'landing' && onSectionClick) {
      onSectionClick(sectionId)
    } else if (onNavigate) {
      onNavigate('landing', targetHash)
    } else {
      window.location.hash = targetHash
    }
  }

  const handleContactClick = (e) => {
    e.preventDefault()
    setMobileMenuOpen(false)

    if (currentPage === 'contact') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (onNavigate) {
      onNavigate('contact')
    } else {
      window.location.hash = '#contact'
    }
  }

  const handleRegisterClick = (e) => {
    e.preventDefault()
    setMobileMenuOpen(false)

    if (currentPage === 'register') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (onNavigate) {
      onNavigate('register')
    } else {
      window.location.hash = '#register'
    }
  }

  return (
    <>
      {/* ── Fixed Curved Center Floating Navbar (Desktop Only: min-width: 901px) ── */}
      <nav className="curved-navbar desktop-only-navbar">
        <div className="nav-menu">
          <a
            href="#home"
            className={`nav-item ${currentPage === 'landing' && activeSection === 'home' ? 'active' : ''}`}
            onClick={(e) => handleNavClick(e, '#home', 'home')}
          >
            Home
          </a>
          <a
            href="#about"
            className={`nav-item ${currentPage === 'landing' && activeSection === 'about' ? 'active' : ''}`}
            onClick={(e) => handleNavClick(e, '#about', 'about')}
          >
            About
          </a>
          <a
            href="#timeline"
            className={`nav-item ${currentPage === 'landing' && activeSection === 'timeline' ? 'active' : ''}`}
            onClick={(e) => handleNavClick(e, '#timeline', 'timeline')}
          >
            Timeline
          </a>
          <a
            href="#rewards"
            className={`nav-item ${currentPage === 'landing' && activeSection === 'rewards' ? 'active' : ''}`}
            onClick={(e) => handleNavClick(e, '#rewards', 'rewards')}
          >
            Prize
          </a>
          <a
            href="#faq"
            className={`nav-item ${currentPage === 'landing' && activeSection === 'faq' ? 'active' : ''}`}
            onClick={(e) => handleNavClick(e, '#faq', 'faq')}
          >
            FAQ
          </a>
          <a
            href="#contact"
            className={`nav-item ${currentPage === 'contact' ? 'active' : ''}`}
            onClick={handleContactClick}
          >
            Contact Us
          </a>
        </div>

        <a
          href="#register"
          className={`nav-btn-register ${currentPage === 'register' ? 'active-register' : ''}`}
          onClick={handleRegisterClick}
        >
          <span>Register</span>
        </a>
      </nav>

      {/* ── Mobile Responsive Navbar (Matches Images 3 & 4) ── */}
      <div className="mobile-nav-wrapper">
        {!mobileMenuOpen ? (
          /* Image 3: Closed Compact Floating Pill */
          <div className="mobile-nav-bar">
            <div className="mobile-nav-brand">
              <div className="mobile-nav-logo-badge">
                <img src="/astronaut.webp" alt="Hack Vally Logo" className="mobile-nav-logo-img" />
              </div>
              <span className="mobile-nav-brand-title">Hack Vally</span>
            </div>

            <button
              type="button"
              className="mobile-nav-hamburger-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <span className="mobile-hamburger-line" />
              <span className="mobile-hamburger-line" />
              <span className="mobile-hamburger-line" />
            </button>
          </div>
        ) : (
          /* Image 4: Open Floating Expanded Card Modal */
          <div className="mobile-nav-expanded-card">
            <div className="mobile-nav-card-header">
              <div className="mobile-nav-brand">
                <div className="mobile-nav-logo-badge">
                  <img src="/astronaut.webp" alt="Hack Vally Logo" className="mobile-nav-logo-img" />
                </div>
                <span className="mobile-nav-brand-title">Hack Vally</span>
              </div>

              <button
                type="button"
                className="mobile-nav-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="mobile-nav-divider" />

            <div className="mobile-nav-links-list">
              <a
                href="#home"
                className={`mobile-nav-link ${currentPage === 'landing' && activeSection === 'home' ? 'active-mobile-link' : ''}`}
                onClick={(e) => handleNavClick(e, '#home', 'home')}
              >
                Home
              </a>
              <a
                href="#about"
                className={`mobile-nav-link ${currentPage === 'landing' && activeSection === 'about' ? 'active-mobile-link' : ''}`}
                onClick={(e) => handleNavClick(e, '#about', 'about')}
              >
                About
              </a>
              <a
                href="#timeline"
                className={`mobile-nav-link ${currentPage === 'landing' && activeSection === 'timeline' ? 'active-mobile-link' : ''}`}
                onClick={(e) => handleNavClick(e, '#timeline', 'timeline')}
              >
                Timeline
              </a>
              <a
                href="#rewards"
                className={`mobile-nav-link ${currentPage === 'landing' && activeSection === 'rewards' ? 'active-mobile-link' : ''}`}
                onClick={(e) => handleNavClick(e, '#rewards', 'rewards')}
              >
                Prize
              </a>
              <a
                href="#faq"
                className={`mobile-nav-link ${currentPage === 'landing' && activeSection === 'faq' ? 'active-mobile-link' : ''}`}
                onClick={(e) => handleNavClick(e, '#faq', 'faq')}
              >
                FAQ
              </a>
              <a
                href="#contact"
                className={`mobile-nav-link ${currentPage === 'contact' ? 'active-mobile-link' : ''}`}
                onClick={handleContactClick}
              >
                Contact Us
              </a>

              <a
                href="#register"
                className="mobile-nav-register-btn"
                onClick={handleRegisterClick}
              >
                REGISTER
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
