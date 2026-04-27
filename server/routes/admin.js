'use strict';
const express = require('express');
const { requireAuth } = require('../auth');
const { getAllInvitations, createInvitation, deleteInvitation } = require('../dao');

const router = express.Router();

router.use(requireAuth);

// GET /api/admin/invitations
router.get('/invitations', (req, res) => {
  const invitations = getAllInvitations(req.db);
  res.json(invitations);
});

// POST /api/admin/invitations
router.post('/invitations', (req, res) => {
  const { guest_name, plus_one_allowed } = req.body;
  if (!guest_name || typeof guest_name !== 'string' || !guest_name.trim()) {
    return res.status(400).json({ error: 'guest_name is required' });
  }

  const invitation = createInvitation(req.db, guest_name.trim(), plus_one_allowed || 0);
  res.status(201).json(invitation);
});

// DELETE /api/admin/invitations/:id
router.delete('/invitations/:id', (req, res) => {
  const deleted = deleteInvitation(req.db, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Invitation not found' });
  res.status(204).end();
});

module.exports = router;
