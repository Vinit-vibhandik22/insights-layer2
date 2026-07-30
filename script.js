document.addEventListener('DOMContentLoaded', () => {
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
    const loginBtn = document.getElementById('loginBtn');


    // Smooth scroll for nav links
    document.getElementById('navFeatures')?.addEventListener('click', e => { e.preventDefault(); document.getElementById('featuresSection')?.scrollIntoView({ behavior:'smooth' }); });
    document.getElementById('navArchitecture')?.addEventListener('click', e => { e.preventDefault(); document.getElementById('archSection')?.scrollIntoView({ behavior:'smooth' }); });
    document.getElementById('navRoadmap')?.addEventListener('click', e => { e.preventDefault(); document.getElementById('roadmapSection')?.scrollIntoView({ behavior:'smooth' }); });
    document.getElementById('navHome')?.addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top:0, behavior:'smooth' }); });

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

    // ── Loading Stages ──
    const loadingStages = [
        { text: "Executing Multimodal DeepSearch...", sub: "Querying arXiv, IEEE Xplore, GitHub [1/5]" },
        { text: "Knowledge Clustering Active...", sub: "Synthesizing root cause analysis [2/5]" },
        { text: "Generating System Architecture...", sub: "Mapping tech stack constraints [3/5]" },
        { text: "Formulating Agile Milestones...", sub: "Applying RMDP schedule optimization [4/5]" },
        { text: "Deploying AI Mentor Agent...", sub: "Configuring Telegram/Discord bot [5/5]" }
    ];

    // ══════════════════════════════════════════════
    // ── BLUEPRINT DATABASE (prompt-driven) ──
    // ══════════════════════════════════════════════
    const blueprints = {
        foodWaste: {
            keywords: ["food waste","hostel","canteen","mess","food management"],
            title: "Hostel Food Waste Reduction",
            stats: [{ val:"1.3B", label:"Tonnes wasted globally/yr" },{ val:"100g", label:"Wasted per student/day" }],
            warning: "Blind cooking for max capacity causes massive overproduction.",
            arch: [
                { icon:"📱", title:"Mobile App", stack:"React Native, Expo" },
                { icon:"⚙️", title:"Backend API", stack:"Node.js, Express" },
                { icon:"🧠", title:"AI Forecasting", stack:"Python, Prophet", hl:true },
                { icon:"🗄️", title:"Database", stack:"PostgreSQL, Redis" }
            ],
            deepSearchResults: [
                { type:"paper", title:"Food Waste Prediction Using ML in Institutional Canteens", source:"IEEE Xplore, 2024", desc:"LSTM-based model predicts daily food consumption with 89% accuracy." },
                { type:"github", title:"hostel-food-manager (★ 342)", source:"github.com/smartcanteen", desc:"Open-source meal booking & waste tracking system built with MERN." },
                { type:"paper", title:"IoT-Based Smart Cafeteria Management System", source:"arXiv, 2023", desc:"Uses weight sensors and computer vision to monitor plate waste." },
                { type:"patent", title:"Dynamic Meal Portion Control System", source:"US Patent 2024/0158421", desc:"AI-driven portioning based on historical consumption patterns." }
            ],
            mentorChat: [
                { from:"bot", text:"👋 Hey! I'm your AI Scrum Master. I've analyzed your food waste project. Ready to start Sprint 1?" },
                { from:"user", text:"Yes, what should I focus on first?" },
                { from:"bot", text:"Let's start with the PostgreSQL schema. I recommend these tables: `meals`, `bookings`, `waste_logs`, `students`. I'll send the migration file to your IDE." },
                { from:"user", text:"What ML model should I use for prediction?" },
                { from:"bot", text:"Based on DeepSearch results, Facebook Prophet works best for this use case. It handles seasonality in meal patterns. I'll set up a training notebook for you." }
            ],
            webIntel: [
                { status:"safe", lib:"React Native 0.74", detail:"Latest stable. No known CVEs.", badge:"UP TO DATE" },
                { status:"warn", lib:"Express.js 4.x", detail:"v4 entering maintenance. Migrate to v5 recommended.", badge:"MIGRATE" },
                { status:"safe", lib:"Prophet 1.1.5", detail:"Actively maintained by Meta.", badge:"SECURE" },
                { status:"critical", lib:"node-fetch 2.x", detail:"CVE-2022-0235: Header leak vulnerability.", badge:"CVE FOUND" }
            ],
            sprints: [
                { week:"W1", title:"Infrastructure", desc:"DB Schema, Backend API, Auth System", done:true },
                { week:"W2", title:"Meal Booking UI", desc:"Mobile App with Booking Module", done:false },
                { week:"W3", title:"AI Pipeline", desc:"Prophet Model Training & Validation", done:false },
                { week:"W4", title:"Deployment", desc:"Integration, Testing & Go-Live", done:false }
            ]
        },
        attendance: {
            keywords: ["attendance","face","recognition","biometric","face recognition"],
            title: "Smart Attendance via Face Recognition",
            stats: [{ val:"35%", label:"Time wasted on manual roll calls" },{ val:"92%", label:"Face recognition accuracy" }],
            warning: "Manual attendance is slow, error-prone, and easy to proxy.",
            arch: [
                { icon:"📷", title:"Camera Module", stack:"OpenCV, Pi Camera" },
                { icon:"⚙️", title:"Backend", stack:"FastAPI, Python" },
                { icon:"🧠", title:"Face AI", stack:"dlib, FaceNet", hl:true },
                { icon:"🗄️", title:"Database", stack:"MongoDB, S3" }
            ],
            deepSearchResults: [
                { type:"paper", title:"Real-Time Face Recognition for Automated Attendance", source:"IEEE, 2024", desc:"Uses FaceNet embeddings with 98.7% accuracy on classroom datasets." },
                { type:"github", title:"face-attendance-system (★ 1.2k)", source:"github.com/ageitgey/face_recognition", desc:"Python library for face recognition built with dlib." },
                { type:"paper", title:"Anti-Spoofing Techniques for Face-Based Attendance", source:"arXiv, 2023", desc:"Liveness detection using blink analysis and depth mapping." }
            ],
            mentorChat: [
                { from:"bot", text:"🎓 Attendance project initialized! I've set up a Python environment with OpenCV and dlib." },
                { from:"user", text:"How do I handle spoofing?" },
                { from:"bot", text:"Good question! Based on the research, implement liveness detection: check for blinks and micro-movements. I'll add the anti-spoof module to your repo." }
            ],
            webIntel: [
                { status:"safe", lib:"OpenCV 4.9", detail:"Latest stable release.", badge:"UP TO DATE" },
                { status:"safe", lib:"dlib 19.24", detail:"No known vulnerabilities.", badge:"SECURE" },
                { status:"warn", lib:"Pillow 9.x", detail:"CVE-2023-44271: DoS via large images. Upgrade to 10.x.", badge:"UPGRADE" }
            ],
            sprints: [
                { week:"W1", title:"Data Collection", desc:"Face dataset capture & preprocessing", done:true },
                { week:"W2", title:"Model Training", desc:"FaceNet embeddings & classifier", done:false },
                { week:"W3", title:"Integration", desc:"Camera + Backend + Dashboard", done:false },
                { week:"W4", title:"Anti-Spoof & Deploy", desc:"Liveness detection & production", done:false }
            ]
        },
        finance: {
            keywords: ["finance","budget","expense","money","tracker","banking","fintech"],
            title: "AI Personal Finance Tracker",
            stats: [{ val:"78%", label:"Adults live paycheck to paycheck" },{ val:"$8.9K", label:"Avg credit card debt/person" }],
            warning: "Lack of financial literacy and automated budgeting leads to chronic overspending.",
            arch: [
                { icon:"💳", title:"Mobile App", stack:"React Native, Plaid" },
                { icon:"🔐", title:"Secure API", stack:"Rust, Actix-web" },
                { icon:"🧠", title:"Spending AI", stack:"Python, LSTM", hl:true },
                { icon:"🗄️", title:"Data Layer", stack:"TimescaleDB, S3" }
            ],
            deepSearchResults: [
                { type:"paper", title:"LSTM Networks for Household Spending Prediction", source:"AAAI, 2024", desc:"Time-series model predicts monthly spending categories with 85% accuracy." },
                { type:"github", title:"plaid-fintech-starter (★ 890)", source:"github.com/plaid/quickstart", desc:"Official Plaid quickstart for bank account linking." },
                { type:"patent", title:"Automated Budget Reallocation System", source:"US Patent 2023/0298102", desc:"AI dynamically adjusts budget categories based on spending trends." }
            ],
            mentorChat: [
                { from:"bot", text:"💰 FinTech project ready! Plaid sandbox is configured for bank account linking." },
                { from:"user", text:"What ML model should we use?" },
                { from:"bot", text:"An LSTM network works best for spending pattern prediction. Let's first build the transaction categorizer, then layer on the forecasting." }
            ],
            webIntel: [
                { status:"safe", lib:"Plaid SDK 14.x", detail:"Latest version. SOC2 compliant.", badge:"SECURE" },
                { status:"critical", lib:"jsonwebtoken 8.x", detail:"CVE-2022-23529: Remote code execution.", badge:"CVE FOUND" },
                { status:"safe", lib:"React Native 0.74", detail:"Latest stable.", badge:"UP TO DATE" }
            ],
            sprints: [
                { week:"W1", title:"Banking Integration", desc:"Plaid API & Transaction Sync", done:true },
                { week:"W2", title:"Dashboard UI", desc:"Spending Charts & Budget Setup", done:false },
                { week:"W3", title:"Prediction Model", desc:"Train LSTM on Transaction History", done:false },
                { week:"W4", title:"Alerts & Deploy", desc:"Smart Notifications & App Store", done:false }
            ]
        }
    };

    // ── Generate a fallback dynamic blueprint for unknown prompts ──
    function generateFallback(query) {
        const short = query.length > 60 ? query.substring(0,60) + "..." : query;
        return {
            title: short,
            stats: [{ val:"10M+", label:"Potential users impacted" },{ val:"3x", label:"Faster than manual approach" }],
            warning: "Manual workflows for this domain are inefficient, error-prone, and don't scale.",
            arch: [
                { icon:"⚛️", title:"Frontend", stack:"React.js, Vite" },
                { icon:"🌐", title:"Backend API", stack:"Node.js, Express" },
                { icon:"🧠", title:"AI Core", stack:"Python, LangChain", hl:true },
                { icon:"🗄️", title:"Database", stack:"PostgreSQL, Pinecone" }
            ],
            deepSearchResults: [
                { type:"paper", title:`Research Survey: ${short}`, source:"IEEE Xplore, 2024", desc:"Comprehensive survey of existing approaches and their limitations." },
                { type:"github", title:`open-source-${query.split(' ')[0].toLowerCase()} (★ 520)`, source:"GitHub", desc:"Community-maintained reference implementation with MIT license." },
                { type:"paper", title:`Deep Learning Approaches for ${query.split(' ').slice(0,4).join(' ')}`, source:"arXiv, 2023", desc:"Novel neural architecture achieving state-of-the-art results." }
            ],
            mentorChat: [
                { from:"bot", text:`🚀 Project "${short}" initialized! I've scaffolded the repo with best practices.` },
                { from:"user", text:"What should I start with?" },
                { from:"bot", text:"Let's begin with the database schema and core API endpoints. I've pushed a starter template to your IDE." }
            ],
            webIntel: [
                { status:"safe", lib:"React 18.3", detail:"Latest stable release.", badge:"UP TO DATE" },
                { status:"safe", lib:"Node.js 20 LTS", detail:"Long-term support. No known CVEs.", badge:"SECURE" },
                { status:"warn", lib:"axios 0.27", detail:"Deprecated. Migrate to 1.x for security patches.", badge:"MIGRATE" }
            ],
            sprints: [
                { week:"W1", title:"Foundation", desc:"Database Schema & API Scaffolding", done:true },
                { week:"W2", title:"Core Features", desc:"Primary UI & Business Logic", done:false },
                { week:"W3", title:"AI Integration", desc:"Model Training & Pipeline", done:false },
                { week:"W4", title:"Polish & Deploy", desc:"Testing, CI/CD & Launch", done:false }
            ]
        };
    }

    // ── Match prompt to blueprint ──
    function matchBlueprint(query) {
        const q = query.toLowerCase();
        for (const key of Object.keys(blueprints)) {
            if (blueprints[key].keywords.some(kw => q.includes(kw))) return blueprints[key];
        }
        return generateFallback(query);
    }

    // ══════════════════════════════════════════════
    // ── RENDER DASHBOARD TABS ──
    // ══════════════════════════════════════════════
    function renderDashboard(bp) {
        dashTitle.textContent = bp.title;
        canvasContainer.innerHTML = '';

        // ── Tab: Overview ──
        const overview = el('div', 'tab-panel active', 'tabOverview');

        // Block 1: Problem Validation
        overview.appendChild(createBlock('01. PROBLEM VALIDATION', `
            <div class="stats-row">
                ${bp.stats.map(s => `<div class="stat-box"><div class="stat-val text-gradient">${s.val}</div><div class="stat-lbl">${s.label}</div></div>`).join('')}
                <div class="stat-box warning-box"><div class="icon">⚠️</div><div class="stat-lbl">${bp.warning}</div></div>
            </div>
        `, '0.1s'));

        // Block 2: Architecture
        overview.appendChild(createBlock('02. RECOMMENDED ARCHITECTURE', `
            <div class="arch-diagram">
                ${bp.arch.map((a,i) => `
                    ${i>0?'<div class="arch-arrow">→</div>':''}
                    <div class="arch-card ${a.hl?'highlight-card':''}">
                        <div class="arch-icon">${a.icon}</div>
                        <div class="arch-title">${a.title}</div>
                        <div class="arch-stack">${a.stack}</div>
                    </div>
                `).join('')}
            </div>
        `, '0.2s'));

        // Block 3: Sprints
        overview.appendChild(createBlock('03. AGILE MILESTONE PLAN', `
            <div class="sprint-list">
                ${bp.sprints.map(s => `
                    <div class="sprint-item ${s.done?'done':'pending'}">
                        <div class="check">${s.done?'✓':''}</div>
                        <div><h4>${s.week}: ${s.title}</h4><p>${s.desc}</p></div>
                    </div>
                `).join('')}
            </div>
        `, '0.3s'));
        canvasContainer.appendChild(overview);

        // ── Tab: DeepSearch ──
        const dsTab = el('div', 'tab-panel', 'tabDeepsearch');
        dsTab.appendChild(createBlock('DEEPSEARCH RAG RESULTS', `
            <div class="search-results">
                ${bp.deepSearchResults.map(r => `
                    <div class="search-result-item">
                        <span class="result-type ${r.type}">${r.type.toUpperCase()}</span>
                        <div class="result-info">
                            <h4>${r.title}</h4>
                            <p>${r.source} — ${r.desc}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `));
        canvasContainer.appendChild(dsTab);

        // ── Tab: AI Mentor ──
        const mentorTab = el('div', 'tab-panel', 'tabMentor');
        const mentorBlock = createBlock('TELEGRAM AI MENTOR — LIVE SESSION', `
            <div class="mentor-chat-container">
                <div class="chat-messages" id="chatMessages">
                    ${bp.mentorChat.map(m => m.from === 'bot'
                        ? `<div class="msg bot"><div class="avatar">🤖</div><div class="bubble">${m.text}</div></div>`
                        : `<div class="msg user"><div class="bubble">${m.text}</div></div>`
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
                ${bp.webIntel.map(w => `
                    <div class="intel-item">
                        <div class="intel-dot ${w.status}"></div>
                        <div class="intel-info"><h4>${w.lib}</h4><p>${w.detail}</p></div>
                        <span class="intel-badge ${w.status}">${w.badge}</span>
                    </div>
                `).join('')}
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

        // ── Wire up Mentor Chat ──
        setTimeout(() => {
            const mentorInput = document.getElementById('mentorInput');
            const mentorSendBtn = document.getElementById('mentorSendBtn');
            const chatMessages = document.getElementById('chatMessages');
            if (!mentorInput || !mentorSendBtn || !chatMessages) return;

            const botResponses = [
                "Good question! Let me check the DeepSearch results for relevant approaches...",
                "Based on the architecture, I'd recommend starting with that module first. Want me to scaffold the code?",
                "I've found 3 related GitHub repos. The top one has 1.2k stars and uses a similar stack. Want me to analyze it?",
                "That's a common issue. The solution is to add proper error handling in the API layer. I'll push a fix to your branch.",
                "Great progress! You're ahead of the sprint timeline. Let's move to the next milestone.",
                "I've detected a potential bottleneck in the database queries. Consider adding an index on that column.",
                "The ML model accuracy is at 87%. I recommend collecting more training data for the edge cases.",
                "Security check: Your JWT tokens should use RS256 instead of HS256 for production. Want me to update the config?"
            ];
            let responseIdx = 0;

            function sendMessage() {
                const text = mentorInput.value.trim();
                if (!text) return;
                // User message
                const userMsg = document.createElement('div');
                userMsg.className = 'msg user';
                userMsg.innerHTML = `<div class="bubble">${escapeHtml(text)}</div>`;
                chatMessages.appendChild(userMsg);
                mentorInput.value = '';
                chatMessages.scrollTop = chatMessages.scrollHeight;

                // Bot reply after delay
                setTimeout(() => {
                    const botMsg = document.createElement('div');
                    botMsg.className = 'msg bot';
                    botMsg.innerHTML = `<div class="avatar">🤖</div><div class="bubble">${botResponses[responseIdx % botResponses.length]}</div>`;
                    chatMessages.appendChild(botMsg);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    responseIdx++;
                }, 800 + Math.random() * 700);
            }

            mentorSendBtn.addEventListener('click', sendMessage);
            mentorInput.addEventListener('keypress', e => { if(e.key==='Enter') sendMessage(); });
        }, 300);
    }

    // ── Helpers ──
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
    function escapeHtml(str) { const d=document.createElement('div'); d.textContent=str; return d.innerHTML; }

    const refineInput = document.getElementById('refineInput');
    const refineBtn = document.getElementById('refineBtn');

    // ── Screen Management ──
    function showScreen(name) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        screens[name].classList.add('active');
        // Toggle top nav visibility
        document.getElementById('topNav').style.display = name === 'dashboard' ? 'none' : '';
    }

    async function simulateProcessing(query) {
        showScreen('loader');
        progressBar.style.width = '0%';

        for (let i = 0; i < loadingStages.length; i++) {
            loaderText.textContent = loadingStages[i].text;
            loaderSubText.textContent = loadingStages[i].sub;
            progressBar.style.width = `${((i+1)/loadingStages.length)*100}%`;
            await new Promise(r => setTimeout(r, 1000));
        }

        const bp = matchBlueprint(query);
        renderDashboard(bp);

        // Populate the refine input with current query
        refineInput.value = query;

        // Reset sidebar to Overview tab
        document.querySelectorAll('.sidebar .nav-item').forEach(n => n.classList.remove('active'));
        document.querySelector('.sidebar .nav-item[data-tab="overview"]')?.classList.add('active');

        showScreen('dashboard');
    }

    // Quick re-generate (no full loader, just a brief flash)
    async function quickRegenerate(query) {
        // Brief loading flash
        canvasContainer.style.opacity = '0.3';
        canvasContainer.style.transition = 'opacity 0.3s';

        await new Promise(r => setTimeout(r, 400));

        const bp = matchBlueprint(query);
        renderDashboard(bp);

        // Reset sidebar to Overview tab
        document.querySelectorAll('.sidebar .nav-item').forEach(n => n.classList.remove('active'));
        document.querySelector('.sidebar .nav-item[data-tab="overview"]')?.classList.add('active');

        canvasContainer.style.opacity = '1';
    }

    // ── Events ──
    
loginBtn.addEventListener("click", (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if(email === "" || password === ""){
        alert("Please enter Email and Password");
        return;
    }

    document.getElementById("login").style.display = "none";
    showScreen("landing");
});
    
    // Refine bar: re-generate from dashboard
    refineBtn.addEventListener('click', () => {
        const query = refineInput.value.trim();
        if (query) {
            quickRegenerate(query);
        } else {
            refineInput.style.animation = "shake 0.4s";
            setTimeout(() => refineInput.style.animation = "", 400);
        }
    });
    refineInput.addEventListener('keypress', e => { if(e.key==='Enter') { e.preventDefault(); refineBtn.click(); } });

    newQueryBtn.addEventListener('click', () => {
        showScreen('landing');
        queryInput.value = "";
        queryInput.focus();
        progressBar.style.width = "0%";
    });

    queryInput.addEventListener('keypress', e => { if(e.key==='Enter') { e.preventDefault(); generateBtn.click(); } });
});

// Shake keyframes
const s = document.createElement('style');
s.innerHTML = `@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}50%{transform:translateX(8px)}75%{transform:translateX(-8px)}}`;
document.head.appendChild(s);
