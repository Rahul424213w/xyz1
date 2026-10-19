import React, { useState, useEffect } from 'react'
import {
  getTeamRegistrationsFromFirestore,
  updateTeamStatusInFirestore,
  deleteTeamFromFirestore,
  getAdminPinConfigFromFirestore,
  saveAdminPinConfigToFirestore,
  getBinPinConfigFromFirestore,
  saveBinPinConfigToFirestore,
  getAdminUsersFromFirestore,
  saveAdminUsersToFirestore
} from './firebase'
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

  // Active view tab: 'teams' | 'bin' | 'pin' | 'access'
  const [activeTab, setActiveTab] = useState('teams')

  // Registered teams data & filters
  const [teams, setTeams] = useState([])
  const [domainFilter, setDomainFilter] = useState('All Domains')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [approvingId, setApprovingId] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  // View image modal
  const [selectedImageTeam, setSelectedImageTeam] = useState(null)

  // Admin Panel PIN settings state (Stored in Firestore config/admin_pin)
  const [adminPinConfig, setAdminPinConfig] = useState({ accessPin: 'admin2026', defaultPinEnabled: true })
  const [defaultPinEnabled, setDefaultPinEnabled] = useState(true)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinFeedback, setPinFeedback] = useState({ text: '', type: '' })

  // Team Bin State & PIN (Stored in Firestore config/bin_pin)
  const [isBinUnlocked, setIsBinUnlocked] = useState(() => {
    return sessionStorage.getItem('hackvally_bin_unlocked') === 'true'
  })
  const [binPinInput, setBinPinInput] = useState('')
  const [binPinError, setBinPinError] = useState('')
  const [isVerifyingBinPin, setIsVerifyingBinPin] = useState(false)
  const [binPinConfig, setBinPinConfig] = useState({ accessPin: 'jcer', defaultPinEnabled: true })
  const [binDefaultPinEnabled, setBinDefaultPinEnabled] = useState(true)
  const [newBinPin, setNewBinPin] = useState('')
  const [confirmBinPin, setConfirmBinPin] = useState('')
  const [binPinFeedback, setBinPinFeedback] = useState({ text: '', type: '' })
  const [deletingTeamId, setDeletingTeamId] = useState(null)

  // Admin Access management state (Stored in Firestore config/admin_users)
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

  // ── 1. Load Data from Cloud Firestore ──
  const fetchTeams = async () => {
    try {
      const fsTeams = await getTeamRegistrationsFromFirestore()
      if (Array.isArray(fsTeams) && fsTeams.length > 0) {
        setTeams(fsTeams)
        try {
          localStorage.setItem('hackvally_registrations', JSON.stringify(fsTeams))
        } catch (e) {}
      } else {
        const local = JSON.parse(localStorage.getItem('hackvally_registrations') || '[]')
        setTeams(local)
      }
    } catch (fsErr) {
      console.warn('[AdminPage] Firestore teams fetch note:', fsErr)
      try {
        const local = JSON.parse(localStorage.getItem('hackvally_registrations') || '[]')
        setTeams(local)
      } catch (e) {
        setTeams([])
      }
    }
  }

  const fetchPinConfig = async () => {
    try {
      const cfg = await getAdminPinConfigFromFirestore()
      if (cfg) {
        setAdminPinConfig(cfg)
        setDefaultPinEnabled(cfg.defaultPinEnabled !== false)
      }
    } catch (err) {
      console.warn('[AdminPage] Pin config fetch note:', err)
    }
  }

  const fetchBinPinConfig = async () => {
    try {
      const cfg = await getBinPinConfigFromFirestore()
      if (cfg) {
        setBinPinConfig(cfg)
        setBinDefaultPinEnabled(cfg.defaultPinEnabled !== false)
      }
    } catch (err) {
      console.warn('[AdminPage] Bin pin config fetch note:', err)
    }
  }

  const fetchAdminUsers = async () => {
    try {
      const users = await getAdminUsersFromFirestore()
      if (Array.isArray(users)) {
        setAdminUsers(users)
      }
    } catch (err) {
      console.warn('[AdminPage] Admin users fetch note:', err)
    }
  }

  useEffect(() => {
    fetchPinConfig()
    fetchBinPinConfig()
    fetchAdminUsers()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchTeams()
      fetchPinConfig()
      fetchBinPinConfig()
      fetchAdminUsers()
    }
  }, [isAuthenticated])

  // ── 2. Handle PIN Unlock (Tier 1) via Cloud Firestore ──
  const handleVerifyPin = async (e) => {
    e.preventDefault()
    const trimmed = pinInput.trim()
    if (!trimmed) {
      setPinError('Please enter a PIN')
      return
    }

    setIsVerifyingPin(true)
    setPinError('')

    try {
      let cfg = adminPinConfig
      try {
        cfg = await getAdminPinConfigFromFirestore()
        setAdminPinConfig(cfg)
        setDefaultPinEnabled(cfg.defaultPinEnabled !== false)
      } catch (e) {}

      const isCustomMatch = trimmed === (cfg.accessPin || 'admin2026')
      const isDefaultMatch = cfg.defaultPinEnabled !== false && trimmed === 'jcerbhackvally'

      if (isCustomMatch || isDefaultMatch) {
        setIsPinVerified(true)
        sessionStorage.setItem('hackvally_admin_pin_verified', 'true')
        setPinError('')
      } else if (cfg.defaultPinEnabled === false && trimmed === 'jcerbhackvally') {
        setPinError('Default backup PIN (jcerbhackvally) is disabled. Please enter your main Access PIN.')
      } else {
        setPinError('Incorrect PIN entered. Please try again.')
      }
    } catch (err) {
      setPinError('Error verifying PIN. Please try again.')
    } finally {
      setIsVerifyingPin(false)
    }
  }

  // ── 3. Handle Admin Email & Password Login (Tier 2) via Cloud Firestore ──
  const handleAdminLogin = async (e) => {
    e.preventDefault()
    const inputEmail = loginEmail.trim().toLowerCase()
    const inputPass = loginPassword.trim()

    if (!inputEmail) {
      setLoginError('Please enter your authorized admin email')
      return
    }
    if (!inputPass) {
      setLoginError('Please enter your admin password')
      return
    }

    setIsLoggingIn(true)
    setLoginError('')

    try {
      let users = adminUsers
      try {
        users = await getAdminUsersFromFirestore()
        setAdminUsers(users)
      } catch (e) {}

      const matchedUser = users.find(
        (u) =>
          u.email &&
          u.email.toLowerCase() === inputEmail &&
          String(u.password) === inputPass
      )

      if (matchedUser) {
        setIsAuthenticated(true)
        setCurrentAdminUser(matchedUser)
        sessionStorage.setItem('hackvally_admin_logged_in', 'true')
        sessionStorage.setItem('hackvally_admin_user', JSON.stringify(matchedUser))
        setLoginError('')
      } else {
        setLoginError('Invalid admin email or password. Only authorized admin emails can access.')
      }
    } catch (err) {
      setLoginError('Authentication error. Please try again.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLockPanel = () => {
    sessionStorage.removeItem('hackvally_admin_logged_in')
    sessionStorage.removeItem('hackvally_admin_pin_verified')
    sessionStorage.removeItem('hackvally_admin_user')
    sessionStorage.removeItem('hackvally_bin_unlocked')
    setIsAuthenticated(false)
    setIsPinVerified(false)
    setIsBinUnlocked(false)
    setCurrentAdminUser(null)
    setPinInput('')
    setLoginEmail('')
    setLoginPassword('')
  }

  // ── 4. Handle Team Approval ──
  const handleApproveTeam = async (team) => {
    setApprovingId(team.registrationId)
    setToastMessage(`Approving ${team.teamName} and dispatching confirmation email...`)

    try {
      // 1. Update status directly in Cloud Firestore (real-time watcher immediately sends email via Gmail SMTP!)
      await updateTeamStatusInFirestore(team.registrationId, {
        status: 'Approved',
        paymentStatus: 'Approved',
        approvedAt: new Date().toISOString()
      })

      // 2. Also ping local server API if running
      try {
        await fetch('/api/approve-team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registrationId: team.registrationId })
        }).catch(() => {})
      } catch (e) {}

      // 3. Update local state
      setTeams((prev) =>
        prev.map((t) =>
          t.registrationId === team.registrationId
            ? { ...t, status: 'Approved', paymentStatus: 'Approved', approvedAt: new Date().toISOString() }
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

      setToastMessage(`✅ ${team.teamName} approved! Confirmation email dispatched to ${team.leaderEmail}`)
      setTimeout(() => setToastMessage(''), 5000)
    } catch (err) {
      console.error('Approve error:', err)
      setToastMessage(`⚠️ Could not approve team: ${err.message}`)
      setTimeout(() => setToastMessage(''), 4000)
    } finally {
      setApprovingId(null)
    }
  }

  // ── 5. Handle Team Rejection (Moves team to Team Bin) ──
  const handleRejectTeam = async (team) => {
    const confirmReject = window.confirm(
      `Reject team "${team.teamName}"?\n\nThis will remove the team from All Registered Teams and move it into the Team Bin.`
    )
    if (!confirmReject) return

    setToastMessage(`Moving ${team.teamName} to Team Bin...`)

    try {
      // Update in Cloud Firestore
      await updateTeamStatusInFirestore(team.registrationId, {
        status: 'Rejected',
        rejectedAt: new Date().toISOString()
      })

      // Update local state
      setTeams((prev) =>
        prev.map((t) =>
          t.registrationId === team.registrationId
            ? { ...t, status: 'Rejected', rejectedAt: new Date().toISOString() }
            : t
        )
      )

      try {
        const stored = JSON.parse(localStorage.getItem('hackvally_registrations') || '[]')
        const updated = stored.map((t) =>
          t.registrationId === team.registrationId
            ? { ...t, status: 'Rejected', rejectedAt: new Date().toISOString() }
            : t
        )
        localStorage.setItem('hackvally_registrations', JSON.stringify(updated))
      } catch (e) {}

      setToastMessage(`🚫 ${team.teamName} moved to Team Bin`)
      setTimeout(() => setToastMessage(''), 4000)
    } catch (err) {
      console.error('Reject error:', err)
      setToastMessage(`⚠️ Error moving team to Team Bin: ${err.message}`)
      setTimeout(() => setToastMessage(''), 4000)
    }
  }

  // ── 6. Handle Team Bin Security & Operations ──
  const handleVerifyBinPin = async (e) => {
    e.preventDefault()
    const trimmed = binPinInput.trim()
    if (!trimmed) {
      setBinPinError('Please enter Team Bin PIN')
      return
    }

    setIsVerifyingBinPin(true)
    setBinPinError('')

    try {
      let cfg = binPinConfig
      try {
        cfg = await getBinPinConfigFromFirestore()
        setBinPinConfig(cfg)
        setBinDefaultPinEnabled(cfg.defaultPinEnabled !== false)
      } catch (e) {}

      const isCustomMatch = trimmed === (cfg.accessPin || 'jcer')
      const isDefaultMatch = cfg.defaultPinEnabled !== false && trimmed === 'jcer'

      if (isCustomMatch || isDefaultMatch) {
        setIsBinUnlocked(true)
        sessionStorage.setItem('hackvally_bin_unlocked', 'true')
        setBinPinError('')
      } else if (cfg.defaultPinEnabled === false && trimmed === 'jcer') {
        setBinPinError('Default backup PIN (jcer) is disabled. Enter your custom Bin PIN.')
      } else {
        setBinPinError('Incorrect Team Bin PIN. Default is "jcer".')
      }
    } catch (err) {
      setBinPinError('Error verifying Bin PIN.')
    } finally {
      setIsVerifyingBinPin(false)
    }
  }

  const handleLockBin = () => {
    setIsBinUnlocked(false)
    sessionStorage.removeItem('hackvally_bin_unlocked')
    setBinPinInput('')
    setBinPinError('')
  }

  const handleToggleBinDefaultPin = async () => {
    const nextState = !binDefaultPinEnabled
    setBinDefaultPinEnabled(nextState)

    try {
      await saveBinPinConfigToFirestore({ defaultPinEnabled: nextState })
      setBinPinFeedback({
        text: nextState
          ? 'Default Bin PIN (jcer) is now ENABLED as backup.'
          : 'Default Bin PIN (jcer) is now DISABLED. Only custom Bin PIN works.',
        type: 'success'
      })
    } catch (err) {
      setBinPinFeedback({ text: 'Saved locally', type: 'success' })
    }
  }

  const handleUpdateBinPin = async (e) => {
    e.preventDefault()
    if (!newBinPin.trim()) {
      setBinPinFeedback({ text: 'Please enter a new Bin PIN', type: 'error' })
      return
    }
    if (newBinPin !== confirmBinPin) {
      setBinPinFeedback({ text: 'New PIN and Confirm PIN do not match', type: 'error' })
      return
    }

    try {
      await saveBinPinConfigToFirestore({ accessPin: newBinPin.trim() })
      setBinPinConfig((prev) => ({ ...prev, accessPin: newBinPin.trim() }))
      setBinPinFeedback({ text: '✓ Team Bin PIN updated successfully in Cloud Firestore!', type: 'success' })
      setNewBinPin('')
      setConfirmBinPin('')
    } catch (err) {
      setBinPinFeedback({ text: 'Error saving Bin PIN: ' + err.message, type: 'error' })
    }
  }

  // Permanently delete team from Cloud Firestore
  const handlePermanentlyDeleteTeam = async (team) => {
    const confirmDelete = window.confirm(
      `⚠️ PERMANENTLY DELETE TEAM?\n\nTeam: "${team.teamName}" (${team.registrationId})\nLeader: ${team.leaderName}\n\nThis will completely remove the registration from Cloud Firestore database. This action CANNOT be undone.`
    )
    if (!confirmDelete) return

    setDeletingTeamId(team.registrationId)
    setToastMessage(`Permanently deleting ${team.teamName} from Firestore...`)

    try {
      await deleteTeamFromFirestore(team.registrationId)

      setTeams((prev) => prev.filter((t) => t.registrationId !== team.registrationId))

      try {
        const stored = JSON.parse(localStorage.getItem('hackvally_registrations') || '[]')
        const updated = stored.filter((t) => t.registrationId !== team.registrationId)
        localStorage.setItem('hackvally_registrations', JSON.stringify(updated))
      } catch (e) {}

      setToastMessage(`🗑️ ${team.teamName} [${team.registrationId}] permanently deleted from database`)
      setTimeout(() => setToastMessage(''), 4500)
    } catch (err) {
      console.error('Delete error:', err)
      alert(`Could not delete team from database: ${err.message}`)
      setToastMessage('')
    } finally {
      setDeletingTeamId(null)
    }
  }

  // ── 7. Admin Panel PIN Settings Handlers (Stored in Firestore) ──
  const handleToggleDefaultPin = async () => {
    const nextState = !defaultPinEnabled
    setDefaultPinEnabled(nextState)

    try {
      await saveAdminPinConfigToFirestore({ defaultPinEnabled: nextState })
      setPinFeedback({
        text: nextState
          ? 'Default PIN (jcerbhackvally) is now ENABLED as backup.'
          : 'Default PIN (jcerbhackvally) is now DISABLED. Only custom Access PIN works.',
        type: 'success'
      })
    } catch (err) {
      setPinFeedback({ text: 'Config saved locally', type: 'success' })
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
      await saveAdminPinConfigToFirestore({ accessPin: newPin.trim() })
      setAdminPinConfig((prev) => ({ ...prev, accessPin: newPin.trim() }))
      setPinFeedback({ text: '✓ Admin PIN updated successfully in Cloud Firestore!', type: 'success' })
      setNewPin('')
      setConfirmPin('')
    } catch (err) {
      setPinFeedback({ text: 'Error saving PIN: ' + err.message, type: 'error' })
    }
  }

  // ── 8. Admin Access Handlers (Stored in Firestore) ──
  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    setAdminAccessFeedback({ text: '', type: '' })

    const email = newAdminEmail.trim().toLowerCase()
    const password = newAdminPassword.trim()

    if (!email) {
      setAdminAccessFeedback({ text: 'Please enter an admin email address', type: 'error' })
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setAdminAccessFeedback({ text: 'Please enter a valid email format', type: 'error' })
      return
    }
    if (!password) {
      setAdminAccessFeedback({ text: 'Please enter a password for this admin', type: 'error' })
      return
    }

    setIsSubmittingAdmin(true)
    try {
      const exists = adminUsers.some((u) => u.email.toLowerCase() === email)
      if (exists) {
        setAdminAccessFeedback({ text: 'An admin with this email already exists', type: 'error' })
        setIsSubmittingAdmin(false)
        return
      }

      const newUser = {
        id: 'admin_' + Date.now(),
        email,
        password,
        role: 'Admin',
        createdAt: new Date().toISOString()
      }

      const updated = [...adminUsers, newUser]
      await saveAdminUsersToFirestore(updated)
      setAdminUsers(updated)

      setAdminAccessFeedback({
        text: `✓ Admin access granted for ${email}!`,
        type: 'success'
      })
      setNewAdminEmail('')
      setNewAdminPassword('')
    } catch (err) {
      setAdminAccessFeedback({ text: 'Error adding admin: ' + err.message, type: 'error' })
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
      const updated = adminUsers.filter((u) => u.id !== user.id)
      await saveAdminUsersToFirestore(updated)
      setAdminUsers(updated)
      setAdminAccessFeedback({
        text: `✓ Admin access revoked for ${user.email}`,
        type: 'success'
      })
    } catch (err) {
      alert('Error removing admin: ' + err.message)
    }
  }

  const handleStartEditAdmin = (user) => {
    setEditingAdmin(user)
    setEditEmail(user.email)
    setEditPassword(user.password)
    setAdminAccessFeedback({ text: '', type: '' })
  }

  const handleSaveEditAdmin = async (e) => {
    e.preventDefault()
    if (!editEmail.trim() || !editPassword.trim()) {
      alert('Email and password cannot be empty')
      return
    }

    setIsSavingEdit(true)
    try {
      const updated = adminUsers.map((u) =>
        u.id === editingAdmin.id
          ? { ...u, email: editEmail.trim().toLowerCase(), password: editPassword.trim(), updatedAt: new Date().toISOString() }
          : u
      )
      await saveAdminUsersToFirestore(updated)
      setAdminUsers(updated)
      setEditingAdmin(null)
      setAdminAccessFeedback({
        text: `✓ Admin account updated successfully!`,
        type: 'success'
      })
    } catch (err) {
      alert('Error updating admin: ' + err.message)
    } finally {
      setIsSavingEdit(false)
    }
  }

  // ── 9. Export to CSV (Formatted for Excel) ──
  const handleExportCsv = () => {
    const listToExport = activeTeams
    if (listToExport.length === 0) {
      alert('No teams available to export.')
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

    const rows = listToExport.map((t) => {
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

  // Active teams (NOT in Team Bin)
  const activeTeams = teams.filter((t) => t.status !== 'Rejected')
  // Rejected teams (in Team Bin)
  const rejectedTeams = teams.filter((t) => t.status === 'Rejected')

  // Filtering active teams
  const filteredTeams = activeTeams.filter((team) => {
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

  // ── 10. Render Lock Screens (Two-Tier Auth) ──

  // Tier 1: PIN Screen
  if (!isPinVerified) {
    return (
      <div className="admin-lock-screen">
        <div className="admin-lock-card">
          <div className="admin-lock-icon-wrap">
            <span style={{ fontSize: '30px' }}>🔒</span>
          </div>

          <h2 className="admin-lock-title">Admin Access Required</h2>
          <p className="admin-lock-sub">
            Please enter the designated security PIN to verify your authorization before accessing the administrator panel.
          </p>

          <form onSubmit={handleVerifyPin}>
            <div className="admin-pin-input-wrap">
              <input
                type="password"
                className="admin-pin-field"
                placeholder="Enter Security PIN..."
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value)
                  setPinError('')
                }}
                autoFocus
              />
            </div>

            <button type="submit" className="btn-unlock-admin" disabled={isVerifyingPin}>
              {isVerifyingPin ? 'Verifying PIN…' : 'Unlock Admin Panel'}
            </button>
          </form>

          {pinError && <div className="lock-error-text">⚠ {pinError}</div>}

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              className="btn-back-to-pin"
              onClick={() => {
                if (onNavigate) onNavigate('landing')
                else window.location.hash = '#home'
              }}
            >
              ← Back to Hack Vally Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Tier 2: Email & Password Login Screen
  if (!isAuthenticated) {
    return (
      <div className="admin-lock-screen">
        <div className="admin-lock-card">
          <div className="admin-lock-icon-wrap" style={{ borderColor: 'rgba(20, 184, 166, 0.4)', background: 'rgba(20, 184, 166, 0.12)' }}>
            <span style={{ fontSize: '30px' }}>🛡️</span>
          </div>

          <h2 className="admin-lock-title">Admin Login</h2>
          <p className="admin-lock-sub">
            PIN verified. Now enter your authorized administrator email and password to proceed.
          </p>

          <form onSubmit={handleAdminLogin}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px', textAlign: 'left' }}>
              <div>
                <label className="admin-login-field-lbl">Admin Email Address</label>
                <input
                  type="email"
                  className="admin-login-input"
                  placeholder="name@gmail.com"
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

  // ── 11. Render Main Admin Panel ──
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

        {/* Navigation Menu */}
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
            className={`admin-nav-item ${activeTab === 'bin' ? 'active' : ''}`}
            onClick={() => setActiveTab('bin')}
          >
            <span className="admin-nav-icon">🗑️</span>
            <span>Team Bin</span>
            {rejectedTeams.length > 0 && (
              <span className="admin-nav-badge">{rejectedTeams.length}</span>
            )}
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
            className="admin-lock-btn"
            onClick={handleLockPanel}
            title="Lock admin session"
          >
            🔒 Lock Panel
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="admin-main">
        {/* Toast Feedback Notification */}
        {toastMessage && (
          <div className="admin-toast-banner">
            <span>{toastMessage}</span>
          </div>
        )}

        {/* TAB 1: 📋 REGISTERED TEAMS */}
        {activeTab === 'teams' && (
          <div>
            <div className="admin-top-bar">
              <div>
                <h1 className="admin-page-title">
                  <span>📋</span> Registered Teams ({activeTeams.length})
                </h1>
                <p className="admin-page-subtitle">
                  Review submitted registrations, verify UPI transactions, and approve entries.
                </p>
              </div>

              <div className="admin-top-actions">
                <button
                  type="button"
                  className="btn-export-csv"
                  onClick={handleExportCsv}
                  title="Download Excel / CSV spreadsheet"
                >
                  <span>📥</span> Export CSV
                </button>
                <button
                  type="button"
                  className="btn-refresh-teams"
                  onClick={fetchTeams}
                  title="Refresh registrations from Cloud Firestore"
                >
                  <span>🔄</span> Refresh
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="admin-filter-bar">
              <div className="filter-group">
                <label className="filter-label">Domain:</label>
                <select
                  className="filter-select"
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value)}
                >
                  <option>All Domains</option>
                  <option>Full Stack</option>
                  <option>AI / ML</option>
                  <option>Cybersecurity</option>
                  <option>Cloud & DevOps</option>
                  <option>Open Innovation</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Status:</label>
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option>All Status</option>
                  <option>Approved</option>
                  <option>Pending</option>
                </select>
              </div>

              <div className="filter-stats">
                Showing {filteredTeams.length} of {activeTeams.length} registered teams
              </div>
            </div>

            {/* Teams Table */}
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '160px' }}>Team Name</th>
                    <th style={{ minWidth: '130px' }}>Domain</th>
                    <th style={{ minWidth: '180px' }}>Leader</th>
                    <th style={{ minWidth: '70px' }}>Size</th>
                    <th style={{ minWidth: '160px' }}>College</th>
                    <th style={{ minWidth: '140px' }}>Transaction ID</th>
                    <th style={{ minWidth: '130px' }}>Payment</th>
                    <th style={{ minWidth: '120px' }}>Status</th>
                    <th style={{ minWidth: '110px' }}>Date</th>
                    <th style={{ minWidth: '180px', width: '180px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="no-teams-empty">
                        No registered teams found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTeams.map((t, idx) => {
                      const isApproved = t.status === 'Approved'
                      const isApproving = approvingId === t.registrationId

                      return (
                        <tr key={t.registrationId || idx}>
                          <td className="team-name-cell">
                            <div>{t.teamName}</div>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>#{t.registrationId}</span>
                          </td>
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
                              <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 600 }}>
                                ⏳ Pending
                              </span>
                            )}
                          </td>
                          <td className="date-cell">
                            {t.paymentDate ||
                              (t.submittedAt
                                ? new Date(t.submittedAt).toLocaleDateString()
                                : '—')}
                          </td>
                          <td style={{ minWidth: '180px', width: '180px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {!isApproved ? (
                                <button
                                  type="button"
                                  className="btn-approve-action"
                                  disabled={isApproving}
                                  onClick={() => handleApproveTeam(t)}
                                >
                                  {isApproving ? 'Approving…' : '⚡ Approve'}
                                </button>
                              ) : (
                                <span style={{ fontSize: '11.5px', color: '#10b981', fontWeight: 700 }}>
                                  ✓ Verified
                                </span>
                              )}
                              <button
                                type="button"
                                className="btn-reject-action"
                                onClick={() => handleRejectTeam(t)}
                                title="Reject team and move to Team Bin"
                              >
                                🚫 Reject
                              </button>
                            </div>
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

        {/* TAB 2: 🗑️ TEAM BIN (DELETE TEAM) */}
        {activeTab === 'bin' && (
          <div>
            {!isBinUnlocked ? (
              /* Security Gate: Asks for Team Bin PIN (Default: 'jcer') */
              <div className="bin-lock-card">
                <div className="bin-lock-icon">🗑️</div>
                <h2 className="bin-lock-title">Team Bin Security Gate</h2>
                <p className="bin-lock-sub">
                  Enter the designated Team Bin PIN to view, restore, or permanently delete rejected teams.
                </p>

                <form onSubmit={handleVerifyBinPin}>
                  <div className="admin-pin-input-wrap">
                    <input
                      type="password"
                      className="admin-pin-field"
                      placeholder="Enter Team Bin PIN..."
                      value={binPinInput}
                      onChange={(e) => {
                        setBinPinInput(e.target.value)
                        setBinPinError('')
                      }}
                      autoFocus
                    />
                  </div>

                  <button type="submit" className="btn-unlock-bin" disabled={isVerifyingBinPin}>
                    {isVerifyingBinPin ? 'Verifying PIN…' : 'Unlock Team Bin'}
                  </button>
                </form>

                {binPinError && <div className="lock-error-text">⚠ {binPinError}</div>}
              </div>
            ) : (
              /* Unlocked Team Bin View */
              <div>
                <div className="team-bin-top-row">
                  <div>
                    <h1 className="admin-page-title" style={{ color: '#f87171' }}>
                      <span>🗑️</span> Team Bin (Delete Team) &bull; {rejectedTeams.length} Teams
                    </h1>
                    <p className="admin-page-subtitle">
                      Teams rejected from All Registered Teams are placed here. Deleting a team here will permanently delete it from Cloud Firestore.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn-lock-bin"
                    onClick={handleLockBin}
                  >
                    🔒 Lock Bin
                  </button>
                </div>

                {/* Team Bin PIN Settings Card */}
                <div className="pin-settings-card" style={{ borderColor: 'rgba(239, 68, 68, 0.35)', marginBottom: '32px' }}>
                  <h2 className="pin-card-title" style={{ color: '#fca5a5' }}>
                    <span>🔑</span> Team Bin PIN Settings
                  </h2>
                  <p className="pin-card-sub">
                    Configure the access PIN required to unlock this Team Bin. Default PIN is <strong style={{ color: '#fca5a5' }}>jcer</strong>.
                  </p>

                  {binPinFeedback.text && (
                    <div className={`pin-feedback-msg ${binPinFeedback.type}`}>
                      {binPinFeedback.text}
                    </div>
                  )}

                  {/* Default Backup PIN Row & Toggle Switch */}
                  <div className="default-pin-toggle-row">
                    <div className="default-pin-text-wrap">
                      <span className="default-pin-label">
                        Default Backup PIN:
                        <span className="default-pin-highlight" style={{ color: '#fca5a5' }}>jcer</span>
                      </span>
                      <span className="default-pin-sub">
                        {binDefaultPinEnabled
                          ? 'Backup PIN is ON (Green). Anyone with "jcer" can also access.'
                          : 'Backup PIN is OFF (Red). Disabled! Only your custom Bin PIN can unlock.'}
                      </span>
                    </div>

                    <label className="switch-control" title="Toggle Default Backup PIN">
                      <input
                        type="checkbox"
                        checked={binDefaultPinEnabled}
                        onChange={handleToggleBinDefaultPin}
                      />
                      <span className="switch-slider" />
                    </label>
                  </div>

                  {/* Form to update Bin Access PIN */}
                  <form onSubmit={handleUpdateBinPin}>
                    <div className="pin-form-group">
                      <label className="pin-form-label">New Bin PIN</label>
                      <input
                        type="password"
                        className="pin-form-input"
                        placeholder="Enter new Bin PIN..."
                        value={newBinPin}
                        onChange={(e) => setNewBinPin(e.target.value)}
                      />
                    </div>

                    <div className="pin-form-group">
                      <label className="pin-form-label">Confirm New Bin PIN</label>
                      <input
                        type="password"
                        className="pin-form-input"
                        placeholder="Confirm new Bin PIN..."
                        value={confirmBinPin}
                        onChange={(e) => setConfirmBinPin(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-update-pin"
                      style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' }}
                    >
                      <span>🔑</span> Update Bin PIN
                    </button>
                  </form>
                </div>

                {/* Rejected Teams Table */}
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ minWidth: '160px' }}>Team Name</th>
                        <th style={{ minWidth: '130px' }}>Domain</th>
                        <th style={{ minWidth: '180px' }}>Leader</th>
                        <th style={{ minWidth: '70px' }}>Size</th>
                        <th style={{ minWidth: '160px' }}>College</th>
                        <th style={{ minWidth: '140px' }}>Transaction ID</th>
                        <th style={{ minWidth: '130px' }}>Screenshot</th>
                        <th style={{ minWidth: '120px' }}>Status</th>
                        <th style={{ minWidth: '120px' }}>Rejected Date</th>
                        <th style={{ minWidth: '160px', width: '160px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rejectedTeams.length === 0 ? (
                        <tr>
                          <td colSpan="10" className="no-teams-empty">
                            No teams in bin. Teams rejected from All Registered Teams will appear here.
                          </td>
                        </tr>
                      ) : (
                        rejectedTeams.map((t, idx) => {
                          const isDeleting = deletingTeamId === t.registrationId

                          return (
                            <tr key={t.registrationId || idx}>
                              <td className="team-name-cell">
                                <div style={{ color: '#fca5a5' }}>{t.teamName}</div>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>#{t.registrationId}</span>
                              </td>
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
                                <span className="status-badge-rejected">
                                  🚫 Rejected
                                </span>
                              </td>
                              <td className="date-cell">
                                {t.rejectedAt
                                  ? new Date(t.rejectedAt).toLocaleDateString()
                                  : t.submittedAt
                                  ? new Date(t.submittedAt).toLocaleDateString()
                                  : '—'}
                              </td>
                              <td style={{ minWidth: '160px', width: '160px', whiteSpace: 'nowrap' }}>
                                <button
                                  type="button"
                                  className="btn-delete-team-action"
                                  disabled={isDeleting}
                                  onClick={() => handlePermanentlyDeleteTeam(t)}
                                  title="Permanently delete from Cloud Firestore"
                                >
                                  {isDeleting ? 'Deleting…' : '🗑️ Delete Team'}
                                </button>
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
          </div>
        )}

        {/* TAB 3: 🔑 PIN SETTINGS (ADMIN PANEL PIN) */}
        {activeTab === 'pin' && (
          <div>
            <div className="admin-top-bar">
              <h1 className="admin-page-title">
                <span>🔑</span> Admin Panel PIN Settings
              </h1>
              <span className="admin-sync-tag">
                💾 Stored in Cloud Firestore &bull; syncs everywhere
              </span>
            </div>

            <div className="pin-settings-card">
              <h2 className="pin-card-title">Change Main Admin PIN</h2>
              <p className="pin-card-sub">
                This PIN is stored securely in Cloud Firestore and is required to unlock the Admin Panel.
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
                      ? 'Backup PIN is ON (Green). Anyone with "jcerbhackvally" can also access.'
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
                  <label className="pin-form-label">New Admin PIN</label>
                  <input
                    type="password"
                    className="pin-form-input"
                    placeholder="Enter new PIN..."
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                  />
                </div>

                <div className="pin-form-group">
                  <label className="pin-form-label">Confirm New Admin PIN</label>
                  <input
                    type="password"
                    className="pin-form-input"
                    placeholder="Confirm new PIN..."
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn-update-pin">
                  <span>🔑</span> Update Admin PIN
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: 🛡️ ADMIN ACCESS MANAGEMENT (STORED IN FIRESTORE) */}
        {activeTab === 'access' && (
          <div>
            <div className="admin-top-bar">
              <h1 className="admin-page-title">
                <span>🛡️</span> Admin Access Management
              </h1>
              <span className="admin-sync-tag">
                💾 Stored in Cloud Firestore &bull; syncs everywhere
              </span>
            </div>

            <div className="admin-access-layout">
              {/* Left Column: Form to Grant New Admin Access */}
              <div className="admin-access-form-card">
                <h2 className="admin-card-header">Grant Admin Access</h2>
                <p className="admin-card-subtitle">
                  Create new credentials. Only emails listed here will be granted access to the admin dashboard.
                </p>

                {adminAccessFeedback.text && (
                  <div className={`admin-access-feedback ${adminAccessFeedback.type}`}>
                    {adminAccessFeedback.text}
                  </div>
                )}

                <form onSubmit={handleCreateAdmin}>
                  <div className="admin-input-group">
                    <label className="admin-input-label">Admin Email Address</label>
                    <input
                      type="email"
                      className="admin-text-field"
                      placeholder="e.g. coordinator@gmail.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                    />
                  </div>

                  <div className="admin-input-group">
                    <label className="admin-input-label">Admin Password</label>
                    <input
                      type="password"
                      className="admin-text-field"
                      placeholder="Create secure password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-grant-access"
                    disabled={isSubmittingAdmin}
                  >
                    {isSubmittingAdmin ? 'Granting Access…' : '✓ Submit & Grant Access'}
                  </button>
                </form>
              </div>

              {/* Right Column: List of Authorized Admin Users */}
              <div className="admin-users-list-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h2 className="admin-card-header" style={{ margin: 0 }}>
                    Authorized Admins ({adminUsers.length})
                  </h2>
                  <span style={{ fontSize: '11.5px', color: '#10b981', fontWeight: 600 }}>
                    ● Active Access
                  </span>
                </div>

                <div className="admin-users-list">
                  {adminUsers.map((user) => (
                    <div key={user.id} className="admin-user-row">
                      <div className="admin-user-details">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="admin-user-email">{user.email}</span>
                          <span className="admin-role-badge">{user.role || 'Admin'}</span>
                        </div>
                        <span className="admin-user-meta">
                          Password: {user.password ? '•'.repeat(Math.min(user.password.length, 10)) : '••••••••'} &bull; Added:{' '}
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>

                      <div className="admin-user-actions">
                        <button
                          type="button"
                          className="btn-edit-admin"
                          onClick={() => handleStartEditAdmin(user)}
                          title="Edit email or password"
                        >
                          ✎ Edit
                        </button>

                        <button
                          type="button"
                          className="btn-remove-admin"
                          onClick={() => handleRemoveAdmin(user)}
                          title="Revoke access"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Edit Admin Modal ── */}
        {editingAdmin && (
          <div className="admin-modal-overlay" onClick={() => setEditingAdmin(null)}>
            <div className="edit-admin-modal-card" onClick={(e) => e.stopPropagation()}>
              <h2 style={{ color: '#ffffff', margin: '0 0 8px', fontSize: '18px', fontWeight: 800 }}>
                Edit Admin Credentials
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px' }}>
                Update login credentials for {editingAdmin.email}.
              </p>

              <form onSubmit={handleSaveEditAdmin}>
                <div className="admin-input-group">
                  <label className="admin-input-label">Email Address</label>
                  <input
                    type="email"
                    className="admin-text-field"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="admin-input-group">
                  <label className="admin-input-label">Password</label>
                  <input
                    type="text"
                    className="admin-text-field"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
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

        {/* ── View Image Modal ── */}
        {selectedImageTeam && (
          <div className="admin-modal-overlay" onClick={() => setSelectedImageTeam(null)}>
            <div
              className="admin-image-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setSelectedImageTeam(null)}
                aria-label="Close"
              >
                ✕
              </button>

              <div className="admin-modal-meta-box">
                <h3 className="admin-modal-team-name">
                  {selectedImageTeam.teamName} &bull; Payment Verification
                </h3>
                <p className="admin-modal-sub">
                  UTR: <strong style={{ color: '#5eead4' }}>{selectedImageTeam.utr || 'N/A'}</strong> &bull; Amount: ₹1000 &bull;{' '}
                  {selectedImageTeam.paymentDate || ''}
                </p>
              </div>

              {selectedImageTeam.paymentScreenshot ? (
                <img
                  src={selectedImageTeam.paymentScreenshot}
                  alt={`Payment proof for ${selectedImageTeam.teamName}`}
                  className="admin-preview-img"
                />
              ) : (
                <div className="admin-no-screenshot-box">
                  <span style={{ fontSize: '40px', marginBottom: '8px' }}>📷</span>
                  <p>No screenshot attached with this submission.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
