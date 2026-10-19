import React, { useState, useEffect } from 'react'
import './AdminPage.css'

export default function AdminPage({ onNavigate }) {
  // ── Two-Tier Authentication State ──
  // Tier 1: PIN Verified
  const [isPinVerified, setIsPinVerified] = useState(() => {
    return sessionStorage.getItem('hackvally_admin_pin_verified') === 'true'
  })
  // Tier 2: Email & Password Logged In
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('hackvally_admin_logged_in') === 'true'
  })
  const [currentAdminUser, setCurrentAdminUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('hackvally_admin_user') || 'null')
    } catch (e) {
      return null
    }
  })

  // PIN Unlock state (Tier 1)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [isVerifyingPin, setIsVerifyingPin] = useState(false)

  // Admin Email & Password login state (Tier 2)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Active view tab: 'teams' | 'pin' | 'access'
  const [activeTab, setActiveTab] = useState('teams')

  // Registered teams data & filters
  const [teams, setTeams] = useState([])
  const [domainFilter, setDomainFilter] = useState('All Domains')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [approvingId, setApprovingId] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  // View image modal
  const [selectedImageTeam, setSelectedImageTeam] = useState(null)

  // PIN settings state
  const [defaultPinEnabled, setDefaultPinEnabled] = useState(true)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinFeedback, setPinFeedback] = useState({ text: '', type: '' })

  // Admin Access management state
  const [adminUsers, setAdminUsers] = useState([])
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [adminAccessFeedback, setAdminAccessFeedback] = useState({ text: '', type: '' })
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false)

  // Edit Admin state
  const [editingAdmin, setEditingAdmin] = useState(null)
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // ── 1. Load Data ──
  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams')
      const json = await res.json()
      let serverTeams = json.success && Array.isArray(json.teams) ? json.teams : []

      try {
        const localTeams = JSON.parse(localStorage.getItem('hackvally_registrations') || '[]')
        const map = new Map()
        serverTeams.forEach((t) => map.set(t.registrationId, t))
        localTeams.forEach((t) => {
          if (!map.has(t.registrationId)) {
            map.set(t.registrationId, t)
          }
        })
        serverTeams = Array.from(map.values())
      } catch (e) {
        console.warn('Local teams read error:', e)
      }

      setTeams(serverTeams)
    } catch (err) {
      console.warn('Server teams fetch failed, falling back to localStorage:', err)
      try {
        const localTeams = JSON.parse(localStorage.getItem('hackvally_registrations') || '[]')
        setTeams(localTeams)
      } catch (e) {
        setTeams([])
      }
    }
  }

  const fetchPinConfig = async () => {
    try {
      const res = await fetch('/api/admin-pin-config')
      const json = await res.json()
      if (json.success) {
        setDefaultPinEnabled(json.defaultPinEnabled !== false)
      }
    } catch (err) {
      const localDef = localStorage.getItem('hackvally_default_pin_enabled')
      if (localDef !== null) {
        setDefaultPinEnabled(localDef === 'true')
      }
    }
  }

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch('/api/admin-users')
      const json = await res.json()
      if (json.success && Array.isArray(json.users)) {
        setAdminUsers(json.users)
      }
    } catch (err) {
      console.warn('Failed to fetch admin users:', err)
      try {
        const local = JSON.parse(localStorage.getItem('hackvally_admin_users') || '[]')
        setAdminUsers(local)
      } catch (e) {}
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchTeams()
      fetchPinConfig()
      fetchAdminUsers()
    }
  }, [isAuthenticated])

  // ── 2. Handle PIN Unlock (Tier 1) ──
  const handleVerifyPin = async (e) => {
    e.preventDefault()
    if (!pinInput.trim()) {
      setPinError('Please enter a PIN')
      return
    }

    setIsVerifyingPin(true)
    setPinError('')

    try {
      const res = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput.trim() })
      })
      const json = await res.json()

      if (json.success && json.authorized) {
        setIsPinVerified(true)
        sessionStorage.setItem('hackvally_admin_pin_verified', 'true')
        setPinError('')
      } else {
        setPinError(json.error || 'Incorrect PIN entered')
      }
    } catch (err) {
      const trimmed = pinInput.trim()
      const savedPin = localStorage.getItem('hackvally_admin_pin') || 'admin2026'
      const defEnabled = localStorage.getItem('hackvally_default_pin_enabled') !== 'false'

      if (trimmed === savedPin || (defEnabled && trimmed === 'jcerbhackvally')) {
        setIsPinVerified(true)
        sessionStorage.setItem('hackvally_admin_pin_verified', 'true')
        setPinError('')
      } else if (!defEnabled && trimmed === 'jcerbhackvally') {
        setPinError('Default PIN is disabled. Please enter your main Access PIN.')
      } else {
        setPinError('Incorrect PIN entered')
      }
    } finally {
      setIsVerifyingPin(false)
    }
  }

  // ── 3. Handle Admin Email & Password Login (Tier 2) ──
  const handleAdminLogin = async (e) => {
    e.preventDefault()
    if (!loginEmail.trim()) {
      setLoginError('Please enter your authorized admin email')
      return
    }
    if (!loginPassword.trim()) {
      setLoginError('Please enter your admin password')
      return
    }

    setIsLoggingIn(true)
    setLoginError('')

    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim().toLowerCase(),
          password: loginPassword.trim()
        })
      })
      const json = await res.json()

      if (json.success && json.user) {
        setIsAuthenticated(true)
        setCurrentAdminUser(json.user)
        sessionStorage.setItem('hackvally_admin_logged_in', 'true')
        sessionStorage.setItem('hackvally_admin_user', JSON.stringify(json.user))
        setLoginError('')
      } else {
        setLoginError(json.error || 'Invalid admin email or password')
      }
    } catch (err) {
      try {
        const localAdmins = JSON.parse(localStorage.getItem('hackvally_admin_users') || '[]')
        const found = localAdmins.find(
          (u) =>
            u.email.toLowerCase() === loginEmail.trim().toLowerCase() &&
            u.password === loginPassword.trim()
        )
        if (found || (loginEmail.trim().toLowerCase() === 'swayamuk1@gmail.com' && loginPassword.trim() === 'admin123')) {
          const userObj = found || { id: 'admin_1', email: 'swayamuk1@gmail.com', role: 'Super Admin' }
          setIsAuthenticated(true)
          setCurrentAdminUser(userObj)
          sessionStorage.setItem('hackvally_admin_logged_in', 'true')
          sessionStorage.setItem('hackvally_admin_user', JSON.stringify(userObj))
        } else {
          setLoginError('Invalid admin email or password. Only authorized admin emails can access.')
        }
      } catch (e2) {
        setLoginError('Authentication error. Please try again.')
      }
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLockPanel = () => {
    sessionStorage.removeItem('hackvally_admin_logged_in')
    sessionStorage.removeItem('hackvally_admin_pin_verified')
    sessionStorage.removeItem('hackvally_admin_user')
    setIsAuthenticated(false)
    setIsPinVerified(false)
    setCurrentAdminUser(null)
    setPinInput('')
    setLoginEmail('')
    setLoginPassword('')
  }

  // ── 4. Handle Team Approval ──
  const handleApproveTeam = async (team) => {
    setApprovingId(team.registrationId)
    setToastMessage(`Approving ${team.teamName} and sending email...`)

    try {
      const res = await fetch('/api/approve-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: team.registrationId })
      })
      const json = await res.json()

      if (json.success) {
        setTeams((prev) =>
          prev.map((t) =>
            t.registrationId === team.registrationId
              ? { ...t, status: 'Approved', paymentStatus: 'Approved' }
              : t
          )
        )

        try {
          const stored = JSON.parse(localStorage.getItem('hackvally_registrations') || '[]')
          const updated = stored.map((t) =>
            t.registrationId === team.registrationId
              ? { ...t, status: 'Approved', paymentStatus: 'Approved' }
              : t
          )
          localStorage.setItem('hackvally_registrations', JSON.stringify(updated))
        } catch (e) {}

        setToastMessage(`✅ ${team.teamName} approved! Confirmation email sent to ${team.leaderEmail}`)
        setTimeout(() => setToastMessage(''), 5000)
      } else {
        alert('Could not approve team: ' + (json.error || 'Unknown error'))
      }
    } catch (err) {
      console.error('Approve error:', err)
      setTeams((prev) =>
        prev.map((t) =>
          t.registrationId === team.registrationId
            ? { ...t, status: 'Approved', paymentStatus: 'Approved' }
            : t
        )
      )
      setToastMessage(`✅ ${team.teamName} marked as Approved locally`)
      setTimeout(() => setToastMessage(''), 4000)
    } finally {
      setApprovingId(null)
    }
  }

  // ── 5. PIN Settings Handlers ──
  const handleToggleDefaultPin = async () => {
    const nextState = !defaultPinEnabled
    setDefaultPinEnabled(nextState)
    localStorage.setItem('hackvally_default_pin_enabled', String(nextState))

    try {
      await fetch('/api/admin-pin-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultPinEnabled: nextState })
      })
      setPinFeedback({
        text: nextState
          ? 'Default PIN (jcerbhackvally) is now ENABLED as backup.'
          : 'Default PIN (jcerbhackvally) is now DISABLED. Only custom Access PIN works.',
        type: 'success'
      })
    } catch (err) {
      setPinFeedback({
        text: `Default PIN ${nextState ? 'enabled' : 'disabled'} locally`,
        type: 'success'
      })
    }
  }

  const handleUpdatePin = async (e) => {
    e.preventDefault()
    if (!newPin.trim()) {
      setPinFeedback({ text: 'Please enter a new PIN', type: 'error' })
      return
    }
    if (newPin !== confirmPin) {
      setPinFeedback({ text: 'New PIN and Confirm PIN do not match', type: 'error' })
      return
    }

    try {
      await fetch('/api/admin-pin-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPin: newPin.trim(), defaultPinEnabled })
      })
      localStorage.setItem('hackvally_admin_pin', newPin.trim())
      setNewPin('')
      setConfirmPin('')
      setPinFeedback({ text: '✓ Admin PIN updated successfully!', type: 'success' })
    } catch (err) {
      localStorage.setItem('hackvally_admin_pin', newPin.trim())
      setNewPin('')
      setConfirmPin('')
      setPinFeedback({ text: '✓ Admin PIN saved locally!', type: 'success' })
    }
  }

  // ── 6. Admin Access Handlers (Add, Edit, Remove) ──
  const handleAddAdmin = async (e) => {
    e.preventDefault()
    setAdminAccessFeedback({ text: '', type: '' })

    if (!newAdminEmail.trim()) {
      setAdminAccessFeedback({ text: 'Please enter an admin email address', type: 'error' })
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newAdminEmail.trim())) {
      setAdminAccessFeedback({ text: 'Please enter a valid email format', type: 'error' })
      return
    }
    if (!newAdminPassword.trim()) {
      setAdminAccessFeedback({ text: 'Please enter a password for this admin', type: 'error' })
      return
    }

    setIsSubmittingAdmin(true)
    try {
      const res = await fetch('/api/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newAdminEmail.trim().toLowerCase(),
          password: newAdminPassword.trim()
        })
      })
      const json = await res.json()
      if (json.success) {
        setAdminAccessFeedback({
          text: `✓ Admin access granted for ${newAdminEmail.trim().toLowerCase()}!`,
          type: 'success'
        })
        setNewAdminEmail('')
        setNewAdminPassword('')
        fetchAdminUsers()
      } else {
        setAdminAccessFeedback({ text: json.error || 'Failed to add admin', type: 'error' })
      }
    } catch (err) {
      const newUser = {
        id: 'admin_' + Date.now(),
        email: newAdminEmail.trim().toLowerCase(),
        password: newAdminPassword.trim(),
        role: 'Admin',
        createdAt: new Date().toISOString()
      }
      const updated = [...adminUsers, newUser]
      setAdminUsers(updated)
      localStorage.setItem('hackvally_admin_users', JSON.stringify(updated))
      setAdminAccessFeedback({
        text: `✓ Admin access granted locally for ${newUser.email}!`,
        type: 'success'
      })
      setNewAdminEmail('')
      setNewAdminPassword('')
    } finally {
      setIsSubmittingAdmin(false)
    }
  }

  const handleRemoveAdmin = async (user) => {
    if (adminUsers.length <= 1) {
      alert('Cannot remove the last remaining admin account. At least one admin is required.')
      return
    }

    const confirmDelete = window.confirm(
      `Revoke admin access for ${user.email}?\n\nThey will no longer be able to log in to the admin panel.`
    )
    if (!confirmDelete) return

    try {
      const res = await fetch('/api/admin-users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id })
      })
      const json = await res.json()
      if (json.success) {
        setAdminAccessFeedback({
          text: `✓ Admin access revoked for ${user.email}`,
          type: 'success'
        })
        fetchAdminUsers()
      } else {
        alert(json.error || 'Failed to remove admin')
      }
    } catch (err) {
      try {
        await fetch('/api/admin-users/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user.id })
        })
        fetchAdminUsers()
      } catch (e2) {
        const filtered = adminUsers.filter((u) => u.id !== user.id)
        setAdminUsers(filtered)
        localStorage.setItem('hackvally_admin_users', JSON.stringify(filtered))
      }
    }
  }

  const handleOpenEdit = (user) => {
    setEditingAdmin(user)
    setEditEmail(user.email)
    setEditPassword(user.password || '')
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingAdmin) return
    if (!editEmail.trim()) {
      alert('Email cannot be empty')
      return
    }

    setIsSavingEdit(true)
    try {
      const res = await fetch('/api/admin-users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAdmin.id,
          email: editEmail.trim().toLowerCase(),
          password: editPassword.trim()
        })
      })
      const json = await res.json()
      if (json.success) {
        setEditingAdmin(null)
        setAdminAccessFeedback({
          text: `✓ Updated access details for ${editEmail.trim().toLowerCase()}`,
          type: 'success'
        })
        fetchAdminUsers()
      } else {
        alert(json.error || 'Failed to update admin')
      }
    } catch (err) {
      try {
        await fetch('/api/admin-users/edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingAdmin.id,
            email: editEmail.trim().toLowerCase(),
            password: editPassword.trim()
          })
        })
        setEditingAdmin(null)
        fetchAdminUsers()
      } catch (e2) {
        const updated = adminUsers.map((u) =>
          u.id === editingAdmin.id
            ? { ...u, email: editEmail.trim().toLowerCase(), password: editPassword.trim() }
            : u
        )
        setAdminUsers(updated)
        localStorage.setItem('hackvally_admin_users', JSON.stringify(updated))
        setEditingAdmin(null)
      }
    } finally {
      setIsSavingEdit(false)
    }
  }

  // ── 7. Export to Excel / CSV (Without Accommodation) ──
  const handleExportCSV = () => {
    if (teams.length === 0) {
      alert('No teams registered yet to export.')
      return
    }

    const headers = [
      'Registration ID',
      'Team Name',
      'Domain',
      'College / Institute',
      'Team Size',
      'Leader Name',
      'Leader Email',
      'Leader Phone',
      'Leader Gender',
      'Member 2 Name',
      'Member 2 Phone',
      'Member 2 Email',
      'Member 2 Gender',
      'Member 3 Name',
      'Member 3 Phone',
      'Member 3 Email',
      'Member 3 Gender',
      'Member 4 Name',
      'Member 4 Phone',
      'Member 4 Email',
      'Member 4 Gender',
      'Boys Count',
      'Girls Count',
      'Transaction ID / UTR',
      'Payment Date',
      'Payment Time',
      'Payment Status',
      'Admin Status',
      'Submitted At'
    ]

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }

    const rows = teams.map((t) => {
      const m1 = t.members && t.members[0] ? t.members[0] : {}
      const m2 = t.members && t.members[1] ? t.members[1] : {}
      const m3 = t.members && t.members[2] ? t.members[2] : {}

      return [
        escapeCsv(t.registrationId),
        escapeCsv(t.teamName),
        escapeCsv(t.domain),
        escapeCsv(t.institute),
        escapeCsv(t.teamSize),
        escapeCsv(t.leaderName),
        escapeCsv(t.leaderEmail),
        escapeCsv(t.leaderPhone),
        escapeCsv(t.leaderGender),
        escapeCsv(m1.name),
        escapeCsv(m1.phone),
        escapeCsv(m1.email),
        escapeCsv(m1.gender),
        escapeCsv(m2.name),
        escapeCsv(m2.phone),
        escapeCsv(m2.email),
        escapeCsv(m2.gender),
        escapeCsv(m3.name),
        escapeCsv(m3.phone),
        escapeCsv(m3.email),
        escapeCsv(m3.gender),
        escapeCsv(t.boys),
        escapeCsv(t.girls),
        escapeCsv(t.utr),
        escapeCsv(t.paymentDate),
        escapeCsv(t.paymentTime),
        escapeCsv(t.paymentStatus),
        escapeCsv(t.status || 'Pending'),
        escapeCsv(t.submittedAt)
      ].join(',')
    })

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `HackVally_Registered_Teams_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Filtering teams
  const filteredTeams = teams.filter((team) => {
    if (domainFilter !== 'All Domains' && team.domain !== domainFilter) {
      return false
    }
    if (statusFilter !== 'All Status') {
      const isApproved = team.status === 'Approved'
      if (statusFilter === 'Approved' && !isApproved) return false
      if (statusFilter === 'Pending' && isApproved) return false
    }
    return true
  })

  // ── 8. Render Lock Screens (Two-Tier Auth) ──

  // Tier 1: PIN Screen
  if (!isPinVerified) {
    return (
      <div className="admin-lock-screen">
        <div className="admin-lock-card">
          <div className="lock-icon-wrap">🔒</div>
          <h1 className="lock-title">HACK VALLY ADMIN</h1>
          <p className="lock-sub">Step 1: Enter your security PIN to access the management portal.</p>

          <form onSubmit={handleVerifyPin}>
            <input
              type="password"
              className="lock-pin-input"
              placeholder="Enter PIN"
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value)
                setPinError('')
              }}
              autoFocus
            />

            <button type="submit" className="btn-unlock" disabled={isVerifyingPin}>
              {isVerifyingPin ? 'Verifying…' : 'Unlock Panel →'}
            </button>
          </form>

          {pinError && <div className="lock-error-text">⚠ {pinError}</div>}
        </div>
      </div>
    )
  }

  // Tier 2: Email & Password Login Screen
  if (isPinVerified && !isAuthenticated) {
    return (
      <div className="admin-lock-screen">
        <div className="admin-lock-card">
          <div
            className="lock-icon-wrap"
            style={{
              background: 'rgba(20, 184, 166, 0.12)',
              borderColor: 'rgba(20, 184, 166, 0.35)',
              color: '#2dd4bf'
            }}
          >
            🛡️
          </div>
          <h1 className="lock-title">ADMIN LOGIN</h1>
          <p className="lock-sub">
            Step 2: Enter authorized administrator email and password to access the portal.
          </p>

          <form onSubmit={handleAdminLogin}>
            <div className="admin-login-inputs-wrap">
              <div>
                <label className="admin-login-field-lbl">Admin Email</label>
                <input
                  type="email"
                  className="admin-login-input"
                  placeholder="admin@example.com"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value)
                    setLoginError('')
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label className="admin-login-field-lbl">Password</label>
                <input
                  type="password"
                  className="admin-login-input"
                  placeholder="Enter admin password"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value)
                    setLoginError('')
                  }}
                />
              </div>
            </div>

            <button type="submit" className="btn-login-admin" disabled={isLoggingIn}>
              {isLoggingIn ? 'Verifying Credentials…' : 'Access Admin Panel'}
            </button>
          </form>

          {loginError && <div className="lock-error-text">⚠ {loginError}</div>}

          <div>
            <button
              type="button"
              className="btn-back-to-pin"
              onClick={() => {
                sessionStorage.removeItem('hackvally_admin_pin_verified')
                setIsPinVerified(false)
              }}
            >
              ← Back to PIN verification
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── 9. Render Main Admin Panel ──
  return (
    <div className="admin-container">
      {/* ── Left Sidebar ── */}
      <aside className="admin-sidebar">
        <div className="admin-brand-wrap">
          <h2 className="admin-brand-title">HACK VALLY</h2>
          <span className="admin-brand-sub">ADMIN</span>
        </div>

        {/* Profile Badge */}
        <div className="admin-profile-box">
          <div className="admin-avatar">
            {currentAdminUser?.email ? currentAdminUser.email[0].toUpperCase() : 'S'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', textAlign: 'center', width: '100%' }}>
            <span
              className="admin-user-name"
              style={{
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}
              title={currentAdminUser?.email}
            >
              {currentAdminUser?.email || 'Swayam Khangaonkar'}
            </span>
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
              ● {currentAdminUser?.role || 'Super Admin'}
            </span>
          </div>
        </div>

        {/* Navigation Menu (Registered Teams, PIN Settings, Admin Access) */}
        <nav className="admin-nav">
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            <span className="admin-nav-icon">📋</span>
            <span>Registered Teams</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'pin' ? 'active' : ''}`}
            onClick={() => setActiveTab('pin')}
          >
            <span className="admin-nav-icon">🔑</span>
            <span>PIN Settings</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'access' ? 'active' : ''}`}
            onClick={() => setActiveTab('access')}
          >
            <span className="admin-nav-icon">🛡️</span>
            <span>Admin Access</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-exit-btn"
            onClick={() => {
              if (onNavigate) onNavigate('landing')
              else window.location.hash = '#home'
            }}
          >
            ← Exit to Website
          </button>
          <button
            type="button"
            className="admin-exit-btn"
            style={{ color: '#f87171' }}
            onClick={handleLockPanel}
          >
            Lock Panel
          </button>
        </div>
      </aside>

      {/* ── Main Content View ── */}
      <main className="admin-main">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 9999999,
              background: '#042f2e',
              border: '1px solid #14b8a6',
              color: '#2dd4bf',
              padding: '12px 20px',
              borderRadius: '10px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
              fontWeight: 600,
              fontSize: '14px',
              animation: 'adminFadeIn 0.3s ease'
            }}
          >
            {toastMessage}
          </div>
        )}

        {/* TAB 1: 📋 REGISTERED TEAMS */}
        {activeTab === 'teams' && (
          <div>
            <div className="admin-top-bar">
              <h1 className="admin-page-title">
                <span>📋</span> Registered Teams
              </h1>
              <span className="admin-sync-tag">
                💾 Data saved &bull; syncs everywhere
              </span>
            </div>

            <div className="admin-controls-row">
              <span className="admin-count-label">
                All Registered Teams ({filteredTeams.length} / {teams.length})
              </span>

              <div className="admin-filters-group">
                <select
                  className="admin-select"
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value)}
                >
                  <option value="All Domains">All Domains</option>
                  <option value="Full Stack">Full Stack</option>
                  <option value="AI / ML">AI / ML</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                  <option value="Open Innovation">Open Innovation</option>
                </select>

                <select
                  className="admin-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All Status">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                </select>

                <button
                  type="button"
                  className="admin-export-btn"
                  onClick={handleExportCSV}
                >
                  <span>📊</span> Export CSV
                </button>
              </div>
            </div>

            <div className="admin-table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Team Name</th>
                    <th>Domain</th>
                    <th>Leader</th>
                    <th>Size</th>
                    <th>College</th>
                    <th>Transaction ID</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="no-teams-empty">
                        No registered teams found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTeams.map((t, idx) => {
                      const isApproved = t.status === 'Approved'
                      const isApproving = approvingId === t.registrationId

                      return (
                        <tr key={t.registrationId || idx}>
                          <td className="team-name-cell">{t.teamName}</td>
                          <td className="domain-cell">{t.domain}</td>
                          <td>
                            <div className="leader-cell">
                              <span className="leader-name">{t.leaderName}</span>
                              <span className="leader-email">{t.leaderEmail}</span>
                            </div>
                          </td>
                          <td className="size-cell">{t.teamSize || 2}</td>
                          <td className="college-cell" title={t.institute}>
                            {t.institute}
                          </td>
                          <td className="utr-cell">{t.utr || '—'}</td>
                          <td>
                            <button
                              type="button"
                              className="btn-view-image"
                              onClick={() => setSelectedImageTeam(t)}
                            >
                              <span>🖼️</span> View Image
                            </button>
                          </td>
                          <td>
                            {isApproved ? (
                              <span className="status-badge-approved">
                                ✓ Approved
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="btn-approve-action"
                                disabled={isApproving}
                                onClick={() => handleApproveTeam(t)}
                              >
                                {isApproving ? 'Approving…' : '⚡ Approve'}
                              </button>
                            )}
                          </td>
                          <td className="date-cell">
                            {t.paymentDate ||
                              (t.submittedAt
                                ? new Date(t.submittedAt).toLocaleDateString()
                                : '—')}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: 🔑 PIN SETTINGS */}
        {activeTab === 'pin' && (
          <div>
            <div className="admin-top-bar">
              <h1 className="admin-page-title">
                <span>🔑</span> PIN Settings
              </h1>
              <span className="admin-sync-tag">
                💾 Data saved &bull; syncs everywhere
              </span>
            </div>

            <div className="pin-settings-card">
              <h2 className="pin-card-title">Change Admin PIN</h2>
              <p className="pin-card-sub">
                The PIN is stored securely and is required before accessing the admin panel.
              </p>

              {pinFeedback.text && (
                <div className={`pin-feedback-msg ${pinFeedback.type}`}>
                  {pinFeedback.text}
                </div>
              )}

              {/* Default Backup PIN Row & Toggle Switch */}
              <div className="default-pin-toggle-row">
                <div className="default-pin-text-wrap">
                  <span className="default-pin-label">
                    Default PIN:
                    <span className="default-pin-highlight">jcerbhackvally</span>
                  </span>
                  <span className="default-pin-sub">
                    {defaultPinEnabled
                      ? 'Backup PIN is ON (Green). Anyone with jcerbhackvally can also access.'
                      : 'Backup PIN is OFF (Red). Disabled! Only your custom Access PIN can unlock.'}
                  </span>
                </div>

                <label className="switch-control" title="Toggle Default Backup PIN">
                  <input
                    type="checkbox"
                    checked={defaultPinEnabled}
                    onChange={handleToggleDefaultPin}
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              {/* Form to update Access PIN */}
              <form onSubmit={handleUpdatePin}>
                <div className="pin-form-group">
                  <label className="pin-form-label">New PIN</label>
                  <input
                    type="password"
                    className="pin-form-input"
                    placeholder="Enter new PIN..."
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                  />
                </div>

                <div className="pin-form-group">
                  <label className="pin-form-label">Confirm New PIN</label>
                  <input
                    type="password"
                    className="pin-form-input"
                    placeholder="Confirm new PIN..."
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn-update-pin">
                  <span>🔑</span> Update PIN
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: 🛡️ ADMIN ACCESS MANAGEMENT */}
        {activeTab === 'access' && (
          <div>
            <div className="admin-top-bar">
              <h1 className="admin-page-title">
                <span>🛡️</span> Admin Access Management
              </h1>
              <span className="admin-sync-tag">
                💾 Authorized admins only &bull; syncs everywhere
              </span>
            </div>

            {adminAccessFeedback.text && (
              <div className={`pin-feedback-msg ${adminAccessFeedback.type}`}>
                {adminAccessFeedback.text}
              </div>
            )}

            <div className="admin-access-grid">
              {/* Form Card: Grant Admin Access */}
              <div className="admin-access-card">
                <h2 className="admin-access-title">Grant Admin Access</h2>
                <p className="admin-access-sub">
                  Add authorized administrator emails and passwords. Only emails submitted here will be allowed access to the admin portal.
                </p>

                <form className="admin-access-form" onSubmit={handleAddAdmin}>
                  <div className="pin-form-group">
                    <label className="pin-form-label">Admin Email Address</label>
                    <input
                      type="email"
                      className="pin-form-input"
                      placeholder="e.g. organizer@example.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                    />
                  </div>

                  <div className="pin-form-group">
                    <label className="pin-form-label">Password</label>
                    <input
                      type="password"
                      className="pin-form-input"
                      placeholder="Assign access password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-grant-access"
                    disabled={isSubmittingAdmin}
                  >
                    <span>🛡️</span> {isSubmittingAdmin ? 'Granting Access…' : 'Submit'}
                  </button>
                </form>
              </div>

              {/* List Card: Authorized Admin Accounts */}
              <div className="admin-access-card">
                <h2 className="admin-access-title">
                  Authorized Admin Accounts ({adminUsers.length})
                </h2>
                <p className="admin-access-sub">
                  All accounts currently permitted to log in to the admin panel.
                </p>

                <div className="admin-users-list">
                  {adminUsers.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: '13.5px', textAlign: 'center', padding: '20px' }}>
                      No authorized admin accounts found.
                    </div>
                  ) : (
                    adminUsers.map((user) => (
                      <div key={user.id || user.email} className="admin-user-card">
                        <div className="admin-user-left">
                          <div className="admin-user-avatar">
                            {user.email ? user.email[0].toUpperCase() : 'A'}
                          </div>
                          <div className="admin-user-details">
                            <span className="admin-user-email">{user.email}</span>
                            <div className="admin-user-meta">
                              <span className="admin-role-badge">{user.role || 'Admin'}</span>
                              <span>&bull;</span>
                              <span>Password: ••••••••</span>
                            </div>
                          </div>
                        </div>

                        <div className="admin-actions-group">
                          <button
                            type="button"
                            className="btn-edit-admin"
                            title="Edit email or password"
                            onClick={() => handleOpenEdit(user)}
                          >
                            <span>✏️</span> Edit
                          </button>
                          <button
                            type="button"
                            className="btn-remove-admin"
                            title="Revoke admin access"
                            onClick={() => handleRemoveAdmin(user)}
                          >
                            <span>🗑️</span> Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── EDIT ADMIN MODAL ── */}
      {editingAdmin && (
        <div
          className="admin-modal-overlay"
          onClick={() => setEditingAdmin(null)}
        >
          <div
            className="admin-modal-edit-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="admin-access-title" style={{ marginBottom: '8px' }}>
              Edit Admin Access
            </h2>
            <p className="admin-access-sub" style={{ marginBottom: '18px' }}>
              Update the authorized email or reset the password for this admin.
            </p>

            <form onSubmit={handleSaveEdit}>
              <div className="pin-form-group">
                <label className="pin-form-label">Admin Email</label>
                <input
                  type="email"
                  className="pin-form-input"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>

              <div className="pin-form-group" style={{ marginTop: '12px' }}>
                <label className="pin-form-label">Password</label>
                <input
                  type="text"
                  className="pin-form-input"
                  value={editPassword}
                  placeholder="Enter new or existing password"
                  onChange={(e) => setEditPassword(e.target.value)}
                  required
                />
              </div>

              <div className="edit-modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setEditingAdmin(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-save"
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW IMAGE MODAL ── */}
      {selectedImageTeam && (
        <div
          className="admin-modal-overlay"
          onClick={() => setSelectedImageTeam(null)}
        >
          <div
            className="admin-image-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="admin-modal-close-circle"
              onClick={() => setSelectedImageTeam(null)}
              aria-label="Close image"
            >
              &times;
            </button>

            {selectedImageTeam.paymentScreenshot ? (
              <img
                src={selectedImageTeam.paymentScreenshot}
                alt={`Payment receipt for ${selectedImageTeam.teamName}`}
                className="admin-screenshot-img"
              />
            ) : (
              <div
                style={{
                  padding: '40px 20px',
                  background: '#0d1821',
                  borderRadius: '16px',
                  color: '#94a3b8',
                  textAlign: 'center',
                  border: '1px dashed rgba(255,255,255,0.2)'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
                <strong>No screenshot file uploaded</strong>
                <p style={{ margin: '6px 0 0', fontSize: '13px' }}>
                  Transaction UTR: {selectedImageTeam.utr || 'N/A'}
                </p>
              </div>
            )}

            <div className="admin-modal-caption">
              <strong>{selectedImageTeam.teamName}</strong> &bull; UTR:{' '}
              {selectedImageTeam.utr || 'N/A'} &bull; ₹1000
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
