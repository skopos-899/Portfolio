// Google Apps Script Web App URL
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzuO_TZzBo0FRwmg_5rP7HG8zxp9wPEQvFERzaj1lWpRvggdrpSQ68HGjrfCKAB3-yKNA/exec';

// Environment detection
const isAdminPanel = window.location.pathname.includes('admin.html');

// Auto-refresh configuration
const REFRESH_INTERVAL = 10000; // 10 seconds
let refreshTimer = null;
let isRefreshing = false;
let lastProjectCount = 0;
let cachedProjects = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5000; // 5 seconds cache

// DOMContentLoaded: Load projects when page is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const projects = await loadProjects(true); // Force initial load
        lastProjectCount = projects.length;
        displayProjects(projects);
        setupFilterButtons(projects);
        
        // Initialize Phase 4: Activity Visualization & Human Signals
        initializePhase4(projects);
        
        // Start auto-refresh only if not in admin panel
        if (!isAdminPanel) {
            startAutoRefresh();
            
            // Add visibility change listener to pause/resume refresh
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    stopAutoRefresh();
                } else {
                    // Refresh immediately when tab becomes visible
                    loadProjects(true).then(projects => {
                        displayProjects(projects);
                        lastProjectCount = projects.length;
                    });
                    startAutoRefresh();
                }
            });
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        showNotification('Error loading projects. Please refresh the page.', 'error');
    }
});

// Cleanup on page unload to prevent memory leaks
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});

// ==============================
// PROJECT SUBMISSION HANDLER
// ==============================

// Attach submit handler if form exists on the page and we're in admin panel
const formElement = document.getElementById('project-form');
if (formElement && isAdminPanel) {
    formElement.addEventListener('submit', async function (e) {
        e.preventDefault();

        try {
            // Collect input values
            const projectData = {
                name: document.getElementById('projectName').value.trim(),
                category: document.getElementById('projectCategory').value.trim(),
                description: document.getElementById('projectDescription').value.trim(),
                link: document.getElementById('projectLink').value.trim(),
                status: 'pending'
            };

            // Validate
            if (!projectData.name || !projectData.category || !projectData.description || !projectData.link) {
                throw new Error('Please fill in all required fields.');
            }

            // Submit to Google Sheets
            await addProject(projectData);
            formElement.reset();
            showNotification('Project submitted successfully! It will be visible after approval.', 'success');
        } catch (error) {
            console.error('Submission error:', error);
            showNotification(error.message || 'Error submitting project.', 'error');
        }
    });
}

// ==============================
// FUNCTIONS
// ==============================

// Submit project to Google Sheet via Apps Script
async function addProject(data) {
    if (!isAdminPanel) {
        throw new Error('Project submission is only available in the admin panel');
    }

    try {
        const params = new URLSearchParams({
            action: 'addProject',
            ...data
        });

        await fetch(`${WEB_APP_URL}?${params.toString()}`, {
            method: 'POST',
            mode: 'no-cors'
        });

        return { success: true };
    } catch (err) {
        console.error('Failed to add project:', err);
        throw new Error('Failed to add project.');
    }
}

// Fetch projects from Google Sheet
async function loadProjects(force = false) {
    if (!force && Date.now() - lastFetchTime < CACHE_DURATION && cachedProjects) {
        return cachedProjects;
    }

    try {
        const container = document.getElementById('projects-container');
        if (!container) return [];

        // Show loading state only on initial load
        if (!isRefreshing) {
            container.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        }

        // Only fetch approved projects for the public portfolio
        const response = await fetch(`${WEB_APP_URL}?action=getProjects&status=approved`);
        if (!response.ok) {
            throw new Error('Failed to fetch projects');
        }
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to load projects');
        }
        const projects = data.data.projects || [];
        cachedProjects = projects;
        lastFetchTime = Date.now();
        return projects;
    } catch (error) {
        console.error('Error loading projects:', error);
        const container = document.getElementById('projects-container');
        if (container) {
            container.innerHTML = '<div class="col-12 text-center text-danger"><p>Failed to load projects. Please try again later.</p></div>';
        }
        return [];
    }
}

// Fetch advancement events (AdvancementEvents sheet) from Apps Script
async function loadAdvancementEvents(force = false) {
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getAdvancementEvents`);
        if (!response.ok) throw new Error('Failed to fetch advancement events');
        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Failed to load advancement events');
        // AppScript returns { success: true, data: [...] }
        return Array.isArray(data.data) ? data.data : [];
    } catch (err) {
        console.error('Error loading advancement events:', err);
        return [];
    }
}

// Fetch advancements (Advancement sheet) from Apps Script
async function loadAdvancements(force = false) {
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getAdvancements`);
        if (!response.ok) throw new Error('Failed to fetch advancements');
        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Failed to load advancements');
        return Array.isArray(data.data) ? data.data : [];
    } catch (err) {
        console.error('Error loading advancements:', err);
        return [];
    }
}

