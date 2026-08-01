import { provisionProject } from '@/lib/github';
import { updateBlueprintWithRepo } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { blueprint, repoName, githubToken, isPrivate = true, includeReadme = true, includeIssues = true, includeEnvTemplate = true, includeMilestones = true, blueprintId } = body;

  if (!blueprint || !repoName || !githubToken) {
    return Response.json({ error: 'Missing required fields: blueprint, repoName, githubToken' }, { status: 400 });
  }

  const cleanRepoName = repoName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-_.]/g, '').substring(0, 100);
  if (!cleanRepoName) return Response.json({ error: 'Invalid repository name.' }, { status: 400 });

  try {
    const results = await provisionProject(githubToken, blueprint, { repoName: cleanRepoName, isPrivate, includeReadme, includeIssues, includeEnvTemplate, includeMilestones });

    if (blueprintId && results.repository?.url) {
      await updateBlueprintWithRepo(blueprintId, results.repository.url);
    }

    return Response.json({
      success: true,
      repository: results.repository,
      scaffolding: { readme: results.readme, milestones: results.milestones, issues: { created: results.issues.length } },
      errors: results.errors,
      metadata: { provisionedAt: new Date().toISOString(), totalIssues: results.issues.length }
    });

  } catch (err) {
    if (err.message.includes('already exists')) return Response.json({ error: `Repository "${cleanRepoName}" already exists.` }, { status: 409 });
    if (err.message.includes('Bad credentials') || err.message.includes('401')) return Response.json({ error: 'Invalid GitHub token.' }, { status: 401 });
    return Response.json({ error: err.message || 'Failed to provision repository.' }, { status: 500 });
  }
}
