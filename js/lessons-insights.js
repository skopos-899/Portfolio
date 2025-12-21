/**
 * Lessons & Insights Module
 * Displays key learnings and decision-making insights from projects
 * Adds human signal layer showing growth and reflection
 */

const lessonsData = [
    {
        id: 'user-first',
        icon: 'fas fa-users',
        title: 'User-First Design',
        insight: 'Every feature should solve a real problem. Talking to users early beats guessing.',
        projects: 2,
        color: '#28a745'
    },
    {
        id: 'simplicity',
        icon: 'fas fa-feather',
        title: 'Simplicity Scales',
        insight: 'Constraints breed creativity. Starting minimal and building complexity is better than starting bloated.',
        projects: 3,
        color: '#007bff'
    },
    {
        id: 'iteration',
        icon: 'fas fa-sync-alt',
        title: 'Iteration Over Perfection',
        insight: 'Done is better than perfect. Small improvements compound into major wins over time.',
        projects: 4,
        color: '#ffc107'
    },
    {
        id: 'learning',
        icon: 'fas fa-book',
        title: 'Continuous Learning',
        insight: 'Every project teaches something new. The willingness to learn is more valuable than current knowledge.',
        projects: 5,
        color: '#6f42c1'
    }
];

class LessonsInsights {
    constructor(containerId = 'thinking') {
        this.container = document.getElementById(containerId);
        this.lessonsData = lessonsData;
    }

    /**
     * Render lessons cards
     */
    render() {
        if (!this.container) return;

        const lessonsHtml = this.lessonsData.map((lesson, index) => `
            <div class="insight-card" data-insight-id="${lesson.id}">
                <div class="insight-icon" style="color: ${lesson.color};">
                    <i class="${lesson.icon}"></i>
                </div>
                <div class="insight-content">
                    <h4 class="insight-title">${lesson.title}</h4>
                    <p class="insight-text">${lesson.insight}</p>
                    <div class="insight-meta">
                        <span class="insight-badge">
                            <i class="fas fa-code-branch"></i>
                            ${lesson.projects} project${lesson.projects > 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');

        // Update or create insights section
        let insightsSection = this.container.querySelector('.insights-grid');
        if (!insightsSection) {
            insightsSection = document.createElement('div');
            insightsSection.className = 'insights-grid';
            this.container.appendChild(insightsSection);
        }

        insightsSection.innerHTML = lessonsHtml;
        this.attachEventListeners();
    }

    /**
     * Attach event listeners to insight cards
     */
    attachEventListeners() {
        const cards = this.container.querySelectorAll('.insight-card');

        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;

            card.addEventListener('mouseenter', () => {
                card.classList.add('active');
                this.highlightRelatedProjects(card.getAttribute('data-insight-id'));
            });

            card.addEventListener('mouseleave', () => {
                card.classList.remove('active');
                this.clearHighlight();
            });

            card.addEventListener('click', () => {
                card.classList.toggle('expanded');
            });
        });
    }

    /**
     * Highlight projects related to this insight
     * @param {string} insightId - ID of the insight
     */
    highlightRelatedProjects(insightId) {
        // In a full implementation, this would filter projects
        // that are tagged with this insight's lessons
        document.querySelectorAll('.project-card').forEach(card => {
            card.style.opacity = '0.5';
        });
    }

    /**
     * Clear project highlighting
     */
    clearHighlight() {
        document.querySelectorAll('.project-card').forEach(card => {
            card.style.opacity = '1';
        });
    }
}

// Export for use in script.js
window.LessonsInsights = LessonsInsights;
