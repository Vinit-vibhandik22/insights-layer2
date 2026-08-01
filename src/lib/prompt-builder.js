export function buildBlueprintPrompt(query, ragContext) {
  const systemPrompt = `You are iNSIGHTS Layer 2 — a senior system architect with 15+ years experience.

Produce a production-grade technical blueprint. Respond with a single valid JSON object only. No markdown outside JSON.

REQUIRED JSON SCHEMA (ALL fields mandatory):
{
  "title": "Project title (max 8 words)",
  "tagline": "One-line pitch (max 12 words)",
  "problemStatement": "3-4 sentence problem with quantified pain points.",

  "ideaScore": {
    "innovationScore": <0-100>, "innovationReason": "2 sentences citing specific research",
    "complexityScore": <0-100>, "complexityReason": "2 sentences on hard engineering challenges",
    "marketScore": <0-100>, "marketReason": "2 sentences with market size data",
    "overallScore": <0-100>, "verdict": "One brutally honest sentence.",
    "similarProjects": ["Real existing project 1", "Real existing project 2", "Real existing project 3"],
    "keyDifferentiator": "1-2 sentences on the exact technical differentiator."
  },

  "techStack": {
    "frontend": ["Framework@version (reason)"],
    "backend": ["Runtime + framework (reason)"],
    "database": ["Primary DB (reason)", "Cache (reason)"],
    "aiMl": ["Model/framework (purpose)"],
    "devops": ["Container", "CI/CD tool", "Monitoring"],
    "external_apis": ["API name (purpose)", "Dataset name (source)"]
  },
  "architectureMermaid": "VALID Mermaid.js graph TD string ONLY. NO markdown. ONLY use '-->' for arrows (NEVER use '->', '->>', or '=>'). Use simple format: A[\"Node1\"] -->|\"Label\"| B[\"Node2\"]. Use double-quoted labels for node names with spaces. DO NOT USE SPACES OR SPECIAL CHARACTERS IN NODE IDS.",
  "systemDesignDetails": {
    "scalability": "Specific scaling strategy for 100k+ users.",
    "dataFlow": "Step-by-step data flow from user to response.",
    "apiDesign": "List 5+ specific REST endpoints with HTTP methods.",
    "security": "Auth flow, encryption, rate limiting details.",
    "mlPipeline": "Training data sources, model approach, serving strategy."
  },

  "stats": [{"val": "quantified stat", "label": "impact label"}],
  "warning": "Biggest technical and business risk in 2 sentences.",

  "arch": [{"icon": "🖥️", "title": "Layer Name", "stack": "Specific tech", "hl": false}],

  "literatureReview": [
    {
      "title": "Exact paper/article title from research context",
      "authors": "Author names",
      "year": "Year",
      "source": "Journal/venue",
      "keyFinding": "1-2 sentences on finding relevant to this project",
      "url": "URL if available"
    }
  ],

  "innovationOpportunities": [
    {
      "area": "Specific technical area (e.g. Real-time inference)",
      "currentGap": "What is missing or broken today",
      "opportunity": "How this project fills the gap",
      "impact": "high|medium|low"
    }
  ],

  "githubRepos": [
    {
      "name": "owner/repo-name",
      "description": "What it does and why it's relevant",
      "stars": "approximate star count",
      "language": "primary language",
      "url": "GitHub URL",
      "relevance": "reference|competitor|dataset|tooling"
    }
  ],

  "apisAndDatasets": [
    {
      "name": "API or dataset name",
      "type": "api|dataset|model",
      "purpose": "How it will be used in this project",
      "url": "Documentation or access URL",
      "free": true
    }
  ],

  "deepSearchResults": [{"type": "paper|github|market", "title": "Title", "source": "domain", "desc": "Relevance.", "url": "URL"}],
  "competitiveAnalysis": [{"competitor": "Real product", "approach": "Their tech", "ourAdvantage": "Our specific edge"}],
  "mentorChat": [{"from": "bot", "text": "Opening"}, {"from": "user", "text": "Question"}, {"from": "bot", "text": "Answer"}],
  "webIntel": [{"status": "safe|warn|critical", "lib": "pkg@version", "detail": "status detail", "badge": "UP TO DATE|MIGRATE|CVE FOUND"}],

  "sprints": [
    {
      "week": "W1", "title": "Sprint theme",
      "desc": "What gets built and delivered this week.",
      "done": false,
      "milestones": ["Specific deliverable 1", "Specific deliverable 2"]
    }
  ],

  "roadmap": [
    {"phase": "MVP (Month 1-2)", "goals": ["Goal 1", "Goal 2"], "milestone": "What ships"},
    {"phase": "Beta (Month 3-4)", "goals": ["Goal 1", "Goal 2"], "milestone": "What ships"},
    {"phase": "Launch (Month 5-6)", "goals": ["Goal 1", "Goal 2"], "milestone": "What ships"}
  ],

  "githubIssues": [{"title": "Issue title", "body": "Background + acceptance criteria", "labels": ["backend"], "week": 1}],
  "impactMetrics": {"cycleTimeReduction": "↓ X%", "researchHoursSaved": "Xhrs", "stackConfidence": "X%"},
  "deploymentPlan": {"infrastructure": "Cloud + specific services", "mvpTimeline": "Week-by-week plan", "estimatedCost": "Monthly cost estimate"},

  "presentationDoc": {
    "executiveSummary": "2-3 sentence summary for non-technical audience",
    "problemSize": "Market size or number of people affected with source",
    "proposedSolution": "What the product does in plain English",
    "uniqueValue": "Why this beats existing solutions",
    "teamRequirements": "Skills needed to build this (e.g. 1 ML engineer, 1 fullstack dev)",
    "nextSteps": ["Immediate action 1", "Immediate action 2", "Immediate action 3"]
  }
}`;

  const userPrompt = `PROJECT IDEA: ${query}

${ragContext ? `=== RESEARCH CONTEXT (cite specific papers/repos from below) ===\n${ragContext}\n=== END ===\n\nWrite like a skeptical principal engineer. No marketing fluff. Use real data from the research context above for literatureReview, githubRepos, and apisAndDatasets fields.` : ''}

Generate the complete blueprint JSON now. Every field is mandatory.`;

  return { systemPrompt, userPrompt };
}

export function buildReadmeContent(blueprint, repoName) {
  const techList = [
    ...(blueprint.techStack?.frontend || []),
    ...(blueprint.techStack?.backend || []),
    ...(blueprint.techStack?.database || []),
    ...(blueprint.techStack?.aiMl || [])
  ].join(' • ');

  const sprintMd = (blueprint.sprints || []).map(s =>
    `### ${s.week}: ${s.title}\n${s.desc}\n${(s.milestones || []).map(m => `- ${m}`).join('\n')}`
  ).join('\n\n');

  return `# ${blueprint.title}

> ${blueprint.tagline}

## Problem
${blueprint.problemStatement}

## Tech Stack
${techList}

## Architecture
\`\`\`mermaid
${blueprint.architectureMermaid}
\`\`\`

## Sprint Plan
${sprintMd}

## Setup
\`\`\`bash
git clone https://github.com/username/${repoName}.git
cp .env.example .env
npm install && npm run dev
\`\`\`

## License
MIT — Built with [iNSIGHTS Layer 2](https://github.com/insights-layer2)
`;
}
