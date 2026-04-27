import { describe, it, expect, beforeEach } from 'vitest';
import { createDb } from '../db.js';
import {
  createInvitation, getInvitation, getAllInvitations,
  deleteInvitation, submitRsvp, recordView, getViewsForInvitation,
  getSetting, setSetting, getStats
} from '../dao.js';

describe('DAO', () => {
  let db;

  beforeEach(() => {
    db = createDb(':memory:');
  });

  describe('invitations', () => {
    it('createInvitation returns object with 8-char id', () => {
      const inv = createInvitation(db, 'Test Guest', 0, 'Дорогой');
      expect(inv.id).toHaveLength(8);
      expect(inv.guest_name).toBe('Test Guest');
    });

    it('createInvitation stores provided salutation', () => {
      const inv = createInvitation(db, 'Ira', 0, 'Дорогая');
      expect(inv.salutation).toBe('Дорогая');
    });

    it('createInvitation defaults salutation to Дорогой when not provided', () => {
      const inv = createInvitation(db, 'Guest', 0);
      expect(inv.salutation).toBe('Дорогой');
    });

    it('createInvitation defaults salutation to Дорогой when null passed', () => {
      const inv = createInvitation(db, 'Guest', 0, null);
      expect(inv.salutation).toBe('Дорогой');
    });

    it('getInvitation returns null for non-existent id', () => {
      expect(getInvitation(db, 'nope1234')).toBeNull();
    });

    it('deleteInvitation removes invitation', () => {
      const inv = createInvitation(db, 'Delete Me', 0, 'Дорогой');
      expect(deleteInvitation(db, inv.id)).toBe(true);
      expect(getInvitation(db, inv.id)).toBeNull();
    });

    it('deleteInvitation cascades to views', () => {
      const inv = createInvitation(db, 'With Views', 0, 'Дорогой');
      recordView(db, inv.id, '1.2.3.4', 'GE', 'Tbilisi', 'Firefox');
      deleteInvitation(db, inv.id);
      const views = getViewsForInvitation(db, inv.id);
      expect(views).toHaveLength(0);
    });

    it('deleteInvitation returns false for non-existent id', () => {
      expect(deleteInvitation(db, 'nope1234')).toBe(false);
    });
  });

  describe('submitRsvp', () => {
    it('accepts yes status', () => {
      const inv = createInvitation(db, 'Guest', 0);
      const updated = submitRsvp(db, inv.id, 'yes', null);
      expect(updated.rsvp_status).toBe('yes');
    });

    it('saves plus_one when allowed and status is yes', () => {
      const inv = createInvitation(db, 'Guest', 1);
      const updated = submitRsvp(db, inv.id, 'yes', 1);
      expect(updated.rsvp_plus_one).toBe(1);
    });

    it('does NOT save plus_one when not allowed', () => {
      const inv = createInvitation(db, 'Guest', 0);
      const updated = submitRsvp(db, inv.id, 'yes', 1);
      expect(updated.rsvp_plus_one).toBeNull();
    });

    it('throws for invalid status', () => {
      const inv = createInvitation(db, 'Guest', 0);
      expect(() => submitRsvp(db, inv.id, 'maybe', null)).toThrow();
    });

    it('returns null for non-existent invitation', () => {
      expect(submitRsvp(db, 'nope1234', 'yes', null)).toBeNull();
    });

    it('does not save plus_one when status is no', () => {
      const inv = createInvitation(db, 'Guest', 1);
      const updated = submitRsvp(db, inv.id, 'no', 1);
      expect(updated.rsvp_plus_one).toBeNull();
    });
  });

  describe('settings', () => {
    it('getSetting returns null when not set', () => {
      expect(getSetting(db, 'nonexistent')).toBeNull();
    });

    it('setSetting and getSetting round-trip', () => {
      setSetting(db, 'test_key', 'test_value');
      expect(getSetting(db, 'test_key')).toBe('test_value');
    });

    it('setSetting overwrites existing value', () => {
      setSetting(db, 'key', 'v1');
      setSetting(db, 'key', 'v2');
      expect(getSetting(db, 'key')).toBe('v2');
    });
  });

  describe('getAllInvitations', () => {
    it('returns empty array when no invitations', () => {
      expect(getAllInvitations(db)).toEqual([]);
    });

    it('includes view_count and last_viewed_at', () => {
      const inv = createInvitation(db, 'Viewed Guest', 0);
      recordView(db, inv.id, '1.1.1.1', 'GE', 'Tbilisi', 'Chrome');
      const all = getAllInvitations(db);
      expect(all[0].view_count).toBe(1);
      expect(all[0].last_viewed_at).toBeTruthy();
    });
  });

  describe('getStats', () => {
    it('returns correct aggregate counts', () => {
      createInvitation(db, 'A', 0);
      const b = createInvitation(db, 'B', 1);
      submitRsvp(db, b.id, 'yes', 1);
      recordView(db, b.id, '1.1.1.1', 'GE', 'Tbilisi', 'Chrome');

      const stats = getStats(db);
      expect(stats.total_invitations).toBe(2);
      expect(stats.total_views).toBe(1);
      expect(stats.opened_invitations).toBe(1); // we recorded one view
      expect(stats.rsvp_breakdown.yes_count).toBe(1);
      expect(stats.rsvp_breakdown.pending_count).toBe(1);
    });

    it('confirmed_guests counts +1s', () => {
      const inv = createInvitation(db, 'Guest With Plus One', 1);
      submitRsvp(db, inv.id, 'yes', 1);

      const stats = getStats(db);
      // 1 person + 1 plus_one = 2
      expect(stats.confirmed_guests).toBe(2);
    });

    it('returns views_per_day array', () => {
      const stats = getStats(db);
      expect(Array.isArray(stats.views_per_day)).toBe(true);
    });

    it('returns guests array with views', () => {
      createInvitation(db, 'Test', 0);
      const stats = getStats(db);
      expect(Array.isArray(stats.guests)).toBe(true);
      expect(stats.guests[0]).toHaveProperty('views');
    });
  });
});
