// Entry point for static analysis tools to build the dependency graph.
// Do not load this file in index.html, it is only for code review and dependency detection.

import './core/bootstrap.js';
import './core/chat.js';
import './core/config.js';
import './data/media-data.js';
import './data/travel-engine.js';
import './data/travel-locations.js';

import './modules/about-interactivity.js';
import './modules/accessibility.js';
import './modules/card-content-accessibility.js';
import './modules/agentic-actions.js';
import './modules/hero-flyout-position.js';
import './modules/analytics.js';
import './modules/vibe-stack.js';
import './modules/apple-sounds.js';
import './modules/avatar-toggle.js';
import './modules/birthday-celebration.js';
import './modules/blog-data.js';
import './modules/blog-loader.js';
import './modules/calendar.js';
import './modules/chatbot.js';
import './modules/currently.js';
import './modules/debug-runner.js';
import './modules/external-config.js';
import './modules/github-contributions-graph.js';
import './modules/github-projects.js';
import './modules/lastfm.js';
import './modules/name-pronounce.js';
import './modules/overlay.js';
import './modules/portfolio-feature-upgrades.js';
import './modules/premium-enhancements.js';
import './modules/privacy-dashboard.js';
import './modules/project-xr.js';
import './modules/projects-showcase.js';
import './modules/real-media-loader.js';
import './modules/scroll-animations.js';
import './modules/section-preview.js';
import './modules/search.js';
import './modules/share-widget.js';
import './modules/skills-visualization.js';
import './modules/travel-atlas.js';
import './modules/vercel-analytics.js';

import './services/AnalyticsService.js';
import './services/MarkdownService.js';
import './services/StreamingService.js';
import './services/RealtimeVoiceService.js';
// VoiceService retained for window.voiceService events; RealtimeVoiceService is primary STT/TTS.
import './services/VoiceService.js';
import './chatbot/index.js';

import './utils/calendly.js';
import './utils/go-to-top.js';
import './utils/smart-navbar.js';
import './utils/theme.js';
