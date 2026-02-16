// Projects Page Logic
const ProjectsPage = {
    projects: [],
    filteredProjects: [],

    async init() {
        await this.loadProjects();
        this.setupEventListeners();
        Utils.initAuditLog('project', 'audit-log-container');
    },

    async loadProjects() {
        try {
            // ✅ DRF COLLECTION: /api/projects/projects/
            const response = await API.projects.list();

            // ✅ CANONICAL GUARD
            if (!Array.isArray(response)) {
                console.error("Invalid projects response:", response);
                this.projects = [];
            } else {
                this.projects = response;
            }

            this.filteredProjects = [...this.projects];

            this.renderProjects();
            this.updateStats();

            Utils.showToast(`Loaded ${this.projects.length} projects`, 'success');
        } catch (error) {
            console.error('Failed to load projects:', error);
            Utils.showToast('Failed to load projects', 'error');

            // Show error state
            const grid = document.getElementById('projects-grid');
            if (grid) {
                grid.innerHTML = `
                    <div class="card" style="text-align: center; padding: 3rem; grid-column: 1/-1;">
                        <i class="fa-solid fa-exclamation-triangle" style="font-size: 3rem; color: var(--error); margin-bottom: 1rem;"></i>
                        <p style="color: var(--error); margin-bottom: 1rem;">Failed to load projects</p>
                        <button onclick="ProjectsPage.loadProjects()" class="btn btn-primary">
                            <i class="fa-solid fa-refresh"></i> Retry
                        </button>
                    </div>
                `;
            }
        }
    },

    renderProjects() {
        const body = document.getElementById('projects-list-body');
        if (!body) return;

        if (this.filteredProjects.length === 0) {
            body.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 4rem; opacity: 0.6;">
                        <i class="fa-solid fa-folder-open" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                        <p style="color: var(--text-secondary);">No projects found</p>
                    </td>
                </tr>
            `;
            return;
        }

        body.innerHTML = this.filteredProjects.map(project => {
            // Determine mode badge
            const isDirectBOQ = project.inquiry_type === 'PROJECT_LEVEL';
            const modeBadge = isDirectBOQ
                ? '<span style="background:#FEF3C7; color:#92400E; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:600;"><i class="fa-solid fa-bolt"></i> BOQ</span>'
                : '<span style="background:#DBEAFE; color:#1E40AF; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:600;"><i class="fa-solid fa-layer-group"></i> Config</span>';

            // BOQ count (from backend if available, otherwise 0)
            const boqCount = project.boq_count || 0;

            return `
                <tr onclick="ProjectsPage.viewProject(${project.id})">
                    <td>
                        <div class="project-name-cell">${Utils.escapeHtml(project.name)}</div>
                        <div class="project-sub-info">${project.project_code || 'PROJ-' + project.id}</div>
                    </td>
                    <td>${Utils.escapeHtml(project.client_name)}</td>
                    <td>${modeBadge}</td>
                    <td style="text-align: center;">
                        ${boqCount > 0
                    ? `<span style="background:#E2E8F0; padding:4px 12px; border-radius:4px; font-weight:600; color:var(--text-main);">${boqCount}</span>`
                    : '<span style="opacity:0.4;">—</span>'}
                    </td>
                    <td>
                        <span class="badge status-${(project.status || 'inquiry').toLowerCase()}">
                            ${project.status || 'INQUIRY'}
                        </span>
                    </td>
                    <td style="text-align: right;" onclick="event.stopPropagation()">
                        <button class="btn btn-secondary btn-sm" onclick="ProjectsPage.viewProject(${project.id})">
                            View
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    updateStats() {
        const total = this.projects.length;
        const active = this.projects.filter(p => p.status === 'ACTIVE').length;
        const onHold = this.projects.filter(p => p.status === 'ON_HOLD').length;
        const completed = this.projects.filter(p => p.status === 'COMPLETED').length;

        document.getElementById('total-projects').textContent = total;
        document.getElementById('active-projects').textContent = active;
        document.getElementById('onhold-projects').textContent = onHold;
        document.getElementById('completed-projects').textContent = completed;
    },

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('form-project');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Search
        const searchInput = document.getElementById('project-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => this.applyFilters(), 300));
        }

        // Filters
        const statusFilter = document.getElementById('status-filter');
        const segmentFilter = document.getElementById('segment-filter');

        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }

        if (segmentFilter) {
            segmentFilter.addEventListener('change', () => this.applyFilters());
        }
    },

    applyFilters() {
        const searchTerm = document.getElementById('project-search')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('status-filter')?.value || '';
        const segmentFilter = document.getElementById('segment-filter')?.value || '';

        this.filteredProjects = this.projects.filter(project => {
            const matchesSearch = !searchTerm ||
                project.name.toLowerCase().includes(searchTerm) ||
                project.client_name.toLowerCase().includes(searchTerm) ||
                (project.project_code && project.project_code.toLowerCase().includes(searchTerm));

            const matchesStatus = !statusFilter || project.status === statusFilter;
            const matchesSegment = !segmentFilter || project.segment_area === segmentFilter;

            return matchesSearch && matchesStatus && matchesSegment;
        });

        this.renderProjects();
    },

    openCreateDrawer() {
        document.getElementById('drawer-title').textContent = 'Add Project';
        document.getElementById('btn-save-project').textContent = 'Save Project';
        document.getElementById('form-project').reset();
        document.getElementById('project-id').value = '';

        // Ensure first radio is checked on reset if needed
        const radio = document.querySelector('input[name="inquiry_type"][value="AREA_WISE"]');
        if (radio) radio.checked = true;

        document.getElementById('overlay-project-drawer').style.display = 'block';
        document.getElementById('project-drawer').classList.add('open');
    },

    closeCreateDrawer() {
        document.getElementById('overlay-project-drawer').style.display = 'none';
        document.getElementById('project-drawer').classList.remove('open');
    },

    async editProject(id) {
        try {
            const project = await API.projects.get(id);

            document.getElementById('modal-title-text').textContent = 'Edit Project';
            document.getElementById('submit-btn-text').textContent = 'Update Project';

            document.getElementById('project-id').value = project.id;
            document.getElementById('project-name').value = project.name;
            document.getElementById('project-client').value = project.client_name;
            document.getElementById('project-code').value = project.project_code || '';
            document.getElementById('project-status').value = project.status;
            document.getElementById('project-segment').value = project.segment_area || 'MASTER PLANNING';
            document.getElementById('project-fee').value = project.fee || 0;
            document.getElementById('project-description').value = project.description || '';

            // New Fields
            document.getElementById('project-notes').value = project.notes || '';
            document.getElementById('project-tags').value = project.tags || '';
            document.getElementById('project-referred').value = project.refered_by || '';
            document.getElementById('project-mhr').value = project.expecetd_mhr || 0;
            document.getElementById('project-completion').value = project.expected_completion_date || '';

            // Location Metadata
            const loc = project.location_metadata || {};
            document.getElementById('loc-address').value = loc.address || '';
            document.getElementById('loc-city').value = loc.city || '';
            document.getElementById('loc-state').value = loc.state || '';
            document.getElementById('loc-country').value = loc.country || 'India';

            // Area Details
            const ad = project.area_details || {};
            document.getElementById('area-landscape').value = ad.landscape_area || 0;
            document.getElementById('unit-landscape').value = ad.landscape_area_unit || 'sq.ft';
            document.getElementById('area-interior').value = ad.interior_area || 0;
            document.getElementById('unit-interior').value = ad.interior_area_unit || 'sq.ft';
            document.getElementById('area-facade').value = ad.facade_area || 0;
            document.getElementById('unit-facade').value = ad.facade_area_unit || 'sq.ft';

            document.getElementById('project-error').style.display = 'none';
            Modals.open('modal-project-form');
        } catch (error) {
            console.error('Failed to load project:', error);
            Utils.showToast('Failed to load project details', 'error');
        }
    },

    async handleSubmit(e) {
        e.preventDefault();

        const projectId = document.getElementById('project-id').value;
        const inquiryType = document.querySelector('input[name="inquiry_type"]:checked')?.value || 'AREA_WISE';

        const data = {
            name: document.getElementById('project-name').value,
            client_name: document.getElementById('project-client').value,
            inquiry_type: inquiryType,
            status: document.getElementById('project-status').value,
            segment_area: document.getElementById('project-segment').value,
            fee: parseInt(document.getElementById('project-fee').value) || 0,

            // Location metadata partial
            location_metadata: {
                city: document.getElementById('loc-city').value
            }
        };

        try {
            if (projectId) {
                // Update existing project
                await API.projects.update(projectId, data);
                Utils.showToast('Project updated successfully!', 'success');
            } else {
                // Create new project
                await API.projects.create(data);
                Utils.showToast('Project created successfully!', 'success');
            }

            this.closeCreateDrawer();
            e.target.reset();
            await this.loadProjects();
        } catch (error) {
            console.error('Failed to save project:', error);
            const errorEl = document.getElementById('project-error');
            errorEl.textContent = error.message || 'Failed to save project';
            errorEl.style.display = 'flex';
        }
    },

    viewProject(id) {
        window.location.href = `/projects/${id}/`;
    },

    async deleteProject(id) {
        if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            return;
        }

        try {
            await API.projects.delete(id);
            Utils.showToast('Project deleted successfully!', 'success');
            await this.loadProjects();
        } catch (error) {
            console.error('Failed to delete project:', error);
            Utils.showToast('Failed to delete project', 'error');
        }
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    ProjectsPage.init();
});

// Export for use
window.ProjectsPage = ProjectsPage;
