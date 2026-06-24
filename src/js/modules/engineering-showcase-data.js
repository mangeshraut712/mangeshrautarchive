/**
 * Engineering Evidence — data for systems.html & homepage teaser
 * Inspired by evidence-first hiring: build, ship, think, taste.
 */

import { BRAND_TAGLINE, portfolioCaseStudy } from './case-studies-data.js';

export { portfolioCaseStudy, BRAND_TAGLINE };

export const publicEvidenceStatement =
  'This page is intentionally public. Every architecture decision, benchmark, tradeoff, failure, and production metric exists because I believe engineering ability should be demonstrated through evidence rather than claimed through bullet points.';

export const heroLead =
  'Every claim on this portfolio is backed by code, benchmarks, architecture, or production telemetry. No stock templates. No generated project descriptions. Only things I\'ve built, measured, shipped, and learned.';

export const heroStats = [
  { value: '95+', unit: '', label: 'Lighthouse', href: '#production' },
  { value: '9', unit: '', label: 'WebMCP tools', href: '#architecture' },
  { value: '40', unit: '%', label: 'Dashboard improvement', href: '#projects' },
  { value: '12', unit: '', label: 'Technical articles', href: '#writing' },
  { value: '40+', unit: '', label: 'Repositories', href: '#open-source' },
  { value: 'Live', unit: '', label: 'Production monitor', href: 'monitor.html' },
];

export const builderProfile = {
  title: 'Builder Profile',
  lead: 'Software Development Engineer',
  bullets: [
    'MS Computer Science — Drexel University',
    'Building production AI products, agentic workflows, developer infrastructure, and modern web systems.',
  ],
  anchor: 'builder-profile',
};

export const buildCapabilities = {
  title: 'What I Actually Build',
  items: [
    'AI Products',
    'Agentic Systems',
    'Full Stack Applications',
    'RAG Pipelines',
    'Developer Tools',
    'System Monitors',
    'Production APIs',
    'Design Systems',
  ],
  anchor: 'build-capabilities',
};

export const hiringEvidence = [
  {
    id: 'build',
    question: 'Can this person build?',
    answer:
      '9 WebMCP tools, dual-host portfolio, public monitor, and case studies with architecture diagrams — all in production.',
    href: '#projects',
    anchor: 'evidence-build',
  },
  {
    id: 'ship',
    question: 'Can this person ship?',
    answer:
      '95+ Lighthouse CI gate, automatic deployments, live telemetry, and enterprise analytics with measured 40% latency reduction.',
    href: '#production',
    anchor: 'evidence-ship',
  },
  {
    id: 'think',
    question: 'Can this person think?',
    answer:
      'Documented tradeoffs, rejected architectures, and failures — not just shipped features.',
    href: '#experiments',
    anchor: 'evidence-think',
  },
  {
    id: 'taste',
    question: 'Can I trust their engineering taste?',
    answer:
      'Local-first actions, model routing over lock-in, and reliability gates before novelty.',
    href: '#architecture',
    anchor: 'evidence-taste',
  },
];

export const productionSnapshot = [
  { label: 'Current deployment', value: 'Operational', liveKey: 'health' },
  { label: 'Response time', value: '—', unit: 'ms', liveKey: 'apiP95' },
  { label: 'Lighthouse', value: '95+' },
  { label: 'Deployments', value: 'Automatic' },
  { label: 'AI streaming', value: 'Enabled' },
  { label: 'Provider', value: 'OpenRouter' },
  { label: 'Models', value: 'Claude · Gemma · Grok' },
  { label: 'Tool calls', value: 'Enabled' },
];