// Setup filter buttons
function setupFilterButtons(projects) {
    const filterButtons = document.querySelectorAll('.projects-filter-buttons .btn');
    const filterSelect = document.getElementById('projects-filter-select');
    const searchInput = document.getElementById('projects-filter-search');

    const getCurrentFilter = () => {
        if (filterSelect) return filterSelect.value;
        const activeBtn = Array.from(filterButtons).find(b => b.classList.contains('active'));
        return activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
    };

    const applyFilter = (filterValue) => {
        const query = (searchInput?.value || '').trim().toLowerCase();

        let filtered = filterValue === 'all' ? projects.slice() : projects.filter(project => project.category === filterValue);

        if (query) {
            filtered = filtered.filter(p => {
                const name = (p.name || '').toLowerCase();
                const desc = (p.description || '').toLowerCase();
                const cat = (p.category || '').toLowerCase();
                return name.includes(query) || desc.includes(query) || cat.includes(query);
            });
        }

        displayProjects(filtered);
        
        // Show search result feedback
        updateSearchFeedback(filtered.length, query, filterValue);

        // update active class for button-style filters
        if (filterButtons && filterButtons.length) {
            filterButtons.forEach(btn => {
                const val = btn.getAttribute('data-filter');
                btn.classList.toggle('active', val === filterValue);
                btn.setAttribute('aria-selected', val === filterValue ? 'true' : 'false');
            });
        }

        // keep the select in sync (if present)
        if (filterSelect) filterSelect.value = filterValue;
    };

    // Attach click handlers for any button filters (if present)
    if (filterButtons && filterButtons.length) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filterValue = button.getAttribute('data-filter') || 'all';
                applyFilter(filterValue);
            });
        });
    }

    // Attach input handler for search box (debounced)
    if (searchInput) {
        let debounce;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                applyFilter(getCurrentFilter());
            }, 180);
        });
    }

    // Attach change handler for select dropdown filter
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            const value = e.target.value || 'all';
            applyFilter(value);
        });
    }
}

// Display all approved projects on the UI
function displayProjects(projects) {
    const container = document.getElementById('projects-container');
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';

    if (projects.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p>No projects available at the moment.</p></div>';
        return;
    }

    projects.forEach(project => {
        container.appendChild(createProjectCard(project));
    });
    
    // Initialize TIER 2 visual enhancements (color-coded skills, truncated descriptions, animations)
    if (typeof Tier2VisualAnchors !== 'undefined') {
        new Tier2VisualAnchors().init();
    }
    // Initialize TIER 3 scroll reveal effects (entrance animations)
    if (typeof Tier3ScrollEffects !== 'undefined') {
        new Tier3ScrollEffects().init();
    }
}

// Create one project card
function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card reveal reveal--up';

    // Parse project date into YYYY-MM-DD from multiple possible fields
    function extractISODate(project) {
        const candidates = [
            project && project.date,
            project && project.addedDate,
            project && project.added,
            project && project['Date']
        ];
        for (let raw of candidates) {
            if (!raw && raw !== 0) continue;
            if (typeof raw === 'string') {
                raw = raw.trim();
                const isoMatch = raw.match(/^(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})/);
                if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
                const parsed = Date.parse(raw);
                if (!isNaN(parsed)) {
                    const dt = new Date(parsed);
                    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
                }
            } else if (raw instanceof Date) {
                return `${raw.getFullYear()}-${String(raw.getMonth()+1).padStart(2,'0')}-${String(raw.getDate()).padStart(2,'0')}`;
            } else if (typeof raw === 'number') {
                let millis = raw;
                if (raw < 1e12) millis = raw * 1000;
                const dt = new Date(millis);
                if (!isNaN(dt.getTime())) return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
            }
        }
        return '';
    }

    const dateAttr = extractISODate(project);
    if (dateAttr) card.setAttribute('data-date', dateAttr);
    else card.setAttribute('data-date', '');

    // Build tech stack badges if available
    let techStackHtml = '';
    if (project.techStack && typeof project.techStack === 'string') {
        const techs = project.techStack.split(',').map(t => t.trim()).filter(t => t);
        techStackHtml = '<div class="tech-stack">' + 
            techs.map(tech => `<span class="tech-tag">${tech}</span>`).join('') + 
            '</div>';
    }

    // Status badge (default to Active if not specified). Hide badge when status is 'approved'
    const status = project.status || 'Active';
    const statusClass = status.toLowerCase().replace(/\s+/g, '-');
    const statusHtml = (status.toLowerCase() === 'approved') ? '' : `<span class="status-badge status-${statusClass}">${status}</span>`;

    // Difficulty badge with color coding (Easy, Medium, Hard)
    let difficultyHtml = '';
    if (project.difficulty) {
        const difficultyClass = project.difficulty.toLowerCase();
        difficultyHtml = `<span class="difficulty-badge difficulty-${difficultyClass}">${project.difficulty}</span>`;
    }

    const description = project.description || '';

    card.innerHTML = `
        <div class="card-body">
            <div class="card-header">
                <div class="card-title-wrapper">
                    <h3 class="card-title">${project.name}</h3>
                    ${statusHtml}
                </div>
                ${difficultyHtml}
            </div>

            <p class="card-text">${description}</p>

            ${techStackHtml}

            <div class="card-footer">
                <span class="badge">${project.category}</span>
                ${project.year ? `<span class="year-tag">${project.year}</span>` : ''}
            </div>

            <div class="project-meta">
                <a href="${project.link}" target="_blank" rel="noopener" class="project-meta-item" title="View Project">
                    <i class="fas fa-external-link-alt"></i>
                    <span>View</span>
                </a>
                ${project.outcome ? `<span class="project-meta-item" title="Impact">${project.outcome}</span>` : ''}
            </div>
        </div>
    `;

    return card;
}

