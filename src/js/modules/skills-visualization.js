/**
 * Skills Visualization Module
 * Interactive skill cards with proficiency levels and categories
 * 2025 Portfolio Enhancement
 */

class SkillsVisualization {
  constructor() {
    this.skills = {
      'Programming Languages': [
        { name: 'Python', level: 95, icon: 'fab fa-python', color: '#3776AB' },
        { name: 'JavaScript', level: 90, icon: 'fab fa-js', color: '#F7DF1E' },
        { name: 'TypeScript', level: 85, icon: 'fab fa-js-square', color: '#3178C6' },
        { name: 'Java', level: 90, icon: 'fab fa-java', color: '#007396' },
        { name: 'C/C++', level: 80, icon: 'fas fa-code', color: '#00599C' },
        { name: 'Swift', level: 75, icon: 'fab fa-swift', color: '#FA7343' },
        { name: 'SQL', level: 85, icon: 'fas fa-database', color: '#4479A1' }
      ],
      'Frontend Development': [
        { name: 'React', level: 88, icon: 'fab fa-react', color: '#61DAFB' },
        { name: 'Next.js', level: 85, icon: 'fas fa-layer-group', color: '#000000' },
        { name: 'Angular', level: 80, icon: 'fab fa-angular', color: '#DD0031' },
        { name: 'HTML5/CSS3', level: 95, icon: 'fab fa-html5', color: '#E34F26' },
        { name: 'Tailwind CSS', level: 90, icon: 'fas fa-palette', color: '#06B6D4' },
        { name: 'Redux', level: 82, icon: 'fas fa-store', color: '#764ABC' }
      ],
      'Backend & Databases': [
        { name: 'Node.js', level: 88, icon: 'fab fa-node-js', color: '#339933' },
        { name: 'Spring Boot', level: 85, icon: 'fas fa-leaf', color: '#6DB33F' },
        { name: 'Django', level: 80, icon: 'fas fa-server', color: '#092E20' },
        { name: 'MongoDB', level: 85, icon: 'fas fa-database', color: '#47A248' },
        { name: 'PostgreSQL', level: 82, icon: 'fas fa-database', color: '#4169E1' },
        { name: 'MySQL', level: 88, icon: 'fas fa-database', color: '#4479A1' },
        { name: 'Redis', level: 78, icon: 'fas fa-bolt', color: '#DC382D' }
      ],
      'Cloud & DevOps': [
        { name: 'AWS', level: 85, icon: 'fab fa-aws', color: '#FF9900' },
        { name: 'Docker', level: 82, icon: 'fab fa-docker', color: '#2496ED' },
        { name: 'Kubernetes', level: 75, icon: 'fas fa-dharmachakra', color: '#326CE5' },
        { name: 'Jenkins', level: 80, icon: 'fas fa-cogs', color: '#D24939' },
        { name: 'Terraform', level: 78, icon: 'fas fa-cloud', color: '#7B42BC' },
        { name: 'Git/GitHub', level: 92, icon: 'fab fa-github', color: '#181717' }
      ],
      'AI & Machine Learning': [
        { name: 'TensorFlow', level: 82, icon: 'fas fa-brain', color: '#FF6F00' },
        { name: 'PyTorch', level: 80, icon: 'fas fa-fire', color: '#EE4C2C' },
        { name: 'Scikit-learn', level: 85, icon: 'fas fa-chart-line', color: '#F7931E' },
        { name: 'OpenCV', level: 78, icon: 'fas fa-eye', color: '#5C3EE8' },
        { name: 'NLP', level: 75, icon: 'fas fa-language', color: '#4285F4' },
        { name: 'LLMs', level: 80, icon: 'fas fa-robot', color: '#00A67E' }
      ],
      'Tools & Others': [
        { name: 'VS Code', level: 95, icon: 'fas fa-code', color: '#007ACC' },
        { name: 'Postman', level: 88, icon: 'fas fa-paper-plane', color: '#FF6C37' },
        { name: 'Figma', level: 75, icon: 'fab fa-figma', color: '#F24E1E' },
        { name: 'Jira', level: 82, icon: 'fab fa-jira', color: '#0052CC' },
        { name: 'Agile/Scrum', level: 85, icon: 'fas fa-tasks', color: '#0078D4' },
        { name: 'REST APIs', level: 90, icon: 'fas fa-exchange-alt', color: '#009688' }
      ]
    };
  }

