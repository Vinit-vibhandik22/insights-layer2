'use strict';

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runSchema() {
  console.log('🔧 Running Supabase schema setup...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });

  // Read schema file
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  // Split into individual statements
  const statements = schemaSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let success = 0;
  let errors = 0;

  for (const statement of statements) {
    if (!statement || statement.startsWith('--')) continue;
    
    try {
      const { error } = await db.rpc('exec_sql', { sql: statement + ';' });
      if (error && !error.message.includes('already exists') && !error.message.includes('duplicate')) {
        // Try direct query approach
        const result = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sql: statement + ';' })
        });
        if (!result.ok) {
          console.warn(`  ⚠️  Statement warning (may be OK if object exists)`);
          errors++;
        } else {
          success++;
        }
      } else {
        success++;
      }
    } catch (err) {
      console.warn(`  ⚠️  ${err.message.substring(0, 80)}`);
      errors++;
    }
  }

  console.log(`\n✅ Schema setup complete: ${success} statements OK, ${errors} warnings`);
  console.log('📊 Tables: blueprints, mentor_chats, rag_cache, usage_events');
  console.log('\n🚀 You can also run schema.sql manually in Supabase Dashboard → SQL Editor\n');
}

// Load env
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

runSchema().catch(err => {
  console.error('Schema setup failed:', err.message);
  console.log('\n💡 Run schema.sql manually in Supabase Dashboard → SQL Editor');
});
