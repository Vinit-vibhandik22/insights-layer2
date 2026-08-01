'use strict';

import Groq from 'groq-sdk';

let groqClient = null;

function getClient() {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set');
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

export async function generateBlueprint(query, ragContext) {
  const groq = getClient();
  const { buildBlueprintPrompt } = await import('./prompt-builder.js');
  const { systemPrompt, userPrompt } = buildBlueprintPrompt(query, ragContext);

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.2,
    max_tokens: 2048,
    top_p: 0.95,
    response_format: { type: 'json_object' }
  });

  const rawContent = completion.choices[0]?.message?.content;
  if (!rawContent) throw new Error('Groq returned empty response');

  const blueprint = JSON.parse(rawContent);
  return validateAndNormalize(blueprint, query);
}

export async function generateMentorResponse(userMessage, blueprintContext, chatHistory = []) {
  const groq = getClient();

  const systemPrompt = `You are an expert AI Scrum Master for the project: "${blueprintContext?.title || 'Student Project'}". 
Tech stack: ${JSON.stringify(blueprintContext?.techStack || {})}.
Be concise and actionable. Keep responses under 150 words.`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-6),
      { role: 'user', content: userMessage }
    ],
    temperature: 0.8,
    max_tokens: 512
  });

  return completion.choices[0]?.message?.content || 'Could not generate a response. Please try again.';
}

function validateAndNormalize(bp, query) {
  return {
    title: bp.title || query.substring(0, 60),
    tagline: bp.tagline || 'AI-Powered Innovation',
    problemStatement: bp.problemStatement || 'Addressing key challenges in this domain.',
    ideaScore: {
      innovationScore: bp.ideaScore?.innovationScore ?? 65,
      innovationReason: bp.ideaScore?.innovationReason || 'Based on existing similar projects.',
      complexityScore: bp.ideaScore?.complexityScore ?? 70,
      complexityReason: bp.ideaScore?.complexityReason || 'Requires integration of multiple components.',
      marketScore: bp.ideaScore?.marketScore ?? 65,
      marketReason: bp.ideaScore?.marketReason || 'Growing demand in this domain.',
      overallScore: bp.ideaScore?.overallScore ?? 67,
      verdict: bp.ideaScore?.verdict || 'Solid idea with clear execution path.',
      similarProjects: bp.ideaScore?.similarProjects || [],
      keyDifferentiator: bp.ideaScore?.keyDifferentiator || 'AI-first approach.'
    },
    techStack: {
      frontend: bp.techStack?.frontend || ['React.js'],
      backend: bp.techStack?.backend || ['Node.js', 'Express'],
      database: bp.techStack?.database || ['PostgreSQL'],
      aiMl: bp.techStack?.aiMl || ['Python', 'LangChain'],
      devops: bp.techStack?.devops || ['Docker', 'GitHub Actions'],
      external_apis: bp.techStack?.external_apis || []
    },
    architectureMermaid: bp.architectureMermaid || `graph TD\n  A["Frontend"] --> B["Backend"]\n  B --> C["Database"]\n  style C fill:#e11d48,color:#fff`,
    systemDesignDetails: bp.systemDesignDetails || {},
    stats: bp.stats || [{ val: '10M+', label: 'Potential users' }, { val: '3x', label: 'Faster than manual' }],
    warning: bp.warning || 'Manual approaches in this domain do not scale.',
    arch: bp.arch || [
      { icon: '🖥️', title: 'Frontend', stack: (bp.techStack?.frontend || ['React']).join(', '), hl: false },
      { icon: '⚙️', title: 'Backend', stack: (bp.techStack?.backend || ['Node.js']).join(', '), hl: false },
      { icon: '🧠', title: 'AI/ML Engine', stack: (bp.techStack?.aiMl || ['Python']).join(', '), hl: true },
      { icon: '🗄️', title: 'Data Layer', stack: (bp.techStack?.database || ['PostgreSQL']).join(', '), hl: false }
    ],
    deepSearchResults: bp.deepSearchResults || [],
    competitiveAnalysis: bp.competitiveAnalysis || [],
    mentorChat: bp.mentorChat || [{ from: 'bot', text: `🚀 Project "${bp.title || query}" initialized!` }],
    webIntel: bp.webIntel || [],
    literatureReview: bp.literatureReview || [],
    innovationOpportunities: bp.innovationOpportunities || [],
    githubRepos: bp.githubRepos || [],
    apisAndDatasets: bp.apisAndDatasets || [],
    roadmap: bp.roadmap || [],
    presentationDoc: bp.presentationDoc || {},
    sprints: bp.sprints || [
      { week: 'W1', title: 'Foundation', desc: 'Project setup & core architecture', done: false, milestones: [] },
      { week: 'W2', title: 'Core Features', desc: 'Primary functionality', done: false, milestones: [] },
      { week: 'W3', title: 'AI Integration', desc: 'ML pipeline & model training', done: false, milestones: [] },
      { week: 'W4', title: 'Deploy & Polish', desc: 'Testing, CI/CD & launch', done: false, milestones: [] }
    ],
    githubIssues: bp.githubIssues || [],
    impactMetrics: bp.impactMetrics || { cycleTimeReduction: '↓ 40%', researchHoursSaved: '12+ hrs', stackConfidence: '94%' },
    deploymentPlan: bp.deploymentPlan || {}
  };
}

