/*
 * TIER 3: Scroll-triggered reveal animations
 * - Observes elements with class `reveal` and adds `reveal--visible` when they enter viewport
 * - Supports modifiers: `reveal--up`, `reveal--fade`, `reveal--tilt`
 * - Group staggering: container with `data-reveal-group` will stagger its children
 * - Individual delay: element with `data-reveal-delay="120"` (ms) will use that delay
 */

class Tier3ScrollEffects {
    constructor(options = {}) {
        this.root = options.root || null;
        this.rootMargin = options.rootMargin || '0px 0px -8% 0px';
        this.threshold = options.threshold || 0.12;
        this.stagger = options.stagger || 80; // ms between items in a group
        this.observer = null;
    }

    init() {
        const supportsIntersection = 'IntersectionObserver' in window;
        if (!supportsIntersection) return; // graceful degrade

        this.observer = new IntersectionObserver(this._handleIntersect.bind(this), {
            root: this.root,
            rootMargin: this.rootMargin,
            threshold: this.threshold
        });

        // Find all reveal elements and observe them
        const reveals = document.querySelectorAll('.reveal');

        // If inside a reveal-group, we will handle stagger later
        reveals.forEach(el => {
            // If element is already visible on load, mark it
            if (this._isElementInViewportImmediate(el)) {
                el.classList.add('reveal--visible');
                return;
            }

            // set initial attr for JS-accessible delay
            if (el.dataset.revealDelay) {
                el.style.setProperty('--reveal-delay', `${el.dataset.revealDelay}ms`);
            }

            this.observer.observe(el);
        });

        // Handle groups: set incremental data-delay on children
        document.querySelectorAll('[data-reveal-group]').forEach(group => {
            const children = Array.from(group.querySelectorAll('.reveal'));
            children.forEach((child, idx) => {
                // only set delay if not already set explicitly
                if (!child.dataset.revealDelay) {
                    const delay = idx * this.stagger;
                    child.dataset.revealDelay = delay;
                    child.style.setProperty('--reveal-delay', `${delay}ms`);
                }
            });
        });
    }

    _handleIntersect(entries) {
        entries.forEach(entry => {
            const el = entry.target;
            if (entry.isIntersecting) {
                const delay = parseInt(el.dataset.revealDelay || '0', 10);
                // Respect prefers-reduced-motion
                const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                const apply = () => {
                    el.classList.add('reveal--visible');
                    // if element should animate once, unobserve
                    if (el.dataset.revealOnce !== 'false') {
                        this.observer.unobserve(el);
                    }
                };

                if (!reduced && delay > 0) {
                    setTimeout(apply, delay);
                } else {
                    apply();
                }
            }
        });
    }

    // Utility: quick check if element is already visible in viewport
    _isElementInViewportImmediate(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
            rect.bottom >= 0
        );
    }
}

// Expose to global so script.js can instantiate after dynamic rendering
window.Tier3ScrollEffects = Tier3ScrollEffects;