// Update search feedback message
function updateSearchFeedback(resultCount, query, filterValue) {
    // Remove existing feedback
    const existingFeedback = document.getElementById('search-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }

    // Only show if there's a search query or non-default filter
    if (!query && filterValue === 'all') {
        return;
    }

    const feedbackDiv = document.createElement('div');
    feedbackDiv.id = 'search-feedback';
    feedbackDiv.className = 'search-feedback';
    feedbackDiv.setAttribute('role', 'status');
    feedbackDiv.setAttribute('aria-live', 'polite');
    feedbackDiv.setAttribute('aria-atomic', 'true');

    let message = '';
    if (query && filterValue !== 'all') {
        message = `${resultCount} ${resultCount === 1 ? 'project' : 'projects'} found in "${filterValue}" matching "${query}"`;
    } else if (query) {
        message = `${resultCount} ${resultCount === 1 ? 'project' : 'projects'} found matching "${query}"`;
    } else if (filterValue !== 'all') {
        message = `Showing ${resultCount} ${resultCount === 1 ? 'project' : 'projects'} in "${filterValue}"`;
    }

    if (resultCount === 0) {
        message = query ? `No projects found matching "${query}". Try a different search term.` : 
                 filterValue !== 'all' ? `No projects found in "${filterValue}".` : '';
        feedbackDiv.className += ' no-results';
    }

    feedbackDiv.textContent = message;

    // Insert after the filter buttons
    const filterButtonsContainer = document.querySelector('.projects-filter-buttons') || 
                                   document.querySelector('.projects-filter-left');
    if (filterButtonsContainer) {
        filterButtonsContainer.parentNode.insertBefore(feedbackDiv, filterButtonsContainer.nextSibling);
    }
}

// Show notification
function showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Add icon based on type
    const icon = document.createElement('i');
    icon.className = type === 'success' ? 'fas fa-check-circle' : 
                    type === 'error' ? 'fas fa-exclamation-circle' :
                    'fas fa-exclamation-triangle';
    notification.appendChild(icon);
    
    // Add message
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    notification.appendChild(messageSpan);
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds with animation
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Start auto-refresh
function startAutoRefresh() {
    if (refreshTimer) return; // Don't start if already running
    
    refreshTimer = setInterval(async () => {
        isRefreshing = true;
        try {
            const projects = await loadProjects();
            const currentCount = projects.length;
            
            // Check if there's a change in the number of projects
            if (currentCount !== lastProjectCount) {
                displayProjects(projects);
                lastProjectCount = currentCount;
                
                // Show notification if projects were removed
                if (currentCount < lastProjectCount) {
                    showNotification('Projects have been updated', 'info');
                }
            }
        } catch (error) {
            console.error('Auto-refresh error:', error);
        }
        isRefreshing = false;
    }, REFRESH_INTERVAL);
}

// Stop auto-refresh
function stopAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
}

// ==============================
// PHASE 4: ACTIVITY VISUALIZATION & HUMAN SIGNALS
// ==============================

/**
 * Initialize Phase 4 visualizations
 * - Contribution graph (project timeline)
 * - Lessons & insights cards
 * - Human signals (metrics & testimonials)
 * 
 * @param {Array} projects - Loaded projects array
 */
function initializePhase4(projects) {
    // Initialize Contribution Graph (shows project activity timeline)
    if (window.ContributionGraph) {
        const graph = new ContributionGraph('contribution-graph');
        // Fetch advancement events and advancements, then initialize graph
        Promise.all([loadAdvancementEvents(), loadAdvancements()])
            .then(([events, advancements]) => {
                graph.init({ projects: projects || [], advancementEvents: events || [], advancements: advancements || [] });
            }).catch((err) => {
                console.warn('Failed to load advancement data:', err);
                graph.init(projects);
            });
    }

    // Initialize Lessons & Insights (shows learning journey)
    if (window.LessonsInsights) {
        const lessons = new LessonsInsights('thinking');
        lessons.render();
    }

    // Initialize Human Signals (shows impact metrics & feedback)
    if (window.HumanSignals) {
        const signals = new HumanSignals('contact');
        signals.init();
    }
}

