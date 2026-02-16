// Dashboard Page Logic
const Dashboard = {
    projects: [],

    async init() {
        await this.loadProjects();
        this.setupEventListeners();
    },

    async loadProjects() {
        try {
            this.projects = await API.projects.list();
            this.renderProjects();
            this.updateStats();
        } catch (error) {
            console.error('Failed to load projects:', error);
            Utils.showToast('Failed to load projects', 'error');
        }
    },

    renderProjects() {
        const grid = document.getElementById('projects-grid');
        if (!grid) return;

        if (this.projects.length === 0) {
            grid.innerHTML = `
                <div class="card" style="text-align: center; padding: 3rem; opacity: 0.6;">
                    <i class="fa-solid fa-folder-open" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-secondary);">No projects yet. Create your first project to get started!</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.projects.map(project => `
            <div class="project-card" onclick="window.location.href='/projects/${project.id}/'">
                <div class="project-card-header">
                    <div>
                        <div class="project-card-title">${project.name}</div>
                        <div class="project-card-code">${project.code}</div>
                    </div>
                </div>
                <div class="project-card-meta">
                    <div class="project-card-meta-item">
                        <i class="fa-solid fa-user"></i>
                        ${project.client_name}
                    </div>
                    <div class="project-card-meta-item">
                        <i class="fa-solid fa-calendar"></i>
                        ${Utils.formatDate(project.created_at)}
                    </div>
                </div>
            </div>
        `).join('');
    },

    updateStats() {
        const totalEl = document.getElementById('total-projects');
        const activeEl = document.getElementById('active-projects');

        if (totalEl) totalEl.textContent = this.projects.length;
        if (activeEl) activeEl.textContent = this.projects.filter(p => p.status === 'ACTIVE').length;
    },

    setupEventListeners() {
        const form = document.getElementById('form-create-project');
        if (form) {
            form.addEventListener('submit', (e) => this.handleCreateProject(e));
        }
    },

    openCreateModal() {
        Modals.open('modal-create-project');
    },

    async handleCreateProject(e) {
        e.preventDefault();

        const data = {
            name: document.getElementById('p-name').value,
            client_name: document.getElementById('p-client').value,
            code: document.getElementById('p-code').value || undefined,
            description: document.getElementById('p-desc').value || undefined
        };

        try {
            await API.projects.create(data);
            Utils.showToast('Project created successfully!', 'success');
            Modals.close('modal-create-project');
            e.target.reset();
            await this.loadProjects();
        } catch (error) {
            console.error('Failed to create project:', error);
            Utils.showToast('Failed to create project', 'error');
        }
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});

// Export for use
window.Dashboard = Dashboard;
