'use strict';

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// ── Tavily: Academic Research Papers ────────────────────────────────────────
async function searchAcademicPapers(query) {
  if (!process.env.TAVILY_API_KEY) return [];
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.TAVILY_API_KEY}` },
      body: JSON.stringify({
        query: `${query} research paper deep learning system design algorithm`,
        search_depth: 'advanced',
        max_results: 8,
        include_domains: ['arxiv.org', 'ieeexplore.ieee.org', 'scholar.google.com', 'semanticscholar.org', 'researchgate.net', 'acm.org', 'springer.com', 'nature.com'],
        include_answer: false,
        include_raw_content: false
      })
    });
    if (!response.ok) return [];
    const data = await response.json();
    const results = (data.results || []).slice(0, 8).map(r => ({
      type: 'paper',
      title: r.title || 'Research Paper',
      url: r.url || '',
      source: extractDomain(r.url) || 'Academic Source',
      snippet: (r.content || r.snippet || '').substring(0, 300)
    }));
    console.log(`[RAG] Tavily (academic) found ${results.length} papers`);
    return results;
  } catch (err) {
    console.error('[RAG] Tavily academic search failed:', err.message);
    return [];
  }
}

// ── Tavily: Market & Industry Intelligence ───────────────────────────────────
async function searchMarketIntelligence(query) {
  if (!process.env.TAVILY_API_KEY) return [];
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.TAVILY_API_KEY}` },
      body: JSON.stringify({
        query: `${query} market size industry report startup solution 2024`,
        search_depth: 'advanced',
        max_results: 5,
        include_domains: ['techcrunch.com', 'venturebeat.com', 'gartner.com', 'mckinsey.com', 'statista.com', 'forbes.com', 'wired.com'],
        include_answer: true,
        include_raw_content: false
      })
    });
    if (!response.ok) return [];
    const data = await response.json();
    console.log(`[RAG] Tavily (market) found ${(data.results || []).length} results`);
    return (data.results || []).slice(0, 5).map(r => ({
      title: r.title,
      url: r.url,
      snippet: (r.content || '').substring(0, 250),
      source: extractDomain(r.url)
    }));
  } catch (err) {
    return [];
  }
}

// ── Tavily: Technical Implementation Context ─────────────────────────────────
async function searchImplementationContext(query) {
  if (!process.env.TAVILY_API_KEY) return [];
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.TAVILY_API_KEY}` },
      body: JSON.stringify({
        query: `${query} architecture design pattern microservices API best practices production`,
        search_depth: 'advanced',
        max_results: 5,
        include_answer: true,
        include_raw_content: false
      })
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.results || []).slice(0, 5).map(r => ({
      title: r.title,
      url: r.url,
      snippet: (r.content || '').substring(0, 250),
      source: extractDomain(r.url)
    }));
  } catch (err) {
    return [];
  }
}

// ── Semantic Scholar: Deep Paper Discovery ───────────────────────────────────
async function searchSemanticScholar(query) {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encoded}&limit=8&fields=title,abstract,year,authors,citationCount,externalIds,url`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'iNSIGHTS-Layer2-Research-Bot' }
    });
    if (!response.ok) return [];
    const data = await response.json();
    const papers = (data.data || []).slice(0, 8).map(p => ({
      type: 'paper',
      title: p.title || 'Research Paper',
      url: p.url || `https://www.semanticscholar.org/paper/${p.paperId}`,
      source: 'semanticscholar.org',
      snippet: (p.abstract || '').substring(0, 300),
      year: p.year,
      citations: p.citationCount,
      authors: (p.authors || []).slice(0, 3).map(a => a.name).join(', ')
    }));
    console.log(`[RAG] Semantic Scholar found ${papers.length} papers`);
    return papers;
  } catch (err) {
    console.error('[RAG] Semantic Scholar failed:', err.message);
    return [];
  }
}

