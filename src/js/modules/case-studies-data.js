/**
 * Project case studies — single source for evidence rows, systems page, and static pages.
 */

import { formatDeployLighthouseGate, WEBMCP_TOOL_COUNT } from '../data/portfolio-public-data.js';
import { escapeHtml } from '../utils/escape-html.js';

const BRAND_TAGLINE = 'Production AI products with Apple-level engineering quality.';

export { BRAND_TAGLINE };

export const flagshipOssProjects = [
  {
    slug: 'portfolio',
    title: 'mangeshrautarchive',
    summary: 'Agentic portfolio with WebMCP, OpenRouter, public monitor',
    status: 'Production',
    href: 'case-studies/portfolio.html',
  },
  {
    slug: 'hindai',
    title: 'HindAI',
    summary: 'Gemma RAG assistant for Indian philosophy with citations',
    status: 'Active research',
    href: 'case-studies/hindai.html',
  },
  {
    slug: 'assistme-va',
    title: 'AssistMe Virtual Assistant',
    summary: 'Multi-modal AI assistant — voice, research tools, React + FastAPI',
    status: 'Production demo',
    href: 'case-studies/assistme-va.html',
  },
  {
    slug: 'ces-energy',
    title: 'CES Energy Platform',
    summary: 'Energy analytics + marketing redesign with measurable latency wins',
    status: 'Shipped at work',
    href: 'case-studies/ces-energy.html',
  },
  {
    slug: 'bug-tracker',
    title: 'Bug Reporting System',
    summary: 'Full-stack tracker — Django REST, React, PostgreSQL, Docker',
    status: 'Production demo',
    href: 'case-studies/bug-tracker.html',
  },
];

