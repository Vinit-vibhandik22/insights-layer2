import { checkConnection } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  let supabaseConnected = false;
  try { supabaseConnected = await checkConnection(); } catch (_) {}

  return Response.json({
    status: 'ok',
    service: 'iNSIGHTS Layer 2 Next.js',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    integrations: {
      groq: !!process.env.GROQ_API_KEY,
      tavily: !!process.env.TAVILY_API_KEY,
      supabase: supabaseConnected,
      clerk: !!process.env.CLERK_SECRET_KEY,
    }
  });
}
