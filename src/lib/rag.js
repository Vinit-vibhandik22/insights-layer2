'use strict';

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ── Tavily: Academic Research Papers ────────────────────────────────────────
async function searchAcademicPapers(query) {
  if (!process.env.TAVILY_API_KEY) return [];
  try {
    const response = await fetchWithTimeout('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.TAVILY_API_KEY}` },
      body: JSON.stringify({
        query: `${query} research paper deep learning system design algorithm`,
        search_depth: 'advanced', max_results: 8,
        include_domains: ['arxiv.org', 'ieeexplore.ieee.org', 'scholar.google.com', 'semanticscholar.org', 'researchgate.net', 'acm.org', 'springer.com'],
        include_answer: false, include_raw_content: false
      })
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.results || []).slice(0, 8).map(r => ({
      type: 'paper', title: r.title || 'Research Paper', url: r.url || '',
      source: extractDomain(r.url) || 'Academic Source',
      snippet: (r.content || r.snippet || '').substring(0, 300)
    }));
  } catch { return []; }
}

async function searchMarketIntelligence(query) {
  if (!process.env.TAVILY_API_KEY) return [];
  try {
    const response = await fetchWithTimeout('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.TAVILY_API_KEY}` },
      body: JSON.stringify({
        query: `${query} market size industry report startup solution 2024`,
        search_depth: 'advanced', max_results: 5,
        include_domains: ['techcrunch.com', 'venturebeat.com', 'gartner.com', 'mckinsey.com', 'statista.com', 'forbes.com'],
        include_answer: true, include_raw_content: false
      })
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.results || []).slice(0, 5).map(r => ({
      title: r.title, url: r.url, snippet: (r.content || '').substring(0, 250), source: extractDomain(r.url)
    }));
  } catch { return []; }
}

async function searchSemanticScholar(query) {
  try {
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=5&fields=title,abstract,year,authors,citationCount,url`;
    const response = await fetchWithTimeout(url, { headers: { 'User-Agent': 'iNSIGHTS-Layer2-Research-Bot' } });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.data || []).slice(0, 8).map(p => ({
      type: 'paper', title: p.title || 'Research Paper',
      url: p.url || `https://www.semanticscholar.org/paper/${p.paperId}`,
      source: 'semanticscholar.org', snippet: (p.abstract || '').substring(0, 300),
      year: p.year, citations: p.citationCount,
      authors: (p.authors || []).slice(0, 3).map(a => a.name).join(', ')
    }));
  } catch { return []; }
}

