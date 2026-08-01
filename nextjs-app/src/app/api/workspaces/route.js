import { getRecentBlueprints } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(req) {
  const sessionId = req.headers.get('x-session-id') || req.headers.get('x-forwarded-for') || 'anon';
  try {
    const blueprints = await getRecentBlueprints(sessionId, 20);
    return Response.json({ blueprints: blueprints || [] });
  } catch {
    return Response.json({ blueprints: [] });
  }
}
