const DEFAULT_PROJECTS = Object.freeze([
    {
        title: 'Face Recognition System',
        description: 'Real-time face recognition using Python, OpenCV, and TensorFlow. Achieves high accuracy in detecting and identifying faces in video streams.',
        technologies: ['Python', 'OpenCV', 'TensorFlow', 'Computer Vision'],
        github_url: '#',
        demo_url: '#',
        img_url: 'images/face-recognition.jpg'
    },
    {
        title: 'StarLight Blog Platform',
        description: 'Full-stack blogging platform with MERN stack. Features include user authentication, post creation, commenting, and responsive design.',
        technologies: ['MongoDB', 'Express.js', 'React', 'Node.js', 'AWS'],
        github_url: '#',
        demo_url: '#',
        img_url: 'images/starlight.jpg'
    },
    {
        title: 'AI Assistant Chatbot',
        description: 'Intelligent chatbot using natural language processing. Can answer portfolio questions, perform calculations, and provide general knowledge.',
        technologies: ['JavaScript', 'AI APIs', 'NLP', 'Web Technologies'],
        github_url: '#',
        demo_url: '#',
        img_url: 'images/assistme.jpg'
    }
]);

export function renderProjects(containerId = 'projects-container', projects = DEFAULT_PROJECTS, documentRef = document) {
    const projectsContainer = documentRef.getElementById(containerId);
    if (!projectsContainer) return;

    const cardsHtml = projects.map((project, index) => `
        <div class="project-card fade-in" style="animation-delay: ${index * 0.2}s;">
            <div class="project-image">
                <img src="${project.img_url || 'images/project-placeholder.jpg'}" alt="${project.title}" loading="lazy">
            </div>
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <div class="project-tags">
                ${project.technologies.map((tech) => `<span class="tag">${tech}</span>`).join('')}
            </div>
            <div class="project-links">
                <a href="${project.github_url}" target="_blank" class="btn btn-secondary">
                    <i class="fab fa-github mr-2"></i>GitHub
                </a>
                <a href="${project.demo_url}" target="_blank" class="btn btn-primary">
                    <i class="fas fa-external-link-alt mr-2"></i>Demo
                </a>
            </div>
        </div>
    `).join('');

    projectsContainer.innerHTML = cardsHtml;

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    const newCards = projectsContainer.querySelectorAll('.project-card.fade-in');
    newCards.forEach((card) => observer.observe(card));
}

export default renderProjects;
