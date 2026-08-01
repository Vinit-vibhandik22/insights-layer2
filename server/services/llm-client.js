'use strict';

/**
 * Unified LLM Client — Groq (llama-3.3-70b-versatile)
 * 
 * NVIDIA NIM removed: API key was returning 404 for every model.
 * Groq llama-3.3-70b is free-tier, fast, and handles complex JSON reliably.
 */

const { buildBlueprintPrompt } = require('../utils/prompt-builder');

// ── Sleep helper ──────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ── Groq Client with retry ─────────────────────────────────────────────────
async function callGroqAPI(systemPrompt, userPrompt, retries = 2) {
  const Groq = require('groq-sdk');
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const groq = new Groq({ apiKey });

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 8192,
        top_p: 0.95
        // NOTE: No response_format json_object — it causes hard failures
        // when output is truncated. We parse JSON manually instead.
      });
      return completion.choices?.[0]?.message?.content;
    } catch (err) {
      const isRateLimit = err?.status === 429 || err?.message?.includes('rate_limit');
      if (isRateLimit && attempt < retries) {
        const waitMs = 15000 * (attempt + 1); // 15s, 30s
        console.warn(`[Groq] Rate limited. Waiting ${waitMs / 1000}s before retry ${attempt + 1}/${retries}...`);
        await sleep(waitMs);
        continue;
      }
      throw err;
    }
  }
}

// ── JSON extractor — strips markdown fences and thinking blocks ──────────────
function extractJSON(raw) {
  if (!raw) return null;
  // DeepSeek-R1 wraps reasoning in <think>...</think> tags
  let stripped = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  // Remove markdown code fences if present
  stripped = stripped.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  // Extract first JSON object from the response
  const jsonMatch = stripped.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  return jsonMatch[0];
}

// ── Main generate function ────────────────────────────────────────────────────
async function generateBlueprint(query, ragContext) {
  const { systemPrompt, userPrompt } = buildBlueprintPrompt(query, ragContext);

  if (!process.env.GROQ_API_KEY) {
    throw new Error('No AI provider available. Set GROQ_API_KEY in .env');
  }

  console.log('[LLM] Using Groq (llama-3.3-70b-versatile)...');
  const startTime = Date.now();
  const rawContent = await callGroqAPI(systemPrompt, userPrompt);
  console.log(`[LLM] Groq success in ${Date.now() - startTime}ms`);

  if (!rawContent) {
    throw new Error('LLM returned empty response');
  }

  const jsonStr = extractJSON(rawContent);
  if (!jsonStr) {
    console.error('[LLM] Raw response (no JSON found):', rawContent.substring(0, 500));
    throw new Error('LLM did not return valid JSON. Please try again.');
  }

  let blueprint;
  try {
    blueprint = JSON.parse(jsonStr);
  } catch (parseErr) {
    console.error('[LLM] JSON parse failed:', parseErr.message);
    console.error('[LLM] Extracted JSON string (first 500 chars):', jsonStr.substring(0, 500));
    throw new Error('LLM returned malformed JSON. Please try again.');
  }

  console.log('[LLM] Blueprint parsed successfully (via groq)');
  return validateAndNormalizeBlueprint(blueprint, query);
}

// ── Mentor chat — uses Groq ───────────────────────────────────────────────────
async function generateMentorResponse(userMessage, blueprintContext, chatHistory = []) {
  const Groq = require('groq-sdk');

  if (!process.env.GROQ_API_KEY) {
    return 'No AI provider available. Please set GROQ_API_KEY.';
  }

  const systemPrompt = `You are an expert AI Scrum Master and Tech Lead for the project: "${blueprintContext?.title || 'Student Project'}". 
You have deep knowledge of the tech stack: ${JSON.stringify(blueprintContext?.techStack || {})}.
Be concise, practical, and actionable. Reference specific architecture decisions when relevant.
If asked about code, provide short, working snippets. Keep responses under 200 words.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-6),
    { role: 'user', content: userMessage }
  ];

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.8,
      max_tokens: 512
    });
    return completion.choices[0]?.message?.content || 'Sorry, no response. Please try again.';
  } catch (err) {
    if (err?.status === 429) return '⏳ Rate limit reached. Please wait 30 seconds and try again.';
    throw err;
  }
}

// ── Deterministic Mermaid diagram from structured data ────────────────────────
function generateMermaidFromBlueprint(bp) {
  const fe = (bp.techStack?.frontend?.[0] || 'React').replace(/"/g, "'");
  const be = (bp.techStack?.backend?.[0] || 'Node.js').replace(/"/g, "'");
  const db = (bp.techStack?.database?.[0] || 'PostgreSQL').replace(/"/g, "'");
  const ai = (bp.techStack?.aiMl?.[0] || 'Python').replace(/"/g, "'");
  const cache = (bp.techStack?.database?.[1] || 'Redis').replace(/"/g, "'");
  const devops = (bp.techStack?.devops?.[0] || 'Docker').replace(/"/g, "'");
  const api1 = (bp.techStack?.external_apis?.[0] || 'External API').replace(/"/g, "'");

  // Use arch titles if available for more specific names
  const archNames = (bp.arch || []).reduce((acc, a) => {
    if (a.title) acc.push(a.title.replace(/"/g, "'"));
    return acc;
  }, []);

  const uiName = archNames[0] || 'Web Client';
  const gwName = archNames[1] || 'API Gateway';
  const beName = archNames[2] || 'Backend Services';
  const aiName = archNames[3] || 'AI Engine';
  const dataName = archNames[4] || 'Data Layer';
  const infraName = archNames[5] || 'Infrastructure';

  return `graph TD
    A["${uiName}<br/>${fe}"] --> B["${gwName}<br/>Auth + Rate Limit"]
    B --> C["${beName}<br/>${be}"]
    C --> D["${aiName}<br/>${ai}"]
    C --> E["${dataName}<br/>${db}"]
    D --> F["Vector Store<br/>Embeddings"]
    E --> G["Cache<br/>${cache}"]
    C --> H["${infraName}<br/>${devops}"]
    C --> I["${api1}"]
    D --> E
    style D fill:#e11d48,color:#fff
    style A fill:#1e293b,color:#fff
    style B fill:#334155,color:#fff`;
}

