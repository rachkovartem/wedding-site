'use strict';
const { nanoid } = require('nanoid');

// INVITATIONS

function getInvitation(db, id) {
  return db.prepare('SELECT * FROM invitations WHERE id = ?').get(id) || null;
}

function getAllInvitations(db) {
  return db.prepare(`
    SELECT i.*,
      COUNT(v.id) as view_count,
      MAX(v.viewed_at) as last_viewed_at
    FROM invitations i
    LEFT JOIN views v ON v.invitation_id = i.id
    GROUP BY i.id
    ORDER BY i.created_at DESC
  `).all();
}

function createInvitation(db, guestName, plusOneAllowed) {
  const id = nanoid(8);
  const createdAt = Math.floor(Date.now() / 1000);
  db.prepare(
    'INSERT INTO invitations (id, guest_name, plus_one_allowed, created_at) VALUES (?, ?, ?, ?)'
  ).run(id, guestName, plusOneAllowed ? 1 : 0, createdAt);
  return getInvitation(db, id);
}

function deleteInvitation(db, id) {
  // Manual cascade (belt-and-suspenders)
  db.prepare('DELETE FROM views WHERE invitation_id = ?').run(id);
  const result = db.prepare('DELETE FROM invitations WHERE id = ?').run(id);
  return result.changes > 0;
}

function submitRsvp(db, id, status, plusOne) {
  if (status !== 'yes' && status !== 'no') {
    throw new Error('Invalid rsvp_status: must be "yes" or "no"');
  }
  const invitation = getInvitation(db, id);
  if (!invitation) return null;

  const rsvpPlusOne = (status === 'yes' && invitation.plus_one_allowed === 1)
    ? (plusOne ? 1 : 0)
    : null;

  db.prepare(`
    UPDATE invitations
    SET rsvp_status = ?, rsvp_plus_one = ?, rsvp_submitted_at = ?
    WHERE id = ?
  `).run(status, rsvpPlusOne, Math.floor(Date.now() / 1000), id);

  return getInvitation(db, id);
}

// VIEWS

function recordView(db, invitationId, ipAddress, country, city, userAgent) {
  const viewedAt = Math.floor(Date.now() / 1000);
  db.prepare(
    'INSERT INTO views (invitation_id, viewed_at, ip_address, country, city, user_agent) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(invitationId, viewedAt, ipAddress || null, country || null, city || null, userAgent || null);
}

function getViewsForInvitation(db, invitationId) {
  return db.prepare(
    'SELECT * FROM views WHERE invitation_id = ? ORDER BY viewed_at DESC'
  ).all(invitationId);
}

// SETTINGS

function getSetting(db, key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setSetting(db, key, value) {
  db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, value);
}

// STATS

function getStats(db) {
  const totalInvitations = db.prepare('SELECT COUNT(*) as count FROM invitations').get().count;
  const totalViews = db.prepare('SELECT COUNT(*) as count FROM views').get().count;

  const rsvpBreakdown = db.prepare(`
    SELECT
      COUNT(CASE WHEN rsvp_status = 'yes' THEN 1 END) as yes_count,
      COUNT(CASE WHEN rsvp_status = 'no' THEN 1 END) as no_count,
      COUNT(CASE WHEN rsvp_status IS NULL THEN 1 END) as pending_count
    FROM invitations
  `).get();

  // Confirmed guest count including +1s
  const confirmedGuests = db.prepare(`
    SELECT
      COUNT(*) + COALESCE(SUM(CASE WHEN rsvp_plus_one = 1 THEN 1 ELSE 0 END), 0) as total
    FROM invitations
    WHERE rsvp_status = 'yes'
  `).get().total;

  // Views per day for last 30 days
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
  const viewsPerDay = db.prepare(`
    SELECT
      date(viewed_at, 'unixepoch') as date,
      COUNT(*) as count
    FROM views
    WHERE viewed_at >= ?
    GROUP BY date(viewed_at, 'unixepoch')
    ORDER BY date ASC
  `).all(thirtyDaysAgo);

  const openedInvitations = db.prepare(
    'SELECT COUNT(DISTINCT invitation_id) as count FROM views'
  ).get().count;

  // Per-guest data with view history
  const guests = getAllInvitations(db).map(inv => ({
    ...inv,
    views: getViewsForInvitation(db, inv.id)
  }));

  return {
    total_invitations: totalInvitations,
    total_views: totalViews,
    confirmed_guests: confirmedGuests,
    opened_invitations: openedInvitations,
    rsvp_breakdown: rsvpBreakdown,
    views_per_day: viewsPerDay,
    guests
  };
}

module.exports = {
  getInvitation,
  getAllInvitations,
  createInvitation,
  deleteInvitation,
  submitRsvp,
  recordView,
  getViewsForInvitation,
  getSetting,
  setSetting,
  getStats
};