export const caseStudies = [
  {
    slug: 'portfolio',
    repoName: 'mangeshrautarchive',
    title: 'mangeshraut.pro — Agentic Portfolio',
    tagline: BRAND_TAGLINE,
    demoUrl: 'https://mangeshraut.pro/',
    repoUrl: 'https://github.com/mangeshraut712/mangeshrautarchive',
    blogId: null,
    blogHref: 'index.html#blog',
    videoUrl: 'https://www.youtube.com/@mangeshraut71298',
    videoLabel: 'Walkthrough on YouTube',
    metrics: [
      { label: 'WebMCP tools', value: String(WEBMCP_TOOL_COUNT) },
      { label: 'Lighthouse CI gate', value: formatDeployLighthouseGate() },
      { label: 'Local actions', value: '<50ms' },
      { label: 'Monitor sections', value: '15' },
    ],
    problem:
      'Recruiters need to understand a builder in 30 seconds, but most portfolios are static resumes with stock themes and no proof of production AI craft.',
    whyExistingFail:
      'Template sites hide architecture, chatbots are generic wrappers, and GitHub grids do not tell a product story or show operational maturity.',
    approach:
      'Dual-host static SPA + FastAPI on Vercel, local-first WebMCP for instant actions, OpenRouter only when site knowledge cannot answer, public monitor for ops proof.',
    tradeoffs:
      'GH Pages visitors pay a cross-origin API hop; local regex/tools handle navigation so LLM latency does not block core flows.',
    results: [
      `${WEBMCP_TOOL_COUNT} deterministic WebMCP tools — navigate, filter projects, download resume, toggle theme`,
      `Lighthouse ${formatDeployLighthouseGate()} deploy CI gate on built dist`,
      'Public System Monitor with 15 diagnostic sections',
      '12 technical blog posts with structured “Things I Learned”',
      'WWDC26 liquid glass across home, travel, monitor, blog, systems',
      'Per-project case studies with architecture diagrams and evidence rows',
    ],
    improvements: [
      'Eval harness for AssistMe tool-calling accuracy',
      'Dedicated 90s product walkthrough video per flagship project',
      'Expand OSS line to MCP server + eval harness repos',
    ],
    stack: ['FastAPI', 'OpenRouter', 'esbuild', 'Playwright', 'WebMCP', 'Vercel', 'GitHub Pages'],
    architectureAnchor: 'systems.html#architecture-dual-host',
  },
  {
    slug: 'hindai',
    repoName: null,
    title: 'HindAI — Grounded Philosophy Assistant',
    tagline: 'Show RAG, don’t claim RAG.',
    demoUrl: null,
    repoUrl: null,
    blogId: 'google-io-2026-developer-insights',
    blogHref: 'index.html#blog-read-google-io-2026-developer-insights',
    videoUrl: 'https://www.youtube.com/@mangeshraut71298',
    videoLabel: 'AI project demos',
    metrics: [
      { label: 'Base model', value: 'Gemma' },
      { label: 'Retrieval', value: 'Grounded RAG' },
      { label: 'Citations', value: 'Per answer' },
      { label: 'Safety', value: 'Bounded scope' },
    ],
    problem:
      'General chatbots hallucinate on niche cultural and philosophical corpora. Users need grounded answers with traceable sources, not confident-sounding fiction.',
    whyExistingFail:
      'Raw LLM prompts lack retrieval boundaries; generic RAG stacks ignore tone, safety, and citation UX for sensitive knowledge domains.',
    approach:
      'Gemma LLM + curated Indian philosophy corpus, retrieval with source snippets, response templates that surface citations, and explicit scope limits on sensitive topics.',
    tradeoffs:
      'Smaller open models reduce cost and latency but need tighter retrieval; breadth is traded for depth and trust in a focused domain.',
    results: [
      'Conversational UX for exploring Indian knowledge systems',
      'Grounded answers with visible source citations',
      'Gemma-based pipeline suitable for private/low-latency deployment',
      'Informed by hybrid local/cloud AI architecture from production portfolio work',
    ],
    improvements: [
      'Public demo with indexed document count and latency metrics',
      'pgvector-backed corpus with eval set for citation accuracy',
      'Open-source retrieval + eval harness repository',
    ],
    stack: ['Gemma', 'Python', 'RAG', 'FastAPI', 'Vector search'],
    architectureAnchor: 'systems.html#architecture-assistme',
  },
  {
    slug: 'ces-energy',
    repoName: 'ces-ltd.com',
    title: 'CES Energy Analytics Platform',
    tagline: 'Measurable impact at enterprise scale.',
    demoUrl: 'https://ces-ltd-com.vercel.app/',
    repoUrl: 'https://github.com/mangeshraut712/ces-ltd.com',
    blogId: null,
    blogHref: 'index.html#experience',
    videoUrl: null,
    videoLabel: null,
    metrics: [
      { label: 'Dashboard latency', value: '-40%' },
      { label: 'Deploy speed', value: '+35%' },
      { label: 'ML forecast accuracy', value: '+25%' },
      { label: 'Stack', value: 'Java/AWS' },
    ],
    problem:
      'Energy operators need fast dashboards and reliable forecasts, but legacy monoliths and slow deploy cycles blocked iteration on analytics features.',
    whyExistingFail:
      'Thick clients with unoptimized APIs, manual deployments, and ML models without feature engineering discipline could not keep pace with operator needs.',
    approach:
      'Java Spring Boot REST APIs with query optimization, AngularJS dashboards, AWS Lambda/EC2 + Terraform IaC, Dockerized Jenkins CI/CD, Python LSTM forecasting with TensorFlow.',
    tradeoffs:
      'Continued AngularJS reduced rewrite risk but constrained component modernization; cloud orchestration added ops complexity for 35% deploy gains.',
    results: [
      '40% reduction in dashboard data rendering latency via REST optimization',
      '35% faster deployments through Dockerized Jenkins + Terraform IaC',
      '25% improvement in demand forecast accuracy with LSTM + feature engineering',
      'Marketing redesign concept (Next.js + Three.js) for public-facing energy intelligence story',
    ],
    improvements: [
      'Gradual frontend migration path off legacy AngularJS',
      'Real-time streaming layer for operator alerts',
      'Unified observability across Java + Python services',
    ],
    stack: ['Java Spring Boot', 'AngularJS', 'AWS', 'Terraform', 'TensorFlow', 'Next.js'],
    architectureAnchor: 'systems.html#architecture-build',
  },
  {
    slug: 'assistme-va',
    repoName: 'AssistMe-VirtualAssistant',
    title: 'AssistMe Virtual Assistant',
    tagline: 'Multi-modal AI assistant — voice, research, and tool use.',
    demoUrl: 'https://assist-me-virtual-assistant.vercel.app/',
    repoUrl: 'https://github.com/mangeshraut712/AssistMe-VirtualAssistant',
    blogId: null,
    blogHref: 'case-studies/portfolio.html',
    videoUrl: 'https://www.youtube.com/@mangeshraut71298',
    videoLabel: 'Demo channel',
    metrics: [
      { label: 'Modalities', value: 'Voice + text' },
      { label: 'Backend', value: 'FastAPI' },
      { label: 'Frontend', value: 'React' },
      { label: 'Deploy', value: 'Vercel' },
    ],
    problem:
      'Users want an assistant that researches, speaks, and acts — not a single chat box with no tools or voice path.',
    whyExistingFail:
      'Most tutorials stop at prompt wrappers; they skip voice UX, tool routing, streaming, and deployable full-stack boundaries.',
    approach:
      'React + Vite frontend with voice mode, FastAPI backend for research tools, streaming responses, and Vercel deployment with clear API separation.',
    tradeoffs:
      'Voice adds latency and browser permission friction; tool breadth is capped to keep reliability high on consumer hardware.',
    results: [
      'Live demo on Vercel with React + FastAPI split',
      'Voice mode and research-tool pathways in one product surface',
      'Foundation patterns reused in production portfolio AssistMe stack',
    ],
    improvements: [
      'WebMCP tool registration for browser-native agent compatibility',
      'Unified model router (portfolio + OpenRouter) across both apps',
      'Automated eval suite for tool-call success rate',
    ],
    stack: ['React', 'FastAPI', 'Python', 'Vite', 'Tailwind', 'Vercel'],
    architectureAnchor: 'systems.html#architecture-assistme',
  },
  {
    slug: 'bug-tracker',
    repoName: 'Bug-Reporting-System',
    title: 'Bug Reporting System',
    tagline: 'Full-stack product engineering — not a tutorial CRUD app.',
    demoUrl: 'https://bug-reporting-system-psi.vercel.app/',
    repoUrl: 'https://github.com/mangeshraut712/Bug-Reporting-System',
    blogId: null,
    blogHref: 'index.html#projects',
    videoUrl: null,
    videoLabel: null,
    metrics: [
      { label: 'API', value: 'Django REST' },
      { label: 'DB', value: 'PostgreSQL' },
      { label: 'UI', value: 'React' },
      { label: 'Ops', value: 'Docker' },
    ],
    problem:
      'Engineering teams need a lightweight bug tracker with role-aware workflows, not spreadsheets or heavyweight enterprise tools.',
    whyExistingFail:
      'Spreadsheets lack status workflows; Jira is heavy for small teams; tutorial apps skip auth, Docker, and production schema design.',
    approach:
      'Django REST Framework API with PostgreSQL, React UI, Dockerized services, and deployment to Vercel for demo accessibility.',
    tradeoffs:
      'Chose proven Django admin patterns over microservices — faster delivery, simpler ops for portfolio scale.',
    results: [
      'Live demo with create/update/status workflows',
      'Docker-compose local dev matching production-shaped services',
      'Clear separation between API models and React presentation layer',
    ],
    improvements: [
      'Realtime notifications via WebSockets',
      'GitHub issue sync for OSS teams',
      'Case-study video walkthrough',
    ],
    stack: ['Django', 'DRF', 'PostgreSQL', 'React', 'Docker'],
    architectureAnchor: 'systems.html#architecture-build',
  },
];

