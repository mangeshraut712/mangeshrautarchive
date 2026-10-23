# Product Requirements Document (PRD)

> **Product**: Mangesh Raut Personal Portfolio & Agentic AI Assistant (`mangeshrautarchive`)  
> **Status**: Production / Actively Maintained  
> **Canonical Production Host**: [mangeshraut712.github.io/mangeshrautarchive](https://mangeshraut712.github.io/mangeshrautarchive/)  
> **Author**: Mangesh Raut

---

## 1. Executive Summary & Vision

`mangeshrautarchive` is a high-performance, full-stack portfolio website and interactive AI assistant built entirely on native web standards (zero client-side UI framework runtimes). It serves as both a comprehensive engineering archive and a live showcase of modern software engineering, Apple Human Interface Guidelines (HIG) visual design, and autonomous AI systems.

The portfolio pairs a client-side interface (HTML5, vanilla CSS with custom design tokens, native JavaScript ES modules) with an edge-proxied AI chatbot (**AssistMe**) powered by Cloudflare Workers, FastAPI, and OpenRouter, supporting streaming responses, multimodal attachments, and WebMCP agentic browser actions.

---

## 2. Target Personas & User Stories

### Persona A: Engineering Leaders, Hiring Managers & Technical Recruiters

- **Goals**: Rapidly evaluate Mangesh's technical capabilities, system architecture thinking, full-stack breadth (Java, Python, AWS, TypeScript/ESM, Distributed Systems), academic background at Drexel University, and industry experience.
- **Key Needs**:
  - Direct access to verified project repositories, case studies, and engineering publications.
  - Interactive System Monitor to verify real production telemetry and code quality.
  - Instant résumé viewing, export, and calendar booking integration.

### Persona B: Developers, Architects & AI Engineers

- **Goals**: Inspect the codebase, architectural choices, and agentic workflows.
- **Key Needs**:
  - Transparency into multi-model AI routing, token usage, and latency.
  - Zero-runtime framework performance (inspecting how pure vanilla ESM achieves 100/100/100/100 Lighthouse scores).
  - WebMCP agentic tools demonstrating in-browser assistant control.

### Persona C: Collaborators & Interactive Visitors

- **Goals**: Converse with the assistant, schedule meetings, explore the travel atlas, and read technical articles.
- **Key Needs**:
  - AssistMe chat responsiveness with draft recovery, audio/video/image/PDF uploads, and streaming markdown.
  - Interactive world clocks and Panchang calendar data.
  - Seamless navigation across light, dark, and high-contrast display modes.

---

## 3. Core Functional Requirements

### 3.1 AssistMe Interactive Assistant

- **Multimodal Chat**: Streaming conversation supporting code syntax highlighting, KaTeX math rendering, and multi-file attachments (images up to 1.2 MB, audio/video/PDF up to 3 MB, text/markdown up to 75 KB).
- **Edge Routing**: Primary live text routing through Cloudflare Workers using OpenRouter (`nvidia/nemotron-3-ultra-550b-a55b:free` primary with fallback chains).
- **WebMCP Agentic Actions**: Assistant can programmatically navigate pages, surface projects, open contact forms, and inspect system vitals through registered client-side tools.
- **In-Widget Privacy & Settings**: Apple HIG-compliant grouped inset view embedded within the chatbot for managing session memory, integrations (GitHub, Calendar), and GDPR data clearing.

### 3.2 Showcase & Editorial Surfaces

- **Projects Showcase**: Dynamically filtered repository cards with real README screenshots, conceptual illustrations, star counts, and direct links.
- **Technical Writings (Blog)**: 18 deep-dive articles (2 per month, Jan–Sep 2026) with verified provenance, publisher credits, and RSS/Atom discovery feeds.
- **Systems & Case Studies**: Detailed architecture blueprints, sequence diagrams, and engineering decision logs.
- **System Monitor**: Live operational telemetry, API latency probes, rate limiting status, and deployment integrity verification.
- **Travel Atlas**: Interactive geographic map with responsive route views and location stories.
- **Uses**: Hardware, development tools, terminal configurations, and AI pair-programming stack.

### 3.3 Contact, Clocks & Calendar

- **Outreach**: Direct messaging with validation, client-side draft preservation, and rate limiting.
- **World Clocks**: Live analog and digital clocks for New York, London, Mumbai, Tokyo, Sydney, and Paris with IANA timezone DST awareness.
- **Calendar & Panchang**: Verified daily Kalnirnay Panchang ingestion and local `.ics` calendar export.

---

## 4. Non-Functional Requirements & Performance Floors

- **Lighthouse Score Floor**: 100/100/100/100 across Performance, Accessibility, Best Practices, and SEO on production dist homepage.
- **Visual Design**: Strict adherence to Apple Human Interface Guidelines (`#0071e3` Apple Blue, specular shine animation, `#ff3b30` circular close buttons, authentic glassmorphism).
- **Zero Horizontal Overflow**: 100% responsive across viewports from 375px mobile to 1440px+ ultra-wide.
- **Touch Ergonomics**: All interactive elements and touch targets must meet the minimum size requirement of ≥44 × 44px.
- **Security & Privacy**: Zero exposed API keys, strict CORS validation, server-side secret management, and defense against prompt injection / traversal.

---

## 5. Non-Goals & Anti-Requirements

- **No Framework Runtimes**: Absolutely no React, Next.js, Vue, Angular, or Svelte in the client bundle.
- **No Tailwind Classes in Markup**: Tailwind CSS is used strictly at build-time to output utility styles; HTML markup must use clean semantic classes and vanilla CSS properties.
- **No Client-Side Secrets**: Never expose OpenRouter, GitHub PAT, or OAuth secrets to the browser.
- **No Fabricated Benchmarks**: Model benchmarks, reasoning modes, and token counts must only be cited when verified.
