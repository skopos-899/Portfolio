/**
 * Micro-interactions & Polish Module
 * Adds refined details: smooth transitions, focus states, feedback animations
 * Enhances user experience with subtle, purposeful micro-interactions
 */

class MicroInteractions {
    constructor() {
        this.notifications = [];
    }

    /**
     * Initialize all micro-interaction enhancements
     */
    init() {
        this.setupFocusIndicators();
        this.setupSmoothScrolling();
        this.setupCardInteractions();
        this.setupButtonFeedback();
        this.setupFormPolish();
        this.setupLoadingStates();
        this.setupTabletWarnings();
    }

    /**
     * Enhance focus indicators for keyboard navigation
     * High-contrast focus rings for accessibility
     */
    setupFocusIndicators() {
        // Add focus-visible styles for all interactive elements
        const interactiveElements = document.querySelectorAll(
            'a, button, input, textarea, [tabindex]:not([tabindex="-1"])'
        );

        interactiveElements.forEach(element => {
            element.addEventListener('focus', (e) => {
                if (e.target.matches(':focus-visible')) {
                    e.target.classList.add('keyboard-focus');
                }
            });

            element.addEventListener('blur', (e) => {
                e.target.classList.remove('keyboard-focus');
            });

            // Click removes focus ring (for mouse users)
            element.addEventListener('mousedown', (e) => {
                e.target.classList.remove('keyboard-focus');
            });
        });

        // Global keyboard focus detection
        let isKeyboardUser = false;
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                isKeyboardUser = true;
                document.body.classList.add('keyboard-nav');
            }
        });

        document.addEventListener('mousedown', () => {
            isKeyboardUser = false;
            document.body.classList.remove('keyboard-nav');
        });
    }

    /**
     * Smooth scroll behavior with attention to reduced-motion preference
     */
    setupSmoothScrolling() {
        // Check for prefers-reduced-motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!prefersReducedMotion) {
            document.documentElement.style.scrollBehavior = 'smooth';
        }

        // Scroll to anchor links
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === '#') return;

                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    target.focus({ preventScroll: true });
                }
            });
        });
    }

    /**
     * Add polish to card interactions
     * Smooth scale, shadow, and color transitions
     */
    setupCardInteractions() {
        const cards = document.querySelectorAll(
            '.project-card, .insight-card, .thinking-card, .contact-card, .metric-card, .testimonial-card'
        );

        cards.forEach(card => {
            // Prevent drag for better interaction feel
            card.addEventListener('dragstart', (e) => {
                if (e.target.tagName !== 'A' && !e.target.closest('a')) {
                    e.preventDefault();
                }
            });

            // Add active state on click
            card.addEventListener('mousedown', function() {
                this.classList.add('active-state');
            });

            card.addEventListener('mouseup', function() {
                this.classList.remove('active-state');
            });

            card.addEventListener('mouseleave', function() {
                this.classList.remove('active-state');
            });
        });
    }

    /**
     * Add feedback to button interactions
     * Visual ripple effect on click
     */
    setupButtonFeedback() {
        const buttons = document.querySelectorAll('button, [role="button"], .btn, a.contact-card');

        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Create ripple effect
                const ripple = document.createElement('span');
                ripple.className = 'ripple';

                const rect = button.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';

                button.appendChild(ripple);

                // Remove ripple after animation
                setTimeout(() => ripple.remove(), 600);
            });

            // Add visual feedback on hover
            button.addEventListener('mouseenter', function() {
                this.classList.add('button-hover');
            });

            button.addEventListener('mouseleave', function() {
                this.classList.remove('button-hover');
            });
        });
    }

    /**
     * Polish form elements
     * Focus states, input validation feedback
     */
    setupFormPolish() {
        const inputs = document.querySelectorAll('input, textarea');

        inputs.forEach(input => {
            // Add filled state when input has value
            const updateFilledState = () => {
                if (input.value.trim()) {
                    input.classList.add('filled');
                } else {
                    input.classList.remove('filled');
                }
            };

            input.addEventListener('input', updateFilledState);
            input.addEventListener('blur', updateFilledState);
            input.addEventListener('focus', function() {
                this.classList.add('focused');
            });

            input.addEventListener('blur', function() {
                this.classList.remove('focused');
            });

            // Initial state check
            updateFilledState();
        });
    }

    /**
     * Add loading state indicators
     * Skeleton screens and spinner animations
     */
    setupLoadingStates() {
        // Observe images for loading state
        const images = document.querySelectorAll('img');

        images.forEach(img => {
            img.addEventListener('load', function() {
                this.classList.add('loaded');
            });

            img.addEventListener('error', function() {
                this.classList.add('error');
            });

            // Trigger load if already cached
            if (img.complete) {
                img.classList.add('loaded');
            }
        });
    }

    /**
     * Warn users on tablet sizes with pinch-zoom disabled
     * Show hint for better experience
     */
    setupTabletWarnings() {
        const isTouchDevice = () => {
            return (('ontouchstart' in window) ||
                    (navigator.maxTouchPoints > 0) ||
                    (navigator.msMaxTouchPoints > 0));
        };

        if (isTouchDevice()) {
            document.body.classList.add('touch-device');
        }
    }

    /**
     * Show toast notification
     * @param {string} message - Notification message
     * @param {string} type - 'success', 'error', 'info', 'warning'
     * @param {number} duration - Display time in ms (0 = permanent)
     */
    showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container') || this.createToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');

        const icon = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            info: 'fas fa-info-circle',
            warning: 'fas fa-exclamation-circle'
        }[type];

        toast.innerHTML = `
            <i class="${icon}"></i>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        if (duration > 0) {
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    }

    /**
     * Create toast notification container if it doesn't exist
     */
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    /**
     * Show loading skeleton
     * @param {HTMLElement} element - Element to show skeleton in
     * @param {number} lines - Number of skeleton lines
     */
    showLoadingSkeleton(element, lines = 3) {
        if (!element) return;

        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-loader';

        for (let i = 0; i < lines; i++) {
            const line = document.createElement('div');
            line.className = 'skeleton-line';
            if (i === lines - 1) line.style.width = '60%';
            skeleton.appendChild(line);
        }

        element.innerHTML = '';
        element.appendChild(skeleton);
    }

    /**
     * Page transition effect
     * Fade in on load
     */
    setupPageTransition() {
        document.body.classList.add('page-loaded');
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const microInteractions = new MicroInteractions();
    microInteractions.init();
    microInteractions.setupPageTransition();

    // Export for use in other scripts
    window.MicroInteractions = microInteractions;
});
