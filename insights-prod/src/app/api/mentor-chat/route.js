import { generateMentorResponse } from '@/lib/groq-client';

export const runtime = 'nodejs';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { message, blueprint, history = [] } = body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return Response.json({ error: 'Message is required.' }, { status: 400 });
  }

  const cleanMessage = message.trim().substring(0, 1000);

  try {
    if (!process.env.GROQ_API_KEY) {
      const fallbacks = [
        "Good question! Based on your architecture, start with the database schema to establish a solid foundation.",
        "The AI/ML component should be a separate microservice to keep concerns separated.",
        "For this sprint, focus on core API endpoints first. ML integration comes in Week 3.",
        "Security tip: Always validate input on both frontend and backend.",
        "I'd suggest Redis caching for frequently accessed data — it'll dramatically improve response times.",
      ];
      return Response.json({ response: fallbacks[Math.floor(Math.random() * fallbacks.length)], source: 'fallback' });
    }

    const response = await generateMentorResponse(cleanMessage, blueprint, history);
    return Response.json({ response, source: 'groq' });

  } catch (err) {
    return Response.json({ error: 'Failed to generate mentor response.', response: "I'm having trouble connecting. Could you rephrase your question?" }, { status: 500 });
  }
}
