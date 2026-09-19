import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data_store.json');
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

app.use(cors());
app.use(express.json());
app.use(express.static(FRONTEND_DIR));
app.use(express.static(__dirname));

// Initialize or load mock database / data store
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

// Load saved data if exists
if (fs.existsSync(DATA_FILE)) {
  try {
    const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (saved.events) db.events = saved.events;
    if (saved.registrations) db.registrations = saved.registrations;
  } catch (err) {
    console.error('Error loading data_store.json:', err);
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing data_store.json:', err);
  }
}

// REST Endpoints
app.get('/api/events', (req, res) => {
  res.json({ success: true, events: db.events });
});

app.get('/api/events/:id', (req, res) => {
  const event = db.events.find(e => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }
  res.json({ success: true, event });
});

app.post('/api/events', (req, res) => {
  const eventData = req.body;
  const newEvent = {
    id: eventData.id || `evt_${Date.now()}`,
    name: eventData.name || 'Untitled Event',
    description: eventData.description || '',
    category: eventData.category || 'General',
    date: eventData.date || new Date().toISOString().split('T')[0],
    startTime: eventData.startTime || '10:00',
    endTime: eventData.endTime || null,
    venue: eventData.venue || 'Campus Hall',
    city: eventData.city || 'Campus',
    state: eventData.state || null,
    maxAttendees: eventData.maxAttendees ? parseInt(eventData.maxAttendees) : null,
    organizerEmail: eventData.organizerEmail || 'organizer@eventhub.io',
    organizerPhone: eventData.organizerPhone || '',
    attendees: 0,
    checkedIn: 0,
    createdAt: new Date().toISOString()
  };

  db.events.unshift(newEvent);
  saveDb();

  // Notify dashboard or listeners of new event
  io.emit('event:created', newEvent);

  res.status(201).json({ success: true, event: newEvent });
});

// Registration endpoint with real-time socket broadcast
app.post('/api/events/:id/register', (req, res) => {
  const eventId = req.params.id;
  const { name, email, userId, college, whatsapp } = req.body;

  if (!name && !userId) {
    return res.status(400).json({ success: false, error: 'User ID or Name is required.' });
  }

  let event = db.events.find(e => e.id === eventId);
  if (!event) {
    // If not found, dynamically create event entry
    event = {
      id: eventId,
      name: 'Campus Event',
      attendees: 0,
      maxAttendees: null
    };
    db.events.push(event);
  }

  // Increment participant count
  event.attendees = (event.attendees || 0) + 1;

  const attendeeName = name || userId || 'Participant';
  const attendeeEmail = email || `${attendeeName.toLowerCase().replace(/\s+/g, '')}@campus.edu`;
  const ticketId = `EH-${eventId.slice(-6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const registration = {
    ticketId,
    eventId,
    eventName: event.name,
    userId: userId || null,
    name: attendeeName,
    email: attendeeEmail,
    college: college || 'Campus Student',
    whatsapp: whatsapp || '',
    registeredAt: new Date().toISOString()
  };

  db.registrations.push(registration);
  saveDb();

  // Broadcast real-time update to all connected clients viewing this event
  const updatePayload = {
    eventId,
    attendees: event.attendees,
    maxAttendees: event.maxAttendees,
    newRegistration: {
      name: attendeeName,
      ticketId
    },
    timestamp: new Date().toISOString()
  };

  // Broadcast to the specific event room and to all clients
  io.to(`event:${eventId}`).emit('registration:updated', updatePayload);
  io.emit('event:count_updated', updatePayload);

  console.log(`[RealTime Sync] Event "${event.name}" (${eventId}) participant count updated to: ${event.attendees}`);

  res.json({
    success: true,
    message: 'Registered successfully!',
    count: event.attendees,
    ticketId,
    registration
  });
});

// Real-Time Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Client joins event-specific room for targeted sync
  socket.on('join:event', (eventId) => {
    socket.join(`event:${eventId}`);
    console.log(`[Socket.io] Socket ${socket.id} joined room event:${eventId}`);

    // Immediately send current count back to newly connected client
    const event = db.events.find(e => e.id === eventId);
    if (event) {
      socket.emit('event:sync', {
        eventId,
        attendees: event.attendees || 0,
        maxAttendees: event.maxAttendees
      });
    }
  });

  socket.on('leave:event', (eventId) => {
    socket.leave(`event:${eventId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`⚡ EventHub Real-Time Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket / Socket.io live sync enabled`);
  console.log(`====================================================`);
});
