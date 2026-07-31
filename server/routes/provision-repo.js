'use strict';

const express = require('express');
const router = express.Router();
const { provisionProject } = require('../services/github');

// ── POST /api/provision-repo ───────────────────────────────────────────────
router.post('/', async (req, res) => {
  const {
    blueprint,
    repoName,
    githubToken,
    isPrivate = true,
    includeReadme = true,
    includeIssues = true,
    includeEnvTemplate = true,
    includeMilestones = true
  } = req.body;

  // Validation
  if (!blueprint || !repoName || !githubToken) {
    return res.status(400).json({
      error: 'Missing required fields: blueprint, repoName, githubToken'
    });
  }

  // Sanitize repo name: lowercase, replace spaces with hyphens, remove special chars
  const cleanRepoName = repoName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_.]/g, '')
    .substring(0, 100);

  if (!cleanRepoName) {
    return res.status(400).json({ error: 'Invalid repository name.' });
  }

  try {
    console.log(`[Provision] Starting provisioning for repo: ${cleanRepoName}`);

    const results = await provisionProject(githubToken, blueprint, {
      repoName: cleanRepoName,
      isPrivate,
      includeReadme,
      includeIssues,
      includeEnvTemplate,
      includeMilestones
    });

    res.json({
      success: true,
      repository: results.repository,
      scaffolding: {
        readme: results.readme,
        envTemplate: results.envTemplate,
        milestones: results.milestones,
        issues: {
          created: results.issues.length,
          sample: results.issues.slice(0, 3)
        }
      },
      errors: results.errors,
      metadata: {
        provisionedAt: new Date().toISOString(),
        totalIssues: results.issues.length,
        totalMilestones: results.milestones.length
      }
    });
  } catch (err) {
    console.error('[Provision] Error:', err.message);

    // Handle specific GitHub API errors
    if (err.message.includes('already exists')) {
      return res.status(409).json({
        error: `Repository "${cleanRepoName}" already exists on your GitHub account. Please choose a different name.`
      });
    }

    if (err.message.includes('Bad credentials') || err.message.includes('401')) {
      return res.status(401).json({
        error: 'Invalid GitHub token. Please provide a valid Personal Access Token with "repo" scope.'
      });
    }

    res.status(500).json({
      error: err.message || 'Failed to provision repository. Please try again.'
    });
  }
});

module.exports = router;
