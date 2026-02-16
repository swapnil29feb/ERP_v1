// Bill of Quantities Module Logic
const BOQ = {
    projectId: null,
    boqId: null,
    boqData: null,
    boqItems: null,
    isDraft: false,
    editingItem: null,

    async init() {
        // Standalone support
        const urlParams = new URLSearchParams(window.location.search);
        const rawProjectId = urlParams.get('project_id');
        if (rawProjectId) {
            this.projectId = parseInt(rawProjectId);
            this.loadBOQVersions();
        }
    },

    initFromWorkspace(projectId) {
        this.projectId = projectId;
        this.loadBOQVersions();
    },

    async loadBOQVersions() {
        const container = document.getElementById('boq-active-content');
        const emptyState = document.getElementById('boq-tab-empty');
        if (!container) return;

        container.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = `<div style="text-align:center; padding:3rem;"><i class="fa-solid fa-spinner fa-spin"></i> Loading BOQ History...</div>`;

        try {
            const response = await API.get(`/boq/versions/${this.projectId}/`);
            this.renderVersionList(response || []);
        } catch (error) {
            console.error('Failed to load BOQ versions:', error);
            container.innerHTML = `<div class="alert alert-danger">Failed to load BOQ history.</div>`;
        }
    },

    renderVersionList(versions) {
        const container = document.getElementById('boq-active-content');

        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; background: var(--bg-card); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border-divider);">
                <div>
                    <h3 style="margin:0;">Bill of Quantities History</h3>
                    <p style="color:var(--text-muted); font-size:13px; margin:4px 0 0 0;">Manage and view all versions of this project's BOQ.</p>
                </div>
                <button class="btn btn-primary" onclick="BOQ.generate()">
                    <i class="fa-solid fa-rotate"></i> Generate New Version
                </button>
            </div>
            
            <div class="card" style="padding:0; overflow:hidden;">
                <table class="boq-table" style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background:var(--bg-app); border-bottom:1px solid var(--border-divider);">
                            <th style="padding:1rem; text-align:left;">Version</th>
                            <th style="padding:1rem; text-align:left;">Status</th>
                            <th style="padding:1rem; text-align:left;">Generated On</th>
                            <th style="padding:1rem; text-align:right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (versions.length === 0) {
            html += `<tr><td colspan="4" style="text-align:center; padding:5rem; color:var(--text-muted);">
                <i class="fa-solid fa-inbox" style="font-size:3rem; opacity:0.1; display:block; margin-bottom:1rem;"></i>
                No BOQ versions generated yet.
            </td></tr>`;
        } else {
            versions.forEach(v => {
                const statusColor = v.status === 'DRAFT' ? '#fbbf24' : '#10b981';
                const statusIcon = v.status === 'DRAFT' ? 'fa-pen-ruler' : 'fa-lock';
                html += `
                    <tr style="border-bottom:1px solid var(--border-divider);">
                        <td style="padding:1rem;"><strong>v${v.version}</strong></td>
                        <td style="padding:1rem;">
                            <span class="badge" style="background: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}30; padding: 4px 10px; font-weight:600; font-size:11px;">
                                <i class="fa-solid ${statusIcon}" style="font-size:10px;"></i> ${v.status}
                            </span>
                        </td>
                        <td style="padding:1rem; color:var(--text-secondary); font-size:13px;">${new Date(v.created_at).toLocaleString()}</td>
                        <td style="padding:1rem; text-align:right;">
                            <button class="btn btn-secondary btn-sm" onclick="BOQ.viewVersion(${v.id})">
                                <i class="fa-solid fa-eye"></i> View Detail
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        html += `</tbody></table></div>`;
        container.innerHTML = html;
    },

    async viewVersion(boqId) {
        this.boqId = boqId;
        await this.loadSpecificBOQ();
    },

    async loadSpecificBOQ() {
        const container = document.getElementById('boq-active-content');
        container.innerHTML = `<div style="text-align:center; padding:5rem;"><i class="fa-solid fa-spinner fa-spin"></i> Loading BOQ Detail...</div>`;

        try {
            const response = await API.get(`/boq/summary/detail/${this.boqId}/`);
            if (response && response.boq_id) {
                this.boqData = response;
                this.isDraft = response.status === 'DRAFT';
                await this.loadBOQItems();
                this.renderBOQDetail();
            }
        } catch (error) {
            console.error('Failed to load BOQ detail:', error);
            Utils.showToast('Failed to load BOQ detail', 'error');
        }
    },

    async loadBOQItems() {
        try {
            const response = await API.get(`/boq/items/?boq_id=${this.boqId}`);
            this.boqItems = response.results || response || [];
        } catch (error) {
            console.error('Error loading BOQ items:', error);
            this.boqItems = [];
        }
    },

    renderBOQDetail() {
        const container = document.getElementById('boq-active-content');

        let totalFinalVal = 0;
        let totalItems = 0;
        this.boqItems.forEach(item => {
            totalFinalVal += parseFloat(item.final_price || 0);
            totalItems += parseInt(item.quantity || 0);
        });

        const statusColor = this.isDraft ? '#fbbf24' : '#10b981';
        const statusIcon = this.isDraft ? 'fa-pen-ruler' : 'fa-lock';

        let html = `
            <div style="margin-bottom:1.5rem; display:flex; align-items:center; gap:1rem;">
                <button class="btn btn-secondary btn-sm" onclick="BOQ.loadBOQVersions()">
                    <i class="fa-solid fa-arrow-left"></i> History
                </button>
                <h3 style="margin:0;">BOQ v${this.boqData.version}</h3>
                <span class="badge" style="background: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}30;">
                    <i class="fa-solid ${statusIcon}"></i> ${this.boqData.status}
                </span>
            </div>

            <div class="grid grid-3" style="margin-bottom: 2rem;">
                <div class="stats-card">
                    <div class="stats-label">Total Items</div>
                    <div class="stats-value">${totalItems}</div>
                </div>
                <div class="stats-card">
                    <div class="stats-label">Configuration Version</div>
                    <div class="stats-value">v${this.boqData.source_configuration_version || 'N/A'}</div>
                </div>
                <div class="stats-card" style="border-left: 4px solid var(--accent);">
                    <div class="stats-label">Total Amount</div>
                    <div class="stats-value" style="color: var(--accent); font-family:monospace;">${Utils.formatCurrency(totalFinalVal)}</div>
                </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; padding:1rem; background:var(--bg-card); border-radius:8px; border:1px solid var(--border-divider);">
                <div style="display:flex; gap:1rem; align-items:center;">
                    ${this.isDraft ? `
                        <div style="display:flex; align-items:center; gap:0.5rem; background:rgba(251,191,36,0.1); padding:4px 12px; border-radius:4px; border:1px solid rgba(251,191,36,0.3);">
                            <label style="font-size:12px; font-weight:600;">Global Margin:</label>
                            <input type="number" id="global-margin-input" class="form-control" style="width:80px; height:28px; font-size:12px;" placeholder="0.00" step="0.01">
                            <span style="font-size:12px;">%</span>
                            <button class="btn btn-warning btn-sm" style="padding:2px 8px; font-size:11px;" onclick="BOQ.applyMargin()">Apply</button>
                        </div>
                    ` : '<span style="color:var(--text-muted); font-size:13px;"><i class="fa-solid fa-info-circle"></i> This BOQ is locked and read-only.</span>'}
                </div>
                <div style="display:flex; gap:0.75rem;">
                    ${this.isDraft ? `
                        <button class="btn btn-success btn-sm" onclick="BOQ.approve()">
                            <i class="fa-solid fa-check-double"></i> Approve & Lock
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary btn-sm" onclick="BOQ.export('pdf')">
                        <i class="fa-solid fa-file-pdf" style="color:#ef4444;"></i> Export PDF
                    </button>
                    ${!this.isDraft ? `
                        <button class="btn btn-secondary btn-sm" onclick="BOQ.export('excel')">
                            <i class="fa-solid fa-file-excel" style="color:#10b981;"></i> Export Excel
                        </button>
                    ` : ''}
                </div>
            </div>

            <div id="boq-detail-tables">
                ${this.renderBOQItemsByArea()}
            </div>
        `;

        container.innerHTML = html;
    },

    renderBOQItemsByArea() {
        const itemsByArea = {};
        this.boqItems.forEach(item => {
            const areaName = item.area_name || 'Unknown Area';
            if (!itemsByArea[areaName]) itemsByArea[areaName] = [];
            itemsByArea[areaName].push(item);
        });

        return Object.entries(itemsByArea).map(([areaName, items]) => {
            const areaTotal = items.reduce((sum, i) => sum + parseFloat(i.final_price || 0), 0);
            return `
                <div class="card" style="padding:0; margin-bottom:2rem; overflow:hidden;">
                    <div style="background:var(--bg-app); padding:1rem 1.5rem; border-bottom:1px solid var(--border-divider); display:flex; justify-content:space-between; align-items:center;">
                        <h4 style="margin:0;"><i class="fa-solid fa-map-location-dot"></i> ${areaName}</h4>
                        <span style="font-weight:700; color:var(--primary);">${Utils.formatCurrency(areaTotal)}</span>
                    </div>
                    <table class="boq-table" style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="background:var(--bg-app); border-bottom:1px solid var(--border-divider);">
                                <th style="padding:0.75rem 1.5rem; text-align:left; font-size:12px; color:var(--text-muted);">Item Description</th>
                                <th style="padding:0.75rem 1.5rem; text-align:center; font-size:12px; color:var(--text-muted);">Qty</th>
                                <th style="padding:0.75rem 1.5rem; text-align:right; font-size:12px; color:var(--text-muted);">Base Price</th>
                                <th style="padding:0.75rem 1.5rem; text-align:center; font-size:12px; color:var(--text-muted);">Margin</th>
                                <th style="padding:0.75rem 1.5rem; text-align:right; font-size:12px; color:var(--text-muted);">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => this.renderBOQRow(item)).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }).join('');
    },

    renderBOQRow(item) {
        const itemRef = this.getItemReference(item);
        const basePrice = parseFloat(item.unit_price || 0);
        const masterPrice = parseFloat(item.master_price || 0);

        const priceDisplay = this.isDraft
            ? `<div style="display:flex; align-items:center; justify-content:flex-end; gap:8px;">
                   <input type="number" 
                      class="form-control" 
                      value="${basePrice.toFixed(2)}" 
                      style="width:100px; height:28px; text-align:right; font-size:12px; font-family:monospace;"
                      onchange="BOQ.handleInlinePriceChange(this, ${item.id})"
                      title="Master Price: ₹${Utils.formatCurrency(masterPrice)}">
                   ${basePrice !== masterPrice ? '<span title="Price overridden" style="color:#fbbf24;">•</span>' : ''}
               </div>`
            : `<span style="font-family:monospace;">${Utils.formatCurrency(basePrice)}</span>`;

        return `
            <tr style="border-bottom:1px solid var(--border-divider);">
                <td style="padding:1rem 1.5rem;">
                    <div style="font-weight:600; font-size:13px;">${itemRef}</div>
                    <div style="font-size:11px; color:var(--text-muted); background:var(--bg-app); display:inline-block; padding:2px 6px; border-radius:4px; margin-top:4px;">${item.item_type}</div>
                </td>
                <td style="padding:1rem 1.5rem; text-align:center; font-weight:700;">${item.quantity}</td>
                <td style="padding:1rem 1.5rem; text-align:right;">${priceDisplay}</td>
                <td style="padding:1rem 1.5rem; text-align:center; color:var(--text-secondary); font-size:12px;">${parseFloat(item.markup_pct).toFixed(2)}%</td>
                <td style="padding:1rem 1.5rem; text-align:right; font-weight:700; color:var(--primary); font-family:monospace;">${Utils.formatCurrency(item.final_price)}</td>
            </tr>
        `;
    },

    getItemReference(item) {
        if (item.product_details) return item.product_details.name || item.product_details.order_code;
        if (item.driver_details) return `Driver: ${item.driver_details.driver_code}`;
        if (item.accessory_details) return `Accessory: ${item.accessory_details.name}`;
        return `Item ${item.id}`;
    },

    async handleInlinePriceChange(inputEl, itemId) {
        const newPrice = parseFloat(inputEl.value);
        if (isNaN(newPrice) || newPrice < 0) {
            Utils.showToast('Invalid price', 'warning');
            return;
        }

        try {
            await API.patch(`/boq/items/${itemId}/price/`, { unit_price: newPrice });
            Utils.showToast('Price updated', 'success');
            await this.loadSpecificBOQ(); // Reload to update totals
        } catch (error) {
            console.error('Error updating price:', error);
            Utils.showToast(error.response?.data?.detail || 'Failed to update price', 'error');
        }
    },

    async generate() {
        if (!this.projectId) return;
        try {
            Utils.showToast('Generating BOQ...', 'info');
            await API.post(`/boq/generate/${this.projectId}/`);
            Utils.showToast('BOQ generated successfully!', 'success');
            await this.loadBOQVersions();
        } catch (error) {
            console.error('Generation Error:', error);
            Utils.showToast(error.response?.data?.detail || 'Failed to generate BOQ', 'error');
        }
    },

    async applyMargin() {
        const input = document.getElementById('global-margin-input');
        const markupPct = parseFloat(input?.value);
        if (isNaN(markupPct) || markupPct < 0) {
            Utils.showToast('Enter valid margin %', 'warning');
            return;
        }

        try {
            await API.post(`/boq/apply-margin/${this.boqId}/`, { markup_pct: markupPct });
            Utils.showToast(`Margin applied`, 'success');
            await this.loadSpecificBOQ();
        } catch (error) {
            Utils.showToast('Failed to apply margin', 'error');
        }
    },

    async approve() {
        if (!confirm('This BOQ will be LOCKED permanently.\nNo further changes will be allowed.')) return;
        try {
            await API.post(`/boq/approve/${this.boqId}/`);
            Utils.showToast('BOQ Approved & Locked', 'success');
            await this.loadSpecificBOQ();
        } catch (error) {
            Utils.showToast('Approval failed', 'error');
        }
    },

    export(format) {
        const token = API.getToken();
        const url = `/api/boq/export/${format}/${this.boqId}/?token=${token}`;
        window.open(url, '_blank');
    }
};

document.addEventListener('DOMContentLoaded', () => BOQ.init());
window.BOQ = BOQ;
