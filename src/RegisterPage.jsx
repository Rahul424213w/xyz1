import React, { useState, useEffect, useRef } from 'react'
import Navbar from './Navbar'
import './RegisterPage.css'

const DOMAINS_LIST = [
  'Full Stack',
  'AI / ML',
  'Cybersecurity',
  'Cloud & DevOps',
  'Open Innovation'
]

const INITIAL_FORM = {
  teamName: '',
  institute: '',
  domain: '',
  extra: '1', // 1 additional member => 2 total members
  lead: '',
  phone: '',
  email: '',
  leaderGender: 'Male',
  mates: [
    { n: '', p: '', e: '', g: 'Male' },
    { n: '', p: '', e: '', g: 'Male' },
    { n: '', p: '', e: '', g: 'Male' }
  ],
  boys: '',
  girls: '',
  utr: '',
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().slice(0, 5),
  paymentScreenshot: null,
  paymentScreenshotName: ''
}

export default function RegisterPage({ onNavigate }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(INITIAL_FORM)
  const [error, setError] = useState({ msg: '', field: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [submittedData, setSubmittedData] = useState(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [copiedUpi, setCopiedUpi] = useState(false)

  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const containerRef = useRef(null)
  const totalSteps = 5

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Scroll to top on mount
  useEffect(() => {
    scrollToTop()
  }, [])

  // Cosmic Starfield background animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.6,
      opacity: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.3 + 0.1,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2
    }))

    let time = 0
    const render = () => {
      time += 1
      ctx.clearRect(0, 0, width, height)

      stars.forEach((star) => {
        star.y -= star.speed
        if (star.y < 0) {
          star.y = height
          star.x = Math.random() * width
        }

        const alpha =
          star.opacity * (0.6 + 0.4 * Math.sin(time * star.twinkleSpeed + star.twinkleOffset))

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.fill()
      })

      animId = requestAnimationFrame(render)
    }
    render()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Calculations
  const additionalCount = parseInt(form.extra, 10) || 1
  const teamTotalSize = 1 + additionalCount

  const handleInputChange = (field, val) => {
    setError({ msg: '', field: '' })
    setForm((prev) => ({ ...prev, [field]: val }))
  }

  const handleMateChange = (idx, field, val) => {
    setError({ msg: '', field: '' })
    setForm((prev) => {
      const updatedMates = [...prev.mates]
      updatedMates[idx] = { ...updatedMates[idx], [field]: val }
      return { ...prev, mates: updatedMates }
    })
  }

  // Copy UPI
  const handleCopyUpi = () => {
    navigator.clipboard.writeText('jcerhackvally@upi').then(() => {
      setCopiedUpi(true)
      setTimeout(() => setCopiedUpi(false), 2000)
    }).catch(() => {
      setCopiedUpi(true)
      setTimeout(() => setCopiedUpi(false), 2000)
    })
  }

  // Payment Screenshot Upload
  const handleFileSelect = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError({ msg: 'Please select a valid image file (PNG, JPG, or WEBP).', field: 'screenshot' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError({ msg: 'Image size exceeds 10MB. Please choose a smaller file.', field: 'screenshot' })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setError({ msg: '', field: '' })
      setForm((prev) => ({
        ...prev,
        paymentScreenshot: e.target.result,
        paymentScreenshotName: file.name
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveScreenshot = (e) => {
    e.stopPropagation()
    setForm((prev) => ({
      ...prev,
      paymentScreenshot: null,
      paymentScreenshotName: ''
    }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Validation
  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!form.teamName.trim() || form.teamName.trim().length < 2) {
        return { msg: 'Enter your team name (at least 2 characters).', field: 'teamName' }
      }
      if (!form.institute.trim() || form.institute.trim().length < 2) {
        return { msg: 'Enter your college / institution name.', field: 'institute' }
      }
      if (!form.domain) {
        return { msg: 'Please choose a valid domain from the dropdown.', field: 'domain' }
      }
      if (!form.extra) {
        return { msg: 'Please select your team size.', field: 'extra' }
      }
    } else if (currentStep === 2) {
      if (!form.lead.trim()) {
        return { msg: "Enter the team leader's full name.", field: 'lead' }
      }
      const phoneDigits = form.phone.replace(/[\s\-+]/g, '')
      if (phoneDigits.length < 10) {
        return { msg: 'Enter a valid 10-digit mobile number for team leader.', field: 'phone' }
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!form.email.trim() || !emailRegex.test(form.email.trim())) {
        return { msg: 'Enter a valid email address for team leader.', field: 'email' }
      }
    } else if (currentStep === 3) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const seenEmails = [form.email.trim().toLowerCase()]
      const seenPhones = [form.phone.replace(/[\s\-+]/g, '').slice(-10)]

      for (let i = 0; i < additionalCount; i++) {
        const m = form.mates[i]
        const num = i + 1
        if (!m.n.trim()) {
          return { msg: `Enter the full name of Member ${num}.`, field: `mn_${i}` }
        }
        const pDigits = m.p.replace(/[\s\-+]/g, '').slice(-10)
        if (pDigits.length < 10) {
          return { msg: `Enter a valid 10-digit mobile number for Member ${num}.`, field: `mp_${i}` }
        }
        if (!m.e.trim() || !emailRegex.test(m.e.trim())) {
          return { msg: `Enter a valid email address for Member ${num}.`, field: `me_${i}` }
        }
        const lowerEmail = m.e.trim().toLowerCase()
        if (seenEmails.includes(lowerEmail)) {
          return { msg: `Member ${num} must have a unique email address.`, field: `me_${i}` }
        }
        if (seenPhones.includes(pDigits)) {
          return { msg: `Member ${num} must have a unique phone number.`, field: `mp_${i}` }
        }
        seenEmails.push(lowerEmail)
        seenPhones.push(pDigits)
      }
    } else if (currentStep === 4) {
      const b = parseInt(form.boys, 10)
      const g = parseInt(form.girls, 10)
      if (isNaN(b) || b < 0) {
        return { msg: 'Enter the number of boys (0 if none).', field: 'boys' }
      }
      if (isNaN(g) || g < 0) {
        return { msg: 'Enter the number of girls (0 if none).', field: 'girls' }
      }
      if (b + g !== teamTotalSize) {
        return {
          msg: `Number of boys (${b || 0}) + girls (${g || 0}) must equal total team size (${teamTotalSize}).`,
          field: 'girls'
        }
      }
    } else if (currentStep === 5) {
      const cleanUtr = form.utr.trim().replace(/\s+/g, '')
      if (!cleanUtr || cleanUtr.length !== 12 || !/^\d{12}$/.test(cleanUtr)) {
        return { msg: 'UTR must contain exactly 12 numeric digits from your UPI app.', field: 'utr' }
      }
      if (/^(\d)\1{11}$/.test(cleanUtr)) {
        return { msg: 'UTR cannot contain the same digit repeated 12 times.', field: 'utr' }
      }
      if (!form.date) {
        return { msg: 'Enter the date of payment.', field: 'date' }
      }
      if (!form.time) {
        return { msg: 'Enter the time of payment.', field: 'time' }
      }
      if (!form.paymentScreenshot) {
        return { msg: 'Please upload a screenshot of your payment.', field: 'screenshot' }
      }
    }
    return null
  }

  const handleNext = () => {
    const err = validateStep(step)
    if (err) {
      setError(err)
      return
    }
    setError({ msg: '', field: '' })

    if (step < totalSteps) {
      setStep((prev) => prev + 1)
      scrollToTop()
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    setError({ msg: '', field: '' })
    if (step > 1) {
      setStep((prev) => prev - 1)
      scrollToTop()
    }
  }

  const handleSubmit = async () => {
    const err = validateStep(5)
    if (err) {
      setError(err)
      return
    }

    setIsSubmitting(true)

    // Generate Unique Registration ID: format HV26-XXX (e.g. HV26-258)
    const existingTeams = (() => {
      try {
        return JSON.parse(localStorage.getItem('hackvally_registrations') || '[]')
      } catch (e) {
        return []
      }
    })()
    const usedIds = new Set(existingTeams.map((t) => t.registrationId))
    let regId = ''
    for (let i = 0; i < 1000; i++) {
      const rand3 = Math.floor(100 + Math.random() * 900) // 100 to 999 (3 digits)
      const candidate = `HV26-${rand3}`
      if (!usedIds.has(candidate)) {
        regId = candidate
        break
      }
    }
    if (!regId) {
      regId = `HV26-${Math.floor(100 + Math.random() * 900)}`
    }

    const payload = {
      registrationId: regId,
      teamName: form.teamName.trim(),
      institute: form.institute.trim(),
      domain: form.domain,
      teamSize: teamTotalSize,
      leaderName: form.lead.trim(),
      leaderEmail: form.email.trim(),
      leaderPhone: form.phone.trim(),
      leaderGender: form.leaderGender,
      members: form.mates.slice(0, additionalCount).map((m) => ({
        name: m.n.trim(),
        phone: m.p.trim(),
        email: m.e.trim(),
        gender: m.g
      })),
      boys: parseInt(form.boys, 10),
      girls: parseInt(form.girls, 10),
      utr: form.utr.trim(),
      paymentDate: form.date,
      paymentTime: form.time,
      paymentScreenshot: form.paymentScreenshot,
      paymentScreenshotName: form.paymentScreenshotName,
      paymentStatus: 'Pending Verification',
      submittedAt: new Date().toISOString()
    }

    // Save locally
    try {
      const stored = JSON.parse(localStorage.getItem('hackvally_registrations') || '[]')
      stored.push(payload)
      localStorage.setItem('hackvally_registrations', JSON.stringify(stored))
      localStorage.setItem('hackvally_last_registration', JSON.stringify(payload))
      console.log('✅ [HackVally] Registration recorded:', payload)
    } catch (e) {
      console.warn('[HackVally] Storage note:', e)
    }

    // Persist registration to server (email will be dispatched once Admin clicks Approve)
    try {
      console.log(`[HackVally] Saving team registration on server for ${payload.teamName}...`)
      await fetch('/api/register-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      console.log('✅ [HackVally] Registration saved to server successfully')
    } catch (netErr) {
      console.warn('⚠️ [HackVally] Server registration note:', netErr.message)
    }

    setIsSubmitting(false)
    setSubmittedData(payload)
    setShowPopup(true)
    setIsCompleted(true)
    scrollToTop()
  }

  const handleRegisterAnother = () => {
    setForm(INITIAL_FORM)
    setStep(1)
    setError({ msg: '', field: '' })
    setShowPopup(false)
    setSubmittedData(null)
    setIsCompleted(false)
    scrollToTop()
  }

  // Official Report Download / Print
  const handleDownloadReport = () => {
    if (!submittedData) return

    const reportHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Hack Vally 2026 - Registration Pass #${submittedData.registrationId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Space Grotesk', 'Inter', Arial, sans-serif; background: #030712; color: #f8fafc; padding: 40px 20px; margin: 0; }
    .ticket-card { max-width: 650px; margin: 0 auto; background: #0e1428; border: 2px solid #f59e0b; border-radius: 24px; padding: 36px; box-shadow: 0 16px 50px rgba(0,0,0,0.85); box-sizing: border-box; }
    .ticket-header { text-align: center; border-bottom: 1px dashed rgba(255,255,255,0.18); padding-bottom: 24px; margin-bottom: 24px; }
    .badge { display: inline-block; background: #10b981; color: #fff; padding: 6px 16px; border-radius: 30px; font-weight: 700; font-size: 13px; margin-bottom: 12px; letter-spacing: 0.5px; }
    h1 { margin: 0 0 6px; font-size: 32px; color: #ffffff; letter-spacing: -0.01em; }
    .sub { color: #94a3b8; font-size: 14px; margin: 0; }
    .reg-id-box { background: rgba(245,158,11,0.12); border: 1px solid #f59e0b; border-radius: 14px; padding: 14px; margin: 20px 0; text-align: center; }
    .reg-id-lbl { font-size: 12px; color: #fbbf24; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; }
    .reg-id-val { font-size: 28px; font-weight: 800; color: #f59e0b; font-family: monospace; letter-spacing: 2px; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px; }
    .row { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px 16px; }
    .lbl { font-size: 11px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; display: block; font-weight: 600; letter-spacing: 0.5px; }
    .val { font-size: 15px; font-weight: 700; color: #ffffff; }
    .col-2 { grid-column: span 2; }
    .notice { background: rgba(37,99,235,0.12); border: 1px solid rgba(37,99,235,0.4); border-radius: 12px; padding: 14px 18px; font-size: 14px; color: #bfdbfe; margin-bottom: 14px; line-height: 1.45; text-align: center; }
    .note { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.35); border-radius: 12px; padding: 14px 18px; font-size: 13.5px; color: #fef3c7; line-height: 1.45; text-align: left; }
    .footer { text-align: center; margin-top: 26px; color: #64748b; font-size: 12px; }
    @media print {
      body { background: #fff !important; color: #000 !important; padding: 10px; }
      .ticket-card { background: #fff !important; border: 2px solid #000 !important; color: #000 !important; box-shadow: none !important; }
      h1, .val { color: #000 !important; }
      .reg-id-val { color: #000 !important; }
      .lbl, .sub { color: #555 !important; }
      .notice, .note, .row, .reg-id-box { background: #f8fafc !important; border: 1px solid #cbd5e1 !important; color: #000 !important; }
    }
  </style>
</head>
<body>
  <div class="ticket-card">
    <div class="ticket-header">
      <div class="badge">&#10003; REGISTRATION SUCCESSFUL</div>
      <h1>HACK VALLY 2026</h1>
      <p class="sub">Official Team Pass &bull; Dept. of Computer Science &amp; Engineering &bull; JCER Belagavi</p>
    </div>
    <div class="reg-id-box">
      <div class="reg-id-lbl">Registration ID</div>
      <div class="reg-id-val">${submittedData.registrationId}</div>
    </div>
    <div class="grid">
      <div class="row">
        <span class="lbl">Team Name</span>
        <span class="val">${submittedData.teamName}</span>
      </div>
      <div class="row">
        <span class="lbl">Domain</span>
        <span class="val">${submittedData.domain}</span>
      </div>
      <div class="row">
        <span class="lbl">Team Leader</span>
        <span class="val">${submittedData.leaderName}</span>
      </div>
      <div class="row">
        <span class="lbl">Institute</span>
        <span class="val">${submittedData.institute}</span>
      </div>
      <div class="row">
        <span class="lbl">Phone Number</span>
        <span class="val">${submittedData.leaderPhone}</span>
      </div>
      <div class="row">
        <span class="lbl">Email Address</span>
        <span class="val">${submittedData.leaderEmail}</span>
      </div>
      <div class="row col-2">
        <span class="lbl">Payment Verification</span>
        <span class="val">Pending Verification &bull; UTR: ${submittedData.utr}</span>
      </div>
    </div>
    <div class="notice">
      <strong>Your payment will be verified by the organizing team.</strong>
    </div>
    <div class="note">
      <strong>Note:</strong> An email will be send to team leader about payment conformation please check your email index / spam in 24 hrs
    </div>
    <div class="footer">
      Generated on ${new Date().toLocaleString()} &bull; Hack Vally &bull; All Rights Reserved
    </div>
  </div>
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`

    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (!win) {
      const a = document.createElement('a')
      a.href = url
      a.download = `HackVally_Ticket_${submittedData.registrationId}.html`
      a.click()
    }
  }

  return (
    <div ref={containerRef} className="register-page-container">
      {/* ── Background Cosmic Canvas & Ambient Nebulae ── */}
      <canvas ref={canvasRef} className="register-starfield" />
      <div className="register-ambient-glow glow-cyan" />
      <div className="register-ambient-glow glow-amber" />

      {/* ── Unified Global Navbar ── */}
      <Navbar currentPage="register" onNavigate={onNavigate} />

      {/* ── Main Registration Interface ── */}
      <main className="register-main-content">
        {!isCompleted ? (
          <div className="register-card-panel">
            {/* Step Progress Dots */}
            <div className="register-progress-wrap">
              <div className="register-prog-bars">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <span
                    key={i}
                    className={`prog-bar-segment ${i + 1 <= step ? 'active' : ''}`}
                  />
                ))}
              </div>
              <span className="register-step-counter">
                Step {step} of {totalSteps}
              </span>
            </div>

            {/* Step Header */}
            <div className="register-step-header">
              <div className="register-step-icon">
                {step === 1 && '👥'}
                {step === 2 && '👤'}
                {step === 3 && '👥'}
                {step === 4 && '🚻'}
                {step === 5 && '💳'}
              </div>
              <div className="register-step-text">
                <h2 className="register-step-title">
                  {step === 1 && 'TEAM DETAILS'}
                  {step === 2 && 'TEAM LEADER DETAILS'}
                  {step === 3 && 'TEAM MEMBERS'}
                  {step === 4 && 'GENDER SPLIT'}
                  {step === 5 && 'PAYMENT & VERIFICATION'}
                </h2>
                <p className="register-step-sub">
                  {step === 1 && 'Enter your team name, college, domain, and team size.'}
                  {step === 2 && 'Provide the primary contact information for your team leader.'}
                  {step === 3 && 'Enter details for the additional members of your team.'}
                  {step === 4 && 'Specify the gender distribution for event arrangements.'}
                  {step === 5 && 'Scan the UPI QR code to pay the ₹1000 registration fee.'}
                </p>
              </div>
            </div>

            {/* Step Form Body */}
            <div className="register-step-body">
              {/* STEP 1: TEAM DETAILS */}
              {step === 1 && (
                <div className="register-form-grid">
                  <div className="register-field">
                    <label className="field-lbl">
                      TEAM NAME <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      className={`register-input ${error.field === 'teamName' ? 'input-error' : ''}`}
                      placeholder="Enter your team name"
                      value={form.teamName}
                      maxLength={80}
                      onChange={(e) => handleInputChange('teamName', e.target.value)}
                    />
                  </div>

                  <div className="register-field">
                    <label className="field-lbl">
                      COLLEGE / INSTITUTION <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      className={`register-input ${error.field === 'institute' ? 'input-error' : ''}`}
                      placeholder="Your college / university name"
                      value={form.institute}
                      maxLength={120}
                      onChange={(e) => handleInputChange('institute', e.target.value)}
                    />
                  </div>

                  <div className="register-field">
                    <label className="field-lbl">
                      SELECT DOMAIN <span className="req">*</span>
                    </label>
                    <select
                      className={`register-select ${error.field === 'domain' ? 'input-error' : ''}`}
                      value={form.domain}
                      onChange={(e) => handleInputChange('domain', e.target.value)}
                    >
                      <option value="">-- Choose a domain --</option>
                      {DOMAINS_LIST.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="register-field">
                    <label className="field-lbl">
                      TEAM SIZE <span className="req">*</span>
                    </label>
                    <select
                      className={`register-select ${error.field === 'extra' ? 'input-error' : ''}`}
                      value={form.extra}
                      onChange={(e) => handleInputChange('extra', e.target.value)}
                    >
                      <option value="1">2 Members (1 Leader + 1 Member)</option>
                      <option value="2">3 Members (1 Leader + 2 Members)</option>
                      <option value="3">4 Members (1 Leader + 3 Members)</option>
                    </select>
                    <span className="field-helper">
                      Leader + {additionalCount} additional member{additionalCount > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}

              {/* STEP 2: TEAM LEADER DETAILS */}
              {step === 2 && (
                <div className="register-form-grid">
                  <div className="register-field col-span-2">
                    <label className="field-lbl">
                      FULL NAME <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      className={`register-input ${error.field === 'lead' ? 'input-error' : ''}`}
                      placeholder="Full name of leader"
                      value={form.lead}
                      maxLength={80}
                      onChange={(e) => handleInputChange('lead', e.target.value)}
                    />
                  </div>

                  <div className="register-field">
                    <label className="field-lbl">
                      PHONE NUMBER <span className="req">*</span>
                    </label>
                    <input
                      type="tel"
                      className={`register-input ${error.field === 'phone' ? 'input-error' : ''}`}
                      placeholder="10-digit mobile number"
                      value={form.phone}
                      maxLength={15}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>

                  <div className="register-field">
                    <label className="field-lbl">
                      EMAIL ADDRESS <span className="req">*</span>
                    </label>
                    <input
                      type="email"
                      className={`register-input ${error.field === 'email' ? 'input-error' : ''}`}
                      placeholder="leader@example.com"
                      value={form.email}
                      maxLength={120}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>

                  <div className="register-field col-span-2">
                    <label className="field-lbl">
                      GENDER <span className="req">*</span>
                    </label>
                    <div className="pill-group">
                      {['Male', 'Female', 'Other'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          className={`pill-btn ${form.leaderGender === g ? 'active' : ''}`}
                          onClick={() => handleInputChange('leaderGender', g)}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: TEAM MEMBERS */}
              {step === 3 && (
                <div className="members-stack">
                  <div className="info-banner">
                    Total Team Size: <strong>{teamTotalSize} members</strong> (1 Leader + {additionalCount} Member{additionalCount > 1 ? 's' : ''})
                  </div>

                  {Array.from({ length: additionalCount }, (_, i) => {
                    const mate = form.mates[i] || { n: '', p: '', e: '', g: 'Male' }
                    return (
                      <div key={i} className="member-card">
                        <div className="member-card-title">MEMBER {i + 1}</div>
                        <div className="register-form-grid">
                          <div className="register-field col-span-2">
                            <label className="field-lbl">
                              FULL NAME <span className="req">*</span>
                            </label>
                            <input
                              type="text"
                              className={`register-input ${error.field === `mn_${i}` ? 'input-error' : ''}`}
                              placeholder={`Full name of member ${i + 1}`}
                              value={mate.n}
                              maxLength={80}
                              onChange={(e) => handleMateChange(i, 'n', e.target.value)}
                            />
                          </div>

                          <div className="register-field">
                            <label className="field-lbl">
                              PHONE NUMBER <span className="req">*</span>
                            </label>
                            <input
                              type="tel"
                              className={`register-input ${error.field === `mp_${i}` ? 'input-error' : ''}`}
                              placeholder="10-digit mobile number"
                              value={mate.p}
                              maxLength={15}
                              onChange={(e) => handleMateChange(i, 'p', e.target.value)}
                            />
                          </div>

                          <div className="register-field">
                            <label className="field-lbl">
                              EMAIL ADDRESS <span className="req">*</span>
                            </label>
                            <input
                              type="email"
                              className={`register-input ${error.field === `me_${i}` ? 'input-error' : ''}`}
                              placeholder="member@example.com"
                              value={mate.e}
                              maxLength={120}
                              onChange={(e) => handleMateChange(i, 'e', e.target.value)}
                            />
                          </div>

                          <div className="register-field col-span-2">
                            <label className="field-lbl">
                              GENDER <span className="req">*</span>
                            </label>
                            <div className="pill-group">
                              {['Male', 'Female', 'Other'].map((g) => (
                                <button
                                  key={g}
                                  type="button"
                                  className={`pill-btn ${mate.g === g ? 'active' : ''}`}
                                  onClick={() => handleMateChange(i, 'g', g)}
                                >
                                  {g}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* STEP 4: GENDER SPLIT */}
              {step === 4 && (
                <div>
                  <div className="info-banner">
                    Total team size is <strong>{teamTotalSize}</strong>. Boy count + Girl count must equal exactly <strong>{teamTotalSize}</strong>.
                  </div>

                  <div className="register-form-grid">
                    <div className="register-field">
                      <label className="field-lbl">
                        NUMBER OF BOYS <span className="req">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={teamTotalSize}
                        className={`register-input ${error.field === 'boys' ? 'input-error' : ''}`}
                        placeholder="0"
                        value={form.boys}
                        onChange={(e) => handleInputChange('boys', e.target.value)}
                      />
                    </div>

                    <div className="register-field">
                      <label className="field-lbl">
                        NUMBER OF GIRLS <span className="req">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={teamTotalSize}
                        className={`register-input ${error.field === 'girls' ? 'input-error' : ''}`}
                        placeholder="0"
                        value={form.girls}
                        onChange={(e) => handleInputChange('girls', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: PAYMENT & VERIFICATION */}
              {step === 5 && (
                <div className="payment-step-wrap">
                  {/* Fee Banner */}
                  <div className="payment-fee-card">
                    <div className="payment-fee-amount">₹1000</div>
                    <div className="payment-fee-note">
                      Flat registration fee for the entire team ({teamTotalSize} members)
                    </div>
                    <div className="payment-qr-wrap">
                      <img
                        src="/assets/payment-qr.png"
                        alt="UPI Payment QR Code"
                        className="payment-qr-img"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.parentNode.classList.add('qr-fallback')
                          e.target.parentNode.textContent = 'UPI QR: jcerhackvally@upi'
                        }}
                      />
                    </div>
                    <div className="payment-upi-id-box">
                      <span>UPI ID: <strong>jcerhackvally@upi</strong></span>
                      <button
                        type="button"
                        className="copy-upi-btn"
                        onClick={handleCopyUpi}
                      >
                        {copiedUpi ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Payment Details Form */}
                  <div className="register-form-grid">
                    <div className="register-field col-span-2">
                      <label className="field-lbl">
                        12-DIGIT TRANSACTION ID / UTR NUMBER <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={12}
                        className={`register-input ${error.field === 'utr' ? 'input-error' : ''}`}
                        placeholder="e.g. 431289567123"
                        value={form.utr}
                        onChange={(e) => handleInputChange('utr', e.target.value.replace(/\D/g, ''))}
                      />
                      <span className="field-helper">
                        12-digit transaction ID / UPI Reference number from your payment app
                      </span>

                      {/* Small Note near 12-Digit Transaction ID */}
                      <div className="utr-verification-note">
                        <span className="utr-note-icon">⚠️</span>
                        <div className="utr-note-content">
                          <strong>Note:</strong> Please make sure the transaction ID / UPI Reference number is entered correctly. Verify and double-check before submitting to ensure prompt payment verification.
                        </div>
                      </div>
                    </div>

                    <div className="register-field">
                      <label className="field-lbl">
                        DATE OF PAYMENT <span className="req">*</span>
                      </label>
                      <input
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        className={`register-input ${error.field === 'date' ? 'input-error' : ''}`}
                        value={form.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                      />
                    </div>

                    <div className="register-field">
                      <label className="field-lbl">
                        TIME OF PAYMENT <span className="req">*</span>
                      </label>
                      <input
                        type="time"
                        className={`register-input ${error.field === 'time' ? 'input-error' : ''}`}
                        value={form.time}
                        onChange={(e) => handleInputChange('time', e.target.value)}
                      />
                    </div>

                    {/* MANDATORY PAYMENT SCREENSHOT UPLOAD */}
                    <div className="register-field col-span-2">
                      <label className="field-lbl">
                        PAYMENT SCREENSHOT <span className="req">*</span>
                      </label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileSelect(e.target.files[0])
                          }
                        }}
                      />

                      <div
                        className={`pay-screenshot-dropzone ${error.field === 'screenshot' ? 'dropzone-error' : ''}`}
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault()
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleFileSelect(e.dataTransfer.files[0])
                          }
                        }}
                      >
                        {!form.paymentScreenshot ? (
                          <div className="dropzone-empty">
                            <span className="dropzone-icon">📸</span>
                            <span className="dropzone-title">
                              Click to upload or drag &amp; drop payment screenshot
                            </span>
                            <span className="dropzone-sub">
                              Mandatory: Upload clear screenshot showing UTR &amp; Amount (PNG, JPG, WEBP)
                            </span>
                          </div>
                        ) : (
                          <div className="dropzone-preview">
                            <img
                              src={form.paymentScreenshot}
                              alt="Payment Screenshot Preview"
                              className="dropzone-preview-thumb"
                            />
                            <div className="dropzone-preview-details">
                              <span className="dropzone-file-name">
                                {form.paymentScreenshotName}
                              </span>
                              <span className="dropzone-status-badge">
                                ✓ Screenshot Attached
                              </span>
                              <button
                                type="button"
                                className="dropzone-remove-btn"
                                onClick={handleRemoveScreenshot}
                              >
                                Remove / Replace
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="field-helper">
                        Ensure the transaction ID / UTR and amount are clearly readable
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message Box */}
            {error.msg && (
              <div className="register-error-banner" role="alert">
                <span>⚠</span> {error.msg}
              </div>
            )}

            {/* Navigation Action Buttons */}
            <div className="register-action-row">
              {step > 1 ? (
                <button
                  type="button"
                  className="register-btn-back"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                className="register-btn-continue"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Submitting…'
                  : step === totalSteps
                  ? 'Submit Registration'
                  : 'Continue'}
              </button>
            </div>
          </div>
        ) : (
          /* ── TICKET VIEW (Registration Successful View) ── */
          <div className="register-ticket-panel">
            <div className="ticket-success-icon-wrap">
              <div className="ticket-success-icon">✓</div>
            </div>

            <h2 className="ticket-main-title">Registration Successful</h2>
            <p className="ticket-sub-title">
              Your team registration has been recorded successfully.
            </p>

            <div className="ticket-info-grid">
              <div className="ticket-stat-box highlight-id">
                <span className="stat-label">Registration ID</span>
                <strong className="stat-value amber-code">
                  {submittedData?.registrationId}
                </strong>
              </div>

              <div className="ticket-stat-box">
                <span className="stat-label">Team Name</span>
                <strong className="stat-value">{submittedData?.teamName}</strong>
              </div>

              <div className="ticket-stat-box">
                <span className="stat-label">Team Leader</span>
                <strong className="stat-value">{submittedData?.leaderName}</strong>
              </div>

              <div className="ticket-stat-box">
                <span className="stat-label">Institute</span>
                <strong className="stat-value">{submittedData?.institute}</strong>
              </div>

              <div className="ticket-stat-box">
                <span className="stat-label">Domain</span>
                <strong className="stat-value">{submittedData?.domain}</strong>
              </div>

              <div className="ticket-stat-box">
                <span className="stat-label">Payment</span>
                <strong className="stat-value pending-badge">
                  {submittedData?.paymentStatus}
                </strong>
              </div>
            </div>

            {/* Payment Verified Notice in clean, clear readable typography */}
            <div className="ticket-verified-callout">
              Your payment will be verified by the organizing team.
            </div>

            {/* Note Callout */}
            <div className="ticket-note-callout">
              <span className="ticket-note-tag">Note:</span>
              An email will be send to team leader about payment conformation please check your email index / spam in 24 hrs
            </div>

            {/* Action Buttons */}
            <div className="ticket-action-buttons">
              <a
                href="https://chat.whatsapp.com/E9TgFoq4d6tAMQOp6FBnax"
                target="_blank"
                rel="noopener noreferrer"
                className="ticket-wa-button"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.311.045-.698.077-2.102-.505-.724-.3-1.353-.787-1.854-1.285-.502-.502-.857-1.135-1.127-1.855-.268-.718-.027-1.396.118-1.541.144-.144.32-.32.48-.48.16-.16.213-.267.32-.48.107-.213.053-.4-.027-.56-.08-.16-.72-1.734-.986-2.374-.26-.622-.52-.538-.72-.548l-.613-.01c-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.667 0 1.573 1.147 3.093 1.307 3.307.16.213 2.24 3.44 5.44 4.8 3.2 1.36 3.2.907 3.787.853.587-.053 1.893-.773 2.16-1.52.267-.747.267-1.387.187-1.52-.08-.133-.293-.213-.613-.373z"/>
                </svg>
                <span>Join Official WhatsApp Group</span>
              </a>

              {/* Download Report Button */}
              <button
                type="button"
                className="ticket-download-btn"
                onClick={handleDownloadReport}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download Registration Report</span>
              </button>

              <button
                type="button"
                className="ticket-restart-btn"
                onClick={handleRegisterAnother}
              >
                Register another team
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── REDESIGNED "THANK YOU" POP-UP MODAL ── */}
      {showPopup && submittedData && (
        <div
          className="modal-backdrop-overlay"
          onClick={() => setShowPopup(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modern-popup-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Perfectly circular top-right close button */}
            <button
              type="button"
              className="popup-close-circle-btn"
              onClick={() => setShowPopup(false)}
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Glowing Green Success Badge */}
            <div className="popup-badge-container">
              <div className="popup-badge-circle">✓</div>
            </div>

            {/* Head Title */}
            <h2 className="popup-main-title">Thank You</h2>

            {/* Note Box */}
            <div className="popup-note-banner">
              <span className="popup-note-highlight">Note:</span>
              An email will be send to team leader about payment conformation please check your email index / spam in 24 hrs
            </div>

            {/* Quick Details Card */}
            <div className="popup-details-card">
              <div className="popup-detail-row">
                <span className="popup-detail-label">Registration ID</span>
                <span className="popup-detail-value amber-highlight">
                  {submittedData.registrationId}
                </span>
              </div>
              <div className="popup-detail-row">
                <span className="popup-detail-label">Team Name</span>
                <span className="popup-detail-value">{submittedData.teamName}</span>
              </div>
              <div className="popup-detail-row">
                <span className="popup-detail-label">Selected Domain</span>
                <span className="popup-detail-value">{submittedData.domain}</span>
              </div>
            </div>

            {/* Join WhatsApp Group Section */}
            <div className="popup-wa-box">
              <h3 className="popup-wa-heading">Join Whatsapp Group</h3>
              <a
                href="https://chat.whatsapp.com/E9TgFoq4d6tAMQOp6FBnax"
                target="_blank"
                rel="noopener noreferrer"
                className="popup-wa-cta-btn"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.311.045-.698.077-2.102-.505-.724-.3-1.353-.787-1.854-1.285-.502-.502-.857-1.135-1.127-1.855-.268-.718-.027-1.396.118-1.541.144-.144.32-.32.48-.48.16-.16.213-.267.32-.48.107-.213.053-.4-.027-.56-.08-.16-.72-1.734-.986-2.374-.26-.622-.52-.538-.72-.548l-.613-.01c-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.667 0 1.573 1.147 3.093 1.307 3.307.16.213 2.24 3.44 5.44 4.8 3.2 1.36 3.2.907 3.787.853.587-.053 1.893-.773 2.16-1.52.267-.747.267-1.387.187-1.52-.08-.133-.293-.213-.613-.373z"/>
                </svg>
                <span>Join Official WhatsApp Group</span>
              </a>
              <a
                href="https://chat.whatsapp.com/E9TgFoq4d6tAMQOp6FBnax"
                target="_blank"
                rel="noopener noreferrer"
                className="popup-wa-text-link"
              >
                https://chat.whatsapp.com/E9TgFoq4d6tAMQOp6FBnax
              </a>
            </div>

            {/* Close & View Ticket button */}
            <button
              type="button"
              className="popup-view-ticket-btn"
              onClick={() => setShowPopup(false)}
            >
              Close &amp; View Ticket
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
