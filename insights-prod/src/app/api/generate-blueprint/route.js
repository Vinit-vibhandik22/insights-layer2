import { executeRAGPipeline } from '@/lib/rag';
import { generateBlueprint } from '@/lib/groq-client';
import { saveBlueprint } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 180;

function encodeSSE(event, data) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { query } = body;

  if (!query || typeof query !== 'string' || query.trim().length < 5) {
    return Response.json({ error: 'Please provide a project idea (minimum 5 characters).' }, { status: 400 });
  }

  const cleanQuery = query.trim().substring(0, 500);

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event, data) => {
        try { controller.enqueue(enc.encode(encodeSSE(event, data))); } catch (_) {}
      };

      // Aggressive keepalive every 5 seconds
      const keepAlive = setInterval(() => {
        try { controller.enqueue(enc.encode(': ping\n\n')); } catch (_) { clearInterval(keepAlive); }
      }, 5000);

      try {
        send('stage', { stage: 1, label: 'Executing Multimodal DeepSearch...', sub: 'Querying arXiv, IEEE Xplore, GitHub [1/5]', progress: 20 });

        const ragResult = await executeRAGPipeline(cleanQuery, (stage, label) => {
          if (stage === 2) send('stage', { stage: 2, label: 'Knowledge Clustering Active...', sub: 'Discovering GitHub repositories [2/5]', progress: 40 });
          else if (stage === 3) send('stage', { stage: 3, label: 'Web Intelligence Scanning...', sub: 'Checking npm vulnerabilities [3/5]', progress: 60 });
        });

        send('rag_result', { papers: ragResult.rawData.papers, repos: ragResult.rawData.repos, vulnerabilities: ragResult.rawData.vulnerabilities });

        send('stage', { stage: 4, label: 'Generating System Architecture...', sub: 'Synthesizing AI blueprint with Llama [4/5]', progress: 80 });

        let blueprint;
        if (!process.env.GROQ_API_KEY) {
          blueprint = generateFallback(cleanQuery, ragResult.rawData);
        } else {
          blueprint = await generateBlueprint(cleanQuery, ragResult.context);
        }

        // Merge real RAG data
        if (ragResult.rawData.papers.length > 0 || ragResult.rawData.repos.length > 0) {
          blueprint = mergeRAGIntoBlueprint(blueprint, ragResult.rawData);
        }

        send('stage', { stage: 5, label: 'Formulating Agile Milestones...', sub: 'Rendering architecture diagram [5/5]', progress: 100 });

        await new Promise(r => setTimeout(r, 400));

        const sessionId = req.headers.get('x-session-id') || req.headers.get('x-forwarded-for') || 'anon';
        const blueprintId = await saveBlueprint({ query: cleanQuery, blueprint, ragContext: ragResult.rawData, sessionId });

        send('blueprint', { ...blueprint, _id: blueprintId });
        send('done', { success: true, blueprintId });

      } catch (err) {
        send('error', { message: err.message || 'Blueprint generation failed.' });
      } finally {
        clearInterval(keepAlive);
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    }
  });
}

function mergeRAGIntoBlueprint(blueprint, ragData) {
  const merged = { ...blueprint };
  const realResults = [];
  for (const paper of (ragData.papers || []).slice(0, 10)) {
    realResults.push({ type: 'paper', title: paper.title, source: paper.source || 'Academic Source', desc: (paper.snippet || '').substring(0, 200), url: paper.url });
  }
  for (const repo of (ragData.repos || []).slice(0, 10)) {
    realResults.push({ type: 'github', title: repo.title, source: repo.source || 'GitHub', desc: (repo.snippet || '').substring(0, 200), url: repo.url, language: repo.language });
  }
  if (realResults.length > 0) merged.deepSearchResults = realResults;
  if (ragData.vulnerabilities?.length > 0) {
    merged.webIntel = ragData.vulnerabilities.map(v => ({ status: v.status, lib: v.lib, detail: v.detail, badge: v.badge }));
  }
  return merged;
}

