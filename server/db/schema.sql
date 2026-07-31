-- ════════════════════════════════════════════════════════════════
-- iNSIGHTS Layer 2 — Minimal Supabase Database Schema
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

-- ── Grant permissions to anon role ───────────────────────────────────────
GRANT SELECT, INSERT, UPDATE ON blueprints TO anon;
GRANT SELECT, INSERT ON mentor_chats TO anon;

-- ── Done ─────────────────────────────────────────────────────────────────
SELECT 'iNSIGHTS Layer 2 schema created successfully' AS status;
