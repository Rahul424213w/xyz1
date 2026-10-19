import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { sendRegistrationConfirmation } from './mailer.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.resolve(__dirname, 'data')
const TEAMS_FILE = path.join(DATA_DIR, 'registrations.json')
const PIN_FILE = path.join(DATA_DIR, 'pinConfig.json')
const ADMIN_USERS_FILE = path.join(DATA_DIR, 'adminUsers.json')

// Default configuration
const DEFAULT_PIN = 'jcerbhackvally'
const INITIAL_ACCESS_PIN = 'admin2026'

// Ensure data folder and files exist
function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(TEAMS_FILE)) {
    fs.writeFileSync(TEAMS_FILE, JSON.stringify([], null, 2), 'utf-8')
  }
  if (!fs.existsSync(PIN_FILE)) {
    fs.writeFileSync(
      PIN_FILE,
      JSON.stringify(
        {
          accessPin: INITIAL_ACCESS_PIN,
          defaultPin: DEFAULT_PIN,
          defaultPinEnabled: true
        },
        null,
        2
      ),
      'utf-8'
    )
  }
  if (!fs.existsSync(ADMIN_USERS_FILE)) {
    fs.writeFileSync(
      ADMIN_USERS_FILE,
      JSON.stringify(
        [
          {
            id: 'admin_1',
            email: 'swayamuk1@gmail.com',
            password: 'admin123',
            role: 'Super Admin',
            createdAt: new Date().toISOString()
          }
        ],
        null,
        2
      ),
      'utf-8'
    )
  }
}

export function getAdminUsers() {
  ensureDataFiles()
  try {
    const raw = fs.readFileSync(ADMIN_USERS_FILE, 'utf-8')
    return JSON.parse(raw || '[]')
  } catch (err) {
    console.error('[API] Error reading adminUsers:', err)
    return []
  }
}

export function saveAdminUsers(users) {
  ensureDataFiles()
  fs.writeFileSync(ADMIN_USERS_FILE, JSON.stringify(users, null, 2), 'utf-8')
}

export function getTeams() {
  ensureDataFiles()
  try {
    const raw = fs.readFileSync(TEAMS_FILE, 'utf-8')
    return JSON.parse(raw || '[]')
  } catch (err) {
    console.error('[API] Error reading teams:', err)
    return []
  }
}

export function saveTeams(teams) {
  ensureDataFiles()
  fs.writeFileSync(TEAMS_FILE, JSON.stringify(teams, null, 2), 'utf-8')
}

export function getPinConfig() {
  ensureDataFiles()
  try {
    const raw = fs.readFileSync(PIN_FILE, 'utf-8')
    return JSON.parse(raw || '{}')
  } catch (err) {
    console.error('[API] Error reading pinConfig:', err)
    return { accessPin: INITIAL_ACCESS_PIN, defaultPin: DEFAULT_PIN, defaultPinEnabled: true }
  }
}

export function savePinConfig(config) {
  ensureDataFiles()
  fs.writeFileSync(PIN_FILE, JSON.stringify(config, null, 2), 'utf-8')
}

/**
 * Handle incoming API requests in both Vite and production server
 */
