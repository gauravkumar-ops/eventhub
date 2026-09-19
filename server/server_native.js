import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data_store.json');

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

// In-Memory Database + File Persistence
let db = {
  events: [
    {
      id: 'evt_demo_01',
      name: 'Apex AI & Robotics Hackathon 2026',
      description: 'Join the premier inter-college artificial intelligence and robotics championship. Build high-impact agentic AI pipelines, compete for ₹2,50,000 in grand prizes, and network with leading tech founders.',
      category: 'Hackathon',
      date: '2026-10-24',
      startTime: '09:00',
      endTime: '18:00',
      venue: 'Main Auditorium & Innovation Lab',
      city: 'Pune',
      state: 'Maharashtra',
      maxAttendees: 150,
      organizerEmail: 'organizer@eventhub.io',
      organizerPhone: '+91 98765 43210',
      attendees: 18,
      checkedIn: 4
    }
  ],
  registrations: []
};

if (fs.existsSync(DATA_FILE)) {
  try {
    const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (saved.events) db.events = saved.events;
    if (saved.registrations) db.registrations = saved.registrations;
  } catch (e) {
    console.error('Error loading data_store.json:', e);
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving data_store.json:', e);
  }
}

// Connected WebSocket clients (Native WebSockets fallback support)
const sseClients = new Set();

function broadcastEventUpdate(eventId, payload) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    if (!client.eventId || client.eventId === eventId) {
      try {
        client.res.write(data);
      } catch (err) {
        sseClients.delete(client);
      }
    }
  }
}

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Real-Time SSE Stream Endpoint
  if (pathname === '/api/events/live-stream') {
    const eventId = parsedUrl.searchParams.get('eventId');
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write('\n');

    const clientObj = { res, eventId };
    sseClients.add(clientObj);

    // Initial sync
    const ev = db.events.find(e => e.id === eventId);
    if (ev) {
      res.write(`data: ${JSON.stringify({ type: 'sync', eventId, attendees: ev.attendees || 0 })}\n\n`);
    }

    req.on('close', () => {
      sseClients.delete(clientObj);
    });
    return;
  }

  // REST API: Get Events
  if (req.method === 'GET' && pathname === '/api/events') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, events: db.events }));
    return;
  }

  // REST API: Get Event by ID
  const eventMatch = pathname.match(/^\/api\/events\/([a-zA-Z0-9_-]+)$/);
  if (req.method === 'GET' && eventMatch) {
    const eventId = eventMatch[1];
    const event = db.events.find(e => e.id === eventId);
    if (!event) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Event not found' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, event }));
    return;
  }

  // REST API: Submit Registration Form
  const regMatch = pathname.match(/^\/api\/events\/([a-zA-Z0-9_-]+)\/register$/);
  if (req.method === 'POST' && regMatch) {
    const eventId = regMatch[1];
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { name, userId, email, college, whatsapp } = payload;
        const attendeeName = name || userId || 'Participant';

        let event = db.events.find(e => e.id === eventId);
        if (!event) {
          event = { id: eventId, name: 'Campus Event', attendees: 0, maxAttendees: null };
          db.events.push(event);
        }

        event.attendees = (event.attendees || 0) + 1;
        const ticketId = `EH-${eventId.slice(-6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const registration = {
          ticketId,
          eventId,
          name: attendeeName,
          email: email || `${attendeeName.toLowerCase().replace(/\s+/g, '')}@campus.edu`,
          college: college || 'Campus Student',
          whatsapp: whatsapp || '',
          registeredAt: new Date().toISOString()
        };

        db.registrations.push(registration);
        saveDb();

        const updateData = {
          type: 'registration_updated',
          eventId,
          attendees: event.attendees,
          maxAttendees: event.maxAttendees,
          newRegistration: { name: attendeeName, ticketId }
        };

        // Broadcast to all connected live-stream clients
        broadcastEventUpdate(eventId, updateData);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          count: event.attendees,
          ticketId,
          registration
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // Static File Serving
  const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
  let filePath = path.join(FRONTEND_DIR, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fallback for clean URLs
        const altHtml = filePath + '.html';
        if (fs.existsSync(altHtml)) {
          fs.readFile(altHtml, (err2, content2) => {
            if (!err2) {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(content2);
              return;
            }
          });
          return;
        }
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`⚡ EventHub Real-Time Server running on http://localhost:${PORT}`);
  console.log(`📡 Real-Time SSE/WebSocket Broadcast Stream: /api/events/live-stream`);
  console.log(`====================================================`);
});
