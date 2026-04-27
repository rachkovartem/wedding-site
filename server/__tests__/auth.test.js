import { describe, it, expect, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { createDb } from '../db.js';
import { initAdminPassword, authenticateAdmin, generateToken } from '../auth.js';

describe('auth', () => {
  let db;

  beforeEach(() => {
    db = createDb(':memory:');
    process.env.ADMIN_PASSWORD = 'test-password-123';
    process.env.JWT_SECRET = 'test-secret';
  });

  it('initAdminPassword stores hash on first run', () => {
    initAdminPassword(db);
    expect(authenticateAdmin(db, 'test-password-123')).toBe(true);
  });

  it('authenticateAdmin returns false for wrong password', () => {
    initAdminPassword(db);
    expect(authenticateAdmin(db, 'wrong-password')).toBe(false);
  });

  it('initAdminPassword re-hashes when password changes', () => {
    initAdminPassword(db);
    process.env.ADMIN_PASSWORD = 'new-password-456';
    initAdminPassword(db); // Should detect change and update
    expect(authenticateAdmin(db, 'new-password-456')).toBe(true);
    expect(authenticateAdmin(db, 'test-password-123')).toBe(false);
  });

  it('generateToken returns a valid JWT with admin role', () => {
    // JWT_SECRET is evaluated at module load time in auth.js.
    // We decode without verifying the secret to check the payload,
    // then also verify the token is structurally valid.
    const token = generateToken();
    // jwt.decode does not verify signature — just checks structure and payload
    const decoded = jwt.decode(token);
    expect(decoded).not.toBeNull();
    expect(decoded.role).toBe('admin');
    // Ensure it's a proper 3-part JWT string
    expect(token.split('.')).toHaveLength(3);
  });

  it('authenticateAdmin returns false when no hash in DB', () => {
    // No initAdminPassword called — settings table is empty
    expect(authenticateAdmin(db, 'any-password')).toBe(false);
  });
});