export const productionMetricGroups = [
  {
    id: 'deploy',
    title: 'Production',
    rows: [
      { label: 'Status', value: 'Operational', liveKey: 'health' },
      { label: 'Response time', value: '—', unit: 'ms', liveKey: 'apiP95' },
      { label: 'Lighthouse', value: '95+' },
      { label: 'Deployments', value: 'Automatic' },
      { label: 'Uptime', value: '—', liveKey: 'uptime' },
    ],
  },
  {
    id: 'ai',
    title: 'AI',
    rows: [
      { label: 'Streaming', value: 'Enabled' },
      { label: 'Provider', value: 'OpenRouter' },
      { label: 'Models', value: 'Claude · Gemma · Grok' },
      { label: 'Tool calls', value: 'Enabled' },
      { label: 'First token', value: '~1.2s', liveKey: 'chatTtft' },
      { label: 'Context window', value: '128k' },
    ],
  },
  {
    id: 'frontend',
    title: 'Frontend',
    rows: [
      { label: 'Lighthouse Performance', value: '95+' },
      { label: 'Accessibility', value: '95' },
      { label: 'Best Practices', value: '100' },
      { label: 'SEO', value: '100' },
      { label: 'CLS', value: '0.00' },
      { label: 'INP', value: '<100ms' },
    ],
  },
  {
    id: 'agent',
    title: 'Local agent',
    rows: [
      { label: 'WebMCP tools', value: '9' },
      { label: 'Navigate', value: '<30ms' },
      { label: 'Theme toggle', value: '<15ms' },
      { label: 'Resume download', value: '<10ms' },
      { label: 'Search / filter', value: '<35ms' },
    ],
  },
];

export const architectureDecisions = [
  { decision: 'Why FastAPI?', why: 'Because streaming and async matter.' },
  { decision: 'Why OpenRouter?', why: 'Model routing > provider lock-in.' },
  { decision: 'Why WebMCP?', why: 'Instant browser actions without LLM latency.' },
  { decision: 'Why Vercel + GH Pages?', why: 'Static delivery + cheap API hosting.' },
  { decision: 'Why local-first?', why: 'Navigation should never wait for an LLM.' },
];

export const engineeringDecisions = [
  { decision: 'Rejected microservices', why: 'Complexity' },
  { decision: 'Rejected vector DB', why: 'Simple search was enough' },
  { decision: 'Rejected AI navigation', why: 'Regex is 20× faster' },
  { decision: 'Rejected animation library', why: 'Native browser APIs' },
];

export const failedExperiments = [
  { name: 'Prompt-only navigation', status: 'Failed', reason: 'Unreliable' },
  { name: 'SSR hydration', status: 'Failed', reason: 'Complexity > value' },
  { name: 'Large context RAG', status: 'Failed', reason: 'Retrieval quality matters more than context size' },
];

export const currentWork = [
  { phase: 'Shipping', title: 'Agentic Portfolio', progress: '95%', href: 'case-studies/portfolio.html' },
  { phase: 'Research', title: 'HindAI RAG evaluation', progress: 'Active', href: '#projects' },
  { phase: 'Experiment', title: 'WebXR project previews', progress: 'Active', href: 'index.html#projects' },
  { phase: 'Writing', title: 'Context Engineering', progress: 'In progress', href: '#writing' },
  { phase: 'Learning', title: 'RL Environments', progress: 'Ongoing', href: 'index.html#blog' },
];

export const lessonsLearned = [
  'The model is not the architecture.',
  'Retrieval determines quality.',
  'Measure everything.',
  'Architecture is UX.',
  'Reliability beats novelty.',
  'AI should augment, not obscure.',
];

export const openSourceActivity = {
  label: 'Open source',
  rows: [
    { label: 'Latest release', value: '—', liveKey: 'latestRelease' },
    { label: 'Latest commit', value: '—', liveKey: 'latestCommit' },
    { label: 'Current branch', value: 'main', liveKey: 'currentBranch' },
    { label: 'Recent PR', value: '—', liveKey: 'recentPr' },
    { label: 'Recent issue', value: '—', liveKey: 'recentIssue' },
    { label: 'Most active repo', value: 'mangeshrautarchive', liveKey: 'activeRepo' },
    { label: 'Repositories', value: '40+' },
    { label: 'Contributions', value: 'Active', liveKey: 'streak' },
  ],
  repoUrl: 'https://github.com/mangeshraut712',
};

