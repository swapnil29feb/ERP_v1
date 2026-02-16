/**
 * =====================================================
 * ERP WORKSPACE CONTROLLER - STATE-DRIVEN ARCHITECTURE
 * =====================================================
 * Strict hierarchical flow: Project → Area → Subarea → Configuration
 * UI is a pure function of state. No manual DOM manipulation.
 */
const ERPWorkspace = {
    // ========== CENTRAL STATE (SINGLE SOURCE OF TRUTH) ==========
    state: {
        projectId: null,
        project: null,
        areas: [],
        selectedAreaId: null,
        selectedArea: null,
        subareas: [],
        selectedSubareaId: null,
        selectedSubarea: null,
        configurations: [],
        currentConfigTab: 'luminaria'
    },

    // ========== INITIALIZATION ==========
    async init() {
        console.log("🚀 ERPWorkspace.init() - STATE-DRIVEN MODE");
        const pathParts = window.location.pathname.split('/');
        this.state.projectId = pathParts.find((p, i) => i > 0 && !isNaN(p) && pathParts[i - 1] === 'projects');

        if (!this.state.projectId) {
            console.error("❌ No project ID found in URL");
            return;
        }

        console.log("✅ Project ID:", this.state.projectId);
        await this.loadProject();

        // ========== PROJECT MODE ENFORCEMENT ==========
        if (!this.state.project) {
            console.error("❌ Project not loaded, cannot determine mode");
            return;
        }

        const projectMode = this.state.project.inquiry_type;
        console.log("🔐 PROJECT MODE:", projectMode);

        if (projectMode === 'PROJECT_LEVEL') {
            // DIRECT BOQ MODE - No Areas/Subareas
            console.warn("⚠️ DIRECT BOQ MODE DETECTED");
            console.warn("   Redirecting to BOQ-only workspace...");
            this.enforceDirectBOQMode();
            return; // Stop normal initialization
        }

        if (projectMode === 'AREA_WISE') {
            // CONFIGURATION MODE - Full 3-pane hierarchy
            console.log("✅ CONFIGURATION MODE - Full hierarchy enabled");
            this.enforceConfigurationMode();
        }

        await this.loadAreas();
        this.setupEventListeners();
        this.updateUI(); // Render based on initial state
    },

    // ========== STATE UPDATERS (ONLY WAY TO CHANGE STATE) ==========

    async loadProject() {
        try {
            this.state.project = await API.projects.get(this.state.projectId);
            console.log("✅ PROJECT LOADED:", this.state.project.name);

            // Display mode badge
            const modeBadge = document.getElementById('project-mode-badge');
            if (modeBadge && this.state.project.inquiry_type) {
                const isDirectBOQ = this.state.project.inquiry_type === 'PROJECT_LEVEL';
                modeBadge.innerHTML = isDirectBOQ
                    ? `<span style="background:#FEF3C7; color:#92400E; padding:6px 12px; border-radius:4px; font-size:12px; font-weight:600; display:inline-flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-bolt"></i> DIRECT BOQ MODE
                    </span>`
                    : `<span style="background:#DBEAFE; color:#1E40AF; padding:6px 12px; border-radius:4px; font-size:12px; font-weight:600; display:inline-flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-layer-group"></i> CONFIGURATION MODE
                    </span>`;
            }

            this.updateUI();
        } catch (e) {
            console.error("❌ Project load failed:", e);
        }
    },

    async loadAreas() {
        try {
            this.state.areas = await API.areas.list(this.state.projectId);
            console.log("✅ AREAS LOADED:", this.state.areas.length);
            this.updateUI();
        } catch (e) {
            console.error("❌ Areas load failed:", e);
        }
    },

    // ========== MODE ENFORCEMENT (HARD GUARDS) ==========

    enforceDirectBOQMode() {
        console.log("🟩 ENFORCING DIRECT BOQ MODE");
        console.log("   ❌ Areas pane: HIDDEN");
        console.log("   ❌ Subareas pane: HIDDEN");
        console.log("   ✅ BOQ workspace: VISIBLE");

        // Hide all area/subarea UI
        const areaPane = document.getElementById('pane-areas');
        const subareaPane = document.getElementById('pane-subareas');
        const placeholder = document.getElementById('workspace-initial-placeholder');

        if (areaPane) areaPane.style.display = 'none';
        if (subareaPane) subareaPane.style.display = 'none';
        if (placeholder) placeholder.style.display = 'none';

        // Show BOQ workspace directly
        const configPane = document.getElementById('pane-config');
        if (configPane) {
            configPane.style.display = 'flex';
            configPane.style.flex = '1'; // Take full width

            // Update header
            const header = document.getElementById('config-header-title');
            if (header) header.textContent = `Direct BOQ – ${this.state.project.name}`;

            // Update breadcrumbs with warning badge
            const breadcrumbs = document.getElementById('config-breadcrumbs');
            if (breadcrumbs) {
                breadcrumbs.innerHTML = `
                    <span style="background:#FEF3C7; color:#92400E; padding:4px 12px; border-radius:4px; font-size:12px; font-weight:600;">
                        <i class="fa-solid fa-bolt"></i> DIRECT BOQ MODE (No Areas/Subareas)
                    </span>
                `;
            }
        }

        // Setup pseudo-state for BOQ mode
        this.state.selectedSubarea = {
            id: 'PROJECT_LEVEL',
            name: `${this.state.project.name} (Project BOQ)`
        };

        // Load BOQ directly
        this.loadDirectBOQ();
    },

    enforceConfigurationMode() {
        console.log("🟦 ENFORCING CONFIGURATION MODE");
        console.log("   ✅ Full 3-pane hierarchy enabled");
        console.log("   ✅ Area → Subarea → Configuration flow active");

        // Ensure normal layout is visible
        const areaPane = document.getElementById('pane-areas');
        if (areaPane) areaPane.style.display = 'flex';

        // Mode badge (optional)
        const layoutContainer = document.getElementById('layout-area-wise');
        if (layoutContainer) {
            layoutContainer.setAttribute('data-mode', 'CONFIGURATION');
        }
    },

    async loadDirectBOQ() {
        console.log("🔍 LOADING DIRECT BOQ for project:", this.state.projectId);

        // In DIRECT BOQ mode, use /api/boq-items/ endpoint
        try {
            const boqItems = await API.boqItems.list(this.state.projectId);
            console.log("✅ BOQ ITEMS LOADED:", boqItems.length);

            // Store BOQ items (backend returns BoqItem objects)
            this.state.configurations = boqItems;

            // Group by item_type for rendering
            this.state.boqGroups = {
                luminaria: boqItems.filter(item => item.item_type === 'LUMINARIA'),
                drivers: boqItems.filter(item => item.item_type === 'DRIVER'),
                accessories: boqItems.filter(item => item.item_type === 'ACCESSORY')
            };

            console.log("   📦 Luminaria:", this.state.boqGroups.luminaria.length);
            console.log("   📦 Drivers:", this.state.boqGroups.drivers.length);
            console.log("   📦 Accessories:", this.state.boqGroups.accessories.length);

            if (boqItems.length === 0) {
                this.showBoqEmptyState();
            } else {
                this.renderDirectBOQTable();
                this.updateFooter();
            }

        } catch (e) {
            console.error("❌ BOQ load failed:", e);

            // ===============================================
            // ERP-GRADE ERROR HANDLING (404 IS NOT AN ERROR)
            // ===============================================
            const statusCode = e.response?.status;

            if (statusCode === 404) {
                // 🟢 404 = Expected state in Direct BOQ mode
                // This means "No BOQ items exist yet for this project"
                // This is VALID and should show empty state, not error
                console.log("   ℹ️ No BOQ items found (404) - EXPECTED STATE - showing empty state");
                this.showBoqEmptyState();

            } else if (statusCode === 403) {
                // 🟡 Forbidden - read-only mode (blocking, but expected)
                console.warn("   ⚠️ Access forbidden (403) - read-only mode");
                this.showBoqReadOnlyBanner();

            } else if (statusCode >= 500) {
                // 🔴 Server error - true blocking error
                console.error("   🚨 Server error (500+) - showing error banner");
                this.showBoqErrorBanner("Server error. Please contact support.");

            } else {
                // Unknown error - show empty state (not error state)
                console.error("   ❓ Unknown error - showing empty state with retry");
                this.showBoqEmptyState(true); // with retry option
            }
        }
    },

    showBoqEmptyState(withRetry = false) {
        const panel = document.getElementById('tab-panel-luminaria');
        if (!panel) return;

        // ===============================================
        // EMPTY BOQ STATE (VALID ERP STATE, NOT AN ERROR)
        // ===============================================
        panel.innerHTML = `
            <div style="padding:3rem; text-align:center; color:var(--text-muted);">
                <i class="fa-solid fa-inbox" style="font-size:3rem; opacity:0.3; margin-bottom:1.5rem;"></i>
                <p style="font-size:16px; font-weight:600; margin-bottom:0.5rem;">No BOQ created yet for this project</p>
                <p style="font-size:13px; margin-bottom:2rem; color:var(--text-muted);">
                    Start adding items to build your Bill of Quantities
                </p>
                
                <!-- ACTION BUTTONS - ALWAYS VISIBLE -->
                <div style="display:flex; flex-wrap:wrap; gap:0.75rem; justify-content:center; margin-bottom:${withRetry ? '1.5rem' : '0'};">
                    <button class="btn btn-primary btn-sm" onclick="ERPWorkspace.openAddLuminariaDirect()">
                        <i class="fa-solid fa-plus"></i> Add Luminaire
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="ERPWorkspace.openAddDriverDirect()">
                        <i class="fa-solid fa-plus"></i> Add Driver
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="ERPWorkspace.openAddAccessoryDirect()">
                        <i class="fa-solid fa-plus"></i> Add Accessory
                    </button>
                </div>
                
                ${withRetry ? `
                    <button class="btn btn-secondary btn-sm" onclick="ERPWorkspace.loadDirectBOQ()">
                        <i class="fa-solid fa-refresh"></i> Retry Loading
                    </button>
                ` : ''}
            </div>
        `;
    },

    showBoqReadOnlyBanner() {
        const panel = document.getElementById('tab-panel-luminaria');
        if (!panel) return;

        panel.innerHTML = `
            <div style="padding:2rem; text-align:center; background:#FEF3C7; border:1px solid #F59E0B; border-radius:6px; margin:2rem;">
                <i class="fa-solid fa-lock" style="font-size:2rem; color:#92400E; margin-bottom:1rem;"></i>
                <p style="font-size:16px; font-weight:600; color:#92400E; margin-bottom:0.5rem;">Read-Only Access</p>
                <p style="font-size:13px; color:#78350F;">You do not have permission to view or edit this BOQ.</p>
            </div>
        `;
    },

    showBoqErrorBanner(message) {
        const panel = document.getElementById('tab-panel-luminaria');
        if (!panel) return;

        panel.innerHTML = `
            <div style="padding:2rem; text-align:center; background:#FEE2E2; border:1px solid #EF4444; border-radius:6px; margin:2rem;">
                <i class="fa-solid fa-exclamation-triangle" style="font-size:2rem; color:#991B1B; margin-bottom:1rem;"></i>
                <p style="font-size:16px; font-weight:600; color:#991B1B; margin-bottom:0.5rem;">Error Loading BOQ</p>
                <p style="font-size:13px; color:#7F1D1D; margin-bottom:1.5rem;">${message}</p>
                <button class="btn btn-secondary btn-sm" onclick="ERPWorkspace.loadDirectBOQ()">
                    <i class="fa-solid fa-refresh"></i> Retry
                </button>
            </div>
        `;
    },

    // ========== DIRECT BOQ TABLE RENDERING ==========
    renderDirectBOQTable() {
        console.log("📊 RENDERING DIRECT BOQ TABLE");

        const panel = document.getElementById('tab-panel-luminaria');
        if (!panel) return;

        const groups = this.state.boqGroups || { luminaria: [], drivers: [], accessories: [] };

        panel.innerHTML = `
            <div style="padding:1.5rem;">
                <!-- Luminaria Section -->
                ${groups.luminaria.length > 0 ? `
                    <div style="margin-bottom:2rem;">
                        <h4 style="margin-bottom:1rem; color:var(--text-main); font-size:14px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">
                            <i class="fa-solid fa-lightbulb"></i> Luminaria (${groups.luminaria.length})
                        </h4>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product Name</th>
                                        <th style="width:100px; text-align:center;">Quantity</th>
                                        <th style="width:120px; text-align:right;">Unit Price</th>
                                        <th style="width:140px; text-align:right;">Total Price</th>
                                        <th style="width:60px;"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${groups.luminaria.map(item => this.renderBOQItemRow(item)).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : ''}
                
                <!-- Drivers Section -->
                ${groups.drivers.length > 0 ? `
                    <div style="margin-bottom:2rem;">
                        <h4 style="margin-bottom:1rem; color:var(--text-main); font-size:14px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">
                            <i class="fa-solid fa-microchip"></i> Drivers (${groups.drivers.length})
                        </h4>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Driver Name</th>
                                        <th style="width:100px; text-align:center;">Quantity</th>
                                        <th style="width:120px; text-align:right;">Unit Price</th>
                                        <th style="width:140px; text-align:right;">Total Price</th>
                                        <th style="width:60px;"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${groups.drivers.map(item => this.renderBOQItemRow(item)).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : ''}
                
                <!-- Accessories Section -->
                ${groups.accessories.length > 0 ? `
                    <div style="margin-bottom:2rem;">
                        <h4 style="margin-bottom:1rem; color:var(--text-main); font-size:14px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">
                            <i class="fa-solid fa-puzzle-piece"></i> Accessories (${groups.accessories.length})
                        </h4>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Accessory Name</th>
                                        <th style="width:100px; text-align:center;">Quantity</th>
                                        <th style="width:120px; text-align:right;">Unit Price</th>
                                        <th style="width:140px; text-align:right;">Total Price</th>
                                        <th style="width:60px;"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${groups.accessories.map(item => this.renderBOQItemRow(item)).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : ''}
                
                ${groups.luminaria.length === 0 && groups.drivers.length === 0 && groups.accessories.length === 0 ? `
                    <div style="padding:4rem; text-align:center; color:var(--text-muted);">
                        <i class="fa-solid fa-inbox" style="font-size:3rem; opacity:0.3; margin-bottom:1rem;"></i>
                        <p style="font-size:16px; font-weight:600; margin-bottom:0.5rem;">No BOQ Items</p>
                        <p style="font-size:13px;">Start adding items using the buttons above</p>
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderBOQItemRow(item) {
        // Get item details based on item_type
        const itemName = item.product_detail?.name || item.driver_detail?.name || item.accessory_detail?.name || 'Unknown Item';
        const itemCode = item.product_detail?.order_code || item.driver_detail?.model_number || item.accessory_detail?.part_number || 'N/A';
        const unitPrice = item.unit_price || 0;
        const totalPrice = item.total_price || (item.quantity * unitPrice);

        return `
            <tr>
                <td>
                    <div style="font-weight:600;">${Utils.escapeHtml(itemCode)}</div>
                    <div style="font-size:12px; color:var(--text-muted);">${Utils.escapeHtml(itemName)}</div>
                </td>
                <td style="text-align:center; font-weight:600;">${item.quantity}</td>
                <td style="text-align:right;">₹ ${Utils.formatCurrency(unitPrice)}</td>
                <td style="text-align:right; font-weight:600;">₹ ${Utils.formatCurrency(totalPrice)}</td>
                <td style="text-align:center;">
                    <button class="btn-icon" onclick="ERPWorkspace.removeBOQItem(${item.id})" title="Remove">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    },

    async removeBOQItem(itemId) {
        if (!confirm('Remove this item from BOQ?')) return;

        try {
            await API.boqItems.delete(itemId);
            Utils.showToast("Item removed", "success");
            await this.loadDirectBOQ();
        } catch (e) {
            console.error("❌ Remove failed:", e);
            Utils.showToast("Failed to remove item", "error");
        }
    },

    // ========== AREA SELECTION (STATE-DRIVEN) ==========
    async onAreaSelect(areaId) {
        console.log("📌 AREA SELECTED:", areaId);

        // Update state
        this.state.selectedAreaId = areaId;
        this.state.selectedArea = this.state.areas.find(a => a.id === areaId);
        this.state.selectedSubareaId = null;  // Reset subarea
        this.state.selectedSubarea = null;
        this.state.configurations = [];

        console.log("🔄 STATE UPDATED - Selected Area:", this.state.selectedArea?.name);

        // Fetch subareas
        await this.fetchSubareas(areaId);

        // UI update happens in updateUI() called by fetchSubareas
    },

    async fetchSubareas(areaId) {
        console.log("🔍 FETCHING SUBAREAS for Area ID:", areaId);
        try {
            this.state.subareas = await API.subareas.list(areaId);
            console.log("✅ SUBAREAS LOADED:", this.state.subareas);
            console.log("   Count:", this.state.subareas.length);
            this.updateUI();
        } catch (e) {
            console.error("❌ Subareas fetch failed:", e);
            this.state.subareas = [];
            this.updateUI();
        }
    },

    // ========== SUBAREA SELECTION (STATE-DRIVEN) ==========
    async onSubareaSelect(subareaId) {
        console.log("📌 SUBAREA SELECTED:", subareaId);

        this.state.selectedSubareaId = subareaId;
        this.state.selectedSubarea = this.state.subareas.find(s => s.id === subareaId);

        console.log("🔄 STATE UPDATED - Selected Subarea:", this.state.selectedSubarea?.name);

        await this.fetchConfigurations(subareaId);
    },

    async fetchConfigurations(subareaId) {
        console.log("🔍 FETCHING CONFIGURATIONS for Subarea ID:", subareaId);
        try {
            this.state.configurations = await API.configurations.list(subareaId);
            console.log("✅ CONFIGURATIONS LOADED:", this.state.configurations.length);
            this.updateUI();
        } catch (e) {
            console.error("❌ Configurations fetch failed:", e);
            this.state.configurations = [];
            this.updateUI();
        }
    },

    // ========== UI UPDATE (PURE FUNCTION OF STATE) ==========
    updateUI() {
        console.log("🎨 updateUI() called - Rendering based on state");
        this.updatePaneVisibility();
        this.renderAreas();
        this.renderSubareas();
        this.renderConfigurations();
    },

    // ========== PANE VISIBILITY (STATE-DRIVEN) ==========
    updatePaneVisibility() {
        const subareaPane = document.getElementById('pane-subareas');
        const configPane = document.getElementById('pane-config');
        const placeholder = document.getElementById('workspace-initial-placeholder');

        // RULE 1: Subarea pane visible ONLY when area is selected
        if (this.state.selectedAreaId !== null) {
            console.log("   ✅ Showing Subarea Pane");
            subareaPane.style.display = 'flex';
            placeholder.style.display = 'none';
        } else {
            console.log("   ⚪ Hiding Subarea Pane");
            subareaPane.style.display = 'none';
            placeholder.style.display = 'flex';
        }

        // RULE 2: Config pane visible ONLY when subarea is selected
        if (this.state.selectedSubareaId !== null) {
            console.log("   ✅ Showing Config Pane");
            configPane.style.display = 'flex';
        } else {
            console.log("   ⚪ Hiding Config Pane");
            configPane.style.display = 'none';
        }
    },

    // ========== RENDERING FUNCTIONS ==========

    renderAreas() {
        const container = document.getElementById('areas-list');
        if (!container) return;

        if (!this.state.areas || this.state.areas.length === 0) {
            container.innerHTML = '<div style="padding:2rem; text-align:center; color:var(--text-muted); font-size:13px;">No areas found.</div>';
            return;
        }

        container.innerHTML = this.state.areas.map(area => {
            const isActive = this.state.selectedAreaId === area.id;
            return `
                <div class="area-item ${isActive ? 'active' : ''}" onclick="ERPWorkspace.onAreaSelect(${area.id})">
                    <div class="area-info">
                        <span class="area-name">${Utils.escapeHtml(area.name)}</span>
                        <span class="area-type">${area.area_type || 'Interior'}</span>
                    </div>
                    <div class="area-count">${area.subarea_count || 0}</div>
                </div>
            `;
        }).join('');
    },

    renderSubareas() {
        const container = document.getElementById('subareas-list');
        if (!container) return;

        // Update pane header
        const header = document.getElementById('subarea-header-title');
        if (header && this.state.selectedArea) {
            header.textContent = `Subareas – ${this.state.selectedArea.name}`;
        }

        // Empty state vs data
        if (!this.state.subareas || this.state.subareas.length === 0) {
            container.innerHTML = '<div style="padding:2rem; text-align:center; color:var(--text-muted); font-size:13px;">No subareas found.</div>';
            return;
        }

        container.innerHTML = this.state.subareas.map(sa => {
            const isActive = this.state.selectedSubareaId === sa.id;
            return `
                <div class="subarea-card ${isActive ? 'active' : ''}" onclick="ERPWorkspace.onSubareaSelect(${sa.id})">
                    <div style="flex:1;">
                        <div class="sa-name">${Utils.escapeHtml(sa.name)}</div>
                        <div class="sa-summary">
                            <span>${sa.config_count || 0} Sets</span>
                            <span>|</span>
                            <span>${sa.total_wattage || 0}W</span>
                            <span>|</span>
                            <span>₹ ${Utils.formatCurrency(sa.total_cost || 0)}</span>
                        </div>
                    </div>
                    <div class="sa-icon">
                        <i class="fa-solid fa-file-contract"></i>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderConfigurations() {
        if (!this.state.selectedSubarea) return;

        // Update breadcrumbs
        const breadcrumbs = document.getElementById('config-breadcrumbs');
        if (breadcrumbs) {
            breadcrumbs.innerHTML = `
                <span>${Utils.escapeHtml(this.state.project.name)}</span>
                <span>${Utils.escapeHtml(this.state.selectedArea.name)}</span>
                <span style="color:var(--text-main); font-weight:600;">${Utils.escapeHtml(this.state.selectedSubarea.name)}</span>
            `;
        }

        // Update title
        const title = document.getElementById('config-header-title');
        if (title) {
            title.textContent = `Subarea Details – ${this.state.selectedSubarea.name}`;
        }

        // Render active tab
        this.renderCurrentTab();
        this.updateFooter();
    },

    switchConfigTab(tab) {
        this.state.currentConfigTab = tab;
        document.querySelectorAll('.ws-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        this.renderCurrentTab();
    },

    renderCurrentTab() {
        const panels = ['luminaria', 'drivers', 'accessories', 'summary'];
        panels.forEach(p => {
            const el = document.getElementById(`tab-panel-${p}`);
            if (el) el.style.display = (p === this.state.currentConfigTab) ? 'block' : 'none';
        });

        switch (this.state.currentConfigTab) {
            case 'luminaria': this.renderLuminariaTab(); break;
            case 'drivers': this.renderDriversTab(); break;
            case 'accessories': this.renderAccessoriesTab(); break;
            case 'summary': this.renderSummaryTab(); break;
        }
    },

    renderLuminariaTab() {
        const panel = document.getElementById('tab-panel-luminaria');
        if (!panel) return;

        panel.innerHTML = `
            <div style="margin-bottom:1rem; display:flex; justify-content:flex-end;">
                <button class="btn btn-primary btn-sm" onclick="ERPWorkspace.openAddLuminaria()">+ Add Luminaire</button>
            </div>
            <div class="table-container">
                <table class="config-table">
                    <thead>
                        <tr>
                            <th>Order Code / Item</th>
                            <th>Wattage</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Amount</th>
                            <th style="width:40px;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.state.configurations.length ? this.state.configurations.map(c => `
                            <tr>
                                <td>
                                    <div style="font-weight:600;">${Utils.escapeHtml(c.product_detail.order_code || 'N/A')}</div>
                                    <div style="font-size:11px; color:var(--text-muted);">${Utils.escapeHtml(c.product_detail.name)}</div>
                                </td>
                                <td>${c.product_detail.wattage}W</td>
                                <td>${c.quantity}</td>
                                <td>₹ ${Utils.formatCurrency(c.product_detail.base_price)}</td>
                                <td>₹ ${Utils.formatCurrency(c.product_detail.base_price * c.quantity)}</td>
                                <td>
                                    <button class="btn-icon" style="color:var(--error);" onclick="ERPWorkspace.removeConfig(${c.id})">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('') : '<tr><td colspan="6" style="text-align:center; padding:3rem; color:var(--text-muted);">No luminaires configured.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderDriversTab() {
        const panel = document.getElementById('tab-panel-drivers');
        if (!panel) return;

        let driverRows = [];
        this.state.configurations.forEach(c => {
            if (c.driver) {
                driverRows.push({
                    id: c.driver.id,
                    lumName: c.product_detail.name,
                    driverDetail: c.driver.driver_detail,
                    quantity: c.driver.quantity
                });
            }
        });

        panel.innerHTML = `
            <div style="margin-bottom:1rem; display:flex; justify-content:flex-end;">
                <button class="btn btn-primary btn-sm" onclick="ERPWorkspace.openAddDriver()">+ Add Driver</button>
            </div>
            <div class="table-container">
                <table class="config-table">
                    <thead>
                        <tr>
                            <th>Linked Luminaire</th>
                            <th>Driver Code</th>
                            <th>Specs</th>
                            <th>Qty</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${driverRows.length ? driverRows.map(d => `
                            <tr>
                                <td style="font-size:12px; color:var(--text-muted);">${Utils.escapeHtml(d.lumName)}</td>
                                <td style="font-weight:600;">${Utils.escapeHtml(d.driverDetail.driver_code)}</td>
                                <td>${d.driverDetail.wattage_max}W | ${d.driverDetail.constant_type}</td>
                                <td>${d.quantity}</td>
                                <td>₹ ${Utils.formatCurrency(d.driverDetail.base_price * d.quantity)}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="5" style="text-align:center; padding:3rem; color:var(--text-muted);">No drivers linked.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderAccessoriesTab() {
        const panel = document.getElementById('tab-panel-accessories');
        if (!panel) return;

        let accessoryRows = [];
        this.state.configurations.forEach(c => {
            if (c.accessories && c.accessories.length) {
                c.accessories.forEach(acc => {
                    accessoryRows.push({
                        id: acc.id,
                        lumName: c.product_detail.name,
                        accDetail: acc.accessory_detail,
                        quantity: acc.quantity
                    });
                });
            }
        });

        panel.innerHTML = `
            <div style="margin-bottom:1rem; display:flex; justify-content:flex-end;">
                <button class="btn btn-primary btn-sm" onclick="ERPWorkspace.openAddAccessory()">+ Add Accessory</button>
            </div>
            <div class="table-container">
                <table class="config-table">
                    <thead>
                        <tr>
                            <th>Linked Luminaire</th>
                            <th>Accessory</th>
                            <th>Qty</th>
                            <th style="width:150px;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${accessoryRows.length ? accessoryRows.map(a => `
                            <tr>
                                <td style="font-size:12px; color:var(--text-muted);">${Utils.escapeHtml(a.lumName)}</td>
                                <td style="font-weight:600;">${Utils.escapeHtml(a.accDetail.accessory_name)}</td>
                                <td>${a.quantity}</td>
                                <td>₹ ${Utils.formatCurrency(a.accDetail.base_price * a.quantity)}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="4" style="text-align:center; padding:3rem; color:var(--text-muted);">No accessories configured.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderSummaryTab() {
        const panel = document.getElementById('tab-panel-summary');
        if (!panel) return;

        let counts = { lum: 0, drv: 0, acc: 0, wattage: 0, cost: 0 };
        this.state.configurations.forEach(c => {
            counts.lum += c.quantity;
            counts.wattage += (c.product_detail.wattage * c.quantity);
            counts.cost += (c.product_detail.base_price * c.quantity);

            if (c.driver) {
                counts.drv += c.driver.quantity;
                counts.cost += (c.driver.driver_detail.base_price * c.driver.quantity);
            }

            if (c.accessories) {
                c.accessories.forEach(a => {
                    counts.acc += a.quantity;
                    counts.cost += (a.accessory_detail.base_price * a.quantity);
                });
            }
        });

        panel.innerHTML = `
            <!-- BOQ VERSION HEADER -->
            <div style="background:#F8FAFC; border: 1px solid #E2E8F0; border-radius:6px; padding:1.5rem; margin-bottom:1.5rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <div>
                        <div style="font-size:13px; color:var(--text-muted); margin-bottom:4px;">BOQ Version</div>
                        <div style="font-size:20px; font-weight:700; color:var(--text-main);">
                            v1.0 <span style="background:#DBEAFE; color:#1E40AF; padding:4px 10px; border-radius:4px; font-size:12px; font-weight:600; margin-left:0.5rem;">DRAFT</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn btn-secondary btn-sm" onclick="ERPWorkspace.lockBOQ()" id="btn-lock-boq">
                            <i class="fa-solid fa-lock"></i> Lock BOQ
                        </button>
                        <button class="btn btn-secondary btn-sm" disabled title="Lock current version first">
                            <i class="fa-solid fa-copy"></i> New Version
                        </button>
                    </div>
                </div>
                <div style="font-size:12px; color:var(--text-muted); line-height:1.6;">
                    <i class="fa-solid fa-info-circle"></i> 
                    This version is editable. Lock it to freeze all values and enable BOQ generation.
                </div>
            </div>

            <!-- SUMMARY STATS -->
            <div class="summary-grid">
                <div class="summary-stat-card">
                    <span class="label">Total Luminaria Count</span>
                    <span class="value">${counts.lum}</span>
                </div>
                <div class="summary-stat-card">
                    <span class="label">Total Driver Sets</span>
                    <span class="value">${counts.drv}</span>
                </div>
                <div class="summary-stat-card">
                    <span class="label">Total Accessories</span>
                    <span class="value">${counts.acc}</span>
                </div>
                <div class="summary-stat-card">
                    <span class="label">Aggregate Load</span>
                    <span class="value" style="color:var(--success);">${counts.wattage}W</span>
                </div>
            </div>
            
            <!-- TOTAL COST -->
            <div class="total-cost-hero">
                <div class="label">Total ${this.state.selectedSubarea ? 'Subarea' : 'Project'} Value</div>
                <div class="value">₹ ${Utils.formatCurrency(counts.cost)}</div>
            </div>
            
            <!-- INFO NOTE -->
            <div style="margin-top:2rem; padding:1rem; background:#F8FAFC; border-radius:4px; font-size:13px; color:var(--text-muted);">
                <i class="fa-solid fa-circle-info" style="margin-right:0.5rem;"></i>
                Real-time summary. Values lock upon BOQ generation.
            </div>
        `;
    },

    // ========== BOQ VERSION MANAGEMENT ==========
    async lockBOQ() {
        if (!confirm("Lock this BOQ version? This will freeze all configurations and prevent further edits.")) return;

        try {
            // Call lock API (to be implemented on backend)
            await API.post(`/boq/lock/`, { project: this.state.projectId });
            Utils.showToast("BOQ locked successfully", "success");

            // Disable add buttons
            this.disableEditMode();
            this.renderCurrentTab();
        } catch (e) {
            console.error("❌ BOQ lock failed:", e);
            Utils.showToast("Failed to lock BOQ", "error");
        }
    },

    disableEditMode() {
        // Disable all add buttons
        document.querySelectorAll('button[onclick*="openAdd"]').forEach(btn => {
            btn.disabled = true;
            btn.title = "BOQ is locked";
        });
    },

    updateFooter() {
        let cost = 0, wattage = 0;
        this.state.configurations.forEach(c => {
            wattage += (c.product_detail.wattage * c.quantity);
            cost += (c.product_detail.base_price * c.quantity);
            if (c.driver) cost += (c.driver.driver_detail.base_price * c.driver.quantity);
            if (c.accessories) c.accessories.forEach(a => cost += (a.accessory_detail.base_price * a.quantity));
        });

        const wEl = document.getElementById('footer-total-wattage');
        const cEl = document.getElementById('footer-total-cost');
        if (wEl) wEl.textContent = `${wattage}W`;
        if (cEl) cEl.textContent = `₹ ${Utils.formatCurrency(cost)}`;
    },

    // ========== MODAL HANDLERS ==========

    async openAddLuminaria() {
        document.getElementById('add-lum-sa-name').textContent = this.state.selectedSubarea.name;
        try {
            const products = await API.get('/masters/products/');
            const select = document.getElementById('select-lum-product');
            select.innerHTML = '<option value="">Select Product...</option>' +
                products.map(p => `<option value="${p.prod_id}">${p.order_code || '??'} | ${Utils.escapeHtml(p.name)} (₹${p.base_price})</option>`).join('');
            Modals.open('overlay-add-luminaria');
        } catch (e) { Utils.showToast("Failed to load products", "error"); }
    },

    async openAddDriver() {
        if (!this.state.configurations.length) return Utils.showToast("Add a luminaire first", "warning");
        document.getElementById('add-drv-sa-name').textContent = this.state.selectedSubarea.name;

        const lumSelect = document.getElementById('select-drv-lum');
        lumSelect.innerHTML = this.state.configurations.map(c =>
            `<option value="${c.id}">${c.product_detail.name} (Qty: ${c.quantity})</option>`
        ).join('');

        try {
            const drivers = await API.get('/masters/drivers/');
            const drvSelect = document.getElementById('select-drv-driver');
            drvSelect.innerHTML = '<option value="">Select Driver...</option>' +
                drivers.map(d => `<option value="${d.id}">${d.driver_code} | ${d.voltage_max}V (₹${d.base_price})</option>`).join('');
            Modals.open('overlay-add-driver');
        } catch (e) { Utils.showToast("Failed to load drivers", "error"); }
    },

    async openAddAccessory() {
        if (!this.state.configurations.length) return Utils.showToast("Add a luminaire first", "warning");
        document.getElementById('add-acc-sa-name').textContent = this.state.selectedSubarea.name;

        const lumSelect = document.getElementById('select-acc-lum');
        lumSelect.innerHTML = '<option value="">Subarea-level</option>' +
            this.state.configurations.map(c => `<option value="${c.id}">${c.product_detail.name}</option>`).join('');

        try {
            const accessories = await API.get('/masters/accessories/');
            const accSelect = document.getElementById('select-acc-accessory');
            accSelect.innerHTML = '<option value="">Select Accessory...</option>' +
                accessories.map(a => `<option value="${a.id}">${a.accessory_name} (₹${a.base_price})</option>`).join('');
            Modals.open('overlay-add-accessory');
        } catch (e) { Utils.showToast("Failed to load accessories", "error"); }
    },

    // ========== DIRECT BOQ MODE HANDLERS ==========
    // These handlers are for PROJECT_LEVEL (DIRECT_BOQ) mode
    // They add BOQ items directly to the project (no Area/Subarea)

    async openAddLuminariaDirect() {
        console.log("📦 OPENING ADD LUMINAIRE MODAL (DIRECT BOQ MODE)");
        try {
            const products = await API.get('/masters/products/');
            const select = document.getElementById('select-lum-product');
            select.innerHTML = '<option value="">Select Product...</option>' +
                products.map(p => `<option value="${p.prod_id}">${p.order_code || '??'} | ${Utils.escapeHtml(p.name)} (₹${p.base_price})</option>`).join('');
            Modals.open('overlay-add-luminaria');
        } catch (e) { 
            console.error("❌ Failed to load products:", e);
            Utils.showToast("Failed to load products", "error"); 
        }
    },

    async openAddDriverDirect() {
        console.log("📦 OPENING ADD DRIVER MODAL (DIRECT BOQ MODE)");
        try {
            const drivers = await API.get('/masters/drivers/');
            const drvSelect = document.getElementById('select-drv-driver');
            drvSelect.innerHTML = '<option value="">Select Driver...</option>' +
                drivers.map(d => `<option value="${d.id}">${d.driver_code} | ${d.voltage_max}V (₹${d.base_price})</option>`).join('');
            Modals.open('overlay-add-driver');
        } catch (e) { 
            console.error("❌ Failed to load drivers:", e);
            Utils.showToast("Failed to load drivers", "error"); 
        }
    },

    async openAddAccessoryDirect() {
        console.log("📦 OPENING ADD ACCESSORY MODAL (DIRECT BOQ MODE)");
        try {
            const accessories = await API.get('/masters/accessories/');
            const accSelect = document.getElementById('select-acc-accessory');
            accSelect.innerHTML = '<option value="">Select Accessory...</option>' +
                accessories.map(a => `<option value="${a.id}">${a.accessory_name} (₹${a.base_price})</option>`).join('');
            Modals.open('overlay-add-accessory');
        } catch (e) { 
            console.error("❌ Failed to load accessories:", e);
            Utils.showToast("Failed to load accessories", "error"); 
        }
    },

    closeConfigPane() {
        this.state.selectedSubareaId = null;
        this.state.selectedSubarea = null;
        this.updateUI();
    },

    // ========== EVENT SETUP ==========

    setupEventListeners() {
        const areaForm = document.getElementById('form-add-area');
        if (areaForm) {
            areaForm.onsubmit = async (e) => {
                e.preventDefault();
                const data = { project: this.state.projectId, name: e.target.name.value };
                try {
                    await API.areas.create(data);
                    Modals.close('overlay-area');
                    e.target.reset();
                    await this.loadAreas();
                    Utils.showToast("Area created", "success");
                } catch (err) { Utils.showToast("Failed", "error"); }
            };
        }

        const subareaForm = document.getElementById('form-add-subarea');
        if (subareaForm) {
            subareaForm.onsubmit = async (e) => {
                e.preventDefault();
                const data = { area: this.state.selectedAreaId, name: e.target.name.value };
                try {
                    await API.subareas.create(data);
                    Modals.close('overlay-subarea');
                    e.target.reset();
                    await this.fetchSubareas(this.state.selectedAreaId);
                    Utils.showToast("Subarea added", "success");
                } catch (err) { Utils.showToast("Failed", "error"); }
            };
        }

        document.getElementById('form-add-luminaria').onsubmit = (e) => this.handleLumSubmit(e);
        document.getElementById('form-add-driver').onsubmit = (e) => this.handleDrvSubmit(e);
        document.getElementById('form-add-accessory').onsubmit = (e) => this.handleAccSubmit(e);

        document.getElementById('btn-add-area').onclick = () => Modals.open('overlay-area');
        document.getElementById('btn-add-subarea').onclick = () => {
            if (!this.state.selectedAreaId) return Utils.showToast("Select Area first", "warning");
            Modals.open('overlay-subarea');
        };
    },

    async handleLumSubmit(e) {
        e.preventDefault();

        // ========== MODE GUARD: Different API endpoints per mode ==========
        const isDirectBOQ = this.state.project.inquiry_type === 'PROJECT_LEVEL';

        const productId = parseInt(document.getElementById('select-lum-product').value);
        const quantity = parseInt(document.getElementById('input-lum-qty').value);

        let apiCall, data;

        if (isDirectBOQ) {
            // ========== DIRECT BOQ MODE: /api/boq-items/ ==========
            // CRITICAL: Use exact field names expected by backend
            data = {
                project_id: parseInt(this.state.projectId),
                item_type: "LUMINARIA",
                master_id: productId,
                quantity: quantity
            };
            apiCall = API.boqItems.create(data);
            console.log("💾 DIRECT BOQ SAVE (ERP Contract):", data);

        } else {
            // ========== CONFIGURATION MODE: /api/configurations/ ==========
            // CRITICAL: Backend ConfigurationSerializer expects: area, subarea, product, quantity
            if (!this.state.selectedAreaId || !this.state.selectedSubareaId) {
                Utils.showToast("Area and Subarea required in Configuration mode", "error");
                return;
            }

            data = {
                area: Number(this.state.selectedAreaId),
                subarea: Number(this.state.selectedSubareaId),
                product: Number(productId),
                quantity: Number(quantity)
            };
            apiCall = API.configurations.create(data);
            console.log("💾 CONFIGURATION SAVE (ERP Contract):", data);
            console.log("   ✅ area:", typeof data.area, data.area);
            console.log("   ✅ subarea:", typeof data.subarea, data.subarea);
            console.log("   ✅ product:", typeof data.product, data.product);
            console.log("   ✅ quantity:", typeof data.quantity, data.quantity);
        }

        try {
            await apiCall;
            Modals.close('overlay-add-luminaria');

            // Reload based on mode
            if (isDirectBOQ) {
                await this.loadDirectBOQ();
            } else {
                await this.fetchConfigurations(this.state.selectedSubareaId);
            }

            Utils.showToast("Luminaria added", "success");
        } catch (err) {
            console.error("❌ Save failed:", err);
            console.error("   Payload sent:", data);
            Utils.showToast("Failed to add luminaria: " + (err.response?.data?.detail || err.message), "error");
        }
    },

    async handleDrvSubmit(e) {
        e.preventDefault();

        // ========== MODE GUARD: Different API endpoints per mode ==========
        const isDirectBOQ = this.state.project.inquiry_type === 'PROJECT_LEVEL';
        const driverId = parseInt(document.getElementById('select-drv-driver').value);
        const quantity = parseInt(document.getElementById('input-drv-qty').value);

        if (isDirectBOQ) {
            // ========== DIRECT BOQ MODE: /api/boq-items/ ==========
            const data = {
                project_id: parseInt(this.state.projectId),
                item_type: "DRIVER",
                master_id: driverId,
                quantity: quantity
            };
            
            console.log("💾 DIRECT BOQ DRIVER SAVE (ERP Contract):", data);
            try {
                await API.boqItems.create(data);
                Modals.close('overlay-add-driver');
                await this.loadDirectBOQ();
                Utils.showToast("Driver added to BOQ", "success");
            } catch (err) {
                console.error("❌ Driver save failed:", err);
                console.error("   Payload sent:", data);
                Utils.showToast("Failed to add driver: " + (err.response?.data?.detail || err.message), "error");
            }
        } else {
            // ========== CONFIGURATION MODE: /api/configurations/configuration-drivers/ ==========
            const data = {
                configuration_id: parseInt(document.getElementById('select-drv-lum').value),
                driver_id: driverId,
                quantity: quantity
            };

            console.log("💾 CONFIGURATION DRIVER SAVE (ERP Contract):", data);
            console.log("   ✅ configuration_id:", typeof data.configuration_id, data.configuration_id);
            console.log("   ✅ driver_id:", typeof data.driver_id, data.driver_id);
            console.log("   ✅ quantity:", typeof data.quantity, data.quantity);

            try {
                await API.configurations.addDriver(data);
                Modals.close('overlay-add-driver');
                await this.fetchConfigurations(this.state.selectedSubareaId);
                Utils.showToast("Driver linked", "success");
            } catch (err) {
                console.error("❌ Driver save failed:", err);
                console.error("   Payload sent:", data);
                Utils.showToast("Failed to add driver: " + (err.response?.data?.detail || err.message), "error");
            }
        }
    },

    async handleAccSubmit(e) {
        e.preventDefault();

        // ========== MODE GUARD: Different API endpoints per mode ==========
        const isDirectBOQ = this.state.project.inquiry_type === 'PROJECT_LEVEL';
        const accessoryId = parseInt(document.getElementById('select-acc-accessory').value);
        const quantity = parseInt(document.getElementById('input-acc-qty').value);

        if (isDirectBOQ) {
            // ========== DIRECT BOQ MODE: /api/boq-items/ ==========
            const data = {
                project_id: parseInt(this.state.projectId),
                item_type: "ACCESSORY",
                master_id: accessoryId,
                quantity: quantity
            };
            
            console.log("💾 DIRECT BOQ ACCESSORY SAVE (ERP Contract):", data);
            try {
                await API.boqItems.create(data);
                Modals.close('overlay-add-accessory');
                await this.loadDirectBOQ();
                Utils.showToast("Accessory added to BOQ", "success");
            } catch (err) {
                console.error("❌ Accessory save failed:", err);
                console.error("   Payload sent:", data);
                Utils.showToast("Failed to add accessory: " + (err.response?.data?.detail || err.message), "error");
            }
        } else {
            // ========== CONFIGURATION MODE: /api/configurations/configuration-accessories/ ==========
            const configId = parseInt(document.getElementById('select-acc-lum').value);
            if (!configId) return Utils.showToast("Link to luminaire required", "warning");

            const data = {
                configuration_id: configId,
                accessory_id: accessoryId,
                quantity: quantity
            };

            console.log("💾 CONFIGURATION ACCESSORY SAVE (ERP Contract):", data);
            console.log("   ✅ configuration_id:", typeof data.configuration_id, data.configuration_id);
            console.log("   ✅ accessory_id:", typeof data.accessory_id, data.accessory_id);
            console.log("   ✅ quantity:", typeof data.quantity, data.quantity);

            try {
                await API.configurations.addAccessory(data);
                Modals.close('overlay-add-accessory');
                await this.fetchConfigurations(this.state.selectedSubareaId);
                Utils.showToast("Accessory added", "success");
            } catch (err) {
                console.error("❌ Accessory save failed:", err);
                console.error("   Payload sent:", data);
                Utils.showToast("Failed to add accessory: " + (err.response?.data?.detail || err.message), "error");
            }
        }
    },

    async removeConfig(id) {
        if (!confirm("Remove this configuration?")) return;
        try {
            await API.configurations.delete(id);
            await this.fetchConfigurations(this.state.selectedSubareaId);
            Utils.showToast("Removed", "success");
        } catch (e) { Utils.showToast("Failed", "error"); }
    }
};

document.addEventListener('DOMContentLoaded', () => ERPWorkspace.init());
window.ERPWorkspace = ERPWorkspace;
