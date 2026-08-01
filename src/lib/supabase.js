import { createClient } from '@supabase/supabase-js';

let supabaseAdminClient = null;

function getSupabaseAdmin() {
  if (!supabaseAdminClient) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
    supabaseAdminClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
  }
  return supabaseAdminClient;
}

export async function saveBlueprint({ query, blueprint, ragContext, sessionId }) {
  const db = getSupabaseAdmin();
  if (!db) return null;
  try {
    const { data, error } = await db.from('blueprints').insert({
      session_id: sessionId || null,
      query: query.substring(0, 500),
      blueprint,
      rag_context: ragContext || null,
      mermaid_code: blueprint.architectureMermaid || null,
      created_at: new Date().toISOString()
    }).select('id').single();
    if (error) return null;
    return data.id;
  } catch { return null; }
}

export async function updateBlueprintWithRepo(blueprintId, repoUrl) {
  const db = getSupabaseAdmin();
  if (!db || !blueprintId) return;
  await db.from('blueprints').update({ github_repo_url: repoUrl, github_provisioned_at: new Date().toISOString() }).eq('id', blueprintId);
}

export async function saveChatMessage({ blueprintId, sessionId, role, content }) {
  const db = getSupabaseAdmin();
  if (!db) return;
  await db.from('mentor_chats').insert({ blueprint_id: blueprintId || null, session_id: sessionId || null, role, content: content.substring(0, 5000), created_at: new Date().toISOString() });
}

export async function getRecentBlueprints(sessionId, limit = 10) {
  const db = getSupabaseAdmin();
  if (!db) return [];
  const { data } = await db.from('blueprints').select('id, query, created_at, github_repo_url').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(limit);
  return data || [];
}

export async function getBlueprintById(id) {
  const db = getSupabaseAdmin();
  if (!db) return null;
  const { data } = await db.from('blueprints').select('*').eq('id', id).single();
  return data;
}

export async function checkConnection() {
  const db = getSupabaseAdmin();
  if (!db) return false;
  const { error } = await db.from('blueprints').select('id').limit(1);
  return !error;
}
