import { addWorkspaceCollaborator } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, email } = await req.json();
    
    if (!workspaceId || !email || !email.trim()) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const success = await addWorkspaceCollaborator(workspaceId, email.trim().toLowerCase());
    
    if (!success) {
      return Response.json({ error: 'Failed to add collaborator' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[API COLLABORATOR]', error);
    return Response.json({ error: 'Server Error' }, { status: 500 });
  }
}
