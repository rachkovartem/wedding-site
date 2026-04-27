import { describe, it, expect, beforeEach } from 'vitest';
import { createDb } from '../db.js';

describe('createDb', () => {
  let db;

  beforeEach(() => {
    db = createDb(':memory:');
  });

  it('creates all three tables', () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
    expect(tables).toContain('invitations');
    expect(tables).toContain('views');
    expect(tables).toContain('settings');
  });

  it('enables foreign key enforcement', () => {
    const fkStatus = db.pragma('foreign_keys', { simple: true });
    expect(fkStatus).toBe(1);
  });

  it('enforces rsvp_status CHECK constraint', () => {
    db.prepare("INSERT INTO invitations (id, guest_name, created_at) VALUES ('test1', 'Test', 0)").run();

    expect(() => {
      db.prepare("UPDATE invitations SET rsvp_status = 'maybe' WHERE id = 'test1'").run();
    }).toThrow();
  });

  it('allows null rsvp_status', () => {
    db.prepare("INSERT INTO invitations (id, guest_name, created_at) VALUES ('test2', 'Test', 0)").run();
    expect(() => {
      db.prepare("UPDATE invitations SET rsvp_status = NULL WHERE id = 'test2'").run();
    }).not.toThrow();
  });

  it('is idempotent (CREATE IF NOT EXISTS)', () => {
    expect(() => createDb(':memory:')).not.toThrow();
  });
});
