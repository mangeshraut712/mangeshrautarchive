/**
 * GitHub Projects Dynamic Loader
 * Fetches and displays latest repositories from GitHub API.
 *
 * Data flow:
 * 1) backend proxy (/api/github/repos/public) for repo catalog + server cache
 * 2) configured production proxy fallback
 * 3) direct GitHub API fallback
 */

import { escapeHtml as escapeHtmlShared } from '../utils/escape-html.js';
import { sitePath } from '../utils/site-base.js';
import { REPO_SCREENSHOTS } from '../data/repo-screenshots.js';

// Hoisted Intl formatters for performance
const absoluteDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const repoCatalogMemoryCache = new Map();
const repoCatalogPendingRequests = new Map();

class GitHubProjects {
  constructor(username = 'mangeshraut712') {
    this.username = username;
    this.previewModal = null;
    this.lastModalFocus = null;
    this.initModal();
    const isLocal =
      typeof window !== 'undefined' &&
      ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);

    const base =
      globalThis.APP_CONFIG?.apiBaseUrl ||
      (typeof globalThis.buildConfig !== 'undefined' && globalThis.buildConfig.apiBaseUrl) ||
      '';
    let apiBase = base ? String(base).replace(/\/$/, '') : '';
    // On GitHub Pages prefer configured edge worker; only use Vercel if still configured as base
    if (
      !apiBase &&
      typeof window !== 'undefined' &&
      window.location.hostname.endsWith('github.io')
    ) {
      apiBase = '';
    }
    const apiBaseNormalized = apiBase;

    const candidates = [];
    if (isLocal) {
      candidates.push('/api/github/repos/public', '/api/github/repos');
    } else if (apiBaseNormalized) {
      candidates.push(
        `${apiBaseNormalized}/api/github/repos/public`,
        `${apiBaseNormalized}/api/github/repos`
      );
    }
    // Edge worker catalog (Pages when Vercel is blocked)
    const edgeBase = 'https://assistme-chat.mangeshraut712.workers.dev';
    if (!apiBaseNormalized || !apiBaseNormalized.includes('workers.dev')) {
      candidates.push(`${edgeBase}/api/github/repos/public`, `${edgeBase}/api/github/repos`);
    }
    // Do not add blocked Vercel hosts — they only produce CORS noise on Pages.
    this.proxyCandidates = candidates;
    this.directApiUrl = `https://api.github.com/users/${username}/repos`;

    this.cache = null;
    this.cacheTime = null;
    this.cacheDuration = 10 * 60 * 1000;
    this.localCacheKey = `github_repos_${username}`;
    this.repoSchemaVersion = 2;

    this.activityCacheDuration = 15 * 60 * 1000;
    this.activityStoragePrefix = `github_repo_activity_${username}_`;
    this.activitySchemaVersion = 5;
    this.repoActivityCache = new Map();

    this.featuredProjectOrder = [
      'mangeshrautarchive',
      'Gravity-SaaS-Agent',
      'ai-ml-portfolio',
      'agent-console',
      'Stanford-CS336',
      'Hindai',
      'Vitals.AI',
      'career-agent-pro',
      'AssistMe-VirtualAssistant',
      'Bug-Reporting-System',
      'Real-Time-Face-Emotion-Recognition-System',
      'Starlight-Blogging-Website',
      'Crime-Investigation-System',
      'ces-ltd.com',
      'document-scanner-cv',
      'AI-Powered-Sentiment-Analysis',
    ];

