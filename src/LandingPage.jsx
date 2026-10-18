import { useRef, useEffect, useState } from 'react'
import TimelineShuttle from './TimelineShuttle'
import Astronaut3D from './Astronaut3D'
import Navbar from './Navbar'
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

// Accommodation and Event FAQs (transferred from register page to home after rewards)
const FAQ_ITEMS = [
  {
    q: 'Is accommodation available for outstation participants?',
    a: 'Yes, accommodation is available only on the night of 12th November during the hackathon itself. Please note that no prior accommodation (before 12th November) will be provided.',
  },
  {
    q: 'Is accommodation provided free of cost, or is there an additional fee?',
    a: 'Accommodation and food are included in the registration fee. There are no additional charges for either.',
  },
  {
    q: 'Are separate accommodation arrangements available for boys and girls?',
    a: 'Yes, separate accommodation arrangements are available for boys and girls.',
  },
  {
    q: 'Are food and refreshments included in the registration fee?',
    a: 'Yes, food and accommodation are included in the registration fee itself. There are no additional charges.',
  },
  {
    q: 'Do we need to register for accommodation separately?',
    a: 'No, a separate registration form is not required. You can select the accommodation option directly on the event website while registering.',
  },
  {
    q: 'What are the reporting and departure times?',
    a: 'Participants are requested to report on 12th November at around 10:00 AM. Accommodation is provided only on the night of 12th November during the hackathon itself (no prior accommodation before 12th November).\n\nPlease note that any schedule updates will be communicated through WhatsApp.',
  },
  {
    q: 'Is transportation available from the railway station or bus stand to the college?',
    a: 'If your train or bus arrival timings align with our college bus schedule, our college buses can pick you up and bring you to the college. The college bus timings will be shared through WhatsApp.',
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
  const [openFaqIndex, setOpenFaqIndex] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      const challengesEl = document.getElementById('challenges')
      const rewardsEl = document.getElementById('rewards')
      const faqEl = document.getElementById('faq')
      const contactEl = document.getElementById('contact')

      if (contactEl && scrollTop + offset >= contactEl.offsetTop) {
        setActiveSection('contact')
      } else if (faqEl && scrollTop + offset >= faqEl.offsetTop) {
        setActiveSection('faq')
      } else if (rewardsEl && scrollTop + offset >= rewardsEl.offsetTop) {
        setActiveSection('rewards')
      } else if (challengesEl && scrollTop + offset >= challengesEl.offsetTop) {
        setActiveSection('challenges')
      } else if (timelineEl && scrollTop + offset >= timelineEl.offsetTop) {
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

        const rows = track.querySelectorAll('.timeline-row')
        if (rows && rows.length > 0) {
          const firstRow = rows[0]
          const lastRow = rows[rows.length - 1]

          const isMobile = window.innerWidth <= 900
          const startOffset = isMobile ? 40 : firstRow.offsetHeight / 2
          const endOffset = isMobile ? 40 : lastRow.offsetHeight / 2

          // Exact vertical centers of Node 01 and Node 08 within timeline-track
          const startY = firstRow.offsetTop + startOffset
          const endY = lastRow.offsetTop + endOffset

          // Viewport Y coordinates of Node 01 and Node 08
          const node01ScreenY = trackRect.top + startY
          const node08ScreenY = trackRect.top + endY

          // Progress scales from Node 01 center (0) to Node 08 center (1)
          const progress = (viewportCenter - node01ScreenY) / (node08ScreenY - node01ScreenY)
          const clamped = Math.max(0, Math.min(1, progress))

          // Fully reaches Node 08 (Nov 14 Evening) and stays pinned at 08 as user scrolls past
          targetYRef.current = startY + clamped * (endY - startY)

          // At top when near start of timeline
          setIsAtTimelineTop(clamped <= 0.02)
        } else {
          const startY = 36
          const endY = Math.max(startY, trackHeight - 44)
          const rawProgress = (viewportCenter - trackRect.top) / trackHeight
          const clamped = Math.max(0, Math.min(1, rawProgress))
          targetYRef.current = startY + clamped * (endY - startY)
          setIsAtTimelineTop(clamped <= 0.02)
        }
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
      {/* ── Unified Navbar (Desktop Curved Pill + Mobile Modal) ── */}
      <Navbar
        currentPage="landing"
        activeSection={activeSection}
        onNavigate={onNavigate}
        onSectionClick={(secId) => {
          setActiveSection(secId)
          const target = document.getElementById(secId)
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' })
          }
        }}
      />

      {/* ── SECTION 1: Fullscreen 4K Hero Section with Sticky Cutting Scroll ── */}
      <section className="hero-fullscreen" id="home">
        <div className="hero-parallax-wrap">
          {/* Hero Section Background Video */}
          <video
            className="hero-bg-video"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/189457-885804464.mp4" type="video/mp4" />
          </video>

          {/* Flowing Floating Astronaut */}
          <div className="astronaut-left-wrapper">
            <img
              src="/astronaut_floating.png"
              alt="Floating Astronaut in Space"
              className="astronaut-floating-img"
            />
          </div>

          {/* Main Hero Center Content (College badge, Hack Vally title, Hackathon dates, Partners) */}
          <div className="hero-center-content">
            {/* College Header */}
            <div className="hero-college-title">
              <div className="college-badge">
                <span className="college-dot" />
                <span className="college-text">Jain College Of Engineering And Research</span>
              </div>
            </div>

            {/* Futuristic HACK VALLY Headline */}
            <h1 className="hero-main-title">
              HACK <span className="hero-title-accent">VALLY</span>
            </h1>

            {/* 24 Hours Hackathon Subtitle */}
            <div className="hero-duration-badge">
              <span>24 HOURS HACKATHON</span>
            </div>

            {/* 12 - 13 November Dates */}
            <div className="hero-date-row">
              <span className="date-glow-line" />
              <span className="hero-date-val">12 — 13 NOVEMBER</span>
              <span className="date-glow-line" />
            </div>

            {/* Our Partners Section */}
            <div className="hero-partners-section">
              <h3 className="partners-heading">OUR PARTNERS</h3>
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
            About <span className="about-accent-text">Hack Vally</span>
          </h2>

          {/* Description Paragraph */}
          <div className="about-text-wrap">
            <p className="about-description">
              Hack Vally is the flagship hackathon of <strong className="about-strong-highlight">Jain College of Engineering and Research (JCER), Belagavi</strong>, bringing together developers, designers, and innovators to build impactful solutions to real-world challenges. Designed to foster creativity, collaboration, and technological innovation, the event provides a platform for participants to transform bold ideas into working prototypes while learning, experimenting, and collaborating as a team. Hack Vally creates an environment where aspiring innovators can explore emerging technologies, tackle meaningful problem statements, and showcase their technical skills. With an intense 24-hour building experience, the hackathon encourages participants to think beyond conventional boundaries, turn ideas into action, and develop solutions that can make a difference.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 2.5: ISRO Astronaut Perks Banner (Generous Space, Centered Astronaut) ── */}
      {/* ── SECTION 2.5: ISRO Astronaut Perks Banner ── */}
      <section className="astronaut-perks-section">
        {/* Desktop Layout (min-width: 901px) - 100% UNTOUCHED with astronaut.webp */}
        <div className="astronaut-perks-container perks-desktop-layout">
          {/* Left Orange Card */}
          <div className="perk-card perk-card-orange">
            <div className="perk-card-content perk-content-left">
              <h3 className="perk-heading">
                Prize Pool
              </h3>
              <div className="perk-prize-amount">
                50 k
              </div>
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
                Organized By
              </h3>
              <p className="perk-desc perk-desc-right perk-organized-desc">
                Dept. of Computer Science and Engineering
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Layout (max-width: 900px) - Matches User Attached Image with astr2.webp */}
        <div className="astronaut-perks-mobile-wrapper">
          <div className="perks-mobile-stack">
            {/* Top Orange Card: Prize Pool 50 k */}
            <div className="perks-mobile-card perks-mobile-orange">
              <div className="perks-mobile-content">
                <h3 className="perks-mobile-heading">Prize Pool</h3>
                <div className="perks-mobile-amount">50 k</div>
              </div>
            </div>

            {/* Bottom Blue Card: Organized By */}
            <div className="perks-mobile-card perks-mobile-blue">
              <div className="perks-mobile-content perks-mobile-content-blue">
                <h3 className="perks-mobile-heading perks-mobile-heading-sm">Organized By</h3>
                <p className="perks-mobile-desc perks-mobile-desc-blue">
                  Dept. of Computer Science<br />and Engineering
                </p>
              </div>
            </div>

            {/* Overlaid Astronaut Image (astr2.webp) spanning both cards on the left */}
            <div className="perks-mobile-astronaut-wrap">
              <img
                src="/astr2.webp"
                alt="ISRO Astronaut"
                className="perks-mobile-astronaut-img"
              />
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

      {/* ── SECTION 4: Challenges (Problem Statements) Section ── */}
      <section className="challenges-section" id="challenges">
        <div className="challenges-container">
          {/* Header Area with Ghost Watermark "TRACKS" */}
          <div className="challenges-header-wrap">
            <span className="challenges-watermark-text" aria-hidden="true">
              TRACKS
            </span>

            {/* Tag Pill: — CHALLENGES — */}
            <div className="challenges-tag-wrap">
              <span className="amber-line amber-line-left" />
              <span className="challenges-tag-text">CHALLENGES</span>
              <span className="amber-line amber-line-right" />
            </div>

            {/* Main Title: Problem Statements */}
            <h2 className="challenges-main-title">
              Problem <span className="about-accent-text">Statements</span>
            </h2>

            {/* Subtitle */}
            <p className="challenges-subtitle">
              Five industry tracks. Real-world problems from leading companies — pick your battlefield.
            </p>
          </div>

          {/* Big Square Announcement Box with Generous Spacing */}
          <div className="challenges-announcement-box">
            <div className="challenges-box-ambient-glow" />
            <div className="challenges-box-badge">
              <span className="challenges-pulse-dot" />
              <span>13 NOVEMBER</span>
            </div>

            <div className="challenges-box-icon-wrap">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <h3 className="challenges-statement-text">
              The Problem Statements will be released on hackathon day itself on website and whatsapp group of participants
            </h3>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: Prizes & Rewards Section (Winner & Runner Up only) ── */}
      <section className="rewards-section" id="rewards">
        <div className="rewards-container">
          {/* Header */}
          <div className="rewards-header">
            <div className="rewards-tag-wrap">
              <span className="amber-line amber-line-left" />
              <span className="rewards-tag-text">REWARDS</span>
            </div>

            <h2 className="rewards-main-title">
              Prize <span className="about-accent-text">( Per Domain )</span>
            </h2>
          </div>

          {/* 2 Prize Cards: Winner & Runner Up Only */}
          <div className="rewards-grid">
            {/* Card 1: Winner (Golden Amber glow on hover) */}
            <div className="reward-card reward-card-winner">
              {/* Background Circular Radar Geometry */}
              <div className="reward-bg-graphic">
                <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="200" cy="200" r="170" stroke="rgba(245, 158, 11, 0.1)" strokeWidth="1" strokeDasharray="4 6" />
                  <circle cx="200" cy="200" r="130" stroke="rgba(245, 158, 11, 0.16)" strokeWidth="1" />
                  <circle cx="200" cy="200" r="85" stroke="rgba(245, 158, 11, 0.2)" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx="200" cy="200" r="45" stroke="rgba(245, 158, 11, 0.25)" strokeWidth="1" />
                  <line x1="20" y1="200" x2="380" y2="200" stroke="rgba(245, 158, 11, 0.1)" strokeWidth="1" />
                  <line x1="200" y1="20" x2="200" y2="380" stroke="rgba(245, 158, 11, 0.1)" strokeWidth="1" />
                  <line x1="72" y1="72" x2="328" y2="328" stroke="rgba(245, 158, 11, 0.08)" strokeWidth="1" strokeDasharray="2 4" />
                </svg>
              </div>

              {/* Ambient radial lighting */}
              <div className="reward-glow-layer reward-glow-winner" />

              <div className="reward-card-inner">
                {/* Top Badge Icon (Trophy) */}
                <div className="reward-icon-badge reward-badge-winner">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34" />
                    <path d="M18 4H6v7a6 6 0 0 0 12 0V4z" fill="rgba(245, 158, 11, 0.25)" />
                  </svg>
                </div>

                {/* Sub-label shown on hover (Image 5) */}
                <div className="reward-place-label label-winner">
                  <span className="place-dot dot-winner" />
                  <span>1ST PLACE • GRAND WINNER</span>
                </div>

                {/* Amount */}
                <div className="reward-amount amount-winner">
                  ₹15,000
                </div>

                {/* Description */}
                <p className="reward-desc">
                  Awarded to the most innovative and impactful solution. The team that redefines what's possible.
                </p>

                {/* Divider Line (shown on hover, Image 5) */}
                <div className="reward-divider divider-winner" />
              </div>
            </div>

            {/* Card 2: Runner Up (Silver / White glow on hover) */}
            <div className="reward-card reward-card-runnerup">
              {/* Background Concentric Hexagon Geometry */}
              <div className="reward-bg-graphic">
                <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="200,30 347,115 347,285 200,370 53,285 53,115" stroke="rgba(226, 232, 240, 0.12)" strokeWidth="1" />
                  <polygon points="200,60 321,130 321,270 200,340 79,270 79,130" stroke="rgba(226, 232, 240, 0.16)" strokeWidth="1" transform="rotate(15 200 200)" />
                  <polygon points="200,90 295,145 295,255 200,310 105,255 105,145" stroke="rgba(226, 232, 240, 0.20)" strokeWidth="1" transform="rotate(30 200 200)" />
                  <polygon points="200,120 269,160 269,240 200,280 131,240 131,160" stroke="rgba(226, 232, 240, 0.14)" strokeWidth="1" strokeDasharray="3 3" />
                </svg>
              </div>

              {/* Ambient radial lighting */}
              <div className="reward-glow-layer reward-glow-runnerup" />

              <div className="reward-card-inner">
                {/* Top Badge Icon (Medal with 2) */}
                <div className="reward-icon-badge reward-badge-runnerup">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="14" r="7" fill="rgba(226, 232, 240, 0.15)" />
                    <path d="M8.21 13.89L7 22l5-3 5 3-1.21-8.11" />
                    <text x="12" y="17" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ffffff" stroke="none" fontFamily="'Outfit', sans-serif">2</text>
                  </svg>
                </div>

                {/* Sub-label shown on hover */}
                <div className="reward-place-label label-runnerup">
                  <span className="place-dot dot-runnerup" />
                  <span>2ND PLACE • RUNNER UP</span>
                </div>

                {/* Amount */}
                <div className="reward-amount amount-runnerup">
                  ₹5,000
                </div>

                {/* Description */}
                <p className="reward-desc">
                  For outstanding technical implementation and creativity. Exceptional craft meets bold ideas.
                </p>

                {/* Divider Line (shown on hover) */}
                <div className="reward-divider divider-runnerup" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: Accommodation & Event FAQs Section ── */}
      <section className="faq-section" id="faq">
        <div className="faq-container">
          {/* Centered Header */}
          <div className="faq-header">
            <h2 className="faq-main-title">
              Frequently Asked <span className="about-accent-text">Questions</span>
            </h2>

            <p className="faq-subtitle">
              Everything you need to know before arriving at Hackvally.
            </p>
          </div>

          {/* FAQ Accordion List */}
          <div className="faq-accordion-list">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index
              return (
                <div
                  key={index}
                  className={`faq-accordion-item ${isOpen ? 'faq-item-open' : ''}`}
                >
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <span className="faq-question-text">{item.q}</span>
                    <div className="faq-icon-indicator">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="faq-chevron-icon"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </button>

                  <div className="faq-answer-wrap">
                    <div className="faq-answer-content">
                      <p className="faq-answer-text">{item.a}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 7: Footer (Contact, Venue & Floating Astronaut matching hack2future) ── */}
      <footer className="hack-footer-section" id="contact">
        <div className="footer-container">
          {/* Top Row: Brand Info (Left) + Contact Details (Center) + Floating Astronaut (Right) */}
          <div className="footer-top-grid">
            {/* Left Column: Brand, Subtitle & Social Icons */}
            <div className="footer-brand-col">
              <div className="footer-brand-header">
                <h3 className="footer-brand-title">Hack Vally</h3>
              </div>

              <p className="footer-brand-desc">
                A 24-hour national-level innovation sprint bridging academia and industry — where student minds build rapid solutions to real-world challenges.
              </p>

              <div className="footer-socials-row">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-btn"
                  aria-label="Instagram"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-btn"
                  aria-label="LinkedIn"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Center-Right Columns: Contact Tag, Main Email & 4 Organizers */}
            <div className="footer-contact-col">
              <div className="footer-tag-wrap">
                <span className="cyan-line" />
                <span className="footer-tag-text">CONTACT</span>
              </div>

              {/* General Inquiries Email */}
              <a href="mailto:swayamuk1@gmail.com" className="footer-main-email">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>swayamuk1@gmail.com</span>
              </a>

              {/* 4 People Grid */}
              <div className="footer-contacts-grid">
                {/* Person 1: Abhilasha J (Faculty Coordinator) */}
                <div className="footer-contact-card">
                  <div className="contact-card-header">
                    <span className="contact-person-name">Abhilasha J</span>
                    <span className="contact-role-badge">FACULTY COORDINATOR</span>
                  </div>
                  <a href="mailto:abhilasha.jcer@gmail.com" className="contact-detail-line">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span>abhilasha.jcer@gmail.com</span>
                  </a>
                </div>

                {/* Person 2: Raghavendra K (Faculty Coordinator) */}
                <div className="footer-contact-card">
                  <div className="contact-card-header">
                    <span className="contact-person-name">Raghavendra K</span>
                    <span className="contact-role-badge">FACULTY COORDINATOR</span>
                  </div>
                  <a href="tel:+919742338811" className="contact-detail-line contact-phone-line">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>+91 97423 38811</span>
                  </a>
                  <a href="mailto:raghukatagall@gmail.com" className="contact-detail-line">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span>raghukatagall@gmail.com</span>
                  </a>
                </div>

                {/* Person 3: Swayam Khangaonkar (Event Lead) */}
                <div className="footer-contact-card">
                  <div className="contact-card-header">
                    <span className="contact-person-name">Swayam Khangaonkar</span>
                    <span className="contact-role-badge">EVENT LEAD</span>
                  </div>
                  <a href="tel:+918105132836" className="contact-detail-line contact-phone-line">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>+91 81051 32836</span>
                  </a>
                  <a href="mailto:swayamuk1@gmail.com" className="contact-detail-line">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span>swayamuk1@gmail.com</span>
                  </a>
                </div>

                {/* Person 4: Rahul AK (Event Lead) */}
                <div className="footer-contact-card">
                  <div className="contact-card-header">
                    <span className="contact-person-name">Rahul AK</span>
                    <span className="contact-role-badge">EVENT LEAD</span>
                  </div>
                  <a href="tel:+918492595258" className="contact-detail-line contact-phone-line">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>+91 84925 95258</span>
                  </a>
                  <a href="mailto:Rahulak@gmail.com" className="contact-detail-line">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span>Rahulak@gmail.com</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Side: Floating 3D Astronaut Model */}
            <div className="footer-astronaut-wrap">
              <Astronaut3D />
            </div>
          </div>

          {/* Lower Section: Venue Tag & Interactive Google Maps Card */}
          <div className="footer-venue-wrap">
            <div className="footer-tag-wrap">
              <span className="cyan-line" />
              <span className="footer-tag-text">VENUE</span>
            </div>

            <div className="venue-card">
              {/* Map Preview Frame with Overlay Button */}
              <div className="venue-map-side">
                <iframe
                  title="Jain College of Engineering and Research Map"
                  src="https://maps.google.com/maps?q=Jain%20College%20Of%20Engineering%20And%20Research,%20Udyambag,%20Belagavi&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  className="venue-map-iframe"
                  loading="lazy"
                  allowFullScreen
                />
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Jain+College+Of+Engineering+And+Research+Udyambag+Belagavi+Karnataka+590008"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="venue-map-overlay-btn"
                >
                  <span>Open in Maps</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>

              {/* Venue Text & Details */}
              <div className="venue-info-side">
                <h4 className="venue-title">Jain College Of Engineering And Research</h4>
                <p className="venue-address">
                  682/2, 683/2A, Udyambag, Angol,<br />
                  Belagavi 590008, Karnataka
                </p>

                <a
                  href="https://www.google.com/maps/search/?api=1&query=Jain+College+Of+Engineering+And+Research+Udyambag+Belagavi+Karnataka+590008"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="venue-maps-btn"
                >
                  <span>Open in Google Maps</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
