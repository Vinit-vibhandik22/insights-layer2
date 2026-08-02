'use client';

import { useState, useRef, useEffect } from 'react';
import SafeMermaid from './SafeMermaid';

interface Props {
  blueprint: any;
  query: string;
  onNewQuery: () => void;
  onRegenerate: (q: string) => void;
}

type TabId = 'overview' | 'research' | 'innovation' | 'architecture' | 'resources' | 'timeline' | 'mentor' | 'docs';

const NAV_ITEMS: { id: TabId; icon: string; label: string }[] = [
  { id: 'overview',     icon: '⊞', label: 'Overview' },
  { id: 'research',     icon: '📚', label: 'Literature & Market' },
  { id: 'innovation',   icon: '💡', label: 'Innovation Gaps' },
  { id: 'architecture', icon: '🏗️', label: 'Architecture' },
  { id: 'resources',    icon: '🔗', label: 'Repos & APIs' },
  { id: 'timeline',     icon: '📅', label: 'Roadmap & Timeline' },
  { id: 'mentor',       icon: '💬', label: 'AI Mentor' },
  { id: 'docs',         icon: '📄', label: 'Presentation Doc' },
];

function scoreColor(s: number) {
  if (s >= 75) return '#22c55e';
  if (s >= 50) return '#f59e0b';
  return '#ef4444';
}

function Block({ label, delay = '0s', children }: { label: string; delay?: string; children: React.ReactNode }) {
  return (
    <div className="figma-block animate-up" style={{ animationDelay: delay }}>
      <div className="block-label">{label}</div>
      {children}
    </div>
  );
}

