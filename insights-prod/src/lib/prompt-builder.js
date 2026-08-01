export function buildBlueprintPrompt(query, ragContext) {
  const systemPrompt = `You are iNSIGHTS Layer 2 — a senior system architect with 15+ years experience.

Produce a production-grade technical blueprint. Respond with a single valid JSON object only. No markdown outside JSON.

REQUIRED JSON SCHEMA:
{
  "title": "Project title (max 8 words)",
  "tagline": "One-line pitch (max 12 words)",
  "problemStatement": "3-4 sentence problem with pain points.",
  "ideaScore": {
    "innovationScore": <0-100>, "innovationReason": "2 sentences",
    "complexityScore": <0-100>, "complexityReason": "2 sentences",
    "marketScore": <0-100>, "marketReason": "2 sentences",
    "overallScore": <0-100>, "verdict": "One honest sentence.",
    "similarProjects": ["Project 1", "Project 2"],
    "keyDifferentiator": "1-2 sentences."
  },
  "techStack": {
    "frontend": ["Framework"], "backend": ["Runtime"],
    "database": ["DB"], "aiMl": ["Model"],
    "devops": ["Docker", "CI/CD"], "external_apis": ["API"]
  },
  "architectureMermaid": "graph TD diagram — all node labels in double quotes, \\n for line breaks",
  "systemDesignDetails": {
    "scalability": "Scaling strategy.", "dataFlow": "Step-by-step flow.",
    "apiDesign": "Key endpoints.", "security": "Auth and encryption.", "mlPipeline": "ML approach."
  },
  "stats": [{"val": "stat", "label": "label"}],
  "warning": "Biggest risk in 2 sentences.",
  "arch": [{"icon": "🖥️", "title": "Layer", "stack": "Tech", "hl": false}],
  "deepSearchResults": [{"type": "paper|github|market", "title": "Title", "source": "domain", "desc": "Relevance.", "url": "URL"}],
  "competitiveAnalysis": [{"competitor": "Product", "approach": "Their tech", "ourAdvantage": "Our edge"}],
  "mentorChat": [{"from": "bot", "text": "Opening message"}, {"from": "user", "text": "Question"}, {"from": "bot", "text": "Answer"}],
  "webIntel": [{"status": "safe|warn|critical", "lib": "pkg@version", "detail": "status", "badge": "UP TO DATE|MIGRATE|CVE FOUND"}],
  "sprints": [{"week": "W1", "title": "Theme", "desc": "Deliverables.", "done": false, "milestones": ["item"]}],
  "githubIssues": [{"title": "Issue", "body": "Description + criteria", "labels": ["backend"], "week": 1}],
  "impactMetrics": {"cycleTimeReduction": "↓ X%", "researchHoursSaved": "Xhrs", "stackConfidence": "X%"},
  "deploymentPlan": {"infrastructure": "Cloud services", "mvpTimeline": "Timeline", "estimatedCost": "Cost"}
}`;

  const userPrompt = `PROJECT IDEA: ${query}

${ragContext ? `=== RESEARCH CONTEXT (cite specific papers/repos) ===\n${ragContext}\n=== END ===\n\nWrite like a skeptical principal engineer. No marketing fluff. Cite exact data from above.` : ''}

Generate the complete blueprint JSON now.`;

  return { systemPrompt, userPrompt };
}

export function buildReadmeContent(blueprint, repoName) {
  const techList = [
    ...(blueprint.techStack?.frontend || []),
    ...(blueprint.techStack?.backend || []),
    ...(blueprint.techStack?.database || []),
    ...(blueprint.techStack?.aiMl || [])
  ].join(' • ');

  return `# ${blueprint.title}

> ${blueprint.tagline}

## Problem Statement
${blueprint.problemStatement}

## Tech Stack
${techList}

## Architecture
\`\`\`mermaid
${blueprint.architectureMermaid}
\`\`\`

## Sprint Plan
${(blueprint.sprints || []).map(s => `### ${s.week}: ${s.title}\n${s.desc}`).join('\n\n')}

## Setup
\`\`\`bash
git clone https://github.com/username/${repoName}.git
cd ${repoName}
cp .env.example .env
npm install && npm run dev
\`\`\`

## License
MIT — Built with [iNSIGHTS Layer 2](https://github.com/insights-layer2)
`;
}
