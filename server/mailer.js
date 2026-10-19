import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Creates and verifies the Gmail Nodemailer transporter
 */
function getTransporter() {
  const user = process.env.GMAIL_USER || 'swayamuk1@gmail.com'
  const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '')

  if (!user || !pass) {
    console.warn('[Mailer] Missing GMAIL_USER or GMAIL_APP_PASSWORD in environment!')
  }

  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass
    }
  })
}

/**
 * Generates modern, clean HTML email template for Hack Vally registration confirmation
 */
function buildEmailHtml(data) {
  const teamName = data.teamName || 'Your Team'
  const regId = data.registrationId || 'HV26-258'
  const domain = data.domain || 'Not Specified'
  const leaderName = data.leaderName || 'Team Leader'
  const leaderEmail = data.leaderEmail || ''
  const leaderPhone = data.leaderPhone || ''
  const leaderGender = data.leaderGender || 'Not Specified'
  const institute = data.institute || 'Not Specified'
  const teamSize = data.teamSize || 2
  const boys = data.boys ?? 0
  const girls = data.girls ?? 0
  const utr = data.utr || 'N/A'
  const paymentDate = data.paymentDate || new Date().toISOString().split('T')[0]
  const paymentTime = data.paymentTime || ''
  const members = Array.isArray(data.members) ? data.members : []

  // Build members list rows
  let membersHtml = ''
  if (members.length > 0) {
    membersHtml = members.map((m, idx) => `
      <tr style="border-bottom: 1px solid #1e293b;">
        <td style="padding: 10px 12px; color: #94a3b8; font-size: 13px;">Member ${idx + 2}</td>
        <td style="padding: 10px 12px; color: #ffffff; font-size: 13px; font-weight: 600;">
          ${m.name || 'N/A'} <br/>
          <span style="color: #64748b; font-size: 11.5px; font-weight: 400;">
            ${m.email ? m.email + ' &bull; ' : ''}${m.phone || ''} (${m.gender || 'N/A'})
          </span>
        </td>
      </tr>
    `).join('')
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hack Vally 2026 - Registration Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #030712; padding: 30px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #0c1222; border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.85);" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #064e3b 0%, #0f172a 50%, #064e3b 100%); padding: 32px 24px; text-align: center; border-bottom: 2px solid #10b981;">
              <div style="display: inline-block; background-color: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #34d399; padding: 5px 16px; border-radius: 30px; font-size: 11.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
                ✓ Registration &amp; Payment Approved
              </div>
              <h1 style="margin: 0 0 6px; font-size: 30px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
                HACK VALLY 2026
              </h1>
              <p style="margin: 0; font-size: 13.5px; color: #94a3b8; font-weight: 500;">
                Dept. of Computer Science &amp; Engineering &bull; JCER Belagavi
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 28px 24px;">
              <p style="font-size: 16px; color: #ffffff; margin: 0 0 16px; font-weight: 600;">
                Dear ${leaderName},
              </p>
              <p style="font-size: 14.5px; color: #cbd5e1; line-height: 1.6; margin: 0 0 24px;">
                Congratulations! We are delighted to inform you that team <strong style="color: #fbbf24;">${teamName}</strong> has been <strong style="color: #34d399;">OFFICIALLY APPROVED</strong> for <strong style="color: #ffffff;">Hack Vally 2026</strong>. Your payment verification has been completed by our organizing team.
              </p>

              <!-- Registration ID Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.5); border-radius: 14px; margin-bottom: 26px;">
                <tr>
                  <td style="padding: 16px 20px; text-align: center;">
                    <div style="font-size: 11.5px; color: #34d399; text-transform: uppercase; font-weight: 700; letter-spacing: 1.5px;">
                      Official Registration Pass ID
                    </div>
                    <div style="font-size: 28px; font-weight: 800; color: #10b981; font-family: 'Courier New', Courier, monospace; letter-spacing: 2px; margin-top: 4px;">
                      ${regId}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Registration Summary Table -->
              <div style="font-size: 13px; font-weight: 700; color: #fbbf24; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
                Team &amp; Event Summary
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
                <tr style="border-bottom: 1px solid #1e293b;">
                  <td style="padding: 10px 12px; color: #94a3b8; font-size: 13px; width: 35%;">Team Name</td>
                  <td style="padding: 10px 12px; color: #ffffff; font-size: 13.5px; font-weight: 700;">${teamName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #1e293b;">
                  <td style="padding: 10px 12px; color: #94a3b8; font-size: 13px;">Selected Domain</td>
                  <td style="padding: 10px 12px; color: #38bdf8; font-size: 13.5px; font-weight: 700;">${domain}</td>
                </tr>
                <tr style="border-bottom: 1px solid #1e293b;">
                  <td style="padding: 10px 12px; color: #94a3b8; font-size: 13px;">Institute</td>
                  <td style="padding: 10px 12px; color: #ffffff; font-size: 13px; font-weight: 600;">${institute}</td>
                </tr>
                <tr style="border-bottom: 1px solid #1e293b;">
                  <td style="padding: 10px 12px; color: #94a3b8; font-size: 13px;">Team Leader</td>
                  <td style="padding: 10px 12px; color: #ffffff; font-size: 13px; font-weight: 600;">
                    ${leaderName} (${leaderGender})<br/>
                    <span style="color: #64748b; font-size: 12px;">${leaderEmail} &bull; ${leaderPhone}</span>
                  </td>
                </tr>
                ${membersHtml}
                <tr style="border-bottom: 1px solid #1e293b;">
                  <td style="padding: 10px 12px; color: #94a3b8; font-size: 13px;">Total Team Size</td>
                  <td style="padding: 10px 12px; color: #ffffff; font-size: 13px;">${teamSize} Members (${boys} Boys, ${girls} Girls)</td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; color: #94a3b8; font-size: 13px;">Payment Status</td>
                  <td style="padding: 10px 12px; color: #34d399; font-size: 13px; font-weight: 700;">
                    ✓ Approved &amp; Verified<br/>
                    <span style="color: #94a3b8; font-size: 11.5px; font-weight: 400;">UTR: ${utr} &bull; ₹1000 &bull; ${paymentDate} ${paymentTime}</span>
                  </td>
                </tr>
              </table>

              <!-- Confirmed Notice Note -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981; border-radius: 8px; margin-bottom: 26px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <p style="margin: 0; font-size: 13.5px; color: #d1fae5; line-height: 1.5;">
                      <strong style="color: #34d399;">Official Slot Confirmed:</strong> Your team's registration is completely approved. Please ensure all team members join the official WhatsApp group below to receive problem statements, rules, and timetable updates.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- WhatsApp Community CTA Section -->
              <div style="background-color: rgba(37, 211, 102, 0.08); border: 1px solid rgba(37, 211, 102, 0.3); border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 26px;">
                <h3 style="margin: 0 0 8px; font-size: 16px; color: #4ade80; font-weight: 700;">
                  Join Official WhatsApp Group
                </h3>
                <p style="margin: 0 0 16px; font-size: 13px; color: #94a3b8; line-height: 1.45;">
                  All important hackathon announcements, schedule updates, mentor guidance, and venue details are shared here.
                </p>
                <a href="https://chat.whatsapp.com/E9TgFoq4d6tAMQOp6FBnax" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #25d366; color: #041f11; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 50px; text-decoration: none; box-shadow: 0 4px 16px rgba(37, 211, 102, 0.4);">
                  Join WhatsApp Group &rarr;
                </a>
                <div style="margin-top: 10px;">
                  <a href="https://chat.whatsapp.com/E9TgFoq4d6tAMQOp6FBnax" target="_blank" rel="noopener noreferrer" style="color: #4ade80; font-size: 11.5px; text-decoration: underline; word-break: break-all;">
                    https://chat.whatsapp.com/E9TgFoq4d6tAMQOp6FBnax
                  </a>
                </div>
              </div>

              <!-- Venue Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 14px 16px; margin-bottom: 20px;">
                <tr>
                  <td>
                    <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">
                      Venue &amp; Location
                    </div>
                    <div style="font-size: 13px; color: #ffffff; line-height: 1.45;">
                      Jain College of Engineering &amp; Research (JCER)<br/>
                      Udyambag, Belagavi, Karnataka - 590008
                    </div>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;">
                If you have any questions or need to make adjustments to your team details, feel free to reply directly to this email at <a href="mailto:swayamuk1@gmail.com" style="color: #fbbf24; text-decoration: none;">swayamuk1@gmail.com</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #070a14; padding: 20px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.08);">
              <p style="margin: 0 0 6px; font-size: 12px; color: #94a3b8;">
                &copy; 2026 Hack Vally &bull; Dept. of Computer Science &amp; Engineering &bull; JCER Belagavi
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                This is an automated confirmation sent to ${leaderEmail}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

/**
 * Sends confirmation email to the team leader
 * @param {Object} data Registration payload
 */
export async function sendRegistrationConfirmation(data) {
  if (!data || !data.leaderEmail) {
    throw new Error('Missing leader email address')
  }

  const transporter = getTransporter()
  const user = process.env.GMAIL_USER || 'swayamuk1@gmail.com'

  const mailOptions = {
    from: `"Hack Vally 2026" <${user}>`,
    to: data.leaderEmail,
    subject: `🎉 Registration Approved: Hack Vally 2026 | Team ${data.teamName || 'HackVally'} [${data.registrationId || ''}]`,
    html: buildEmailHtml(data),
    text: `HACK VALLY 2026 - Registration Approved
    
Dear ${data.leaderName || 'Team Leader'},

Your registration for Hack Vally 2026 has been successfully received!

Registration ID: ${data.registrationId}
Team Name: ${data.teamName}
Domain: ${data.domain}
Institute: ${data.institute}
Team Size: ${data.teamSize} members
Payment UTR: ${data.utr}
Payment Status: Pending Verification

Note: An email will be sent to the team leader regarding payment confirmation. Please check your email inbox and spam folder within 24 hours.

Join the Official WhatsApp Group:
https://chat.whatsapp.com/E9TgFoq4d6tAMQOp6FBnax

Venue: Jain College of Engineering & Research (JCER), Udyambag, Belagavi, Karnataka - 590008

For questions, contact: swayamuk1@gmail.com
`
  }

  console.log(`[Mailer] Sending confirmation email to team leader: ${data.leaderEmail}...`)
  const info = await transporter.sendMail(mailOptions)
  console.log(`[Mailer] ✅ Email successfully sent to ${data.leaderEmail}. MessageId: ${info.messageId}`)
  return {
    success: true,
    messageId: info.messageId,
    recipient: data.leaderEmail
  }
}
