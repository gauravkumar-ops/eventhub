import nodemailer from 'nodemailer';

// Helper to clean phone numbers
function formatPhoneNumber(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  return digits.startsWith('+') ? digits : `+${digits}`;
}

// Send Twilio SMS via direct REST API
async function sendTwilioSMS({ to, body }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('[Twilio] Missing Twilio credentials in environment.');
    return { success: false, reason: 'Twilio credentials not configured' };
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const params = new URLSearchParams();
  params.append('To', to);
  params.append('From', fromNumber);
  params.append('Body', body);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  const resJson = await response.json();
  if (!response.ok) {
    throw new Error(resJson.message || `Twilio HTTP error ${response.status}`);
  }
  return { success: true, sid: resJson.sid };
}

// Send Fast2SMS (India fallback)
async function sendFast2SMS({ phone, message }) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) return { success: false, reason: 'Fast2SMS API key not set' };

  const digits = String(phone).replace(/\D/g, '').slice(-10);
  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      'authorization': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      route: 'q',
      message: message,
      flash: 0,
      numbers: digits
    })
  });

  const data = await response.json();
  return { success: response.ok, data };
}

// Send Formatted Email via Nodemailer (Gmail SMTP or custom SMTP)
async function sendMail({ to, subject, html }) {
  const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);

  if (!emailUser || !emailPass) {
    console.warn('[Nodemailer] EMAIL_USER and EMAIL_PASS not set.');
    return { success: false, reason: 'Email credentials not configured in environment' };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: emailUser,
      pass: emailPass.replace(/\s+/g, '') // remove spaces from Gmail app passwords
    }
  });

  const info = await transporter.sendMail({
    from: `"EventHub" <${emailUser}>`,
    to,
    subject,
    html
  });

  return { success: true, messageId: info.messageId };
}

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    const toEmail = body.to_email || body.email;
    const phone = body.phone;
    const eventName = body.event_name || body.eventName || 'Campus Event';
    const eventDate = body.event_date || body.eventDate || 'Date TBA';
    const eventTime = body.event_time || body.eventTime || 'Time TBA';
    const eventVenue = body.event_venue || body.venue || 'Campus Auditorium';
    const category = body.category || 'Event';
    const eventUrl = body.event_url || body.eventUrl || 'https://eventhub-g-xrave.vercel.app/';
    const organizerName = body.organizer_name || (toEmail ? toEmail.split('@')[0] : 'Organizer');
    const type = body.type || 'creation'; // 'creation' | 'reminder' | 'registration'

    let emailResult = { success: false };
    let smsResult = { success: false };

    // 1. Dispatch Email if recipient email provided
    if (toEmail) {
      let subject = `🎉 Your Event is Live: ${eventName} — EventHub`;
      let titleHeader = 'EVENT PUBLISHED SUCCESSFULLY';
      let messageContent = `Congratulations! Your event <strong style="color:#a855f7;">${eventName}</strong> is now live on EventHub and open for student registrations.`;
      let actionLabel = 'Open Event Page & Share QR';

      if (type === 'reminder') {
        subject = `⏰ Reminder: Upcoming Event "${eventName}" — EventHub`;
        titleHeader = 'EVENT REMINDER ALERT';
        messageContent = `This is a reminder that <strong style="color:#a855f7;">${eventName}</strong> is scheduled to start soon. Please ensure your digital QR ticket is ready for scanning at the gate.`;
        actionLabel = 'View Your Event Pass & Venue Details';
      } else if (type === 'registration') {
        subject = `🎟️ Registration Confirmed: ${eventName} — EventHub`;
        titleHeader = 'REGISTRATION CONFIRMED';
        messageContent = `You are successfully registered for <strong style="color:#a855f7;">${eventName}</strong>! Show your ticket QR code at the entrance for instant check-in.`;
        actionLabel = 'View Your Ticket Pass';
      }

      const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="margin:0; padding:0; background-color:#0f172a; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#f8fafc;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f172a; padding:32px 16px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px; background:#1e293b; border-radius:16px; border:1px solid #334155; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.5);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding:28px 24px; text-align:center;">
                    <div style="font-size:28px; margin-bottom:8px;">🎟️</div>
                    <h1 style="color:#ffffff; margin:0; font-size:22px; font-weight:800; letter-spacing:-0.02em;">EventHub</h1>
                    <p style="color:#e9d5ff; margin:6px 0 0; font-size:13px; font-weight:600; text-transform:uppercase;">${titleHeader}</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:28px 24px;">
                    <h2 style="margin:0 0 12px; color:#ffffff; font-size:18px;">Hi ${organizerName},</h2>
                    <p style="margin:0 0 20px; color:#cbd5e1; font-size:14px; line-height:1.6;">
                      ${messageContent}
                    </p>

                    <!-- Event Metadata Box -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#0f172a; border:1px solid #334155; border-radius:12px; margin-bottom:24px;">
                      <tr>
                        <td style="padding:16px;">
                          <p style="margin:0 0 8px; font-size:13px; color:#94a3b8;">📅 <strong>Date & Time:</strong> <span style="color:#f8fafc;">${eventDate} • ${eventTime}</span></p>
                          <p style="margin:0 0 8px; font-size:13px; color:#94a3b8;">📍 <strong>Venue:</strong> <span style="color:#f8fafc;">${eventVenue}</span></p>
                          <p style="margin:0; font-size:13px; color:#94a3b8;">🏷️ <strong>Category:</strong> <span style="color:#f8fafc;">${category}</span></p>
                        </td>
                      </tr>
                    </table>

                    <!-- Action Button -->
                    <div style="text-align:center; margin-bottom:24px;">
                      <a href="${eventUrl}" style="background:#7c3aed; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:700; font-size:14px; display:inline-block; box-shadow:0 4px 12px rgba(124,58,237,0.4);">
                        ${actionLabel}
                      </a>
                    </div>

                    <p style="margin:0; color:#64748b; font-size:12px; line-height:1.5; border-top:1px solid #334155; padding-top:16px;">
                      💡 <em>EventHub automated dispatch. Show your QR ticket code upon arrival for speedy campus gate check-in.</em>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;

      try {
        emailResult = await sendMail({ to: toEmail, subject, html: htmlBody });
      } catch (err) {
        console.error('[API Send Email Error]', err);
        emailResult = { success: false, error: err.message };
      }
    }

    // 2. Dispatch SMS if phone number provided
    if (phone) {
      const formattedTo = formatPhoneNumber(phone);
      const smsText = type === 'reminder'
        ? `⏰ [EventHub Reminder] "${eventName}" is coming up! Date: ${eventDate} at ${eventVenue}. Pass: ${eventUrl}`
        : `🎉 [EventHub] Your event "${eventName}" is live! Date: ${eventDate} at ${eventVenue}. View: ${eventUrl}`;

      try {
        smsResult = await sendTwilioSMS({ to: formattedTo, body: smsText });
      } catch (twErr) {
        console.warn('[Twilio Error, attempting Fast2SMS fallback]:', twErr.message);
        try {
          smsResult = await sendFast2SMS({ phone, message: smsText });
        } catch (fErr) {
          smsResult = { success: false, error: fErr.message };
        }
      }
    }

    return res.status(200).json({
      success: true,
      email_dispatched: emailResult.success,
      email_details: emailResult,
      sms_dispatched: smsResult.success,
      sms_details: smsResult,
      recipient_email: toEmail,
      recipient_phone: phone
    });
  } catch (err) {
    console.error('[Notification Handler Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
