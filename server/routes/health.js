'use strict';

const express = require('express');
const router = express.Router();
const { checkConnection } = require('../services/supabase');

router.get('/', async (req, res) => {
  // Check Supabase connection
  let supabaseConnected = false;
  try {
    supabaseConnected = await checkConnection();
  } catch (_) {}

  res.json({
    status: 'ok',
    service: 'iNSIGHTS Layer 2 Backend',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    integrations: {
      groq: !!process.env.GROQ_API_KEY,
      tavily: !!process.env.TAVILY_API_KEY,
      supabase: supabaseConnected,
      clerk: !!process.env.CLERK_SECRET_KEY,
      github_oauth: !!process.env.GITHUB_OAUTH_CLIENT_ID
    }
  });
});

module.exports = router;
