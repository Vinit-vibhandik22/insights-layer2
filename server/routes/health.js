const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'iNSIGHTS Layer 2 Backend',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    integrations: {
      groq: !!process.env.GROQ_API_KEY,
      tavily: !!process.env.TAVILY_API_KEY,
      github: !!process.env.GITHUB_TOKEN
    }
  });
});

module.exports = router;