export default function DashboardScreen({ blueprint: bp, query, onNewQuery, onRegenerate }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [refineVal, setRefineVal] = useState(query);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ from: 'bot' | 'user'; text: string }[]>(bp.mentorChat || []);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const is = bp.ideaScore || {};

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const sendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { from: 'user', text: userMsg }]);
    setChatLoading(true);
    try {
      const res = await fetch('/api/mentor-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, blueprint: bp, history: chatMessages.slice(-6).map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text })) })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { from: 'bot', text: data.response || 'Could not respond.' }]);
    } catch { setChatMessages(prev => [...prev, { from: 'bot', text: 'Connection error. Please try again.' }]); }
    finally { setChatLoading(false); }
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header"><span className="dot red"/><span className="dot yellow"/><span className="dot green"/></div>
        <div className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <div key={item.id} className={`nav-item${activeTab === item.id ? ' active' : ''}`} onClick={() => setActiveTab(item.id)}>
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>{item.label}
            </div>
          ))}
        </div>
        <div className="sidebar-bottom">
          <button className="reset-btn" onClick={onNewQuery}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            New Query
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dash-header">
          <div className="breadcrumb">Project HUB / <strong>{bp.title}</strong></div>
          <button className="export-pdf-btn" onClick={() => window.print()}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export PDF
          </button>
        </header>

        <div className="refine-bar">
          <svg className="refine-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
          <input type="text" value={refineVal} onChange={e => setRefineVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && refineVal.trim() && onRegenerate(refineVal.trim())} placeholder="Refine your prompt..."/>
          <span className="refine-kbd-badge">↵ Enter</span>
          <button className="refine-btn" onClick={() => refineVal.trim() && onRegenerate(refineVal.trim())}>
            Re-Generate <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          </button>
        </div>

        <div className="canvas">

          {/* ── 1. OVERVIEW ── */}
          <div className={`tab-panel${activeTab === 'overview' ? ' active' : ''}`}>
            <Block label="01. PROBLEM VALIDATION">
              <div className="stats-row">
                {(bp.stats || []).map((s: any, i: number) => (
                  <div className="stat-box" key={i}><div className="stat-val text-gradient">{s.val}</div><div className="stat-lbl">{s.label}</div></div>
                ))}
                <div className="stat-box warning-box"><div className="icon">⚠️</div><div className="stat-lbl">{bp.warning}</div></div>
              </div>
            </Block>

            {is.innovationScore !== undefined && (
              <Block label="02. IDEA INTELLIGENCE SCORE" delay="0.1s">
                <div className="score-grid">
                  {[{label:'Innovation',score:is.innovationScore},{label:'Complexity',score:is.complexityScore},{label:'Market',score:is.marketScore}].map(({label,score})=>(
                    <div className="score-card" key={label}>
                      <div className="score-num" style={{color:scoreColor(score)}}>{score}<span style={{fontSize:'1rem',color:'var(--text-muted)' }}>/100</span></div>
                      <div className="score-label">{label}</div>
                      <div className="score-bar"><div className="score-bar-fill" style={{width:`${score}%`,background:scoreColor(score)}}/></div>
                    </div>
                  ))}
                  <div className="score-card overall">
                    <div className="score-num" style={{color:'white'}}>{is.overallScore}<span style={{fontSize:'1rem',color:'rgba(255,255,255,0.6)' }}>/100</span></div>
                    <div className="score-label" style={{color:'rgba(255,255,255,0.6)'}}>Overall</div>
                  </div>
                </div>
                {is.verdict && <div className="verdict-box">💡 {is.verdict}</div>}
                {is.keyDifferentiator && <div className="key-diff">🔑 {is.keyDifferentiator}</div>}
                {is.similarProjects?.length > 0 && (
                  <div style={{marginTop:12}}>
                    <div className="tech-section-label">SIMILAR EXISTING SOLUTIONS</div>
                    <div className="tech-tags">{is.similarProjects.map((p:string)=><span className="tech-tag" key={p}>{p}</span>)}</div>
                  </div>
                )}
              </Block>
            )}

            {bp.techStack && (
              <Block label="03. RECOMMENDED TECH STACK" delay="0.15s">
                {Object.entries(bp.techStack).map(([key, val]: any) => val?.length > 0 && (
                  <div key={key}>
                    <div className="tech-section-label">{key.replace(/([A-Z])/g,' $1').toUpperCase()}</div>
                    <div className="tech-tags">{val.map((t:string)=><span className="tech-tag" key={t}>{t}</span>)}</div>
                  </div>
                ))}
              </Block>
            )}

            {bp.impactMetrics && (
              <Block label="04. IMPACT METRICS" delay="0.2s">
                <div className="stats-row">
                  {Object.entries(bp.impactMetrics).map(([k,v]:any)=>(
                    <div className="stat-box" key={k}>
                      <div className="stat-val" style={{fontSize:'1.4rem',color:'var(--green)'}}>{v}</div>
                      <div className="stat-lbl">{k.replace(/([A-Z])/g,' $1')}</div>
                    </div>
                  ))}
                </div>
              </Block>
            )}
          </div>

          {/* ── 2. LITERATURE & MARKET RESEARCH ── */}
          <div className={`tab-panel${activeTab === 'research' ? ' active' : ''}`}>
            <Block label="PROBLEM STATEMENT">
              <p style={{fontSize:'0.9rem',color:'var(--text-soft)',lineHeight:1.7}}>{bp.problemStatement}</p>
            </Block>

            {bp.literatureReview?.length > 0 && (
              <Block label={`LITERATURE REVIEW (${bp.literatureReview.length} PAPERS)`} delay="0.1s">
                <div className="search-results">
                  {bp.literatureReview.map((p:any, i:number) => (
                    <a className="search-result-item" key={i} href={p.url||'#'} target="_blank" rel="noopener noreferrer">
                      <span className="result-type paper">PAPER</span>
                      <div className="result-info">
                        <h4>{p.title} {p.year && <span style={{color:'var(--text-muted)',fontWeight:400}}>({p.year})</span>}</h4>
                        <p>{p.authors && <span style={{color:'var(--primary)',marginRight:6}}>{p.authors}</span>}{p.source && <span style={{marginRight:6,color:'var(--text-muted)'}}>{p.source} ·</span>}{p.keyFinding}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </Block>
            )}

            {bp.deepSearchResults?.length > 0 && (
              <Block label={`DEEPSEARCH RESULTS (${bp.deepSearchResults.length})`} delay="0.15s">
                <div className="search-results">
                  {bp.deepSearchResults.map((r:any,i:number)=>(
                    <a className="search-result-item" key={i} href={r.url||'#'} target="_blank" rel="noopener noreferrer">
                      <span className={`result-type ${r.type}`}>{r.type?.toUpperCase()}</span>
                      <div className="result-info"><h4>{r.title}</h4><p><span style={{color:'var(--primary)',marginRight:6}}>{r.source}</span>{r.desc}</p></div>
                    </a>
                  ))}
                </div>
              </Block>
            )}

            {is.marketScore !== undefined && (
              <Block label="MARKET ANALYSIS" delay="0.2s">
                <div className="score-card" style={{display:'inline-block',minWidth:160,marginBottom:14}}>
                  <div className="score-num" style={{color:scoreColor(is.marketScore)}}>{is.marketScore}<span style={{fontSize:'1rem',color:'var(--text-muted)' }}>/100</span></div>
                  <div className="score-label">Market Viability</div>
                </div>
                {is.marketReason && <p style={{fontSize:'0.87rem',color:'var(--text-soft)',lineHeight:1.6}}>{is.marketReason}</p>}
              </Block>
            )}

            {bp.competitiveAnalysis?.length > 0 && (
              <Block label="EXISTING SOLUTION COMPARISON" delay="0.25s">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,fontSize:'0.72rem',color:'var(--text-muted)',padding:'6px 0 10px',borderBottom:'1px solid var(--border)',marginBottom:8}}>
                  <span>COMPETITOR</span><span>THEIR APPROACH</span><span>OUR ADVANTAGE</span>
                </div>
                <div className="comp-grid">
                  {bp.competitiveAnalysis.map((c:any,i:number)=>(
                    <div className="comp-item" key={i}><div>{c.competitor}</div><div>{c.approach}</div><div>{c.ourAdvantage}</div></div>
                  ))}
                </div>
              </Block>
            )}
          </div>

          {/* ── 3. INNOVATION OPPORTUNITIES ── */}
          <div className={`tab-panel${activeTab === 'innovation' ? ' active' : ''}`}>
            {bp.innovationOpportunities?.length > 0 ? (
              <Block label={`INNOVATION OPPORTUNITIES (${bp.innovationOpportunities.length})`}>
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {bp.innovationOpportunities.map((op:any,i:number)=>(
                    <div key={i} style={{padding:'16px',background:'var(--bg-panel2)',border:'1px solid var(--border)',borderLeft:`3px solid ${op.impact==='high'?'var(--primary)':op.impact==='medium'?'var(--amber)':'var(--text-muted)'}`,borderRadius:10}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                        <strong style={{fontSize:'0.92rem',color:'var(--text)'}}>{op.area}</strong>
                        <span style={{fontSize:'0.7rem',fontWeight:700,padding:'3px 10px',borderRadius:20,background:op.impact==='high'?'rgba(225,29,72,0.1)':op.impact==='medium'?'rgba(245,158,11,0.1)':'rgba(100,116,139,0.1)',color:op.impact==='high'?'var(--primary)':op.impact==='medium'?'var(--amber)':'var(--text-muted)'}}>{op.impact?.toUpperCase()} IMPACT</span>
                      </div>
                      <div className="tech-section-label">CURRENT GAP</div>
                      <p style={{fontSize:'0.83rem',color:'var(--text-soft)',marginBottom:8}}>{op.currentGap}</p>
                      <div className="tech-section-label">OPPORTUNITY</div>
                      <p style={{fontSize:'0.83rem',color:'var(--green)'}}>{op.opportunity}</p>
                    </div>
                  ))}
                </div>
              </Block>
            ) : (
              <Block label="INNOVATION OPPORTUNITIES">
                <p style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>Generating with AI — regenerate the blueprint to populate this section.</p>
              </Block>
            )}

            {is.innovationReason && (
              <Block label="INNOVATION SCORE RATIONALE" delay="0.1s">
                <div className="score-card" style={{display:'inline-block',minWidth:160,marginBottom:14}}>
                  <div className="score-num" style={{color:scoreColor(is.innovationScore)}}>{is.innovationScore}<span style={{fontSize:'1rem',color:'var(--text-muted)' }}>/100</span></div>
                  <div className="score-label">Innovation</div>
                </div>
                <p style={{fontSize:'0.87rem',color:'var(--text-soft)',lineHeight:1.6,marginTop:8}}>{is.innovationReason}</p>
                {is.keyDifferentiator && <div className="key-diff" style={{marginTop:12}}>🔑 {is.keyDifferentiator}</div>}
              </Block>
            )}
          </div>

          {/* ── 4. ARCHITECTURE ── */}
          <div className={`tab-panel${activeTab === 'architecture' ? ' active' : ''}`}>
            <Block label="SYSTEM ARCHITECTURE DIAGRAM">
              {bp.architectureMermaid
                ? <SafeMermaid chart={bp.architectureMermaid} />
                : <p style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>No diagram generated.</p>}
            </Block>

            <Block label="ARCHITECTURE LAYERS" delay="0.1s">
              <div className="arch-diagram">
                {(bp.arch||[]).map((node:any,i:number)=>(
                  <div key={i} style={{display:'flex',alignItems:'center'}}>
                    <div className={`arch-card${node.hl?' highlight-card':''}`}>
                      <div className="arch-icon">{node.icon}</div>
                      <div className="arch-title">{node.title}</div>
                      <div className="arch-stack">{node.stack}</div>
                    </div>
                    {i<(bp.arch||[]).length-1 && <div className="arch-arrow">→</div>}
                  </div>
                ))}
              </div>
            </Block>

            {bp.systemDesignDetails && Object.keys(bp.systemDesignDetails).length > 0 && (
              <Block label="SYSTEM DESIGN DETAILS" delay="0.15s">
                {Object.entries(bp.systemDesignDetails).map(([key,val]:any) => val && (
                  <div key={key} style={{marginBottom:16}}>
                    <div className="tech-section-label">{key.replace(/([A-Z])/g,' $1').toUpperCase()}</div>
                    <p style={{fontSize:'0.85rem',color:'var(--text-soft)',lineHeight:1.6}}>{val}</p>
                  </div>
                ))}
              </Block>
            )}

            {bp.webIntel?.length > 0 && (
              <Block label="SECURITY INTELLIGENCE" delay="0.2s">
                <div className="intel-list">
                  {bp.webIntel.map((item:any,i:number)=>(
                    <div className="intel-item" key={i}>
                      <div className={`intel-dot ${item.status}`}/>
                      <div className="intel-info"><h4>{item.lib}</h4><p>{item.detail}</p></div>
                      <span className={`intel-badge ${item.status}`}>{item.badge}</span>
                    </div>
                  ))}
                </div>
              </Block>
            )}
          </div>

          {/* ── 5. REPOS & APIs ── */}
          <div className={`tab-panel${activeTab === 'resources' ? ' active' : ''}`}>
            {bp.githubRepos?.length > 0 ? (
              <Block label={`GITHUB REPOSITORIES (${bp.githubRepos.length})`}>
                <div className="search-results">
                  {bp.githubRepos.map((r:any,i:number)=>(
                    <a className="search-result-item" key={i} href={r.url||'#'} target="_blank" rel="noopener noreferrer">
                      <span className="result-type github">GITHUB</span>
                      <div className="result-info" style={{flex:1}}>
                        <h4 style={{display:'flex',alignItems:'center',gap:8}}>{r.name} {r.stars && <span style={{fontSize:'0.75rem',color:'var(--amber)'}}>★ {r.stars}</span>}</h4>
                        <p>{r.language && <span style={{color:'var(--primary)',marginRight:6}}>{r.language}</span>}{r.description}</p>
                        <span style={{fontSize:'0.7rem',background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',padding:'2px 8px',borderRadius:4,color:'var(--text-muted)',marginTop:4,display:'inline-block'}}>{r.relevance}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </Block>
            ) : (
              <Block label="GITHUB REPOSITORIES">
                <p style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>No repos found. Add a GITHUB_TOKEN to your .env for live results.</p>
              </Block>
            )}

            {bp.apisAndDatasets?.length > 0 ? (
              <Block label={`APIS & DATASETS (${bp.apisAndDatasets.length})`} delay="0.1s">
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {bp.apisAndDatasets.map((api:any,i:number)=>(
                    <div key={i} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'14px',background:'var(--bg-panel2)',border:'1px solid var(--border)',borderRadius:10}}>
                      <span style={{fontSize:'0.68rem',fontWeight:700,padding:'3px 8px',borderRadius:4,background:api.type==='api'?'rgba(124,58,237,0.1)':'rgba(34,197,94,0.1)',color:api.type==='api'?'#a78bfa':'var(--green)',whiteSpace:'nowrap',flexShrink:0}}>{api.type?.toUpperCase()}</span>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                          <h4 style={{fontSize:'0.88rem',color:'var(--text)'}}>{api.name}</h4>
                          {api.free && <span style={{fontSize:'0.66rem',background:'rgba(34,197,94,0.1)',color:'var(--green)',padding:'1px 6px',borderRadius:4}}>FREE</span>}
                        </div>
                        <p style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{api.purpose}</p>
                        {api.url && <a href={api.url} target="_blank" rel="noopener noreferrer" style={{fontSize:'0.75rem',color:'var(--primary)',textDecoration:'none'}}>{api.url}</a>}
                      </div>
                    </div>
                  ))}
                </div>
              </Block>
            ) : (
              <Block label="APIS & DATASETS" delay="0.1s">
                <p style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>Regenerate the blueprint to populate APIs and datasets.</p>
              </Block>
            )}
          </div>

          {/* ── 6. ROADMAP & TIMELINE ── */}
          <div className={`tab-panel${activeTab === 'timeline' ? ' active' : ''}`}>
            {bp.roadmap?.length > 0 && (
              <Block label="DEVELOPMENT ROADMAP">
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {bp.roadmap.map((phase:any,i:number)=>(
                    <div key={i} style={{display:'flex',gap:16,padding:'16px',background:'var(--bg-panel2)',border:'1px solid var(--border)',borderRadius:10}}>
                      <div style={{flexShrink:0,textAlign:'center'}}>
                        <div style={{background:'var(--primary)',color:'white',fontWeight:700,fontSize:'0.78rem',padding:'6px 12px',borderRadius:8,whiteSpace:'nowrap'}}>{phase.phase}</div>
                      </div>
                      <div>
                        <div style={{fontSize:'0.84rem',fontWeight:600,color:'var(--text)',marginBottom:6}}>{phase.milestone}</div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                          {(phase.goals||[]).map((g:string,j:number)=>(
                            <span key={j} style={{fontSize:'0.76rem',background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',color:'var(--text-soft)',padding:'3px 10px',borderRadius:6}}>✓ {g}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Block>
            )}

            <Block label="4-WEEK SPRINT PLAN" delay="0.1s">
              <div className="sprint-list">
                {(bp.sprints||[]).map((s:any,i:number)=>(
                  <div className={`sprint-item${s.done?' done':''}`} key={i}>
                    <div className="check">{s.done?'✓':''}</div>
                    <span className="sprint-week-badge">{s.week}</span>
                    <div>
                      <h4>{s.title}</h4><p>{s.desc}</p>
                      {s.milestones?.length>0 && <div className="milestone-tags">{s.milestones.map((m:string,j:number)=><span className="milestone-tag" key={j}>{m}</span>)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </Block>

            {bp.deploymentPlan && Object.keys(bp.deploymentPlan).length > 0 && (
              <Block label="DEPLOYMENT PLAN" delay="0.15s">
                {Object.entries(bp.deploymentPlan).map(([k,v]:any) => v && (
                  <div key={k} style={{marginBottom:12}}>
                    <div className="tech-section-label">{k.replace(/([A-Z])/g,' $1').toUpperCase()}</div>
                    <p style={{fontSize:'0.86rem',color:'var(--text-soft)'}}>{v}</p>
                  </div>
                ))}
              </Block>
            )}

            {bp.githubIssues?.length > 0 && (
              <Block label={`GITHUB ISSUES (${bp.githubIssues.length})`} delay="0.2s">
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {bp.githubIssues.slice(0,10).map((issue:any,i:number)=>(
                    <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'10px 12px',background:'var(--bg-panel2)',border:'1px solid var(--border)',borderRadius:8}}>
                      <span style={{color:'var(--green)',fontSize:'0.85rem',flexShrink:0}}>#{i+1}</span>
                      <div>
                        <div style={{fontSize:'0.86rem',color:'var(--text)',marginBottom:3}}>{issue.title}</div>
                        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                          {(issue.labels||[]).map((l:string)=><span className="tech-tag" key={l}>{l}</span>)}
                          <span style={{fontSize:'0.68rem',color:'var(--text-muted)'}}>Week {issue.week}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Block>
            )}
          </div>

          {/* ── 7. AI MENTOR ── */}
          <div className={`tab-panel${activeTab === 'mentor' ? ' active' : ''}`}>
            <Block label="AI SCRUM MASTER & TECH LEAD">
              <div className="mentor-chat-container">
                <div className="chat-messages">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`msg ${msg.from === 'user' ? 'user' : 'bot'}`}>
                      <span className="avatar">{msg.from === 'user' ? '👤' : '🧠'}</span>
                      <div className="bubble">
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="msg bot">
                      <span className="avatar">🧠</span>
                      <div className="bubble" style={{ opacity: 0.7 }}>
                        Thinking...
                      </div>
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
                    placeholder="Ask about architecture, setup, db migrations, or week 1 tasks..."
                    disabled={chatLoading}
                  />
                  <button onClick={sendMessage} disabled={chatLoading || !chatInput.trim()}>
                    Send
                  </button>
                </div>
              </div>
            </Block>
          </div>

          {/* ── 8. PRESENTATION DOC ── */}
          <div className={`tab-panel${activeTab === 'docs' ? ' active' : ''}`}>
            {bp.presentationDoc ? (
              <Block label="PRESENTATION-READY DOCUMENTATION">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', color: 'var(--text)' }}>{bp.title} — Executive Presentation</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Perfect for pitching to stakeholders, mentors, or investors.</p>
                    </div>
                    <button 
                      className="export-pdf-btn" 
                      onClick={() => {
                        const md = `
# ${bp.title} — Technical Presentation
> ${bp.tagline}

## Executive Summary
${bp.presentationDoc.executiveSummary}

## The Problem & Market Size
${bp.presentationDoc.problemSize}

## Proposed Solution
${bp.presentationDoc.proposedSolution}

## Unique Value Proposition
${bp.presentationDoc.uniqueValue}

## Team & Resource Requirements
${bp.presentationDoc.teamRequirements}

## Immediate Next Steps
${(bp.presentationDoc.nextSteps || []).map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')}
                        `.trim();
                        navigator.clipboard.writeText(md);
                        alert('Copied to clipboard as Markdown!');
                      }}
                    >
                      📋 Copy Markdown
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ padding: 18, background: 'var(--bg-panel2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                      <div className="tech-section-label" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Executive Summary</div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-soft)', lineHeight: 1.6, marginTop: 8 }}>{bp.presentationDoc.executiveSummary}</p>
                    </div>

                    <div style={{ padding: 18, background: 'var(--bg-panel2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                      <div className="tech-section-label" style={{ color: 'var(--amber)', fontWeight: 'bold' }}>The Problem & Market Opportunity</div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-soft)', lineHeight: 1.6, marginTop: 8 }}>{bp.presentationDoc.problemSize}</p>
                    </div>

                    <div style={{ padding: 18, background: 'var(--bg-panel2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                      <div className="tech-section-label" style={{ color: 'var(--green)', fontWeight: 'bold' }}>Proposed Solution</div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-soft)', lineHeight: 1.6, marginTop: 8 }}>{bp.presentationDoc.proposedSolution}</p>
                    </div>

                    <div style={{ padding: 18, background: 'var(--bg-panel2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                      <div className="tech-section-label" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Unique Value Proposition</div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-soft)', lineHeight: 1.6, marginTop: 8 }}>{bp.presentationDoc.uniqueValue}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ padding: 18, background: 'var(--bg-panel2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                      <div className="tech-section-label" style={{ color: 'var(--text-soft)', fontWeight: 'bold' }}>Team Requirements</div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-soft)', lineHeight: 1.6, marginTop: 8 }}>{bp.presentationDoc.teamRequirements}</p>
                    </div>

                    <div style={{ padding: 18, background: 'var(--bg-panel2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                      <div className="tech-section-label" style={{ color: 'var(--text)', fontWeight: 'bold' }}>Immediate Action Items</div>
                      <ul style={{ fontSize: '0.9rem', color: 'var(--text-soft)', lineHeight: 1.6, marginTop: 8, paddingLeft: 18 }}>
                        {(bp.presentationDoc.nextSteps || []).map((step: string, index: number) => (
                          <li key={index} style={{ marginBottom: 6 }}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Block>
            ) : (
              <Block label="PRESENTATION-READY DOCUMENTATION">
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Regenerate the blueprint to generate a presentation-ready executive deck.</p>
              </Block>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
