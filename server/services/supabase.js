'use strict';

const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

let supabaseClient = null;
let supabaseAdminClient = null;

// ── Client for anonymous/user operations (respects RLS) ───────────────────
function getSupabase() {
  if (!supabaseClient) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY — persistence disabled');
      return null;
    }
    supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      { auth: { persistSession: false }, realtime: { transport: WebSocket } }
    );
  }
  return supabaseClient;
}

// ── Admin client (bypasses RLS — server-side only) ────────────────────────
function getSupabaseAdmin() {
  if (!supabaseAdminClient) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('[Supabase] Missing service role key — admin operations disabled');
      return null;
    }
    supabaseAdminClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false }, realtime: { transport: WebSocket } }
    );
  }
  return supabaseAdminClient;
}

// ── Save a generated blueprint ────────────────────────────────────────────
async function saveBlueprint({ query, blueprint, ragContext, sessionId }) {
  const db = getSupabaseAdmin();
  if (!db) return null;

  try {
    const { data, error } = await db
      .from('blueprints')
      .insert({
        session_id: sessionId || null,
        query: query.substring(0, 500),
        blueprint: blueprint,
        rag_context: ragContext || null,
        mermaid_code: blueprint.architectureMermaid || null,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Supabase] Save blueprint error:', error.message);
      return null;
    }

    console.log(`[Supabase] Blueprint saved: ${data.id}`);
    return data.id;
  } catch (err) {
    console.error('[Supabase] Save blueprint failed:', err.message);
    return null;
  }
}

// ── Update blueprint with GitHub repo URL after provisioning ──────────────
async function updateBlueprintWithRepo(blueprintId, repoUrl) {
  const db = getSupabaseAdmin();
  if (!db || !blueprintId) return;

  try {
    const { error } = await db
      .from('blueprints')
      .update({
        github_repo_url: repoUrl,
        github_provisioned_at: new Date().toISOString()
      })
      .eq('id', blueprintId);

    if (error) console.error('[Supabase] Update repo URL error:', error.message);
    else console.log(`[Supabase] Blueprint ${blueprintId} updated with repo: ${repoUrl}`);
  } catch (err) {
    console.error('[Supabase] Update repo failed:', err.message);
  }
}

// ── Save mentor chat message ───────────────────────────────────────────────
async function saveChatMessage({ blueprintId, sessionId, role, content }) {
  const db = getSupabaseAdmin();
  if (!db) return;

  try {
    const { error } = await db
      .from('mentor_chats')
      .insert({
        blueprint_id: blueprintId || null,
        session_id: sessionId || null,
        role,
        content: content.substring(0, 5000),
        created_at: new Date().toISOString()
      });

    if (error) console.error('[Supabase] Save chat error:', error.message);
  } catch (err) {
    console.error('[Supabase] Save chat failed:', err.message);
  }
}

// ── Get recent blueprints (for a session) ────────────────────────────────
async function getRecentBlueprints(sessionId, limit = 10) {
  const db = getSupabaseAdmin();
  if (!db) return [];

  try {
    const { data, error } = await db
      .from('blueprints')
      .select('id, query, blueprint->title, created_at, github_repo_url')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return data || [];
  } catch (err) {
    return [];
  }
}

// ── Get a single blueprint by ID ──────────────────────────────────────────
async function getBlueprintById(id) {
  const db = getSupabaseAdmin();
  if (!db) return null;

  try {
    const { data, error } = await db
      .from('blueprints')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  } catch (err) {
    return null;
  }
}

// ── Health check for Supabase connection ──────────────────────────────────
async function checkConnection() {
  const db = getSupabaseAdmin();
  if (!db) return false;

  try {
    const { error } = await db.from('blueprints').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

module.exports = {
  getSupabase,
  getSupabaseAdmin,
  saveBlueprint,
  updateBlueprintWithRepo,
  saveChatMessage,
  getRecentBlueprints,
  getBlueprintById,
  checkConnection
};
