'use strict';

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const GITHUB_API = 'https://api.github.com';

function getHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
    'User-Agent': 'iNSIGHTS-Layer2-Bot'
  };
}

// ── Create Repository ─────────────────────────────────────────────────────
async function createRepository(token, { name, description, isPrivate = true }) {
  console.log(`[GitHub] Creating repository: ${name}`);

  const response = await fetch(`${GITHUB_API}/user/repos`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({
      name,
      description,
      private: isPrivate,
      auto_init: false,
      has_issues: true,
      has_wiki: false,
      has_projects: true
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create repo: ${error.message || response.statusText}`);
  }

  const repo = await response.json();
  console.log(`[GitHub] Repository created: ${repo.full_name}`);
  return repo;
}

// ── Get Authenticated User ────────────────────────────────────────────────
async function getAuthenticatedUser(token) {
  const response = await fetch(`${GITHUB_API}/user`, {
    headers: getHeaders(token)
  });

  if (!response.ok) throw new Error('Failed to get authenticated user');
  return response.json();
}

// ── Create or Update File ─────────────────────────────────────────────────
async function createOrUpdateFile(token, owner, repo, path, content, message) {
  const encodedContent = Buffer.from(content, 'utf-8').toString('base64');

  // Check if file exists first
  let sha = null;
  try {
    const checkResponse = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, {
      headers: getHeaders(token)
    });
    if (checkResponse.ok) {
      const existing = await checkResponse.json();
      sha = existing.sha;
    }
  } catch (_) { /* File doesn't exist, that's fine */ }

  const body = {
    message,
    content: encodedContent
  };
  if (sha) body.sha = sha;

  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create file ${path}: ${error.message || response.statusText}`);
  }

  return response.json();
}

// ── Create Milestone ──────────────────────────────────────────────────────
async function createMilestone(token, owner, repo, { title, description, dueDate }) {
  const body = { title, description };
  if (dueDate) body.due_on = dueDate;

  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/milestones`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.json();
    console.warn(`[GitHub] Milestone creation warning: ${err.message}`);
    return null;
  }

  return response.json();
}

// ── Create Issue ──────────────────────────────────────────────────────────
async function createIssue(token, owner, repo, { title, body, labels, milestoneNumber }) {
  const issueBody = {
    title,
    body: body || title,
    labels: labels || []
  };
  if (milestoneNumber) issueBody.milestone = milestoneNumber;

  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(issueBody)
  });

  if (!response.ok) {
    const err = await response.json();
    console.warn(`[GitHub] Issue creation warning: ${err.message}`);
    return null;
  }

  return response.json();
}

// ── Create Labels ─────────────────────────────────────────────────────────
async function createLabel(token, owner, repo, { name, color, description }) {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/labels`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ name, color, description: description || '' })
  });

  if (!response.ok) return null; // Label might already exist
  return response.json();
}

