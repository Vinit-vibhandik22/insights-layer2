import { assignBlueprintToWorkspace } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { blueprintId, workspaceId } = await req.json();
    
    if (!blueprintId || !workspaceId) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const success = await assignBlueprintToWorkspace(blueprintId, workspaceId);
    
    if (!success) {
      return Response.json({ error: 'Failed to assign blueprint' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[API WORKSPACE ASSIGN]', error);
    return Response.json({ error: 'Server Error' }, { status: 500 });
  }
}
