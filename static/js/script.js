let allJobs = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchJobs();

    // Smooth scrolling for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});

async function fetchJobs() {
    const jobGrid = document.getElementById('jobGrid');
    try {
        const response = await fetch('/api/jobs');
        const data = await response.json();

        // Handle both direct array and error responses with fallback
        if (Array.isArray(data)) {
            allJobs = data;
        } else if (data.fallback && Array.isArray(data.fallback)) {
            console.warn('API returned error, using fallback data:', data.error);
            allJobs = data.fallback;
        } else {
            throw new Error('Invalid data format received from API');
        }

        displayJobs(allJobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        jobGrid.innerHTML = `<div class="loader">Failed to connect to the server. Please check your connection and try again.</div>`;
    }
}

function displayJobs(jobs) {
    const jobGrid = document.getElementById('jobGrid');

    if (!Array.isArray(jobs) || jobs.length === 0) {
        jobGrid.innerHTML = `<div class="loader">No jobs matching your search criteria.</div>`;
        return;
    }

    jobGrid.innerHTML = jobs.map(job => `
        <div class="job-card">
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
            <div class="salary">
                <span>${job.salary || 'Competitive'}</span>
                <button class="btn-outline">View Details</button>
            </div>
        </div>
    `).join('');
}

function filterJobs() {
    const titleQuery = document.getElementById('jobSearch').value.toLowerCase();
    const locationQuery = document.getElementById('locationSearch').value.toLowerCase();

    const filteredJobs = allJobs.filter(job => {
        const matchesTitle = job.title.toLowerCase().includes(titleQuery) ||
            job.company.toLowerCase().includes(titleQuery);
        const matchesLocation = job.location.toLowerCase().includes(locationQuery);
        return matchesTitle && matchesLocation;
    });

    displayJobs(filteredJobs);
}

// Modal Logic
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// Close modal when clicking outside
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}
