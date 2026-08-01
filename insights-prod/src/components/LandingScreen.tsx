'use client';

import { useState, KeyboardEvent } from 'react';

interface Props {
  onGenerate: (query: string) => void;
}

export default function LandingScreen({ onGenerate }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    await onGenerate(query.trim());
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleGenerate();
  };

  const quickFill = (text: string) => {
    setQuery(text);
    setTimeout(() => onGenerate(text), 50);
  };

  return (
    <main>
      <div className="hero">
        <div className="pill-badge">
          <span className="pulse-dot" />
          v3.0 Next.js Copilot Engine Live
        </div>

        <h1>AI-Powered Research &<br /><span className="text-gradient">Innovation Copilot</span></h1>
        <p className="hero-sub">
          Transforming Vague Ideas into Actionable Prototypes.<br />
          <em>"Search Less. Solve More."</em>
        </p>

        <div className="copilot-input-wrapper">
          <svg className="sparkle-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Describe your idea (e.g., Reduce food waste in hostels...)"
            disabled={loading}
          />
          <button onClick={handleGenerate} disabled={loading || !query.trim()}>
            {loading ? 'Generating...' : 'Generate Blueprint'}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>

        <div className="impact-metrics">
          <div className="metric-item"><span className="value">↓ 40%</span><span className="label">Cycle Time Reduction</span></div>
          <div className="divider" />
          <div className="metric-item"><span className="value">↑ 2x</span><span className="label">Project Completion</span></div>
          <div className="divider" />
          <div className="metric-item"><span className="value">0</span><span className="label">Friction Onboarding</span></div>
        </div>

        <div className="problem-section" style={{ width: '100%', marginBottom: 60 }}>
          <h2 className="section-title">The Problem We Solve</h2>
          <div className="bento-grid four-col">
            {[
              { icon: '📄', title: 'Information Overload', desc: 'Millions of research papers published annually make it impossible to keep up.' },
              { icon: '🔀', title: 'The Gap', desc: 'Translating theoretical research into practical prototypes is slow and error-prone.' },
              { icon: '🔄', title: 'Context Switching', desc: 'Constant switching between research databases, IDEs, and messaging platforms.' },
              { icon: '⚠️', title: 'Stale Tech Stacks', desc: 'No real-time awareness of security vulnerabilities or deprecated libraries.' },
            ].map(c => (
              <div className="bento-card" key={c.title}>
                <div className="bento-icon">{c.icon}</div>
                <h4>{c.title}</h4>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="features-section" id="featuresSection" style={{ width: '100%', marginBottom: 60 }}>
          <h2 className="section-title">Key Innovative Features</h2>
          <div className="bento-grid">
            {[
              { icon: '🗂️', title: 'Multimodal DeepSearch', desc: 'Search across academic papers, patents, and web docs simultaneously using RAG.', feature: 'Build an AI solution to reduce food waste in college hostels', key: 'deepsearch' },
              { icon: '⚙️', title: 'Automated Project HUB', desc: 'Generates a complete SDLC blueprint (Tech Stack, DB, Timeline) from a single prompt.', feature: 'Create a smart attendance system using face recognition', key: 'projecthub' },
              { icon: '💬', title: 'AI Mentor Chat', desc: 'Personal Scrum Master in your dashboard for debugging, sprint planning, and guidance.', feature: 'Develop a personal finance tracker with AI budgeting', key: 'mentor' },
            ].map(c => (
              <div className="bento-card feature-interactive" key={c.key} onClick={() => quickFill(c.feature)}>
                <div className="bento-icon">{c.icon}</div>
                <h4>{c.title}</h4>
                <p>{c.desc}</p>
                <span className="try-badge">Try it ↗</span>
              </div>
            ))}
          </div>
        </div>

        <div className="arch-section" id="archSection" style={{ width: '100%', marginBottom: 60 }}>
          <h2 className="section-title">System Architecture</h2>
          <div className="arch-flow">
            {[
              { icon: '⚛️', label: 'Frontend', sub: 'React.js, Next.js' },
              { icon: '🌐', label: 'API Gateway', sub: 'Next.js Routes' },
              { icon: '🧠', label: 'AI Processing (L2)', sub: 'Groq, Llama-3', highlight: true },
              { icon: '🗄️', label: 'Data Layer', sub: 'Supabase + Pinecone' },
              { icon: '📡', label: 'Integrations', sub: 'GitHub, Tavily' },
            ].map((n, i) => (
              <div key={n.label} style={{ display: 'flex', alignItems: 'center' }}>
                <div className={`arch-node-landing${n.highlight ? ' highlight-node' : ''}`}>
                  <span>{n.icon}</span>
                  <strong>{n.label}</strong>
                  <small>{n.sub}</small>
                </div>
                {i < 4 && <div className="arch-connector">→</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="roadmap-section" id="roadmapSection" style={{ width: '100%', marginBottom: 60 }}>
          <h2 className="section-title">Future Roadmap</h2>
          <div className="roadmap-timeline">
            {[
              { q: 'Q3 2026', title: 'Multi-Agent Collaboration', desc: 'Frontend, Backend, QA agents working in parallel.' },
              { q: 'Q4 2026', title: 'IDE Plugins', desc: 'VS Code & JetBrains deep integration.' },
              { q: 'Q1 2027', title: 'Enterprise Security', desc: 'Compliance features for enterprise deployments.' },
              { q: 'Q2 2027', title: 'IoT Prototyping', desc: 'Integration with hardware/IoT prototyping tools.' },
            ].map(r => (
              <div className="roadmap-item" key={r.q}>
                <div className="quarter">{r.q}</div>
                <div className="milestone-detail"><h4>{r.title}</h4><p>{r.desc}</p></div>
              </div>
            ))}
          </div>
        </div>

        <footer className="landing-footer">
          <p><strong>ISAG-404</strong> · Advanced College of Computational Sciences · <span className="text-primary">info@isag404.ai</span></p>
        </footer>
      </div>
    </main>
  );
}