  /**
   * Create skill card HTML - Compact Version
   */
  createSkillCard(skill, index) {
    const percentage = skill.level;
    const delay = index * 30; // Faster stagger

    return `
      <div class="skill-card group compact-card" data-animate="zoom-in" data-animate-delay="${delay}">
        <div class="flex items-center gap-3">
            <div class="skill-icon text-xl" style="color: ${skill.color}">
              <i class="${skill.icon}"></i>
            </div>
            <div class="flex-1">
                <div class="flex justify-between items-center mb-1">
                    <span class="skill-name font-medium text-sm">${skill.name}</span>
                    <span class="skill-percentage text-xs font-bold opacity-70" style="color: ${skill.color}">${percentage}%</span>
                </div>
                <div class="skill-bar-container h-1.5">
                    <div class="skill-bar" style="width: ${percentage}%; background: ${skill.color}"></div>
                </div>
            </div>
        </div>
      </div>
    `;
  }

  /**
   * Create category section - Compact Grid
   */
  createCategorySection(category, skills, categoryIndex) {
    const skillsHTML = skills.map((skill, index) => this.createSkillCard(skill, index)).join('');

    return `
      <div class="skill-category mb-8" data-animate="fade-up" data-animate-delay="${categoryIndex * 80}">
        <h3 class="text-lg font-bold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
          <span class="text-primary">${category}</span>
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          ${skillsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Render skills visualization
   */
  render(containerId = 'skills-container') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }

    const categoriesHTML = Object.entries(this.skills)
      .map(([category, skills], index) => this.createCategorySection(category, skills, index))
      .join('');

    container.innerHTML = categoriesHTML;

    // Add CSS styles
    this.injectStyles();

    // Trigger animations if available
    if (window.initAnimations) {
      setTimeout(() => window.initAnimations(), 100);
    }
  }

  /**
   * Inject CSS styles
   */
  injectStyles() {
    if (document.getElementById('skills-visualization-styles')) return;

    const styles = `
      <style id="skills-visualization-styles">
        .skill-card {
          padding: 1rem;
          background: var(--color-bg-primary);
          border-radius: 0.75rem;
          border: 1px solid rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }

        html.dark .skill-card {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .skill-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border-color: var(--color-accent);
        }

        html.dark .skill-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .skill-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: rgba(0,0,0,0.03);
          transition: transform 0.3s ease;
        }
        
        html.dark .skill-icon {
           background: rgba(255,255,255,0.05);
        }

        .skill-card:hover .skill-icon {
          transform: scale(1.1);
        }

        .skill-bar-container {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 999px;
          overflow: hidden;
        }

        html.dark .skill-bar-container {
          background: rgba(255, 255, 255, 0.08);
        }

        .skill-bar {
          height: 100%;
          border-radius: 999px;
          transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  /**
   * Get skill statistics
   */
  getStats() {
    const allSkills = Object.values(this.skills).flat();
    const totalSkills = allSkills.length;
    const avgProficiency = Math.round(
      allSkills.reduce((sum, skill) => sum + skill.level, 0) / totalSkills
    );
    const expertSkills = allSkills.filter(skill => skill.level >= 85).length;

    return {
      totalSkills,
      avgProficiency,
      expertSkills,
      categories: Object.keys(this.skills).length
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkillsVisualization;
}

// Make available globally
window.SkillsVisualization = SkillsVisualization;
