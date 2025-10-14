/**
 * Image Resizer - Theme Management
 * Unified theme system for all pages
 */

class ThemeManager {
    constructor() {
        this.themeKey = 'darkMode';
        this.init();
    }

    init() {
        this.loadTheme();
        this.bindEvents();
        this.addParallaxEffect();
        this.initializeIntersectionObserver();
    }

    bindEvents() {
        // Theme toggle events
        const themeToggle = document.querySelector('.theme-toggle');
        const darkModeToggle = document.getElementById('darkModeToggle');
        
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        const isDarkMode = document.documentElement.classList.contains('dark-mode');
        
        if (isDarkMode) {
            document.documentElement.classList.remove('dark-mode');
            localStorage.setItem(this.themeKey, 'false');
        } else {
            document.documentElement.classList.add('dark-mode');
            localStorage.setItem(this.themeKey, 'true');
        }
        
        // Update toggle state
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.checked = !isDarkMode;
        }
        
        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { isDarkMode: !isDarkMode }
        }));
    }

    loadTheme() {
        const savedMode = localStorage.getItem(this.themeKey);
        if (savedMode === 'true') {
            document.documentElement.classList.add('dark-mode');
            const darkModeToggle = document.getElementById('darkModeToggle');
            if (darkModeToggle) {
                darkModeToggle.checked = true;
            }
        }
    }

    addParallaxEffect() {
        document.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            document.body.style.backgroundPosition = `${x * 20}px ${y * 20}px`;
        });
    }

    initializeIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                }
            });
        }, observerOptions);

        // Observe animated elements
        document.addEventListener('DOMContentLoaded', () => {
            const animatedElements = document.querySelectorAll(
                '.feature-card, .cta-section, .highlight-card, .security-badge, .point-card, .important-notice'
            );
            animatedElements.forEach(el => {
                observer.observe(el);
            });
        });
    }
}

// Global function for backward compatibility
function toggleMode() {
    if (window.themeManager) {
        window.themeManager.toggleTheme();
    }
}

// Initialize theme manager immediately to prevent flash
(function() {
    // Load theme immediately before DOM is ready
    const themeKey = 'darkMode';
    const savedMode = localStorage.getItem(themeKey);
    if (savedMode === 'true') {
        document.documentElement.classList.add('dark-mode');
    }
    
    // Initialize full theme manager when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
})();
