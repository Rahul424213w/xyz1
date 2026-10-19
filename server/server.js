import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { handleApiRequest } from './apiHandler.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DIST_DIR = path.resolve(__dirname, '../dist')
const PORT = process.env.PORT || 5000

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon'
}

const server = http.createServer((req, res) => {
  const url = req.url ? req.url.split('?')[0] : '/'

  // Enable basic CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  // API Endpoints Handler
  handleApiRequest(req, res).then(handled => {
    if (handled) return

    // Static file serving from dist/
    if (req.method === 'GET') {
      let filePath = path.join(DIST_DIR, url === '/' ? 'index.html' : url)

      // Security check to prevent directory traversal
      if (!filePath.startsWith(DIST_DIR)) {
        res.statusCode = 403
        res.end('Forbidden')
        return
      }

      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          // Fallback to index.html for SPA routing (e.g. /jcerbadmin)
          filePath = path.join(DIST_DIR, 'index.html')
        }

        fs.readFile(filePath, (readErr, content) => {
          if (readErr) {
            res.statusCode = 404
            res.end('Not Found')
            return
          }

          const ext = path.extname(filePath).toLowerCase()
          const contentType = MIME_TYPES[ext] || 'application/octet-stream'
          res.setHeader('Content-Type', contentType)
          res.statusCode = 200
          res.end(content)
        })
      })
      return
    }

    res.statusCode = 404
    res.end('Not Found')
  })
})

import { db } from '../src/firebase.js'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { sendRegistrationConfirmation } from './mailer.js'

function initFirestoreEmailWatcher() {
  console.log('📡 [Firestore Watcher] Active - Monitoring Approved registrations for instant email delivery...')
  try {
    const colRef = collection(db, 'registrations')
    onSnapshot(colRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const team = change.doc.data()
          if (team && team.status === 'Approved' && !team.emailSent && team.leaderEmail) {
            console.log(`\n📬 [Firestore Watcher] Found Approved team awaiting confirmation email: "${team.teamName}" [${team.registrationId}] -> ${team.leaderEmail}`)
            
            try {
              // Set pending state to avoid duplicate sends
              await updateDoc(doc(db, 'registrations', team.registrationId), {
                emailSent: 'sending'
              })

              const result = await sendRegistrationConfirmation(team)
              console.log(`✅ [Firestore Watcher] Email delivered successfully to ${team.leaderEmail}! MessageId: ${result.messageId}\n`)

              await updateDoc(doc(db, 'registrations', team.registrationId), {
                emailSent: true,
                emailSentAt: new Date().toISOString(),
                emailMessageId: result.messageId || ''
              })
            } catch (mailErr) {
              console.error(`❌ [Firestore Watcher] Error sending email to ${team.leaderEmail}:`, mailErr.message)
              await updateDoc(doc(db, 'registrations', team.registrationId), {
                emailSent: false,
                emailError: mailErr.message
              }).catch(() => {})
            }
          }
        }
      })
    }, (err) => {
      console.warn('⚠️ [Firestore Watcher] Listener note:', err.message)
    })
  } catch (err) {
    console.warn('⚠️ [Firestore Watcher] Init note:', err.message)
  }
}

server.listen(PORT, () => {
  console.log(`\n🚀 Hack Vally Production Server running on http://localhost:${PORT}`)
  console.log(`📧 Connected to Gmail SMTP for ${process.env.GMAIL_USER || 'swayamuk1@gmail.com'}`)
  initFirestoreEmailWatcher()
})
