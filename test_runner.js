'use strict';

// Updated test runner — validates all fixes applied
const fs = require('fs');

const results = [];
function pass(name, msg) { results.push({ status: 'PASS', name, msg }); console.log(`[PASS] ${name}${msg ? ': ' + msg : ''}`); }
function fail(name, msg) { results.push({ status: 'FAIL', name, msg }); console.log(`[FAIL] ${name}: ${msg}`); }
function info(name, msg) { results.push({ status: 'INFO', name, msg }); console.log(`[INFO] ${name}: ${msg}`); }

// ─── 1. groq-client.js is deprecated (dead code removed) ─────────────────
try {
  if (!fs.existsSync('./server/services/groq-client.js')) {
    pass('groq-client.js removed', 'Dead code file deprecated/removed');
  } else {
    fail('groq-client.js still exists', 'Dead code file should be removed');
  }
} catch(e) { fail('groq-client check', e.message); }

// ─── 2. mentor-chat uses llm-client (not groq-client) ────────────────────
try {
  const mentorSrc = fs.readFileSync('./server/routes/mentor-chat.js', 'utf8');
  if (mentorSrc.includes("require('../services/llm-client')")) {
    pass('mentor-chat uses llm-client (llama-3.3-70b)', '');
  } else {
    fail('mentor-chat import', 'Should import from llm-client.js');
  }
  if (mentorSrc.includes("require('../services/groq-client')")) {
    fail('mentor-chat still uses groq-client', 'Dead code import remains');
  }
} catch(e) { fail('mentor-chat import check', e.message); }

// ─── 3. express.json body size limit fixed ────────────────────────────────
try {
  const indexSrc = fs.readFileSync('./server/index.js', 'utf8');
  if (indexSrc.includes("express.json({ limit: '10kb' })")) {
    fail('body size limit', 'Still using 10kb — too small for provision-repo payloads');
  } else if (indexSrc.includes("express.json({ limit: '500kb' })")) {
    pass('body size limit fixed to 500kb', '');
  } else {
    fail('body size limit', 'Cannot find expected 500kb limit');
  }
} catch(e) { fail('body size check', e.message); }

// ─── 4. mentor-chat rate limiter added ────────────────────────────────────
try {
  const indexSrc = fs.readFileSync('./server/index.js', 'utf8');
  const hasChatLimiter = indexSrc.includes('chatLimiter');
  const mentorRouteHasLimiter = indexSrc.includes("chatLimiter, require('./routes/mentor-chat')");
  if (hasChatLimiter && mentorRouteHasLimiter) {
    pass('mentor-chat rate limiter added', 'chatLimiter applied to /api/mentor-chat');
  } else {
    fail('mentor-chat rate limiter', `chatLimiter defined: ${hasChatLimiter}, applied: ${mentorRouteHasLimiter}`);
  }
} catch(e) { fail('rate limiter check', e.message); }

// ─── 5. provision-repo null guards fixed ─────────────────────────────────
try {
  const provSrc = fs.readFileSync('./server/routes/provision-repo.js', 'utf8');
  const issuesFix = provSrc.includes('(results.issues || []).length');
  const milestonesFix = provSrc.includes('(results.milestones || []).length');
  const errorsFix = provSrc.includes('results.errors || []');
  if (issuesFix && milestonesFix && errorsFix) {
    pass('provision-repo null guards', 'issues, milestones, errors all have || [] guards');
  } else {
    fail('provision-repo null guards', `issues: ${issuesFix}, milestones: ${milestonesFix}, errors: ${errorsFix}`);
  }
} catch(e) { fail('provision-repo null check', e.message); }

// ─── 6. CORS production fallback fixed ────────────────────────────────────
try {
  const indexSrc = fs.readFileSync('./server/index.js', 'utf8');
  if (indexSrc.includes('process.env.ALLOWED_ORIGIN || false')) {
    pass('CORS production fallback fixed', 'Defaults to false (block all) when ALLOWED_ORIGIN unset');
  } else {
    fail('CORS production fallback', 'Still missing || false safety guard');
  }
} catch(e) { fail('CORS check', e.message); }

