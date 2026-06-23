/**
 * Engineering evidence dashboard — data for systems.html
 */

import { BRAND_TAGLINE, portfolioCaseStudy } from './case-studies-data.js';

export { portfolioCaseStudy, BRAND_TAGLINE };

export const heroStats = [
  { value: '95+', unit: '', label: 'Lighthouse', href: '#production-metrics' },
  { value: '<50', unit: 'ms', label: 'Local agent', href: '#production-metrics' },
  { value: '40', unit: '%', label: 'Latency reduction', href: '#case-studies' },
  { value: '9', unit: '', label: 'WebMCP tools', href: '#architecture' },
];

export const evidenceCards = [
  {
    id: 'who',
    question: 'Who are you?',
    lead: 'AI Engineer & Product Builder',
    bullets: [
      'MS Computer Science — Drexel University',
      'Building production AI systems, agentic workflows, retrieval pipelines, developer infrastructure, and modern full-stack applications.',
      'Focused on reliability, developer experience, and thoughtful product design.',
    ],
    anchor: 'evidence-who',
  },
  {
    id: 'what',
    question: 'What have you built?',
    bullets: [
      'Production AI portfolio with local agentic actions, OpenRouter streaming, and 9 WebMCP tools',
      'Live GitHub intelligence and public operations monitor',
      'Enterprise analytics platform reducing dashboard latency by 40%',
      'Gemma-powered HindAI with grounded retrieval and citations',
      'Multi-modal AssistMe — voice, research, and tool orchestration',
      'Production bug tracking platform — Django, React, PostgreSQL',
    ],
    anchor: 'evidence-what',
    link: { href: 'index.html#projects', label: 'All projects' },
  },
  {
    id: 'why',
    question: 'Why are you exceptional?',
    lead: 'I optimize entire systems instead of individual components.',
    bullets: [
      '40% reduction in enterprise dashboard latency',
      '35% faster deployment workflows',
      '25% improvement in ML forecasting accuracy',
      '95+ Lighthouse production CI gate',
      '<50ms local agentic interactions',
      'Apple-inspired product design across every shipped interface',
    ],
    anchor: 'evidence-why',
    link: { href: 'index.html#experience', label: 'Experience' },
  },
  {
    id: 'proof',
    question: 'Where is the proof?',
    lead: 'Everything on this page is public.',
    checklist: [
      { label: 'Live demos', href: 'https://mangeshraut.pro/', external: true },
      { label: 'Source code', href: 'https://github.com/mangeshraut712', external: true },
      { label: 'Architecture diagrams', href: '#architecture' },
      { label: 'Production telemetry', href: '#production-metrics' },
      { label: 'Performance benchmarks', href: '#production-metrics' },
      { label: 'Case studies', href: '#case-studies' },
      { label: 'Resume', href: 'assets/files/Mangesh_Raut_Resume.pdf' },
      { label: 'Recommendations', href: 'index.html#recommendations' },
      { label: 'Certifications', href: 'index.html#certifications' },
      { label: 'Public GitHub activity', href: '#open-source' },
    ],
    anchor: 'evidence-proof',
  },
];

export const productionMetricGroups = [
  {
    id: 'ai',
    title: 'AI',
    rows: [
      { label: 'OpenRouter streaming', value: 'Enabled' },
      { label: 'First token', value: '~1.2s', liveKey: 'chatTtft' },
      { label: 'Avg completion', value: '~2.8s' },
      { label: 'Context window', value: '128k' },
      { label: 'Prompt cache', value: 'Enabled' },
      { label: 'Provider failover', value: 'Automatic' },
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
      { label: 'LCP', value: '<1.5s' },
    ],
  },
  {
    id: 'backend',
    title: 'Backend',
    rows: [
      { label: 'p95 latency', value: '—', unit: 'ms', liveKey: 'apiP95' },
      { label: 'Availability', value: '99.9%' },
      { label: 'Streaming', value: 'NDJSON' },
      { label: 'Health', value: 'Operational', liveKey: 'health' },
      { label: 'Deployments', value: 'Auto' },
    ],
  },
  {
    id: 'agent',
    title: 'Local agent',
    rows: [
      { label: 'Navigate', value: '28ms' },
      { label: 'Theme toggle', value: '12ms' },
      { label: 'Resume download', value: '9ms' },
      { label: 'Search', value: '31ms' },
      { label: 'Project filter', value: '18ms' },
    ],
  },
];

export const openSourceActivity = {
  label: 'Open source',
  rows: [
    { label: 'GitHub commits', value: '1.2k+', liveKey: 'commits' },
    { label: 'Repositories', value: '40+' },
    { label: 'Stars', value: '120+', liveKey: 'stars' },
    { label: 'Pull requests', value: '85+' },
    { label: 'Issues', value: '60+' },
    { label: 'Contributions', value: 'Active' },
    { label: 'Current streak', value: 'Live', liveKey: 'streak' },
  ],
  repoUrl: 'https://github.com/mangeshraut712',
};

export const engineeringPrinciples = [
  'Build once.',
  'Measure everything.',
  'Reliability over novelty.',
  'Local-first when possible.',
  'Architecture is a product feature.',
  'AI should augment, not obscure.',
  'Design is engineering.',
];

export const engineeringTimeline = [
  {
    year: '2026',
    items: [
      'Agentic Portfolio',
      'OpenRouter + WebMCP',
      'System Monitor',
      'GitHub Intelligence',
      'Engineering Evidence dashboard',
    ],
  },
  {
    year: '2025',
    items: ['CES AI Analytics', 'Faster deployments', 'Marketing redesign'],
  },
  {
    year: '2024',
    items: ['AssistMe VA', 'Voice + FastAPI', 'Multi-modal tools'],
  },
  {
    year: '2023',
    items: ['MS Computer Science', 'Drexel University'],
  },
];

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
    value: '95+',
    unit: 'score',
    context: 'Homepage CI gate (mobile)',
  },
  {
    id: 'local-actions',
    label: 'Local agentic actions',
    value: '<50',
    unit: 'ms',
    context: 'WebMCP navigate / theme / resume',
  },
  {
    id: 'chat-ttft',
    label: 'Chat first token',
    value: '~1.2',
    unit: 's',
    context: 'OpenRouter stream (portfolio route)',
  },
  {
    id: 'api-p95',
    label: 'API p95 latency',
    value: '—',
    unit: 'ms',
    context: 'Live from monitor',
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
  { key: 'improvements', label: 'Failures & gaps' },
  { key: 'results', label: 'Lessons' },
  { key: 'resultSummary', label: 'Result' },
];

export const usesStack = {
  hardware: ['MacBook Pro (Apple Silicon)', 'Studio Display', 'AirPods Pro'],
  software: ['macOS', 'Raycast', 'Arc / Safari', 'iTerm'],
  aiStack: ['Cursor', 'Claude Code', 'OpenRouter', 'Codex'],
  engineering: ['FastAPI', 'React', 'Next.js', 'Vercel', 'GitHub Actions', 'Playwright'],
  fonts: ['SF Pro', 'Inter (fallback)'],
  theme: ['WWDC26 liquid glass', 'Apple 2026 design tokens', 'Dark / light sync'],
  productivity: ['Notion', 'Linear-style task lists', 'GitHub Projects'],
  reading: ['Technical blogs', 'Apple HIG', 'AI papers & field notes'],
};
