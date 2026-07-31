require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// ── Security Middleware ──────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "fonts.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "fonts.gstatic.com"],
      fontSrc: ["'self'", "fonts.googleapis.com", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    }
  }
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.ALLOWED_ORIGIN : '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID']
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' }));

// ── Rate Limiting ────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait before generating more blueprints.' }
});

const provisionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Daily provisioning limit reached. Please try again tomorrow.' }
});

// ── API Routes ───────────────────────────────────────────────────────────
app.use('/api/generate-blueprint', apiLimiter, require('./routes/generate-blueprint'));
app.use('/api/provision-repo', provisionLimiter, require('./routes/provision-repo'));
app.use('/api/mentor-chat', require('./routes/mentor-chat'));
app.use('/api/workspaces', require('./routes/workspaces'));
app.use('/api/health', require('./routes/health'));

// ── Serve Static Frontend ────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..'), {
  index: 'index.html',
  extensions: ['html'],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// ── 404 / Error Handlers ─────────────────────────────────────────────────
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// ── Start Server ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const line = '─'.repeat(50);
  console.log(`\n${line}`);
  console.log(`🚀  iNSIGHTS Layer 2  —  http://localhost:${PORT}`);
  console.log(line);
  console.log(`🧠  Groq (Llama 3.3 70B):  ${process.env.GROQ_API_KEY   ? '✅ Connected' : '❌ Missing key'}`);
  console.log(`🔍  Tavily RAG:             ${process.env.TAVILY_API_KEY  ? '✅ Connected' : '❌ Missing key'}`);
  console.log(`🗄️   Supabase DB:            ${process.env.SUPABASE_URL    ? '✅ Connected' : '❌ Missing key'}`);
  console.log(`🔐  Clerk Auth:             ${process.env.CLERK_SECRET_KEY ? '✅ Connected' : '⚠️  Optional'}`);
  console.log(`🐙  GitHub OAuth:           ${process.env.GITHUB_OAUTH_CLIENT_ID ? '✅ Configured' : '⚠️  Use PAT in modal'}`);
  console.log(line + '\n');
});

module.exports = app;
