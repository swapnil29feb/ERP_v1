// Masters Library Page Logic
const MastersPage = {
    currentTab: 'products',
    // Removed manual isModalOpen flag to avoid state desync.
    // We now use a DOM-based check.
    products: [],
    drivers: [],
    accessories: [],

    async init() {
        console.log("ENTER: init");

        // DOM Existence & Enablement Test (Step 2)
        const addBtn = document.getElementById("btn-add-master");
        console.log("BTN EXISTS [btn-add-master]:", !!addBtn, "DISABLED:", addBtn?.disabled);

        const searchInput = document.getElementById("master-search");
        console.log("DOM EXISTS [master-search]:", !!searchInput);

        this.setupEventListeners();
        this.setupImagePreviews();
        this.loadAll();
    },

    async loadAll() {
        console.log("ENTER: loadAll");
        this.loadProducts();
        this.loadDrivers();
        this.loadAccessories();
    },

    async loadProducts() {
        console.log("ENTER: loadProducts");
        try {
            const products = await API.get('/masters/products/');
            console.log("PRODUCTS LOADED:", products?.length);
            this.products = products || [];
            document.getElementById('products-count').textContent = this.products.length;
            this.renderProducts();
        } catch (error) {
            console.error("LOAD PRODUCTS FAILED:", error);
            Utils.showToast('Failed to load products', 'error');
        }
    },

    async loadDrivers() {
        try {
            const response = await API.get('/masters/drivers/');
            this.drivers = response || [];
            document.getElementById('drivers-count').textContent = this.drivers.length;
            if (this.currentTab === 'drivers') {
                this.renderDrivers();
            }
        } catch (error) {
            console.error('Failed to load drivers:', error);
        }
    },

    async loadAccessories() {
        try {
            const response = await API.get('/masters/accessories/');
            this.accessories = response || [];
            document.getElementById('accessories-count').textContent = this.accessories.length;
            if (this.currentTab === 'accessories') {
                this.renderAccessories();
            }
        } catch (error) {
            console.error('Failed to load accessories:', error);
        }
    },

    renderProducts() {
        const body = document.getElementById('products-list-body');
        if (!body) return;

        if (this.products.length === 0) {
            body.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No products found</td></tr>';
            return;
        }

        body.innerHTML = this.products.map(product => `
            <tr onclick="MastersPage.showDetail('product', ${product.prod_id}, this)">
                <td>${product.make}</td>
                <td><code class="product-code-badge">${product.order_code || '-'}</code></td>
                <td>${product.mounting_style || '-'}</td>
                <td>${product.wattage ? product.wattage + 'W' : '-'}</td>
                <td>${product.driver_integration || '-'}</td>
                <td><span class="badge badge-outline">${product.electrical_type || 'CC'}</span></td>
                <td style="text-align: right; font-weight: 700;">₹ ${Utils.formatCurrency(product.base_price || 0)}</td>
            </tr>
        `).join('');
    },

    renderDrivers() {
        const body = document.getElementById('drivers-list-body');
        if (!body) return;

        if (this.drivers.length === 0) {
            body.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No drivers found</td></tr>';
            return;
        }

        body.innerHTML = this.drivers.map(driver => `
            <tr onclick="MastersPage.showDetail('driver', ${driver.id}, this)">
                <td><code class="product-code-badge">${driver.driver_code}</code></td>
                <td>${driver.driver_make}</td>
                <td>${driver.constant_type || '-'}</td>
                <td>${driver.max_wattage ? driver.max_wattage + 'W' : '-'}</td>
                <td><span class="badge ${driver.dimming_protocol !== 'NONE' ? 'badge-success' : 'badge-secondary'}">${driver.dimming_protocol}</span></td>
                <td style="text-align: right; font-weight: 700;">₹ ${Utils.formatCurrency(driver.base_price || 0)}</td>
            </tr>
        `).join('');
    },

    renderAccessories() {
        const body = document.getElementById('accessories-list-body');
        if (!body) return;

        if (this.accessories.length === 0) {
            body.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 2rem;">No accessories found</td></tr>';
            return;
        }

        body.innerHTML = this.accessories.map(accessory => `
            <tr onclick="MastersPage.showDetail('accessory', ${accessory.id}, this)">
                <td>${accessory.accessory_name}</td>
                <td><span class="badge badge-outline">${accessory.accessory_category}</span></td>
                <td>${accessory.accessory_type}</td>
                <td style="text-align: right; font-weight: 700;">₹ ${Utils.formatCurrency(accessory.base_price || 0)}</td>
            </tr>
        `).join('');
    },

    switchTab(tab) {
        console.log("ENTER: switchTab", tab);

        // Deterministic check: Is any modal overlay visible?
        const openModal = document.querySelector('.modal-overlay:not([style*="display: none"])');
        if (openModal) {
            console.warn("🚫 TAB SWITCH BLOCKED: Modal is open", openModal.id);
            return;
        }

        this.currentTab = tab;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Update tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.style.display = 'none';
        });
        const targetPane = document.getElementById(`${tab}-pane`);
        if (targetPane) {
            targetPane.style.display = 'block';
        } else {
            console.warn("EARLY EXIT: Tab pane not found", `${tab}-pane`);
        }

        // Update add button text
        const addBtnText = document.getElementById('add-btn-text');
        const btnAddMaster = document.getElementById('btn-add-master');

        if (!addBtnText || !btnAddMaster) {
            console.warn("EARLY EXIT: Add button elements missing", { text: !!addBtnText, btn: !!btnAddMaster });
            return;
        }

        if (tab === 'products') {
            addBtnText.textContent = 'Add Product';
        } else if (tab === 'drivers') {
            addBtnText.textContent = 'Add Driver';
        } else if (tab === 'accessories') {
            addBtnText.textContent = 'Add Accessory';
        }

        // Close detail pane on tab switch
        this.closeDetail();

        // Render current tab
        if (tab === 'products') this.renderProducts();
        else if (tab === 'drivers') this.renderDrivers();
        else this.renderAccessories();
    },

    showDetail(type, id, row) {
        console.log("ENTER: showDetail", { type, id });
        // Highlight row
        const table = row.closest('table');
        table.querySelectorAll('tr').forEach(tr => tr.classList.remove('selected'));
        row.classList.add('selected');

        const pane = document.getElementById('master-detail-pane');
        const content = document.getElementById('master-detail-content');
        const footer = document.getElementById('master-detail-footer');

        if (!pane || !content || !footer) {
            console.warn("EARLY EXIT: Detail pane elements missing", { pane: !!pane, content: !!content, footer: !!footer });
            return;
        }

        pane.classList.add('open');
        content.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin"></i></div>';
        footer.style.display = 'none';

        // Load details
        const endpoint = type === 'product' ? `/masters/products/${id}/` :
            type === 'driver' ? `/masters/drivers/${id}/` :
                `/masters/accessories/${id}/`;

        console.log("FETCHING DETAIL:", endpoint);
        API.get(endpoint).then(item => {
            console.log("DETAIL LOADED:", item);
            this.renderDetailContent(type, item);
            footer.style.display = 'flex';
        }).catch(err => {
            console.error("DETAIL FETCH FAILED:", err);
            content.innerHTML = '<div class="alert alert-error">Failed to load details</div>';
        });
    },

    closeDetail() {
        document.getElementById('master-detail-pane')?.classList.remove('open');
        document.querySelectorAll('.erp-table tr').forEach(tr => tr.classList.remove('selected'));
    },

    renderDetailContent(type, item) {
        const content = document.getElementById('master-detail-content');
        let html = '';

        if (type === 'product') {
            html = `
                <div class="detail-section">
                    <h5 class="detail-section-title">Identification</h5>
                    <div class="detail-grid">
                        <div class="detail-item"><span class="detail-label">Make</span><span class="detail-value">${item.make}</span></div>
                        <div class="detail-item"><span class="detail-label">Order Code</span><span class="detail-value">${item.order_code || '-'}</span></div>
                        <div class="detail-item"><span class="detail-label">Color RAL</span><span class="detail-value">${item.luminaire_color_ral || '-'}</span></div>
                    </div>
                </div>

                <div class="detail-section">
                    <h5 class="detail-section-title">Mounting & Environment</h5>
                    <div class="detail-grid">
                        <div class="detail-item"><span class="detail-label">Style</span><span class="detail-value">${item.mounting_style || '-'}</span></div>
                        <div class="detail-item"><span class="detail-label">Environment</span><span class="detail-value">${item.environment || 'INDOOR'}</span></div>
                    </div>
                </div>

                <div class="detail-section">
                    <h5 class="detail-section-title">Mechanical Dimensions</h5>
                    <div class="detail-grid" style="grid-template-columns: 1fr 1fr;">
                        <div class="detail-item"><span class="detail-label">Diameter</span><span class="detail-value">${item.diameter_mm || '-'} mm</span></div>
                        <div class="detail-item"><span class="detail-label">Length</span><span class="detail-value">${item.length_mm || '-'} mm</span></div>
                        <div class="detail-item"><span class="detail-label">Width</span><span class="detail-value">${item.width_mm || '-'} mm</span></div>
                        <div class="detail-item"><span class="detail-label">Height</span><span class="detail-value">${item.height_mm || '-'} mm</span></div>
                        <div class="detail-item"><span class="detail-label">Cutout Dia</span><span class="detail-value">${item.cutout_diameter_mm || '-'} mm</span></div>
                        <div class="detail-item"><span class="detail-label">Weight</span><span class="detail-value">${item.weight_kg || '-'} kg</span></div>
                    </div>
                </div>

                <div class="detail-section">
                    <h5 class="detail-section-title">Optical & Electrical</h5>
                    <div class="detail-grid" style="grid-template-columns: 1fr 1fr;">
                        <div class="detail-item"><span class="detail-label">Wattage</span><span class="detail-value">${item.wattage ? item.wattage + 'W' : '-'}</span></div>
                        <div class="detail-item"><span class="detail-label">Lumen Output</span><span class="detail-value">${item.lumen_output || '-'} lm</span></div>
                        <div class="detail-item"><span class="detail-label">CCT</span><span class="detail-value">${item.cct_kelvin ? item.cct_kelvin + 'K' : '-'}</span></div>
                        <div class="detail-item"><span class="detail-label">CRI</span><span class="detail-value">${item.cri_cci || '-'}</span></div>
                        <div class="detail-item"><span class="detail-label">Beam Angle</span><span class="detail-value">${item.beam_angle_degree || '-'}</span></div>
                        <div class="detail-item"><span class="detail-label">IP Class</span><span class="detail-value">${item.ip_class ? 'IP' + item.ip_class : '-'}</span></div>
                        <div class="detail-item"><span class="detail-label">Op. Voltage</span><span class="detail-value">${item.op_voltage || '-'} V</span></div>
                        <div class="detail-item"><span class="detail-label">Op. Current</span><span class="detail-value">${item.op_current || '-'} mA</span></div>
                        <div class="detail-item"><span class="detail-label">Efficiency</span><span class="detail-value">${item.lumen_efficency || '-'} lm/W</span></div>
                        <div class="detail-item"><span class="detail-label">Elec. Type</span><span class="detail-value">${item.electrical_type || 'CC'}</span></div>
                    </div>
                </div>

                <div class="detail-section">
                    <h5 class="detail-section-title">Control & Driver</h5>
                    <div class="detail-grid">
                        <div class="detail-item"><span class="detail-label">Integration</span><span class="detail-value">${item.driver_integration || '-'}</span></div>
                        <div class="detail-item"><span class="detail-label">Control Ready</span><span class="detail-value">${item.control_ready || 'NONE'}</span></div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h5 class="detail-section-title">Commercials</h5>
                    <div class="detail-grid">
                        <div class="detail-item"><span class="detail-label">Base Price</span><span class="detail-value" style="color: var(--accent); font-weight: 700;">₹ ${Utils.formatCurrency(item.base_price || 0)}</span></div>
                        <div class="detail-item"><span class="detail-label">Warranty</span><span class="detail-value">${item.warranty_years || 0} Years</span></div>
                        <div class="detail-item"><span class="detail-label">Website</span><span class="detail-value"><a href="${item.website_link}" target="_blank" style="color: var(--primary); text-decoration: none;">View link <i class="fa-solid fa-external-link"></i></a></span></div>
                    </div>
                </div>

                <div class="detail-section">
                    <h5 class="detail-section-title">Visuals</h5>
                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 0.5rem; margin-bottom:0.5rem;">
                        <div>
                            <span class="detail-label" style="font-size: 0.7rem;">Primary Visual</span>
                            <div class="detail-image-box" style="height: 180px;">${item.visual_image ? `<img src="${item.visual_image}">` : '<i class="fa-solid fa-camera"></i>'}</div>
                        </div>
                        <div>
                            <span class="detail-label" style="font-size: 0.7rem;">Illustrative</span>
                            <div class="detail-image-box" style="height: 180px;">${item.illustrative_details ? `<img src="${item.illustrative_details}">` : '<i class="fa-solid fa-image"></i>'}</div>
                        </div>
                    </div>
                    <div>
                        <span class="detail-label" style="font-size: 0.7rem;">Photometrics</span>
                        <div class="detail-image-box" style="height: 120px;">${item.photometrics ? `<img src="${item.photometrics}">` : '<i class="fa-solid fa-chart-area"></i>'}</div>
                    </div>
                </div>
            `;
        } else if (type === 'driver') {
            html = `
                <div class="detail-section">
                    <h5 class="detail-section-title">Identification</h5>
                    <div class="detail-grid">
                        <div class="detail-item"><span class="detail-label">Make</span><span class="detail-value">${item.driver_make}</span></div>
                        <div class="detail-item"><span class="detail-label">Code</span><span class="detail-value">${item.driver_code}</span></div>
                    </div>
                </div>

                <div class="detail-section" style="background: var(--primary-glow); padding: 1rem; border-radius: var(--radius-md);">
                    <h5 class="detail-section-title" style="border-bottom-color: var(--primary);">Compatibility Critical</h5>
                    <div class="detail-grid">
                        <div class="detail-item"><span class="detail-label">Constant Type</span><span class="detail-value" style="font-weight: 700; color: var(--primary-light);">${item.constant_type || '-'}</span></div>
                        <div class="detail-item"><span class="detail-label">Output Current</span><span class="detail-value" style="font-weight: 700; color: var(--primary-light);">${item.output_current_ma || '-'} mA</span></div>
                        <div class="detail-item"><span class="detail-label">Output Volt Range</span><span class="detail-value">${item.output_voltage_min || 0}V - ${item.output_voltage_max || 0}V</span></div>
                        <div class="detail-item"><span class="detail-label">Max Wattage</span><span class="detail-value" style="font-weight: 700; color: var(--primary-light);">${item.max_wattage ? item.max_wattage + 'W' : '-'}</span></div>
                    </div>
                </div>

                <div class="detail-section">
                    <h5 class="detail-section-title">Electrical Details</h5>
                    <div class="detail-grid">
                        <div class="detail-item"><span class="detail-label">Input Voltage</span><span class="detail-value">${item.input_voltage_min || 0}V - ${item.input_voltage_max || 0}V</span></div>
                        <div class="detail-item"><span class="detail-label">Dimmable</span><span class="detail-value">${item.dimmable || 'YES'}</span></div>
                        <div class="detail-item"><span class="detail-label">Protocol</span><span class="detail-value">${item.dimming_protocol || 'NONE'}</span></div>
                        <div class="detail-item"><span class="detail-label">IP Class</span><span class="detail-value">IP ${item.ip_class || '20'}</span></div>
                    </div>
                </div>
                <div class="detail-section">
                    <h5 class="detail-section-title">Commercials</h5>
                    <div class="detail-grid">
                        <div class="detail-item"><span class="detail-label">Base Price</span><span class="detail-value" style="color: var(--accent); font-weight: 700;">₹ ${Utils.formatCurrency(item.base_price || 0)}</span></div>
                        <div class="detail-item"><span class="detail-label">Warranty</span><span class="detail-value">${item.warranty_years || 0} Years</span></div>
                    </div>
                </div>
            `;
        } else if (type === 'accessory') {
            html = `
                <div class="detail-section">
                    <h5 class="detail-section-title">Accessory Info</h5>
                    <div class="detail-grid">
                        <div class="detail-item"><span class="detail-label">Name</span><span class="detail-value">${item.accessory_name}</span></div>
                        <div class="detail-item"><span class="detail-label">Category</span><span class="detail-value">${item.accessory_category || '-'}</span></div>
                        <div class="detail-item"><span class="detail-label">Type</span><span class="detail-value">${item.accessory_type}</span></div>
                    </div>
                </div>

                <div class="detail-section" style="border: 1px solid var(--primary); padding: 1rem; border-radius: var(--radius-md);">
                    <h5 class="detail-section-title">Compatibility Block</h5>
                    <div class="detail-grid">
                        <div class="detail-item" style="flex-direction: column; align-items: flex-start; gap: 0.5rem;">
                            <span class="detail-label">Mounting Styles</span>
                            <div style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
                                ${item.compatible_mounting_styles ? item.compatible_mounting_styles.map(s => `<span class="badge badge-sm badge-outline">${s}</span>`).join('') : '-'}
                            </div>
                        </div>
                        <div class="detail-item"><span class="detail-label">Diameter Range</span><span class="detail-value">${item.min_diameter_mm || 0}mm - ${item.max_diameter_mm || 0}mm</span></div>
                        <div class="detail-item"><span class="detail-label">IP Compatibility</span><span class="detail-value">IP ${item.compatible_ip_class || '-'}</span></div>
                    </div>
                </div>

                <div class="detail-section">
                    <h5 class="detail-section-title">Description</h5>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${item.description || 'No description provided.'}</p>
                </div>
                <div class="detail-section">
                    <h5 class="detail-section-title">Commercials</h5>
                    <div class="detail-grid">
                        <div class="detail-item"><span class="detail-label">Base Price</span><span class="detail-value" style="color: var(--accent); font-weight: 700;">₹ ${Utils.formatCurrency(item.base_price || 0)}</span></div>
                    </div>
                </div>
            `;
        }

        content.innerHTML = html;
    },

    setupEventListeners() {
        console.log("ENTER: setupEventListeners");

        // Search
        document.getElementById('master-search')?.addEventListener('input', Utils.debounce(() => {
            console.log("EVENT: search input");
            this.handleSearch();
        }, 300));

        // Rule 1: Single source of truth for Add Button
        const addBtn = document.getElementById('btn-add-master');
        if (addBtn) {
            addBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();

                console.log(`🖱️ CLICK → ADD MASTER [${this.currentTab}]`);
                if (this.currentTab === 'products') this.openProductModal();
                else if (this.currentTab === 'drivers') this.openDriverModal();
                else if (this.currentTab === 'accessories') this.openAccessoryModal();
            };
        } else {
            console.warn("WIRING FAILED: btn-add-master Not Found");
        }
    },

    async handleSearch() {
        const term = document.getElementById('master-search')?.value || '';

        // When searching, clear current lists and details
        this.closeDetail();

        try {
            const url = `/masters/${this.currentTab === 'products' ? 'products' : this.currentTab}/?q=${encodeURIComponent(term)}`;
            const response = await API.get(url);

            if (this.currentTab === 'products') {
                this.products = response || [];
                this.renderProducts();
            } else if (this.currentTab === 'drivers') {
                this.drivers = response || [];
                this.renderDrivers();
            } else {
                this.accessories = response || [];
                this.renderAccessories();
            }
        } catch (error) {
            console.error('Error during search:', error);
        }
    },

    // Centralized error display
    showErrors(tab, errorResponse) {
        console.log("ENTER: showErrors", { tab, errorResponse });
        const errorSummary = document.getElementById(`${tab}-error-summary`);
        if (!errorSummary) {
            console.warn("EARLY EXIT: Error summary element not found", `${tab}-error-summary`);
            return;
        }

        let errorHtml = '<strong>Error saving record:</strong>';

        if (errorResponse && typeof errorResponse === 'object') {
            errorHtml += '<ul>';
            for (const [field, messages] of Object.entries(errorResponse)) {
                const message = Array.isArray(messages) ? messages[0] : messages;
                errorHtml += `<li>${field}: ${message}</li>`;
            }
            errorHtml += '</ul>';
        } else {
            errorHtml += `<p>${errorResponse}</p>`;
        }

        errorSummary.innerHTML = errorHtml;
        errorSummary.style.display = 'block';
        console.log("ERRORS DISPLAYED");
        errorSummary.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    clearErrors() {
        console.log("ENTER: clearErrors");
        document.querySelectorAll('.error-summary').forEach(el => {
            el.innerHTML = '';
            el.style.display = 'none';
        });
    },

    // Product methods
    openProductModal() {
        console.log("📂 OPENING MODAL: modal-product");
        const modal = document.getElementById('modal-product');
        console.log("🔍 DOM CHECK - modal-product exists:", !!modal);
        if (modal) {
            console.log("🔍 DOM CHECK - Initial display:", modal.style.display);
        }
        this.clearErrors();
        document.getElementById('product-modal-title').textContent = 'Add Product';
        document.getElementById('form-product').reset();
        document.getElementById('product-id').value = '';
        this.updateImagePreview('visual-preview', null);
        this.updateImagePreview('illustrative-preview', null);
        this.updateImagePreview('photometrics-preview', null);

        console.log("✅ MODAL OPEN: modal-product");
        Modals.open('modal-product');
        const modalAfter = document.getElementById('modal-product');
        if (modalAfter) {
            console.log("🔍 DOM CHECK - Display after Modals.open:", modalAfter.style.display);
            console.log("🔍 DOM CHECK - Classes after Modals.open:", modalAfter.className);
        }
        this.bindProductSave();
    },

    bindProductSave() {
        const btn = document.getElementById("save-product-btn");
        if (!btn) {
            console.error("❌ save-product-btn not found in DOM");
            return;
        }

        btn.onclick = async () => {
            console.log("✅ CLICK → SAVE PRODUCT");
            this.clearErrors();

            // 1. Loading State
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            try {
                // 2. Collection
                const formData = new FormData();

                // Required & Basic
                formData.append('make', document.getElementById('product-make')?.value || '');
                formData.append('base_price', document.getElementById('product-price')?.value || 0);

                // Optional Strings
                const textFields = [
                    ['order_code', 'product-order-code'],
                    ['luminaire_color_ral', 'product-color-ral'],
                    ['characteristics', 'product-characteristics'],
                    ['mounting_style', 'product-mounting'],
                    ['environment', 'product-environment'],
                    ['electrical_type', 'product-electrical-type'],
                    ['driver_integration', 'product-driver-integration'],
                    ['control_ready', 'product-control-ready'],
                    ['website_link', 'product-website']
                ];

                textFields.forEach(([key, id]) => {
                    const val = document.getElementById(id)?.value;
                    if (val !== undefined && val !== null && val !== '') {
                        formData.append(key, val);
                    }
                });

                // Numbers
                const numFields = [
                    ['diameter_mm', 'product-diameter'],
                    ['length_mm', 'product-length'],
                    ['width_mm', 'product-width'],
                    ['height_mm', 'product-height'],
                    ['cutout_diameter_mm', 'product-cutout'],
                    ['weight_kg', 'product-weight'],
                    ['ip_class', 'product-ip'],
                    ['wattage', 'product-wattage'],
                    ['op_voltage', 'product-voltage'],
                    ['op_current', 'product-current'],
                    ['lumen_output', 'product-lumen'],
                    ['cct_kelvin', 'product-cct'],
                    ['cri_cci', 'product-cri'],
                    ['lumen_efficency', 'product-efficiency'],
                    ['warranty_years', 'product-warranty'],
                    ['beam_angle_degree', 'product-beam']
                ];

                numFields.forEach(([key, id]) => {
                    const val = document.getElementById(id)?.value;
                    if (val !== undefined && val !== null && val !== '') {
                        formData.append(key, val);
                    }
                });

                // Files
                const fileFields = [
                    ['visual_image', 'product-visual-image'],
                    ['illustrative_details', 'product-illustrative-image'],
                    ['photometrics', 'product-photometrics-image']
                ];

                fileFields.forEach(([key, id]) => {
                    const input = document.getElementById(id);
                    if (input && input.files[0]) {
                        formData.append(key, input.files[0]);
                    }
                });

                // 3. API Transaction
                console.log("🌐 POSTING PRODUCT [FormData]...");
                const response = await API.post('/masters/products/', formData);

                // 4. Verification & Feedback
                console.log("✅ SAVE SUCCESS:", response);
                Utils.showToast('Product created successfully', 'success');

                // 5. Cleanup
                this.closeModal('modal-product');
                await this.loadProducts();

            } catch (error) {
                console.error("❌ PRODUCT SAVE FAILED:", error);
                if (error.response && error.response.data) {
                    this.showErrors('product', error.response.data);
                } else {
                    Utils.showToast('Failed to save product. Please check required fields.', 'error');
                }
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        };
    },

    // Driver methods
    openDriverModal() {
        console.log("📂 OPENING MODAL: modal-driver");
        const modal = document.getElementById('modal-driver');
        console.log("🔍 DOM CHECK - modal-driver exists:", !!modal);
        if (modal) {
            console.log("🔍 DOM CHECK - Initial display:", modal.style.display);
        }
        this.clearErrors();
        document.getElementById('driver-modal-title').textContent = 'Add Driver';
        document.getElementById('form-driver').reset();
        document.getElementById('driver-id').value = '';
        console.log("✅ MODAL OPEN: modal-driver");
        Modals.open('modal-driver');
        const modalAfter = document.getElementById('modal-driver');
        if (modalAfter) {
            console.log('🔍 DOM CHECK - Display after Modals.open:', modalAfter.style.display);
        }
        this.bindDriverSave();
    },

    bindDriverSave() {
        const btn = document.getElementById("save-driver-btn");
        if (!btn) {
            console.error("❌ save-driver-btn not found in DOM");
            return;
        }

        btn.onclick = async () => {
            console.log("✅ CLICK → SAVE DRIVER");
            this.clearErrors();

            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            try {
                const payload = {
                    driver_code: document.getElementById('driver-code')?.value || '',
                    driver_make: document.getElementById('driver-make')?.value || '',
                    input_voltage_min: document.getElementById('driver-volt-min')?.value || null,
                    input_voltage_max: document.getElementById('driver-volt-max')?.value || null,
                    max_wattage: document.getElementById('driver-wattage')?.value || null,
                    output_current_ma: document.getElementById('driver-current')?.value || null,
                    output_voltage_min: document.getElementById('driver-out-volt-min')?.value || null,
                    output_voltage_max: document.getElementById('driver-out-volt-max')?.value || null,
                    constant_type: document.getElementById('driver-constant-type')?.value,
                    dimmable: document.getElementById('driver-dimmable')?.value,
                    dimming_protocol: document.getElementById('driver-dimming-protocol')?.value,
                    ip_class: document.getElementById('driver-ip')?.value || null,
                    warranty_years: document.getElementById('driver-warranty')?.value || null,
                    base_price: document.getElementById('driver-price')?.value || 0
                };

                console.log("🌐 POSTING DRIVER [JSON]...");
                const response = await API.post('/masters/drivers/', payload);

                console.log("✅ SAVE SUCCESS:", response);
                Utils.showToast('Driver created successfully', 'success');

                this.closeModal('modal-driver');
                await this.loadDrivers();

            } catch (error) {
                console.error("❌ DRIVER SAVE FAILED:", error);
                if (error.response && error.response.data) {
                    this.showErrors('driver', error.response.data);
                } else {
                    Utils.showToast('Failed to save driver. Check required fields.', 'error');
                }
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        };
    },

    // Accessory methods
    openAccessoryModal() {
        console.log("📂 OPENING MODAL: modal-accessory");
        const modal = document.getElementById('modal-accessory');
        console.log("🔍 DOM CHECK - modal-accessory exists:", !!modal);
        if (modal) {
            console.log("🔍 DOM CHECK - Initial display:", modal.style.display);
        }
        this.clearErrors();
        document.getElementById('accessory-modal-title').textContent = 'Add Accessory';
        document.getElementById('form-accessory').reset();
        document.getElementById('accessory-id').value = '';
        console.log("✅ MODAL OPEN: modal-accessory");
        Modals.open('modal-accessory');
        const modalAfter = document.getElementById('modal-accessory');
        if (modalAfter) {
            console.log('🔍 DOM CHECK - Display after Modals.open:', modalAfter.style.display);
        }
        this.bindAccessorySave();
    },

    // Rule 3: Modal State Management
    closeModal(id) {
        console.log("🔒 CLOSING MODAL:", id);
        Modals.close(id);
    },

    bindAccessorySave() {
        const btn = document.getElementById("save-accessory-btn");
        if (!btn) {
            console.error("❌ save-accessory-btn not found in DOM");
            return;
        }

        btn.onclick = async () => {
            console.log("✅ CLICK → SAVE ACCESSORY");
            this.clearErrors();

            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            try {
                const payload = {
                    accessory_name: document.getElementById('accessory-name')?.value || '',
                    accessory_type: document.getElementById('accessory-type')?.value || '',
                    accessory_category: document.getElementById('accessory-category')?.value,
                    description: document.getElementById('accessory-description')?.value || '',
                    min_diameter_mm: document.getElementById('accessory-min-dia')?.value || null,
                    max_diameter_mm: document.getElementById('accessory-max-dia')?.value || null,
                    compatible_ip_class: document.getElementById('accessory-ip')?.value || null,
                    base_price: document.getElementById('accessory-price')?.value || 0,
                    compatible_mounting_styles: Array.from(document.getElementById('accessory-mounting').selectedOptions).map(opt => opt.value)
                };

                console.log("🌐 POSTING ACCESSORY [JSON]...");
                const response = await API.post('/masters/accessories/', payload);

                console.log("✅ SAVE SUCCESS:", response);
                Utils.showToast('Accessory created successfully', 'success');

                this.closeModal('modal-accessory');
                await this.loadAccessories();

            } catch (error) {
                console.error("❌ ACCESSORY SAVE FAILED:", error);
                if (error.response && error.response.data) {
                    this.showErrors('accessory', error.response.data);
                } else {
                    Utils.showToast('Failed to save accessory. Check required fields.', 'error');
                }
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        };
    },

    updateImagePreview(containerId, imageUrl) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (imageUrl) {
            container.innerHTML = `<img src="${imageUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
        } else {
            const icon = containerId === 'photometrics-preview' ? 'fa-chart-area' : 'fa-image';
            container.innerHTML = `<i class="fa-solid ${icon}" style="font-size: 2rem; opacity: 0.1;"></i>`;
        }
    },

    setupImagePreviews() {
        ['product-visual-image', 'product-illustrative-image', 'product-photometrics-image'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', (e) => {
                const file = e.target.files[0];
                const previewId = id.replace('product-', '').replace('-image', '') + '-preview';
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (re) => {
                        this.updateImagePreview(previewId, re.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            });
        });
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    MastersPage.init();
    MastersPage.setupImagePreviews();
});

window.MastersPage = MastersPage;