export async function handleApiRequest(req, res) {
  const url = req.url ? req.url.split('?')[0] : ''
  const method = req.method

  // Set JSON headers and CORS
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return true
  }

  // 1. GET /api/teams - List all registered teams
  if (url === '/api/teams' && method === 'GET') {
    const teams = getTeams()
    res.statusCode = 200
    res.end(JSON.stringify({ success: true, teams }))
    return true
  }

  // 2. POST /api/register-team - Register a team (stores record, DOES NOT send email yet)
  if (url === '/api/register-team' && method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}')
        const teams = getTeams()
        
        // Ensure status is Pending upon registration
        payload.status = payload.status || 'Pending'
        payload.paymentStatus = 'Pending Verification'
        payload.submittedAt = payload.submittedAt || new Date().toISOString()
        
        // Check if registrationId already exists
        const existingIdx = teams.findIndex(t => t.registrationId === payload.registrationId)
        if (existingIdx >= 0) {
          teams[existingIdx] = { ...teams[existingIdx], ...payload }
        } else {
          teams.unshift(payload)
        }
        
        saveTeams(teams)
        console.log(`[API] Saved team registration: ${payload.teamName} [${payload.registrationId}]`)
        res.statusCode = 200
        res.end(JSON.stringify({ success: true, registrationId: payload.registrationId }))
      } catch (err) {
        res.statusCode = 400
        res.end(JSON.stringify({ success: false, error: err.message }))
      }
    })
    return true
  }

  // 3. POST /api/approve-team - Admin approves team & triggers official confirmation email!
  if (url === '/api/approve-team' && method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', async () => {
      try {
        const { registrationId } = JSON.parse(body || '{}')
        if (!registrationId) {
          res.statusCode = 400
          res.end(JSON.stringify({ success: false, error: 'Registration ID required' }))
          return
        }

        const teams = getTeams()
        const teamIdx = teams.findIndex(t => t.registrationId === registrationId)
        if (teamIdx === -1) {
          res.statusCode = 404
          res.end(JSON.stringify({ success: false, error: 'Team not found' }))
          return
        }

        const targetTeam = teams[teamIdx]
        targetTeam.status = 'Approved'
        targetTeam.paymentStatus = 'Approved'
        targetTeam.approvedAt = new Date().toISOString()

        console.log(`[API] Admin approving team: ${targetTeam.teamName}. Sending confirmation email to ${targetTeam.leaderEmail}...`)
        
        // Send email via Gmail SMTP
        let emailResult = { success: true }
        try {
          emailResult = await sendRegistrationConfirmation(targetTeam)
          targetTeam.emailSent = true
          targetTeam.emailMessageId = emailResult.messageId
        } catch (emailErr) {
          console.error('[API] Error delivering confirmation email:', emailErr.message)
          targetTeam.emailSent = false
          targetTeam.emailError = emailErr.message
        }

        saveTeams(teams)
        res.statusCode = 200
        res.end(JSON.stringify({
          success: true,
          message: 'Team approved successfully and confirmation email sent!',
          team: targetTeam,
          emailSent: targetTeam.emailSent
        }))
      } catch (err) {
        console.error('[API] Approve error:', err)
        res.statusCode = 500
        res.end(JSON.stringify({ success: false, error: err.message }))
      }
    })
    return true
  }

  // 4. GET /api/admin-pin-config - Get PIN settings
  if (url === '/api/admin-pin-config' && method === 'GET') {
    const config = getPinConfig()
    res.statusCode = 200
    res.end(JSON.stringify({
      success: true,
      defaultPinEnabled: config.defaultPinEnabled !== false,
      defaultPin: DEFAULT_PIN
    }))
    return true
  }

  // 5. POST /api/admin-pin-config - Update PIN settings
  if (url === '/api/admin-pin-config' && method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const { newPin, defaultPinEnabled } = JSON.parse(body || '{}')
        const config = getPinConfig()

        if (typeof defaultPinEnabled === 'boolean') {
          config.defaultPinEnabled = defaultPinEnabled
        }
        if (newPin && newPin.trim()) {
          config.accessPin = newPin.trim()
        }

        savePinConfig(config)
        console.log(`[API] Admin PIN config updated. DefaultPinEnabled: ${config.defaultPinEnabled}`)
        res.statusCode = 200
        res.end(JSON.stringify({
          success: true,
          message: 'PIN Settings updated successfully',
          defaultPinEnabled: config.defaultPinEnabled
        }))
      } catch (err) {
        res.statusCode = 400
        res.end(JSON.stringify({ success: false, error: err.message }))
      }
    })
    return true
  }

  // 6. POST /api/verify-pin - Check if PIN entered matches accessPin or defaultPin (if enabled)
  if (url === '/api/verify-pin' && method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const { pin } = JSON.parse(body || '{}')
        const config = getPinConfig()
        const trimmed = (pin || '').trim()

        const isAccessPinMatch = trimmed === (config.accessPin || INITIAL_ACCESS_PIN)
        const isDefaultPinMatch = config.defaultPinEnabled !== false && trimmed === DEFAULT_PIN

        if (isAccessPinMatch || isDefaultPinMatch) {
          res.statusCode = 200
          res.end(JSON.stringify({ success: true, authorized: true }))
        } else {
          res.statusCode = 401
          res.end(JSON.stringify({ success: false, authorized: false, error: 'Incorrect PIN entered' }))
        }
      } catch (err) {
        res.statusCode = 400
        res.end(JSON.stringify({ success: false, error: err.message }))
      }
    })
    return true
  }

  // 7. POST /api/admin-login - Verify Email and Password for authorized admin
  if (url === '/api/admin-login' && method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body || '{}')
        const users = getAdminUsers()
        const found = users.find(
          u => u.email.trim().toLowerCase() === (email || '').trim().toLowerCase() && u.password === (password || '').trim()
        )
        if (found) {
          res.statusCode = 200
          res.end(JSON.stringify({
            success: true,
            user: { id: found.id, email: found.email, role: found.role || 'Admin' }
          }))
        } else {
          res.statusCode = 401
          res.end(JSON.stringify({
            success: false,
            error: 'Invalid admin email or password'
          }))
        }
      } catch (err) {
        res.statusCode = 400
        res.end(JSON.stringify({ success: false, error: err.message }))
      }
    })
    return true
  }

  // 8. GET /api/admin-users - List all authorized admin users
  if (url === '/api/admin-users' && method === 'GET') {
    const users = getAdminUsers()
    res.statusCode = 200
    res.end(JSON.stringify({ success: true, users }))
    return true
  }

  // 9. POST /api/admin-users - Add a new admin user
  if (url === '/api/admin-users' && method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body || '{}')
        if (!email || !password) {
          res.statusCode = 400
          res.end(JSON.stringify({ success: false, error: 'Email and password are required' }))
          return
        }
        const users = getAdminUsers()
        const existing = users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase())
        if (existing) {
          res.statusCode = 400
          res.end(JSON.stringify({ success: false, error: 'An admin with this email already exists' }))
          return
        }

        const newUser = {
          id: 'admin_' + Date.now(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          role: 'Admin',
          createdAt: new Date().toISOString()
        }
        users.push(newUser)
        saveAdminUsers(users)
        console.log(`[API] Added new admin access for: ${newUser.email}`)
        res.statusCode = 200
        res.end(JSON.stringify({ success: true, message: 'Admin access granted successfully', user: newUser }))
      } catch (err) {
        res.statusCode = 400
        res.end(JSON.stringify({ success: false, error: err.message }))
      }
    })
    return true
  }

  // 10. PUT /api/admin-users (or POST /api/admin-users/edit) - Edit an admin user (email or password)
  if ((url === '/api/admin-users' && method === 'PUT') || (url === '/api/admin-users/edit' && method === 'POST')) {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const { id, email, password } = JSON.parse(body || '{}')
        if (!id) {
          res.statusCode = 400
          res.end(JSON.stringify({ success: false, error: 'Admin ID required' }))
          return
        }
        const users = getAdminUsers()
        const userIdx = users.findIndex(u => u.id === id)
        if (userIdx === -1) {
          res.statusCode = 404
          res.end(JSON.stringify({ success: false, error: 'Admin not found' }))
          return
        }

        if (email && email.trim()) {
          users[userIdx].email = email.trim().toLowerCase()
        }
        if (password && password.trim()) {
          users[userIdx].password = password.trim()
        }
        users[userIdx].updatedAt = new Date().toISOString()
        saveAdminUsers(users)
        console.log(`[API] Updated admin user: ${users[userIdx].email}`)
        res.statusCode = 200
        res.end(JSON.stringify({ success: true, message: 'Admin access updated successfully', user: users[userIdx] }))
      } catch (err) {
        res.statusCode = 400
        res.end(JSON.stringify({ success: false, error: err.message }))
      }
    })
    return true
  }

  // 11. DELETE /api/admin-users (or POST /api/admin-users/delete) - Revoke/Remove an admin user
  if ((url === '/api/admin-users' && method === 'DELETE') || (url === '/api/admin-users/delete' && method === 'POST')) {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const { id } = JSON.parse(body || '{}')
        if (!id) {
          res.statusCode = 400
          res.end(JSON.stringify({ success: false, error: 'Admin ID required' }))
          return
        }
        const users = getAdminUsers()
        if (users.length <= 1) {
          res.statusCode = 400
          res.end(JSON.stringify({ success: false, error: 'Cannot remove the last remaining admin account' }))
          return
        }
        const filtered = users.filter(u => u.id !== id)
        saveAdminUsers(filtered)
        console.log(`[API] Revoked admin access for id: ${id}`)
        res.statusCode = 200
        res.end(JSON.stringify({ success: true, message: 'Admin access revoked successfully' }))
      } catch (err) {
        res.statusCode = 400
        res.end(JSON.stringify({ success: false, error: err.message }))
      }
    })
    return true
  }

  return false
}