// ── GitHub: Multi-Query Deep Repo Discovery ──────────────────────────────────
async function searchGitHubRepos(query) {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'iNSIGHTS-Layer2-Bot'
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  // Run 3 GitHub queries in parallel: starred repos, recent repos, topic-based
  const queries = [
    `${query} in:readme in:description`,
    `${query} topic:machine-learning topic:ai stars:>50`,
    `${query} in:name language:python OR language:javascript stars:>10`
  ];

  try {
    const allResults = await Promise.allSettled(
      queries.map(async q => {
        const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=5`;
        const res = await fetch(url, { headers });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.items || []);
      })
    );

    // Merge, deduplicate by repo ID, sort by stars
    const seen = new Set();
    const merged = [];
    for (const result of allResults) {
      if (result.status === 'fulfilled') {
        for (const repo of result.value) {
          if (!seen.has(repo.id)) {
            seen.add(repo.id);
            merged.push(repo);
          }
        }
      }
    }

    const repos = merged
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 10)
      .map(repo => ({
        type: 'github',
        title: `${repo.full_name} (★ ${formatStars(repo.stargazers_count)})`,
        url: repo.html_url,
        source: `github.com/${repo.full_name}`,
        snippet: (repo.description || 'Open source repository').substring(0, 250),
        language: repo.language || 'Unknown',
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        topics: (repo.topics || []).slice(0, 8),
        lastUpdated: repo.updated_at?.split('T')[0]
      }));

    console.log(`[RAG] GitHub found ${repos.length} unique repositories`);
    return repos;
  } catch (err) {
    console.error('[RAG] GitHub search failed:', err.message);
    return [];
  }
}

// ── NPM Security & Vulnerability Check ──────────────────────────────────────
async function checkNpmVulnerabilities(techStackKeywords) {
  const packageMap = {
    'react': ['react', 'react-dom', 'react-router-dom', 'axios'],
    'node': ['express', 'node-fetch', 'cors', 'helmet'],
    'python': ['flask', 'fastapi', 'django', 'uvicorn'],
    'machine learning': ['tensorflow', 'torch', 'scikit-learn', 'transformers'],
    'database': ['mongoose', 'pg', 'mysql2', 'redis'],
    'auth': ['jsonwebtoken', 'bcrypt', 'passport', 'clerk'],
    'ai': ['langchain', 'openai', 'anthropic', 'groq-sdk'],
    'mobile': ['react-native', 'expo', '@expo/vector-icons'],
    'maps': ['leaflet', 'mapbox-gl', 'google-maps-react'],
    'iot': ['mqtt', 'socket.io', 'serialport'],
    'default': ['express', 'axios', 'jsonwebtoken', 'dotenv']
  };

  const relevantPackages = [];
  const lowerKeywords = techStackKeywords.toLowerCase();
  for (const [key, packages] of Object.entries(packageMap)) {
    if (lowerKeywords.includes(key) || key === 'default') {
      relevantPackages.push(...packages.slice(0, 3));
    }
  }

  const uniquePackages = [...new Set(relevantPackages)].slice(0, 8);
  const vulnResults = await Promise.allSettled(uniquePackages.map(pkg => checkPackageVulnerabilities(pkg)));
  return vulnResults.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
}

async function checkPackageVulnerabilities(packageName) {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`, {
      headers: { 'User-Agent': 'iNSIGHTS-Layer2-Bot' }
    });
    if (!response.ok) return null;
    const data = await response.json();
    const version = data.version || 'unknown';
    const deprecated = data.deprecated;

    const advisoryResponse = await fetch('https://registry.npmjs.org/-/npm/v1/security/advisories/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'iNSIGHTS-Layer2-Bot' },
      body: JSON.stringify({ [packageName]: [version] })
    });

    let vulnerabilities = [];
    if (advisoryResponse.ok) {
      const advisoryData = await advisoryResponse.json();
      vulnerabilities = advisoryData[packageName] || [];
    }

    let status = 'safe', badge = 'UP TO DATE', detail = `v${version} — No known vulnerabilities.`;
    if (deprecated) {
      status = 'warn'; badge = 'DEPRECATED'; detail = `Deprecated: ${deprecated}`;
    } else if (vulnerabilities.length > 0) {
      const levels = ['info', 'low', 'moderate', 'high', 'critical'];
      const highestSeverity = vulnerabilities.reduce((max, v) =>
        levels.indexOf(v.severity) > levels.indexOf(max) ? v.severity : max, 'info');
      status = highestSeverity === 'critical' || highestSeverity === 'high' ? 'critical' : 'warn';
      badge = 'CVE FOUND';
      detail = `${vulnerabilities.length} vulnerability(ies). Severity: ${highestSeverity}.`;
    }
    return { lib: `${packageName}@${version}`, status, badge, detail };
  } catch (err) {
    return null;
  }
}

// ── Main RAG Pipeline Orchestrator ──────────────────────────────────────────
async function executeRAGPipeline(query, onStageUpdate) {
  console.log(`[RAG] Starting DEEP pipeline for query: "${query}"`);
  const startTime = Date.now();

  if (onStageUpdate) onStageUpdate(1, '🔬 Scanning arXiv, IEEE, ACM, Semantic Scholar for research papers...');

  // All searches fire in parallel
  const [papers, semanticPapers, repos, marketIntel, implContext] = await Promise.allSettled([
    searchAcademicPapers(query),
    searchSemanticScholar(query),
    searchGitHubRepos(query),
    searchMarketIntelligence(query),
    searchImplementationContext(query)
  ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : []));

  if (onStageUpdate) onStageUpdate(2, `🐙 Found ${repos.length} GitHub repos. Running security scan...`);
  const vulnerabilities = await checkNpmVulnerabilities(query);

  // Merge academic + semantic scholar papers, dedup by title
  const seenTitles = new Set();
  const allPapers = [...papers, ...semanticPapers].filter(p => {
    const key = p.title?.toLowerCase();
    if (seenTitles.has(key)) return false;
    seenTitles.add(key);
    return true;
  }).slice(0, 12);

  if (onStageUpdate) onStageUpdate(3, `📊 Assembling intelligence: ${allPapers.length} papers, ${repos.length} repos...`);

  const context = assembleContext(allPapers, repos, marketIntel, implContext, vulnerabilities, query);

  const elapsed = Date.now() - startTime;
  console.log(`[RAG] Deep pipeline complete in ${elapsed}ms. Papers: ${allPapers.length}, Repos: ${repos.length}, Vulns: ${vulnerabilities.length}`);

  return {
    context,
    rawData: { papers: allPapers, repos, vulnerabilities, marketIntel, implContext }
  };
}

// ── Context Assembly ─────────────────────────────────────────────────────────
function assembleContext(papers, repos, marketIntel, implContext, vulnerabilities, query) {
  const sections = [];

  if (papers.length > 0) {
    sections.push('## ACADEMIC & RESEARCH PAPERS FOUND:');
    papers.forEach((p, i) => {
      sections.push(`${i + 1}. "${p.title}" (${p.source})${p.year ? ` [${p.year}]` : ''}${p.citations ? ` | ${p.citations} citations` : ''}`);
      if (p.authors) sections.push(`   Authors: ${p.authors}`);
      if (p.snippet) sections.push(`   Abstract: ${p.snippet}`);
      if (p.url) sections.push(`   URL: ${p.url}`);
    });
  }

  if (repos.length > 0) {
    sections.push('\n## RELEVANT OPEN SOURCE REPOSITORIES:');
    repos.forEach((r, i) => {
      sections.push(`${i + 1}. ${r.title}`);
      sections.push(`   Description: ${r.snippet}`);
      if (r.language) sections.push(`   Primary Language: ${r.language}`);
      if (r.topics?.length) sections.push(`   Topics: ${r.topics.join(', ')}`);
      if (r.url) sections.push(`   URL: ${r.url}`);
    });
  }

  if (marketIntel.length > 0) {
    sections.push('\n## MARKET & INDUSTRY INTELLIGENCE:');
    marketIntel.forEach(m => {
      sections.push(`- [${m.source}] ${m.title}: ${m.snippet}`);
    });
  }

  if (implContext.length > 0) {
    sections.push('\n## TECHNICAL IMPLEMENTATION BEST PRACTICES:');
    implContext.forEach(c => {
      sections.push(`- [${c.source}] ${c.title}: ${c.snippet}`);
    });
  }

  if (vulnerabilities.length > 0) {
    sections.push('\n## SECURITY INTEL (NPM Packages):');
    vulnerabilities.forEach(v => {
      sections.push(`- ${v.lib}: [${v.badge}] ${v.detail}`);
    });
  }

  // Expand context budget to 8000 chars for richer LLM grounding
  return sections.join('\n').substring(0, 8000);
}

// ── Utility ──────────────────────────────────────────────────────────────────
function extractDomain(url) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
}

function formatStars(count) {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

module.exports = { executeRAGPipeline, searchAcademicPapers, searchGitHubRepos, checkNpmVulnerabilities };
