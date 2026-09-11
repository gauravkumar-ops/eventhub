import http.server
import socketserver
import json
import os
import urllib.parse
import mimetypes
from datetime import datetime

PORT = int(os.environ.get('PORT', 3000))
DATA_FILE = os.path.join(os.path.dirname(__file__), 'data_store.json')

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

class EventHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
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

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path.startswith('/api/events/') and path.endswith('/register'):
            parts = path.split('/')
            event_id = parts[3]
            
            content_length = int(self.headers.get('Content-Length', 0))
            body_str = self.rfile.read(content_length).decode('utf-8')
            try:
                body = json.loads(body_str or '{}')
            except:
                body = {}

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
    print(f"⚡ EventHub Real-Time Server running on http://localhost:{PORT}")
    with socketserver.TCPServer(("", PORT), EventHandler) as httpd:
        httpd.serve_forever()
