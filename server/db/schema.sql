-- ════════════════════════════════════════════════════════════════
-- iNSIGHTS Layer 2 — Supabase Database Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════════════

-- ── Enable UUID extension ─────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Blueprints Table ──────────────────────────────────────────────────────
-- Stores every AI-generated project blueprint
CREATE TABLE IF NOT EXISTS blueprints (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    TEXT,                        -- Browser session ID (no auth needed)
  query         TEXT NOT NULL,               -- Original user prompt
  blueprint     JSONB NOT NULL,              -- Full LLM output JSON
  rag_context   JSONB,                       -- Raw RAG pipeline results (papers, repos, vulns)
  mermaid_code  TEXT,                        -- Extracted Mermaid diagram code for quick render
  github_repo_url TEXT,                      -- NULL until provisioned via GitHub API
  github_provisioned_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_blueprints_session ON blueprints(session_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_created ON blueprints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blueprints_query ON blueprints USING GIN (to_tsvector('english', query));

-- ── Mentor Chat History Table ─────────────────────────────────────────────
-- Stores all AI Mentor conversation messages
CREATE TABLE IF NOT EXISTS mentor_chats (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id  UUID REFERENCES blueprints(id) ON DELETE CASCADE,
  session_id    TEXT,
  role          TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chats_blueprint ON mentor_chats(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_chats_session ON mentor_chats(session_id);

-- ── RAG Cache Table ───────────────────────────────────────────────────────
-- Caches RAG results for identical/similar queries (reduces API costs)
CREATE TABLE IF NOT EXISTS rag_cache (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash    TEXT UNIQUE NOT NULL,        -- MD5 of normalized query
  query         TEXT NOT NULL,
  papers        JSONB DEFAULT '[]',
  repos         JSONB DEFAULT '[]',
  vulnerabilities JSONB DEFAULT '[]',
  context_text  TEXT,
  expires_at    TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours'),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rag_cache_hash ON rag_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_rag_cache_expires ON rag_cache(expires_at);

-- ── Analytics / Usage Table ───────────────────────────────────────────────
-- Tracks usage patterns (no PII)
CREATE TABLE IF NOT EXISTS usage_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    TEXT NOT NULL,               -- 'blueprint_generated', 'repo_provisioned', 'chat_sent'
  session_id    TEXT,
  blueprint_id  UUID,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_type ON usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON usage_events(created_at DESC);

-- ════════════════════════════════════════════════════════════════
-- Row Level Security (optional — disabled for MVP/hackathon speed)
-- Enable later for multi-user production deployment
-- ════════════════════════════════════════════════════════════════

-- ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mentor_chats ENABLE ROW LEVEL SECURITY;

-- ── Useful Views ──────────────────────────────────────────────────────────

-- Recent blueprints summary
CREATE OR REPLACE VIEW blueprint_summary AS
SELECT
  id,
  session_id,
  query,
  blueprint->>'title' AS title,
  blueprint->>'tagline' AS tagline,
  mermaid_code IS NOT NULL AS has_diagram,
  github_repo_url IS NOT NULL AS is_provisioned,
  github_repo_url,
  created_at
FROM blueprints
ORDER BY created_at DESC;

-- Usage stats
CREATE OR REPLACE VIEW usage_stats AS
SELECT
  event_type,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE created_at > now() - INTERVAL '24 hours') AS last_24h,
  COUNT(*) FILTER (WHERE created_at > now() - INTERVAL '7 days') AS last_7d
FROM usage_events
GROUP BY event_type;

-- ── Grant permissions to anon role ───────────────────────────────────────
GRANT SELECT, INSERT ON blueprints TO anon;
GRANT SELECT, INSERT ON mentor_chats TO anon;
GRANT SELECT ON blueprint_summary TO anon;
GRANT SELECT ON usage_stats TO anon;

-- ── Done ─────────────────────────────────────────────────────────────────
SELECT 'iNSIGHTS Layer 2 schema created successfully' AS status;
