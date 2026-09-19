import http.server
import socketserver
import json
import os
import urllib.parse
import urllib.request
import base64
import mimetypes
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# Load .env manually without external dependencies
ENV_FILE = os.path.join(os.path.dirname(__file__), '..', '.env')
if not os.path.exists(ENV_FILE):
    ENV_FILE = os.path.join(os.path.dirname(__file__), '.env')

if os.path.exists(ENV_FILE):
    try:
        with open(ENV_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    os.environ[key.strip()] = val.strip().strip('"').strip("'")
    except Exception as e:
        print("Note reading .env:", e)

PORT = int(os.environ.get('PORT', 3000))
DATA_FILE = os.path.join(os.path.dirname(__file__), 'data_store.json')
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))

db = {
    "events": [
        {
            "id": "evt_demo_01",
            "name": "Apex AI & Robotics Hackathon 2026",
            "description": "Join the premier inter-college artificial intelligence and robotics championship. Build high-impact agentic AI pipelines, compete for ₹2,50,000 in grand prizes, and network with leading tech founders.",
            "category": "Hackathon",
            "date": "2026-10-24",
            "startTime": "09:00",
            "endTime": "18:00",
            "venue": "Main Auditorium & Innovation Lab",
            "city": "Pune",
            "state": "Maharashtra",
            "maxAttendees": 150,
            "organizerEmail": "organizer@eventhub.io",
            "organizerPhone": "+91 98765 43210",
            "attendees": 18,
            "checkedIn": 4
        }
    ],
    "registrations": []
}

if os.path.exists(DATA_FILE):
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            saved = json.load(f)
            if 'events' in saved: db['events'] = saved['events']
            if 'registrations' in saved: db['registrations'] = saved['registrations']
    except Exception as e:
        print("Error loading data_store.json:", e)

def save_db():
    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(db, f, indent=2)
    except Exception as e:
        print("Error saving data_store.json:", e)

def send_email_notification(to_email, event_name, event_date, event_time, event_venue, event_category, event_url, organizer_name="Organizer"):
    """
    Sends a formatted confirmation email to the event creator.
    Uses Gmail SMTP or standard SMTP if EMAIL_USER and EMAIL_PASS are set in .env.
    """
    sender_email = os.environ.get('EMAIL_USER', os.environ.get('SMTP_USER', ''))
    sender_password = os.environ.get('EMAIL_PASS', os.environ.get('SMTP_PASS', ''))
    smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', 465))

    subject = f"🎉 Your Event is Live: {event_name} — EventHub"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>{subject}</title>
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
                  <p style="color:#e9d5ff; margin:6px 0 0; font-size:13px; font-weight:600;">EVENT PUBLISHED SUCCESSFULLY</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding:28px 24px;">
                  <h2 style="margin:0 0 12px; color:#ffffff; font-size:18px;">Hi {organizer_name},</h2>
                  <p style="margin:0 0 20px; color:#cbd5e1; font-size:14px; line-height:1.6;">
                    Congratulations! Your event <strong style="color:#a855f7;">{event_name}</strong> is now live on EventHub and open for student registrations.
                  </p>

                  <!-- Event Metadata Box -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#0f172a; border:1px solid #334155; border-radius:12px; margin-bottom:24px;">
                    <tr>
                      <td style="padding:16px;">
                        <p style="margin:0 0 8px; font-size:13px; color:#94a3b8;">📅 <strong>Date & Time:</strong> <span style="color:#f8fafc;">{event_date} • {event_time}</span></p>
                        <p style="margin:0 0 8px; font-size:13px; color:#94a3b8;">📍 <strong>Venue:</strong> <span style="color:#f8fafc;">{event_venue}</span></p>
                        <p style="margin:0; font-size:13px; color:#94a3b8;">🏷️ <strong>Category:</strong> <span style="color:#f8fafc;">{event_category}</span></p>
                      </td>
                    </tr>
                  </table>

                  <!-- Action Buttons -->
                  <div style="text-align:center; margin-bottom:24px;">
                    <a href="{event_url}" style="background:#7c3aed; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:700; font-size:14px; display:inline-block; box-shadow:0 4px 12px rgba(124,58,237,0.4);">
                      Open Event Page & Share QR
                    </a>
                  </div>

                  <p style="margin:0; color:#64748b; font-size:12px; line-height:1.5; border-top:1px solid #334155; padding-top:16px;">
                    💡 <em>Tip: You can use your mobile camera to scan attendee QR passes at the entrance gate from the built-in scanner.</em>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    if sender_email and sender_password:
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = f"EventHub <{sender_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(html_body, 'html'))

            if smtp_port == 465:
                with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
                    server.login(sender_email, sender_password)
                    server.sendmail(sender_email, [to_email], msg.as_string())
            else:
                with smtplib.SMTP(smtp_host, smtp_port) as server:
                    server.starttls()
                    server.login(sender_email, sender_password)
                    server.sendmail(sender_email, [to_email], msg.as_string())

            print(f"[Email Dispatch] Successfully sent confirmation email to: {to_email}")
            return True, "Email sent successfully"
        except Exception as e:
            print(f"[Email Dispatch Error] Failed to send email to {to_email}:", e)
            return False, str(e)
    else:
        print(f"[Email Dispatch Simulated] Email credentials not configured in .env. Target: {to_email} | Event: {event_name}")
        return True, "Simulated (configure EMAIL_USER and EMAIL_PASS in .env for real inbox delivery)"

