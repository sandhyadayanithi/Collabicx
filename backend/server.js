import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import admin, { db } from './firebase.js';
import activityRoutes from './routes/activity.js';
import authRoutes from './routes/auth.js';

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 4000;

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api/activities', activityRoutes);
app.use('/api/auth', authRoutes);

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  socket.on('activity:subscribe', ({ teamIds = [] } = {}) => {
    if (!Array.isArray(teamIds)) return;
    teamIds.forEach(teamId => {
      if (teamId) socket.join(`team:${teamId}`);
    });
  });

  socket.on('activity:unsubscribe', ({ teamIds = [] } = {}) => {
    if (!Array.isArray(teamIds)) return;
    teamIds.forEach(teamId => {
      if (teamId) socket.leave(`team:${teamId}`);
    });
  });
});

// db is imported from firebase.js
const activitiesRef = db.collection('activities').orderBy('createdAt', 'desc').limit(1);

activitiesRef.onSnapshot((snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      const data = change.doc.data();
      const payload = { id: change.doc.id, ...data };
      if (data?.teamId) {
        io.to(`team:${data.teamId}`).emit('activity:new', payload);
      }
    }
  });
}, (error) => {
  console.error('Activity listener error:', error);
});

server.listen(port, () => {
  console.log(`Activity server listening on ${port}`);
});
