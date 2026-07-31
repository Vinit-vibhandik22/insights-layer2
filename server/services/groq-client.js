'use strict';

const Groq = require('groq-sdk');

let groqClient = null;

function getGroqClient() {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

/**
 * Generate a project blueprint using Groq API
 * @param {string} query - User's project idea
 * @param {string} ragContext - Context assembled from RAG pipeline
 * @returns {Promise<Object>} Parsed blueprint object
 */
async function generateBlueprint(query, ragContext) {
  const groq = getGroqClient();
  const { buildBlueprintPrompt } = require('../utils/prompt-builder');

  const { systemPrompt, userPrompt } = buildBlueprintPrompt(query, ragContext);

  console.log('[Groq] Calling Llama 3.1 8B for blueprint generation...');
  const startTime = Date.now();

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 4096,
      top_p: 0.95,
      response_format: { type: 'json_object' }
    });

    const elapsed = Date.now() - startTime;
    const rawContent = completion.choices[0]?.message?.content;

    if (!rawContent) {
      throw new Error('Groq returned empty response');
    }

    console.log(`[Groq] Generation complete in ${elapsed}ms. Tokens: ${completion.usage?.total_tokens}`);

    const blueprint = JSON.parse(rawContent);
    return validateAndNormalizeBlueprint(blueprint, query);
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.error('[Groq] JSON parse error:', err.message);
      throw new Error('LLM returned invalid JSON. Please try again.');
    }
    throw err;
  }
}

/**
 * Generate a mentor chat response using Groq
 * @param {string} userMessage - User's question
 * @param {Object} blueprintContext - Current blueprint data for context
 * @param {Array} chatHistory - Previous messages
 * @returns {Promise<string>} AI response text
 */
async function generateMentorResponse(userMessage, blueprintContext, chatHistory = []) {
  const groq = getGroqClient();

  const systemPrompt = `You are an expert AI Scrum Master and Tech Lead for the project: "${blueprintContext?.title || 'Student Project'}". 
You have deep knowledge of the tech stack: ${JSON.stringify(blueprintContext?.techStack || {})}.
Be concise, practical, and actionable. Reference specific architecture decisions when relevant.
If asked about code, provide short, working snippets. Keep responses under 200 words.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-6), // Last 3 exchanges for context
    { role: 'user', content: userMessage }
  ];

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant', // Use faster model for chat
    messages,
    temperature: 0.8,
    max_tokens: 512
  });

  return completion.choices[0]?.message?.content || 'I apologize, I could not generate a response. Please try again.';
}

/**
 * Validate and normalize the blueprint output from LLM
 * Ensures all required fields are present with sensible defaults
 */
function validateAndNormalizeBlueprint(bp, query) {
  return {
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
    architectureMermaid: bp.architectureMermaid || generateDefaultMermaid(bp),
    systemDesignDetails: bp.systemDesignDetails || {},
    stats: bp.stats || [
      { val: '10M+', label: 'Potential users impacted' },
      { val: '3x', label: 'Faster than manual approach' }
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
}

function generateDefaultMermaid(bp) {
  const frontend = (bp.techStack?.frontend?.[0] || 'React');
  const backend = (bp.techStack?.backend?.[0] || 'Node.js');
  const db = (bp.techStack?.database?.[0] || 'PostgreSQL');
  const ai = (bp.techStack?.aiMl?.[0] || 'Python ML');

  return `graph TD
  A["📱 ${frontend}\n(Client)"] -->|REST API| B["⚙️ ${backend}\n(API Server)"]
  B --> C["🧠 ${ai}\n(AI Engine)"]
  B --> D["🗄️ ${db}\n(Database)"]
  C -->|Predictions| B
  B -->|Response| A
  D --> E["📊 Analytics\nDashboard"]
  style C fill:#e11d48,color:#fff`;
}

module.exports = { generateBlueprint, generateMentorResponse };
