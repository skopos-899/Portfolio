/**
 * Human Signals Module
 * Displays impact metrics, testimonials, and social proof
 * Shows the human side of projects: feedback, adoption, and real-world impact
 */

class HumanSignals {
    constructor(containerId = 'contact') {
        this.container = document.getElementById(containerId);
    }

    /**
     * Render impact metrics
     */
    renderMetrics() {
        const metrics = [
            {
                icon: 'fas fa-star',
                label: 'Projects',
                value: '10+',
                description: 'Shipped'
            },
            {
                icon: 'fas fa-code',
                label: 'Code',
                value: '50K+',
                description: 'Lines written'
            },
            {
                icon: 'fas fa-users',
                label: 'Impact',
                value: '1000+',
                description: 'Users helped'
            },
            {
                icon: 'fas fa-zap',
                label: 'Skills',
                value: '20+',
                description: 'Technologies'
            }
        ];

        const metricsHtml = `
            <div class="human-signals-container">
                <h3 class="signals-title">
                    <i class="fas fa-chart-line"></i>
                    Impact & Metrics
                </h3>
                <div class="metrics-grid">
                    ${metrics.map((metric, index) => `
                        <div class="metric-card" style="animation-delay: ${index * 0.1}s;">
                            <div class="metric-icon">
                                <i class="${metric.icon}"></i>
                            </div>
                            <div class="metric-content">
                                <div class="metric-value">${metric.value}</div>
                                <div class="metric-label">${metric.label}</div>
                                <div class="metric-description">${metric.description}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Insert before contact cards
        const contactSection = this.container;
        const existingMetrics = contactSection.querySelector('.human-signals-container');
        
        if (existingMetrics) {
            existingMetrics.remove();
        }

        const firstContactCard = contactSection.querySelector('.contact-grid');
        if (firstContactCard) {
            firstContactCard.insertAdjacentHTML('beforebegin', metricsHtml);
        } else {
            contactSection.insertAdjacentHTML('afterbegin', metricsHtml);
        }

        this.attachMetricsListeners();
    }

    /**
     * Attach event listeners to metric cards
     */
    attachMetricsListeners() {
        const metricCards = this.container.querySelectorAll('.metric-card');
        
        metricCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.classList.add('active');
            });

            card.addEventListener('mouseleave', function() {
                this.classList.remove('active');
            });
        });
    }

    /**
     * Render testimonials section
     */
    renderTestimonials() {
        const testimonials = [
            {
                text: 'Exceptional work on both design and implementation. Attention to detail is remarkable.',
                author: 'Project Stakeholder',
                role: 'Product Manager',
                initials: 'PM'
            },
            {
                text: 'Clean, maintainable code. Easy to build upon and understand the architecture.',
                author: 'Development Team',
                role: 'Engineering Lead',
                initials: 'EL'
            }
        ];

        const testimonialsHtml = `
            <div class="testimonials-container">
                <h3 class="testimonials-title">
                    <i class="fas fa-quote-left"></i>
                    Feedback
                </h3>
                <div class="testimonials-grid">
                    ${testimonials.map((testimonial, index) => `
                        <div class="testimonial-card" style="animation-delay: ${index * 0.1}s;">
                            <div class="testimonial-text">
                                "${testimonial.text}"
                            </div>
                            <div class="testimonial-author">
                                <div class="author-avatar">${testimonial.initials}</div>
                                <div class="author-info">
                                    <div class="author-name">${testimonial.author}</div>
                                    <div class="author-role">${testimonial.role}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Insert at the end of contact section
        const contactSection = this.container;
        const existingTestimonials = contactSection.querySelector('.testimonials-container');
        
        if (existingTestimonials) {
            existingTestimonials.remove();
        }

        contactSection.insertAdjacentHTML('beforeend', testimonialsHtml);
        this.attachTestimonialListeners();
    }

    /**
     * Attach event listeners to testimonial cards
     */
    attachTestimonialListeners() {
        const testimonialCards = this.container.querySelectorAll('.testimonial-card');
        
        testimonialCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.classList.add('highlighted');
            });

            card.addEventListener('mouseleave', function() {
                this.classList.remove('highlighted');
            });
        });
    }

    /**
     * Initialize all human signals
     */
    init() {
        this.renderMetrics();
        this.renderTestimonials();
    }
}

// Export for use in script.js
window.HumanSignals = HumanSignals;
