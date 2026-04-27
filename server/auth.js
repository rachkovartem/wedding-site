'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getSetting, setSetting } = require('./dao');

const JWT_SECRET = process.env.JWT_SECRET || 'wedding-secret-default-dev';
const JWT_EXPIRY = '24h';
const COOKIE_NAME = 'admin_token';

function initAdminPassword(db) {
  const envPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const storedHash = getSetting(db, 'admin_password_hash');

  if (storedHash) {
    // Check if password changed
    const matches = bcrypt.compareSync(envPassword, storedHash);
    if (!matches) {
      // Password rotated — update the hash
      console.log('[auth] Admin password changed, updating hash...');
      const newHash = bcrypt.hashSync(envPassword, 10);
      setSetting(db, 'admin_password_hash', newHash);
    }
  } else {
    // First run — hash and store
    console.log('[auth] Initializing admin password...');
    const hash = bcrypt.hashSync(envPassword, 10);
    setSetting(db, 'admin_password_hash', hash);
  }
}

function authenticateAdmin(db, password) {
  const storedHash = getSetting(db, 'admin_password_hash');
  if (!storedHash) return false;
  return bcrypt.compareSync(password, storedHash);
}

function generateToken() {
  return jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

function setCookieToken(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours in ms
  });
}

function clearCookieToken(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  });
}

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = {
  initAdminPassword,
  authenticateAdmin,
  generateToken,
  setCookieToken,
  clearCookieToken,
  requireAuth
};
