# 🚀 iNSIGHTS Layer 2
### AI Research & Innovation Copilot

<p align="center">
  <strong>Transform ideas into investor-ready technical blueprints with AI-powered research, live web intelligence, and collaborative workspaces.</strong>
</p>

<p align="center">
  <a href="https://insights-layer2.onrender.com"><img src="https://img.shields.io/badge/Live-Demo-4CAF50?style=for-the-badge" /></a>
  <a href="https://github.com/captain17codes/insights-layer2"><img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github" /></a>
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase" />
  <img src="https://img.shields.io/badge/Groq-AI-orange?style=for-the-badge" />
</p>

---

# 🌟 Overview

**iNSIGHTS Layer 2** is a production-grade AI-powered research and innovation platform that transforms simple ideas into comprehensive technical blueprints.

It combines **Large Language Models**, **Live Retrieval-Augmented Generation (RAG)**, **academic research**, **market intelligence**, and **GitHub ecosystem analysis** to generate investor-ready documentation for startups, hackathons, research projects, and enterprise solutions.

Whether you're preparing for a hackathon, building a startup, writing a capstone project, or validating a business idea, iNSIGHTS Layer 2 acts as your AI Innovation Copilot.

---

# ✨ Features

## 🧠 AI Blueprint Generator

Generate complete technical documentation from a single prompt, including:

- System Architecture
- Tech Stack
- Database Design
- API Planning
- Sprint Roadmap
- Development Timeline
- Investor-ready Documentation

---

## 🔍 DeepSearch (Live RAG)

Grounds AI responses using real-time information from:

- Tavily Search
- Semantic Scholar
- GitHub Repositories
- Latest Market Trends
- Academic Papers

No outdated knowledge—every blueprint is enriched with current research.

---

## 📂 Project Hub

Organize projects into dedicated workspaces such as:

- Hackathons
- Startup Ideas
- College Projects
- Research Papers
- Client Work

---

## 👥 Workspace Collaboration

Invite teammates securely via email.

Features include:

- Shared Workspaces
- Collaborative Blueprint Access
- Secure Permissions

---

## 🌍 Multilingual AI

Generate documentation in multiple languages including:

- English
- Hindi
- Spanish
- Mandarin
- French
- and many more.

---

## 🌗 Modern UI

- Responsive Design
- Light Mode
- Dark Mode
- Clean Dashboard
- Fast Navigation

---

## 📊 Presentation Ready

Generate documentation that can easily be converted into:

- Pitch Decks
- Executive Summaries
- Research Reports
- Investor Presentations

---

# 🏗 Tech Stack

| Category | Technology |
|------------|------------|
| Frontend | Next.js 15 (App Router), React 18 |
| Styling | CSS Variables, Vanilla CSS |
| Authentication | Clerk |
| Database | Supabase PostgreSQL |
| AI Model | Groq LLM |
| Live Research | Tavily API |
| Academic Search | Semantic Scholar API |
| Repository Analysis | GitHub API |
| Diagrams | Mermaid.js |
| Deployment | Render |

---

# 📁 Project Structure

```text
insights-layer2/
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate-blueprint/
│   │   │   ├── mentor-chat/
│   │   │   ├── hub/
│   │   │   ├── workspaces/
│   │   │   └── provision-repo/
│   │   │
│   │   ├── hub/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── LandingScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   └── SafeMermaid.tsx
│   │
│   └── lib/
│       ├── rag.js
│       ├── groq-client.js
│       ├── prompt-builder.js
│       └── supabase.js
│
├── supabase/
│   └── migrations/
│
├── public/
│
└── package.json
```

---

# ⚙️ Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/captain17codes/insights-layer2.git

cd insights-layer2
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file from `.env.example`.

```bash
cp .env.example .env
```

Configure the following services:

- Clerk
- Supabase
- Groq
- Tavily
- GitHub

---

## 4. Database Migration

Open your Supabase Dashboard.

Navigate to:

```
SQL Editor
```

Run the SQL migration located at:

```
supabase/migrations/add_workspaces.sql
```

This enables:

- Workspaces
- Collaborators
- Project Hub

---

## 5. Run the Development Server

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

# 🌐 Live Demo

### 🚀 https://insights-layer2.onrender.com/

---

# 💡 Use Cases

- Startup Validation
- Hackathons
- Research Projects
- Capstone Projects
- Product Planning
- Technical Documentation
- Investor Pitch Preparation
- AI-assisted System Design

---

# 🔮 Future Roadmap

- AI Code Generation
- Architecture Versioning
- PDF Export
- One-click PPT Generation
- GitHub Repository Provisioning
- CI/CD Recommendations
- Cost Estimation
- Team Activity Dashboard
- AI Project Mentor
- One-click Deployment Templates

---

# 🤝 Contributing

Contributions are always welcome!

1. Fork the repository

2. Create a new branch

```bash
git checkout -b feature/new-feature
```

3. Commit changes

```bash
git commit -m "Add new feature"
```

4. Push

```bash
git push origin feature/new-feature
```

5. Open a Pull Request

---

# 📄 License

This project is licensed under the **MIT License**.

---

# 👨‍💻 Developer

**Akshit Agarwal**
**Divya Wankhade**
**Harshal Gawande**
**Vinit vibhandik**

GitHub:
https://github.com/captain17codes

---

<p align="center">
Built with ❤️ using Next.js, Groq AI, Supabase, and modern web technologies.
</p>
