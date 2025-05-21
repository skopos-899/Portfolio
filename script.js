// Google Apps Script Web App URL
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw6nSWK_wol4Wt4R5ywTzm_nLMurKqgw5yVlk7gBj7aqbj-sR_9XZnERgg4adWFjlvNbg/exec';

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

// Setup filter buttons
function setupFilterButtons(projects) {
    const filterButtons = document.querySelectorAll('.projects-filter .btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            const category = button.textContent.trim();
            const filteredProjects = category === 'All' 
                ? projects 
                : projects.filter(project => project.category === category);
            
            displayProjects(filteredProjects);
        });
    });
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
}

// Create one project card
function createProjectCard(project) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-4';

    col.innerHTML = `
        <div class="card project-card">
            <div class="card-body">
                <h5 class="card-title">${project.name}</h5>
                <p class="card-text">${project.description}</p>
                <span class="badge">${project.category}</span>
                <div class="project-meta">
                    <a href="${project.link}" target="_blank" rel="noopener" class="project-meta-item">
                        <i class="fas fa-external-link-alt"></i>
                        <span>View Project</span>
                    </a>
                    <div class="project-meta-item">
                        <i class="fas fa-code-branch"></i>
                        <span>${project.category}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    return col;
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
