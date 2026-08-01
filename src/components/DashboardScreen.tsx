'use client';

import { useState, useRef, useEffect } from 'react';
import SafeMermaid from './SafeMermaid';

interface Props {
  blueprint: any;
  query: string;
  onNewQuery: () => void;
  onRegenerate: (q: string) => void;
}

type TabId = 'overview' | 'market' | 'deepsearch' | 'timeline' | 'mentor' | 'webintel';

const NAV_ITEMS: { id: TabId; icon: string; label: string }[] = [
  { id: 'overview', icon: '⊞', label: 'Overview' },
  { id: 'market', icon: '◔', label: 'Market Research' },
  { id: 'deepsearch', icon: '⌕', label: 'DeepSearch' },
  { id: 'timeline', icon: '▦', label: 'Timeline' },
  { id: 'mentor', icon: '💬', label: 'AI Mentor' },
  { id: 'webintel', icon: '🛡', label: 'Web Intel' },
];

function scoreColor(s: number) {
  if (s >= 75) return '#22c55e';
  if (s >= 50) return '#f59e0b';
  return '#ef4444';
}

export default function DashboardScreen({ blueprint: bp, query, onNewQuery, onRegenerate }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [refineVal, setRefineVal] = useState(query);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ from: 'bot' | 'user'; text: string }[]>(bp.mentorChat || []);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleRefine = () => {
    if (refineVal.trim()) onRegenerate(refineVal.trim());
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { from: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/mentor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, blueprint: bp, history: chatMessages.slice(-6).map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text })) })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { from: 'bot', text: data.response || 'Sorry, I could not respond.' }]);
    } catch {
      setChatMessages(prev => [...prev, { from: 'bot', text: 'Connection error. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const is = bp.ideaScore || {};

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="dot red" /><span className="dot yellow" /><span className="dot green" />
        </div>
        <div className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <div
              key={item.id}
              className={`nav-item${activeTab === item.id ? ' active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
        <div className="sidebar-bottom">
          <button className="reset-btn" onClick={onNewQuery}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            New Query
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="dashboard-main">
        <header className="dash-header">
          <div className="breadcrumb">Project HUB / <strong>{bp.title}</strong></div>
          <button className="export-pdf-btn" onClick={() => window.print()}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export PDF
          </button>
        </header>

        {/* Refine Bar */}
        <div className="refine-bar">
          <svg className="refine-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          </svg>
          <input
            type="text"
            value={refineVal}
            onChange={e => setRefineVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRefine()}
            placeholder="Refine your prompt (e.g. Add Stripe payments)..."
          />
          <span className="refine-kbd-badge">↵ Enter</span>
          <button className="refine-btn" onClick={handleRefine}>
            Re-Generate
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
        </div>

        <div className="canvas">
          {/* ── OVERVIEW TAB ── */}
          <div className={`tab-panel${activeTab === 'overview' ? ' active' : ''}`}>
            {/* Problem Validation */}
            <div className="figma-block animate-up">
              <div className="block-label">01. PROBLEM VALIDATION</div>
              <div className="stats-row">
                {(bp.stats || []).map((s: any, i: number) => (
                  <div className="stat-box" key={i}>
                    <div className="stat-val text-gradient">{s.val}</div>
                    <div className="stat-lbl">{s.label}</div>
                  </div>
                ))}
                <div className="stat-box warning-box">
                  <div className="icon">⚠️</div>
                  <div className="stat-lbl">{bp.warning}</div>
                </div>
              </div>
            </div>

            {/* Idea Score */}
            {is.innovationScore !== undefined && (
              <div className="figma-block animate-up" style={{ animationDelay: '0.1s' }}>
                <div className="block-label">02. IDEA INTELLIGENCE SCORE</div>
                <div className="score-grid">
                  {[
                    { label: 'Innovation', score: is.innovationScore },
                    { label: 'Complexity', score: is.complexityScore },
                    { label: 'Market', score: is.marketScore },
                  ].map(({ label, score }) => (
                    <div className="score-card" key={label}>
                      <div className="score-num" style={{ color: scoreColor(score) }}>{score}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span></div>
                      <div className="score-label">{label}</div>
                      <div className="score-bar"><div className="score-bar-fill" style={{ width: `${score}%`, background: scoreColor(score) }} /></div>
                    </div>
                  ))}
                  <div className="score-card overall">
                    <div className="score-num" style={{ color: 'white' }}>{is.overallScore}<span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)' }}>/100</span></div>
                    <div className="score-label" style={{ color: 'rgba(255,255,255,0.6)' }}>Overall</div>
                  </div>
                </div>
                {is.verdict && <div className="verdict-box">💡 {is.verdict}</div>}
                {is.keyDifferentiator && <div className="key-diff">🔑 {is.keyDifferentiator}</div>}
              </div>
            )}

            {/* Tech Stack */}
            {bp.techStack && (
              <div className="figma-block animate-up" style={{ animationDelay: '0.15s' }}>
                <div className="block-label">03. RECOMMENDED TECH STACK</div>
                {Object.entries(bp.techStack).map(([key, val]: any) => val?.length > 0 && (
                  <div key={key}>
                    <div className="tech-section-label">{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</div>
                    <div className="tech-tags">{val.map((t: string) => <span className="tech-tag" key={t}>{t}</span>)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Architecture */}
            <div className="figma-block animate-up" style={{ animationDelay: '0.2s' }}>
              <div className="block-label">04. SYSTEM ARCHITECTURE</div>
              <div className="arch-diagram">
                {(bp.arch || []).map((node: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                    <div className={`arch-card${node.hl ? ' highlight-card' : ''}`}>
                      <div className="arch-icon">{node.icon}</div>
                      <div className="arch-title">{node.title}</div>
                      <div className="arch-stack">{node.stack}</div>
                    </div>
                    {i < (bp.arch || []).length - 1 && <div className="arch-arrow">→</div>}
                  </div>
                ))}
              </div>
              {bp.architectureMermaid && (
                <div style={{ marginTop: 20 }}>
                  <div className="tech-section-label" style={{ marginBottom: 12 }}>MERMAID DIAGRAM</div>
                  <SafeMermaid chart={bp.architectureMermaid} />
                </div>
              )}
            </div>

            {/* System Design Details */}
            {bp.systemDesignDetails && Object.keys(bp.systemDesignDetails).length > 0 && (
              <div className="figma-block animate-up" style={{ animationDelay: '0.25s' }}>
                <div className="block-label">05. SYSTEM DESIGN DETAILS</div>
                {Object.entries(bp.systemDesignDetails).map(([key, val]: any) => val && (
                  <div key={key} style={{ marginBottom: 14 }}>
                    <div className="tech-section-label">{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-soft)', lineHeight: 1.6 }}>{val}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── MARKET RESEARCH TAB ── */}
          <div className={`tab-panel${activeTab === 'market' ? ' active' : ''}`}>
            <div className="figma-block animate-up">
              <div className="block-label">PROBLEM STATEMENT</div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-soft)', lineHeight: 1.7 }}>{bp.problemStatement}</p>
            </div>
            {bp.ideaScore && (
              <div className="figma-block animate-up" style={{ animationDelay: '0.1s' }}>
                <div className="block-label">MARKET SCORE ANALYSIS</div>
                <div className="score-card" style={{ display: 'inline-block', minWidth: 160 }}>
                  <div className="score-num" style={{ color: scoreColor(is.marketScore) }}>{is.marketScore}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span></div>
                  <div className="score-label">Market Viability</div>
                </div>
                {is.marketReason && <p style={{ marginTop: 14, fontSize: '0.87rem', color: 'var(--text-soft)', lineHeight: 1.6 }}>{is.marketReason}</p>}
              </div>
            )}
            {bp.competitiveAnalysis?.length > 0 && (
              <div className="figma-block animate-up" style={{ animationDelay: '0.2s' }}>
                <div className="block-label">COMPETITIVE ANALYSIS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: '0.75rem', color: 'var(--text-muted)', padding: '6px 0 10px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
                  <span>COMPETITOR</span><span>THEIR APPROACH</span><span>OUR ADVANTAGE</span>
                </div>
                <div className="comp-grid">
                  {bp.competitiveAnalysis.map((c: any, i: number) => (
                    <div className="comp-item" key={i}>
                      <div>{c.competitor}</div>
                      <div>{c.approach}</div>
                      <div>{c.ourAdvantage}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {bp.deploymentPlan && Object.keys(bp.deploymentPlan).length > 0 && (
              <div className="figma-block animate-up" style={{ animationDelay: '0.3s' }}>
                <div className="block-label">DEPLOYMENT PLAN</div>
                {Object.entries(bp.deploymentPlan).map(([k, v]: any) => v && (
                  <div key={k} style={{ marginBottom: 12 }}>
                    <div className="tech-section-label">{k.replace(/([A-Z])/g, ' $1').toUpperCase()}</div>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-soft)' }}>{v}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── DEEPSEARCH TAB ── */}
          <div className={`tab-panel${activeTab === 'deepsearch' ? ' active' : ''}`}>
            <div className="figma-block animate-up">
              <div className="block-label">RESEARCH INTELLIGENCE ({(bp.deepSearchResults || []).length} RESULTS)</div>
              <div className="search-results">
                {(bp.deepSearchResults || []).length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No research results. Add TAVILY_API_KEY and GITHUB_TOKEN for live data.</p>
                )}
                {(bp.deepSearchResults || []).map((r: any, i: number) => (
                  <a className="search-result-item" key={i} href={r.url || '#'} target="_blank" rel="noopener noreferrer">
                    <span className={`result-type ${r.type}`}>{r.type?.toUpperCase()}</span>
                    <div className="result-info">
                      <h4>{r.title}</h4>
                      <p>{r.source && <span style={{ color: 'var(--primary)', marginRight: 6 }}>{r.source}</span>}{r.desc}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── TIMELINE TAB ── */}
          <div className={`tab-panel${activeTab === 'timeline' ? ' active' : ''}`}>
            <div className="figma-block animate-up">
              <div className="block-label">4-WEEK SPRINT PLAN</div>
              <div className="sprint-list">
                {(bp.sprints || []).map((s: any, i: number) => (
                  <div className={`sprint-item${s.done ? ' done' : ''}`} key={i}>
                    <div className="check">{s.done ? '✓' : ''}</div>
                    <span className="sprint-week-badge">{s.week}</span>
                    <div>
                      <h4>{s.title}</h4>
                      <p>{s.desc}</p>
                      {s.milestones?.length > 0 && (
                        <div className="milestone-tags">
                          {s.milestones.map((m: string, j: number) => <span className="milestone-tag" key={j}>{m}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {bp.githubIssues?.length > 0 && (
              <div className="figma-block animate-up" style={{ animationDelay: '0.15s' }}>
                <div className="block-label">GITHUB ISSUES ({bp.githubIssues.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {bp.githubIssues.slice(0, 8).map((issue: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--bg-panel2)', border: '1px solid var(--border)', borderRadius: 8 }}>
                      <span style={{ color: 'var(--green)', fontSize: '0.85rem', flexShrink: 0 }}>#{i+1}</span>
                      <div>
                        <div style={{ fontSize: '0.86rem', color: 'var(--text)', marginBottom: 3 }}>{issue.title}</div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(issue.labels || []).map((l: string) => <span className="tech-tag" key={l}>{l}</span>)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── MENTOR TAB ── */}
          <div className={`tab-panel${activeTab === 'mentor' ? ' active' : ''}`}>
            <div className="figma-block animate-up" style={{ flexGrow: 1 }}>
              <div className="block-label">AI SCRUM MASTER</div>
              <div className="mentor-chat-container">
                <div className="chat-messages">
                  {chatMessages.map((m, i) => (
                    <div className={`msg${m.from === 'user' ? ' user' : ''}`} key={i}>
                      <span className="avatar">{m.from === 'bot' ? '🤖' : '👤'}</span>
                      <div className="bubble">{m.text}</div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="msg">
                      <span className="avatar">🤖</span>
                      <div className="bubble" style={{ color: 'var(--text-muted)' }}>Thinking...</div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="chat-input-row">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask your AI mentor..."
                    disabled={chatLoading}
                  />
                  <button onClick={sendMessage} disabled={chatLoading || !chatInput.trim()}>Send</button>
                </div>
              </div>
            </div>
          </div>

          {/* ── WEB INTEL TAB ── */}
          <div className={`tab-panel${activeTab === 'webintel' ? ' active' : ''}`}>
            <div className="figma-block animate-up">
              <div className="block-label">SECURITY INTELLIGENCE</div>
              <div className="intel-list">
                {(bp.webIntel || []).length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No security data available. This updates based on your tech stack.</p>
                )}
                {(bp.webIntel || []).map((item: any, i: number) => (
                  <div className="intel-item" key={i}>
                    <div className={`intel-dot ${item.status}`} />
                    <div className="intel-info">
                      <h4>{item.lib}</h4>
                      <p>{item.detail}</p>
                    </div>
                    <span className={`intel-badge ${item.status}`}>{item.badge}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
