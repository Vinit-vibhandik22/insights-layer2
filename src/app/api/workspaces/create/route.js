import { createWorkspace } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await req.json();
    
    if (!name || name.trim().length === 0) {
      return Response.json({ error: 'Workspace name is required' }, { status: 400 });
    }

    const workspaceId = await createWorkspace({ name: name.trim(), userId });
    
    if (!workspaceId) {
      return Response.json({ error: 'Failed to create workspace' }, { status: 500 });
    }

    return Response.json({ success: true, workspaceId });
  } catch (error) {
    console.error('[API WORKSPACE CREATE]', error);
    return Response.json({ error: 'Server Error' }, { status: 500 });
  }
}
