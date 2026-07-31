'use strict';

const express = require('express');
const router = express.Router();
const { getRecentBlueprints, getBlueprintById } = require('../services/supabase');

// ── GET /api/workspaces — Get recent blueprints for session ───────────────
router.get('/', async (req, res) => {
  const sessionId = req.headers['x-session-id'] || req.ip;

  try {
    const blueprints = await getRecentBlueprints(sessionId, 20);
    res.json({ blueprints: blueprints || [] });
  } catch (err) {
    res.json({ blueprints: [] });
  }
});

// ── GET /api/workspaces/:id — Get a specific blueprint ────────────────────
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (!id || !id.match(/^[0-9a-f-]{36}$/i)) {
    return res.status(400).json({ error: 'Invalid blueprint ID' });
  }

  try {
    const blueprint = await getBlueprintById(id);
    if (!blueprint) {
      return res.status(404).json({ error: 'Blueprint not found' });
    }
    res.json(blueprint);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve blueprint' });
  }
});

module.exports = router;