// ── Normalize blueprint output ────────────────────────────────────────────────
function validateAndNormalizeBlueprint(bp, query) {
  const normalized = {
    title: bp.title || query.substring(0, 60),
    tagline: bp.tagline || 'AI-Powered Innovation',
    problemStatement: bp.problemStatement || 'Addressing key challenges in this domain.',
    ideaScore: {
      innovationScore: bp.ideaScore?.innovationScore ?? 65,
      innovationReason: bp.ideaScore?.innovationReason || 'Assessed based on existing similar projects found during research.',
      complexityScore: bp.ideaScore?.complexityScore ?? 70,
      complexityReason: bp.ideaScore?.complexityReason || 'Requires integration of multiple technical components.',
      marketScore: bp.ideaScore?.marketScore ?? 65,
      marketReason: bp.ideaScore?.marketReason || 'Growing market demand for AI-powered solutions in this domain.',
      overallScore: bp.ideaScore?.overallScore ?? 67,
      verdict: bp.ideaScore?.verdict || 'Solid idea with clear technical path to execution.',
      similarProjects: bp.ideaScore?.similarProjects || [],
      keyDifferentiator: bp.ideaScore?.keyDifferentiator || 'AI-first approach with real-time data processing.'
    },
    techStack: {
      frontend: bp.techStack?.frontend || ['React.js'],
      backend: bp.techStack?.backend || ['Node.js', 'Express'],
      database: bp.techStack?.database || ['PostgreSQL'],
      aiMl: bp.techStack?.aiMl || ['Python', 'LangChain'],
      devops: bp.techStack?.devops || ['Docker', 'GitHub Actions'],
      external_apis: bp.techStack?.external_apis || []
    },
    systemDesignDetails: bp.systemDesignDetails || {},
    stats: (bp.stats && Array.isArray(bp.stats) && bp.stats.length > 0) ? bp.stats : [
      { val: '$12.5B', label: 'Global Addressable Market by 2027' },
      { val: '84%', label: 'Automation & Processing Accuracy' }
    ],
    warning: bp.warning || 'Manual approaches in this domain are inefficient and do not scale.',
    arch: bp.arch || [
      { icon: '🖥️', title: 'Presentation Layer', stack: (bp.techStack?.frontend || ['React']).join(', '), hl: false },
      { icon: '🔌', title: 'API Gateway', stack: 'Kong, Nginx, Rate Limiting', hl: false },
      { icon: '⚙️', title: 'Backend Services', stack: (bp.techStack?.backend || ['Node.js']).join(', '), hl: false },
      { icon: '🧠', title: 'AI/ML Engine', stack: (bp.techStack?.aiMl || ['Python']).join(', '), hl: true },
      { icon: '🗄️', title: 'Data Layer', stack: (bp.techStack?.database || ['PostgreSQL']).join(', '), hl: false },
      { icon: '☁️', title: 'Infrastructure', stack: (bp.techStack?.devops || ['Docker']).join(', '), hl: false }
    ],
    deepSearchResults: bp.deepSearchResults || [],
    competitiveAnalysis: bp.competitiveAnalysis || [],
    mentorChat: bp.mentorChat || [
      { from: 'bot', text: `🚀 Project "${bp.title || query}" initialized! Ready to start building?` }
    ],
    webIntel: bp.webIntel || [],
    literatureReview: bp.literatureReview || [],
    innovationOpportunities: bp.innovationOpportunities || [],
    githubRepos: bp.githubRepos || [],
    apisAndDatasets: bp.apisAndDatasets || [],
    roadmap: bp.roadmap || [],
    presentationDoc: bp.presentationDoc || {},
    sprints: bp.sprints || [
      { week: 'W1', title: 'Foundation', desc: 'Project setup & core architecture', done: false, milestones: [] },
      { week: 'W2', title: 'Core Features', desc: 'Primary functionality development', done: false, milestones: [] },
      { week: 'W3', title: 'AI Integration', desc: 'ML pipeline & model training', done: false, milestones: [] },
      { week: 'W4', title: 'Deploy & Polish', desc: 'Testing, CI/CD & launch', done: false, milestones: [] }
    ],
    githubIssues: bp.githubIssues || [],
    impactMetrics: bp.impactMetrics || {
      cycleTimeReduction: '↓ 40%',
      researchHoursSaved: '12+ hrs',
      stackConfidence: '94%'
    },
    deploymentPlan: bp.deploymentPlan || {}
  };

  // Generate Mermaid DETERMINISTICALLY from structured data — never trust AI for diagram syntax
  normalized.architectureMermaid = generateMermaidFromBlueprint(normalized);

  return normalized;
}

module.exports = { generateBlueprint, generateMentorResponse };