const caseStudyBySlug = Object.fromEntries(caseStudies.map(cs => [cs.slug, cs]));
const caseStudyByRepo = Object.fromEntries(
  caseStudies.filter(cs => cs.repoName).map(cs => [cs.repoName, cs])
);

export function getCaseStudyBySlug(slug) {
  return caseStudyBySlug[slug] || null;
}

export function getCaseStudyByRepo(repoName) {
  return caseStudyByRepo[repoName] || null;
}

export function getCaseStudyPageHref(slug) {
  return `case-studies/${slug}.html`;
}

export function normalizeExternalUrl(raw) {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https?:\/\//i.test(value)) return null;
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function sanitizeArchitectureHref(raw) {
  const fallback = 'systems.html#architecture';
  if (!raw) return fallback;
  const value = String(raw).trim();
  if (!/^systems\.html#[a-z0-9-]+$/i.test(value)) return fallback;
  return value;
}

export function getCaseStudyEvidenceLinks(cs) {
  if (!cs) return [];
  return [
    { label: 'Repo', href: normalizeExternalUrl(cs.repoUrl) },
    { label: 'Demo', href: normalizeExternalUrl(cs.demoUrl) },
    { label: 'Architecture', href: sanitizeArchitectureHref(cs.architectureAnchor) },
    { label: 'Story', href: cs.slug ? getCaseStudyPageHref(cs.slug) : null },
  ];
}

export function renderEvidenceRowHtml(items, ariaLabel) {
  const renderLink = (label, href) => {
    if (!href) {
      return `<span class="project-evidence-link is-unavailable" aria-disabled="true">${escapeHtml(label)}</span>`;
    }
    const external = /^https?:\/\//i.test(href);
    return `<a class="project-evidence-link" href="${escapeHtml(href)}"${
      external ? ' target="_blank" rel="noopener noreferrer"' : ''
    }>${escapeHtml(label)}</a>`;
  };
  return `<div class="project-evidence-row" role="navigation" aria-label="${escapeHtml(ariaLabel)}">
    ${items.map(item => renderLink(item.label, item.href)).join('')}
  </div>`;
}

export function renderCaseStudyEvidenceRow(cs) {
  return renderEvidenceRowHtml(
    getCaseStudyEvidenceLinks(cs),
    `Project evidence for ${cs?.title || 'case study'}`
  );
}

export function renderRepoEvidenceRow(repo) {
  const links = getProjectEvidenceLinks(repo);
  const items = [
    { label: 'Repo', href: links.repo },
    { label: 'Demo', href: links.demo },
    { label: 'Architecture', href: links.architecture },
    { label: 'Story', href: links.story },
  ];
  return renderEvidenceRowHtml(items, `Project evidence for ${repo?.name || 'repository'}`);
}

export function getProjectEvidenceLinks(repo) {
  const name = repo?.name || '';
  const cs = getCaseStudyByRepo(name);
  const repoUrl = normalizeExternalUrl(repo?.html_url);
  const demoUrl = normalizeExternalUrl(repo?.homepage);

  if (!cs) {
    return {
      repo: repoUrl,
      demo: demoUrl,
      architecture: 'systems.html#architecture',
      story: null,
    };
  }

  const [repoLink, demoLink, archLink, storyLink] = getCaseStudyEvidenceLinks(cs);
  return {
    repo: repoLink.href || repoUrl,
    demo: demoLink.href || demoUrl,
    architecture: archLink.href,
    story: storyLink.href,
    blog: cs.blogHref || null,
    video: cs.videoUrl || null,
  };
}

/** @deprecated use caseStudies[0] */
export const portfolioCaseStudy = caseStudies[0];