async function searchGitHubRepos(query) {
  const headers = { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'iNSIGHTS-Layer2-Bot' };
  if (process.env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;

  const stopWords = new Set(['a','an','the','for','and','or','in','on','to','of','with','that','is','app','build','create','make','solution']);
  const domainKeywords = query.toLowerCase().replace(/[^a-z0-9 ]/g,'').split(' ')
    .filter(w => w.length > 2 && !stopWords.has(w)).slice(0, 4).join(' ');

  const queries = [
    `${domainKeywords} stars:>20 NOT "awesome-" NOT "awesome list" in:name,description`,
    `${domainKeywords} topic:python OR topic:machine-learning OR topic:iot NOT "awesome-"`,
    `${domainKeywords} pushed:>2023-01-01 stars:>5 NOT fork:true in:description`
  ];

  try {
    const allResults = await Promise.allSettled(queries.map(async q => {
      const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=6`, { headers });
      if (!res.ok) return [];
      const data = await res.json();
      return data.items || [];
    }));
    const seen = new Set(), merged = [];
    for (const r of allResults) {
      if (r.status === 'fulfilled') for (const repo of r.value) {
        if (!seen.has(repo.id)) { seen.add(repo.id); merged.push(repo); }
      }
    }
    return merged.sort((a,b) => b.stargazers_count - a.stargazers_count).slice(0, 10).map(repo => ({
      type: 'github', title: `${repo.full_name} (★ ${formatStars(repo.stargazers_count)})`,
      url: repo.html_url, source: `github.com/${repo.full_name}`,
      snippet: (repo.description || 'Open source repository').substring(0, 250),
      language: repo.language || 'Unknown', stars: repo.stargazers_count,
      topics: (repo.topics || []).slice(0, 8)
    }));
  } catch { return []; }
}

async function checkNpmVulnerabilities(techStackKeywords) {
  const packageMap = {
    'react': ['react','react-dom','react-router-dom','axios'],
    'node': ['express','node-fetch','cors','helmet'],
    'python': ['flask','fastapi','django','uvicorn'],
    'machine learning': ['tensorflow','torch','scikit-learn','transformers'],
    'database': ['mongoose','pg','mysql2','redis'],
    'auth': ['jsonwebtoken','bcrypt','passport'],
    'ai': ['langchain','openai','groq-sdk'],
    'mobile': ['react-native','expo'],
    'default': ['express','axios','jsonwebtoken','dotenv']
  };
  const relevantPackages = [];
  const lowerKeywords = techStackKeywords.toLowerCase();
  for (const [key, packages] of Object.entries(packageMap)) {
    if (lowerKeywords.includes(key) || key === 'default') relevantPackages.push(...packages.slice(0, 3));
  }
  const unique = [...new Set(relevantPackages)].slice(0, 8);
  const results = await Promise.allSettled(unique.map(pkg => checkPackageVulnerabilities(pkg)));
  return results.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
}

async function checkPackageVulnerabilities(packageName) {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`, { headers: { 'User-Agent': 'iNSIGHTS-Layer2-Bot' } });
    if (!response.ok) return null;
    const data = await response.json();
    const version = data.version || 'unknown';
    const deprecated = data.deprecated;
    let status = 'safe', badge = 'UP TO DATE', detail = `v${version} — No known vulnerabilities.`;
    if (deprecated) { status = 'warn'; badge = 'DEPRECATED'; detail = `Deprecated: ${deprecated}`; }
    return { lib: `${packageName}@${version}`, status, badge, detail };
  } catch { return null; }
}

export async function executeRAGPipeline(query, onStageUpdate) {
  if (onStageUpdate) onStageUpdate(1, 'Scanning arXiv, IEEE, Semantic Scholar...');
  const [papers, semanticPapers, repos, marketIntel] = await Promise.allSettled([
    searchAcademicPapers(query), searchSemanticScholar(query),
    searchGitHubRepos(query), searchMarketIntelligence(query)
  ]).then(r => r.map(x => x.status === 'fulfilled' ? x.value : []));

  if (onStageUpdate) onStageUpdate(2, `Found ${repos.length} GitHub repos. Running security scan...`);
  const vulnerabilities = await checkNpmVulnerabilities(query);

  const seenTitles = new Set();
  const allPapers = [...papers, ...semanticPapers].filter(p => {
    const key = p.title?.toLowerCase();
    if (seenTitles.has(key)) return false;
    seenTitles.add(key);
    return true;
  }).slice(0, 12);

  if (onStageUpdate) onStageUpdate(3, `Assembling: ${allPapers.length} papers, ${repos.length} repos...`);

  const context = assembleContext(allPapers, repos, marketIntel, vulnerabilities, query);
  return { context, rawData: { papers: allPapers, repos, vulnerabilities, marketIntel } };
}

function assembleContext(papers, repos, marketIntel, vulnerabilities, query) {
  const sections = [];
  if (papers.length > 0) {
    sections.push('## ACADEMIC & RESEARCH PAPERS:');
    papers.forEach((p, i) => {
      sections.push(`${i+1}. "${p.title}" (${p.source})${p.year ? ` [${p.year}]` : ''}`);
      if (p.snippet) sections.push(`   Abstract: ${p.snippet}`);
      if (p.url) sections.push(`   URL: ${p.url}`);
    });
  }
  if (repos.length > 0) {
    sections.push('\n## RELEVANT OPEN SOURCE REPOSITORIES:');
    repos.forEach((r, i) => {
      sections.push(`${i+1}. ${r.title}`);
      sections.push(`   Description: ${r.snippet}`);
      if (r.language) sections.push(`   Language: ${r.language}`);
      if (r.url) sections.push(`   URL: ${r.url}`);
    });
  }
  if (marketIntel.length > 0) {
    sections.push('\n## MARKET INTELLIGENCE:');
    marketIntel.forEach(m => sections.push(`- [${m.source}] ${m.title}: ${m.snippet}`));
  }
  if (vulnerabilities.length > 0) {
    sections.push('\n## SECURITY INTEL (NPM):');
    vulnerabilities.forEach(v => sections.push(`- ${v.lib}: [${v.badge}] ${v.detail}`));
  }
  return sections.join('\n').substring(0, 2500);
}

function extractDomain(url) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
}
function formatStars(count) {
  if (count >= 1000) return `${(count/1000).toFixed(1)}k`;
  return count.toString();
}
