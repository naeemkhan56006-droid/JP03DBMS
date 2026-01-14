let allJobs = [];
let searchTimeout;

document.addEventListener('DOMContentLoaded', () => {
    fetchJobs();

    // Smooth scrolling for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

async function fetchJobs(query = '', location = '') {
    showSkeletons();

    try {
        const url = `/api/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;
        const response = await fetch(url);
        const data = await response.json();

        // Handle metadata-wrapped response
        if (data.jobs && Array.isArray(data.jobs)) {
            allJobs = data.jobs;
            if (data.last_updated) {
                document.getElementById('lastUpdated').innerText = data.last_updated;
            }
        } else if (Array.isArray(data)) {
            allJobs = data;
        } else if (data.fallback) {
            allJobs = data.fallback;
        } else {
            throw new Error('Invalid data format');
        }

        updateStats(allJobs);
        updateSidebarFilters(allJobs);
        displayJobs(allJobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        const jobGrid = document.getElementById('jobGrid');
        if (jobGrid) jobGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Connection Error</h3>
                <p>We couldn't reach the executive database. Please check your connection.</p>
                <button class="btn-gold" onclick="fetchJobs()">Retry Connection</button>
            </div>
        `;
    }
}

function showSkeletons() {
    const jobGrid = document.getElementById('jobGrid');
    if (!jobGrid) return;

    jobGrid.innerHTML = Array(6).fill(0).map(() => `
        <div class="skeleton-card"></div>
    `).join('');
}

function updateStats(jobs) {
    const totalEl = document.getElementById('totalJobs');
    const locEl = document.getElementById('topLocation');
    const catEl = document.getElementById('trendingCategory');

    if (totalEl) totalEl.innerText = jobs.length;

    if (jobs.length > 0) {
        const locations = jobs.map(j => j.location).filter(Boolean);
        if (locations.length > 0 && locEl) {
            const topLocation = locations.sort((a, b) =>
                locations.filter(v => v === a).length - locations.filter(v => v === b).length
            ).pop();
            locEl.innerText = topLocation || 'N/A';
        }

        const categories = jobs.map(j => j.category).filter(Boolean);
        if (catEl) {
            const trending = categories.length > 0 ? categories.sort((a, b) =>
                categories.filter(v => v === a).length - categories.filter(v => v === b).length
            ).pop() : 'Executive';
            catEl.innerText = trending;
        }
    }
}

function updateSidebarFilters(jobs) {
    // Location Filters
    const locFilters = document.getElementById('locationFilters');
    if (locFilters) {
        const locations = [...new Set(jobs.map(j => j.location).filter(Boolean))].slice(0, 5);
        locFilters.innerHTML = locations.map(loc => `
            <label><input type="checkbox" name="locFilter" value="${loc}" onchange="filterJobs()"> ${loc}</label>
        `).join('');
    }

    // Company Filters
    const compFilters = document.getElementById('companyFilters');
    if (compFilters) {
        const companies = [...new Set(jobs.map(j => j.company).filter(Boolean))].slice(0, 5);
        compFilters.innerHTML = companies.map(comp => `
            <label><input type="checkbox" name="compFilter" value="${comp}" onchange="filterJobs()"> ${comp}</label>
        `).join('');
    }
}

function displayJobs(jobs) {
    const jobGrid = document.getElementById('jobGrid');
    if (!jobGrid) return;

    if (!Array.isArray(jobs) || jobs.length === 0) {
        jobGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No Opportunities Found</h3>
                <p>Try adjusting your search terms or filters to find more results.</p>
                <button class="btn-gold" onclick="clearSearch()">Clear All Filters</button>
            </div>
        `;
        return;
    }

    jobGrid.innerHTML = jobs.map((job, index) => `
        <div class="job-card" style="animation-delay: ${index * 0.1}s">
            <div class="job-header">
                <div class="company-logo">
                    <i class="fas fa-building"></i>
                </div>
                <span class="job-type">${job.type || 'Full-time'}</span>
            </div>
            <h3>${job.title}</h3>
            <p class="company-name">${job.company}</p>
            <div class="job-meta">
                <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                <span><i class="fas fa-clock"></i> 2 days ago</span>
            </div>
            <div class="card-footer">
                <div class="salary-row">
                    <span>${job.salary || 'Competitive'}</span>
                </div>
                <div class="action-buttons">
                    <button class="btn-outline" onclick='viewDetails(${JSON.stringify(job).replace(/'/g, "&apos;")})'>View Details</button>
                    <a href="${job.redirect_url || job.apply_url || '#'}" target="_blank" class="btn-gold">Direct Apply</a>
                </div>
            </div>
        </div>
    `).join('');
}

function filterJobs() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const titleQuery = document.getElementById('jobSearch').value;
        const locationQuery = document.getElementById('locationSearch').value;

        const selectedTypes = Array.from(document.querySelectorAll('input[name="jobType"]:checked')).map(c => c.value);
        const selectedLocs = Array.from(document.querySelectorAll('input[name="locFilter"]:checked')).map(c => c.value);
        const selectedComps = Array.from(document.querySelectorAll('input[name="compFilter"]:checked')).map(c => c.value);

        if (selectedTypes.length > 0 || selectedLocs.length > 0 || selectedComps.length > 0) {
            const filtered = allJobs.filter(job => {
                const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(job.type);
                const locMatch = selectedLocs.length === 0 || selectedLocs.includes(job.location);
                const compMatch = selectedComps.length === 0 || selectedComps.includes(job.company);
                return typeMatch && locMatch && compMatch;
            });
            displayJobs(filtered);
        } else {
            fetchJobs(titleQuery, locationQuery);
        }
    }, 300);
}

function clearSearch() {
    document.getElementById('jobSearch').value = '';
    document.getElementById('locationSearch').value = '';
    document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
    fetchJobs();
}

function viewDetails(job) {
    const modalBody = document.getElementById('modalBody');
    if (!modalBody) return;

    modalBody.innerHTML = `
        <div class="modal-header">
            <div class="logo-large"><i class="fas fa-building"></i></div>
            <div>
                <h2>${job.title}</h2>
                <p>${job.company}</p>
            </div>
        </div>
        <div class="modal-details-grid">
            <div class="detail-item">
                <h4>Location</h4>
                <p>${job.location}</p>
            </div>
            <div class="detail-item">
                <h4>Salary Range</h4>
                <p>${job.salary || 'Competitive'}</p>
            </div>
            <div class="detail-item">
                <h4>Employment Type</h4>
                <p>${job.type || 'Full-time'}</p>
            </div>
            <div class="detail-item">
                <h4>Category</h4>
                <p>${job.category || 'Executive'}</p>
            </div>
            <div class="detail-item">
                <h4>Posted Date</h4>
                <p>January 15, 2026</p>
            </div>
            <div class="detail-item">
                <h4>Reference Id</h4>
                <p>NJP-GB-${Math.floor(Math.random() * 9000) + 1000}</p>
            </div>
        </div>
        <div class="job-description">
            <h3>Role Description</h3>
            <p>We are seeking a highly motivated and experienced professional to join our team as a ${job.title}. In this role, you will be responsible for driving innovation and delivering high-quality solutions for our global clients.</p>
            <p style="margin-top: 15px">Key Perks: Executive Benefits, Private Healthcare, Performance Bonuses.</p>
        </div>
        <div class="modal-actions">
            <a href="${job.redirect_url || job.apply_url || '#'}" target="_blank" class="btn-gold large">Confirm Application</a>
            <button class="btn-outline" onclick="closeModal('detailsModal')">Close Interface</button>
        </div>
    `;
    openModal('detailsModal');
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
    }
}
