'use strict';

const express = require('express');
const router = express.Router();
const { generateMentorResponse } = require('../services/groq-client');

// ── POST /api/mentor-chat ──────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { message, blueprint, history = [] } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const cleanMessage = message.trim().substring(0, 1000);

  try {
    if (!process.env.GROQ_API_KEY) {
      // Fallback responses when no API key
      const fallbacks = [
        "Good question! Based on your project architecture, I'd recommend starting with the database schema to establish a solid foundation.",
        "I've analyzed your tech stack. The AI/ML component should be built as a separate microservice to keep concerns separated.",
        "For this sprint, focus on getting the core API endpoints working first. The ML integration can come in Week 3.",
        "I've found 3 relevant GitHub repos that match your stack. Want me to analyze their architecture patterns?",
        "Security tip: Always validate user input on both frontend and backend. I'll add input sanitization to your checklist.",
        "The architecture looks solid! Make sure to add proper error handling and logging before moving to production.",
        "I'd suggest adding Redis caching for frequently accessed data — it'll significantly improve your API response times.",
        "Great progress! You're on track with the sprint plan. Let's focus on the core feature implementation next."
      ];

      const response = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      return res.json({ response, source: 'fallback' });
    }

    const response = await generateMentorResponse(cleanMessage, blueprint, history);
    res.json({ response, source: 'groq' });

  } catch (err) {
    console.error('[Mentor] Chat error:', err.message);
    res.status(500).json({
      error: 'Failed to generate mentor response. Please try again.',
      response: "I'm having trouble connecting right now. Let me try again — could you rephrase your question?"
    });
  }
});

module.exports = router;