    this.fallbackRepos = [
      {
        name: 'mangeshrautarchive',
        full_name: 'mangeshraut712/mangeshrautarchive',
        description:
          'Agentic full-stack portfolio: vanilla ESM + FastAPI AssistMe, dual-host Pages/Worker, WebMCP, and public monitor',
        homepage: 'https://mangeshraut712.github.io/mangeshrautarchive/',
        html_url: 'https://github.com/mangeshraut712/mangeshrautarchive',
        language: 'JavaScript',
        topics: [
          'ai-assistant',
          'cloudflare-workers',
          'developer-portfolio',
          'esbuild',
          'fastapi',
          'github-pages',
          'portfolio',
          'python',
          'vanilla-js',
          'webmcp',
        ],
        stargazers_count: 1,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 1,
        subscribers_count: 0,
        size: 79988,
        license: { spdx_id: 'MIT' },
        default_branch: 'main',
        updated_at: '2026-09-09T05:18:24Z',
        created_at: '2025-04-08T23:10:08Z',
        pushed_at: '2026-09-09T05:18:10Z',
        fork: false,
        archived: false,
      },
      {
        name: 'Gravity-SaaS-Agent',
        full_name: 'mangeshraut712/Gravity-SaaS-Agent',
        description:
          'Multi-tenant SaaS AI agent platform: MCP, WhatsApp, billing — Next.js + TypeScript',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/Gravity-SaaS-Agent',
        language: 'TypeScript',
        topics: [
          'ai-agents',
          'billing',
          'mcp',
          'multi-tenant',
          'nextjs',
          'saas',
          'typescript',
          'whatsapp',
        ],
        stargazers_count: 5,
        forks_count: 4,
        open_issues_count: 1,
        watchers_count: 5,
        subscribers_count: 0,
        size: 694,
        license: { spdx_id: 'MIT' },
        default_branch: 'main',
        updated_at: '2026-09-06T15:37:23Z',
        created_at: '2026-01-26T14:40:08Z',
        pushed_at: '2026-03-27T09:25:53Z',
        fork: false,
        archived: false,
      },
      {
        name: 'ai-ml-portfolio',
        full_name: 'mangeshraut712/ai-ml-portfolio',
        description:
          'Applied AI monorepo: speech VAD, RAG evaluation, NumPy ML from scratch — portfolio for AI Engineer roles',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/ai-ml-portfolio',
        language: 'Python',
        topics: [
          'from-scratch',
          'llm-evaluation',
          'machine-learning',
          'monorepo',
          'numpy',
          'portfolio',
          'python',
          'rag',
          'speech-processing',
          'vad',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 0,
        subscribers_count: 0,
        size: 14056,
        license: { spdx_id: 'MIT' },
        default_branch: 'main',
        updated_at: '2026-07-24T05:33:11Z',
        created_at: '2026-07-23T09:28:27Z',
        pushed_at: '2026-07-24T05:33:05Z',
        fork: false,
        archived: false,
      },
      {
        name: 'agent-console',
        full_name: 'mangeshraut712/agent-console',
        description:
          'Real-time AI agent console: WebSocket tool-calling, observability, Next.js + React',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/agent-console',
        language: 'TypeScript',
        topics: [
          'ai-agents',
          'nextjs',
          'observability',
          'react',
          'tool-calling',
          'typescript',
          'websocket',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 0,
        subscribers_count: 0,
        size: 13199,
        license: { spdx_id: 'MIT' },
        default_branch: 'main',
        updated_at: '2026-07-24T05:30:10Z',
        created_at: '2026-06-13T10:36:29Z',
        pushed_at: '2026-06-13T11:01:48Z',
        fork: false,
        archived: false,
      },
      {
        name: 'Stanford-CS336',
        full_name: 'mangeshraut712/Stanford-CS336',
        description:
          'Self-study notes and labs for Stanford CS336: language modeling, transformers, GRPO, BPE',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/Stanford-CS336',
        language: 'Python',
        topics: [
          'bpe',
          'cs336',
          'grpo',
          'language-modeling',
          'nlp',
          'pytorch',
          'self-study',
          'stanford',
          'transformers',
        ],
        stargazers_count: 2,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 2,
        subscribers_count: 0,
        size: 137239,
        license: null,
        default_branch: 'main',
        updated_at: '2026-07-24T05:30:09Z',
        created_at: '2026-06-25T17:24:21Z',
        pushed_at: '2026-06-28T10:38:23Z',
        fork: false,
        archived: false,
      },
      {
        name: 'Hindai',
        full_name: 'mangeshraut712/Hindai',
        description:
          'Hind AI digital gurukul — interactive learning for Indic scriptures with local Gemma via Ollama (Next.js).',
        homepage: 'https://mangeshraut712.github.io/Hindai/',
        html_url: 'https://github.com/mangeshraut712/Hindai',
        language: 'TypeScript',
        topics: [
          'gemma4',
          'hackathon',
          'indian-philosophy',
          'local-ai',
          'nextjs',
          'ollama',
          'sanskrit',
          'vedas',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 1,
        watchers_count: 0,
        subscribers_count: 0,
        size: 14235,
        license: { spdx_id: 'CC-BY-4.0' },
        default_branch: 'main',
        updated_at: '2026-09-09T07:36:55Z',
        created_at: '2026-04-11T07:12:25Z',
        pushed_at: '2026-09-09T07:35:49Z',
        fork: false,
        archived: false,
      },
      {
        name: 'Vitals.AI',
        full_name: 'mangeshraut712/Vitals.AI',
        description:
          'Privacy-first AI health dashboard for biomarkers, body composition, recovery, and digital twin insights.',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/Vitals.AI',
        language: 'TypeScript',
        topics: [
          'ai',
          'biomarkers',
          'digital-twin',
          'health',
          'health-tech',
          'nextjs',
          'react',
          'typescript',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 4,
        watchers_count: 0,
        subscribers_count: 0,
        size: 1969,
        license: { spdx_id: 'MIT' },
        default_branch: 'main',
        updated_at: '2026-03-27T09:25:48Z',
        created_at: '2026-02-12T13:25:03Z',
        pushed_at: '2026-05-18T21:21:32Z',
        fork: false,
        archived: false,
      },
      {
        name: 'career-agent-pro',
        full_name: 'mangeshraut712/career-agent-pro',
        description:
          'AI job-search copilot for role analysis, resume tailoring, and application prep (Next.js + FastAPI).',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/career-agent-pro',
        language: 'TypeScript',
        topics: [
          'ai-agent',
          'career',
          'fastapi',
          'job-search',
          'llm',
          'nextjs',
          'python',
          'resume',
          'typescript',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 11,
        watchers_count: 0,
        subscribers_count: 0,
        size: 734,
        license: { spdx_id: 'MIT' },
        default_branch: 'main',
        updated_at: '2026-03-27T09:26:39Z',
        created_at: '2025-12-21T11:56:06Z',
        pushed_at: '2026-04-12T23:52:19Z',
        fork: false,
        archived: false,
      },
      {
        name: 'AssistMe-VirtualAssistant',
        full_name: 'mangeshraut712/AssistMe-VirtualAssistant',
        description:
          'Multi-modal AI assistant with voice mode and research tools (React + FastAPI).',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/AssistMe-VirtualAssistant',
        language: 'JavaScript',
        topics: [
          'ai-assistant',
          'fastapi',
          'full-stack',
          'python',
          'react',
          'tailwindcss',
          'vite',
          'voice',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 1,
        watchers_count: 0,
        subscribers_count: 0,
        size: 64202,
        license: null,
        default_branch: 'main',
        updated_at: '2026-07-24T12:54:05Z',
        created_at: '2025-10-04T05:08:53Z',
        pushed_at: '2026-03-27T09:25:21Z',
        fork: false,
        archived: false,
      },
      {
        name: 'Bug-Reporting-System',
        full_name: 'mangeshraut712/Bug-Reporting-System',
        description: 'Full-stack bug tracker with Django REST API and React UI.',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/Bug-Reporting-System',
        language: 'Python',
        topics: ['bug-tracker', 'django', 'docker', 'drf', 'full-stack', 'postgresql', 'react'],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 1,
        watchers_count: 0,
        subscribers_count: 0,
        size: 652,
        license: null,
        default_branch: 'main',
        updated_at: '2026-07-24T12:54:06Z',
        created_at: '2025-11-11T11:16:35Z',
        pushed_at: '2026-03-27T09:27:05Z',
        fork: false,
        archived: false,
      },
      {
        name: 'Real-Time-Face-Emotion-Recognition-System',
        full_name: 'mangeshraut712/Real-Time-Face-Emotion-Recognition-System',
        description: 'Real-time face emotion recognition using TensorFlow with a React dashboard.',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/Real-Time-Face-Emotion-Recognition-System',
        language: 'Python',
        topics: [
          'computer-vision',
          'emotion-recognition',
          'opencv',
          'python',
          'react',
          'real-time',
          'tensorflow',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 0,
        subscribers_count: 0,
        size: 31275,
        license: { spdx_id: 'MIT' },
        default_branch: 'main',
        updated_at: '2026-03-27T09:30:53Z',
        created_at: '2024-06-27T00:57:38Z',
        pushed_at: '2026-03-27T09:30:49Z',
        fork: false,
        archived: false,
      },
      {
        name: 'Starlight-Blogging-Website',
        full_name: 'mangeshraut712/Starlight-Blogging-Website',
        description: 'Full-stack blogging platform (Angular frontend + Flask backend).',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/Starlight-Blogging-Website',
        language: 'TypeScript',
        topics: ['angular', 'blog', 'flask', 'full-stack', 'python', 'tinymce', 'typescript'],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 0,
        subscribers_count: 0,
        size: 1318,
        license: null,
        default_branch: 'main',
        updated_at: '2026-07-24T12:54:14Z',
        created_at: '2025-02-13T19:43:25Z',
        pushed_at: '2026-06-21T13:10:21Z',
        fork: false,
        archived: false,
      },
      {
        name: 'Crime-Investigation-System',
        full_name: 'mangeshraut712/Crime-Investigation-System',
        description:
          'Java and MySQL crime investigation management system (FIRs, cases, officers).',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/Crime-Investigation-System',
        language: 'Java',
        topics: ['backend', 'case-management', 'crud', 'database', 'java', 'mysql'],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 0,
        subscribers_count: 0,
        size: 1900,
        license: null,
        default_branch: 'main',
        updated_at: '2026-07-24T12:54:07Z',
        created_at: '2025-04-10T21:44:03Z',
        pushed_at: '2026-03-27T09:28:45Z',
        fork: false,
        archived: false,
      },
      {
        name: 'ces-ltd.com',
        full_name: 'mangeshraut712/ces-ltd.com',
        description: 'Redesign concept for CES energy intelligence platform (Next.js + Three.js).',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/ces-ltd.com',
        language: 'TypeScript',
        topics: [
          'design',
          'energy',
          'frontend',
          'marketing-site',
          'nextjs',
          'react',
          'threejs',
          'typescript',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 1,
        watchers_count: 0,
        subscribers_count: 0,
        size: 13829,
        license: null,
        default_branch: 'main',
        updated_at: '2026-07-24T12:54:06Z',
        created_at: '2025-11-05T09:55:41Z',
        pushed_at: '2026-03-27T09:27:11Z',
        fork: false,
        archived: false,
      },
      {
        name: 'document-scanner-cv',
        full_name: 'mangeshraut712/document-scanner-cv',
        description:
          'Document scanner with edge detection and perspective correction; MATLAB, Python, and web demo.',
        homepage: 'https://mangeshraut712.github.io/document-scanner-cv',
        html_url: 'https://github.com/mangeshraut712/document-scanner-cv',
        language: 'MATLAB',
        topics: [
          'computer-vision',
          'document-scanner',
          'image-processing',
          'matlab',
          'opencv',
          'python',
          'web-demo',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 0,
        subscribers_count: 0,
        size: 1119,
        license: { spdx_id: 'MIT' },
        default_branch: 'main',
        updated_at: '2026-07-24T12:54:09Z',
        created_at: '2025-12-09T16:35:55Z',
        pushed_at: '2026-03-27T09:26:44Z',
        fork: false,
        archived: false,
      },
      {
        name: 'AI-Powered-Sentiment-Analysis',
        full_name: 'mangeshraut712/AI-Powered-Sentiment-Analysis',
        description:
          'Unified sentiment + emotion NLP (Naive Bayes + Logistic Regression) with Next.js 16 UI and Flask API — supersedes the older Flask-only sentiment-analysis-webapp.',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/AI-Powered-Sentiment-Analysis',
        language: 'Jupyter Notebook',
        topics: [
          'emotion-detection',
          'flask',
          'full-stack',
          'machine-learning',
          'nextjs',
          'nlp',
          'python',
          'scikit-learn',
          'sentiment-analysis',
          'tailwindcss',
          'text-classification',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 1,
        watchers_count: 0,
        subscribers_count: 0,
        size: 1986,
        license: { spdx_id: 'NOASSERTION' },
        default_branch: 'master',
        updated_at: '2026-07-24T12:54:03Z',
        created_at: '2025-12-09T18:13:12Z',
        pushed_at: '2026-03-27T09:24:39Z',
        fork: false,
        archived: false,
      },
      {
        name: 'mangeshraut712',
        full_name: 'mangeshraut712/mangeshraut712',
        description: 'Profile README',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/mangeshraut712',
        language: 'JavaScript',
        topics: [],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 0,
        subscribers_count: 0,
        size: 1178,
        license: null,
        default_branch: 'main',
        updated_at: '2026-07-24T12:24:55Z',
        created_at: '2026-02-03T10:33:01Z',
        pushed_at: '2026-07-24T12:23:50Z',
        fork: false,
        archived: false,
      },
      {
        name: 'sarvam-ai-cookbook',
        full_name: 'mangeshraut712/sarvam-ai-cookbook',
        description:
          'Indic AI cookbook: Sarvam speech/VAD, RAG, and multilingual LLM apps on Next.js',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/sarvam-ai-cookbook',
        language: 'Jupyter Notebook',
        topics: [
          'cookbook',
          'india',
          'indic-nlp',
          'llm',
          'multilingual',
          'nextjs',
          'portfolio',
          'rag',
          'sarvam-ai',
          'speech',
          'vad',
          'vercel',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 0,
        subscribers_count: 0,
        size: 30219,
        license: { spdx_id: 'Apache-2.0' },
        default_branch: 'main',
        updated_at: '2026-07-24T05:30:07Z',
        created_at: '2026-02-23T19:31:16Z',
        pushed_at: '2026-07-24T04:57:15Z',
        fork: true,
        archived: false,
      },
      {
        name: 'pravinelite',
        full_name: 'mangeshraut712/pravinelite',
        description:
          "Pravin Elite Fitness - Pune's Premier Personal Training & Nutrition Coaching. Features personalized Indian diet macro calculators, booking management, and high-performance design.",
        homepage: 'https://pravinelite.lovable.app',
        html_url: 'https://github.com/mangeshraut712/pravinelite',
        language: 'TypeScript',
        topics: ['consulting', 'fitness-goals', 'gym', 'personal', 'trainer'],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 0,
        subscribers_count: 0,
        size: 1811,
        license: null,
        default_branch: 'main',
        updated_at: '2026-06-17T06:14:59Z',
        created_at: '2026-05-27T08:05:13Z',
        pushed_at: '2026-06-06T06:55:08Z',
        fork: false,
        archived: false,
      },
      {
        name: 'Dotfit-Fitness',
        full_name: 'mangeshraut712/Dotfit-Fitness',
        description:
          '🚀 Modern fitness platform with AI coaching, wearable integration, and 2026 tech. React + TypeScript + OpenAI for personalized workouts and health tracking.',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/Dotfit-Fitness',
        language: 'TypeScript',
        topics: [
          'fitness-app',
          'fitness-platform',
          'gym-management',
          'health-tech',
          'workout-planner',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 1,
        watchers_count: 0,
        subscribers_count: 0,
        size: 27141,
        license: null,
        default_branch: 'main',
        updated_at: '2026-05-03T11:35:15Z',
        created_at: '2026-05-01T07:21:58Z',
        pushed_at: '2026-05-03T11:35:11Z',
        fork: false,
        archived: false,
      },
      {
        name: 'ForexScalpingBot',
        full_name: 'mangeshraut712/ForexScalpingBot',
        description: 'SwiftUI iOS trading-assistant UI demo for forex signals.',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/ForexScalpingBot',
        language: 'Swift',
        topics: ['fintech', 'forex', 'ios', 'mobile-ui', 'swiftui', 'trading'],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 0,
        subscribers_count: 0,
        size: 929,
        license: null,
        default_branch: 'master',
        updated_at: '2026-07-24T12:54:11Z',
        created_at: '2025-10-16T08:55:06Z',
        pushed_at: '2026-03-27T09:36:13Z',
        fork: false,
        archived: false,
      },
      {
        name: 'LeetCodeByMangesh',
        full_name: 'mangeshraut712/LeetCodeByMangesh',
        description: 'LeetCode solutions and interview prep in Python.',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/LeetCodeByMangesh',
        language: 'Python',
        topics: [
          'algorithms',
          'coding-challenges',
          'data-structures',
          'interview-prep',
          'leetcode',
          'python',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 0,
        subscribers_count: 0,
        size: 309,
        license: null,
        default_branch: 'main',
        updated_at: '2026-07-24T12:54:11Z',
        created_at: '2025-04-09T23:02:36Z',
        pushed_at: '2026-03-27T09:28:49Z',
        fork: false,
        archived: false,
      },
      {
        name: 'financial-forecasting-model',
        full_name: 'mangeshraut712/financial-forecasting-model',
        description:
          'Financial forecasting with Excel, Power BI, and Python (regression and ARIMA).',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/financial-forecasting-model',
        language: 'Python',
        topics: [
          'analytics',
          'arima',
          'excel',
          'financial-forecasting',
          'powerbi',
          'python',
          'regression',
          'time-series',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 0,
        subscribers_count: 0,
        size: 277,
        license: null,
        default_branch: 'main',
        updated_at: '2026-07-24T12:54:10Z',
        created_at: '2025-04-23T08:04:43Z',
        pushed_at: '2026-03-27T09:28:40Z',
        fork: false,
        archived: false,
      },
      {
        name: 'kashishbeautyparlour',
        full_name: 'mangeshraut712/kashishbeautyparlour',
        description: 'Website for Kashish Beauty Parlour and Training Center (Next.js).',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/kashishbeautyparlour',
        language: 'TypeScript',
        topics: [
          'booking',
          'nextjs',
          'portfolio-site',
          'react',
          'small-business',
          'tailwindcss',
          'typescript',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 0,
        subscribers_count: 0,
        size: 216277,
        license: null,
        default_branch: 'main',
        updated_at: '2026-03-27T09:28:21Z',
        created_at: '2025-10-07T07:32:39Z',
        pushed_at: '2026-03-27T09:28:17Z',
        fork: false,
        archived: false,
      },
      {
        name: 'vidyaraut',
        full_name: 'mangeshraut712/vidyaraut',
        description: 'Portfolio website for Vidya Raut (Next.js).',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/vidyaraut',
        language: 'TypeScript',
        topics: ['framer-motion', 'nextjs', 'personal-site', 'portfolio', 'react', 'typescript'],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 1,
        watchers_count: 0,
        subscribers_count: 0,
        size: 3414,
        license: null,
        default_branch: 'main',
        updated_at: '2026-05-28T06:53:42Z',
        created_at: '2025-11-19T11:04:27Z',
        pushed_at: '2026-03-27T09:27:00Z',
        fork: false,
        archived: false,
      },
      {
        name: 'MT-Immigration',
        full_name: 'mangeshraut712/MT-Immigration',
        description:
          'Redesign concept for immigration law firm website with AI legal assistant (Next.js).',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/MT-Immigration',
        language: 'TypeScript',
        topics: [
          'chatbot',
          'legal-tech',
          'marketing-site',
          'nextjs',
          'react',
          'tailwindcss',
          'typescript',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 1,
        watchers_count: 0,
        subscribers_count: 0,
        size: 1233,
        license: null,
        default_branch: 'main',
        updated_at: '2026-07-24T12:54:12Z',
        created_at: '2025-12-09T18:28:11Z',
        pushed_at: '2026-03-27T09:26:40Z',
        fork: false,
        archived: false,
      },
      {
        name: 'alpha-quant-academy',
        full_name: 'mangeshraut712/alpha-quant-academy',
        description:
          'Quant finance training platform with AI stock analysis and Monte Carlo backtesting.',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/alpha-quant-academy',
        language: 'Jupyter Notebook',
        topics: [
          'algorithmic-trading',
          'backtesting',
          'education',
          'finance',
          'machine-learning',
          'monte-carlo',
          'python',
          'quant-finance',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 1,
        watchers_count: 0,
        subscribers_count: 0,
        size: 2326,
        license: { spdx_id: 'Apache-2.0' },
        default_branch: 'main',
        updated_at: '2026-03-27T09:26:35Z',
        created_at: '2025-12-28T18:12:00Z',
        pushed_at: '2026-03-27T09:26:31Z',
        fork: false,
        archived: false,
      },
      {
        name: 'UIDAI-Data-Hackathon-2026',
        full_name: 'mangeshraut712/UIDAI-Data-Hackathon-2026',
        description: 'UIDAI Aadhaar dataset analysis for Hackathon 2026.',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/UIDAI-Data-Hackathon-2026',
        language: 'Python',
        topics: [
          'aadhaar',
          'data-analysis',
          'data-visualization',
          'hackathon',
          'pandas',
          'python',
          'uidai',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 0,
        subscribers_count: 0,
        size: 52037,
        license: null,
        default_branch: 'main',
        updated_at: '2026-07-24T12:54:16Z',
        created_at: '2026-01-14T18:19:31Z',
        pushed_at: '2026-03-27T09:26:22Z',
        fork: false,
        archived: false,
      },
      {
        name: 'PicoTuri-EditJudge',
        full_name: 'mangeshraut712/PicoTuri-EditJudge',
        description: 'Research tool to evaluate text-guided image edits (Flask + React).',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/PicoTuri-EditJudge',
        language: 'JavaScript',
        topics: [
          'computer-vision',
          'evaluation',
          'flask',
          'image-editing',
          'machine-learning',
          'react',
          'research',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 1,
        watchers_count: 0,
        subscribers_count: 0,
        size: 29531,
        license: { spdx_id: 'Apache-2.0' },
        default_branch: 'main',
        updated_at: '2026-07-24T12:54:13Z',
        created_at: '2025-10-26T11:13:58Z',
        pushed_at: '2026-03-27T09:25:33Z',
        fork: false,
        archived: false,
      },
      {
        name: 'VoteDine',
        full_name: 'mangeshraut712/VoteDine',
        description:
          'Real-time group dining decision app with voting and recommendations (Next.js + Fastify).',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/VoteDine',
        language: 'TypeScript',
        topics: [
          'docker',
          'fastify',
          'food-tech',
          'nextjs',
          'postgresql',
          'real-time',
          'typescript',
          'websocket',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 1,
        watchers_count: 0,
        subscribers_count: 0,
        size: 1457,
        license: null,
        default_branch: 'main',
        updated_at: '2026-07-24T12:54:17Z',
        created_at: '2026-01-31T13:50:17Z',
        pushed_at: '2026-03-27T09:24:57Z',
        fork: false,
        archived: false,
      },
      {
        name: 'ai-rubiks-cube',
        full_name: 'mangeshraut712/ai-rubiks-cube',
        description: "2x2x2 Rubik's Cube solver with BFS/A*/IDA* and interactive 3D visualization.",
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/ai-rubiks-cube',
        language: 'JavaScript',
        topics: [
          'a-star',
          'ai',
          'bfs',
          'ida-star',
          'javascript',
          'rubiks-cube',
          'search-algorithms',
          'visualization',
          'webgl',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 1,
        watchers_count: 0,
        subscribers_count: 0,
        size: 4274,
        license: null,
        default_branch: 'main',
        updated_at: '2026-07-24T12:54:04Z',
        created_at: '2025-12-09T08:19:25Z',
        pushed_at: '2026-03-27T09:24:34Z',
        fork: false,
        archived: false,
      },
      {
        name: 'ThreadPulse-Daily',
        full_name: 'mangeshraut712/ThreadPulse-Daily',
        description:
          'A community-powered daily word puzzle game for the Reddit ecosystem. Built for the Reddit Daily Games Hackathon 2026.',
        homepage: '',
        html_url: 'https://github.com/mangeshraut712/ThreadPulse-Daily',
        language: 'TypeScript',
        topics: [
          'devvit',
          'gamemaker',
          'hackathon',
          'react',
          'reddit',
          'typescript',
          'webassembly',
          'word-game',
        ],
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 1,
        watchers_count: 0,
        subscribers_count: 0,
        size: 70196,
        license: null,
        default_branch: 'main',
        updated_at: '2026-07-24T12:54:14Z',
        created_at: '2026-02-11T12:14:25Z',
        pushed_at: '2026-03-27T09:24:29Z',
        fork: false,
        archived: false,
      },
    ];

    this.showcaseExcludes = new Set(['.github']);
  }

  normalizeRepoRecord(repo = {}) {
    const stars = Number(repo.stargazers_count ?? repo.stars ?? 0);
    const forks = Number(repo.forks_count ?? repo.forks ?? 0);
    const watchers = Number(repo.subscribers_count ?? repo.watchers_count ?? repo.watchers ?? 0);
    const openIssues = Number(repo.open_issues_count ?? repo.open_issues ?? 0);
    const size = Number(repo.size ?? 0);

    const rawLicense = repo.license;
    const license = typeof rawLicense === 'string' ? { spdx_id: rawLicense } : rawLicense || null;

    return {
      ...repo,
      stargazers_count: Number.isFinite(stars) ? stars : 0,
      forks_count: Number.isFinite(forks) ? forks : 0,
      watchers_count: Number.isFinite(watchers) ? watchers : 0,
      open_issues_count: Number.isFinite(openIssues) ? openIssues : 0,
      size: Number.isFinite(size) ? size : 0,
      topics: Array.isArray(repo.topics) ? repo.topics : [],
      license,
      fork: Boolean(repo.fork),
      archived: Boolean(repo.archived),
    };
  }

  extractRepoList(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.items)) return payload.items;
    if (payload && Array.isArray(payload.data)) return payload.data;
    if (payload && Array.isArray(payload.repos)) return payload.repos;
    return null;
  }

  async fetchRepositories(forceRefresh = false) {
    const sharedCacheKey = `${this.username}:${this.repoSchemaVersion}`;

    // Force refresh bypasses all caches
    if (forceRefresh) {
      this.cache = null;
      this.cacheTime = null;
      localStorage.removeItem(this.localCacheKey);
      repoCatalogMemoryCache.delete(sharedCacheKey);
      repoCatalogPendingRequests.delete(sharedCacheKey);
    }

    if (this.cache && this.cacheTime && Date.now() - this.cacheTime < this.cacheDuration) {
      return this.cache;
    }

    const sharedCache = repoCatalogMemoryCache.get(sharedCacheKey);
    if (
      !forceRefresh &&
      sharedCache?.repos &&
      sharedCache.timestamp &&
      Date.now() - sharedCache.timestamp < this.cacheDuration
    ) {
      this.cache = sharedCache.repos;
      this.cacheTime = sharedCache.timestamp;
      return sharedCache.repos;
    }

    if (!forceRefresh && repoCatalogPendingRequests.has(sharedCacheKey)) {
      const repos = await repoCatalogPendingRequests.get(sharedCacheKey);
      this.cache = repos;
      this.cacheTime = Date.now();
      return repos;
    }

    try {
      const cached = localStorage.getItem(this.localCacheKey);
      if (cached) {
        const { repos, timestamp, version } = JSON.parse(cached);
        if (
          version === this.repoSchemaVersion &&
          Array.isArray(repos) &&
          timestamp &&
          Date.now() - timestamp < this.cacheDuration
        ) {
          this.cache = repos;
          this.cacheTime = timestamp;
          repoCatalogMemoryCache.set(sharedCacheKey, { repos, timestamp });
          return repos;
        }
      }
    } catch (err) {
      console.warn('Local cache read failed:', err);
    }

    const networkLoad = (async () => {
      let rawRepos = null;

      // Prefer configured edge/API bases; skip only hosts marked dead this session.
      const candidates = this.proxyCandidates.filter(base => {
        try {
          if (sessionStorage.getItem('portfolio_api_host_dead_v1') === '1') {
            // Still allow non-Vercel workers.dev / custom CHAT_API_BASE
            return (
              !String(base).includes('mangeshraut.pro') && !String(base).includes('vercel.app')
            );
          }
        } catch {
          // ignore
        }
        return true;
      });

      for (const proxyBase of candidates) {
        try {
          const proxyResp = await fetch(
            `${proxyBase}?username=${this.username}&limit=100&no_forks=false`,
            { headers: { Accept: 'application/json' } }
          );

          if (proxyResp.status === 402 || proxyResp.status === 503) {
            if (
              String(proxyBase).includes('mangeshraut.pro') ||
              String(proxyBase).includes('vercel.app')
            ) {
              try {
                sessionStorage.setItem('portfolio_api_host_dead_v1', '1');
              } catch {
                // ignore
              }
            }
            continue;
          }

          if (!proxyResp.ok) {
            continue;
          }

          const body = await proxyResp.json();
          const repoList = this.extractRepoList(body);
          if (repoList) {
            rawRepos = repoList;
            break;
          }
        } catch {
          // Quiet: proxy may be offline on static mirrors
        }
      }

      if (!rawRepos) {
        try {
          const response = await fetch(`${this.directApiUrl}?per_page=100&sort=updated`, {
            headers: { Accept: 'application/vnd.github+json' },
          });

          if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
          rawRepos = await response.json();
        } catch {
          // Prefer any local cache (even stale), then bundled catalog
          const staleCache = localStorage.getItem(this.localCacheKey);
          if (staleCache) {
            try {
              const { repos } = JSON.parse(staleCache);
              if (repos && repos.length > 0) {
                return repos;
              }
            } catch {
              // Ignore stale cache parse failure
            }
          }
          return this.fallbackRepos.map(repo => this.normalizeRepoRecord(repo));
        }
      }

      const normalizedRepos = Array.isArray(rawRepos)
        ? rawRepos.map(repo => this.normalizeRepoRecord(repo))
        : [];

      const sortedRepos = normalizedRepos.toSorted(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
      );

      this.cache = sortedRepos;
      this.cacheTime = Date.now();
      repoCatalogMemoryCache.set(sharedCacheKey, {
        repos: sortedRepos,
        timestamp: this.cacheTime,
      });

      try {
        localStorage.setItem(
          this.localCacheKey,
          JSON.stringify({
            version: this.repoSchemaVersion,
            repos: sortedRepos,
            timestamp: this.cacheTime,
          })
        );
      } catch (err) {
        console.warn('Local cache write failed:', err);
      }

      return sortedRepos;
    })();

    if (!forceRefresh) {
      repoCatalogPendingRequests.set(sharedCacheKey, networkLoad);
    }

    try {
      return await networkLoad;
    } finally {
      repoCatalogPendingRequests.delete(sharedCacheKey);
    }
  }

  getLanguageColor(language) {
    const colors = {
      JavaScript: '#f1e05a',
      TypeScript: '#3178c6',
      Python: '#3572A5',
      Java: '#b07219',
      Swift: '#ffac45',
      HTML: '#e34c26',
      CSS: '#563d7c',
      'C++': '#f34b7d',
      C: '#555555',
      Go: '#00ADD8',
      Rust: '#dea584',
      PHP: '#4F5D95',
      Ruby: '#701516',
      'Jupyter Notebook': '#DA5B0B',
      Shell: '#89e051',
      Dart: '#00B4AB',
      Kotlin: '#A97BFF',
      default: '#6e7681',
    };
    return colors[language] || colors.default;
  }

  escapeHtml(value) {
    return escapeHtmlShared(value);
  }

  formatCompactNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '--';
    if (number < 1000) return String(number);
    if (number < 1000000) return `${(number / 1000).toFixed(1).replace('.0', '')}k`;
    return `${(number / 1000000).toFixed(1).replace('.0', '')}m`;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.max(0, now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months === 1 ? '' : 's'} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  }

  formatRelativeDateCompact(dateString) {
    if (!dateString) return 'unknown';

    const date = new Date(dateString);
    const timestamp = date.getTime();
    if (!Number.isFinite(timestamp)) return 'unknown';

    const diffMs = Math.max(0, Date.now() - timestamp);
    const minuteMs = 60 * 1000;
    const hourMs = 60 * minuteMs;
    const dayMs = 24 * hourMs;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;
    const yearMs = 365 * dayMs;

    if (diffMs < hourMs) return 'now';
    if (diffMs < dayMs) return `${Math.floor(diffMs / hourMs)}h ago`;
    if (diffMs < weekMs) return `${Math.floor(diffMs / dayMs)}d ago`;
    if (diffMs < monthMs) return `${Math.floor(diffMs / weekMs)}w ago`;
    if (diffMs < yearMs) return `${Math.floor(diffMs / monthMs)}mo ago`;
    return `${Math.floor(diffMs / yearMs)}y ago`;
  }

  formatAbsoluteDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return absoluteDateFormatter.format(date);
  }

  normalizeHomepageUrl(homepage, repoHtmlUrl = '') {
    if (!homepage) return '';
    const value = String(homepage).trim();
    if (!value) return '';

    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      const parsed = new URL(withProtocol);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
      const host = String(parsed.hostname || '').toLowerCase();
      // Vercel production is DEPLOYMENT_DISABLED (402) — do not surface dead demos.
      if (
        host === 'mangeshraut.pro' ||
        host === 'www.mangeshraut.pro' ||
        host.endsWith('.vercel.app')
      ) {
        return '';
      }
      // If the homepage points to github.com repository itself, reddit placeholder, or matches repo url
      if (
        host === 'github.com' ||
        host === 'www.github.com' ||
        host.includes('reddit.com') ||
        (repoHtmlUrl &&
          parsed.href.replace(/\/$/, '').toLowerCase() ===
            String(repoHtmlUrl).trim().replace(/\/$/, '').toLowerCase())
      ) {
        return '';
      }
      return parsed.toString();
    } catch {
      return '';
    }
  }

  getTopics(repo) {
    if (!Array.isArray(repo?.topics)) return [];
    return repo.topics.flatMap(topic => {
      const normalized = String(topic || '')
        .trim()
        .toLowerCase();
      return normalized ? [normalized] : [];
    });
  }

  getRepoAgeDays(dateString) {
    if (!dateString) return Number.POSITIVE_INFINITY;
    const ts = new Date(dateString).getTime();
    if (Number.isNaN(ts)) return Number.POSITIVE_INFINITY;
    const diff = Date.now() - ts;
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  formatRepoSize(sizeInKb) {
    const kb = Number(sizeInKb);
    if (!Number.isFinite(kb) || kb <= 0) return '';
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  getShowcaseScore(repo) {
    const stars = repo.stargazers_count || 0;
    const forks = repo.forks_count || 0;
    const watchers = repo.watchers_count || 0;
    const topics = this.getTopics(repo);
    const updatedAgeDays = this.getRepoAgeDays(repo.updated_at);

    const freshness = Math.max(0, 100 - Math.min(updatedAgeDays, 180) * 0.55);
    const traction = Math.min(100, stars * 18 + forks * 24 + watchers * 6);
    const completeness = Math.min(
      100,
      (repo.description ? 34 : 0) +
        (repo.language ? 20 : 0) +
        (topics.length ? Math.min(topics.length, 4) * 9 : 0) +
        (repo.homepage ? 26 : 0) +
        (repo.license?.spdx_id ? 10 : 0)
    );

    const score = Math.round(freshness * 0.42 + traction * 0.28 + completeness * 0.3);
    return { score, freshness, traction, completeness, updatedAgeDays };
  }

  buildAiInsight(repo, _showcaseScore) {
    const topics = this.getTopics(repo);
    const hasDemo = Boolean(this.normalizeHomepageUrl(repo.homepage, repo.html_url));
    const updated = this.formatDate(repo.updated_at);
    const stars = repo.stargazers_count || 0;

    const parts = [];
    if (stars > 0) parts.push(`${stars} star${stars === 1 ? '' : 's'}`);
    if (repo.language) parts.push(repo.language);
    if (topics.length > 0) parts.push(topics.slice(0, 2).join(', '));
    if (hasDemo) parts.push('Live demo available');
    if (updated) parts.push(`Updated ${updated}`);

    return parts.join(' · ') || 'Active project';
  }

  normalizeReleasePayload(release) {
    if (!release || typeof release !== 'object') return null;

    const tagName = String(release.tag_name || '').trim();
    if (!tagName) return null;

    return {
      tagName,
      name: String(release.name || tagName).trim(),
      htmlUrl: this.normalizeHomepageUrl(release.html_url || ''),
      publishedAt: release.published_at || '',
      createdAt: release.created_at || '',
      prerelease: Boolean(release.prerelease),
      draft: Boolean(release.draft),
    };
  }

  getReleaseSignal(repo, activity = {}) {
    const releaseChecked = Boolean(activity.releaseChecked);
    const latestRelease = activity.latestRelease || null;
    const hasRelease = Boolean(latestRelease?.tagName);
    const releaseDate = latestRelease?.publishedAt || '';
    const releaseAgeDays = this.getRepoAgeDays(releaseDate);
    const activeAgeDays = this.getRepoAgeDays(repo.pushed_at || repo.updated_at);
    const commitsSinceRelease = this.toFiniteMetric(activity.commitsSinceRelease);
    const commits30d = this.toFiniteMetric(activity.commits30d);

    let key = 'open';
    let label = 'Active';
    let meta = 'Main branch active';

    if (hasRelease) {
      key = 'released';
      label = 'Released';
      meta = `Released ${this.formatRelativeDateCompact(releaseDate)}`;
    } else if (commits30d !== null && commits30d >= 10) {
      key = 'busy';
      label = 'High Activity';
      meta = `${commits30d} commits / 30d`;
    } else if (activeAgeDays <= 14) {
      key = 'active';
      label = 'Active Momentum';
      meta = `Updated ${this.formatRelativeDateCompact(repo.pushed_at || repo.updated_at)}`;
    } else if (activeAgeDays <= 45) {
      key = 'fresh';
      label = 'Fresh';
      meta = `Updated ${this.formatRelativeDateCompact(repo.pushed_at || repo.updated_at)}`;
    } else if (releaseChecked && activeAgeDays > 120) {
      key = 'attention';
      label = 'Stable Archive';
      meta = 'Maintained reference';
    }

    const filters = new Set(['all', key]);
    if (hasRelease) filters.add('released');
    if (commits30d !== null && commits30d >= 10) filters.add('busy');
    if (activeAgeDays <= 14) filters.add('active');
    if (activeAgeDays <= 45) filters.add('fresh');
    if (key === 'attention') filters.add('attention');

    return {
      key,
      label,
      meta,
      filters,
      hasRelease,
      releaseChecked,
      latestRelease,
      tagName: latestRelease?.tagName || '',
      releaseDate,
      releaseDateLabel: releaseDate ? this.formatAbsoluteDate(releaseDate) : '',
      releaseRelative: releaseDate ? this.formatRelativeDateCompact(releaseDate) : '',
      releaseAgeDays,
      commitsSinceRelease,
    };
  }

  isRepositoryShowcaseReady(repo) {
    if (!repo) return false;

    const name = String(repo.name || '')
      .trim()
      .toLowerCase();
    if (!name || this.showcaseExcludes.has(name)) return false;

    // Keep archived repos out of the public operating view; include forks + profile README
    // so the card count matches GitHub's public repository total.
    if (repo.archived) return false;
    return true;
  }

  getShowcaseRepos(repos, limit = 100) {
    if (!Array.isArray(repos) || repos.length === 0) return [];

    const eligible = repos.filter(repo => this.isRepositoryShowcaseReady(repo));
    if (eligible.length === 0) return [];

    // Deduplicate by repo name and full_name
    const seen = new Set();
    const uniqueEligible = [];
    for (const repo of eligible) {
      const key = String(
        repo.full_name || `${repo.owner?.login || ''}/${repo.name || ''}` || repo.name
      )
        .trim()
        .toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueEligible.push(repo);
      }
    }

    const featuredMap = new Map(this.featuredProjectOrder.map((name, index) => [name, index]));

    const scored = uniqueEligible
      .map(repo => ({
        ...repo,
        __showcase: this.getShowcaseScore(repo),
      }))
      .sort((a, b) => {
        const aFeatured = featuredMap.has(a.name);
        const bFeatured = featuredMap.has(b.name);

        if (aFeatured && bFeatured) return featuredMap.get(a.name) - featuredMap.get(b.name);
        if (aFeatured) return -1;
        if (bFeatured) return 1;

        if (b.__showcase.score !== a.__showcase.score) {
          return b.__showcase.score - a.__showcase.score;
        }

        return new Date(b.updated_at) - new Date(a.updated_at);
      });

    return scored.slice(0, limit);
  }

  extractRepoIdentity(repo) {
    const fullName = String(repo?.full_name || '').trim();
    if (fullName.includes('/')) {
      const [owner, name] = fullName.split('/');
      return { fullName, owner, name };
    }

    const htmlUrl = String(repo?.html_url || '').trim();
    if (htmlUrl) {
      try {
        const parsed = new URL(htmlUrl);
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          return {
            fullName: `${parts[0]}/${parts[1]}`,
            owner: parts[0],
            name: parts[1],
          };
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  getActivityStorageKey(fullName) {
    const slug = String(fullName || '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');
    return `${this.activityStoragePrefix}${slug}`;
  }

  readRepoActivityCache(fullName) {
    if (!fullName) return null;

    const inMemory = this.repoActivityCache.get(fullName);
    if (inMemory && Date.now() - inMemory.timestamp < this.activityCacheDuration) {
      return inMemory.data;
    }

    try {
      const key = this.getActivityStorageKey(fullName);
      const cachedRaw = localStorage.getItem(key);
      if (!cachedRaw) return null;

      const parsed = JSON.parse(cachedRaw);
      if (!parsed?.data || !parsed?.timestamp) return null;
      if (parsed?.version !== this.activitySchemaVersion) return null;
      if (Date.now() - parsed.timestamp >= this.activityCacheDuration) return null;

      this.repoActivityCache.set(fullName, parsed);
      return parsed.data;
    } catch {
      return null;
    }
  }

  writeRepoActivityCache(fullName, data) {
    if (!fullName || !data) return;

    const payload = {
      timestamp: Date.now(),
      version: this.activitySchemaVersion,
      data,
    };

    this.repoActivityCache.set(fullName, payload);

    try {
      const key = this.getActivityStorageKey(fullName);
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors.
    }
  }

  parseCommitDate(commit) {
    return commit?.commit?.author?.date || commit?.commit?.committer?.date || '';
  }

  buildGitHubProxyUrl(url) {
    try {
      const parsed = new URL(url);
      if (parsed.origin !== 'https://api.github.com') return '';
      const pathWithQuery = `${parsed.pathname}${parsed.search || ''}`;
      const isLocal =
        typeof window !== 'undefined' &&
        ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(window.location.hostname);

      if (isLocal) {
        return `/api/github/proxy?path=${encodeURIComponent(pathWithQuery)}`;
      }

      // GitHub Pages: skip Vercel proxy (CORS / 402). Use edge proxy or direct API.
      if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
        const base =
          globalThis.APP_CONFIG?.apiBaseUrl ||
          globalThis.buildConfig?.apiBaseUrl ||
          'https://assistme-chat.mangeshraut712.workers.dev';
        if (base && !/mangeshraut\.pro|vercel\.app/i.test(base)) {
          return `${base.replace(/\/$/, '')}/api/github/proxy?path=${encodeURIComponent(pathWithQuery)}`;
        }
        return '';
      }
      const base =
        globalThis.APP_CONFIG?.apiBaseUrl ||
        (typeof globalThis.buildConfig !== 'undefined' && globalThis.buildConfig.apiBaseUrl) ||
        '';
      const apiBaseNormalized = base ? base.replace(/\/$/, '') : '';
      return apiBaseNormalized
        ? `${apiBaseNormalized}/api/github/proxy?path=${encodeURIComponent(pathWithQuery)}`
        : `/api/github/proxy?path=${encodeURIComponent(pathWithQuery)}`;
    } catch {
      return '';
    }
  }

  async fetchJson(url, headers = {}) {
    const proxyUrl = this.buildGitHubProxyUrl(url);

    if (proxyUrl) {
      try {
        const response = await fetch(proxyUrl, { headers: { Accept: 'application/json' } });
        if (response.ok) {
          return await response.json();
        }
        if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
          return null;
        }
      } catch {
        if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
          return null;
        }
        // Fall through to direct GitHub call on non-Pages hosts.
      }
    }

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  async fetchJsonWithMeta(url, headers = {}) {
    const proxyUrl = this.buildGitHubProxyUrl(url);

    const attemptFetch = async targetUrl => {
      const response = await fetch(targetUrl, { headers });
      const link = response.headers.get('link') || '';
      const data = response.ok ? await response.json() : null;
      return {
        ok: response.ok,
        status: response.status,
        link,
        data,
      };
    };

    if (proxyUrl) {
      try {
        const proxied = await attemptFetch(proxyUrl);
        // Never fall through to api.github.com from github.io — unauthenticated
        // direct calls 403 and poison PageSpeed Best Practices (console network errors).
        if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
          return proxied;
        }
        if (proxied.ok || proxied.status === 404) {
          return proxied;
        }
      } catch {
        if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
          return { ok: false, status: 0, link: '', data: null };
        }
        // Fall through to direct GitHub call on non-Pages hosts.
      }
    }

    try {
      return await attemptFetch(url);
    } catch {
      return {
        ok: false,
        status: 0,
        link: '',
        data: null,
      };
    }
  }

  getLastPageFromLink(linkHeader = '') {
    if (!linkHeader) return null;

    const candidates = linkHeader.split(',').flatMap(part => {
      const trimmed = part.trim();
      return trimmed ? [trimmed] : [];
    });

    const last = candidates.find(part => part.includes('rel="last"'));
    const next = candidates.find(part => part.includes('rel="next"'));
    const target = last || next;
    if (!target) return null;

    const match = target.match(/[?&]page=(\d+)/);
    if (!match) return null;

    const page = Number.parseInt(match[1], 10);
    return Number.isFinite(page) && page > 0 ? page : null;
  }

  toFiniteMetric(value) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  getPopularityScore(repo) {
    const activity = repo.__activity || {};
    const stars = Number(repo.stargazers_count || 0);
    const forks = Number(repo.forks_count || 0);
    const watchers = Number(repo.watchers_count || 0);
    const commits30d = Number(activity.commits30d || 0);
    const contributors = Number(activity.contributors || 0);
    const showcaseQuality = Number(repo.__showcase?.score || 0);

    return (
      stars * 5 + forks * 7 + watchers * 2 + commits30d * 4 + contributors * 3 + showcaseQuality
    );
  }

  async fetchRepoActivity(repo) {
    const identity = this.extractRepoIdentity(repo);
    if (!identity) {
      return {
        commits30d: null,
        commitSample: 0,
        contributors: null,
        contributorLogins: [],
        commitsSinceRelease: null,
        latestRelease: null,
        releaseChecked: false,
        latestCommitAt: repo?.pushed_at || repo?.updated_at || '',
        unavailable: true,
      };
    }

    const cached = this.readRepoActivityCache(identity.fullName);
    if (cached) return cached;

    const headers = { Accept: 'application/vnd.github+json' };
    const baseUrl = `https://api.github.com/repos/${identity.owner}/${identity.name}`;
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const shouldFetchRelease = repo?.has_releases !== false;

    const [commitsMeta, contributorsMeta, releaseMeta] = await Promise.all([
      this.fetchJsonWithMeta(
        `${baseUrl}/commits?per_page=1&since=${encodeURIComponent(since30d)}`,
        headers
      ),
      this.fetchJsonWithMeta(`${baseUrl}/contributors?per_page=100&anon=1`, headers),
      shouldFetchRelease
        ? this.fetchJsonWithMeta(`${baseUrl}/releases?per_page=1`, headers)
        : Promise.resolve({ ok: false, status: 204, link: '', data: null }),
    ]);

    const commitsPayload = Array.isArray(commitsMeta.data) ? commitsMeta.data : null;
    const contributorsPayload = Array.isArray(contributorsMeta.data) ? contributorsMeta.data : null;
    const latestReleasePayload = Array.isArray(releaseMeta.data)
      ? releaseMeta.data[0]
      : releaseMeta.data;
    const latestRelease = releaseMeta.ok
      ? this.normalizeReleasePayload(latestReleasePayload)
      : null;
    const releaseChecked = !shouldFetchRelease || releaseMeta.ok || releaseMeta.status === 404;

    let commits30d = null;
    let latestCommitAt = repo?.pushed_at || repo?.updated_at || '';
    if (commitsMeta.ok && commitsPayload) {
      if (commitsPayload.length === 0) {
        commits30d = 0;
      } else {
        const pageCount = this.getLastPageFromLink(commitsMeta.link);
        commits30d = pageCount || commitsPayload.length;
        latestCommitAt = this.parseCommitDate(commitsPayload[0]) || latestCommitAt;
      }
    }

    let contributorCount = null;
    let contributorLogins = [];
    if (contributorsMeta.ok && contributorsPayload) {
      if (contributorsPayload.length === 0) {
        contributorCount = 0;
      } else {
        const pageCount = this.getLastPageFromLink(contributorsMeta.link);
        contributorCount = pageCount || contributorsPayload.length;
        contributorLogins = contributorsPayload
          .filter(entry => {
            const type = String(entry?.type || '').toLowerCase();
            const login = String(entry?.login || '').toLowerCase();
            if (type === 'bot') return false;
            if (login.endsWith('[bot]') || login.includes('bot]')) return false;
            return true;
          })
          .map(entry => String(entry?.login || entry?.name || '').trim())
          .filter(Boolean);
      }
    }

    let commitsSinceRelease = null;
    const releaseDate = latestRelease?.publishedAt || latestRelease?.createdAt || '';
    if (releaseDate) {
      const releaseCommitsMeta = await this.fetchJsonWithMeta(
        `${baseUrl}/commits?per_page=1&since=${encodeURIComponent(releaseDate)}`,
        headers
      );
      const releaseCommitsPayload = Array.isArray(releaseCommitsMeta.data)
        ? releaseCommitsMeta.data
        : null;

      if (releaseCommitsMeta.ok && releaseCommitsPayload) {
        if (releaseCommitsPayload.length === 0) {
          commitsSinceRelease = 0;
        } else {
          const pageCount = this.getLastPageFromLink(releaseCommitsMeta.link);
          commitsSinceRelease = pageCount || releaseCommitsPayload.length;
        }
      }
    }

    const unavailable = commits30d === null && contributorCount === null && !releaseChecked;

    const activity = {
      commits30d,
      commitSample: Number.isFinite(commits30d) ? commits30d : 0,
      contributors: contributorCount,
      contributorLogins,
      commitsSinceRelease,
      latestRelease,
      releaseChecked,
      latestCommitAt,
      unavailable,
    };

    this.writeRepoActivityCache(identity.fullName, activity);
    return activity;
  }

  async hydrateReposWithActivity(repos = []) {
    if (!Array.isArray(repos) || repos.length === 0) return repos;

    await Promise.all(
      repos.map(async repo => {
        if (!repo || repo.__activityLoaded) return;
        const activity = await this.fetchRepoActivity(repo);
        repo.__activity = activity;
        repo.__activityLoaded = true;
      })
    );

    return repos;
  }

  getRepoMeta(repo) {
    const language = repo.language || 'Software';
    return {
      kicker: language === 'Unknown' ? 'Open-source repository' : `${language} repository`,
    };
  }

  getRepoMedia(repo, topics) {
    const screenshot = REPO_SCREENSHOTS[String(repo.name || '').toLowerCase()];
    if (screenshot) {
      return {
        src: sitePath(screenshot.file),
        alt: screenshot.alt,
        caption: screenshot.caption || `Screenshot from the ${repo.name} README.`,
        screenshot: true,
        label: screenshot.label || 'Product preview',
        crop: screenshot.crop || null,
        tone: screenshot.tone || null,
        width: screenshot.width || 1440,
        height: screenshot.height || 900,
      };
    }

    return {
      src: this.buildProjectMedia(repo, topics),
      alt: `Concept map of ${repo.name}, based on its repository language and topics`,
      caption:
        'Conceptual map generated from the repository language and topics. Open the source for implementation details.',
      screenshot: false,
      width: 1200,
      height: 675,
    };
  }

  findRepoByName(name) {
    if (!name) return null;
    const target = String(name).toLowerCase();
    if (Array.isArray(this.cache)) {
      const found = this.cache.find(
        r => r.name?.toLowerCase() === target || r.full_name?.toLowerCase() === target
      );
      if (found) return found;
    }
    return (
      this.fallbackRepos.find(
        r => r.name?.toLowerCase() === target || r.full_name?.toLowerCase() === target
      ) || null
    );
  }

  initModal() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('repo-preview-modal')) {
      this.previewModal = document.getElementById('repo-preview-modal');
      return;
    }

    const modalHTML = `
      <div id="repo-preview-modal" class="blog-modal hidden" role="dialog" aria-modal="true" aria-labelledby="repo-modal-title" aria-hidden="true">
        <div class="blog-modal-overlay" data-repo-close></div>
        <div class="blog-modal-container" tabindex="-1">
          <button class="blog-modal-close" type="button" aria-label="Close project preview" data-repo-close>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 2.5l9 9M11.5 2.5l-9 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
          <div class="blog-modal-content" id="repo-modal-body"></div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.previewModal = document.getElementById('repo-preview-modal');

    this.previewModal.addEventListener('click', e => {
      if (e.target.closest('[data-repo-close]')) {
        this.closeRepoPreview();
      }
    });

    document.addEventListener('keydown', e => {
      if (
        e.key === 'Escape' &&
        this.previewModal &&
        !this.previewModal.classList.contains('hidden')
      ) {
        this.closeRepoPreview();
      }
    });

    document.addEventListener('click', e => {
      const previewTrigger = e.target.closest('[data-repo-preview]');
      if (previewTrigger) {
        e.preventDefault();
        const repoName = previewTrigger.dataset.repoPreview;
        if (repoName) {
          this.openRepoPreview(repoName);
          this.lastModalFocus = previewTrigger;
        }
        return;
      }

      const cloneBtn = e.target.closest('.project-preview__clone-btn');
      if (cloneBtn) {
        e.preventDefault();
        const cmd = cloneBtn.dataset.repoClone || '';
        if (cmd) {
          navigator.clipboard
            ?.writeText(`git clone ${cmd}`)
            .then(() => {
              const span = cloneBtn.querySelector('span');
              if (span) {
                const orig = span.textContent;
                span.textContent = 'Copied git clone! ✓';
                setTimeout(() => {
                  span.textContent = orig;
                }, 2000);
              }
            })
            .catch(() => {
              // ignore clipboard failures
            });
        }
      }
    });

    const tryOpenFromHash = () => {
      const match = window.location.hash.match(/^#repo-read-([^&]+)/);
      if (!match) return;
      this.openRepoPreview(decodeURIComponent(match[1]));
    };

    window.addEventListener('hashchange', tryOpenFromHash);
    setTimeout(tryOpenFromHash, 100);
  }

  openRepoPreview(repoName) {
    if (!this.previewModal) return;
    const repo = this.findRepoByName(repoName);
    if (!repo) return;

    this.lastModalFocus = document.activeElement;
    const modalBody = document.getElementById('repo-modal-body');
    if (!modalBody) return;

    const meta = this.getRepoMeta(repo);
    const safeName = this.escapeHtml(repo.name);
    const safeRepoUrl = this.escapeHtml(repo.html_url);
    const homepage = this.normalizeHomepageUrl(repo.homepage, repo.html_url);
    const hasDemo = Boolean(homepage);
    const safeHomepage = hasDemo ? this.escapeHtml(homepage) : '';
    const safeUpdated = this.formatRelativeDateCompact(repo.updated_at);
    const safeBranch = this.escapeHtml(repo.default_branch || 'main');
    const safeLicense = this.escapeHtml(repo.license?.spdx_id || 'Not specified');
    const topics = this.getTopics(repo);
    const projectMedia = this.getRepoMedia(repo, topics);
    const topicsHtml = topics
      .slice(0, 8)
      .map(tag => `<span class="blog-topic-pill">${this.escapeHtml(tag)}</span>`)
      .join('');

    modalBody.innerHTML = `
      <article class="blog-article blog-article--editorial project-preview" data-repo-name="${safeName}">
        <header class="article-header">
          <p class="article-kicker">${this.escapeHtml(meta.kicker)}</p>
          <p class="blog-preview__eyebrow">Repository preview</p>
          <h2 class="article-title" id="repo-modal-title">${safeName}</h2>
          <p class="article-promise">${this.escapeHtml(REPO_SCREENSHOTS[String(repo.name || '').toLowerCase()]?.summary || repo.description || 'See the repository for details.')}</p>
          <div class="article-byline article-byline--editorial">
            <img class="article-byline__avatar" src="${sitePath('/assets/images/profile.webp')}" width="40" height="40" alt="Mangesh Raut" loading="lazy" decoding="async" />
            <div class="article-byline__text">
              <span class="article-byline__name">Mangesh Raut</span>
              <span class="article-byline__meta">
                <span>Updated ${safeUpdated}</span>
                <span aria-hidden="true">·</span>
                <span>Branch: ${safeBranch}</span>
                <span aria-hidden="true">·</span>
                <span>License: ${safeLicense}</span>
              </span>
            </div>
          </div>
          <div class="article-tags blog-tags--pills">${topicsHtml}</div>
        </header>

        <figure class="project-preview__media ${projectMedia.screenshot ? 'project-preview__media--screenshot' : ''}">
          <img src="${projectMedia.src}" alt="${this.escapeHtml(projectMedia.alt)}" width="${projectMedia.width}" height="${projectMedia.height}" decoding="async">
          <figcaption>${this.escapeHtml(projectMedia.caption)}</figcaption>
        </figure>

        <div class="project-preview__top-actions">
          <a class="blog-read-btn project-preview__action-primary" href="${safeRepoUrl}" target="_blank" rel="noopener noreferrer">
            <i class="fab fa-github" aria-hidden="true"></i> View on GitHub <i class="fas fa-arrow-right" aria-hidden="true"></i>
          </a>
          ${hasDemo ? `<a class="project-action-btn btn-demo" href="${safeHomepage}" target="_blank" rel="noopener noreferrer"><i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i> Live Demo</a>` : ''}
          <button type="button" class="project-preview__clone-btn" data-repo-clone="${safeRepoUrl}.git">
            <i class="fas fa-terminal" aria-hidden="true"></i> <span>git clone ${safeRepoUrl}.git</span>
          </button>
        </div>

        <div class="project-preview__telemetry-section">
          <h3 class="project-preview__section-title">Repository details</h3>
          <div class="project-kpi-grid project-kpi-grid--modal">
            <div class="project-kpi-card-modal"><span>Primary language</span><strong>${this.escapeHtml(repo.language || 'Not specified')}</strong></div>
            <div class="project-kpi-card-modal"><span>Stars</span><strong>${this.escapeHtml(repo.stargazers_count || 0)}</strong></div>
            <div class="project-kpi-card-modal"><span>Forks</span><strong>${this.escapeHtml(repo.forks_count || 0)}</strong></div>
            <div class="project-kpi-card-modal"><span>Open issues</span><strong>${this.escapeHtml(repo.open_issues_count || 0)}</strong></div>
          </div>
        </div>

        <div class="blog-preview__footer-actions">
          <a class="blog-read-btn blog-preview__read-complete" href="${safeRepoUrl}" target="_blank" rel="noopener noreferrer" aria-label="Explore ${safeName} on GitHub">
            <i class="fab fa-github" aria-hidden="true"></i> Explore Repository <i class="fas fa-arrow-right" aria-hidden="true"></i>
          </a>
          ${hasDemo ? `<a class="project-action-btn btn-demo" href="${safeHomepage}" target="_blank" rel="noopener noreferrer"><i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i> Open Live Demo</a>` : ''}
          <button type="button" class="blog-preview__close-action-btn" data-repo-close aria-label="Close repository preview">
            Close preview
          </button>
        </div>
      </article>
    `;

    this.previewModal.classList.remove('hidden');
    void this.previewModal.offsetHeight;
    this.previewModal.classList.add('active');
    this.previewModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.documentElement.classList.add('blog-modal-open');

    try {
      const nextHash = `#repo-read-${encodeURIComponent(repo.name)}`;
      if (window.location.hash !== nextHash) {
        history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}${nextHash}`
        );
      }
    } catch {
      // ignore history errors
    }

    requestAnimationFrame(() => {
      this.previewModal.querySelector('.blog-modal-close')?.focus();
      this.previewModal.querySelector('.blog-modal-container')?.scrollTo?.(0, 0);
      modalBody.scrollTop = 0;
    });
  }

  closeRepoPreview() {
    if (!this.previewModal) return;
    this.previewModal.classList.remove('active');
    this.previewModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.documentElement.classList.remove('blog-modal-open');

    try {
      if (window.location.hash.startsWith('#repo-read-')) {
        history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}#projects`
        );
      }
    } catch {
      // ignore history errors
    }

    const restore = this.lastModalFocus;
    const restoreRepoName = restore?.dataset?.repoPreview;
    this.lastModalFocus = null;

    setTimeout(() => {
      if (!this.previewModal.classList.contains('active')) {
        this.previewModal.classList.add('hidden');
      }
      const currentTrigger = restoreRepoName
        ? Array.from(document.querySelectorAll('[data-repo-preview]')).find(
            trigger => trigger.dataset.repoPreview === restoreRepoName
          )
        : null;
      const focusTarget = restore?.isConnected ? restore : currentTrigger;
      if (focusTarget && typeof focusTarget.focus === 'function') {
        try {
          focusTarget.focus();
        } catch {
          // ignore focus errors
        }
      }
    }, 300);
  }

  buildProjectMedia(repo, topics) {
    // Editorial topic map from public repository metadata, never a product screenshot.
    const xml = value =>
      String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');
    const name = String(repo.name || 'Repository');
    const language = String(repo.language || 'Source code');
    const labels = [
      language,
      ...topics.slice(0, 2).map(topic => String(topic).replaceAll('-', ' ')),
    ];
    while (labels.length < 3) labels.push('GitHub repository');
    const hash = [...name].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
    const palettes = [
      ['#071f3d', '#0066cc', '#63dcff'],
      ['#1b183f', '#6654d7', '#c0a8ff'],
      ['#092d32', '#008e95', '#9debd7'],
      ['#302036', '#ae4684', '#ffc79a'],
      ['#142638', '#4079a8', '#b7def9'],
    ];
    const [deep, mid, bright] = palettes[hash % palettes.length];
    const title = name.length > 25 ? `${name.slice(0, 24)}…` : name;
    const subtitle = language.length > 19 ? `${language.slice(0, 18)}…` : language;
    const chip = (x, y, label, width) =>
      `<rect x="${x}" y="${y}" width="${width}" height="66" rx="22" fill="#ffffff" fill-opacity=".11" stroke="#ffffff" stroke-opacity=".32"/><text x="${x + 24}" y="${y + 40}" font-size="22" font-weight="600" fill="#ffffff">${xml(label.length > 19 ? `${label.slice(0, 18)}…` : label)}</text>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-label="Concept map for ${xml(name)}">
      <defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="${deep}"/><stop offset="1" stop-color="${mid}"/></linearGradient><radialGradient id="glow"><stop stop-color="${bright}" stop-opacity=".65"/><stop offset="1" stop-color="${bright}" stop-opacity="0"/></radialGradient><pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#ffffff" stroke-opacity=".08"/></pattern></defs>
      <rect width="1200" height="675" fill="url(#bg)"/><rect width="1200" height="675" fill="url(#grid)"/><circle cx="930" cy="95" r="360" fill="url(#glow)" opacity=".62"/>
      <rect x="62" y="58" width="252" height="46" rx="23" fill="#ffffff" fill-opacity=".14" stroke="#ffffff" stroke-opacity=".29"/><text x="84" y="88" font-family="Arial,sans-serif" font-size="19" font-weight="700" letter-spacing="2" fill="#ffffff">REPOSITORY MAP</text>
      <text x="62" y="205" font-family="Arial,sans-serif" font-size="54" font-weight="700" letter-spacing="-2" fill="#ffffff">${xml(title)}</text><text x="64" y="252" font-family="Arial,sans-serif" font-size="24" fill="#dceeff">${xml(subtitle)} · public GitHub metadata</text>
      <path d="M120 386H1082M190 386V440M600 386V440M1010 386V440" fill="none" stroke="${bright}" stroke-opacity=".67" stroke-width="3" stroke-linecap="round"/>
      <circle cx="190" cy="386" r="10" fill="${bright}"/><circle cx="600" cy="386" r="10" fill="${bright}"/><circle cx="1010" cy="386" r="10" fill="${bright}"/>
      ${chip(62, 452, labels[0], 325)}${chip(438, 452, labels[1], 325)}${chip(814, 452, labels[2], 325)}
      <text x="64" y="625" font-family="Arial,sans-serif" font-size="20" letter-spacing="1" fill="#ffffff" fill-opacity=".75">LANGUAGE AND REPOSITORY TOPICS</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  createProjectCard(repo, _index) {
    const showcase = repo.__showcase || this.getShowcaseScore(repo);
    const language =
      REPO_SCREENSHOTS[String(repo.name || '').toLowerCase()]?.language ||
      repo.language ||
      'Unknown';
    const description =
      REPO_SCREENSHOTS[String(repo.name || '').toLowerCase()]?.summary ||
      repo.description ||
      'No repository description provided yet.';
    const stars = Number(repo.stargazers_count || 0);
    const forks = Number(repo.forks_count || 0);
    const openIssues = Number(repo.open_issues_count || 0);
    const watchers = Number(repo.watchers_count || 0);

    const activity = repo.__activity || {};
    const commits30d = this.toFiniteMetric(activity.commits30d);
    const contributors = this.toFiniteMetric(activity.contributors);
    const latestCommitAt = activity.latestCommitAt || repo.pushed_at || repo.updated_at || '';
    const releaseSignal = this.getReleaseSignal(repo, activity);
    const releaseKey = ['attention', 'active', 'busy', 'fresh', 'released', 'open'].includes(
      releaseSignal.key
    )
      ? releaseSignal.key
      : 'open';

    const homepage = this.normalizeHomepageUrl(repo.homepage, repo.html_url);
    const hasDemo = Boolean(homepage);
    const repoPath = repo.full_name || `${this.username}/${repo.name}`;
    const repoLicense = repo.license?.spdx_id || '';
    const repoSize = Number.isFinite(repo.size) ? repo.size : '';
    const repoBranch = repo.default_branch || '';
    const aiInsight = this.buildAiInsight(repo, showcase);
    const topics = this.getTopics(repo);
    const projectMedia = this.getRepoMedia(repo, topics);

    const safeName = this.escapeHtml(repo.name);
    const safeRepoPath = this.escapeHtml(repoPath);
    const safeDescription = this.escapeHtml(description);
    const safeLanguage = this.escapeHtml(language);
    const safeRepoUrl = this.escapeHtml(repo.html_url);
    const safeHomepage = hasDemo ? this.escapeHtml(homepage) : '';
    const safeInsight = this.escapeHtml(aiInsight);
    const safeScore = this.escapeHtml(showcase.score);
    const safeLicense = this.escapeHtml(repoLicense);
    const safeBranch = this.escapeHtml(repoBranch);
    const safeRepoSize = this.escapeHtml(repoSize);
    const safeOpenIssues = this.escapeHtml(openIssues);
    const safeReleaseKey = this.escapeHtml(releaseKey);
    const safeReleaseLabel = this.escapeHtml(releaseSignal.label);
    const safeReleaseTag = this.escapeHtml(releaseSignal.tagName || '');
    const safeReleaseDate = this.escapeHtml(releaseSignal.releaseDate || '');
    const safeReleaseUrl = this.escapeHtml(releaseSignal.latestRelease?.htmlUrl || '');
    const safeReleaseCommits = this.escapeHtml(
      releaseSignal.commitsSinceRelease === null ? '' : releaseSignal.commitsSinceRelease
    );
    const topicsJson = this.escapeHtml(JSON.stringify(topics));
    const updatedAt = this.escapeHtml(repo.updated_at || '');
    const createdAt = this.escapeHtml(repo.created_at || '');
    const pushedAt = this.escapeHtml(repo.pushed_at || '');
    const lastCommitAtSafe = this.escapeHtml(latestCommitAt);

    const pushedAgeDays = this.getRepoAgeDays(repo?.pushed_at || repo?.updated_at);
    const isRecentlyActive = Number.isFinite(pushedAgeDays) && pushedAgeDays <= 7;
    const projectKind = repo.fork ? 'Fork' : projectMedia.label || 'Repository';
    const kickerLanguage = language === 'Unknown' ? 'Software' : safeLanguage;
    const kickerHtml = `<p class="project-kicker">${kickerLanguage} <span aria-hidden="true">·</span> ${projectKind}${isRecentlyActive ? '<span class="project-pulse-dot" title="Pushed in the last 7 days"></span>' : ''}</p>`;
    const topicsHtml =
      topics.length > 0
        ? topics
            .slice(0, 2)
            .map(topic => `<span class="project-tag">${this.escapeHtml(topic)}</span>`)
            .join('')
        : '';
    const demoHtml = hasDemo
      ? `<a href="${safeHomepage}" target="_blank" rel="noopener noreferrer" class="project-action-btn btn-demo" aria-label="Open ${safeName} live demo">
                <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
                <span>Live demo</span>
              </a>`
      : '';

    return `
      <article class="showcase-project-card apple-3d-project group lg-interactive ${hasDemo ? 'has-live-demo' : ''}" data-lg-interactive data-repo-name="${safeName}" data-release-status="${safeReleaseKey}" aria-label="${safeName} project card">
        <figure class="project-media ${projectMedia.screenshot ? 'project-media--screenshot' : ''} ${projectMedia.crop === 'left' ? 'project-media--cover-left' : ''} ${projectMedia.tone === 'dark' ? 'project-media--dark' : ''}">
          <button type="button" class="project-media-open" data-repo-preview="${safeName}" aria-label="Explore ${safeName} project details">
            <img src="${projectMedia.src}" alt="${this.escapeHtml(projectMedia.alt)}" loading="lazy" decoding="async" width="${projectMedia.width}" height="${projectMedia.height}">
            <span class="project-media-cue" aria-hidden="true">Explore project <i class="fas fa-arrow-up-right-from-square"></i></span>
          </button>
        </figure>
        <div class="project-header">
          ${kickerHtml}
          <div class="project-title-wrap">
            <h3 class="project-title"><span class="project-title-text">${safeName}</span></h3>
          </div>
          <p class="project-description" title="${safeDescription || 'No description available'}">${safeDescription || 'No description available'}</p>
          ${topicsHtml ? `<div class="project-meta-row" aria-label="Repository topics"><div class="project-tech-pills">${topicsHtml}</div></div>` : ''}
          <dl class="project-signal-grid" aria-label="Repository signals">
            <div><dt><i class="fas fa-star" aria-hidden="true"></i> Stars</dt><dd>${this.formatCompactNumber(stars)}</dd></div>
            <div><dt><i class="fas fa-code-fork" aria-hidden="true"></i> Forks</dt><dd>${this.formatCompactNumber(forks)}</dd></div>
            <div><dt><i class="fas fa-code-branch" aria-hidden="true"></i> Last push</dt><dd>${this.escapeHtml(this.formatRelativeDateCompact(repo.pushed_at || repo.updated_at))}</dd></div>
          </dl>
        </div>

        <div class="project-footer ${hasDemo ? 'has-demo' : 'no-demo'}">
          ${demoHtml}
          <a
            href="${safeRepoUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="project-action-btn btn-github"
            aria-label="Open ${safeName} on GitHub"
          >
            <i class="fab fa-github" aria-hidden="true"></i>
            <span>View code</span>
          </a>
          <details class="project-more">
            <summary aria-label="More actions for ${safeName}" title="More actions for ${safeName}"><i class="fas fa-ellipsis" aria-hidden="true"></i><span class="sr-only">More actions</span></summary>
            <div class="project-more-menu">
          <button
            type="button"
            class="project-action-btn btn-ar"
            data-project-name="${safeName}"
            data-project-full-name="${safeRepoPath}"
            data-project-url="${safeRepoUrl}"
            data-project-demo-url="${safeHomepage}"
            data-project-repo-url="${safeRepoUrl}"
            data-project-updated-at="${updatedAt}"
            data-project-created-at="${createdAt}"
            data-project-stars="${stars}"
            data-project-forks="${forks}"
            data-project-open-issues="${safeOpenIssues}"
            data-project-watchers="${watchers}"
            data-project-size-kb="${safeRepoSize}"
            data-project-license="${safeLicense}"
            data-project-default-branch="${safeBranch}"
            data-project-pushed-at="${pushedAt}"
            data-project-last-commit-at="${lastCommitAtSafe}"
            data-project-release-status="${safeReleaseKey}"
            data-project-release-status-label="${safeReleaseLabel}"
            data-project-release-tag="${safeReleaseTag}"
            data-project-release-url="${safeReleaseUrl}"
            data-project-release-published-at="${safeReleaseDate}"
            data-project-release-commits-since="${safeReleaseCommits}"
            data-project-release-checked="${releaseSignal.releaseChecked ? 'true' : 'false'}"
            data-project-commits-30d="${commits30d === null ? '' : commits30d}"
            data-project-contributors="${contributors === null ? '' : contributors}"
            data-project-score="${safeScore}"
            data-project-language="${safeLanguage}"
            data-project-topics="${topicsJson}"
            data-project-ai-insight="${safeInsight}"
            aria-label="${safeName}: Spatial View"
          >
            <i class="fas fa-cube" aria-hidden="true"></i>
            <span>Spatial view</span>
          </button>
          <button type="button" class="project-clone-btn" data-repo-clone="${safeRepoUrl}.git" title="Copy git clone ${safeRepoUrl}.git" aria-label="Copy git clone command for ${safeName}">
            <i class="fas fa-terminal" aria-hidden="true"></i>
            <span class="clone-label">Copy clone command</span>
          </button>
            </div>
          </details>
        </div>
      </article>
    `;
  }

  async renderProjects(containerId = 'github-projects-container', limit = 12) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }

    // Keep existing shell if present (avoids flash of empty + double spinner)
    if (
      !container.querySelector(
        '.project-loading-state, .projects-loading-container, .apple-3d-project, .showcase-project-card'
      )
    ) {
      container.innerHTML = `
      <div class="projects-grid-full project-loading-state" role="status" aria-live="polite">
        <div class="project-loading-inner">
          <div class="loading-spinner" aria-hidden="true"></div>
          <p class="text-secondary loading-message">Loading projects from GitHub…</p>
        </div>
      </div>
    `;
    }

    try {
      const repos = await this.fetchRepositories();
      const showcaseRepos = this.getShowcaseRepos(repos, limit);

      if (showcaseRepos.length === 0) {
        container.innerHTML = `
          <div class="projects-grid-full project-empty-state">
            <i class="fas fa-folder-open project-state-icon" aria-hidden="true"></i>
            <p class="text-secondary">No showcase-ready repositories found</p>
            <p class="text-secondary"><a href="https://github.com/mangeshraut712" target="_blank" rel="noopener noreferrer">View GitHub profile</a></p>
          </div>
        `;
        return;
      }

      await this.hydrateReposWithActivity(showcaseRepos);

      const projectsHTML = showcaseRepos
        .map((repo, index) => this.createProjectCard(repo, index))
        .join('');

      container.innerHTML = projectsHTML;

      window.dispatchEvent(new CustomEvent('projects:rendered'));
      window.dispatchEvent(new CustomEvent('liquid-glass:sync-chrome'));

      if (window.PremiumEnhancements && window.PremiumEnhancements.applyTiltToElement) {
        const newCards = container.querySelectorAll('.apple-3d-project');
        newCards.forEach(card => window.PremiumEnhancements.applyTiltToElement(card));
      }
    } catch (error) {
      console.warn('[GitHubProjects] Failed to render projects:', error);
      container.innerHTML = `
        <div class="projects-grid-full project-empty-state">
          <i class="fas fa-exclamation-triangle project-state-icon project-state-icon-danger" aria-hidden="true"></i>
          <p class="text-secondary">Could not load live GitHub projects right now.</p>
          <p class="text-secondary"><a href="https://github.com/mangeshraut712?tab=repositories" target="_blank" rel="noopener noreferrer">Browse repositories on GitHub</a></p>
        </div>
      `;
    }
  }

  async getStats() {
    const repos = await this.fetchRepositories();

    const stats = {
      totalRepos: repos.length,
      totalStars: repos.reduce((sum, repo) => sum + Number(repo.stargazers_count || 0), 0),
      totalForks: repos.reduce((sum, repo) => sum + Number(repo.forks_count || 0), 0),
      languages: {},
      mostStarred: repos.reduce((max, repo) =>
        Number(repo.stargazers_count || 0) > Number(max.stargazers_count || 0) ? repo : max
      ),
      recentlyUpdated: repos[0],
    };

    repos.forEach(repo => {
      if (!repo.language) return;
      stats.languages[repo.language] = (stats.languages[repo.language] || 0) + 1;
    });

    return stats;
  }

  // Search repositories by name, description, or topics
  async searchRepos(query) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const repos = await this.fetchRepositories();
    const queryLower = query.toLowerCase().trim();

    return repos.filter(repo => {
      const nameMatch = repo.name?.toLowerCase().includes(queryLower);
      const descMatch = repo.description?.toLowerCase().includes(queryLower);
      const topicMatch = repo.topics?.some(topic => topic?.toLowerCase().includes(queryLower));
      const langMatch = repo.language?.toLowerCase().includes(queryLower);

      return nameMatch || descMatch || topicMatch || langMatch;
    });
  }

  sortRepos(repos, sortBy = 'updated') {
    const sorted = [...repos];

    switch (sortBy) {
      case 'stars':
        sorted.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
        break;
      case 'forks':
        sorted.sort((a, b) => (b.forks_count || 0) - (a.forks_count || 0));
        break;
      case 'name':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'created':
        sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      case 'updated':
      default:
        sorted.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
        break;
    }

    return sorted;
  }

  async getSearchableProjects() {
    const repos = await this.fetchRepositories();
    return repos.map(repo => ({
      type: 'GitHub Project',
      title: repo.name,
      description: repo.description || '',
      url: repo.html_url,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      language: repo.language,
      topics: repo.topics || [],
      updated: repo.updated_at,
    }));
  }
}

if (typeof window !== 'undefined') {
  window.GitHubProjects = GitHubProjects;
}

export default GitHubProjects;
