'use strict';
const express = require('express');
const { requireAuth } = require('../auth');
const { getStats } = require('../dao');

const router = express.Router();

router.use(requireAuth);

// GET /api/admin/stats
router.get('/', (req, res) => {
  const stats = getStats(req.db);
  res.json(stats);
});

module.exports = router;
