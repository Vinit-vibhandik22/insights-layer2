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

  console.log('[Groq] Calling Llama 3.3 70B for blueprint generation...');
  const startTime = Date.now();

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 8192,
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
    techStack: {
      frontend: bp.techStack?.frontend || ['React.js'],
      backend: bp.techStack?.backend || ['Node.js', 'Express'],
      database: bp.techStack?.database || ['PostgreSQL'],
      aiMl: bp.techStack?.aiMl || ['Python', 'LangChain'],
      devops: bp.techStack?.devops || ['Docker', 'GitHub Actions']
    },
    architectureMermaid: bp.architectureMermaid || generateDefaultMermaid(bp),
    stats: bp.stats || [
      { val: '10M+', label: 'Potential users impacted' },
      { val: '3x', label: 'Faster than manual approach' }
    ],
    warning: bp.warning || 'Manual approaches in this domain are inefficient and do not scale.',
    arch: bp.arch || [
      { icon: '⚛️', title: 'Frontend', stack: (bp.techStack?.frontend || ['React']).join(', ') },
      { icon: '⚙️', title: 'Backend', stack: (bp.techStack?.backend || ['Node.js']).join(', ') },
      { icon: '🧠', title: 'AI Core', stack: (bp.techStack?.aiMl || ['Python']).join(', '), hl: true },
      { icon: '🗄️', title: 'Database', stack: (bp.techStack?.database || ['PostgreSQL']).join(', ') }
    ],
    deepSearchResults: bp.deepSearchResults || [],
    mentorChat: bp.mentorChat || [
      { from: 'bot', text: `🚀 Project "${bp.title || query}" initialized! Ready to start building?` }
    ],
    webIntel: bp.webIntel || [],
    sprints: bp.sprints || [
      { week: 'W1', title: 'Foundation', desc: 'Project setup & core architecture', done: false },
      { week: 'W2', title: 'Core Features', desc: 'Primary functionality development', done: false },
      { week: 'W3', title: 'AI Integration', desc: 'ML pipeline & model training', done: false },
      { week: 'W4', title: 'Deploy & Polish', desc: 'Testing, CI/CD & launch', done: false }
    ],
    githubIssues: bp.githubIssues || [],
    impactMetrics: bp.impactMetrics || {
      cycleTimeReduction: '↓ 40%',
      researchHoursSaved: '12+ hrs',
      stackConfidence: '94%'
    }
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
