import { useRef, useEffect, useState } from 'react'
import Astronaut from './Astronaut'
import TimelineShuttle from './TimelineShuttle'
import './LandingPage.css'

const PARTNER_LOGOS = [
  { id: 1, src: '/logo1.jpg', alt: 'Partner 1', label: 'Logo 1' },
  { id: 2, src: '/logo2.jpg', alt: 'Partner 2', label: 'Logo 2' },
  { id: 3, src: '/logo3.jpg', alt: 'Partner 3', label: 'Logo 3' },
  { id: 4, src: '/logo4.jpg', alt: 'Partner 4', label: 'Logo 4' },
]

// Timeline Sequence (8 stages, alternating left/right, stage 01 active in Golden Amber)
const TIMELINE_EVENTS = [
  {
    id: '01',
    stageTag: 'REGISTRATION OPEN',
    dateText: 'Nov 23',
    title: 'Registration Live',
    desc: 'Registrations are now live. Register to participate in the challenge.',
    icon: 'edit',
    active: true, // Stage 01 is currently active in Golden Amber
    align: 'right', // 01 Box on RIGHT, Date on LEFT
  },
  {
    id: '02',
    stageTag: 'REGISTRATION CLOSES',
    dateText: 'Nov 8',
    title: 'Hatch Sealed',
    desc: 'Registration closes on November 8th. Secure your spot before the portal shuts for good.',
    icon: 'lock',
    active: false, // Turns Golden Amber on Nov 8
    align: 'left', // 02 Box on LEFT, Date on RIGHT
  },
  {
    id: '03',
    stageTag: 'HACKATHON DAY (Day 0)',
    dateText: 'Nov 13',
    title: 'Crew Selected',
    desc: 'Teams shortlisted based on their solution approach by the technical team and experienced faculties. Top 60 teams out of 500+ will be selected.',
    icon: 'users',
    active: false,
    align: 'right', // 03 Box on RIGHT, Date on LEFT
  },
  {
    id: '04',
    stageTag: 'INAUGURATION CEREMONY',
    dateText: '9:00 AM',
    title: 'Lock In',
    desc: 'Get confirmation from the teams on their attendance and commence the official mission briefing.',
    icon: 'ceremony',
    active: false,
    align: 'left', // 04 Box on LEFT, Date/Time on RIGHT
  },
  {
    id: '05',
    stageTag: 'FINAL PAYMENT DEADLINE',
    dateText: 'Nov 13',
    title: 'Fuel Up',
    desc: 'Final payment must be done without any extensions beyond this date. This covers accommodation and food for the event.',
    icon: 'fuel',
    active: false,
    align: 'right', // 05 Box on RIGHT, Date on LEFT
  },
  {
    id: '06',
    stageTag: 'HACKATHON DAYS',
    dateText: 'Nov 13 - Nov 14',
    title: 'Main Engine Burn',
    desc: '24-hour Hackathon D-day. Build, break, and rebuild — this is where legends are forged.',
    icon: 'burn',
    active: false,
    align: 'left', // 06 Box on LEFT, Date on RIGHT
  },
  {
    id: '07',
    stageTag: 'PRIZE DISTRIBUTION',
    dateText: 'Nov 14',
    title: 'Touchdown',
    desc: 'The winners are crowned. Prizes distributed, glory earned — the mission reaches its climax.',
    icon: 'trophy',
    active: false,
    align: 'right', // 07 Box on RIGHT, Date on LEFT
  },
  {
    id: '08',
    stageTag: 'MISSION ACCOMPLISHED',
    dateText: 'Nov 14 (Evening)',
    title: 'Beyond The Horizon',
    desc: 'Networking, mentorship follow-ups, and project showcases. The hackathon concludes, but your journey continues.',
    icon: 'sparkles',
    active: false,
    align: 'left', // 08 Box on LEFT, Date on RIGHT
  },
]

function TimelineIcon({ type, active }) {
  const color = active ? '#fbbf24' : '#94a3b8'
  switch (type) {
    case 'edit':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      )
    case 'lock':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )
    case 'users':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'ceremony':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    case 'fuel':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      )
    case 'burn':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z" />
        </svg>
      )
    case 'trophy':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34" />
          <path d="M18 4H6v7a6 6 0 0 0 12 0V4z" />
        </svg>
      )
    case 'sparkles':
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )
  }
}

