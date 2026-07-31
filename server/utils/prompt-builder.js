'use strict';

/**
 * Build the enterprise-grade blueprint prompt
 * Demands deep system architecture, real research grounding, and production-level detail
 */
function buildBlueprintPrompt(query, ragContext) {
  const systemPrompt = `You are iNSIGHTS Layer 2 — a senior system architect and AI research lead with 15+ years of experience designing production enterprise systems.

Your task: Given a project idea and real research context, produce a DEEPLY DETAILED, production-grade technical blueprint that reads like it was authored by a senior architect at Google, Netflix, or Stripe.

You MUST respond with a single valid JSON object. No markdown, no preamble, no explanation outside the JSON.
Every field must be substantive, specific, and technically accurate. Vague answers are UNACCEPTABLE.

REQUIRED JSON SCHEMA (all fields mandatory):

{
  "title": "Specific project title (max 8 words) — NOT generic",
  "tagline": "Bold, specific, technical tagline (max 12 words)",
  "problemStatement": "4-5 sentence detailed problem description. Include quantified pain points, who is affected, current broken approaches, and the opportunity space.",

  "techStack": {
    "frontend": ["Framework@version", "Library", "UI Kit"],
    "backend": ["Runtime + Framework", "Language", "Key library"],
    "database": ["Primary DB (explain why)", "Cache layer", "Search layer"],
    "aiMl": ["Model or Framework", "Training approach", "Inference tool"],
    "devops": ["Container", "Orchestration", "CI/CD", "Monitoring"],
    "external_apis": ["Third-party service 1", "Third-party service 2"]
  },

  "architectureMermaid": "DETAILED Mermaid flowchart. MUST have 10+ nodes. Must show: user layer → API gateway → microservices → AI pipeline → databases → external services. Use subgraphs for logical grouping. ALL node text in double quotes.",

  "systemDesignDetails": {
    "scalability": "How the system scales to 100k+ users — specific techniques (sharding, horizontal scaling, CDN, caching layers)",
    "dataFlow": "Step-by-step data flow from user action to AI response and back to user",
    "apiDesign": "REST vs GraphQL decision + key API endpoints (at least 5 specific endpoints with methods)",
    "security": "Authentication flow, authorization model (RBAC/ABAC), data encryption at rest & transit, rate limiting strategy",
    "mlPipeline": "Training data sources, feature engineering approach, model serving strategy (batch vs real-time), monitoring for drift"
  },

  "stats": [
    {"val": "quantified number or %", "label": "specific impactful label from real research"}
  ],
  "warning": "2-3 sentences on the single biggest technical or business risk, and how the architecture mitigates it.",

  "arch": [
    {"icon": "emoji", "title": "Layer Name", "stack": "Specific tech, version", "hl": false}
  ],

  "deepSearchResults": [
    {
      "type": "paper | github | market",
      "title": "EXACT title from RAG context — do not invent",
      "source": "arxiv.org | IEEE | GitHub | semanticscholar.org | etc",
      "desc": "2-3 sentence explanation of WHY this paper/repo is directly relevant to the architecture decisions being made",
      "url": "exact URL from RAG context",
      "relevance": "core-algorithm | similar-implementation | competing-approach | dataset-source"
    }
  ],

  "competitiveAnalysis": [
    {
      "competitor": "Real product/startup name",
      "approach": "What they do and their tech approach",
      "ourAdvantage": "Specific technical differentiator in our system"
    }
  ],

  "mentorChat": [
    {"from": "bot", "text": "Detailed opening message from senior architect mentor about this specific project"},
    {"from": "user", "text": "Specific technical question a junior dev would ask"},
    {"from": "bot", "text": "Expert technical answer with code examples or specific recommendations"}
  ],

  "webIntel": [
    {"status": "safe | warn | critical", "lib": "packageName@exactVersion", "detail": "precise status", "badge": "UP TO DATE | MIGRATE | CVE FOUND"}
  ],

  "sprints": [
    {
      "week": "W1",
      "title": "Specific Sprint Theme",
      "desc": "Detailed description of what is being built — minimum 2-3 sentences describing the deliverables, not just a label",
      "done": false,
      "milestones": ["Specific milestone 1", "Specific milestone 2", "Specific milestone 3"]
    }
  ],

  "githubIssues": [
    {
      "title": "Specific, actionable GitHub issue title",
      "body": "Detailed issue body: background, acceptance criteria, technical approach hint. At least 3-4 sentences.",
      "labels": ["area/backend", "type/feature", "priority/high"],
      "week": 1
    }
  ],

  "impactMetrics": {
    "cycleTimeReduction": "↓ X% with specific reasoning",
    "researchHoursSaved": "Xhrs — explain what manual process is replaced",
    "stackConfidence": "X% — based on maturity of chosen technologies"
  },

  "deploymentPlan": {
    "infrastructure": "Cloud provider + specific services (e.g., AWS EC2 + RDS + ElastiCache + SageMaker)",
    "mvpTimeline": "Realistic week-by-week breakdown to working MVP",
    "estimatedCost": "Approximate monthly cloud cost at launch scale"
  }
}

CRITICAL MERMAID RULES — VIOLATION = INVALID OUTPUT:
1. Start with exactly: graph TD
2. Every node label MUST be wrapped in double quotes: A["Label Text"]
3. No unescaped special characters (&, <, >, (, )) inside node text — use words instead
4. Use subgraph blocks: subgraph "Group Name"\\n  ...\\nend
5. Include style directives to highlight AI components: style NodeId fill:#e11d48,color:#fff
6. Minimum 10 nodes required. Maximum 20 nodes.

DEPTH RULES:
- deepSearchResults: Use ONLY real items from the RAG context. Minimum 6 entries.
- competitiveAnalysis: 3 real competing products/startups.
- githubIssues: 16 total (4 per week), each with real acceptance criteria.
- sprints: Exactly 4 items (W1-W4), each with 3 specific milestones.
- systemDesignDetails: Every sub-field must be 3+ sentences of specific technical detail.`;

  const userPrompt = `PROJECT IDEA: ${query}

${ragContext ? `=== DEEP RESEARCH INTELLIGENCE (from live scan of arXiv, IEEE, Semantic Scholar, GitHub) ===
${ragContext}

INSTRUCTIONS:
1. Use deepSearchResults ONLY from the above RAG context — cite real titles and URLs.
2. Base your techStack decisions on what the most-starred GitHub repos in the context are using.
3. Reference real paper findings in your systemDesignDetails.mlPipeline field.
4. Your architectureMermaid must be significantly more complex than a 3-box diagram — model it after enterprise microservices architecture.
=== END RESEARCH CONTEXT ===` : ''}

NOW generate the complete enterprise-grade project blueprint JSON. This blueprint will be shown to hackathon judges and potential investors — make it deeply impressive.`;

  return { systemPrompt, userPrompt };
}

