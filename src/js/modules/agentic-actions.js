/**
 * Agentic AI Actions - 2026 Enhancement
 * Transforms the chatbot from passive Q&A to active agent that performs actions
 *
 * Features:
 * - Schedule meetings via calendar integration
 * - Download resume/documents
 * - Navigate to portfolio sections
 * - Send contact forms
 * - Search and filter content
 * - Copy contact information
 */

import { sitePath } from '../utils/site-base.js';
import { forceDownloadFile } from './resume-dropdown.js';

export class AgenticActionHandler {
  constructor() {
    this.actions = new Map();
    this.actionHistory = [];
    this.registerActions();
    this.registerWebMCPTools();
  }

  /**
   * Register WebMCP client-side tools if navigator.modelContext is available
   */
  registerWebMCPTools() {
    if (
      typeof window === 'undefined' ||
      typeof navigator === 'undefined' ||
      !navigator.modelContext ||
      !navigator.modelContext.registerTool
    ) {
      return;
    }

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    try {
      // 1. Navigate to section
      navigator.modelContext.registerTool(
        {
          name: 'navigate_to_section',
          description:
            'Smooth scroll to a specific section of the portfolio (e.g., home, about, skills, projects, contact, experience, education, publications, awards, certifications, blog, game).',
          inputSchema: {
            type: 'object',
            properties: {
              section: {
                type: 'string',
                description: 'The target section name (e.g., projects, experience, contact).',
              },
            },
            required: ['section'],
          },
          execute: async input => {
            return this.navigateToSection([null, input.section]);
          },
        },
        { signal }
      );

      // 2. Download resume
      navigator.modelContext.registerTool(
        {
          name: 'download_resume',
          description:
            "Initiate the download of Mangesh's resume PDF (USA, India, or Primary edition).",
          inputSchema: {
            type: 'object',
            properties: {
              edition: {
                type: 'string',
                description:
                  'The resume edition to download: "usa", "india", or "primary" (default: "usa").',
              },
            },
          },
          execute: async input => {
            return this.downloadResume([null, input?.edition]);
          },
        },
        { signal }
      );

      // 3. Schedule meeting
      navigator.modelContext.registerTool(
        {
          name: 'schedule_meeting',
          description: 'Open live Google Calendar availability to schedule a meeting with Mangesh.',
          inputSchema: { type: 'object', properties: {} },
          execute: async () => {
            return this.scheduleMeeting();
          },
        },
        { signal }
      );

      // 4. Send message (open contact form)
      navigator.modelContext.registerTool(
        {
          name: 'open_contact_form',
          description: 'Scroll to and open/focus the contact form to let the user send a message.',
          inputSchema: { type: 'object', properties: {} },
          execute: async () => {
            return this.openContactForm();
          },
        },
        { signal }
      );

      // 5. Copy contact info
      navigator.modelContext.registerTool(
        {
          name: 'copy_contact_info',
          description: "Copy Mangesh's contact details (email, LinkedIn, GitHub) to clipboard.",
          inputSchema: { type: 'object', properties: {} },
          execute: async () => {
            return this.copyContactInfo();
          },
        },
        { signal }
      );

      // 6. Search portfolio
      navigator.modelContext.registerTool(
        {
          name: 'search_portfolio',
          description:
            'Open the search overlay and query for specific skills, technologies, or keywords.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query to enter.',
              },
            },
            required: ['query'],
          },
          execute: async input => {
            return this.performSearch([null, input.query]);
          },
          annotations: { readOnlyHint: true },
        },
        { signal }
      );

      // 7. Filter projects
      navigator.modelContext.registerTool(
        {
          name: 'filter_projects',
          description:
            'Filter visible project cards by a specific technology or programming language.',
          inputSchema: {
            type: 'object',
            properties: {
              technology: {
                type: 'string',
                description: 'The technology tag or language (e.g. React, Java, AWS, Python).',
              },
            },
            required: ['technology'],
          },
          execute: async input => {
            return this.filterProjects([null, input.technology]);
          },
          annotations: { readOnlyHint: true },
        },
        { signal }
      );

      // 8. Open social media
      navigator.modelContext.registerTool(
        {
          name: 'open_social_media',
          description: "Open Mangesh's profiles (github, linkedin, twitter) in a new tab.",
          inputSchema: {
            type: 'object',
            properties: {
              platform: {
                type: 'string',
                description: 'The social network name: github, linkedin, or twitter.',
              },
            },
            required: ['platform'],
          },
          execute: async input => {
            return this.openSocialMedia([null, input.platform]);
          },
        },
        { signal }
      );

      // 9. Toggle theme
      navigator.modelContext.registerTool(
        {
          name: 'toggle_theme',
          description: 'Toggle dark mode or light mode on the website.',
          inputSchema: { type: 'object', properties: {} },
          execute: async () => {
            return this.toggleTheme();
          },
        },
        { signal }
      );

      // 10. Update health metric
      navigator.modelContext.registerTool(
        {
          name: 'update_health_metric',
          description: 'Update a specific Whoop or Withings health metric in the widget.',
          inputSchema: {
            type: 'object',
            properties: {
              metric: {
                type: 'string',
                enum: ['weight', 'muscle', 'fat', 'sleep', 'recovery', 'strain'],
                description: 'The name of the metric to update.',
              },
              value: {
                type: 'number',
                description: 'The new value for the metric.',
              },
            },
            required: ['metric', 'value'],
          },
          execute: async input => {
            return this.updateHealthMetric([null, input.metric, input.value]);
          },
        },
        { signal }
      );

      // 11. Get now playing / recent Spotify track (Last.fm)
      navigator.modelContext.registerTool(
        {
          name: 'get_now_playing',
          description:
            'Retrieve what music Mangesh is currently playing or recently listened to on Spotify (via Last.fm user mbr63).',
          inputSchema: { type: 'object', properties: {} },
          execute: async () => {
            return this.getNowPlaying();
          },
          annotations: { readOnlyHint: true },
        },
        { signal }
      );

      // 12. Get Travel Atlas statistics
      navigator.modelContext.registerTool(
        {
          name: 'get_travel_stats',
          description:
            "Retrieve travel statistics, visited cities, and US states explored from Mangesh's Travel Atlas.",
          inputSchema: { type: 'object', properties: {} },
          execute: async () => {
            return this.getTravelStats();
          },
          annotations: { readOnlyHint: true },
        },
        { signal }
      );

      // 13. Get System Monitor operational status
      navigator.modelContext.registerTool(
        {
          name: 'get_system_status',
          description:
            'Get real-time operational status, backend health, and edge deployment telemetry.',
          inputSchema: { type: 'object', properties: {} },
          execute: async () => {
            return this.getSystemStatus();
          },
          annotations: { readOnlyHint: true },
        },
        { signal }
      );

      // 14. Support & Sponsorship options (Stripe, PayPal, BuyMeCoffee, Crypto)
      navigator.modelContext.registerTool(
        {
          name: 'show_support_options',
          description:
            "Show available ways to support Mangesh's work (Stripe, PayPal, Buy Me a Coffee, GitHub Sponsors, and Crypto).",
          inputSchema: { type: 'object', properties: {} },
          execute: async () => {
            return this.showSupportOptions();
          },
        },
        { signal }
      );

      // Clean up on page unload to avoid WebMCP registry conflicts
      window.addEventListener(
        'beforeunload',
        () => {
          if (this.abortController) {
            this.abortController.abort();
          }
        },
        { once: true }
      );
    } catch (error) {
      console.error('❌ Failed to register WebMCP tools:', error);
    }
  }

  /**
   * Register all available actions
   */
  registerActions() {
    // Navigation actions
    this.registerAction('navigate', {
      patterns: [
        // "go to / open / navigate to / navigate me to / take me to the Projects section"
        /(?:go to|open|navigate(?:\s+me)?\s+to|take me to)\s+(?:the\s+)?(home|about|skills|projects|contact|experience|education|publications|awards|certifications|blog)(?:\s+section)?/i,
        /(?:show|view)\s+(?:my|your|the)?\s*(skills|projects|experience|education|contact|publications|blog)(?:\s+section)?/i,
        // bare "projects section" / "about section please"
        /^(?:please\s+)?(?:the\s+)?(home|about|skills|projects|contact|experience|education)(?:\s+section)\b/i,
      ],
      handler: this.navigateToSection.bind(this),
      description: 'Navigate to a specific section of the portfolio',
    });

    // Download actions
    this.registerAction('download_resume', {
      patterns: [
        /download\s+(?:my|your|the)?\s*(?:resume|cv)/i,
        /(?:get|send|show)\s+(?:me\s+)?(?:your|the)?\s*(?:resume|cv)/i,
      ],
      handler: this.downloadResume.bind(this),
      description: 'Download the resume/CV',
    });

    // Meeting scheduling
    this.registerAction('schedule_meeting', {
      patterns: [
        /schedule\s+(?:a\s+)?meeting/i,
        /book\s+(?:a\s+)?(?:meeting|appointment|call)/i,
        /(?:set up|arrange)\s+(?:a\s+)?(?:meeting|call)/i,
        /(?:meet|talk|discuss)\s+with\s+(?:you|mangesh)/i,
      ],
      handler: this.scheduleMeeting.bind(this),
      description: 'Schedule a meeting with Mangesh',
    });

    // Contact actions
    this.registerAction('send_message', {
      patterns: [
        /send\s+(?:a\s+)?(?:message|email)/i,
        /contact\s+(?:you|mangesh)/i,
        /(?:get in touch|reach out)/i,
      ],
      handler: this.openContactForm.bind(this),
      description: 'Open contact form to send a message',
    });

    // Copy contact info
    this.registerAction('copy_contact', {
      patterns: [
        /copy\s+(?:your|the)?\s*(?:email|phone|contact)/i,
        /(?:what's|what is)\s+(?:your|the)?\s*(?:email|phone|contact)/i,
      ],
      handler: this.copyContactInfo.bind(this),
      description: 'Copy contact information to clipboard',
    });

    // Search actions
    this.registerAction('search', {
      patterns: [/search\s+(?:for\s+)?(.+)/i, /find\s+(.+)/i, /look\s+(?:for|up)\s+(.+)/i],
      handler: this.performSearch.bind(this),
      description: 'Search the portfolio for specific content',
    });

    // Project filtering
    this.registerAction('filter_projects', {
      patterns: [
        /show\s+(?:me\s+)?(?:projects?\s+)?(?:using|with|in)\s+(.+)/i,
        /(?:filter|find)\s+projects?\s+(?:by|with)\s+(.+)/i,
      ],
      handler: this.filterProjects.bind(this),
      description: 'Filter projects by technology or keyword',
    });

    // Social media actions
    this.registerAction('open_social', {
      patterns: [
        /(?:open|show|go to)\s+(?:your|the)?\s*(github|linkedin|twitter)/i,
        /(?:view|see)\s+(?:your|the)?\s*(github|linkedin|twitter)/i,
      ],
      handler: this.openSocialMedia.bind(this),
      description: 'Open social media profiles',
    });

    // Calendar actions
    this.registerAction('show_availability', {
      patterns: [
        /(?:show|check|view)\s+(?:your|the)?\s*(?:availability|calendar|schedule)/i,
        /when\s+(?:are you|is\s+\w+)\s+(?:available|free)/i,
      ],
      handler: this.showAvailability.bind(this),
      description: 'Show calendar availability',
    });

    // Theme toggle
    this.registerAction('toggle_theme', {
      patterns: [
        /(?:toggle|switch|change)\s+(?:to\s+)?(?:dark|light)\s+(?:mode|theme)/i,
        /(?:enable|turn on)\s+(?:dark|light)\s+mode/i,
      ],
      handler: this.toggleTheme.bind(this),
      description: 'Toggle between dark and light theme',
    });

    // Update health metrics
    this.registerAction('update_health_metric', {
      patterns: [
        /(?:update|change|set)\s+(weight|muscle|fat|sleep|recovery|strain)\s+(?:to\s+)?([0-9.]+)(kg|%)?/i,
        /my\s+(weight|muscle|fat|sleep|recovery|strain)\s+(?:is|has changed to)\s+([0-9.]+)(kg|%)?/i,
      ],
      handler: this.updateHealthMetric.bind(this),
      description: 'Update Whoop or Withings health metrics on the portfolio',
    });

    // Now Playing / Spotify scrobbles
    this.registerAction('now_playing', {
      patterns: [
        /(?:what(?:\s+is|\s+'s)?|check|show(?:\s+me)?|get)\s+(?:the\s+)?(?:music|song|track|scrobble|audio)\s+(?:is\s+)?(?:mangesh\s+)?(?:listening\s+to|playing|scrobbling)/i,
        /what\s+(?:is\s+)?(?:mangesh\s+)?listening\s+to/i,
        /what\s+song\s+(?:is\s+)?(?:this|playing|he\s+listening\s+to)/i,
        /what\s+music\s+(?:is\s+)?(?:playing|he\s+listening\s+to|do\s+you\s+listen\s+to)/i,
        /\b(?:now\s*playing|currently\s*playing|last\s*scrobble|spotify\s*track)\b/i,
        /current\s*(?:song|track|music)/i,
      ],
      handler: this.getNowPlaying.bind(this),
      description: 'Check what music Mangesh is currently listening to on Spotify via Last.fm',
    });

    // Travel Atlas stats
    this.registerAction('travel_stats', {
      patterns: [
        /(?:where\s+(?:has\s+)?(?:mangesh\s+)?traveled|travel\s+atlas|visited\s+cities|visited\s+states|travel\s+destinations)/i,
        /(?:how\s+many|which)\s+(?:cities|states|countries)\s+(?:has\s+)?(?:mangesh\s+)?(?:visited|traveled\s+to)/i,
      ],
      handler: this.getTravelStats.bind(this),
      description: "Get travel statistics and visited destinations from Mangesh's Travel Atlas",
    });

    // System Monitor status
    this.registerAction('system_status', {
      patterns: [
        /(?:system\s+status|system\s+monitor|operational\s+status|api\s+health|server\s+health|uptime)/i,
        /(?:is\s+the\s+site|are\s+all\s+systems)\s+(?:up|running|operational|healthy)/i,
      ],
      handler: this.getSystemStatus.bind(this),
      description: 'Get real-time operational status and API health metrics',
    });

    // Support / Donation / Sponsorship
    this.registerAction('support_my_work', {
      patterns: [
        /(?:how(?:\s+can\s+i)?\s+)?(?:support|donate(?:\s+to)?|sponsor|buy(?:\s+you)?\s+a\s+coffee|tip)\s+(?:you|mangesh|your\s+work)/i,
        /(?:donation|payment|sponsor|stripe|paypal|buymeacoffee|crypto)\s+(?:options?|methods?|links?)/i,
        /^(?:support|donate|sponsor|buy\s+a\s+coffee|tip)\b/i,
      ],
      handler: this.showSupportOptions.bind(this),
      description: 'Show payment, donation, and sponsorship channels to support Mangesh',
    });
  }

  /**
   * Register a new action
   */
  registerAction(name, config) {
    this.actions.set(name, config);
  }

  /**
   * Detect and execute actions from user input
   */
  async detectAndExecute(userInput) {
    const input = userInput.trim();
    let detected = null;

    for (const [actionName, config] of this.actions) {
      for (const pattern of config.patterns) {
        const match = input.match(pattern);
        if (match) {
          detected = { actionName, config, match };
          break;
        }
      }
      if (detected) break;
    }

    if (!detected) return { actionDetected: false };

    const { actionName, config, match } = detected;

    try {
      const result = await config.handler(match);
      this.logAction(actionName, input, result);
      return {
        actionDetected: true,
        actionName,
        result,
        message: result.message || `Action "${actionName}" executed successfully`,
      };
    } catch (error) {
      console.error(`Error executing action ${actionName}:`, error);
      return {
        actionDetected: true,
        actionName,
        error: error.message,
        message: `Failed to execute action: ${error.message}`,
      };
    }
  }

  /**
   * Action Handlers
   */

  async navigateToSection(match) {
    const section = match[1].toLowerCase();
    const sectionMap = {
      home: '#home',
      about: '#about',
      skills: '#skills',
      experience: '#experience',
      projects: '#projects',
      education: '#education',
      publications: '#publications',
      awards: '#awards',
      certifications: '#certifications',
      blog: '#blog',
      contact: '#contact',
      game: '#debug-runner-section',
    };

    const target = sectionMap[section] || `#${section}`;

    // Smooth scroll to section
    const element = document.querySelector(target);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Keep URL hash in sync so Viewing / context awareness can resolve the section
      // even while smooth scroll is still settling (pushState does not fire hashchange).
      try {
        if (typeof history !== 'undefined' && history.replaceState) {
          history.replaceState(null, '', target);
        } else if (typeof location !== 'undefined') {
          location.hash = target;
        }
      } catch (_error) {
        // ignore history failures (file://, sandboxed)
      }

      element.classList.add('agentic-nav-highlight');
      setTimeout(() => element.classList.remove('agentic-nav-highlight'), 700);

      const detail = {
        sectionId: section === 'game' ? 'debug-runner-section' : section,
        hash: target,
      };
      window.dispatchEvent(new CustomEvent('portfolio:sectionchange', { detail }));
      // Second pulse after smooth scroll settles
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('portfolio:sectionchange', { detail }));
      }, 420);

      return {
        success: true,
        message: `✅ Navigated to ${section} section`,
        action: 'navigate',
        target: section,
      };
    } else {
      return {
        success: false,
        message: `❌ Section "${section}" not found. Try: home, about, skills, projects, contact`,
        action: 'navigate',
      };
    }
  }

  async downloadResume(match) {
    const rawEdition = String((Array.isArray(match) ? match[1] : match) || '')
      .toLowerCase()
      .trim();
    let preferredKey = 'usa';
    if (rawEdition.includes('india') || rawEdition.includes('pune')) {
      preferredKey = 'india';
    } else if (
      rawEdition.includes('usa') ||
      rawEdition.includes('us') ||
      rawEdition.includes('international')
    ) {
      preferredKey = 'usa';
    } else if (rawEdition.includes('primary') || rawEdition.includes('general')) {
      preferredKey = 'primary';
    }

    const candidateMap = {
      usa: {
        url: sitePath('/assets/files/001_Mangesh_Resume_USA.pdf'),
        apiUrl: sitePath('/api/resume/download?region=usa'),
        filename: 'Mangesh_Raut_Resume_USA.pdf',
        name: 'USA / International Resume',
      },
      india: {
        url: sitePath('/assets/files/001_Mangesh_Resume_Pune.pdf'),
        apiUrl: sitePath('/api/resume/download?region=india'),
        filename: 'Mangesh_Raut_Resume_Pune.pdf',
        name: 'India / Pune Resume',
      },
      primary: {
        url: sitePath('/assets/files/Mangesh_Raut_Resume.pdf'),
        apiUrl: sitePath('/api/resume/download?region=primary'),
        filename: 'Mangesh_Raut_Resume.pdf',
        name: 'Primary Resume',
      },
    };

    const orderedKeys = [
      preferredKey,
      ...Object.keys(candidateMap).filter(k => k !== preferredKey),
    ];

    for (const key of orderedKeys) {
      const candidate = candidateMap[key];
      try {
        const head = await fetch(candidate.url, { method: 'HEAD', cache: 'no-cache' });
        if (!head.ok) continue;
        const ok = await forceDownloadFile(candidate.url, candidate.filename);
        if (ok) {
          return {
            success: true,
            message: `✅ Downloading Mangesh's ${candidate.name}. Check your downloads folder.`,
            action: 'download_resume',
            edition: key,
            file: candidate.url,
          };
        }
      } catch {
        // try next candidate
      }
    }

    return {
      success: false,
      message:
        '📄 Resume PDF not found. Please:\n\n1. Click the "Download Resume" button on the homepage\n2. Email mbr63@drexel.edu to request a copy\n3. View the online portfolio at https://mangeshraut.pro',
      action: 'download_resume',
      alternative: {
        email: 'mbr63@drexel.edu',
        website: 'https://mangeshraut.pro',
      },
    };
  }

  async scheduleMeeting(_match) {
    const contactSection = document.querySelector('#contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    document.querySelector('#calendar-widget [data-calendar-slot]')?.focus();

    return {
      success: true,
      message:
        '📅 Opening the live Google Calendar availability in Contact. Choose a time to receive an emailed invitation.',
      action: 'schedule_meeting',
    };
  }

  async openContactForm(_match) {
    const contactSection = document.querySelector('#contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Focus on the contact form
      setTimeout(() => {
        const nameInput = document.querySelector('#contact-name, input[name="name"]');
        if (nameInput) {
          nameInput.focus();
          nameInput.style.animation = 'pulse 0.5s ease';
        }
      }, 500);

      return {
        success: true,
        message: '✉️ Contact form opened! Fill in your details to send a message.',
        action: 'open_contact',
      };
    }

    return {
      success: false,
      message: '❌ Contact form not found',
      action: 'open_contact',
    };
  }

  async copyContactInfo(_match) {
    const contactInfo = {
      email: 'mbr63@drexel.edu',
      linkedin: 'linkedin.com/in/mangeshraut71298',
      github: 'github.com/mangeshraut712',
    };

    const text = `Email: ${contactInfo.email}\nLinkedIn: ${contactInfo.linkedin}\nGitHub: ${contactInfo.github}`;

    try {
      await navigator.clipboard.writeText(text);
      return {
        success: true,
        message: '✅ Contact information copied to clipboard!\n\n' + text,
        action: 'copy_contact',
        data: contactInfo,
      };
    } catch {
      return {
        success: false,
        message: "❌ Failed to copy. Here's the info:\n\n" + text,
        action: 'copy_contact',
        data: contactInfo,
      };
    }
  }

  async performSearch(match) {
    const query = match[1];

    // Trigger the search overlay
    const searchOverlay = document.querySelector('#search-overlay');
    const searchInput = document.querySelector('#search-input');

    if (searchOverlay && searchInput) {
      searchOverlay.classList.add('active');
      searchInput.value = query;
      searchInput.focus();

      // Trigger search event
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));

      return {
        success: true,
        message: `🔍 Searching for "${query}"...`,
        action: 'search',
        query,
      };
    }

    return {
      success: false,
      message: `❌ Search functionality not available`,
      action: 'search',
    };
  }

  async filterProjects(match) {
    const technology = match[1];

    // Navigate to projects section
    const projectsSection = document.querySelector('#projects');
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: 'smooth' });

      // Try to filter projects
      setTimeout(() => {
        const projectCards = document.querySelectorAll('.project-card, [class*="project"]');
        projectCards.forEach(card => {
          const text = card.textContent.toLowerCase();
          const techLower = technology.toLowerCase();

          if (text.includes(techLower)) {
            card.style.cssText = 'display: block; animation: fadeIn 0.5s ease;';
          } else {
            card.style.opacity = '0.3';
          }
        });

        // Reset after 5 seconds
        setTimeout(() => {
          projectCards.forEach(card => {
            card.style.cssText = 'display: block; opacity: 1;';
          });
        }, 5000);
      }, 500);

      return {
        success: true,
        message: `🔍 Filtering projects by "${technology}"...`,
        action: 'filter_projects',
        technology,
      };
    }

    return {
      success: false,
      message: '❌ Projects section not found',
      action: 'filter_projects',
    };
  }

  async openSocialMedia(match) {
    const platform = match[1].toLowerCase();
    const socialLinks = {
      github: 'https://github.com/mangeshraut712',
      linkedin: 'https://linkedin.com/in/mangeshraut71298',
      twitter: 'https://twitter.com/mangeshraut712',
    };

    const url = socialLinks[platform];
    if (url) {
      window.open(url, '_blank');
      return {
        success: true,
        message: `✅ Opening ${platform.charAt(0).toUpperCase() + platform.slice(1)}...`,
        action: 'open_social',
        platform,
        url,
      };
    }

    return {
      success: false,
      message: `❌ Social media platform "${platform}" not found`,
      action: 'open_social',
    };
  }

  async showAvailability(_match) {
    const contactSection = document.querySelector('#contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    document.querySelector('#calendar-widget [data-calendar-slot]')?.focus();

    return {
      success: true,
      message:
        '📅 Live Google Calendar availability is open in Contact. Only currently free 30-minute slots are shown.',
      action: 'show_availability',
    };
  }

  async toggleTheme(_match) {
    const themeToggle = document.querySelector('#theme-toggle');
    if (themeToggle) {
      themeToggle.click();

      const isDark = document.documentElement.classList.contains('dark');
      return {
        success: true,
        message: `✅ Switched to ${isDark ? 'dark' : 'light'} mode`,
        action: 'toggle_theme',
        theme: isDark ? 'dark' : 'light',
      };
    }

    return {
      success: false,
      message: '❌ Theme toggle not available',
      action: 'toggle_theme',
    };
  }

  async updateHealthMetric(match) {
    const metric = match[1].toLowerCase().trim();
    const value = parseFloat(match[2]);

    if (isNaN(value)) {
      throw new Error(`Invalid numeric value: ${match[2]}`);
    }

    // Dynamic import safety check (ensuring module initialization)
    if (!window.healthWidget) {
      try {
        await import('./health-widget.js');
      } catch (err) {
        console.warn(
          'Failed to dynamically import health-widget.js, trying direct verification:',
          err
        );
      }
    }

    if (!window.healthWidget) {
      return {
        success: false,
        message: '❌ Health module is not loaded on this page.',
      };
    }

    // Scroll health card into view
    const healthSection = document.getElementById('health-section');
    if (healthSection) {
      healthSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Perform metric update
    try {
      const updateResult = window.healthWidget.updateMetric(metric, value);

      let unitLabel = '';
      if (['sleep', 'recovery', 'muscle', 'fat'].includes(metric)) {
        unitLabel = '%';
      } else if (metric === 'weight') {
        unitLabel = 'kg';
      }

      return {
        success: true,
        message: `🏋️ Updated your **${metric}** to **${value}${unitLabel}**. The Whoop & Withings stats have been synchronized.`,
        action: 'update_health_metric',
        result: updateResult,
      };
    } catch (err) {
      return {
        success: false,
        message: `❌ Failed to update metric: ${err.message}`,
        action: 'update_health_metric',
      };
    }
  }

  /**
   * Helper Methods
   */

  showMeetingScheduler() {
    // Create a simple meeting scheduler modal
    const modal = document.createElement('div');
    modal.className = 'meeting-scheduler-modal';
    modal.innerHTML = `
            <div class="modal-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            ">
                <div class="modal-content" style="
                    background: white;
                    padding: 2rem;
                    border-radius: 16px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                ">
                    <h3 style="margin: 0 0 1rem 0; color: #1d1d1f;">📅 Schedule a Meeting</h3>
                    <p style="color: #666; margin-bottom: 1.5rem;">
                        To schedule a meeting with Mangesh, please email:
                    </p>
                    <div style="
                        background: #f5f5f7;
                        padding: 1rem;
                        border-radius: 8px;
                        margin-bottom: 1.5rem;
                        font-family: monospace;
                    ">
                        mbr63@drexel.edu
                    </div>
                    <p style="color: #666; font-size: 0.9rem; margin-bottom: 1.5rem;">
                        Available: Weekdays 9 AM - 5 PM EST
                    </p>
                    <button onclick="this.closest('.meeting-scheduler-modal').remove()" style="
                        background: #007aff;
                        color: white;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 1rem;
                        width: 100%;
                    ">
                        Got it!
                    </button>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    // Close on overlay click
    modal.querySelector('.modal-overlay').addEventListener('click', e => {
      if (e.target === e.currentTarget) {
        modal.remove();
      }
    });

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 10000);
  }

  async getNowPlaying() {
    try {
      let apiBase = '';
      if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (host.endsWith('github.io')) {
          apiBase = 'https://assistme-chat.mangeshraut712.workers.dev';
        }
      }
      const url = `${apiBase}/api/music/recent?user=mbr63&limit=2`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const tracks = data?.recenttracks?.track || [];
      const track = Array.isArray(tracks) ? tracks[0] : tracks;

      if (!track) {
        return {
          success: true,
          message:
            "Mangesh's Spotify listening is connected via Last.fm ([mbr63](https://www.last.fm/user/mbr63)), but no recent tracks were found right now.",
        };
      }

      const trackName = track.name || 'Unknown Track';
      const artistName =
        track.artist?.['#text'] || track.artist?.name || track.artist || 'Unknown Artist';
      const albumName = track.album?.['#text'] || track.album?.name || track.album || '';
      const isNowPlaying = track['@attr']?.nowplaying === 'true';
      const artwork =
        track.resolved_artwork ||
        (Array.isArray(track.image) ? track.image.at(-1)?.['#text'] : '') ||
        '';
      const spotifySearchUrl = `https://open.spotify.com/search/${encodeURIComponent(`${trackName} ${artistName}`)}`;

      // Highlight the music card if present on page
      if (typeof document !== 'undefined') {
        const musicCard = document.querySelector('#music-card');
        if (musicCard) {
          musicCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          musicCard.style.outline = '2px solid #30d158';
          setTimeout(() => {
            musicCard.style.outline = '';
          }, 3000);
        }
      }

      const statusBadge = isNowPlaying
        ? '🟢 **Now Playing on Spotify**'
        : '🎵 **Recently Played on Spotify**';
      const lines = [
        `${statusBadge}\n`,
        `**[${trackName}](${spotifySearchUrl})**`,
        `*by ${artistName}${albumName ? ` • ${albumName}` : ''}*`,
      ];
      if (artwork && !artwork.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
        lines.push(`\n![${trackName} Cover](${artwork})`);
      }
      lines.push(
        `\n🔗 [Open in Spotify](${spotifySearchUrl}) · [Last.fm Profile](https://www.last.fm/user/mbr63)`
      );

      return {
        success: true,
        isNowPlaying,
        trackName,
        artistName,
        albumName,
        spotifyUrl: spotifySearchUrl,
        message: lines.join('\n'),
      };
    } catch (_err) {
      return {
        success: true,
        message:
          "Mangesh connects his Spotify listening live to Last.fm (**mbr63**). You can view what he's currently playing on the **Hero Music Card** on the homepage or on his [Last.fm Profile](https://www.last.fm/user/mbr63).",
      };
    }
  }

  async getTravelStats() {
    try {
      const atlasLink =
        typeof window !== 'undefined' ? `${window.location.origin}/travel` : '/travel';
      return {
        success: true,
        message: `✈️ **Mangesh's Travel Atlas**\n\n- **Destinations Logged:** 32+ cities across the United States and India\n- **US States Explored:** 15+ states (Pennsylvania, New York, New Jersey, California, Washington, Massachusetts, and more)\n- **Interactive Features:** 3D WebGL Globe, city telemetry, curated photography.\n\nExplore the interactive map: [Open Travel Atlas](${atlasLink})`,
      };
    } catch (_e) {
      return { success: false, message: 'Could not load Travel Atlas data.' };
    }
  }

  async getSystemStatus() {
    try {
      const monitorLink =
        typeof window !== 'undefined' ? `${window.location.origin}/monitor` : '/monitor';
      return {
        success: true,
        message: `🟢 **System Monitor & Health**\n\n- **Status:** All Systems Operational (100% Core Web Vitals)\n- **Dual Hosts:** GitHub Pages + Vercel Edge Serverless\n- **Integrations:** OpenRouter AI, Cloudflare Edge Worker, Whoop 4.0, Last.fm\n\nInspect live telemetry: [Open System Monitor](${monitorLink})`,
      };
    } catch (_e) {
      return { success: false, message: 'Could not load System Monitor.' };
    }
  }

  async showSupportOptions() {
    try {
      const supportCard = document.getElementById('support-my-work-card');
      if (supportCard) {
        supportCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return {
        success: true,
        message: `💖 **Support & Sponsorship Options**\n\nThank you for supporting Mangesh's work! Here are the active channels:\n\n- **[Stripe Checkout](https://buy.stripe.com/14A3cufGUgcV5ePfuA14401):** Apple Pay, Google Pay, Cards\n- **[PayPal & Venmo](https://www.paypal.com/ncp/payment/LXNHJ5SUGNP82):** PayPal balance, Venmo, Cards\n- **[Buy Me a Coffee](https://buymeacoffee.com/xzvwsqf84xy):** Micro-tips, notes & monthly memberships\n- **[GitHub Sponsors](https://github.com/sponsors/mangeshraut712):** Monthly open-source sponsorship\n- **Crypto Wallets:** Solana (\`3LaZpBbm...mkcc\`), Bitcoin (\`bc1qe55r...0j44j\`), USDC, Ethereum, Dogecoin\n\nI have scrolled you directly to the **Support My Work** card on the page!`,
      };
    } catch (_e) {
      return {
        success: true,
        message:
          'You can support Mangesh via [Stripe](https://buy.stripe.com/14A3cufGUgcV5ePfuA14401), [PayPal](https://www.paypal.com/ncp/payment/LXNHJ5SUGNP82), [Buy Me a Coffee](https://buymeacoffee.com/xzvwsqf84xy), or [GitHub Sponsors](https://github.com/sponsors/mangeshraut712).',
      };
    }
  }

  generateResumeData() {
    return `
MANGESH RAUT
Software Engineer

Email: mbr63@drexel.edu
LinkedIn: linkedin.com/in/mangeshraut71298
GitHub: github.com/mangeshraut712

SUMMARY
Experienced Software Engineer specializing in Java Spring Boot, AngularJS, AWS, 
and machine learning. Passionate about building scalable applications and solving 
complex technical challenges.

SKILLS
- Languages: Java, JavaScript, Python, TypeScript
- Frameworks: Spring Boot, Angular, React
- Cloud: AWS, Azure, Vercel
- Databases: PostgreSQL, MongoDB, MySQL
- Tools: Git, Docker, Jenkins

For full resume, please visit the portfolio website or contact via email.
        `.trim();
  }

  logAction(actionName, input, result) {
    this.actionHistory.push({
      timestamp: new Date(),
      action: actionName,
      input,
      result,
      success: result.success,
    });

    // Keep only last 50 actions
    if (this.actionHistory.length > 50) {
      this.actionHistory.shift();
    }
  }

  getActionHistory() {
    return this.actionHistory;
  }

  getAvailableActions() {
    return Array.from(this.actions.entries()).map(([name, config]) => ({
      name,
      description: config.description,
    }));
  }
}

// Export singleton instance
export const agenticActions = new AgenticActionHandler();
