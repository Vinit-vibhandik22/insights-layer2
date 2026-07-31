// ═══════════════════════════════════════════════════════════════════════════
// iNSIGHTS Layer 2 — Frontend Client (v2.0 — Real AI Backend)
// Connects to Express backend at /api/* instead of using fake setTimeout loops
// ═══════════════════════════════════════════════════════════════════════════

const API_BASE = window.location.port === '5500' || window.location.protocol === 'file:' 
  ? 'http://localhost:3000' 
  : window.location.origin; // Same-origin — served by Express

// ── Mermaid.js Loader ──────────────────────────────────────────────────────
(function loadMermaid() {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
  script.onload = () => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#e11d48',
        primaryTextColor: '#fff',
        primaryBorderColor: '#c01040',
        lineColor: '#888',
        secondaryColor: '#f5f5f5',
        tertiaryColor: '#fff',
        background: '#fff',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px'
      },
      flowchart: { curve: 'basis', padding: 20 },
      securityLevel: 'loose'
    });
    window.mermaidReady = true;
  };
  document.head.appendChild(script);
})();

function initialize() {
  // ── DOM References ──
  const screens = {
    login: document.getElementById('login'),
    landing: document.getElementById('landing'),
    loader: document.getElementById('loader'),
    dashboard: document.getElementById('dashboard')
  };
  const generateBtn = document.getElementById('generateBtn');
  const newQueryBtn = document.getElementById('newQueryBtn');
  const queryInput = document.getElementById('queryInput');
  const dashboardQuery = document.getElementById('dashboardQuery');
  const dashTitle = document.getElementById('dashTitle');
  const loaderText = document.getElementById('loaderText');
  const loaderSubText = document.getElementById('loaderSubText');
  const progressBar = document.getElementById('progressBar');
  const canvasContainer = document.getElementById('canvasContainer');
  const loginScreen = document.getElementById('login');
  const loginFallback = document.getElementById('login-fallback');
  const loginBtn = document.getElementById('loginBtn');

  // ── State ──
  let currentBlueprint = null;
  let chatHistory = [];

  // ── Screen Management ──
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
    document.getElementById('topNav').style.display = name === 'dashboard' ? 'none' : '';
  }

  // ── Dismiss Login Screen ──
  function dismissLogin() {
    loginScreen.style.transition = 'opacity 0.4s ease';
    loginScreen.style.opacity = '0';
    const gridBg = document.querySelector('.grid-bg');
    if (gridBg) gridBg.style.animation = 'none';
    setTimeout(() => {
      loginScreen.style.display = 'none';
      showScreen('landing');
    }, 420);
  }

  // ── Clerk Auth Flow ──
  async function initClerkAuth() {
    // Wait up to 8 seconds for Clerk SDK to become available
    let waited = 0;
    while (!window.Clerk && waited < 8000) {
      await new Promise(r => setTimeout(r, 200));
      waited += 200;
    }

    if (window.Clerk) {
      if (loginFallback) loginFallback.style.display = 'none'; // hide fallback if it was shown
      try {
        await window.Clerk.load();

        if (window.Clerk.user) {
          // Already signed in → go straight to landing
          dismissLogin();
          window.Clerk.mountUserButton(document.getElementById('clerk-user-button'));
        } else {
          // Not signed in → mount Clerk's SignIn widget
          loginScreen.style.display = 'flex';
          loginScreen.style.opacity = '1';
          window.Clerk.mountSignIn(document.getElementById('clerk-sign-in'));

          // Listen for sign-in completion
          window.Clerk.addListener(({ user }) => {
            if (user) {
              dismissLogin();
              window.Clerk.mountUserButton(document.getElementById('clerk-user-button'));
            }
          });
        }
      } catch (err) {
        console.error('[Clerk] Load failed:', err);
        const log = document.getElementById('debug-log');
        if (log) { log.style.display = 'block'; log.textContent += `[Clerk] Load failed: ${err.message || err}\n`; }
        showGuestFallback();
      }
    } else {
      console.warn('[Auth] Clerk JS did not load. Showing guest fallback.');
      const log = document.getElementById('debug-log');
      if (log) { log.style.display = 'block'; log.textContent += `[Auth] Clerk JS is undefined after 4 seconds.\n`; }
      showGuestFallback();
    }
  }

  function showGuestFallback() {
    if (loginFallback) {
      loginFallback.style.display = 'block';
      loginFallback.querySelector('p').textContent = 'Auth service unavailable.';
    }
    if (loginBtn) {
      loginBtn.style.display = 'inline-block';
      loginBtn.addEventListener('click', dismissLogin);
    }
  }

  // Kick off auth
  initClerkAuth();

  // Smooth scroll for nav links
  document.getElementById('navFeatures')?.addEventListener('click', e => { e.preventDefault(); document.getElementById('featuresSection')?.scrollIntoView({ behavior: 'smooth' }); });
  document.getElementById('navArchitecture')?.addEventListener('click', e => { e.preventDefault(); document.getElementById('archSection')?.scrollIntoView({ behavior: 'smooth' }); });
  document.getElementById('navRoadmap')?.addEventListener('click', e => { e.preventDefault(); document.getElementById('roadmapSection')?.scrollIntoView({ behavior: 'smooth' }); });
  document.getElementById('navHome')?.addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });

  // Feature card clicks → auto fill input + generate
  document.querySelectorAll('.feature-interactive').forEach(card => {
    card.addEventListener('click', () => {
      const feature = card.dataset.feature;
      const prompts = {
        deepsearch: "Build an AI solution to reduce food waste in college hostels",
        projecthub: "Create a smart attendance system using face recognition",
        mentor: "Develop a personal finance tracker with AI budgeting"
      };
      queryInput.value = prompts[feature] || "";
      queryInput.focus();
      generateBtn.click();
    });
  });



  // ── Real SSE-Driven Processing ──────────────────────────────────────────
  async function processWithRealAI(query) {
    showScreen('loader');
    progressBar.style.width = '0%';
    loaderText.textContent = 'Initializing AI Copilot...';
    loaderSubText.textContent = 'Connecting to intelligence pipeline...';

    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(`${API_BASE}/api/generate-blueprint?query=${encodeURIComponent(query)}`);

      // NOTE: EventSource doesn't support POST natively, so we use fetch + ReadableStream for POST
      // We'll close this and use the fetch approach below
      eventSource.close();

      fetchSSEBlueprint(query)
        .then(resolve)
        .catch(reject);
    });
  }

  async function fetchSSEBlueprint(query) {
    let blueprint = null;

    try {
        let clerkToken = null;
        if (window.Clerk && window.Clerk.session) {
          clerkToken = await window.Clerk.session.getToken();
        }
        
        const headers = { 'Content-Type': 'application/json' };
        if (clerkToken) headers['Authorization'] = `Bearer ${clerkToken}`;

        const response = await fetch(`${API_BASE}/api/generate-blueprint`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ query })
        });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventName = line.slice(7).trim();
            continue;
          }

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              // Handle different event types based on data shape
              if (data.stage !== undefined) {
                // Progress update
                loaderText.textContent = data.label || loaderText.textContent;
                loaderSubText.textContent = data.sub || loaderSubText.textContent;
                progressBar.style.width = `${data.progress || 0}%`;

              } else if (data.papers !== undefined || data.repos !== undefined) {
                // RAG results received early
                console.log('[Frontend] RAG results received:', data.papers?.length, 'papers,', data.repos?.length, 'repos');

              } else if (data.title !== undefined && data.sprints !== undefined) {
                // This is the blueprint
                blueprint = data;

              } else if (data.success === true) {
                // Done signal
                progressBar.style.width = '100%';
              } else if (data.message && !data.title) {
                // Error event
                throw new Error(data.message);
              }
            } catch (parseErr) {
              if (parseErr.message !== 'Unexpected end of JSON input') {
                console.warn('[Frontend] SSE parse warning:', parseErr.message);
              }
            }
          }
        }
      }

      if (!blueprint) {
        throw new Error('No blueprint received from server. Please try again.');
      }

      return blueprint;

    } catch (err) {
      // If server is not running, fall back to the static demo mode
      if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('[Frontend] Server not reachable — falling back to demo mode');
        return null; // Will trigger demo mode below
      }
      throw err;
    }
  }

  // ── Main Generation Flow ─────────────────────────────────────────────────
  async function simulateProcessing(query) {
    showScreen('loader');
    progressBar.style.width = '0%';

    try {
      // Try real AI first
      loaderText.textContent = 'Connecting to AI Copilot...';
      loaderSubText.textContent = 'Initializing RAG pipeline...';

      let bp = await fetchSSEBlueprint(query);

      if (!bp) {
        // Server not reachable — use intelligent demo fallback
        bp = await runDemoMode(query);
      }

      currentBlueprint = bp;
      renderDashboard(bp);

      refineInput.value = query;
      document.querySelectorAll('.sidebar .nav-item').forEach(n => n.classList.remove('active'));
      document.querySelector('.sidebar .nav-item[data-tab="overview"]')?.classList.add('active');

      showScreen('dashboard');

    } catch (err) {
      console.error('[Frontend] Processing error:', err.message);
      // Show error toast then fall back to demo mode
      showToast(`AI Error: ${err.message}. Using demo mode.`, 'warn');

      const bp = await runDemoMode(query);
      currentBlueprint = bp;
      renderDashboard(bp);
      showScreen('dashboard');
    }
  }

  // ── Demo Mode Fallback (when server not running) ──────────────────────────
  async function runDemoMode(query) {
    const stages = [
      { text: 'Executing Multimodal DeepSearch...', sub: 'Querying arXiv, IEEE Xplore, GitHub [1/5]', progress: 20 },
      { text: 'Knowledge Clustering Active...', sub: 'Synthesizing root cause analysis [2/5]', progress: 40 },
      { text: 'Generating System Architecture...', sub: 'Mapping tech stack constraints [3/5]', progress: 60 },
      { text: 'Formulating Agile Milestones...', sub: 'Applying RMDP schedule optimization [4/5]', progress: 80 },
      { text: 'Deploying AI Mentor Agent...', sub: 'Configuring intelligence layer [5/5]', progress: 100 }
    ];

    for (const stage of stages) {
      loaderText.textContent = stage.text;
      loaderSubText.textContent = stage.sub;
      progressBar.style.width = `${stage.progress}%`;
      await new Promise(r => setTimeout(r, 900));
    }

    return matchBlueprint(query);
  }

  // ── Quick Re-generate ────────────────────────────────────────────────────
  async function quickRegenerate(query) {
    canvasContainer.style.opacity = '0.3';
    canvasContainer.style.transition = 'opacity 0.3s';

    try {
      showToast('Regenerating blueprint...', 'info');
      const bp = await fetchSSEBlueprint(query);
      if (bp) {
        currentBlueprint = bp;
        renderDashboard(bp);
      } else {
        renderDashboard(matchBlueprint(query));
      }
    } catch (err) {
      renderDashboard(matchBlueprint(query));
    }

    document.querySelectorAll('.sidebar .nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('.sidebar .nav-item[data-tab="overview"]')?.classList.add('active');
    canvasContainer.style.opacity = '1';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── STATIC BLUEPRINT DATABASE (Demo / Fallback) ──
  // ══════════════════════════════════════════════════════════════════════════
  const blueprints = {
    foodWaste: {
      keywords: ["food waste", "hostel", "canteen", "mess", "food management"],
      title: "Hostel Food Waste Reduction",
      stats: [{ val: "1.3B", label: "Tonnes wasted globally/yr" }, { val: "100g", label: "Wasted per student/day" }],
      warning: "Blind cooking for max capacity causes massive overproduction.",
      arch: [
        { icon: "📱", title: "Mobile App", stack: "React Native, Expo" },
        { icon: "⚙️", title: "Backend API", stack: "Node.js, Express" },
        { icon: "🧠", title: "AI Forecasting", stack: "Python, Prophet", hl: true },
        { icon: "🗄️", title: "Database", stack: "PostgreSQL, Redis" }
      ],
      architectureMermaid: `graph TD
  A["📱 React Native\\n(Mobile App)"] -->|GraphQL| B["⚙️ Node.js\\n(API Server)"]
  B --> C["🧠 Prophet ML\\n(Forecast Engine)"]
  B --> D["🗄️ PostgreSQL\\n(Database)"]
  C -->|Predictions| B
  B --> E["📊 Dashboard\\n(Next.js)"]
  D --> F["📈 Analytics\\n(Redis Cache)"]
  style C fill:#e11d48,color:#fff`,
      deepSearchResults: [
        { type: "paper", title: "Food Waste Prediction Using ML in Institutional Canteens", source: "IEEE Xplore, 2024", desc: "LSTM-based model predicts daily food consumption with 89% accuracy.", url: "https://ieeexplore.ieee.org" },
        { type: "github", title: "hostel-food-manager (★ 342)", source: "github.com/smartcanteen", desc: "Open-source meal booking & waste tracking system built with MERN.", url: "https://github.com" },
        { type: "paper", title: "IoT-Based Smart Cafeteria Management System", source: "arXiv, 2023", desc: "Uses weight sensors and computer vision to monitor plate waste.", url: "https://arxiv.org" },
        { type: "patent", title: "Dynamic Meal Portion Control System", source: "US Patent 2024/0158421", desc: "AI-driven portioning based on historical consumption patterns.", url: "https://patents.google.com" }
      ],
      mentorChat: [
        { from: "bot", text: "👋 Hey! I'm your AI Scrum Master. I've analyzed your food waste project. Ready to start Sprint 1?" },
        { from: "user", text: "Yes, what should I focus on first?" },
        { from: "bot", text: "Let's start with the PostgreSQL schema. I recommend: `meals`, `bookings`, `waste_logs`, `students`. I'll send the migration file to your IDE." },
        { from: "user", text: "What ML model should I use?" },
        { from: "bot", text: "Facebook Prophet works best here — it handles seasonality in meal patterns. I'll set up a training notebook for you." }
      ],
      webIntel: [
        { status: "safe", lib: "React Native 0.74", detail: "Latest stable. No known CVEs.", badge: "UP TO DATE" },
        { status: "warn", lib: "Express.js 4.x", detail: "v4 entering maintenance. Migrate to v5 recommended.", badge: "MIGRATE" },
        { status: "safe", lib: "Prophet 1.1.5", detail: "Actively maintained by Meta.", badge: "SECURE" },
        { status: "critical", lib: "node-fetch 2.x", detail: "CVE-2022-0235: Header leak vulnerability.", badge: "CVE FOUND" }
      ],
      sprints: [
        { week: "W1", title: "Infrastructure", desc: "DB Schema, Backend API, Auth System", done: true },
        { week: "W2", title: "Meal Booking UI", desc: "Mobile App with Booking Module", done: false },
        { week: "W3", title: "AI Pipeline", desc: "Prophet Model Training & Validation", done: false },
        { week: "W4", title: "Deployment", desc: "Integration, Testing & Go-Live", done: false }
      ],
      githubIssues: []
    },
    attendance: {
      keywords: ["attendance", "face", "recognition", "biometric", "face recognition"],
      title: "Smart Attendance via Face Recognition",
      stats: [{ val: "35%", label: "Time wasted on manual roll calls" }, { val: "92%", label: "Face recognition accuracy" }],
      warning: "Manual attendance is slow, error-prone, and easy to proxy.",
      arch: [
        { icon: "📷", title: "Camera Module", stack: "OpenCV, Pi Camera" },
        { icon: "⚙️", title: "Backend", stack: "FastAPI, Python" },
        { icon: "🧠", title: "Face AI", stack: "dlib, FaceNet", hl: true },
        { icon: "🗄️", title: "Database", stack: "MongoDB, S3" }
      ],
      architectureMermaid: `graph TD
  A["📷 Camera\\n(OpenCV)"] -->|Frames| B["🧠 FaceNet\\n(Recognition)"]
  B -->|Identity| C["⚙️ FastAPI\\n(Backend)"]
  C --> D["🗄️ MongoDB\\n(Attendance DB)"]
  C --> E["📊 Dashboard\\n(React)"]
  D --> F["📤 Reports\\n(Export)"]
  style B fill:#e11d48,color:#fff`,
      deepSearchResults: [
        { type: "paper", title: "Real-Time Face Recognition for Automated Attendance", source: "IEEE, 2024", desc: "Uses FaceNet embeddings with 98.7% accuracy on classroom datasets.", url: "https://ieeexplore.ieee.org" },
        { type: "github", title: "face-attendance-system (★ 1.2k)", source: "github.com/ageitgey/face_recognition", desc: "Python library for face recognition built with dlib.", url: "https://github.com/ageitgey/face_recognition" },
        { type: "paper", title: "Anti-Spoofing Techniques for Face-Based Attendance", source: "arXiv, 2023", desc: "Liveness detection using blink analysis and depth mapping.", url: "https://arxiv.org" }
      ],
      mentorChat: [
        { from: "bot", text: "🎓 Attendance project initialized! I've set up a Python environment with OpenCV and dlib." },
        { from: "user", text: "How do I handle spoofing?" },
        { from: "bot", text: "Implement liveness detection: check for blinks and micro-movements. I'll add the anti-spoof module to your repo." }
      ],
      webIntel: [
        { status: "safe", lib: "OpenCV 4.9", detail: "Latest stable release.", badge: "UP TO DATE" },
        { status: "safe", lib: "dlib 19.24", detail: "No known vulnerabilities.", badge: "SECURE" },
        { status: "warn", lib: "Pillow 9.x", detail: "CVE-2023-44271: DoS via large images. Upgrade to 10.x.", badge: "UPGRADE" }
      ],
      sprints: [
        { week: "W1", title: "Data Collection", desc: "Face dataset capture & preprocessing", done: true },
        { week: "W2", title: "Model Training", desc: "FaceNet embeddings & classifier", done: false },
        { week: "W3", title: "Integration", desc: "Camera + Backend + Dashboard", done: false },
        { week: "W4", title: "Anti-Spoof & Deploy", desc: "Liveness detection & production", done: false }
      ],
      githubIssues: []
    },
    finance: {
      keywords: ["finance", "budget", "expense", "money", "tracker", "banking", "fintech"],
      title: "AI Personal Finance Tracker",
      stats: [{ val: "78%", label: "Adults live paycheck to paycheck" }, { val: "$8.9K", label: "Avg credit card debt/person" }],
      warning: "Lack of financial literacy and automated budgeting leads to chronic overspending.",
      arch: [
        { icon: "💳", title: "Mobile App", stack: "React Native, Plaid" },
        { icon: "🔐", title: "Secure API", stack: "Rust, Actix-web" },
        { icon: "🧠", title: "Spending AI", stack: "Python, LSTM", hl: true },
        { icon: "🗄️", title: "Data Layer", stack: "TimescaleDB, S3" }
      ],
      architectureMermaid: `graph TD
  A["💳 React Native\\n(Mobile App)"] -->|Plaid API| B["🏦 Bank\\nConnection"]
  A -->|Secure REST| C["🔐 Actix-web\\n(Rust API)"]
  C --> D["🧠 LSTM Model\\n(Predictions)"]
  C --> E["🗄️ TimescaleDB\\n(Transactions)"]
  D -->|Forecasts| C
  C --> F["📊 Budget\\nDashboard"]
  style D fill:#e11d48,color:#fff`,
      deepSearchResults: [
        { type: "paper", title: "LSTM Networks for Household Spending Prediction", source: "AAAI, 2024", desc: "Time-series model predicts monthly spending categories with 85% accuracy.", url: "https://aaai.org" },
        { type: "github", title: "plaid-fintech-starter (★ 890)", source: "github.com/plaid/quickstart", desc: "Official Plaid quickstart for bank account linking.", url: "https://github.com" },
        { type: "patent", title: "Automated Budget Reallocation System", source: "US Patent 2023/0298102", desc: "AI dynamically adjusts budget categories based on spending trends.", url: "https://patents.google.com" }
      ],
      mentorChat: [
        { from: "bot", text: "💰 FinTech project ready! Plaid sandbox is configured for bank account linking." },
        { from: "user", text: "What ML model should we use?" },
        { from: "bot", text: "An LSTM network works best for spending pattern prediction. Let's build the transaction categorizer first, then layer on forecasting." }
      ],
      webIntel: [
        { status: "safe", lib: "Plaid SDK 14.x", detail: "Latest version. SOC2 compliant.", badge: "SECURE" },
        { status: "critical", lib: "jsonwebtoken 8.x", detail: "CVE-2022-23529: Remote code execution.", badge: "CVE FOUND" },
        { status: "safe", lib: "React Native 0.74", detail: "Latest stable.", badge: "UP TO DATE" }
      ],
      sprints: [
        { week: "W1", title: "Banking Integration", desc: "Plaid API & Transaction Sync", done: true },
        { week: "W2", title: "Dashboard UI", desc: "Spending Charts & Budget Setup", done: false },
        { week: "W3", title: "Prediction Model", desc: "Train LSTM on Transaction History", done: false },
        { week: "W4", title: "Alerts & Deploy", desc: "Smart Notifications & App Store", done: false }
      ],
      githubIssues: []
    }
  };

  function generateFallback(query) {
    const short = query.length > 60 ? query.substring(0, 60) + "..." : query;
    return {
      title: short,
      stats: [{ val: "10M+", label: "Potential users impacted" }, { val: "3x", label: "Faster than manual approach" }],
      warning: "Manual workflows for this domain are inefficient, error-prone, and don't scale.",
      architectureMermaid: `graph TD
  A["⚛️ React.js\\n(Frontend)"] -->|REST API| B["⚙️ Node.js\\n(Backend)"]
  B --> C["🧠 LangChain\\n(AI Core)"]
  B --> D["🗄️ PostgreSQL\\n(Database)"]
  C -->|Results| B
  D --> E["📊 Analytics"]
  style C fill:#e11d48,color:#fff`,
      arch: [
        { icon: "⚛️", title: "Frontend", stack: "React.js, Vite" },
        { icon: "⚙️", title: "Backend API", stack: "Node.js, Express" },
        { icon: "🧠", title: "AI Core", stack: "Python, LangChain", hl: true },
        { icon: "🗄️", title: "Database", stack: "PostgreSQL, Pinecone" }
      ],
      deepSearchResults: [
        { type: "paper", title: `Research Survey: ${short}`, source: "IEEE Xplore, 2024", desc: "Comprehensive survey of existing approaches and their limitations.", url: "" },
        { type: "github", title: `open-source-${query.split(' ')[0].toLowerCase()} (★ 520)`, source: "GitHub", desc: "Community-maintained reference implementation with MIT license.", url: "" },
        { type: "paper", title: `Deep Learning Approaches for ${query.split(' ').slice(0, 4).join(' ')}`, source: "arXiv, 2023", desc: "Novel neural architecture achieving state-of-the-art results.", url: "" }
      ],
      mentorChat: [
        { from: "bot", text: `🚀 Project "${short}" initialized! I've scaffolded the repo with best practices.` },
        { from: "user", text: "What should I start with?" },
        { from: "bot", text: "Let's begin with the database schema and core API endpoints. I'll push a starter template." }
      ],
      webIntel: [
        { status: "safe", lib: "React 18.3", detail: "Latest stable release.", badge: "UP TO DATE" },
        { status: "safe", lib: "Node.js 20 LTS", detail: "Long-term support. No known CVEs.", badge: "SECURE" },
        { status: "warn", lib: "axios 0.27", detail: "Deprecated. Migrate to 1.x for security patches.", badge: "MIGRATE" }
      ],
      sprints: [
        { week: "W1", title: "Foundation", desc: "Database Schema & API Scaffolding", done: true },
        { week: "W2", title: "Core Features", desc: "Primary UI & Business Logic", done: false },
        { week: "W3", title: "AI Integration", desc: "Model Training & Pipeline", done: false },
        { week: "W4", title: "Polish & Deploy", desc: "Testing, CI/CD & Launch", done: false }
      ],
      githubIssues: []
    };
  }

  function matchBlueprint(query) {
    const q = query.toLowerCase();
    for (const key of Object.keys(blueprints)) {
      if (blueprints[key].keywords.some(kw => q.includes(kw))) return blueprints[key];
    }
    return generateFallback(query);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── RENDER DASHBOARD TABS ──
  // ══════════════════════════════════════════════════════════════════════════
  function renderDashboard(bp) {
    dashTitle.textContent = bp.title;
    canvasContainer.innerHTML = '';
    chatHistory = [];

    // ── Tab: Overview ──
    const overview = el('div', 'tab-panel active', 'tabOverview');

    // Block 1: Problem Validation
    overview.appendChild(createBlock('01. PROBLEM VALIDATION', `
      <div class="stats-row">
        ${(bp.stats || []).map(s => `<div class="stat-box"><div class="stat-val text-gradient">${s.val}</div><div class="stat-lbl">${s.label}</div></div>`).join('')}
        <div class="stat-box warning-box"><div class="icon">⚠️</div><div class="stat-lbl">${escapeHtml(bp.warning || '')}</div></div>
      </div>
    `, '0.1s'));

    // Block 2: Idea Score Card
    if (bp.ideaScore) {
      const is = bp.ideaScore;
      const scoreColor = (s) => s >= 75 ? '#22c55e' : s >= 50 ? '#f59e0b' : '#ef4444';
      overview.appendChild(createBlock('02. IDEA INTELLIGENCE SCORE', `
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;">
          <div style="flex:1;min-width:140px;background:#1a1a2e;border:1px solid #2a2a4a;border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:2rem;font-weight:800;color:${scoreColor(is.innovationScore)}">${is.innovationScore}<span style="font-size:1rem;color:#888">/100</span></div>
            <div style="color:#888;font-size:0.75rem;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">Innovation</div>
            <div style="margin-top:8px;height:4px;background:#2a2a4a;border-radius:2px;"><div style="width:${is.innovationScore}%;height:100%;background:${scoreColor(is.innovationScore)};border-radius:2px;"></div></div>
          </div>
          <div style="flex:1;min-width:140px;background:#1a1a2e;border:1px solid #2a2a4a;border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:2rem;font-weight:800;color:${scoreColor(is.complexityScore)}">${is.complexityScore}<span style="font-size:1rem;color:#888">/100</span></div>
            <div style="color:#888;font-size:0.75rem;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">Complexity</div>
            <div style="margin-top:8px;height:4px;background:#2a2a4a;border-radius:2px;"><div style="width:${is.complexityScore}%;height:100%;background:${scoreColor(is.complexityScore)};border-radius:2px;"></div></div>
          </div>
          <div style="flex:1;min-width:140px;background:#1a1a2e;border:1px solid #2a2a4a;border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:2rem;font-weight:800;color:${scoreColor(is.marketScore)}">${is.marketScore}<span style="font-size:1rem;color:#888">/100</span></div>
            <div style="color:#888;font-size:0.75rem;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">Market</div>
            <div style="margin-top:8px;height:4px;background:#2a2a4a;border-radius:2px;"><div style="width:${is.marketScore}%;height:100%;background:${scoreColor(is.marketScore)};border-radius:2px;"></div></div>
          </div>
          <div style="flex:1;min-width:140px;background:linear-gradient(135deg,#e11d48,#7c3aed);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:2rem;font-weight:800;color:#fff">${is.overallScore}<span style="font-size:1rem;color:rgba(255,255,255,0.7)">/100</span></div>
            <div style="color:rgba(255,255,255,0.8);font-size:0.75rem;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">Overall Score</div>
            <div style="margin-top:8px;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;"><div style="width:${is.overallScore}%;height:100%;background:#fff;border-radius:2px;"></div></div>
          </div>
        </div>
        <div style="background:#1a1a2e;border:1px solid #e11d48;border-radius:10px;padding:14px;margin-bottom:12px;">
          <div style="color:#e11d48;font-size:0.7rem;font-weight:700;letter-spacing:1px;margin-bottom:6px;">VERDICT</div>
          <div style="color:#f1f5f9;font-size:0.9rem;">${escapeHtml(is.verdict || '')}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="background:#0f0f1a;border:1px solid #2a2a4a;border-radius:8px;padding:12px;">
            <div style="color:#888;font-size:0.7rem;font-weight:700;letter-spacing:1px;margin-bottom:6px;">INNOVATION ANALYSIS</div>
            <div style="color:#cbd5e1;font-size:0.82rem;">${escapeHtml(is.innovationReason || '')}</div>
          </div>
          <div style="background:#0f0f1a;border:1px solid #2a2a4a;border-radius:8px;padding:12px;">
            <div style="color:#888;font-size:0.7rem;font-weight:700;letter-spacing:1px;margin-bottom:6px;">MARKET ANALYSIS</div>
            <div style="color:#cbd5e1;font-size:0.82rem;">${escapeHtml(is.marketReason || '')}</div>
          </div>
        </div>
        ${is.similarProjects && is.similarProjects.length > 0 ? `
        <div style="margin-top:12px;">
          <div style="color:#888;font-size:0.7rem;font-weight:700;letter-spacing:1px;margin-bottom:8px;">COMPETING SOLUTIONS</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${is.similarProjects.map(p => `<span style="background:#1e1e3a;border:1px solid #3a3a5a;border-radius:20px;padding:4px 12px;color:#a78bfa;font-size:0.8rem;">${escapeHtml(p)}</span>`).join('')}
          </div>
        </div>` : ''}
        ${is.keyDifferentiator ? `
        <div style="margin-top:12px;background:#0f2a1a;border:1px solid #22c55e;border-radius:8px;padding:12px;">
          <div style="color:#22c55e;font-size:0.7rem;font-weight:700;letter-spacing:1px;margin-bottom:6px;">OUR DIFFERENTIATOR</div>
          <div style="color:#cbd5e1;font-size:0.82rem;">${escapeHtml(is.keyDifferentiator)}</div>
        </div>` : ''}
      `, '0.15s'));
    }

    // Block 3: Full Enterprise Architecture Diagram (Mermaid)
    const mermaidCode = bp.architectureMermaid || '';
    overview.appendChild(createBlock('03. ENTERPRISE SYSTEM ARCHITECTURE', `
      <div class="mermaid-wrapper" style="overflow-x:auto;">
        ${mermaidCode
          ? `<div class="mermaid-container" id="mermaidDiagramOverview" style="min-width:600px;">${escapeHtml(mermaidCode)}</div>`
          : '<p style="color:#888;padding:16px;">Architecture diagram will appear here after generation.</p>'
        }
      </div>
    `, '0.2s'));

    // Block 4: Sprints
    overview.appendChild(createBlock('04. AGILE MILESTONE PLAN', `
      <div class="sprint-list">
        ${(bp.sprints || []).map(s => `
          <div class="sprint-item ${s.done ? 'done' : 'pending'}">
            <div class="check">${s.done ? '✓' : ''}</div>
            <div>
              <h4>${escapeHtml(s.week)}: ${escapeHtml(s.title)}</h4>
              <p>${escapeHtml(s.desc)}</p>
              ${s.milestones && s.milestones.length > 0 ? `
                <ul style="margin-top:6px;padding-left:16px;">
                  ${s.milestones.map(m => `<li style="color:#94a3b8;font-size:0.8rem;margin-bottom:2px;">${escapeHtml(m)}</li>`).join('')}
                </ul>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      ${bp.githubIssues && bp.githubIssues.length > 0 ? `
        <div style="margin-top:12px;">
          <button id="provisionBtn" class="provision-btn">
            🚀 Provision on GitHub (${bp.githubIssues.length} Issues)
          </button>
        </div>
      ` : `
        <div style="margin-top:12px;">
          <button id="provisionBtn" class="provision-btn">
            🚀 Provision on GitHub
          </button>
        </div>
      `}
    `, '0.3s'));

    canvasContainer.appendChild(overview);

    // Render Mermaid in Overview after DOM is ready
    if (mermaidCode) {
      setTimeout(() => renderMermaidDiagram(mermaidCode, 'mermaidDiagramOverview'), 200);
    }


    // ── Tab: DeepSearch ──
    const dsTab = el('div', 'tab-panel', 'tabDeepsearch');
    dsTab.appendChild(createBlock('DEEPSEARCH RAG RESULTS', `
      <div class="search-results">
        ${(bp.deepSearchResults || []).map(r => `
          <div class="search-result-item">
            <span class="result-type ${r.type}">${r.type.toUpperCase()}</span>
            <div class="result-info">
              <h4>${r.url ? `<a href="${escapeHtml(r.url)}" target="_blank" rel="noopener">${escapeHtml(r.title)}</a>` : escapeHtml(r.title)}</h4>
              <p>${escapeHtml(r.source)} — ${escapeHtml(r.desc)}</p>
            </div>
          </div>
        `).join('')}
        ${(bp.deepSearchResults || []).length === 0 ? '<p style="color:#888;padding:16px;">Run a query to see real research results from arXiv, IEEE, and GitHub.</p>' : ''}
      </div>
    `));
    canvasContainer.appendChild(dsTab);

    // ── Tab: Architecture Diagram (Mermaid) ──
    const archTab = el('div', 'tab-panel', 'tabArchitecture');
    const mermaidCode = bp.architectureMermaid || '';
    archTab.appendChild(createBlock('SYSTEM ARCHITECTURE DIAGRAM', `
      <div class="mermaid-wrapper">
        ${mermaidCode
          ? `<div class="mermaid-container" id="mermaidDiagram">${escapeHtml(mermaidCode)}</div>`
          : '<p style="color:#888;padding:16px;">Architecture diagram will appear here after generation.</p>'
        }
      </div>
    `));
    canvasContainer.appendChild(archTab);

    // Render Mermaid after DOM is ready
    if (mermaidCode) {
      setTimeout(() => renderMermaidDiagram(mermaidCode), 200);
    }

    // ── Tab: AI Mentor ──
    const mentorTab = el('div', 'tab-panel', 'tabMentor');
    const mentorBlock = createBlock('AI MENTOR — LIVE SESSION', `
      <div class="mentor-chat-container">
        <div class="chat-messages" id="chatMessages">
          ${(bp.mentorChat || []).map(m => m.from === 'bot'
            ? `<div class="msg bot"><div class="avatar">🤖</div><div class="bubble">${escapeHtml(m.text)}</div></div>`
            : `<div class="msg user"><div class="bubble">${escapeHtml(m.text)}</div></div>`
          ).join('')}
        </div>
        <div class="chat-input-row">
          <input type="text" id="mentorInput" placeholder="Ask your AI mentor anything...">
          <button id="mentorSendBtn">Send</button>
        </div>
      </div>
    `);
    mentorTab.appendChild(mentorBlock);
    canvasContainer.appendChild(mentorTab);

    // ── Tab: Web Intel ──
    const wiTab = el('div', 'tab-panel', 'tabWebintel');
    wiTab.appendChild(createBlock('REAL-TIME WEB INTELLIGENCE MONITOR', `
      <div class="intel-list">
        ${(bp.webIntel || []).map(w => `
          <div class="intel-item">
            <div class="intel-dot ${w.status}"></div>
            <div class="intel-info"><h4>${escapeHtml(w.lib)}</h4><p>${escapeHtml(w.detail)}</p></div>
            <span class="intel-badge ${w.status}">${escapeHtml(w.badge)}</span>
          </div>
        `).join('')}
        ${(bp.webIntel || []).length === 0 ? '<p style="color:#888;padding:16px;">Vulnerability scan data will appear here after generation.</p>' : ''}
      </div>
    `));
    canvasContainer.appendChild(wiTab);

    // ── Wire up sidebar tab clicks ──
    document.querySelectorAll('.sidebar .nav-item[data-tab]').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.sidebar .nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        const tabId = 'tab' + capitalize(item.dataset.tab);
        document.getElementById(tabId)?.classList.add('active');
      });
    });

    // ── Wire up Mentor Chat (real API) ──
    setTimeout(() => wireMentorChat(bp), 300);

    // ── Wire up Provision Button ──
    setTimeout(() => wireProvisionButton(bp), 300);
  }

  // ── Mermaid Diagram Renderer ────────────────────────────────────────────
  async function renderMermaidDiagram(code, containerId = 'mermaidDiagram') {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      // Wait for Mermaid to load
      let attempts = 0;
      while (!window.mermaidReady && attempts < 20) {
        await new Promise(r => setTimeout(r, 200));
        attempts++;
      }

      if (!window.mermaidReady) {
        container.innerHTML = `<pre style="font-size:12px;color:#666;white-space:pre-wrap;">${escapeHtml(code)}</pre>`;
        return;
      }

      container.removeAttribute('data-processed');
      container.className = 'mermaid';

      // Strip markdown fences if present
      let safeCode = code.replace(/```mermaid\n?/, '').replace(/```$/, '').trim();

      const { svg } = await mermaid.render('arch-diagram-' + containerId + '-' + Date.now(), safeCode);
      container.innerHTML = svg;
      container.className = 'mermaid-rendered';
    } catch (err) {
      console.warn('[Mermaid] Render error:', err.message);
      container.innerHTML = `<div style="padding:2rem;color:#ff4444;text-align:center;border:1px dashed #ffb3b3;border-radius:8px;margin:1rem 0;background:#fff5f5;">
        <h4 style="margin:0 0 0.5rem 0;color:#d32f2f;">Diagram Generation Failed</h4>
        <p style="font-size:0.9rem;color:#666;margin:0 0 1rem 0;">The AI generated invalid flowchart syntax. You can ask the AI Mentor to redraw the diagram.</p>
        <pre style="text-align:left;background:#222;color:#0f0;padding:1rem;border-radius:4px;font-size:11px;overflow-x:auto;">${escapeHtml(code)}</pre>
      </div>`;
    }
  }


  // ── Wire Mentor Chat to Real API ────────────────────────────────────────
  function wireMentorChat(bp) {
    const mentorInput = document.getElementById('mentorInput');
    const mentorSendBtn = document.getElementById('mentorSendBtn');
    const chatMessages = document.getElementById('chatMessages');
    if (!mentorInput || !mentorSendBtn || !chatMessages) return;

    async function sendMessage() {
      const text = mentorInput.value.trim();
      if (!text) return;

      // User message
      const userMsg = document.createElement('div');
      userMsg.className = 'msg user';
      userMsg.innerHTML = `<div class="bubble">${escapeHtml(text)}</div>`;
      chatMessages.appendChild(userMsg);
      mentorInput.value = '';
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Typing indicator
      const typingMsg = document.createElement('div');
      typingMsg.className = 'msg bot typing-indicator';
      typingMsg.innerHTML = `<div class="avatar">🤖</div><div class="bubble"><span class="typing-dots">●●●</span></div>`;
      chatMessages.appendChild(typingMsg);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      chatHistory.push({ role: 'user', content: text });

      try {
        const response = await fetch(`${API_BASE}/api/mentor-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            blueprint: { title: bp.title, techStack: bp.techStack },
            history: chatHistory.slice(-6)
          })
        });

        const data = await response.json();
        const reply = data.response || "I couldn't process that. Please try again.";
        chatHistory.push({ role: 'assistant', content: reply });

        typingMsg.remove();
        const botMsg = document.createElement('div');
        botMsg.className = 'msg bot';
        botMsg.innerHTML = `<div class="avatar">🤖</div><div class="bubble">${escapeHtml(reply)}</div>`;
        chatMessages.appendChild(botMsg);
        chatMessages.scrollTop = chatMessages.scrollHeight;

      } catch (err) {
        // Fallback responses
        const fallbacks = [
          "Based on your architecture, I'd recommend starting with the database schema for a solid foundation.",
          "Good question! The ML component should be built as a separate microservice to maintain clean separation of concerns.",
          "For this sprint, focus on getting core API endpoints working first. The ML integration comes in Week 3.",
          "Security tip: Always validate user input on both frontend and backend layers.",
          "Great progress! Make sure to add proper error handling before moving to production."
        ];
        const reply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        typingMsg.remove();
        const botMsg = document.createElement('div');
        botMsg.className = 'msg bot';
        botMsg.innerHTML = `<div class="avatar">🤖</div><div class="bubble">${escapeHtml(reply)}</div>`;
        chatMessages.appendChild(botMsg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }

    mentorSendBtn.addEventListener('click', sendMessage);
    mentorInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
  }

  // ── Wire Provision Button ───────────────────────────────────────────────
  function wireProvisionButton(bp) {
    const btn = document.getElementById('provisionBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      showProvisionModal(bp);
    });
  }

  function showProvisionModal(bp) {
    // Remove existing modal
    document.getElementById('provisionModal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'provisionModal';
    modal.style.cssText = `
      position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);
      z-index:9999;display:flex;align-items:center;justify-content:center;
      backdrop-filter:blur(4px);
    `;

    const defaultRepoName = (bp.title || 'my-project')
      .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '').substring(0, 50);

    modal.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:32px;max-width:480px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
        <h2 style="margin:0 0 8px;font-family:Inter,sans-serif;color:#1a1a1a;">🚀 Provision on GitHub</h2>
        <p style="color:#666;font-size:14px;margin:0 0 24px;">Create a real GitHub repository with README, milestones, and ${(bp.githubIssues || []).length || 16} Issues from your sprint plan.</p>

        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:13px;font-weight:600;color:#333;margin-bottom:6px;">Repository Name</label>
          <input id="modalRepoName" type="text" value="${defaultRepoName}" style="width:100%;padding:10px 12px;border:1.5px solid #ddd;border-radius:8px;font-family:monospace;font-size:14px;box-sizing:border-box;">
        </div>

        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:13px;font-weight:600;color:#333;margin-bottom:6px;">GitHub Personal Access Token</label>
          <input id="modalGithubToken" type="password" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" style="width:100%;padding:10px 12px;border:1.5px solid #ddd;border-radius:8px;font-family:monospace;font-size:13px;box-sizing:border-box;">
          <p style="font-size:11px;color:#888;margin:6px 0 0;">Need a token? <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" style="color:#e11d48;">Create one here</a> (requires <code>repo</code> scope)</p>
        </div>

        <div style="margin-bottom:24px;display:flex;gap:16px;">
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;">
            <input type="checkbox" id="modalPrivate" checked> Private repository
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;">
            <input type="checkbox" id="modalIssues" checked> Create GitHub Issues
          </label>
        </div>

        <div style="display:flex;gap:12px;">
          <button id="modalCancelBtn" style="flex:1;padding:12px;border:1.5px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;font-size:14px;font-family:Inter,sans-serif;">Cancel</button>
          <button id="modalProvisionBtn" style="flex:2;padding:12px;border:none;border-radius:8px;background:#e11d48;color:#fff;cursor:pointer;font-size:14px;font-weight:600;font-family:Inter,sans-serif;">🚀 Provision Now</button>
        </div>

        <div id="modalStatus" style="margin-top:16px;display:none;"></div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('modalCancelBtn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    document.getElementById('modalProvisionBtn').addEventListener('click', async () => {
      const repoName = document.getElementById('modalRepoName').value.trim();
      const githubToken = document.getElementById('modalGithubToken').value.trim();
      const isPrivate = document.getElementById('modalPrivate').checked;
      const includeIssues = document.getElementById('modalIssues').checked;
      const statusEl = document.getElementById('modalStatus');
      const provBtn = document.getElementById('modalProvisionBtn');

      if (!repoName || !githubToken) {
        statusEl.style.display = 'block';
        statusEl.innerHTML = '<p style="color:#e11d48;font-size:13px;">⚠️ Please fill in all required fields.</p>';
        return;
      }

      // Loading state
      provBtn.disabled = true;
      provBtn.textContent = '⏳ Provisioning...';
      statusEl.style.display = 'block';
      statusEl.innerHTML = '<p style="color:#666;font-size:13px;">🔧 Creating repository and GitHub Issues...</p>';

      try {
        const response = await fetch(`${API_BASE}/api/provision-repo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blueprint: currentBlueprint,
            repoName,
            githubToken,
            isPrivate,
            includeIssues,
            includeReadme: true,
            includeEnvTemplate: true,
            includeMilestones: true
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Provisioning failed');
        }

        // Success!
        statusEl.innerHTML = `
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;">
            <p style="color:#16a34a;font-weight:600;margin:0 0 8px;">✅ Repository Provisioned!</p>
            <p style="font-size:13px;color:#333;margin:0 0 4px;">📦 <strong>${result.repository?.fullName}</strong></p>
            <p style="font-size:13px;color:#333;margin:0 0 8px;">📋 ${result.scaffolding?.issues?.created || 0} Issues created across ${result.scaffolding?.milestones?.length || 0} milestones</p>
            <a href="${result.repository?.url}" target="_blank" rel="noopener" style="display:inline-block;padding:8px 16px;background:#e11d48;color:#fff;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">View on GitHub →</a>
          </div>
        `;
        provBtn.textContent = '✅ Done!';

      } catch (err) {
        statusEl.innerHTML = `<p style="color:#e11d48;font-size:13px;">❌ ${escapeHtml(err.message)}</p>`;
        provBtn.disabled = false;
        provBtn.textContent = '🚀 Retry';
      }
    });
  }

  // ── Toast Notifications ─────────────────────────────────────────────────
  function showToast(message, type = 'info') {
    const colors = { info: '#3b82f6', warn: '#f59e0b', error: '#e11d48', success: '#22c55e' };
    const toast = document.createElement('div');
    toast.style.cssText = `
      position:fixed;bottom:24px;right:24px;padding:12px 20px;background:${colors[type] || colors.info};
      color:#fff;border-radius:8px;font-family:Inter,sans-serif;font-size:14px;font-weight:500;
      z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.2);max-width:300px;
      animation:fadeUp 0.3s ease forwards;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  function el(tag, cls, id) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (id) e.id = id;
    return e;
  }
  function createBlock(label, innerHtml, delay) {
    const block = document.createElement('div');
    block.className = 'figma-block' + (delay ? ' animate-up' : '');
    if (delay) block.style.animationDelay = delay;
    block.innerHTML = `<div class="block-label">${label}</div>${innerHtml}`;
    return block;
  }
  function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  const refineInput = document.getElementById('refineInput');
  const refineBtn = document.getElementById('refineBtn');



  // ── Events ───────────────────────────────────────────────────────────────
  generateBtn.addEventListener('click', () => {
    const query = queryInput.value.trim();
    if (query) {
      simulateProcessing(query);
    } else {
      queryInput.style.animation = "shake 0.4s";
      setTimeout(() => queryInput.style.animation = "", 400);
    }
  });

  refineBtn.addEventListener('click', () => {
    const query = refineInput.value.trim();
    if (query) {
      quickRegenerate(query);
    } else {
      refineInput.style.animation = "shake 0.4s";
      setTimeout(() => refineInput.style.animation = "", 400);
    }
  });
  refineInput.addEventListener('keypress', e => { if (e.key === 'Enter') { e.preventDefault(); refineBtn.click(); } });

  newQueryBtn.addEventListener('click', () => {
    showScreen('landing');
    queryInput.value = "";
    queryInput.focus();
    progressBar.style.width = "0%";
  });

  queryInput.addEventListener('keypress', e => { if (e.key === 'Enter') { e.preventDefault(); generateBtn.click(); } });
}

// Safe initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Shake keyframes + provision button styles
const s = document.createElement('style');
s.innerHTML = `
  @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}50%{transform:translateX(8px)}75%{transform:translateX(-8px)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  .provision-btn{
    display:inline-flex;align-items:center;gap:8px;
    padding:12px 24px;background:#e11d48;color:#fff;
    border:none;border-radius:10px;font-family:Inter,sans-serif;
    font-size:14px;font-weight:600;cursor:pointer;
    transition:all 0.2s;box-shadow:0 4px 15px rgba(225,29,72,0.3);
  }
  .provision-btn:hover{background:#c0103a;transform:translateY(-1px);box-shadow:0 6px 20px rgba(225,29,72,0.4);}
  .mermaid-wrapper{overflow:auto;padding:16px;}
  .mermaid-rendered svg{max-width:100%;height:auto;border-radius:8px;}
  .typing-dots{animation:typingPulse 1.4s infinite;}
  @keyframes typingPulse{0%,100%{opacity:0.3}50%{opacity:1}}
  .search-result-item a{color:#e11d48;text-decoration:none;}
  .search-result-item a:hover{text-decoration:underline;}
`;
document.head.appendChild(s);