/**
 * Build a README template from blueprint data
 */
function buildReadmeContent(blueprint, repoName) {
  const techList = [
    ...(blueprint.techStack?.frontend || []),
    ...(blueprint.techStack?.backend || []),
    ...(blueprint.techStack?.database || []),
    ...(blueprint.techStack?.aiMl || [])
  ].join(' • ');

  const sprintMd = (blueprint.sprints || []).map(s => {
    const milestones = (s.milestones || []).map(m => `  - ${m}`).join('\n');
    return `### ${s.week}: ${s.title}\n${s.desc}\n${milestones}`;
  }).join('\n\n');

  return `# ${blueprint.title}

> ${blueprint.tagline}

## 🎯 Problem Statement

${blueprint.problemStatement}

## 🚀 Tech Stack

${techList}

## 🏗️ Architecture

\`\`\`mermaid
${blueprint.architectureMermaid}
\`\`\`

### System Design

**Scalability:** ${blueprint.systemDesignDetails?.scalability || ''}

**Data Flow:** ${blueprint.systemDesignDetails?.dataFlow || ''}

**Security:** ${blueprint.systemDesignDetails?.security || ''}

## 📅 Sprint Plan

${sprintMd}

## 🔧 Setup

\`\`\`bash
git clone https://github.com/username/${repoName}.git
cd ${repoName}
cp .env.example .env
# Add your API keys to .env
npm install
npm run dev
\`\`\`

## ☁️ Deployment

**Infrastructure:** ${blueprint.deploymentPlan?.infrastructure || ''}

**Estimated Cost:** ${blueprint.deploymentPlan?.estimatedCost || ''}

## 📄 License

MIT License — Built with [iNSIGHTS Layer 2](https://github.com/Vinit-vibhandik22/insights-layer2)

---
*Generated by iNSIGHTS Layer 2 AI Copilot*
`;
}

module.exports = { buildBlueprintPrompt, buildReadmeContent };