// ── Main Provisioning Orchestrator ────────────────────────────────────────
async function provisionProject(token, blueprint, options = {}) {
  const {
    repoName,
    isPrivate = true,
    includeReadme = true,
    includeIssues = true,
    includeEnvTemplate = true,
    includeMilestones = true
  } = options;

  const results = {
    repository: null,
    readme: null,
    envTemplate: null,
    milestones: [],
    issues: [],
    errors: []
  };

  // Step 1: Get user info
  const user = await getAuthenticatedUser(token);
  const owner = user.login;
  console.log(`[GitHub] Provisioning for user: ${owner}`);

  // Step 2: Create repository
  const repo = await createRepository(token, {
    name: repoName,
    description: `${blueprint.tagline || blueprint.title} | Generated by iNSIGHTS Layer 2`,
    isPrivate
  });
  results.repository = { url: repo.html_url, fullName: repo.full_name };

  // Step 3: Create initial labels
  const labelDefs = [
    { name: 'P0', color: 'B60205', description: 'Critical priority' },
    { name: 'P1', color: 'E4E669', description: 'High priority' },
    { name: 'P2', color: '0075CA', description: 'Medium priority' },
    { name: 'setup', color: 'BFDADC', description: 'Project setup' },
    { name: 'feature', color: 'A2EEEF', description: 'New feature' },
    { name: 'ai/ml', color: 'D93F0B', description: 'AI/ML related' },
    { name: 'backend', color: 'E4E669', description: 'Backend work' },
    { name: 'frontend', color: '0052CC', description: 'Frontend work' },
    { name: 'database', color: '5319E7', description: 'Database work' }
  ];

  await Promise.allSettled(
    labelDefs.map(label => createLabel(token, owner, repo.name, label))
  );

  // Step 4: Create README
  if (includeReadme) {
    const { buildReadmeContent } = require('../utils/prompt-builder');
    const readmeContent = buildReadmeContent(blueprint, repoName);
    try {
      await createOrUpdateFile(token, owner, repo.name, 'README.md', readmeContent, '🚀 Initial commit: Add AI-generated README');
      results.readme = { created: true };
    } catch (err) {
      results.errors.push(`README: ${err.message}`);
    }
  }

  // Step 5: Create .env.example
  if (includeEnvTemplate) {
    const envContent = generateEnvTemplate(blueprint);
    try {
      await createOrUpdateFile(token, owner, repo.name, '.env.example', envContent, '🔧 Add environment variables template');
      results.envTemplate = { created: true };
    } catch (err) {
      results.errors.push(`.env.example: ${err.message}`);
    }
  }

  // Step 6: Create milestones
  if (includeMilestones && blueprint.sprints) {
    const milestoneMap = {};
    const today = new Date();

    for (let i = 0; i < blueprint.sprints.length; i++) {
      const sprint = blueprint.sprints[i];
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + (i + 1) * 7);

      const milestone = await createMilestone(token, owner, repo.name, {
        title: `${sprint.week}: ${sprint.title}`,
        description: sprint.desc,
        dueDate: dueDate.toISOString()
      });

      if (milestone) {
        milestoneMap[i + 1] = milestone.number;
        results.milestones.push({
          number: milestone.number,
          title: milestone.title
        });
      }
    }

    // Step 7: Create GitHub Issues from sprint tasks
    if (includeIssues && blueprint.githubIssues && blueprint.githubIssues.length > 0) {
      for (const issue of blueprint.githubIssues) {
        const created = await createIssue(token, owner, repo.name, {
          title: issue.title,
          body: issue.body || `## Task\n\n${issue.title}\n\n## Acceptance Criteria\n\n- [ ] Implementation complete\n- [ ] Tests written\n- [ ] Code reviewed`,
          labels: issue.labels || ['feature'],
          milestoneNumber: milestoneMap[issue.week] || null
        });

        if (created) {
          results.issues.push({
            number: created.number,
            title: created.title,
            url: created.html_url
          });
        }

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 100));
      }
    } else if (includeIssues) {
      // Fallback: generate issues from sprints if no githubIssues field
      for (const sprint of blueprint.sprints) {
        const weekNum = parseInt(sprint.week.replace('W', ''));
        const created = await createIssue(token, owner, repo.name, {
          title: `[${sprint.week}] ${sprint.title}`,
          body: `## Sprint Goal\n\n${sprint.desc}\n\n## Tasks\n\n- [ ] Design and architecture\n- [ ] Implementation\n- [ ] Testing\n- [ ] Code review`,
          labels: ['feature', `P${weekNum === 1 ? '0' : '1'}`],
          milestoneNumber: milestoneMap[weekNum] || null
        });

        if (created) {
          results.issues.push({
            number: created.number,
            title: created.title,
            url: created.html_url
          });
        }
      }
    }
  }

  console.log(`[GitHub] Provisioning complete: ${repo.html_url}`);
  console.log(`[GitHub] Created: ${results.issues.length} issues, ${results.milestones.length} milestones`);

  return results;
}

// ── Generate .env Template from Blueprint ─────────────────────────────────
function generateEnvTemplate(blueprint) {
  const stack = blueprint.techStack || {};
  const allTech = [
    ...(stack.frontend || []),
    ...(stack.backend || []),
    ...(stack.database || []),
    ...(stack.aiMl || [])
  ].join(' ').toLowerCase();

  let env = `# ${blueprint.title} — Environment Variables
# Generated by iNSIGHTS Layer 2
# Copy to .env and fill in your values

# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000
`;

  if (allTech.includes('postgres') || allTech.includes('pg')) {
    env += `
# PostgreSQL Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
`;
  }

  if (allTech.includes('mongo')) {
    env += `
# MongoDB
MONGODB_URI=mongodb://localhost:27017/your_db_name
`;
  }

  if (allTech.includes('redis')) {
    env += `
# Redis
REDIS_URL=redis://localhost:6379
`;
  }

  if (allTech.includes('openai') || allTech.includes('gpt')) {
    env += `
# OpenAI
OPENAI_API_KEY=sk_your_key_here
`;
  }

  if (allTech.includes('plaid')) {
    env += `
# Plaid (Banking Integration)
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
PLAID_ENV=sandbox
`;
  }

  env += `
# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Optional: External Services
# SENDGRID_API_KEY=your_key
# CLOUDINARY_URL=your_url
`;

  return env;
}

module.exports = { provisionProject, createRepository, createIssue, getAuthenticatedUser };
