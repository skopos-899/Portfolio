/**
 * TIER 2: Visual Anchors & Enhanced Whitespace
 * Adds interactive enhancements:
 * - Staggered fade-in animations on cards
 * - Skill tag color coding by category
 * - Project description truncation with reveal
 * - Enhanced hover effects
 */

class Tier2VisualAnchors {
    constructor() {
        this.skillCategories = {
            'Design': '#0366d6',      // Blue (primary)
            'Tools': '#28a745',       // Green
            'Other': '#6f42c1'        // Purple
        };
    }

    /**
     * Initialize all TIER 2 visual enhancements
     */
    init() {
        this.enhanceSkillTags();
        this.truncateProjectDescriptions();
        this.setupStaggeredFadeIns();
        this.enhanceHoverEffects();
    }

    /**
     * Color-code skill tags by category
     */
    enhanceSkillTags() {
        const skillCategories = document.querySelectorAll('.skill-category');

        skillCategories.forEach((category) => {
            const h3 = category.querySelector('h3');
            const categoryName = h3?.textContent.trim();
            const color = this.skillCategories[categoryName];

            const tags = category.querySelectorAll('.skill-tag');
            tags.forEach((tag, index) => {
                // Add category-specific color accent
                tag.style.setProperty('--tag-color', color);
                tag.classList.add(`skill-${categoryName.toLowerCase()}`);

                // Stagger animation
                tag.style.animation = `fadeInTag 0.4s ease-out forwards`;
                tag.style.animationDelay = `${index * 0.05}s`;
            });
        });
    }

    /**
     * Truncate project descriptions to 120 chars with expandable reveal
     */
    truncateProjectDescriptions() {
        const projectCards = document.querySelectorAll('.project-card');

        projectCards.forEach((card) => {
            const descElement = card.querySelector('.card-text');
            if (!descElement) return;

            const fullText = descElement.textContent.trim();
            const truncatePoint = 100;

            if (fullText.length > truncatePoint) {
                const truncated = fullText.substring(0, truncatePoint).trim() + '...';

                // Replace long description with a truncated preview (no "See more" button)
                descElement.textContent = truncated;
            }
        });
    }

    /**
     * Setup staggered fade-in animations on cards
     */
    setupStaggeredFadeIns() {
        // Stagger project cards
        const projectCards = document.querySelectorAll('.project-card');
        projectCards.forEach((card, index) => {
            card.style.animation = `fadeInCard 0.5s ease-out forwards`;
            card.style.animationDelay = `${index * 0.08}s`;
        });

        // Stagger thinking cards (if not already animated)
        const thinkingCards = document.querySelectorAll('.thinking-card');
        thinkingCards.forEach((card, index) => {
            if (!card.style.animation) {
                card.style.animation = `slideInCard 0.5s ease-out forwards`;
                card.style.animationDelay = `${index * 0.1}s`;
            }
        });

        // Stagger contact cards
        const contactCards = document.querySelectorAll('.contact-card');
        contactCards.forEach((card, index) => {
            card.style.animation = `fadeInCard 0.5s ease-out forwards`;
            card.style.animationDelay = `${index * 0.08}s`;
        });
    }

    /**
     * Enhance hover effects across components
     */
    enhanceHoverEffects() {
        // Skill tag enhanced hover
        document.querySelectorAll('.skill-tag').forEach((tag) => {
            tag.addEventListener('mouseenter', function() {
                this.classList.add('active-hover');
            });

            tag.addEventListener('mouseleave', function() {
                this.classList.remove('active-hover');
            });
        });

        // Project card meta link hover
        document.querySelectorAll('.project-meta-item').forEach((item) => {
            item.addEventListener('mouseenter', function() {
                this.classList.add('meta-hover');
            });

            item.addEventListener('mouseleave', function() {
                this.classList.remove('meta-hover');
            });
        });

        // Contact card enhanced hover
        document.querySelectorAll('.contact-card').forEach((card) => {
            card.addEventListener('mouseenter', function() {
                this.classList.add('contact-hover');
            });

            card.addEventListener('mouseleave', function() {
                this.classList.remove('contact-hover');
            });
        });
    }
}

// Expose the class so other scripts can instantiate after dynamic content loads
window.Tier2VisualAnchors = Tier2VisualAnchors;