export const writingTopics = [
  { label: 'Field Notes', href: 'blog/index.html' },
  { label: 'Google I/O', href: 'index.html#blog' },
  { label: 'WWDC', href: 'index.html#blog' },
  { label: 'Context Engineering', href: 'index.html#blog' },
  { label: 'RAG', href: 'index.html#blog' },
  { label: 'System Design', href: 'index.html#blog' },
  { label: 'AI Products', href: 'index.html#blog' },
  { label: 'Developer Experience', href: 'index.html#blog' },
];

export const engineeringTimeline = [
  {
    year: '2026',
    items: [
      'Engineering Dashboard',
      'WebMCP',
      'System Monitor',
      'Agentic Portfolio',
    ],
  },
  {
    year: '2025',
    items: ['Enterprise Analytics', 'AI Products'],
  },
  {
    year: '2024',
    items: ['AssistMe', 'Voice AI'],
  },
  {
    year: '2023',
    items: ['MS Computer Science', 'Drexel University'],
  },
];

export const evidenceFooterLinks = [
  { label: 'Currently Building', href: '#experiments' },
  { label: 'Open Source', href: '#open-source' },
  { label: 'Engineering Notebook', href: 'systems.html' },
  { label: 'System Monitor', href: 'monitor.html' },
  { label: 'Resume', href: 'assets/files/Mangesh_Raut_Resume.pdf' },
  { label: 'GitHub', href: 'https://github.com/mangeshraut712', external: true },
  { label: 'Now', href: 'uses.html' },
  { label: 'RSS', href: 'rss.xml' },
];

/** AI tooling tokenization — public build stack transparency */
export const tokenizationStack = [
  { name: 'Cursor', tokens: '1B' },
  { name: 'Codex', tokens: '5B' },
  { name: 'KiloChat', tokens: '5B' },
  { name: 'Cline', tokens: '2B' },
  { name: 'OpenRouter', tokens: '1B' },
  { name: 'Antigravity', tokens: '5B' },
  { name: 'Droid', tokens: '1B' },
  { name: 'OpenClaw', tokens: null },
  { name: 'OpenCode', tokens: null },
  { name: 'Hermes Agent', tokens: '1B' },
  { name: 'VS Code', tokens: '1B' },
  { name: 'Claude', tokens: '1B' },
];

/** @deprecated use lessonsLearned */
export const engineeringPrinciples = lessonsLearned;

export const buildingItems = [
  {
    id: 'monitor',
    title: 'Public System Monitor',
    status: 'Live',
    summary: 'Open ops dashboard — API health, AI metrics, deployment surfaces, client probes.',
    stack: ['FastAPI', 'Vercel', 'SVG'],
    href: 'monitor.html',
    signal: '15 sections',
  },
  {
    id: 'github-intel',
    title: 'GitHub Project Intelligence',
    status: 'Production',
    summary:
      'Release-aware cards, activity lenses, fuzzy search, contributor hydration, WebXR previews.',
    stack: ['GitHub API', 'WebXR'],
    href: 'index.html#projects',
    signal: 'Public',
  },
];

export const staticBenchmarks = [
  {
    id: 'lighthouse',
    label: 'Lighthouse Performance',
    value: '100',
    unit: '/100',
    context: 'Homepage CI gate (mobile + desktop)',
  },
  {
    id: 'accessibility',
    label: 'Lighthouse Accessibility',
    value: '100',
    unit: '/100',
    context: 'Automated a11y gate in CI',
  },
  {
    id: 'local-actions',
    label: 'Local WebMCP Actions',
    value: '<50',
    unit: 'ms',
    context: 'WebMCP navigate / theme / resume',
  },
  {
    id: 'webmcp-mcp',
    label: 'WebMCP Client & Tools',
    value: '9',
    unit: 'tools',
    context: 'Deterministic browser tool execution',
  },
  {
    id: 'best-practices',
    label: 'Lighthouse Best Practices',
    value: '100',
    unit: '/100',
    context: 'Security & web standards gate',
  },
  {
    id: 'seo',
    label: 'Lighthouse SEO',
    value: '100',
    unit: '/100',
    context: 'Structured data, meta, and crawlability gate',
  },
  {
    id: 'api-p95',
    label: 'API p95 latency',
    value: '—',
    unit: 'ms',
    context: 'Live telemetry from monitor',
    liveKey: 'apiP95',
  },
  {
    id: 'uptime',
    label: 'Uptime',
    value: '—',
    unit: '',
    context: 'Health probes (30d)',
    liveKey: 'uptime',
  },
  {
    id: 'dashboard-cut',
    label: 'Dashboard latency cut',
    value: '40',
    unit: '%',
    context: 'CES energy analytics',
  },
];

