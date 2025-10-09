// Theme toggle functionality
const themeToggle = document.getElementById("theme-toggle");
const themeToggleIcon = document.getElementById("theme-toggle-icon");

function setInitialTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        document.documentElement.classList.add("dark");
        themeToggleIcon.classList.remove("fa-moon");
        themeToggleIcon.classList.add("fa-sun");
    } else {
        document.documentElement.classList.remove("dark");
        themeToggleIcon.classList.remove("fa-sun");
        themeToggleIcon.classList.add("fa-moon");
    }
}

function initThemeToggle() {
    setInitialTheme();

    themeToggle.addEventListener("click", () => {
        document.documentElement.classList.toggle("dark");
        const isDark = document.documentElement.classList.contains("dark");
        themeToggleIcon.classList.toggle("fa-moon", !isDark);
        themeToggleIcon.classList.toggle("fa-sun", isDark);
        localStorage.setItem("theme", isDark ? "dark" : "light");
    });
}

// Initialize theme toggle on load
document.addEventListener('DOMContentLoaded', initThemeToggle);