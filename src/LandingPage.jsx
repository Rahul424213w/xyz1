import Astronaut from './Astronaut'
import './LandingPage.css'

const PARTNER_LOGOS = [
  { id: 1, src: '/logo1.jpg', alt: 'Partner 1', label: 'Logo 1' },
  { id: 2, src: '/logo2.jpg', alt: 'Partner 2', label: 'Logo 2' },
  { id: 3, src: '/logo3.jpg', alt: 'Partner 3', label: 'Logo 3' },
  { id: 4, src: '/logo4.jpg', alt: 'Partner 4', label: 'Logo 4' },
]

export default function LandingPage() {
  return (
    <div className="landing-page-wrapper">
      {/* ── Fixed Curved Center Floating Navbar ── */}
      <nav className="curved-navbar">
        <div className="nav-menu">
          <a href="#home" className="nav-item active">
            Home
          </a>
          <a href="#tracks" className="nav-item">
            Timeline
          </a>
          <a href="#highlights" className="nav-item">
            Prize Pool
          </a>
          <a href="#contact" className="nav-item">
            Contact Us
          </a>
        </div>
        <a href="#register" className="nav-btn-register">
          <span>Register</span>
        </a>
      </nav>

      {/* ── SECTION 1: Fullscreen 4K Hero Section ── */}
      <section className="hero-fullscreen" id="home">
        {/* 4K Fullscreen Background Image */}
        <img
          src="/hero_section_4k.png"
          alt="HACK VALLY - 24 Hours Hackathon | 12 - 13 November"
          className="hero-img-4k"
        />

        {/* College Header (Above Hack Vally with breathing room) */}
        <div className="hero-college-title">
          <div className="college-badge">
            <span className="college-dot" />
            <span className="college-text">Jain College Of Engineering And Research</span>
          </div>
        </div>

        {/* 3D Animated Floating Astronaut (Side-by-side on left of Hack Vally) */}
        <div className="astronaut-left-wrapper">
          <Astronaut />
        </div>

        {/* Our Partners Section (Below 12-13 Nov) */}
        <div className="hero-partners-section">
          <h3 className="partners-heading">Our Partners</h3>
          <div className="partners-grid">
            {PARTNER_LOGOS.map((logo) => (
              <div className="partner-card" key={logo.id} title={logo.alt}>
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="partner-img"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'flex'
                    }
                  }}
                />
                <div className="partner-fallback" style={{ display: 'none' }}>
                  <span>{logo.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll down indicator */}
        <a href="#highlights" className="scroll-indicator" aria-label="Scroll down">
          <div className="scroll-mouse-icon">
            <span className="scroll-mouse-wheel" />
          </div>
          <span>Scroll</span>
        </a>
      </section>

      {/* ── SECTION 2: 3 Highlight Boxes (Tracks, Prize Pool, Organized By) ── */}
      <section className="highlights-section" id="highlights">
        <div className="highlights-container">
          <div className="highlights-grid">
            {/* Box 1: 2 Tracks ( Software ) */}
            <div className="highlight-card card-tracks">
              <div className="card-top-bar" />
              <div className="card-header">
                <div className="card-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="card-icon">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <h3 className="card-title">2 Tracks ( Software )</h3>
              </div>
              <ul className="tracks-list">
                <li className="track-item">
                  <span className="track-bullet" />
                  <span className="track-name">Full Stack</span>
                </li>
                <li className="track-item">
                  <span className="track-bullet" />
                  <span className="track-name">Gen AI</span>
                </li>
              </ul>
            </div>

            {/* Box 2: Prize Pool */}
            <div className="highlight-card card-prizes">
              <div className="card-top-bar gold-bar" />
              <div className="card-header">
                <div className="card-icon-wrap trophy-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="card-icon trophy-icon">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
                    <path d="M6 4h12v7a6 6 0 0 1-12 0V4z" />
                  </svg>
                </div>
                <h3 className="card-title">Prize Pool</h3>
              </div>
              <div className="prize-amount-wrap">
                <span className="prize-currency">₹</span>
                <span className="prize-amount">50 K</span>
              </div>
              <p className="prize-subtitle">Grand Hackathon Prizes</p>
            </div>

            {/* Box 3: Organized by */}
            <div className="highlight-card card-organizer">
              <div className="card-top-bar" />
              <div className="card-header">
                <div className="card-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="card-icon">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
                <h3 className="card-title">organized by</h3>
              </div>
              <div className="organizer-content">
                <p className="dept-name">Dept. of Computer Science and Engineering</p>
                <p className="college-subtext">Jain College of Engineering & Research</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
