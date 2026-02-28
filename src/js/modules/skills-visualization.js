/**
 * Skills Visualization Module
 * Interactive skill cards with proficiency levels and categories
 * 2026 Portfolio Enhancement
 */

class SkillsVisualization {
  constructor() {
    this.skills = {
      'Programming Languages': [
        { name: 'Python', level: 95, icon: 'fab fa-python', color: '#3776AB' },
        { name: 'JavaScript', level: 90, icon: 'fab fa-js', color: '#F7DF1E' },
        {
          name: 'TypeScript',
          level: 85,
          icon: 'fab fa-js-square',
          color: '#3178C6',
        },
        { name: 'Java', level: 90, icon: 'fab fa-java', color: '#007396' },
        { name: 'C/C++', level: 80, icon: 'fas fa-code', color: '#00599C' },
        { name: 'Swift', level: 75, icon: 'fab fa-swift', color: '#FA7343' },
        { name: 'SQL', level: 85, icon: 'fas fa-database', color: '#4479A1' },
      ],
      'Frontend Development': [
        { name: 'React', level: 88, icon: 'fab fa-react', color: '#61DAFB' },
        {
          name: 'Next.js',
          level: 85,
          icon: 'fas fa-layer-group',
          color: '#000000',
        },
        {
          name: 'Angular',
          level: 80,
          icon: 'fab fa-angular',
          color: '#DD0031',
        },
        {
          name: 'HTML5/CSS3',
          level: 95,
          icon: 'fab fa-html5',
          color: '#E34F26',
        },
        {
          name: 'Tailwind CSS',
          level: 90,
          icon: 'fas fa-palette',
          color: '#06B6D4',
        },
        { name: 'Redux', level: 82, icon: 'fas fa-store', color: '#764ABC' },
      ],
      'Backend & Databases': [
        {
          name: 'Node.js',
          level: 88,
          icon: 'fab fa-node-js',
          color: '#339933',
        },
        {
          name: 'Spring Boot',
          level: 85,
          icon: 'fas fa-leaf',
          color: '#6DB33F',
        },
        { name: 'Django', level: 80, icon: 'fas fa-server', color: '#092E20' },
        {
          name: 'MongoDB',
          level: 85,
          icon: 'fas fa-database',
          color: '#47A248',
        },
        {
          name: 'PostgreSQL',
          level: 82,
          icon: 'fas fa-database',
          color: '#4169E1',
        },
        { name: 'MySQL', level: 88, icon: 'fas fa-database', color: '#4479A1' },
        { name: 'Redis', level: 78, icon: 'fas fa-bolt', color: '#DC382D' },
      ],
      'Cloud & DevOps': [
        { name: 'AWS', level: 85, icon: 'fab fa-aws', color: '#FF9900' },
        { name: 'Docker', level: 82, icon: 'fab fa-docker', color: '#2496ED' },
        {
          name: 'Kubernetes',
          level: 75,
          icon: 'fas fa-dharmachakra',
          color: '#326CE5',
        },
        { name: 'Jenkins', level: 80, icon: 'fas fa-cogs', color: '#D24939' },
        {
          name: 'Terraform',
          level: 78,
          icon: 'fas fa-cloud',
          color: '#7B42BC',
        },
        {
          name: 'Git/GitHub',
          level: 92,
          icon: 'fab fa-github',
          color: '#181717',
        },
      ],
      'AI & Machine Learning': [
        {
          name: 'TensorFlow',
          level: 82,
          icon: 'fas fa-brain',
          color: '#FF6F00',
        },
        { name: 'PyTorch', level: 80, icon: 'fas fa-fire', color: '#EE4C2C' },
        {
          name: 'Scikit-learn',
          level: 85,
          icon: 'fas fa-chart-line',
          color: '#F7931E',
        },
        { name: 'OpenCV', level: 78, icon: 'fas fa-eye', color: '#5C3EE8' },
        { name: 'NLP', level: 75, icon: 'fas fa-language', color: '#4285F4' },
        { name: 'LLMs', level: 80, icon: 'fas fa-robot', color: '#00A67E' },
      ],
      'Tools & Others': [
        { name: 'VS Code', level: 95, icon: 'fas fa-code', color: '#007ACC' },
        {
          name: 'Postman',
          level: 88,
          icon: 'fas fa-paper-plane',
          color: '#FF6C37',
        },
        { name: 'Figma', level: 75, icon: 'fab fa-figma', color: '#F24E1E' },
        { name: 'Jira', level: 82, icon: 'fab fa-jira', color: '#0052CC' },
        {
          name: 'Agile/Scrum',
          level: 85,
          icon: 'fas fa-tasks',
          color: '#0078D4',
        },
        {
          name: 'REST APIs',
          level: 90,
          icon: 'fas fa-exchange-alt',
          color: '#009688',
        },
      ],
    };
  }

  /**
   * Create skill badge HTML - Ultra Compact Version
   */
  createSkillBadge(skill, index) {
    const percentage = skill.level;
    const delay = index * 50; // Stagger animation

    return `
      <div class="skill-badge group" style="animation-delay: ${delay}ms">
        <div class="skill-badge-icon" style="color: ${skill.color}; background: ${skill.color}15; border-color: ${skill.color}30;">
          <i class="${skill.icon}"></i>
        </div>
        <div class="skill-badge-content">
          <div class="skill-badge-name">${skill.name}</div>
          <div class="skill-badge-level">
            <div class="skill-badge-bar">
              <div class="skill-badge-progress" style="width: ${percentage}%; background: ${skill.color}"></div>
            </div>
            <span class="skill-badge-percentage">${percentage}%</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create category section - Infinite Marquee
   */
  createCategorySection(category, skills, _categoryIndex) {
    // Duplicate skills for seamless loop
    const skillsList = [...skills, ...skills, ...skills]; // Triple for smoother loop on wide screens
    const skillsHTML = skillsList
      .map((skill, index) => this.createSkillBadge(skill, index))
      .join('');

    return `
      <div class="skill-category mb-8">
        <h3 class="text-xl font-bold mb-4 text-primary pb-2">
          ${category}
        </h3>
        <div class="skill-scroll-container">
          <div class="skill-scroll-wrapper">
            ${skillsHTML}
          </div>
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
  }

  /**
   * Inject CSS styles - Marquee Design
   */
  injectStyles() {
    // Styles have been migrated to src/assets/css/skills.css
    // This removes conflicts and duplication as requested.
    // The class names and structure remain the same.
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
      categories: Object.keys(this.skills).length,
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkillsVisualization;
}

// Make available globally
// Make available globally
window.SkillsVisualization = SkillsVisualization;

// Auto-initialize if container exists
const initSkillsVisualization = () => {
  if (document.getElementById('skills-container')) {
    new SkillsVisualization().render('skills-container');
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSkillsVisualization);
} else {
  initSkillsVisualization();
}
