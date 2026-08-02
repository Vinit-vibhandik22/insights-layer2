import { getWorkspacesWithBlueprints } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';

export async function GET(req) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getWorkspacesWithBlueprints(userId);
    return Response.json(data);
  } catch (error) {
    console.error('[API HUB]', error);
    return Response.json({ error: 'Failed to fetch hub data' }, { status: 500 });
  }
}
