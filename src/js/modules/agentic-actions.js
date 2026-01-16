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

export class AgenticActionHandler {
    constructor() {
        this.actions = new Map();
        this.actionHistory = [];
        this.registerActions();
    }

    /**
     * Register all available actions
     */
    registerActions() {
        // Navigation actions
        this.registerAction('navigate', {
            patterns: [
                /(?:go to|show|open|navigate to|take me to)\s+(?:the\s+)?(\w+)(?:\s+section)?/i,
                /(?:show|view)\s+(?:my|your|the)?\s*(\w+)/i
            ],
            handler: this.navigateToSection.bind(this),
            description: 'Navigate to a specific section of the portfolio'
        });

        // Download actions
        this.registerAction('download_resume', {
            patterns: [
                /download\s+(?:my|your|the)?\s*(?:resume|cv)/i,
                /(?:get|send|show)\s+(?:me\s+)?(?:your|the)?\s*(?:resume|cv)/i
            ],
            handler: this.downloadResume.bind(this),
            description: 'Download the resume/CV'
        });

        // Meeting scheduling
        this.registerAction('schedule_meeting', {
            patterns: [
                /schedule\s+(?:a\s+)?meeting/i,
                /book\s+(?:a\s+)?(?:meeting|appointment|call)/i,
                /(?:set up|arrange)\s+(?:a\s+)?(?:meeting|call)/i,
                /(?:meet|talk|discuss)\s+with\s+(?:you|mangesh)/i
            ],
            handler: this.scheduleMeeting.bind(this),
            description: 'Schedule a meeting with Mangesh'
        });

        // Contact actions
        this.registerAction('send_message', {
            patterns: [
                /send\s+(?:a\s+)?(?:message|email)/i,
                /contact\s+(?:you|mangesh)/i,
                /(?:get in touch|reach out)/i
            ],
            handler: this.openContactForm.bind(this),
            description: 'Open contact form to send a message'
        });

        // Copy contact info
        this.registerAction('copy_contact', {
            patterns: [
                /copy\s+(?:your|the)?\s*(?:email|phone|contact)/i,
                /(?:what's|what is)\s+(?:your|the)?\s*(?:email|phone|contact)/i
            ],
            handler: this.copyContactInfo.bind(this),
            description: 'Copy contact information to clipboard'
        });

        // Search actions
        this.registerAction('search', {
            patterns: [
                /search\s+(?:for\s+)?(.+)/i,
                /find\s+(.+)/i,
                /look\s+(?:for|up)\s+(.+)/i
            ],
            handler: this.performSearch.bind(this),
            description: 'Search the portfolio for specific content'
        });

        // Project filtering
        this.registerAction('filter_projects', {
            patterns: [
                /show\s+(?:me\s+)?(?:projects?\s+)?(?:using|with|in)\s+(.+)/i,
                /(?:filter|find)\s+projects?\s+(?:by|with)\s+(.+)/i
            ],
            handler: this.filterProjects.bind(this),
            description: 'Filter projects by technology or keyword'
        });

        // Social media actions
        this.registerAction('open_social', {
            patterns: [
                /(?:open|show|go to)\s+(?:your|the)?\s*(github|linkedin|twitter)/i,
                /(?:view|see)\s+(?:your|the)?\s*(github|linkedin|twitter)/i
            ],
            handler: this.openSocialMedia.bind(this),
            description: 'Open social media profiles'
        });

        // Calendar actions
        this.registerAction('show_availability', {
            patterns: [
                /(?:show|check|view)\s+(?:your|the)?\s*(?:availability|calendar|schedule)/i,
                /when\s+(?:are you|is\s+\w+)\s+(?:available|free)/i
            ],
            handler: this.showAvailability.bind(this),
            description: 'Show calendar availability'
        });

        // Theme toggle
        this.registerAction('toggle_theme', {
            patterns: [
                /(?:toggle|switch|change)\s+(?:to\s+)?(?:dark|light)\s+(?:mode|theme)/i,
                /(?:enable|turn on)\s+(?:dark|light)\s+mode/i
            ],
            handler: this.toggleTheme.bind(this),
            description: 'Toggle between dark and light theme'
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

        for (const [actionName, config] of this.actions) {
            for (const pattern of config.patterns) {
                const match = input.match(pattern);
                if (match) {
                    console.log(`🎯 Action detected: ${actionName}`);

                    try {
                        const result = await config.handler(match);
                        this.logAction(actionName, input, result);
                        return {
                            actionDetected: true,
                            actionName,
                            result,
                            message: result.message || `Action "${actionName}" executed successfully`
                        };
                    } catch (error) {
                        console.error(`Error executing action ${actionName}:`, error);
                        return {
                            actionDetected: true,
                            actionName,
                            error: error.message,
                            message: `Failed to execute action: ${error.message}`
                        };
                    }
                }
            }
        }

        return { actionDetected: false };
    }

    /**
     * Action Handlers
     */

    async navigateToSection(match) {
        const section = match[1].toLowerCase();
        const sectionMap = {
            'home': '#home',
            'about': '#about',
            'skills': '#skills',
            'experience': '#experience',
            'projects': '#projects',
            'education': '#education',
            'publications': '#publications',
            'awards': '#awards',
            'certifications': '#certifications',
            'blog': '#blog',
            'contact': '#contact',
            'game': '#debug-runner-section'
        };

        const target = sectionMap[section] || `#${section}`;

        // Smooth scroll to section
        const element = document.querySelector(target);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Add highlight effect
            element.style.transition = 'all 0.3s ease';
            element.style.transform = 'scale(1.02)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 300);

            return {
                success: true,
                message: `✅ Navigated to ${section} section`,
                action: 'navigate',
                target: section
            };
        } else {
            return {
                success: false,
                message: `❌ Section "${section}" not found. Try: home, about, skills, projects, contact`,
                action: 'navigate'
            };
        }
    }

    async downloadResume(_match) {
        // Correct resume file paths in the project
        const resumeLinks = [
            '/assets/files/Mangesh_Raut_Resume.pdf',  // Primary location
            '/api/resume',  // API endpoint
            'assets/files/Mangesh_Raut_Resume.pdf',  // Relative path
            '../assets/files/Mangesh_Raut_Resume.pdf'  // Parent relative
        ];

        // Try each path
        let resumeFound = false;
        for (const link of resumeLinks) {
            try {
                const response = await fetch(link, { method: 'HEAD' });
                if (response.ok) {
                    // Open in new tab for download
                    const downloadLink = document.createElement('a');
                    downloadLink.href = link;
                    downloadLink.download = 'Mangesh_Raut_Resume.pdf';
                    downloadLink.target = '_blank';
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);

                    resumeFound = true;

                    return {
                        success: true,
                        message: '✅ Resume download initiated! Check your downloads folder.',
                        action: 'download_resume',
                        file: link
                    };
                }
            } catch (error) {
                console.log(`Failed to fetch from ${link}:`, error);
                continue;
            }
        }

        // If no PDF found, provide alternative
        if (!resumeFound) {
            return {
                success: false,
                message: '📄 Resume PDF not found. Please:\n\n1. Click the "Download Resume" button on the homepage\n2. Email mbr63@drexel.edu to request a copy\n3. View the online portfolio at https://mangeshraut.pro',
                action: 'download_resume',
                alternative: {
                    email: 'mbr63@drexel.edu',
                    website: 'https://mangeshraut.pro'
                }
            };
        }
    }

    async scheduleMeeting(_match) {
        // Navigate to contact section and open calendar
        const contactSection = document.querySelector('#contact');
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
        }

        // Show calendar widget if available
        const calendarContainer = document.querySelector('#calendar-container');
        if (calendarContainer) {
            calendarContainer.scrollIntoView({ behavior: 'smooth' });
            calendarContainer.style.animation = 'pulse 0.5s ease';
        }

        // Create a meeting scheduling interface
        this.showMeetingScheduler();

        return {
            success: true,
            message: '📅 Opening calendar to schedule a meeting. Please select a date and time, or email mbr63@drexel.edu directly.',
            action: 'schedule_meeting'
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
                action: 'open_contact'
            };
        }

