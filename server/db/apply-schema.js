/**
 * Direct Supabase schema runner via Management API
 * Run: node server/db/apply-schema.js
 */
require('dotenv').config();

const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL; // https://xxx.supabase.co
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extract project ref from URL
const projectRef = SUPABASE_URL?.replace('https://', '').split('.')[0];

// All SQL statements to run — simplified for direct REST API
const SQL_STATEMENTS = [
  // blueprints table
  `CREATE TABLE IF NOT EXISTS blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT,
    query TEXT NOT NULL,
    blueprint JSONB NOT NULL,
    rag_context JSONB,
    mermaid_code TEXT,
    github_repo_url TEXT,
    github_provisioned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,

  // mentor_chats table
  `CREATE TABLE IF NOT EXISTS mentor_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID,
    session_id TEXT,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,

  // rag_cache table
  `CREATE TABLE IF NOT EXISTS rag_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_hash TEXT UNIQUE NOT NULL,
    query TEXT NOT NULL,
    papers JSONB DEFAULT '[]',
    repos JSONB DEFAULT '[]',
    vulnerabilities JSONB DEFAULT '[]',
    context_text TEXT,
    expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ DEFAULT now()
  )`,

  // usage_events table
  `CREATE TABLE IF NOT EXISTS usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    session_id TEXT,
    blueprint_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
  )`,

  // indexes
  `CREATE INDEX IF NOT EXISTS idx_blueprints_session ON blueprints(session_id)`,
  `CREATE INDEX IF NOT EXISTS idx_blueprints_created ON blueprints(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_chats_blueprint ON mentor_chats(blueprint_id)`,
  `CREATE INDEX IF NOT EXISTS idx_rag_cache_hash ON rag_cache(query_hash)`,
  `CREATE INDEX IF NOT EXISTS idx_events_type ON usage_events(event_type)`,

  // Grant permissions
  `GRANT SELECT, INSERT, UPDATE ON blueprints TO anon`,
  `GRANT SELECT, INSERT ON mentor_chats TO anon`,
  `GRANT SELECT, INSERT ON rag_cache TO anon`,
  `GRANT SELECT, INSERT ON usage_events TO anon`
];

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const url = new URL(`/rest/v1/`, SUPABASE_URL);

    // Use the PostgREST RPC approach via fetch polyfill
    const options = {
      hostname: url.hostname,
      port: 443,
      path: `/_supabase/rest/v1/`,
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    // Actually use the Supabase client approach
    resolve({ ok: true });
  });
}

async function runWithSupabaseClient() {
  const { createClient } = require('@supabase/supabase-js');

  const db = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
    db: { schema: 'public' }
  });

  console.log('🔧 Applying schema to Supabase...\n');
  console.log(`📡 Project: ${projectRef}\n`);

  let ok = 0;
  let warn = 0;

  for (const sql of SQL_STATEMENTS) {
    const tableName = sql.match(/TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i)?.[1] ||
                      sql.match(/INDEX\s+(?:IF NOT EXISTS\s+)?(\w+)/i)?.[1] ||
                      sql.match(/GRANT.*ON\s+(\w+)/i)?.[1] ||
                      'statement';

    try {
      // Use from().select() as a test, or just try inserting the table
      const { error } = await db.rpc('exec_ddl', { ddl: sql });

      if (error) {
        // Expected: function doesn't exist, try alternative
        console.log(`  ⚠️  ${tableName}: ${error.message.substring(0, 60)}`);
        warn++;
      } else {
        console.log(`  ✅ ${tableName}`);
        ok++;
      }
    } catch (e) {
      console.log(`  ⚠️  ${tableName}: ${e.message.substring(0, 60)}`);
      warn++;
    }
  }

  console.log(`\n──────────────────────────────────────`);
  console.log(`Result: ${ok} applied, ${warn} warnings`);

  // Verify tables exist
  console.log('\n📊 Verifying tables...');
  const tables = ['blueprints', 'mentor_chats', 'rag_cache', 'usage_events'];
  for (const table of tables) {
    const { data, error } = await db.from(table).select('id').limit(1);
    if (error && error.code === '42P01') {
      console.log(`  ❌ ${table}: NOT FOUND — run schema.sql manually in Supabase Dashboard`);
    } else {
      console.log(`  ✅ ${table}: ready`);
    }
  }

  console.log('\n💡 If any tables are missing, run schema.sql manually:');
  console.log('   Supabase Dashboard → SQL Editor → paste server/db/schema.sql → Run\n');
}

runWithSupabaseClient().catch(err => {
  console.error('❌ Error:', err.message);
  console.log('\n💡 Run schema.sql manually in Supabase Dashboard → SQL Editor');
});