def send_sms_notification(phone_number, event_name, event_date, event_venue, event_url):
    """
    Sends an SMS notification to the registered mobile number.
    Supports Twilio and Fast2SMS credentials in .env.
    """
    cleaned_phone = ''.join(filter(str.isdigit, str(phone_number)))
    sms_text = f"🎉 [EventHub] Your event '{event_name}' is live! Date: {event_date} at {event_venue}. View & manage: {event_url}"

    # 1. Check for Twilio Credentials
    twilio_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    twilio_auth = os.environ.get('TWILIO_AUTH_TOKEN')
    twilio_from = os.environ.get('TWILIO_PHONE_NUMBER')

    if twilio_sid and twilio_auth and twilio_from:
        try:
            target_number = f"+91{cleaned_phone}" if len(cleaned_phone) == 10 else f"+{cleaned_phone}"
            twilio_url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json"
            data = urllib.parse.urlencode({
                'From': twilio_from,
                'To': target_number,
                'Body': sms_text
            }).encode('utf-8')

            req = urllib.request.Request(twilio_url, data=data)
            auth_str = f"{twilio_sid}:{twilio_auth}"
            auth_bytes = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
            req.add_header("Authorization", f"Basic {auth_bytes}")

            with urllib.request.urlopen(req) as resp:
                print(f"[SMS Dispatch Twilio] Sent SMS to: {target_number}")
                return True, "SMS sent via Twilio"
        except Exception as e:
            print(f"[SMS Dispatch Twilio Error]:", e)

    # 2. Check for Fast2SMS (India)
    fast2sms_key = os.environ.get('FAST2SMS_API_KEY')
    if fast2sms_key:
        try:
            req_data = json.dumps({
                "route": "q",
                "message": sms_text,
                "flash": 0,
                "numbers": cleaned_phone[-10:]
            }).encode('utf-8')

            req = urllib.request.Request("https://www.fast2sms.com/dev/bulkV2", data=req_data, headers={
                'authorization': fast2sms_key,
                'Content-Type': 'application/json'
            })
            with urllib.request.urlopen(req) as resp:
                print(f"[SMS Dispatch Fast2SMS] Sent SMS to: {cleaned_phone}")
                return True, "SMS sent via Fast2SMS"
        except Exception as e:
            print(f"[SMS Dispatch Fast2SMS Error]:", e)

    print(f"[SMS Dispatch Simulated] SMS credentials not set in .env. Target Phone: {cleaned_phone} | Msg: {sms_text}")
    return True, "Simulated (configure TWILIO or FAST2SMS_API_KEY in .env for real SMS delivery)"


class EventHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == '/api/events':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "events": db["events"]}).encode('utf-8'))
            return

        if path.startswith('/api/events/'):
            event_id = path.replace('/api/events/', '').strip('/')
            event = next((e for e in db["events"] if e["id"] == event_id), None)
            if event:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "event": event}).encode('utf-8'))
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Event not found"}).encode('utf-8'))
            return

        return super().do_GET()

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path.startswith('/api/events/'):
            event_id = path.replace('/api/events/', '').strip('/')
            db["events"] = [e for e in db["events"] if e.get("id") != event_id]
            db["registrations"] = [r for r in db["registrations"] if r.get("eventId") != event_id]
            save_db()

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "message": "Event deleted successfully"}).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get('Content-Length', 0))
        body_str = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
        try:
            body = json.loads(body_str or '{}')
        except:
            body = {}

        # 1. Event Creation Email & SMS Notification Endpoint
        if path == '/api/notifications/send':
            to_email = body.get('to_email') or body.get('email')
            phone = body.get('phone')
            event_name = body.get('event_name') or body.get('eventName') or 'Campus Event'
            event_date = body.get('event_date') or body.get('eventDate') or 'Date TBA'
            event_time = body.get('event_time') or body.get('eventTime') or 'Time TBA'
            event_venue = body.get('event_venue') or body.get('venue') or 'Campus Venue'
            event_category = body.get('category') or 'Event'
            event_url = body.get('event_url') or body.get('eventUrl') or 'http://localhost:3000/event.html'
            organizer_name = body.get('organizer_name') or (to_email.split('@')[0] if to_email else 'Organizer')

            email_sent = False
            sms_sent = False

            if to_email:
                email_sent, email_msg = send_email_notification(
                    to_email=to_email,
                    event_name=event_name,
                    event_date=event_date,
                    event_time=event_time,
                    event_venue=event_venue,
                    event_category=event_category,
                    event_url=event_url,
                    organizer_name=organizer_name
                )

            if phone:
                sms_sent, sms_msg = send_sms_notification(
                    phone_number=phone,
                    event_name=event_name,
                    event_date=event_date,
                    event_venue=event_venue,
                    event_url=event_url
                )

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "email_dispatched": email_sent,
                "sms_dispatched": sms_sent,
                "recipient_email": to_email,
                "recipient_phone": phone
            }).encode('utf-8'))
            return

        # 2. Registration endpoint with live attendee increment
        if path.startswith('/api/events/') and path.endswith('/register'):
            parts = path.split('/')
            event_id = parts[3]

            name = body.get('name') or body.get('userId') or 'Participant'
            email = body.get('email') or f"{name.lower().replace(' ', '')}@campus.edu"
            college = body.get('college') or 'Campus Student'
            whatsapp = body.get('whatsapp') or ''

            event = next((e for e in db["events"] if e["id"] == event_id), None)
            if not event:
                event = {
                    "id": event_id,
                    "name": "Campus Event",
                    "attendees": 0,
                    "maxAttendees": None
                }
                db["events"].append(event)

            event["attendees"] = event.get("attendees", 0) + 1
            ticket_id = f"EH-{event_id[-6:].upper()}-{abs(hash(name + event_id + str(datetime.now()))) % 9000 + 1000}"

            reg = {
                "ticketId": ticket_id,
                "eventId": event_id,
                "name": name,
                "email": email,
                "college": college,
                "whatsapp": whatsapp,
                "registeredAt": datetime.now().isoformat()
            }
            db["registrations"].append(reg)
            save_db()

            response_data = {
                "success": True,
                "count": event["attendees"],
                "ticketId": ticket_id,
                "registration": reg
            }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

if __name__ == '__main__':
    print(f"====================================================")
    print(f"⚡ EventHub Real-Time Server running on http://localhost:{PORT}")
    print(f"✉️  Email & SMS notification dispatch gateway active")
    print(f"====================================================")
    with socketserver.TCPServer(("", PORT), EventHandler) as httpd:
        httpd.serve_forever()
