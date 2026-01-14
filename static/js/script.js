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
    const jobGrid = document.getElementById('jobGrid');
    try {
        const url = `/api/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (Array.isArray(data)) {
            allJobs = data;
        } else if (data.fallback && Array.isArray(data.fallback)) {
            allJobs = data.fallback;
        } else {
            throw new Error('Invalid data format received from API');
        }

        updateStats(allJobs);
        updateLocationFilters(allJobs);
        displayJobs(allJobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        if (jobGrid) jobGrid.innerHTML = `<div class="loader">Failed to connect to the server. Please check your connection and try again.</div>`;
    }
}

function updateStats(jobs) {
    const totalEl = document.getElementById('totalJobs');
    const locEl = document.getElementById('topLocation');
    const catEl = document.getElementById('trendingCategory');

    if (totalEl) totalEl.innerText = jobs.length;

    if (jobs.length > 0) {
        const locations = jobs.map(j => j.location).filter(Boolean);
        if (locations.length > 0) {
            const topLocation = locations.sort((a, b) =>
                locations.filter(v => v === a).length - locations.filter(v => v === b).length
            ).pop();
            if (locEl) locEl.innerText = topLocation || 'N/A';
        }

        const categories = jobs.map(j => j.category).filter(Boolean);
        const trending = categories.length > 0 ? categories.sort((a, b) =>
            categories.filter(v => v === a).length - categories.filter(v => v === b).length
        ).pop() : 'Executive';
        if (catEl) catEl.innerText = trending;
    }
}

function updateLocationFilters(jobs) {
    const locFilters = document.getElementById('locationFilters');
    if (!locFilters) return;
    const locations = [...new Set(jobs.map(j => j.location).filter(Boolean))].slice(0, 5);

    locFilters.innerHTML = locations.map(loc => `
        <label><input type="checkbox" name="locFilter" value="${loc}" onchange="filterJobs()"> ${loc}</label>
    `).join('');
}

function displayJobs(jobs) {
    const jobGrid = document.getElementById('jobGrid');

    if (!Array.isArray(jobs) || jobs.length === 0) {
        if (jobGrid) jobGrid.innerHTML = `<div class="loader">No jobs matching your search criteria.</div>`;
        return;
    }

    if (jobGrid) {
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
                        <a href="${job.apply_url || '#'}" target="_blank" class="btn-gold">Apply Now</a>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

function filterJobs() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const titleQuery = document.getElementById('jobSearch').value;
        const locationQuery = document.getElementById('locationSearch').value;

        const selectedTypes = Array.from(document.querySelectorAll('input[name="jobType"]:checked')).map(c => c.value);
        const selectedLocs = Array.from(document.querySelectorAll('input[name="locFilter"]:checked')).map(c => c.value);

        if (selectedTypes.length > 0 || selectedLocs.length > 0) {
            const filtered = allJobs.filter(job => {
                const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(job.type);
                const locMatch = selectedLocs.length === 0 || selectedLocs.includes(job.location);
                return typeMatch && locMatch;
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
                <p>January 14, 2026</p>
            </div>
            <div class="detail-item">
                <h4>Reference</h4>
                <p>NJP-GB-${Math.floor(Math.random() * 9000) + 1000}</p>
            </div>
        </div>
        <div class="job-description">
            <h3>Role Description</h3>
            <p>We are seeking a highly motivated and experienced professional to join our team as a ${job.title}. In this role, you will be responsible for driving innovation and delivering high-quality solutions for our global clients.</p>
        </div>
        <div class="modal-actions">
            <a href="${job.apply_url || '#'}" target="_blank" class="btn-gold large">Confirm Application</a>
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