function generateFallback(query, ragData) {
  const short = query.length > 60 ? query.substring(0, 60) + '...' : query;
  const words = query.toLowerCase().split(' ');
  const isML = words.some(w => ['ai','ml','predict','recognition','detect','classify'].includes(w));
  const isMobile = words.some(w => ['mobile','app','ios','android'].includes(w));
  return {
    title: short, tagline: `AI-powered solution for ${words.slice(0,4).join(' ')}`,
    problemStatement: `This project addresses ${query}. Current manual approaches are inefficient.`,
    ideaScore: { innovationScore: 68, innovationReason: 'Based on RAG research context.', complexityScore: 72, complexityReason: 'Requires multiple integrated components.', marketScore: 65, marketReason: 'Growing demand in this domain.', overallScore: 68, verdict: 'Solid idea with clear execution path.', similarProjects: [], keyDifferentiator: 'AI-first approach.' },
    techStack: { frontend: isMobile ? ['React Native','Expo'] : ['React.js','Next.js'], backend: ['Node.js','Express'], database: ['PostgreSQL','Redis'], aiMl: isML ? ['Python','TensorFlow','FastAPI'] : ['Python','LangChain'], devops: ['Docker','GitHub Actions'], external_apis: [] },
    architectureMermaid: `graph TD\n  A["${isMobile ? 'React Native' : 'React.js'}\\nClient"] -->|REST API| B["Node.js\\nAPI Server"]\n  B --> C["Python ML\\nAI Engine"]\n  B --> D["PostgreSQL\\nDatabase"]\n  C -->|Predictions| B\n  style C fill:#e11d48,color:#fff`,
    stats: [{ val: '10M+', label: 'Potential users impacted' }, { val: '3x', label: 'Faster than manual' }],
    warning: 'Manual workflows for this domain are inefficient and cannot scale.',
    arch: [{ icon: '⚛️', title: 'Frontend', stack: isMobile ? 'React Native' : 'React.js', hl: false }, { icon: '⚙️', title: 'Backend', stack: 'Node.js, Express', hl: false }, { icon: '🧠', title: 'AI Core', stack: 'Python, LangChain', hl: true }, { icon: '🗄️', title: 'Database', stack: 'PostgreSQL, Redis', hl: false }],
    deepSearchResults: (ragData.papers || []).slice(0, 3).map(p => ({ type: 'paper', title: p.title, source: p.source, desc: p.snippet || '', url: p.url })).concat((ragData.repos || []).slice(0, 3).map(r => ({ type: 'github', title: r.title, source: r.source, desc: r.snippet || '', url: r.url }))),
    competitiveAnalysis: [],
    mentorChat: [{ from: 'bot', text: `🚀 Project "${short}" initialized! Ready to start building?` }, { from: 'user', text: 'What should I focus on first?' }, { from: 'bot', text: 'Start with the database schema and core API in Week 1. Get the foundation solid before adding AI.' }],
    webIntel: ragData.vulnerabilities?.length > 0 ? ragData.vulnerabilities.slice(0,4) : [{ status: 'safe', lib: 'Node.js 20 LTS', detail: 'Latest LTS. No known CVEs.', badge: 'UP TO DATE' }],
    sprints: [{ week: 'W1', title: 'Foundation', desc: 'DB schema, API scaffolding, auth system', done: false, milestones: ['Schema complete', 'API running', 'Auth working'] }, { week: 'W2', title: 'Core Features', desc: 'Primary UI & business logic', done: false, milestones: ['UI complete', 'Core flows working'] }, { week: 'W3', title: 'AI Integration', desc: 'ML pipeline & model training', done: false, milestones: ['Model trained', 'API integrated'] }, { week: 'W4', title: 'Deploy & Polish', desc: 'Testing, CI/CD & production launch', done: false, milestones: ['Tests written', 'CI/CD set up', 'Deployed'] }],
    githubIssues: [], impactMetrics: { cycleTimeReduction: '↓ 40%', researchHoursSaved: '12+ hrs', stackConfidence: '94%' }, deploymentPlan: {}
  };
}
