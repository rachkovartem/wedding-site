'use strict';
const Database = require('better-sqlite3');
const path = require('path');

function createDb(dbPath) {
  const resolvedPath = dbPath || process.env.DB_PATH || path.join(__dirname, 'data.db');
  const db = new Database(resolvedPath);

  // CRITICAL: Enable foreign key enforcement
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      guest_name TEXT NOT NULL,
      plus_one_allowed INTEGER DEFAULT 0,
      rsvp_status TEXT CHECK (rsvp_status IS NULL OR rsvp_status IN ('yes', 'no')),
      rsvp_plus_one INTEGER,
      rsvp_submitted_at INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invitation_id TEXT NOT NULL,
      viewed_at INTEGER NOT NULL,
      ip_address TEXT,
      country TEXT,
      city TEXT,
      user_agent TEXT,
      FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  return db;
}

module.exports = { createDb };
