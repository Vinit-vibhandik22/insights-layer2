# iNSIGHTS Layer 2 — Next.js v3.0

AI-Powered Research & Innovation Copilot, migrated from Express + Vanilla JS to **Next.js 15** (App Router).

## Tech Stack

| Layer | Old | New |
|-------|-----|-----|
| Frontend | HTML + Vanilla JS | Next.js 15 + React 18 |
| Backend | Express.js | Next.js API Routes |
| Auth | Clerk JS (CDN) | `@clerk/nextjs` |
| Styling | Vanilla CSS | Global CSS (dark theme) |
| Deployment | Node.js server | Vercel / any Node host |

## Project Structure

```
nextjs-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate-blueprint/  # SSE streaming endpoint
│   │   │   ├── mentor-chat/         # AI chat endpoint
│   │   │   ├── provision-repo/      # GitHub provisioning
│   │   │   ├── workspaces/          # Blueprint history
│   │   │   └── health/              # Health check
│   │   ├── sign-in/                 # Clerk sign-in page
│   │   ├── sign-up/                 # Clerk sign-up page
│   │   ├── layout.tsx               # Root layout (ClerkProvider)
│   │   ├── page.tsx                 # Main app page
│   │   └── globals.css              # Global dark theme CSS
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── LandingScreen.tsx
│   │   ├── LoaderScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   └── MermaidDiagram.tsx
│   ├── lib/
│   │   ├── rag.js                   # RAG pipeline (Tavily, Semantic Scholar, GitHub)
│   │   ├── groq-client.js           # Groq/LLM integration
│   │   ├── prompt-builder.js        # Blueprint prompts
│   │   ├── supabase.js              # Supabase persistence
│   │   └── github.js                # GitHub repo provisioning
│   └── middleware.ts                # Optional Clerk auth
└── next.config.js
```

## Setup

```bash
# Copy env file
cp .env.example .env
# Fill in your API keys in .env

# Install deps
npm install

# Dev server
npm run dev

# Production build
npm run build && npm start
```

## Key Changes from v2 (Express)

- **No separate server** — everything runs via Next.js (API Routes replace Express)
- **Dark theme UI** — full redesign with improved visual hierarchy
- **Clerk integrated natively** — `@clerk/nextjs` instead of CDN script
- **Mermaid rendered client-side** — lazy loaded component
- **SSE streaming** — same `/api/generate-blueprint` pattern works via `ReadableStream`
- **Optional auth** — app works with or without Clerk keys configured