        return {
            success: false,
            message: '❌ Contact form not found',
            action: 'open_contact'
        };
    }

    async copyContactInfo(_match) {
        const contactInfo = {
            email: 'mbr63@drexel.edu',
            linkedin: 'linkedin.com/in/mangeshraut71298',
            github: 'github.com/mangeshraut712'
        };

        const text = `Email: ${contactInfo.email}\nLinkedIn: ${contactInfo.linkedin}\nGitHub: ${contactInfo.github}`;

        try {
            await navigator.clipboard.writeText(text);
            return {
                success: true,
                message: '✅ Contact information copied to clipboard!\n\n' + text,
                action: 'copy_contact',
                data: contactInfo
            };
        } catch {
            return {
                success: false,
                message: '❌ Failed to copy. Here\'s the info:\n\n' + text,
                action: 'copy_contact',
                data: contactInfo
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
                query
            };
        }

        return {
            success: false,
            message: `❌ Search functionality not available`,
            action: 'search'
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
                        card.style.display = 'block';
                        card.style.animation = 'fadeIn 0.5s ease';
                    } else {
                        card.style.opacity = '0.3';
                    }
                });

                // Reset after 5 seconds
                setTimeout(() => {
                    projectCards.forEach(card => {
                        card.style.display = 'block';
                        card.style.opacity = '1';
                    });
                }, 5000);
            }, 500);

            return {
                success: true,
                message: `🔍 Filtering projects by "${technology}"...`,
                action: 'filter_projects',
                technology
            };
        }

        return {
            success: false,
            message: '❌ Projects section not found',
            action: 'filter_projects'
        };
    }

    async openSocialMedia(match) {
        const platform = match[1].toLowerCase();
        const socialLinks = {
            github: 'https://github.com/mangeshraut712',
            linkedin: 'https://linkedin.com/in/mangeshraut71298',
            twitter: 'https://twitter.com/mangeshraut712'
        };

        const url = socialLinks[platform];
        if (url) {
            window.open(url, '_blank');
            return {
                success: true,
                message: `✅ Opening ${platform.charAt(0).toUpperCase() + platform.slice(1)}...`,
                action: 'open_social',
                platform,
                url
            };
        }

        return {
            success: false,
            message: `❌ Social media platform "${platform}" not found`,
            action: 'open_social'
        };
    }

    async showAvailability(_match) {
        // Navigate to calendar
        const calendarSection = document.querySelector('#calendar-container');
        if (calendarSection) {
            calendarSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            calendarSection.style.animation = 'pulse 0.5s ease';

            return {
                success: true,
                message: '📅 Here\'s the calendar showing availability. Green dates indicate available slots.',
                action: 'show_availability'
            };
        }

        return {
            success: true,
            message: '📅 Generally available for meetings weekdays 9 AM - 5 PM EST. Email mbr63@drexel.edu to schedule.',
            action: 'show_availability'
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
                theme: isDark ? 'dark' : 'light'
            };
        }

        return {
            success: false,
            message: '❌ Theme toggle not available',
            action: 'toggle_theme'
        };
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
        modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
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
            success: result.success
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
            description: config.description
        }));
    }
}

// Export singleton instance
export const agenticActions = new AgenticActionHandler();
