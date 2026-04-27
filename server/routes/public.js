'use strict';
const express = require('express');
const geoip = require('geoip-lite');
const { getInvitation, recordView, submitRsvp } = require('../dao');

const router = express.Router();

// GET /api/invitations/:id — public, returns invitation data
router.get('/:id', (req, res) => {
  const invitation = getInvitation(req.db, req.params.id);
  if (!invitation) return res.status(404).json({ error: 'Invitation not found' });

  // Return safe public fields only
  res.json({
    id: invitation.id,
    guest_name: invitation.guest_name,
    salutation: invitation.salutation,
    plus_one_allowed: invitation.plus_one_allowed,
    rsvp_status: invitation.rsvp_status,
    rsvp_plus_one: invitation.rsvp_plus_one
  });
});

// POST /api/invitations/:id/view — record a page open
router.post('/:id/view', (req, res) => {
  const invitation = getInvitation(req.db, req.params.id);
  if (!invitation) return res.status(404).json({ error: 'Invitation not found' });

  const ip =
    req.headers['cf-connecting-ip'] ||
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.ip;
  const geo = ip ? geoip.lookup(ip) : null;
  const country = geo ? geo.country : null;
  const city = geo ? geo.city : null;
  const userAgent = req.headers['user-agent'] || null;

  recordView(req.db, req.params.id, ip, country, city, userAgent);
  res.status(201).json({ ok: true });
});

// POST /api/invitations/:id/rsvp — submit RSVP response
router.post('/:id/rsvp', (req, res) => {
  const { status, plus_one } = req.body;

  if (status !== 'yes' && status !== 'no') {
    return res.status(400).json({ error: 'status must be "yes" or "no"' });
  }

  const updated = submitRsvp(req.db, req.params.id, status, plus_one);
  if (!updated) return res.status(404).json({ error: 'Invitation not found' });

  res.json({ ok: true, rsvp_status: updated.rsvp_status, rsvp_plus_one: updated.rsvp_plus_one });
});

module.exports = router;
