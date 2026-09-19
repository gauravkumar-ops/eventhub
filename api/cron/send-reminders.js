import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rishavddjjltzcifuxqo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_Y54FQMl0uAcmh7W0DtP6gg__eK8Bbx1';

function formatPhoneNumber(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  return digits.startsWith('+') ? digits : `+${digits}`;
}

async function sendTwilioSMS({ to, body }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) return { success: false, reason: 'Missing Twilio credentials' };

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const params = new URLSearchParams();
  params.append('To', to);
  params.append('From', fromNumber);
  params.append('Body', body);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });
  return { success: res.ok };
}

async function sendEmail({ to, subject, html }) {
  const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);

  if (!emailUser || !emailPass) return { success: false, reason: 'Email credentials not configured' };

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: emailUser,
      pass: emailPass.replace(/\s+/g, '')
    }
  });

  const info = await transporter.sendMail({
    from: `"EventHub Reminders" <${emailUser}>`,
    to,
    subject,
    html
  });
  return { success: true, messageId: info.messageId };
}

export default async function handler(req, res) {
  // Allow manual execution or Vercel Cron
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date();
    
    // Target window: events happening within the next 48 hours
    const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const todayStr = now.toISOString().split('T')[0];
    const maxDateStr = next48h.toISOString().split('T')[0];

    // 1. Fetch upcoming events
    const { data: upcomingEvents, error: evErr } = await supabase
      .from('events')
      .select('*')
      .gte('date', todayStr)
      .lte('date', maxDateStr);

    if (evErr) {
      console.warn('[Cron Reminders] Supabase events query error (might be using local store):', evErr.message);
    }

    const eventsList = upcomingEvents || [];
    let sentCount = 0;

    for (const ev of eventsList) {
      // Fetch registrations / attendees for this event
      const { data: regs } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', ev.id);

      const attendees = regs || [];
      for (const att of attendees) {
        const attendeeEmail = att.attendee_email || att.email;
        const attendeePhone = att.attendee_phone || att.phone || att.whatsapp;
        const eventUrl = `https://eventhub-g-xrave.vercel.app/ticket.html?ticketId=${att.id || att.ticket_id}&eventId=${ev.id}`;

        if (attendeeEmail) {
          const subject = `⏰ Reminder: "${ev.name || ev.title}" is coming up!`;
          const html = `
            <div style="font-family:sans-serif; background:#0f172a; color:#f8fafc; padding:24px; border-radius:12px;">
              <h2 style="color:#a855f7; margin-top:0;">⚡ EventHub Reminder</h2>
              <p>Hi ${att.attendee_name || 'Attendee'},</p>
              <p>This is a friendly reminder that <strong>${ev.name || ev.title}</strong> is happening soon!</p>
              <div style="background:#1e293b; padding:16px; border-radius:8px; margin:16px 0;">
                <p style="margin:4px 0;">📅 <strong>Date:</strong> ${ev.date}</p>
                <p style="margin:4px 0;">⏰ <strong>Time:</strong> ${ev.start_time || ev.time || 'TBA'}</p>
                <p style="margin:4px 0;">📍 <strong>Venue:</strong> ${ev.venue || 'Campus Venue'}</p>
              </div>
              <p><a href="${eventUrl}" style="background:#7c3aed; color:#ffffff; padding:10px 20px; border-radius:6px; text-decoration:none; display:inline-block; font-weight:bold;">View Your QR Ticket Pass</a></p>
            </div>
          `;
          await sendEmail({ to: attendeeEmail, subject, html }).catch(console.error);
          sentCount++;
        }

        if (attendeePhone) {
          const smsText = `⏰ [EventHub Reminder] "${ev.name || ev.title}" starts soon on ${ev.date} at ${ev.venue}. Open your pass: ${eventUrl}`;
          await sendTwilioSMS({ to: formatPhoneNumber(attendeePhone), body: smsText }).catch(console.error);
        }
      }
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      upcomingEventsFound: eventsList.length,
      remindersSent: sentCount
    });
  } catch (err) {
    console.error('[Cron Reminders Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