export const systemDesignTopics = [
  {
    slug: 'assistme',
    title: 'AssistMe — Local-First Agentic Chat',
    problem: 'Visitors need instant help without LLM latency for every action.',
    components: ['WebMCP tools', 'site_knowledge.py', 'model_router.py', 'NDJSON stream'],
    href: 'case-studies/portfolio.html',
  },
  {
    slug: 'github-showcase',
    title: 'GitHub Project Intelligence',
    problem: 'Static project lists go stale; recruiters need release and activity signals.',
    components: ['Activity lenses', 'Fuzzy search', 'Async hydration', 'WebXR modal'],
    href: 'index.html#projects',
  },
  {
    slug: 'monitor',
    title: 'Public Operations Monitor',
    problem: 'Prove production maturity without hiding behind a login.',
    components: ['/api/monitor/*', 'Client probes', 'Deployment surfaces', 'AI metrics'],
    href: 'monitor.html',
  },
];

export const caseStudyFlowSteps = [
  { key: 'problem', label: 'Problem' },
  { key: 'whyExistingFail', label: 'Constraints' },
  { key: 'approach', label: 'Architecture' },
  { key: 'tradeoffs', label: 'Tradeoffs' },
  { key: 'metrics', label: 'Benchmarks' },
  { key: 'improvements', label: 'Failures' },
  { key: 'results', label: 'Lessons' },
  { key: 'resultSummary', label: 'Result' },
];

export const usesStack = {
  hardware: ['MacBook Pro (Apple Silicon)', 'Studio Display', 'AirPods Pro'],
  software: ['macOS', 'Raycast', 'Arc / Safari', 'iTerm'],
  aiStack: ['Cursor', 'Claude Code', 'OpenRouter', 'Codex'],
  engineering: ['FastAPI', 'React', 'Next.js', 'Vercel', 'GitHub Actions', 'Playwright'],
  fonts: ['SF Pro', 'Inter (fallback)'],
  theme: ['Solid white/black surfaces', 'Apple 2026 design tokens', 'Dark / light sync'],
  productivity: ['Notion', 'Linear-style task lists', 'GitHub Projects'],
  reading: ['Technical blogs', 'Apple HIG', 'AI papers & field notes'],
};

/** Homepage engineering evidence Q&A cards (outside the metrics overview) */
export const evidenceCards = [
  {
    id: 'who',
    question: 'Who are you?',
    answer:
      'Software developer and engineer — MS Computer Science at Drexel, building production AI products, agentic workflows, and modern web systems.',
    href: 'systems.html#builder-profile',
  },
  {
    id: 'built',
    question: 'What have you built?',
    answer:
      'AI products, agentic systems, full-stack apps, RAG pipelines, developer tools, system monitors, production APIs, and design systems — all with public case studies.',
    href: 'systems.html#projects',
  },
  {
    id: 'exceptional',
    question: 'Why are you exceptional?',
    answer:
      'Evidence over claims: measured benchmarks, documented tradeoffs, rejected architectures, and production telemetry — not template portfolios or generated descriptions.',
    href: 'systems.html#evidence',
  },
  {
    id: 'proof',
    question: 'Where is the proof?',
    answer:
      'Open the engineering notebook — architecture diagrams, live monitor, open source, failures, and technical writing with links to repos and demos.',
    href: 'systems.html',
  },
];
