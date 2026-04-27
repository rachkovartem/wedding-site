'use strict';
const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateAdmin, generateToken, setCookieToken, clearCookieToken } = require('../auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' }
});

// POST /api/auth — authenticate with password, set cookie
router.post('/', loginLimiter, (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });

  if (!authenticateAdmin(req.db, password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = generateToken();
  setCookieToken(res, token);
  res.json({ ok: true });
});

// POST /api/logout — clear auth cookie
router.post('/logout', (req, res) => {
  clearCookieToken(res);
  res.json({ ok: true });
});

module.exports = router;
