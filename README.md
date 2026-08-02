# iNSIGHTS Layer 2 — AI Research & Innovation Copilot

iNSIGHTS Layer 2 is a production-grade Next.js application that transforms vague ideas into comprehensive, investor-ready technical blueprints using AI-powered research and live web scraping.

## 🚀 Key Features

*   **Intelligent Blueprint Generation**: Converts simple prompts into detailed technical architectures, sprint plans, and system designs using the Groq LLM.
*   **DeepSearch (Live RAG)**: Dynamically scrapes the web (via Tavily and SemanticScholar) to ground AI responses in real-time academic literature, market data, and GitHub repositories.
*   **Project HUB & Workspaces**: Organize your generated blueprints into isolated workspaces (e.g., "Hackathon", "Capstone"). 
*   **Workspace Collaborators**: Invite team members to your workspaces via email to share technical blueprints securely.
*   **Multilingual Support**: Generate complex technical documentation natively in multiple languages (English, Spanish, Hindi, Mandarin, etc.).
*   **Light & Dark Mode**: Beautiful, responsive UI that defaults to a sleek Light theme with an easily accessible Dark mode toggle.
*   **Presentation-Ready Export**: Automatically formats your architecture and roadmap into a copy-pasteable Executive Deck.

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 18 |
| **Styling** | Vanilla CSS (CSS Variables for Light/Dark Mode) |
| **Auth** | `@clerk/nextjs` |
| **Database** | Supabase (PostgreSQL with RLS) |
| **AI / LLM** | Groq (`llama-3.1-70b-versatile` or similar) |
| **Web Intel** | Tavily, Semantic Scholar API, GitHub API |
| **Diagrams** | Mermaid.js |

## 📁 Project Structure

```
insights-layer2/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate-blueprint/  # SSE streaming LLM endpoint
│   │   │   ├── hub/                 # Fetches workspaces & blueprints
│   │   │   ├── workspaces/          # Workspace CRUD & Collaborators
│   │   │   ├── mentor-chat/         # AI mentor chatbot endpoint
│   │   │   └── provision-repo/      # GitHub repo creation
│   │   ├── hub/                     # Project Hub UI
│   │   ├── layout.tsx               # Root layout (ClerkProvider)
│   │   ├── page.tsx                 # Main application page
│   │   └── globals.css              # Global Light/Dark theme CSS
│   ├── components/
│   │   ├── Navbar.tsx               # Top nav with Theme Toggle
│   │   ├── LandingScreen.tsx        # Hero with Language Selector
│   │   ├── DashboardScreen.tsx      # Main blueprint canvas
│   │   └── SafeMermaid.tsx          # Client-side Mermaid renderer
│   ├── lib/
│   │   ├── rag.js                   # RAG pipeline (Tavily, GitHub)
│   │   ├── groq-client.js           # Groq LLM integration
│   │   ├── prompt-builder.js        # Dynamic prompt engineering
│   │   └── supabase.js              # Database helper functions
├── supabase/
│   └── migrations/                  # SQL scripts (e.g., add_workspaces.sql)
└── package.json
```

## ⚙️ Setup & Installation

### 1. Environment Variables
Copy `.env.example` to `.env` and fill in your API keys:
```bash
cp .env.example .env
```
You will need keys for **Clerk**, **Supabase**, **Groq**, **Tavily**, and **GitHub**.

### 2. Database Migration (Crucial for Project Hub)
To enable Workspaces and Collaborators, you must run the SQL migration script in your Supabase project.
1. Open your Supabase Dashboard.
2. Go to the **SQL Editor**.
3. Copy the contents of `supabase/migrations/add_workspaces.sql` and run it.

### 3. Install & Run
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application!

## 📄 License
MIT License
