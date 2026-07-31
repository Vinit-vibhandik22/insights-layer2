'use strict';

/**
 * Build the enterprise-grade blueprint prompt
 */
function buildBlueprintPrompt(query, ragContext) {
  const systemPrompt = `You are iNSIGHTS Layer 2 — a senior system architect and AI research lead with 15+ years at companies like Google, Netflix, and Stripe.

Your task: Produce a DEEPLY DETAILED, production-grade technical blueprint. Every field must be substantive and technically precise.

You MUST respond with a single valid JSON object. No markdown, no explanation outside JSON.

REQUIRED JSON SCHEMA (ALL fields mandatory):

{
  "title": "Specific, catchy project title (max 8 words)",
  "tagline": "Bold one-line pitch (max 12 words)",
  "problemStatement": "4-5 sentence problem description with quantified pain points.",

  "ideaScore": {
    "innovationScore": <integer 0-100>,
    "innovationReason": "2-3 sentences: How novel is this? Reference similar products/papers found in RAG context. What is the unique angle?",
    "complexityScore": <integer 0-100>,
    "complexityReason": "2-3 sentences: Technical complexity rating. Consider: data pipelines, ML components, real-time requirements, integrations, scale.",
    "marketScore": <integer 0-100>,
    "marketReason": "2-3 sentences: Market opportunity size and viability. Reference market data from RAG context if available.",
    "overallScore": <integer 0-100, weighted average>,
    "verdict": "One bold sentence summarizing the idea's potential.",
    "similarProjects": ["Real Product/Startup 1", "Real Product/Startup 2", "Real Product/Startup 3"],
    "keyDifferentiator": "What makes THIS implementation different from existing solutions."
  },

  "techStack": {
    "frontend": ["Framework@version", "State management", "UI library"],
    "backend": ["Runtime + framework", "API style", "Key middleware"],
    "database": ["Primary DB (reason)", "Cache", "Search/Vector DB"],
    "aiMl": ["Core model/framework", "Training approach", "Serving infrastructure"],
    "devops": ["Container", "Orchestration", "CI/CD", "Monitoring + APM"],
    "external_apis": ["API service 1 (purpose)", "API service 2 (purpose)"]
  },

  "architectureMermaid": "ENTERPRISE-GRADE Mermaid diagram — see rules below",

  "systemDesignDetails": {
    "scalability": "Specific horizontal scaling strategy, caching layers, CDN approach, database sharding plan for 100k+ users.",
    "dataFlow": "Step-by-step: user action → API gateway → microservice → AI pipeline → DB → response. Include async steps.",
    "apiDesign": "REST vs GraphQL decision with reasons. List 6+ specific endpoints with HTTP method and purpose.",
    "security": "Auth flow (OAuth2/JWT/session), RBAC model, encryption at rest (AES-256), in transit (TLS 1.3), rate limiting.",
    "mlPipeline": "Training data sources, feature engineering, model architecture, serving strategy (batch/real-time), drift monitoring."
  },

  "stats": [
    {"val": "quantified stat from research", "label": "specific impactful label"}
  ],
  "warning": "2-3 sentences on biggest technical/business risk and mitigation strategy.",

  "arch": [
    {"icon": "🖥️", "title": "Presentation Layer", "stack": "React Native, PWA, Admin Dashboard", "hl": false},
    {"icon": "🔌", "title": "API Gateway", "stack": "Kong, Nginx Load Balancer, Rate Limiting", "hl": false},
    {"icon": "⚙️", "title": "Microservices", "stack": "Specific service names", "hl": false},
    {"icon": "🧠", "title": "AI/ML Engine", "stack": "Model + framework + serving", "hl": true},
    {"icon": "🗄️", "title": "Data Layer", "stack": "Primary DB + Cache + Search", "hl": false},
    {"icon": "☁️", "title": "Infrastructure", "stack": "Cloud + K8s + CI/CD + Monitoring", "hl": false}
  ],

  "deepSearchResults": [
    {
      "type": "paper | github | market",
      "title": "EXACT title from RAG context only",
      "source": "exact source domain",
      "desc": "2-3 sentences on why this is relevant to the architecture",
      "url": "exact URL from RAG context",
      "relevance": "core-algorithm | similar-implementation | dataset-source | competing-approach"
    }
  ],

  "competitiveAnalysis": [
    {
      "competitor": "Real product/company name",
      "approach": "Their tech approach",
      "ourAdvantage": "Our specific differentiator"
    }
  ],

  "mentorChat": [
    {"from": "bot", "text": "Detailed opening from senior architect about this specific project"},
    {"from": "user", "text": "Specific technical question"},
    {"from": "bot", "text": "Expert answer with specific recommendations or code hints"}
  ],

  "webIntel": [
    {"status": "safe | warn | critical", "lib": "packageName@exactVersion", "detail": "precise status details", "badge": "UP TO DATE | MIGRATE | CVE FOUND"}
  ],

  "sprints": [
    {
      "week": "W1",
      "title": "Specific Sprint Theme",
      "desc": "3-4 sentence description of deliverables, technical approach, and acceptance criteria.",
      "done": false,
      "milestones": ["Specific deliverable 1", "Specific deliverable 2", "Specific deliverable 3"]
    }
  ],

  "githubIssues": [
    {
      "title": "Specific actionable issue title",
      "body": "Background context + Acceptance Criteria (3-4 sentences minimum). Include technical hint.",
      "labels": ["area/backend", "type/feature", "priority/high"],
      "week": 1
    }
  ],

  "impactMetrics": {
    "cycleTimeReduction": "↓ X% — specific reasoning",
    "researchHoursSaved": "Xhrs — what manual process is replaced",
    "stackConfidence": "X% — based on tech maturity"
  },

  "deploymentPlan": {
    "infrastructure": "Cloud + specific services (e.g. AWS EC2 t3.medium + RDS PostgreSQL + ElastiCache + SageMaker)",
    "mvpTimeline": "Realistic week-by-week to working MVP",
    "estimatedCost": "Approximate monthly cloud cost at launch scale"
  }
}

═══════════════════════════════════════════
MERMAID ARCHITECTURE DIAGRAM — MANDATORY RULES
═══════════════════════════════════════════
The architectureMermaid field MUST be a detailed enterprise architecture using Mermaid subgraphs.
Model it after a Netflix/Google-style microservices diagram.

REQUIRED STRUCTURE — use this as your template (adapt to the project domain):

graph TD
  subgraph PRESENTATION["🖥️ PRESENTATION LAYER"]
    A1["Mobile App\\n(React Native)"]
    A2["Web Dashboard\\n(Next.js)"]
    A3["Admin Panel\\n(React)"]
  end

  subgraph GATEWAY["🔌 API GATEWAY & SECURITY"]
    B1["Kong API Gateway\\n(Rate Limiting)"]
    B2["Auth Middleware\\n(JWT + Clerk)"]
    B3["Load Balancer\\n(Nginx)"]
  end

  subgraph SERVICES["⚙️ BACKEND MICROSERVICES"]
    C1["User Service\\n(Node.js)"]
    C2["Core Domain Service\\n(Node.js / Go)"]
    C3["Notification Service\\n(Firebase)"]
    C4["Data Ingestion Service\\n(Python)"]
  end

  subgraph AI["🧠 AI / ML ENGINE"]
    D1["Prediction Model\\n(TensorFlow / PyTorch)"]
    D2["Data Preprocessor\\n(Pandas, NumPy)"]
    D3["Model Server\\n(FastAPI + TorchServe)"]
  end

  subgraph DATA["🗄️ DATA LAYER"]
    E1["PostgreSQL\\n(Core Data)"]
    E2["Redis Cache\\n(Sessions + Rate)"]
    E3["TimescaleDB\\n(Time-series)"]
    E4["Pinecone\\n(Vector Search)"]
  end

  subgraph EXTERNAL["🌐 EXTERNAL SERVICES"]
    F1["Domain-specific API 1"]
    F2["Domain-specific API 2"]
    F3["Maps / Geo Service"]
  end

  subgraph INFRA["☁️ DEVOPS & INFRA"]
    G1["Docker + Kubernetes\\n(GKE / EKS)"]
    G2["GitHub Actions\\n(CI/CD)"]
    G3["Prometheus + Grafana\\n(Monitoring)"]
  end

  A1 --> B1
  A2 --> B1
  A3 --> B1
  B1 --> B2 --> B3
  B3 --> C1 & C2 & C3
  C2 --> D2 --> D1 --> D3
  C4 --> D2
  C1 --> E1 & E2
  C2 --> E1 & E3
  D3 --> E4
  F1 & F2 --> C4
  F3 --> C2
  G1 --> C1 & C2 & C3
  G2 --> G1
  G3 -.-> C1 & C2 & D3

  style D1 fill:#e11d48,color:#fff
  style D3 fill:#e11d48,color:#fff

RULES:
1. Replace ALL generic node labels with project-specific names (e.g. "AirQuality Predictor" not just "Prediction Model")
2. ALL node text MUST be in double quotes: A1["Label"]
3. NO unescaped characters: & < > ( ) — write "and" not "&"
4. Use \\n (double-backslash n) for line breaks inside node labels
5. Minimum 15 nodes across all subgraphs
6. Use subgraph IDENTIFIER["Display Label"] syntax
7. style directives MUST reference the exact node identifier`;

  const userPrompt = `PROJECT IDEA: ${query}

${ragContext ? `=== LIVE RESEARCH INTELLIGENCE (from arXiv, IEEE, Semantic Scholar, GitHub, Market Reports) ===
${ragContext}

SCORING INSTRUCTIONS:
- Use the number of similar GitHub repos found to calibrate innovationScore (many similar repos = lower score, unique concept = higher)
- Use market intelligence data to calibrate marketScore
- Base similarProjects on real products/companies mentioned in the research context

ARCHITECTURE INSTRUCTIONS:
- Base tech stack on languages/frameworks most used in the similar GitHub repos above
- Name the AI/ML nodes specifically (e.g. "AQI Predictor" not just "ML Model")
- External integrations should match real APIs relevant to this domain
=== END RESEARCH CONTEXT ===` : ''}

Generate the complete enterprise-grade project blueprint JSON now. The architecture diagram MUST use subgraphs and have 15+ nodes. The ideaScore MUST reference specific data from the research context above.`;

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
