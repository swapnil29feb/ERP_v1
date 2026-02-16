// Project Detail Page Logic
const ProjectDetail = {
    projectId: null,
    project: null,
    areas: [],

    async init() {
        // Get project ID from URL (/projects/123/)
        const pathParts = window.location.pathname.split('/');
        this.projectId = parseInt(pathParts[2]);

        if (!this.projectId || isNaN(this.projectId)) {
            Utils.showToast('Invalid Project ID', 'error');
            console.error('[ProjectDetail] Invalid Project ID:', pathParts[2]);
            return;
        }

        await this.loadProject();
        await this.loadAreas();
        this.setupEventListeners();
    },

    async loadProject() {
        try {
            this.project = await API.get(`/projects/${this.projectId}/`);

            // Update UI
            document.getElementById('pd-name').innerHTML = `
                <i class="fa-solid fa-building" style="color: var(--primary); margin-right: 0.5rem;"></i>
                ${this.project.name}
            `;
            document.getElementById('pd-client').textContent = this.project.client_name;
            document.getElementById('pd-code').textContent = this.project.project_code || 'N/A';
            document.getElementById('pd-segment').textContent = this.project.segment_area || 'N/A';
            document.getElementById('pd-fee').textContent = `₹ ${Utils.formatCurrency(this.project.fee || 0)}`;
            document.getElementById('pd-description').textContent = this.project.description || 'No description provided.';
            document.getElementById('pd-completion').textContent = this.project.expected_completion_date || 'TBD';
            document.getElementById('pd-mhr').textContent = this.project.expecetd_mhr || 0;
            document.getElementById('pd-referred').textContent = this.project.refered_by || 'Direct';

            // Location
            const loc = this.project.location_metadata || {};
            const address = [loc.address, loc.city, loc.state, loc.country].filter(Boolean).join(', ');
            document.getElementById('pd-location').textContent = address || 'No address specified';

            // Area Details
            const ad = this.project.area_details || {};
            const areaGrid = document.getElementById('pd-areas');
            areaGrid.innerHTML = `
                <span><strong>Landscape:</strong> ${ad.landscape_area || 0} ${ad.landscape_area_unit || 'sq.ft'}</span>
                <span><strong>Interior:</strong> ${ad.interior_area || 0} ${ad.interior_area_unit || 'sq.ft'}</span>
                <span><strong>Facade:</strong> ${ad.facade_area || 0} ${ad.facade_area_unit || 'sq.ft'}</span>
            `;

            const statusBadge = document.getElementById('pd-status');
            statusBadge.textContent = this.project.status;
            statusBadge.className = `role-badge badge-viewer status-${this.project.status.toLowerCase()}`;

            // Update BOQ link
            document.getElementById('btn-boq').href = `/boq/?project_id=${this.projectId}`;
        } catch (error) {
            console.error('Failed to load project:', error);
            Utils.showToast('Failed to load project details', 'error');
        }
    },

    async loadAreas(query = '') {
        try {
            const url = `/projects/${this.projectId}/areas/${query ? `?q=${encodeURIComponent(query)}` : ''}`;
            const response = await API.get(url);
            this.areas = response || [];
            this.renderAreas();
        } catch (error) {
            console.error('Failed to load areas:', error);
        }
    },

    renderAreas() {
        const body = document.getElementById('areas-list-body');
        if (!body) return;

        if (this.areas.length === 0) {
            body.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 4rem; opacity: 0.6;">No areas found. Add your first area to begin.</td></tr>';
            return;
        }

        body.innerHTML = this.areas.map(area => `
            <tr onclick="ProjectDetail.selectArea(${area.id}, this)">
                <td><div style="font-weight: 600;">${area.name}</div></td>
                <td><code class="product-code-badge">${area.area_code}</code></td>
                <td>${area.floor || '-'}</td>
                <td>${area.area_type || '-'}</td>
                <td style="text-align: center;">
                    <span class="role-badge badge-viewer" style="background: hsla(220, 25%, 20%, 0.5);">${area.product_count || 0}</span>
                </td>
                <td style="text-align: right;" onclick="event.stopPropagation()">
                    <button class="btn btn-primary btn-sm" onclick="window.location.href='/projects/${this.projectId}/areas/${area.id}/'">
                        <i class="fa-solid fa-eye"></i> View Area
                    </button>
                </td>
            </tr>
        `).join('');
    },

    selectArea(id, row) {
        // Just highlight, no side pane as per "Dashboards are for actions"
        const table = row.closest('table');
        table.querySelectorAll('tr').forEach(tr => tr.classList.remove('selected'));
        row.classList.add('selected');
    },

    // Configuration System (Adapted for Dashboard)
    async openConfigurationModal(areaId, areaName) {
        this.currentAreaId = areaId;
        document.getElementById('config-area-id').value = areaId;
        document.getElementById('config-area-name-display').textContent = areaName;
        document.getElementById('form-configuration').reset();
        document.getElementById('accessories-container').innerHTML = '';

        // Load Masters for selects (Cached or Fresh)
        await this.loadMasterSelects();

        Modals.open('drawer-configuration');
    },

    async loadMasterSelects() {
        if (this.mastersLoaded) return;

        try {
            const [products, drivers, accessories] = await Promise.all([
                API.get('/masters/products/'),
                API.get('/masters/drivers/'),
                API.get('/masters/accessories/')
            ]);

            this.masterProducts = products || [];
            this.masterDrivers = drivers || [];
            this.masterAccessories = accessories || [];

            const pSelect = document.getElementById('select-product');
            const dSelect = document.getElementById('select-driver');

            pSelect.innerHTML = '<option value="">-- Choose a Product --</option>' +
                this.masterProducts.map(p => `<option value="${p.prod_id}">${p.make} - ${p.order_code || 'No Code'} (₹${p.base_price})</option>`).join('');

            dSelect.innerHTML = '<option value="">-- No Driver --</option>' +
                this.masterDrivers.map(d => `<option value="${d.id}">${d.driver_make} - ${d.driver_code} (₹${d.base_price})</option>`).join('');

            this.mastersLoaded = true;
        } catch (error) {
            console.error('Failed to load masters:', error);
            Utils.showToast('Error loading master data', 'error');
        }
    },

    addAccessoryRow() {
        const container = document.getElementById('accessories-container');
        const count = container.children.length;

        const row = document.createElement('div');
        row.className = 'accessory-row';
        row.innerHTML = `
            <div class="form-group">
                <label style="font-size: 0.7rem;">Accessory</label>
                <select class="form-control acc-select" required>
                    <option value="">-- Select Accessory --</option>
                    ${this.masterAccessories.map(a => `<option value="${a.id}">${a.accessory_name} (₹${a.base_price})</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label style="font-size: 0.7rem;">Qty</label>
                <input type="number" class="form-control acc-qty" value="1" min="1" required>
            </div>
            <button type="button" class="btn-icon btn-danger" style="padding: 0.5rem;" onclick="this.parentElement.remove()">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        container.appendChild(row);
    },

    async handleConfigurationSubmit(e) {
        e.preventDefault();
        const areaId = document.getElementById('config-area-id').value;
        const productId = document.getElementById('select-product').value;
        const productQty = parseInt(document.getElementById('prod-qty').value);
        const driverId = document.getElementById('select-driver').value;
        const driverQty = parseInt(document.getElementById('driver-qty').value);

        const accessories = Array.from(document.querySelectorAll('.accessory-row')).map(row => ({
            accessory: row.querySelector('.acc-select').value,
            quantity: parseInt(row.querySelector('.acc-qty').value)
        }));

        const data = {
            area: areaId,
            product: productId,
            product_quantity: productQty,
            driver_records: driverId ? [{
                driver: driverId,
                quantity: driverQty
            }] : [],
            accessory_records: accessories
        };

        try {
            await API.post(`/projects/${this.projectId}/areas/${areaId}/configurations/`, data);
            Utils.showToast('Configuration created!', 'success');
            Modals.close('drawer-configuration');
            await this.loadAreas();
        } catch (error) {
            console.error('Failed to create configuration:', error);
            Utils.showToast(error.message || 'Failed to create configuration', 'error');
        }
    },

    setupEventListeners() {
        const formArea = document.getElementById('form-add-area');
        if (formArea) {
            formArea.addEventListener('submit', (e) => this.handleAddArea(e));
        }

        const formConfig = document.getElementById('form-configuration');
        if (formConfig) {
            formConfig.addEventListener('submit', (e) => this.handleConfigurationSubmit(e));
        }

        // Search
        document.getElementById('area-search')?.addEventListener('input', Utils.debounce((e) => {
            this.loadAreas(e.target.value);
        }, 300));
    },

    openAddAreaModal() {
        Modals.open('modal-add-area');
    },

    async handleAddArea(e) {
        e.preventDefault();
        const data = {
            name: document.getElementById('area-name').value,
            area_code: document.getElementById('area-code').value,
            area_type: document.getElementById('area-type').value,
            floor: document.getElementById('area-floor').value,
            area_size: document.getElementById('area-size').value || 0,
            area_unit: document.getElementById('area-unit').value,
            description: document.getElementById('area-description').value,
            project: this.projectId
        };

        try {
            await API.post(`/projects/${this.projectId}/areas/`, data);
            Utils.showToast('Area added successfully!', 'success');
            Modals.close('modal-add-area');
            e.target.reset();
            await this.loadAreas();
        } catch (error) {
            console.error('Failed to add area:', error);
            Utils.showToast('Failed to add area', 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ProjectDetail.init();
});

window.ProjectDetail = ProjectDetail;
