import GitHubProjects from './github-projects.js';

const DEFAULT_USERNAME = 'mangeshraut712';
const MAX_RENDERED_PROJECTS = 8;

function setTextById(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = String(value);
    }
}

function applyTiltEffects(container) {
    if (!window.PremiumEnhancements || !window.PremiumEnhancements.applyTiltToElement) {
        return;
    }
    container.querySelectorAll('.apple-3d-project').forEach((card) => {
        window.PremiumEnhancements.applyTiltToElement(card);
    });
}

function renderNoResults(container) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-folder-open text-6xl text-accent opacity-20 mb-4"></i>
        <p class="text-secondary">No showcase-ready repositories found</p>
      </div>
    `;
}

function updateActivityStats(repos) {
    const stats = repos.reduce((acc, repo) => {
        acc.totalStars += repo.stargazers_count || 0;
        acc.totalForks += repo.forks_count || 0;
        if (repo.language) {
            acc.languages[repo.language] = (acc.languages[repo.language] || 0) + 1;
        }
        return acc;
    }, {
        totalRepos: repos.length,
        totalStars: 0,
        totalForks: 0,
        languages: {}
    });

    setTextById('stat-repos', stats.totalRepos);
    setTextById('stat-stars', stats.totalStars);
    setTextById('stat-forks', stats.totalForks);
    setTextById('stat-languages', Object.keys(stats.languages).length);
}

export async function initProjectShowcase({ username = DEFAULT_USERNAME } = {}) {
    const container = document.getElementById('github-projects-container');
    if (!container) return;

    if (container.dataset.projectsShowcaseInit === 'true') return;
    container.dataset.projectsShowcaseInit = 'true';

    try {
        const githubProjects = new GitHubProjects(username);
        const repos = await githubProjects.fetchRepositories();

        // Populate the compact activity stats bar above the cards
        updateActivityStats(repos);

        // Get top 8 curated showcase repos
        const showcaseRepos = githubProjects.getShowcaseRepos(repos, MAX_RENDERED_PROJECTS);

        if (showcaseRepos.length === 0) {
            renderNoResults(container);
            return;
        }

        const projectsHTML = showcaseRepos
            .map((repo, index) => githubProjects.createProjectCard(repo, index))
            .join('');

        container.innerHTML = projectsHTML;
        applyTiltEffects(container);
    } catch (error) {
        console.error('Failed to initialize project showcase:', error);
        renderNoResults(container);
    }
}

export default initProjectShowcase;
