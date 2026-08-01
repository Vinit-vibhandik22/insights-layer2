import { getBlueprintById } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(req, { params }) {
  const { id } = params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: 'Invalid blueprint ID' }, { status: 400 });
  try {
    const blueprint = await getBlueprintById(id);
    if (!blueprint) return Response.json({ error: 'Blueprint not found' }, { status: 404 });
    return Response.json(blueprint);
  } catch {
    return Response.json({ error: 'Failed to retrieve blueprint' }, { status: 500 });
  }
}
