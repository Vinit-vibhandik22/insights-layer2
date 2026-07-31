'use strict';

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// ── Tavily Search for Academic Papers ──────────────────────────────────────
async function searchAcademicPapers(query) {
  if (!process.env.TAVILY_API_KEY) {
    console.warn('[RAG] Tavily API key not set - skipping academic search');
    return [];
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`
      },
      body: JSON.stringify({
        query: `${query} research paper IEEE arXiv machine learning`,
        search_depth: 'advanced',
        max_results: 5,
        include_domains: ['arxiv.org', 'ieeexplore.ieee.org', 'scholar.google.com', 'semanticscholar.org', 'researchgate.net'],
        include_answer: false,
        include_raw_content: false
      })
    });

    if (!response.ok) {
      console.error('[RAG] Tavily error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    const results = (data.results || []).slice(0, 5).map(r => ({
      type: 'paper',
      title: r.title || 'Research Paper',
      url: r.url || '',
      source: extractDomain(r.url) || 'Academic Source',
      snippet: (r.content || r.snippet || '').substring(0, 200)
    }));

    console.log(`[RAG] Tavily found ${results.length} academic papers`);
    return results;
  } catch (err) {
    console.error('[RAG] Tavily search failed:', err.message);
    return [];
  }
}

// ── GitHub Repository Search ────────────────────────────────────────────────
async function searchGitHubRepos(query) {
  try {
    const searchQuery = encodeURIComponent(`${query} in:readme in:description`);
    const url = `https://api.github.com/search/repositories?q=${searchQuery}&sort=stars&order=desc&per_page=5`;

    const headers = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'iNSIGHTS-Layer2-Bot'
    };

    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.error('[RAG] GitHub search error:', response.status);
      return [];
    }

    const data = await response.json();
    const results = (data.items || []).slice(0, 5).map(repo => ({
      type: 'github',
      title: `${repo.full_name} (★ ${formatStars(repo.stargazers_count)})`,
      url: repo.html_url,
      source: `github.com/${repo.full_name}`,
      snippet: (repo.description || 'Open source repository').substring(0, 200),
      language: repo.language || 'Unknown',
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      topics: (repo.topics || []).slice(0, 5)
    }));

    console.log(`[RAG] GitHub found ${results.length} repositories`);
    return results;
  } catch (err) {
    console.error('[RAG] GitHub search failed:', err.message);
    return [];
  }
}

// ── NPM Security & Vulnerability Check ─────────────────────────────────────
async function checkNpmVulnerabilities(techStackKeywords) {
  // Common packages associated with tech stacks
  const packageMap = {
    'react': ['react', 'react-dom', 'react-router-dom'],
    'node': ['express', 'node-fetch', 'axios'],
    'python': ['flask', 'fastapi', 'django'],
    'machine learning': ['tensorflow', 'torch', 'scikit-learn'],
    'database': ['mongoose', 'pg', 'mysql2'],
    'auth': ['jsonwebtoken', 'bcrypt', 'passport'],
    'ai': ['langchain', 'openai', 'anthropic'],
    'default': ['express', 'axios', 'jsonwebtoken', 'node-fetch']
  };

  const relevantPackages = [];
  const lowerKeywords = techStackKeywords.toLowerCase();

  for (const [key, packages] of Object.entries(packageMap)) {
    if (lowerKeywords.includes(key) || key === 'default') {
      relevantPackages.push(...packages.slice(0, 2));
    }
  }

  const uniquePackages = [...new Set(relevantPackages)].slice(0, 6);

  const vulnResults = await Promise.allSettled(
    uniquePackages.map(pkg => checkPackageVulnerabilities(pkg))
  );

  return vulnResults
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);
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

    // Check npm audit advisory API
    const advisoryResponse = await fetch('https://registry.npmjs.org/-/npm/v1/security/advisories/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'iNSIGHTS-Layer2-Bot'
      },
      body: JSON.stringify({ [packageName]: [version] })
    });

    let vulnerabilities = [];
    if (advisoryResponse.ok) {
      const advisoryData = await advisoryResponse.json();
      vulnerabilities = advisoryData[packageName] || [];
    }

    let status = 'safe';
    let badge = 'UP TO DATE';
    let detail = `v${version} - No known vulnerabilities.`;

    if (deprecated) {
      status = 'warn';
      badge = 'DEPRECATED';
      detail = `Deprecated: ${deprecated}`;
    } else if (vulnerabilities.length > 0) {
      const highestSeverity = vulnerabilities.reduce((max, v) => {
        const levels = ['info', 'low', 'moderate', 'high', 'critical'];
        return levels.indexOf(v.severity) > levels.indexOf(max) ? v.severity : max;
      }, 'info');

      status = highestSeverity === 'critical' || highestSeverity === 'high' ? 'critical' : 'warn';
      badge = 'CVE FOUND';
      detail = `${vulnerabilities.length} vulnerability(ies) found. Severity: ${highestSeverity}.`;
    }

    return {
      lib: `${packageName}@${version}`,
      status,
      badge,
      detail
    };
  } catch (err) {
    return null;
  }
}