// ─── 7. Server log model name accurate ────────────────────────────────────
try {
  const indexSrc = fs.readFileSync('./server/index.js', 'utf8');
  if (indexSrc.includes('Llama 3.3 70B') && !indexSrc.includes('8B blueprint')) {
    fail('Model name in server log', 'Still says "Llama 3.3 70B" — inaccurate for blueprint model');
  } else if (indexSrc.includes('8B blueprint') || indexSrc.includes('8B blueprint / 70B chat')) {
    pass('Server log model name corrected', '');
  } else {
    info('Server log model name', 'Could not determine — check manually');
  }
} catch(e) { fail('model name check', e.message); }

// ─── 8. UUID regex strict ──────────────────────────────────────────────────
try {
  const wsSrc = fs.readFileSync('./server/routes/workspaces.js', 'utf8');
  if (wsSrc.includes('/^[0-9a-f-]{36}$/i')) {
    fail('UUID regex', 'Still using loose regex — allows all-dash strings');
  } else if (wsSrc.includes('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i')) {
    pass('UUID regex strict UUID v4 pattern', '');
  } else {
    fail('UUID regex', 'Could not find expected UUID v4 regex');
  }
} catch(e) { fail('UUID check', e.message); }

// ─── 9. .env.example has ALLOWED_ORIGIN ───────────────────────────────────
try {
  const envSrc = fs.readFileSync('./.env.example', 'utf8');
  if (envSrc.includes('ALLOWED_ORIGIN')) {
    pass('.env.example has ALLOWED_ORIGIN', '');
  } else {
    fail('.env.example missing ALLOWED_ORIGIN', 'Deployers have no reminder to set it');
  }
} catch(e) { fail('.env.example check', e.message); }

// ─── 10. Module loading and critical imports ───────────────────────────────
try {
  const llm = require('./server/services/llm-client');
  pass('llm-client module loads', Object.keys(llm).join(', '));
} catch(e) { fail('llm-client module loads', e.message); }

try {
  const rag = require('./server/services/rag');
  pass('rag module loads', Object.keys(rag).join(', '));
} catch(e) { fail('rag module loads', e.message); }

try {
  const supa = require('./server/services/supabase');
  pass('supabase module loads', Object.keys(supa).join(', '));
} catch(e) { fail('supabase module loads', e.message); }

try {
  const github = require('./server/services/github');
  pass('github module loads', Object.keys(github).join(', '));
} catch(e) { fail('github module loads', e.message); }

// ─── 11. No route references groq-client ─────────────────────────────────
try {
  const routeFiles = [
    './server/routes/generate-blueprint.js',
    './server/routes/mentor-chat.js',
    './server/routes/provision-repo.js',
    './server/routes/workspaces.js',
    './server/routes/health.js'
  ];
  const routesWithGroqImport = routeFiles.filter(f => {
    const src = fs.readFileSync(f, 'utf8');
    return src.includes("require('../services/groq-client')");
  });
  if (routesWithGroqImport.length === 0) {
    pass('No routes import groq-client', 'Dead code fully decoupled');
  } else {
    fail('Routes still import groq-client', routesWithGroqImport.join(', '));
  }
} catch(e) { fail('groq-client import check', e.message); }

// ─── Summary ──────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log('VERIFICATION SUMMARY (POST-FIX)');
console.log('═'.repeat(60));
const passes = results.filter(r => r.status === 'PASS').length;
const fails = results.filter(r => r.status === 'FAIL').length;
const infos = results.filter(r => r.status === 'INFO').length;
console.log(`PASS: ${passes} | FAIL: ${fails} | INFO: ${infos}`);
if (fails > 0) {
  console.log('\nREMAINING FAILURES:');
  results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  ❌ ${r.name}: ${r.msg}`));
} else {
  console.log('\n✅ All checks passed!');
}
if (infos > 0) {
  console.log('\nINFO:');
  results.filter(r => r.status === 'INFO').forEach(r => console.log(`  ℹ️  ${r.name}: ${r.msg}`));
}
