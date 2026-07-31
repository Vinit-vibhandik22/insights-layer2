'use strict';

const { createBackendClient } = require('@clerk/backend');

let clerkClient = null;

function getClerk() {
  if (!clerkClient) {
    if (!process.env.CLERK_SECRET_KEY) {
      return null;
    }
    clerkClient = createBackendClient({
      secretKey: process.env.CLERK_SECRET_KEY,
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    });
  }
  return clerkClient;
}

// ── Optional auth middleware — attaches user info if token present ─────────
// Does NOT block requests — routes work with or without auth
async function optionalAuth(req, res, next) {
  const clerk = getClerk();
  if (!clerk) {
    req.auth = { userId: null, sessionId: null };
    return next();
  }

  try {
    const token = extractToken(req);
    if (!token) {
      req.auth = { userId: null, sessionId: null };
      return next();
    }

    const verifiedToken = await clerk.verifyToken(token);
    req.auth = {
      userId: verifiedToken.sub,
      sessionId: verifiedToken.sid,
      orgId: verifiedToken.org_id || null
    };
  } catch {
    // Invalid token — still allow request (optional auth)
    req.auth = { userId: null, sessionId: null };
  }

  next();
}

// ── Required auth middleware — blocks if no valid token ───────────────────
async function requireAuth(req, res, next) {
  const clerk = getClerk();
  if (!clerk) {
    // Skip auth if Clerk not configured (dev mode)
    req.auth = { userId: 'dev-user', sessionId: 'dev-session' };
    return next();
  }

  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const verifiedToken = await clerk.verifyToken(token);
    req.auth = {
      userId: verifiedToken.sub,
      sessionId: verifiedToken.sid,
      orgId: verifiedToken.org_id || null
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
}

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  // Also check cookie
  const cookies = req.headers.cookie || '';
  const match = cookies.match(/__session=([^;]+)/);
  return match ? match[1] : null;
}

module.exports = { optionalAuth, requireAuth, getClerk };