// ── General Web Search via Tavily ───────────────────────────────────────────
async function searchWebContext(query) {
  if (!process.env.TAVILY_API_KEY) return [];

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`
      },
      body: JSON.stringify({
        query: `${query} project implementation tutorial best practices`,
        search_depth: 'basic',
        max_results: 3,
        include_answer: true
      })
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.results || [];
  } catch (err) {
    return [];
  }
}

// ── Main RAG Pipeline Orchestrator ─────────────────────────────────────────
async function executeRAGPipeline(query, onStageUpdate) {
  console.log(`[RAG] Starting pipeline for query: "${query}"`);
  const startTime = Date.now();

  // Stage 1: Parallel search execution
  if (onStageUpdate) onStageUpdate(1, 'Querying academic databases (arXiv, IEEE)...');

  const [papers, repos, webContext] = await Promise.allSettled([
    searchAcademicPapers(query),
    searchGitHubRepos(query),
    searchWebContext(query)
  ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : []));

  if (onStageUpdate) onStageUpdate(2, 'Discovering GitHub repositories...');

  // Stage 2: NPM vulnerability scan based on context
  if (onStageUpdate) onStageUpdate(3, 'Scanning for security vulnerabilities...');
  const vulnerabilities = await checkNpmVulnerabilities(query);

  // Assemble context for LLM
  const context = assembleContext(papers, repos, webContext, vulnerabilities, query);

  const elapsed = Date.now() - startTime;
  console.log(`[RAG] Pipeline complete in ${elapsed}ms. Papers: ${papers.length}, Repos: ${repos.length}, Vulns: ${vulnerabilities.length}`);

  return {
    context,
    rawData: { papers, repos, vulnerabilities }
  };
}

// ── Context Assembly ────────────────────────────────────────────────────────
function assembleContext(papers, repos, webContext, vulnerabilities, query) {
  const sections = [];

  if (papers.length > 0) {
    sections.push('## ACADEMIC RESEARCH FOUND:');
    papers.forEach((p, i) => {
      sections.push(`${i + 1}. "${p.title}" (${p.source})`);
      if (p.snippet) sections.push(`   Summary: ${p.snippet}`);
      if (p.url) sections.push(`   URL: ${p.url}`);
    });
  }

  if (repos.length > 0) {
    sections.push('\n## RELEVANT GITHUB REPOSITORIES:');
    repos.forEach((r, i) => {
      sections.push(`${i + 1}. ${r.title} - ${r.snippet}`);
      if (r.language) sections.push(`   Stack: ${r.language}`);
      if (r.url) sections.push(`   URL: ${r.url}`);
    });
  }

  if (vulnerabilities.length > 0) {
    sections.push('\n## SECURITY INTEL (NPM Packages):');
    vulnerabilities.slice(0, 5).forEach(v => {
      sections.push(`- ${v.lib}: [${v.badge}] ${v.detail}`);
    });
  }

  if (webContext.length > 0) {
    sections.push('\n## WEB CONTEXT:');
    webContext.slice(0, 2).forEach(w => {
      if (w.content) sections.push(`- ${(w.content || '').substring(0, 300)}`);
    });
  }

  // Cap context at ~4000 chars to stay within token budget
  const fullContext = sections.join('\n');
  return fullContext.substring(0, 4000);
}

// ── Utility Functions ───────────────────────────────────────────────────────
function extractDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

function formatStars(count) {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

module.exports = { executeRAGPipeline, searchAcademicPapers, searchGitHubRepos, checkNpmVulnerabilities };