export default function LandingPage({ onNavigate }) {
  const wrapperRef = useRef(null)
  const trackRef = useRef(null)
  const followerRef = useRef(null)
  const spineActiveRef = useRef(null)
  const lastScrollTop = useRef(0)

  // Smooth lerp tracking for timeline shuttle
  const targetYRef = useRef(36)
  const currentYRef = useRef(36)

  const [activeSection, setActiveSection] = useState('home')
  const [shuttleDirection, setShuttleDirection] = useState('down')
  const [isAtTimelineTop, setIsAtTimelineTop] = useState(true)

  // Track scroll position for active section and buttery-smooth timeline rocket follower
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return

    let animId
    let isRunning = true

    // Continuous smooth animation loop running at display refresh rate (60fps/120fps)
    const tick = () => {
      if (!isRunning) return

      // Smooth lerp: glides gracefully towards targetYRef with cushioned damping
      const diff = targetYRef.current - currentYRef.current
      if (Math.abs(diff) > 0.05) {
        currentYRef.current += diff * 0.12
      } else {
        currentYRef.current = targetYRef.current
      }

      // Update follower position and active spine glow directly on DOM for zero lag
      if (followerRef.current) {
        followerRef.current.style.top = `${currentYRef.current}px`
      }
      if (spineActiveRef.current) {
        spineActiveRef.current.style.height = `${currentYRef.current}px`
      }

      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)

    const onScroll = () => {
      const scrollTop = el.scrollTop
      el.style.setProperty('--scroll-top', `${scrollTop}px`)

      // Detect scroll direction (up/down) with a 3px deadband threshold
      if (scrollTop > lastScrollTop.current + 3) {
        setShuttleDirection('down')
      } else if (scrollTop < lastScrollTop.current - 3) {
        setShuttleDirection('up')
      }
      lastScrollTop.current = scrollTop

      // Calculate active section
      const offset = window.innerHeight * 0.4
      const aboutEl = document.getElementById('about')
      const timelineEl = document.getElementById('timeline')

      if (timelineEl && scrollTop + offset >= timelineEl.offsetTop) {
        setActiveSection('timeline')
      } else if (aboutEl && scrollTop + offset >= aboutEl.offsetTop) {
        setActiveSection('about')
      } else {
        setActiveSection('home')
      }

      // Calculate Timeline Shuttle vertical position along the central track
      if (trackRef.current) {
        const track = trackRef.current
        const trackRect = track.getBoundingClientRect()
        const viewportHeight = window.innerHeight

        // Center of viewport (50%) is the reference focus point
        const viewportCenter = viewportHeight * 0.5
        const trackHeight = track.offsetHeight

        // Progress travels smoothly across the entire track
        const rawProgress = (viewportCenter - trackRect.top) / trackHeight
        const clamped = Math.max(0, Math.min(1, rawProgress))

        // Position startY aligns with Node 01; endY aligns with Node 08
        const startY = 36
        const endY = Math.max(startY, trackHeight - 44)
        targetYRef.current = startY + clamped * (endY - startY)

        // At top when near start of timeline
        setIsAtTimelineTop(clamped <= 0.02)
      }
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      isRunning = false
      cancelAnimationFrame(animId)
      el.removeEventListener('scroll', onScroll)
    }
  }, [])

  const scrollToSection = (e, id) => {
    e.preventDefault()
    setActiveSection(id)
    const target = document.getElementById(id)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }
  return (
    <div className="landing-page-wrapper" ref={wrapperRef}>
      {/* ── Fixed Curved Center Floating Navbar ── */}
      <nav className="curved-navbar">
        <div className="nav-menu">
          <a
            href="#home"
            className={`nav-item ${activeSection === 'home' ? 'active' : ''}`}
            onClick={(e) => scrollToSection(e, 'home')}
          >
            Home
          </a>
          <a
            href="#about"
            className={`nav-item ${activeSection === 'about' ? 'active' : ''}`}
            onClick={(e) => scrollToSection(e, 'about')}
          >
            About
          </a>
          <a
            href="#timeline"
            className={`nav-item ${activeSection === 'timeline' ? 'active' : ''}`}
            onClick={(e) => scrollToSection(e, 'timeline')}
          >
            Timeline
          </a>
          <a
            href="#contact"
            className={`nav-item ${activeSection === 'contact' ? 'active' : ''}`}
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault()
                onNavigate('contact')
              } else {
                scrollToSection(e, 'contact')
              }
            }}
          >
            Contact Us
          </a>
        </div>
        <a href="#register" className="nav-btn-register">
          <span>Register</span>
        </a>
      </nav>

      {/* ── SECTION 1: Fullscreen 4K Hero Section with Sticky Cutting Scroll ── */}
      <section className="hero-fullscreen" id="home">
        <div className="hero-parallax-wrap">
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
          <a href="#about" className="scroll-indicator" aria-label="Scroll to About section">
            <div className="scroll-mouse-icon">
              <span className="scroll-mouse-wheel" />
            </div>
            <span>Scroll</span>
          </a>
        </div>
      </section>

      {/* ── SECTION 2: About Us Section (hack2future style) ── */}
      <section className="about-section" id="about">
        <div className="about-container">
          {/* Subtitle with two amber gradient lines */}
          <div className="about-tag-wrap">
            <span className="amber-line amber-line-left" />
            <span className="about-tag-text">ABOUT US</span>
            <span className="amber-line amber-line-right" />
          </div>

          {/* Heading: About Hack Vally */}
          <h2 className="about-main-heading">
            About<span className="about-accent-text">Hack Vally</span>
          </h2>

          {/* Description Paragraph */}
          <div className="about-text-wrap">
            <p className="about-description">
              Hack Vally is the flagship hackathon of IIIT Dharwad, bringing together developers, designers, and innovators from across the country to build impactful solutions to real-world problems. Designed to foster creativity, collaboration, and rapid innovation, the event provides a platform for participants to transform bold ideas into working prototypes while learning from mentors and industry experts. Now in its second edition, Hack Vally continues to grow as a space where ambitious minds come together to experiment, solve meaningful challenges, and showcase their technical skills. With carefully curated problem statements and an intense build environment, the hackathon encourages participants to push boundaries and create solutions that shape the future.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 2.5: ISRO Astronaut Perks Banner (Generous Space, Centered Astronaut) ── */}
      <section className="astronaut-perks-section">
        <div className="astronaut-perks-container">
          {/* Left Orange Card */}
          <div className="perk-card perk-card-orange">
            <div className="perk-card-content perk-content-left">
              <h3 className="perk-heading">
                Recognition and<br />Internship Opportunities
              </h3>
              <p className="perk-desc">
                Recognition by ISRO and the<br />
                chance to grab an internship at<br />
                ISRO.
              </p>
            </div>
          </div>

          {/* Center Space Astronaut Graphic */}
          <div className="astronaut-center-badge">
            <img
              src="/astronaut.webp"
              alt="ISRO Astronaut"
              className="astronaut-center-img"
            />
          </div>

          {/* Right Blue Card */}
          <div className="perk-card perk-card-blue">
            <div className="perk-card-content perk-content-right">
              <h3 className="perk-heading perk-heading-right">
                Mentorship from<br />ISRO Experts
              </h3>
              <p className="perk-desc perk-desc-right">
                Gain invaluable insights and<br />
                guidance from leading scientists<br />
                and engineers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Timeline Section (Alternating 01 to 08, 01 in Golden Amber) ── */}
      <section className="timeline-section" id="timeline">
        <div className="timeline-container">
          {/* Timeline Header */}
          <div className="timeline-header">
            <h2 className="timeline-title">Timeline</h2>
            <p className="timeline-subtitle">
              Every great mission has a sequence.{' '}
              <span className="timeline-subtitle-faint">
                Here's yours — from launch to landing.
              </span>
            </p>
          </div>

          {/* Central Vertical Timeline Track with Smooth HD Space Shuttle */}
          <div className="timeline-track" ref={trackRef}>
            {/* The base vertical spine line */}
            <div className="timeline-spine-line" />

            {/* Glowing active amber spine trace line */}
            <div className="timeline-spine-active" ref={spineActiveRef} />

            {/* Dynamic HD 4K Space Shuttle Following Scroll Smoothly */}
            <div className="timeline-shuttle-follower" ref={followerRef}>
              <TimelineShuttle direction={shuttleDirection} isAtTop={isAtTimelineTop} />
            </div>

            {/* Alternating Events */}
            {TIMELINE_EVENTS.map((event) => {
              const isRightAligned = event.align === 'right' // Box on right, date on left
              const isLeftAligned = event.align === 'left'   // Box on left, date on right

              const dateComponent = (
                <div className={`timeline-date-block ${event.active ? 'active-amber' : ''}`}>
                  <div className="timeline-stage-tag">{event.stageTag}</div>
                  <div className="timeline-date-display">{event.dateText}</div>
                </div>
              )

              const cardComponent = (
                <div className={`timeline-card ${event.active ? 'active-amber' : ''}`}>
                  <div className="timeline-card-header">
                    <div className="timeline-card-icon-wrap">
                      <TimelineIcon type={event.icon} active={event.active} />
                    </div>
                    <h3 className="timeline-card-title">{event.title}</h3>
                  </div>
                  <p className="timeline-card-desc">{event.desc}</p>
                </div>
              )

              return (
                <div
                  key={event.id}
                  className={`timeline-row ${isRightAligned ? 'align-box-right' : 'align-box-left'} ${event.active ? 'row-active' : ''}`}
                >
                  {/* Left Column */}
                  <div className="timeline-col timeline-col-left">
                    {isRightAligned ? dateComponent : cardComponent}
                  </div>

                  {/* Center Node (Concentric Halo Rings with Number) */}
                  <div className="timeline-node-wrap">
                    <div className="timeline-node-container">
                      {event.active ? (
                        <>
                          <div className="timeline-halo-ring ring-outer-large" />
                          <div className="timeline-halo-ring ring-outer-medium" />
                        </>
                      ) : (
                        <div className="timeline-halo-ring ring-inactive-subtle" />
                      )}
                      <div className={`timeline-node-circle ${event.active ? 'node-active' : ''}`}>
                        <span className="timeline-node-number">{event.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="timeline-col timeline-col-right">
                    {isRightAligned ? cardComponent : dateComponent}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
