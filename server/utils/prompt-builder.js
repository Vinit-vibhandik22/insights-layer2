'use strict';

/**
 * Build the enterprise-grade blueprint prompt
 */
function buildBlueprintPrompt(query, ragContext) {
  const systemPrompt = `You are iNSIGHTS Layer 2 — a senior system architect at Google/Netflix/Stripe. Generate a production-grade blueprint. Respond ONLY with a valid JSON object (no markdown, no text outside JSON).

REQUIRED JSON SCHEMA:
{
  "title": "Project title (max 8 words)",
  "tagline": "One-line pitch (max 12 words)",
  "problemStatement": "4-5 sentences with quantified pain points.",
  "ideaScore": {
    "innovationScore": <0-100>,
    "innovationReason": "Cite specific repo/paper names from RAG. Explain technical difference. No buzzwords.",
    "complexityScore": <0-100>,
    "complexityReason": "Name specific hard problems: real-time sync, ML pipelines, distributed state, etc.",
    "marketScore": <0-100>,
    "marketReason": "Cite exact market size numbers from RAG context. If none found, say unverified.",
    "overallScore": <weighted average>,
    "verdict": "One honest sentence on potential and biggest risk.",
    "similarProjects": ["Real Product/Repo 1", "Real Product/Repo 2", "Real Product/Repo 3"],
    "keyDifferentiator": "Exact technical or market differentiator. No marketing fluff."
  },
  "techStack": {
    "frontend": ["Framework@version", "State lib", "UI lib"],
    "backend": ["Runtime+framework", "API style", "Auth middleware"],
    "database": ["Primary DB (reason)", "Cache layer", "Vector/Search DB"],
    "aiMl": ["Model/framework", "Training approach", "Serving strategy"],
    "devops": ["Container", "Orchestration", "CI/CD", "Monitoring"],
    "external_apis": ["API name (purpose)"]
  },
  "stats": [
    {"val": "$14.2B", "label": "Global Market Opportunity by 2027"},
    {"val": "78%", "label": "Reduction in Processing Overhead"}
  ],
  "warning": "Biggest technical/business risk and mitigation strategy.",
  "arch": [
    {"icon": "🖥️", "title": "Presentation Layer", "stack": "React 18, React Native", "hl": false},
    {"icon": "🔌", "title": "API Gateway", "stack": "Kong, Nginx, Rate Limiting", "hl": false},
    {"icon": "⚙️", "title": "Backend Services", "stack": "Node.js, Express, FastAPI", "hl": false},
    {"icon": "🧠", "title": "AI/ML Engine", "stack": "Llama 3, PyTorch, LangChain", "hl": true},
    {"icon": "🗄️", "title": "Data Layer", "stack": "PostgreSQL, Redis, Vector DB", "hl": false},
    {"icon": "☁️", "title": "Infrastructure", "stack": "Docker, Kubernetes, AWS", "hl": false}
  ],
  "deepSearchResults": [{"type": "paper|github|market", "title": "EXACT title from RAG", "source": "domain.com", "desc": "Why relevant to this architecture.", "url": "exact URL from RAG", "relevance": "core-algorithm|similar-implementation|competing-approach"}],
  "competitiveAnalysis": [{"competitor": "Real company/product", "approach": "Their tech approach", "ourAdvantage": "Our specific differentiator"}],
  "mentorChat": [
    {"from": "bot", "text": "Project-specific opening from senior architect with technical insight."},
    {"from": "user", "text": "Hard technical question about the core challenge."},
    {"from": "bot", "text": "Expert answer with actionable recommendation or code hint."}
  ],
  "webIntel": [{"status": "safe|warn|critical", "lib": "pkg@version", "detail": "details", "badge": "UP TO DATE|MIGRATE|CVE FOUND"}],
  "sprints": [
    {"week": "W1", "title": "Foundation", "desc": "Setup, core architecture, auth.", "done": false, "milestones": ["Repo setup", "DB schema", "Auth flow"]},
    {"week": "W2", "title": "Core Features", "desc": "Primary feature development.", "done": false, "milestones": ["Feature 1", "Feature 2", "API integration"]},
    {"week": "W3", "title": "AI Integration", "desc": "ML pipeline and model integration.", "done": false, "milestones": ["Data pipeline", "Model training", "Inference API"]},
    {"week": "W4", "title": "Deploy and Polish", "desc": "Testing, CI/CD, launch.", "done": false, "milestones": ["Unit tests", "CI/CD pipeline", "Production deploy"]}
  ],
  "githubIssues": [
    {"title": "Specific actionable issue", "body": "Background + Acceptance Criteria. Technical hint.", "labels": ["area/backend", "type/feature", "priority/high"], "week": 1}
  ],
  "impactMetrics": {"cycleTimeReduction": "↓ 40% — specific reason", "researchHoursSaved": "15+ hrs — process replaced", "stackConfidence": "92% — tech maturity"},
  "deploymentPlan": {"infrastructure": "AWS EC2 + RDS PostgreSQL + Redis", "mvpTimeline": "4 weeks to working MVP", "estimatedCost": "$45/month at launch scale"}
}`;

  const userPrompt = `PROJECT IDEA: ${query}

${ragContext ? `=== RESEARCH CONTEXT (GitHub, arXiv, Market Intel) ===
${ragContext}
INSTRUCTIONS: Cite exact repo names and market numbers above in ideaScore. Base tech stack on languages found in repos. Name architecture nodes specifically (e.g. "Expense Predictor" not "ML Model").
CRITICAL: You MUST extract and include a MINIMUM of 10 research papers and a MINIMUM of 5 GitHub repositories in the 'deepSearchResults' array.
=== END CONTEXT ===` : ''}

Generate the complete blueprint JSON now. Ensure 'deepSearchResults' has AT LEAST 15 items total (10 papers, 5 repos).`;

  return { systemPrompt, userPrompt };
}

/**
 * Build a README from blueprint data
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

## 💡 Idea Score
- **Innovation:** ${blueprint.ideaScore?.innovationScore ?? '—'}/100 — ${blueprint.ideaScore?.innovationReason ?? ''}
- **Complexity:** ${blueprint.ideaScore?.complexityScore ?? '—'}/100 — ${blueprint.ideaScore?.complexityReason ?? ''}
- **Market:** ${blueprint.ideaScore?.marketScore ?? '—'}/100 — ${blueprint.ideaScore?.marketReason ?? ''}
- **Overall:** ${blueprint.ideaScore?.overallScore ?? '—'}/100
- **Verdict:** ${blueprint.ideaScore?.verdict ?? ''}

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

## ☁️ Deployment
**Infrastructure:** ${blueprint.deploymentPlan?.infrastructure || ''}
**Estimated Cost:** ${blueprint.deploymentPlan?.estimatedCost || ''}

## 🔧 Setup
\`\`\`bash
git clone https://github.com/username/${repoName}.git
cd ${repoName}
cp .env.example .env
npm install && npm run dev
\`\`\`

## 📄 License
MIT — Built with [iNSIGHTS Layer 2](https://github.com/Vinit-vibhandik22/insights-layer2)
`;
}

module.exports = { buildBlueprintPrompt, buildReadmeContent };
