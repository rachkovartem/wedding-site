'use strict';
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const { createDb } = require('./db');
const { initAdminPassword, clearCookieToken } = require('./auth');
const { seed } = require('./seed');

const publicRoutes = require('./routes/public');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/admin');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy (Nginx) so req.ip gives real client IP
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS — allow Vite dev server in development
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
  }));
}

// Initialize DB
const db = createDb();

// Attach db to every request
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Initialize admin password
initAdminPassword(db);
// Seed demo data only in development (never in production)
if (process.env.NODE_ENV !== 'production') {
  seed(db);
}

// API Routes
app.use('/api/invitations', publicRoutes);
app.use('/api/auth', authRoutes);

// Standalone logout at /api/logout
app.post('/api/logout', (req, res) => {
  clearCookieToken(res);
  res.json({ ok: true });
});

// Mount stats BEFORE /api/admin to avoid prefix shadowing
app.use('/api/admin/stats', statsRoutes);
app.use('/api/admin', adminRoutes);

// Serve static frontend in production
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

// SPA fallback — non-API routes serve index.html
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) res.status(200).send('Wedding site - run npm run build first');
  });
});

app.listen(PORT, () => {
  console.log(`[server] Running on http://localhost:${PORT}`);
  console.log(`[server] Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; // For testing
