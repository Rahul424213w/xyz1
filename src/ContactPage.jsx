import { useState, useEffect, useRef } from 'react'
import { TEAM_CATEGORIES, TEAM_MEMBERS } from './teamData'
import './ContactPage.css'

export default function ContactPage({ onNavigate }) {
  // First tab by default is 'crew'
  const [activeCategory, setActiveCategory] = useState('crew')
  const [selectedMember, setSelectedMember] = useState(null)
  const canvasRef = useRef(null)

  // ── Constellation particle network background (matching the subtle lines/dots in the image) ──
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Particle nodes
    const particleCount = Math.min(Math.floor((width * height) / 28000), 55)
    const particles = []
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.8 + 1,
        alpha: Math.random() * 0.6 + 0.25,
      })
    }

    let mouse = { x: null, y: null, active: false }
    const handleMouseMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
    }
    const handleMouseLeave = () => {
      mouse.active = false
      mouse.x = null
      mouse.y = null
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Connect near particles with faint amber/gold constellation lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 140) {
            const lineAlpha = (1 - dist / 140) * 0.18
            ctx.strokeStyle = `rgba(245, 158, 11, ${lineAlpha})`
            ctx.lineWidth = 0.8
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      // Interactive mouse attraction & constellation rays
      if (mouse.active && mouse.x !== null) {
        for (const p of particles) {
          const dx = mouse.x - p.x
          const dy = mouse.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 170) {
            const lineAlpha = (1 - dist / 170) * 0.38
            ctx.strokeStyle = `rgba(245, 158, 11, ${lineAlpha})`
            ctx.lineWidth = 1.1
            ctx.beginPath()
            ctx.moveTo(mouse.x, mouse.y)
            ctx.lineTo(p.x, p.y)
            ctx.stroke()

            // Subtle zero-g drift toward cursor
            p.x += (mouse.x - p.x) * 0.007
            p.y += (mouse.y - p.y) * 0.007
          }
        }
      }

      // Draw particle nodes
      for (const p of particles) {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()

        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  // Categories list excluding 'crew' for iterative sections
  const departmentCategories = TEAM_CATEGORIES.filter((c) => c.id !== 'crew')

  // Categories to display: either all departments one-by-one (when crew is active) or just the selected department
  const sectionsToDisplay =
    activeCategory === 'crew'
      ? departmentCategories
      : departmentCategories.filter((c) => c.id === activeCategory)

  // Renders name with first letter of each word in yellow (connectors like & or AND remain white)
  const yellowFirstLetters = (text) =>
    text.split(' ').map((word, i) => {
      const isConnector = ['&', 'and', 'AND', 'of', 'OF'].includes(word)
      return (
        <span key={i}>
          {i > 0 && ' '}
          <span style={{ color: isConnector ? 'inherit' : '#f59e0b' }}>{word[0]}</span>
          {word.slice(1)}
        </span>
      )
    })

  // Renders a single team member card matching the exact reference image with 3D space flow
  const renderMemberCard = (member, idx) => (
    <div
      key={member.id}
      className={`member-card float-tile-${idx % 4}`}
      style={{ animationDelay: `${-1.4 * (idx + 1)}s` }}
      onClick={() => setSelectedMember(member)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setSelectedMember(member)
        }
      }}
    >
      {/* Photo container with CRT scanlines & grain */}
      <div className="member-photo-frame">
        <img
          src={member.image}
          alt={`${member.name} - ${member.role}`}
          className="member-img"
          loading="lazy"
        />
        <div className="crt-scanlines" />
        <div className="photo-grain-overlay" />

        {/* Hover Quick Contact Floating Icons */}
        <div className="card-hover-actions">
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              className="hover-action-btn"
              title={`Email ${member.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="action-icon">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </a>
          )}
          {member.phone && (
            <a
              href={`tel:${member.phone}`}
              className="hover-action-btn"
              title={`Call ${member.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="action-icon">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </a>
          )}
          {member.linkedin && (
            <a
              href={member.linkedin}
              target="_blank"
              rel="noreferrer"
              className="hover-action-btn"
              title="LinkedIn Profile"
              onClick={(e) => e.stopPropagation()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="action-icon">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect width="4" height="12" x="2" y="9" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* ── Signature White Box with Black Outline & Solid Shadow (Exact match to image!) ── */}
      <div className="member-nameplate-box">
        <h3 className="member-name-text">{yellowFirstLetters(member.name)}</h3>
        <div className="member-role-badge">
          <span>{member.role}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="contact-page-container">
      {/* ── Dynamic Constellation Background Canvas ── */}
      <canvas ref={canvasRef} className="constellation-canvas" />

      {/* ── Fixed Floating Navbar (Same as Hero) ── */}
      <nav className="curved-navbar contact-navbar">
        <div className="nav-menu">
          <button
            type="button"
            className="nav-item nav-btn-link"
            onClick={() => onNavigate && onNavigate('landing', '#home')}
          >
            Home
          </button>
          <button
            type="button"
            className="nav-item nav-btn-link"
            onClick={() => onNavigate && onNavigate('landing', '#about')}
          >
            About
          </button>
          <button
            type="button"
            className="nav-item nav-btn-link"
            onClick={() => onNavigate && onNavigate('landing', '#timeline')}
          >
            Timeline
          </button>
          <button
            type="button"
            className="nav-item nav-btn-link active"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Contact Us
          </button>
        </div>
        <a
          href="#register"
          className="nav-btn-register"
          onClick={(e) => {
            e.preventDefault()
            if (onNavigate) {
              onNavigate('landing', '#register')
            }
          }}
        >
          <span>Register</span>
        </a>
      </nav>

      {/* ── Main Content ── */}
      <main className="team-main-content">
        {/* Back breadcrumb */}
        <div className="back-nav-bar">
          <button
            type="button"
            className="back-btn"
            onClick={() => onNavigate && onNavigate('landing', '#home')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="back-icon">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back to Home</span>
          </button>
        </div>

        {/* ── Top-Right Space Astronaut Hovering ── */}
        <div className="space-astronaut-hover" aria-hidden="true">
          <img
            src="/astronaut_floating.png"
            alt="Astronaut hovering in space"
            className="astronaut-hover-img"
          />
        </div>

        {/* ── Header: Mission Control & Crew ── */}
        <header className="team-hero-header">
          <h1 className="team-headline">
            <span className="headline-white">Mission Control</span>
            <span className="headline-dim">&amp; Crew</span>
          </h1>
        </header>

        {/* ── Department Category Filter Buttons (First tab is CREW by default) ── */}
        <div className="category-tabs-wrapper">
          <div className="category-tabs-scroll">
            {TEAM_CATEGORIES.map((cat, idx) => {
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-tab-btn float-tab-${idx % 3} ${isActive ? 'active' : ''}`}
                  style={{ animationDelay: `${-1.1 * (idx + 1)}s` }}
                  onClick={() => {
                    setActiveCategory(cat.id)
                  }}
                >
                  <span className="tab-label">{cat.label}</span>
                  {isActive && <span className="tab-active-indicator" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Team Sections: Appears One-by-One in CREW mode, or individually in separate tabs ── */}
        <div className="team-roster-wrapper">
          {sectionsToDisplay.map((dept, deptIdx) => {
            const deptMembers = TEAM_MEMBERS.filter((m) => m.category === dept.id)
            return (
              <section
                key={dept.id}
                id={`section-${dept.id}`}
                className="dept-section-block"
                style={{ animationDelay: `${deptIdx * 0.1}s` }}
              >
                {/* Department Section Header (Plain text, no background, bold clean white & yellow theme, no numbering) */}
                <div className="dept-header-clean">
                  <h2 className="dept-section-title">
                    <span className="dept-title-white">{yellowFirstLetters(dept.label)}</span>
                    <span className="dept-title-yellow">.</span>
                  </h2>
                  <p className="dept-section-desc">{dept.desc}</p>
                </div>

                {/* Team Member Cards Grid for this department */}
                <div className="team-cards-grid">
                  {deptMembers.map((member, idx) => renderMemberCard(member, idx))}
                </div>
              </section>
            )
          })}
        </div>

        {/* ── Clean Direct Reach Information (Venue, Email, Phone lines — No send form!) ── */}
        <section className="clean-reach-strip" id="direct-contact-section">
          <div className="reach-strip-inner">
            <div className="reach-card">
              <div className="reach-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="reach-icon">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="reach-content">
                <span className="reach-tag">CAMPUS & VENUE</span>
                <p className="reach-text">
                  Dept. of CSE, Jain College of Engineering & Research (JCER), Udyambag, Belagavi 590008
                </p>
              </div>
            </div>

            <div className="reach-card">
              <div className="reach-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="reach-icon">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <div className="reach-content">
                <span className="reach-tag">OFFICIAL EMAIL</span>
                <a href="mailto:hackvally@jcer.ac.in" className="reach-link">
                  hackvally@jcer.ac.in
                </a>
              </div>
            </div>

            <div className="reach-card">
              <div className="reach-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="reach-icon">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div className="reach-content">
                <span className="reach-tag">CORE LEADS HELPLINE</span>
                <p className="reach-text">
                  +91 98451 20112 (Prajin) • +91 98451 20113 (Prem) • +91 98451 20114 (Sai Sathwik)
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="team-footer">
          <div className="footer-content">
            <p className="footer-credits">
              HACK VALLY 2026 • Organized by Dept. of Computer Science & Engineering, JCER Belagavi
            </p>
            <div className="footer-links">
              <button
                type="button"
                className="footer-link"
                onClick={() => onNavigate && onNavigate('landing', '#home')}
              >
                Home
              </button>
              <button
                type="button"
                className="footer-link"
                onClick={() => onNavigate && onNavigate('landing', '#tracks')}
              >
                Tracks
              </button>
              <button
                type="button"
                className="footer-link"
                onClick={() => onNavigate && onNavigate('landing', '#highlights')}
              >
                Prize Pool
              </button>
              <a href="mailto:hackvally@jcer.ac.in" className="footer-link">
                hackvally@jcer.ac.in
              </a>
            </div>
          </div>
        </footer>
      </main>

      {/* ── Member Detail Modal ── */}
      {selectedMember && (
        <div
          className="member-modal-overlay"
          onClick={() => setSelectedMember(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="member-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setSelectedMember(null)}
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="modal-content-grid">
              <div className="modal-photo-wrap">
                <img
                  src={selectedMember.image}
                  alt={selectedMember.name}
                  className="modal-photo"
                />
                <div className="crt-scanlines" />
              </div>

              <div className="modal-info-wrap">
                <div className="modal-eyebrow">CREW PROFILE • {selectedMember.category.toUpperCase()}</div>
                <h3 className="modal-name">{selectedMember.name}</h3>
                <div className="modal-role-badge">
                  <span>{selectedMember.role}</span>
                </div>

                <p className="modal-bio">{selectedMember.bio}</p>

                <div className="modal-contacts-list">
                  {selectedMember.email && (
                    <a href={`mailto:${selectedMember.email}`} className="modal-contact-row">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="modal-icon">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      <span>{selectedMember.email}</span>
                    </a>
                  )}
                  {selectedMember.phone && (
                    <a href={`tel:${selectedMember.phone}`} className="modal-contact-row">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="modal-icon">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <span>{selectedMember.phone}</span>
                    </a>
                  )}
                </div>

                <div className="modal-actions-footer">
                  {selectedMember.email && (
                    <a href={`mailto:${selectedMember.email}`} className="modal-btn-primary">
                      <span>Send Direct Email</span>
                    </a>
                  )}
                  {selectedMember.linkedin && (
                    <a
                      href={selectedMember.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="modal-btn-secondary"
                    >
                      <span>LinkedIn</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
