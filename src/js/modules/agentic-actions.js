export class AgenticActionHandler {
  constructor() {
    ((this.actions = new Map()), (this.actionHistory = []), this.registerActions());
  }
  registerActions() {
    (this.registerAction('navigate', {
      patterns: [
        /(?:go to|show|open|navigate to|take me to)\s+(?:the\s+)?(\w+)(?:\s+section)?/i,
        /(?:show|view)\s+(?:my|your|the)?\s*(\w+)/i,
      ],
      handler: this.navigateToSection.bind(this),
      description: 'Navigate to a specific section of the portfolio',
    }),
      this.registerAction('download_resume', {
        patterns: [
          /download\s+(?:my|your|the)?\s*(?:resume|cv)/i,
          /(?:get|send|show)\s+(?:me\s+)?(?:your|the)?\s*(?:resume|cv)/i,
        ],
        handler: this.downloadResume.bind(this),
        description: 'Download the resume/CV',
      }),
      this.registerAction('schedule_meeting', {
        patterns: [
          /schedule\s+(?:a\s+)?meeting/i,
          /book\s+(?:a\s+)?(?:meeting|appointment|call)/i,
          /(?:set up|arrange)\s+(?:a\s+)?(?:meeting|call)/i,
          /(?:meet|talk|discuss)\s+with\s+(?:you|mangesh)/i,
        ],
        handler: this.scheduleMeeting.bind(this),
        description: 'Schedule a meeting with Mangesh',
      }),
      this.registerAction('send_message', {
        patterns: [
          /send\s+(?:a\s+)?(?:message|email)/i,
          /contact\s+(?:you|mangesh)/i,
          /(?:get in touch|reach out)/i,
        ],
        handler: this.openContactForm.bind(this),
        description: 'Open contact form to send a message',
      }),
      this.registerAction('copy_contact', {
        patterns: [
          /copy\s+(?:your|the)?\s*(?:email|phone|contact)/i,
          /(?:what's|what is)\s+(?:your|the)?\s*(?:email|phone|contact)/i,
        ],
        handler: this.copyContactInfo.bind(this),
        description: 'Copy contact information to clipboard',
      }),
      this.registerAction('search', {
        patterns: [/search\s+(?:for\s+)?(.+)/i, /find\s+(.+)/i, /look\s+(?:for|up)\s+(.+)/i],
        handler: this.performSearch.bind(this),
        description: 'Search the portfolio for specific content',
      }),
      this.registerAction('filter_projects', {
        patterns: [
          /show\s+(?:me\s+)?(?:projects?\s+)?(?:using|with|in)\s+(.+)/i,
          /(?:filter|find)\s+projects?\s+(?:by|with)\s+(.+)/i,
        ],
        handler: this.filterProjects.bind(this),
        description: 'Filter projects by technology or keyword',
      }),
      this.registerAction('open_social', {
        patterns: [
          /(?:open|show|go to)\s+(?:your|the)?\s*(github|linkedin|twitter)/i,
          /(?:view|see)\s+(?:your|the)?\s*(github|linkedin|twitter)/i,
        ],
        handler: this.openSocialMedia.bind(this),
        description: 'Open social media profiles',
      }),
      this.registerAction('show_availability', {
        patterns: [
          /(?:show|check|view)\s+(?:your|the)?\s*(?:availability|calendar|schedule)/i,
          /when\s+(?:are you|is\s+\w+)\s+(?:available|free)/i,
        ],
        handler: this.showAvailability.bind(this),
        description: 'Show calendar availability',
      }),
      this.registerAction('toggle_theme', {
        patterns: [
          /(?:toggle|switch|change)\s+(?:to\s+)?(?:dark|light)\s+(?:mode|theme)/i,
          /(?:enable|turn on)\s+(?:dark|light)\s+mode/i,
        ],
        handler: this.toggleTheme.bind(this),
        description: 'Toggle between dark and light theme',
      }));
  }
  registerAction(e, t) {
    this.actions.set(e, t);
  }
  async detectAndExecute(e) {
    const t = e.trim();
    for (const [e, n] of this.actions)
      for (const s of n.patterns) {
        const o = t.match(s);
        if (o) {
          console.log(`🎯 Action detected: ${e}`);
          try {
            const s = await n.handler(o);
            return (
              this.logAction(e, t, s),
              {
                actionDetected: !0,
                actionName: e,
                result: s,
                message: s.message || `Action "${e}" executed successfully`,
              }
            );
          } catch (t) {
            return (
              console.error(`Error executing action ${e}:`, t),
              {
                actionDetected: !0,
                actionName: e,
                error: t.message,
                message: `Failed to execute action: ${t.message}`,
              }
            );
          }
        }
      }
    return { actionDetected: !1 };
  }
  async navigateToSection(e) {
    const t = e[1].toLowerCase(),
      n =
        {
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
        }[t] || `#${t}`,
      s = document.querySelector(n);
    return s
      ? (s.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        (s.style.transition = 'all 0.3s ease'),
        (s.style.transform = 'scale(1.02)'),
        setTimeout(() => {
          s.style.transform = 'scale(1)';
        }, 300),
        { success: !0, message: `✅ Navigated to ${t} section`, action: 'navigate', target: t })
      : {
          success: !1,
          message: `❌ Section "${t}" not found. Try: home, about, skills, projects, contact`,
          action: 'navigate',
        };
  }
  async downloadResume(e) {
    const t = [
      '/assets/files/Mangesh_Raut_Resume.pdf',
      '/api/resume',
      'assets/files/Mangesh_Raut_Resume.pdf',
      '../assets/files/Mangesh_Raut_Resume.pdf',
    ];
    let n = !1;
    for (const e of t)
      try {
        if ((await fetch(e, { method: 'HEAD' })).ok) {
          const t = document.createElement('a');
          return (
            (t.href = e),
            (t.download = 'Mangesh_Raut_Resume.pdf'),
            (t.target = '_blank'),
            document.body.appendChild(t),
            t.click(),
            document.body.removeChild(t),
            (n = !0),
            {
              success: !0,
              message: '✅ Resume download initiated! Check your downloads folder.',
              action: 'download_resume',
              file: e,
            }
          );
        }
      } catch (t) {
        console.log(`Failed to fetch from ${e}:`, t);
        continue;
      }
    if (!n)
      return {
        success: !1,
        message:
          '📄 Resume PDF not found. Please:\n\n1. Click the "Download Resume" button on the homepage\n2. Email mbr63@drexel.edu to request a copy\n3. View the online portfolio at https://mangeshraut.pro',
        action: 'download_resume',
        alternative: { email: 'mbr63@drexel.edu', website: 'https://mangeshraut.pro' },
      };
  }
  async scheduleMeeting(e) {
    const t = document.querySelector('#contact');
    t && t.scrollIntoView({ behavior: 'smooth' });
    const n = document.querySelector('#calendar-container');
    return (
      n && (n.scrollIntoView({ behavior: 'smooth' }), (n.style.animation = 'pulse 0.5s ease')),
      this.showMeetingScheduler(),
      {
        success: !0,
        message:
          '📅 Opening calendar to schedule a meeting. Please select a date and time, or email mbr63@drexel.edu directly.',
        action: 'schedule_meeting',
      }
    );
  }
  async openContactForm(e) {
    const t = document.querySelector('#contact');
    return t
      ? (t.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        setTimeout(() => {
          const e = document.querySelector('#contact-name, input[name="name"]');
          e && (e.focus(), (e.style.animation = 'pulse 0.5s ease'));
        }, 500),
        {
          success: !0,
          message: '✉️ Contact form opened! Fill in your details to send a message.',
          action: 'open_contact',
        })
      : { success: !1, message: '❌ Contact form not found', action: 'open_contact' };
  }
  async copyContactInfo(e) {
    const t = {
        email: 'mbr63@drexel.edu',
        linkedin: 'linkedin.com/in/mangeshraut71298',
        github: 'github.com/mangeshraut712',
      },
      n = `Email: ${t.email}\nLinkedIn: ${t.linkedin}\nGitHub: ${t.github}`;
    try {
      return (
        await navigator.clipboard.writeText(n),
        {
          success: !0,
          message: '✅ Contact information copied to clipboard!\n\n' + n,
          action: 'copy_contact',
          data: t,
        }
      );
    } catch {
      return {
        success: !1,
        message: "❌ Failed to copy. Here's the info:\n\n" + n,
        action: 'copy_contact',
        data: t,
      };
    }
  }
  async performSearch(e) {
    const t = e[1],
      n = document.querySelector('#search-overlay'),
      s = document.querySelector('#search-input');
    return n && s
      ? (n.classList.add('active'),
        (s.value = t),
        s.focus(),
        s.dispatchEvent(new Event('input', { bubbles: !0 })),
        { success: !0, message: `🔍 Searching for "${t}"...`, action: 'search', query: t })
      : { success: !1, message: '❌ Search functionality not available', action: 'search' };
  }
  async filterProjects(e) {
    const t = e[1],
      n = document.querySelector('#projects');
    return n
      ? (n.scrollIntoView({ behavior: 'smooth' }),
        setTimeout(() => {
          const e = document.querySelectorAll('.project-card, [class*="project"]');
          (e.forEach(e => {
            const n = e.textContent.toLowerCase(),
              s = t.toLowerCase();
            n.includes(s)
              ? ((e.style.display = 'block'), (e.style.animation = 'fadeIn 0.5s ease'))
              : (e.style.opacity = '0.3');
          }),
            setTimeout(() => {
              e.forEach(e => {
                ((e.style.display = 'block'), (e.style.opacity = '1'));
              });
            }, 5e3));
        }, 500),
        {
          success: !0,
          message: `🔍 Filtering projects by "${t}"...`,
          action: 'filter_projects',
          technology: t,
        })
      : { success: !1, message: '❌ Projects section not found', action: 'filter_projects' };
  }
  async openSocialMedia(e) {
    const t = e[1].toLowerCase(),
      n = {
        github: 'https://github.com/mangeshraut712',
        linkedin: 'https://linkedin.com/in/mangeshraut71298',
        twitter: 'https://twitter.com/mangeshraut712',
      }[t];
    return n
      ? (window.open(n, '_blank'),
        {
          success: !0,
          message: `✅ Opening ${t.charAt(0).toUpperCase() + t.slice(1)}...`,
          action: 'open_social',
          platform: t,
          url: n,
        })
      : {
          success: !1,
          message: `❌ Social media platform "${t}" not found`,
          action: 'open_social',
        };
  }
  async showAvailability(e) {
    const t = document.querySelector('#calendar-container');
    return t
      ? (t.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        (t.style.animation = 'pulse 0.5s ease'),
        {
          success: !0,
          message:
            "📅 Here's the calendar showing availability. Green dates indicate available slots.",
          action: 'show_availability',
        })
      : {
          success: !0,
          message:
            '📅 Generally available for meetings weekdays 9 AM - 5 PM EST. Email mbr63@drexel.edu to schedule.',
          action: 'show_availability',
        };
  }
  async toggleTheme(e) {
    const t = document.querySelector('#theme-toggle');
    if (t) {
      t.click();
      const e = document.documentElement.classList.contains('dark');
      return {
        success: !0,
        message: `✅ Switched to ${e ? 'dark' : 'light'} mode`,
        action: 'toggle_theme',
        theme: e ? 'dark' : 'light',
      };
    }
    return { success: !1, message: '❌ Theme toggle not available', action: 'toggle_theme' };
  }
  showMeetingScheduler() {
    const e = document.createElement('div');
    ((e.className = 'meeting-scheduler-modal'),
      (e.innerHTML =
        '\n            <div class="modal-overlay" style="\n                position: fixed;\n                top: 0;\n                left: 0;\n                right: 0;\n                bottom: 0;\n                background: rgba(0, 0, 0, 0.5);\n                backdrop-filter: blur(10px);\n                display: flex;\n                align-items: center;\n                justify-content: center;\n                z-index: 10000;\n                animation: fadeIn 0.3s ease;\n            ">\n                <div class="modal-content" style="\n                    background: white;\n                    padding: 2rem;\n                    border-radius: 16px;\n                    max-width: 500px;\n                    width: 90%;\n                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);\n                ">\n                    <h3 style="margin: 0 0 1rem 0; color: #1d1d1f;">📅 Schedule a Meeting</h3>\n                    <p style="color: #666; margin-bottom: 1.5rem;">\n                        To schedule a meeting with Mangesh, please email:\n                    </p>\n                    <div style="\n                        background: #f5f5f7;\n                        padding: 1rem;\n                        border-radius: 8px;\n                        margin-bottom: 1.5rem;\n                        font-family: monospace;\n                    ">\n                        mbr63@drexel.edu\n                    </div>\n                    <p style="color: #666; font-size: 0.9rem; margin-bottom: 1.5rem;">\n                        Available: Weekdays 9 AM - 5 PM EST\n                    </p>\n                    <button onclick="this.closest(\'.meeting-scheduler-modal\').remove()" style="\n                        background: #007aff;\n                        color: white;\n                        border: none;\n                        padding: 0.75rem 1.5rem;\n                        border-radius: 8px;\n                        cursor: pointer;\n                        font-size: 1rem;\n                        width: 100%;\n                    ">\n                        Got it!\n                    </button>\n                </div>\n            </div>\n        '),
      document.body.appendChild(e),
      e.querySelector('.modal-overlay').addEventListener('click', t => {
        t.target === t.currentTarget && e.remove();
      }),
      setTimeout(() => {
        e.parentNode && e.remove();
      }, 1e4));
  }
  generateResumeData() {
    return '\nMANGESH RAUT\nSoftware Engineer\n\nEmail: mbr63@drexel.edu\nLinkedIn: linkedin.com/in/mangeshraut71298\nGitHub: github.com/mangeshraut712\n\nSUMMARY\nExperienced Software Engineer specializing in Java Spring Boot, AngularJS, AWS, \nand machine learning. Passionate about building scalable applications and solving \ncomplex technical challenges.\n\nSKILLS\n- Languages: Java, JavaScript, Python, TypeScript\n- Frameworks: Spring Boot, Angular, React\n- Cloud: AWS, Azure, Vercel\n- Databases: PostgreSQL, MongoDB, MySQL\n- Tools: Git, Docker, Jenkins\n\nFor full resume, please visit the portfolio website or contact via email.\n        '.trim();
  }
  logAction(e, t, n) {
    (this.actionHistory.push({
      timestamp: new Date(),
      action: e,
      input: t,
      result: n,
      success: n.success,
    }),
      this.actionHistory.length > 50 && this.actionHistory.shift());
  }
  getActionHistory() {
    return this.actionHistory;
  }
  getAvailableActions() {
    return Array.from(this.actions.entries()).map(([e, t]) => ({
      name: e,
      description: t.description,
    }));
  }
}
export const agenticActions = new AgenticActionHandler();
