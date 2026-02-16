// Area Products/Configurations Page Logic
const AreaProductsPage = {
    projectId: null,
    areaId: null,
    area: null,
    configurations: [],

    // Master Data Cache
    masters: {
        products: [],
        drivers: [],
        accessories: []
    },

    async init() {
        const pathParts = window.location.pathname.split('/');

        // Explicitly parse IDs as integers and validate
        this.projectId = parseInt(pathParts[2]);
        this.areaId = parseInt(pathParts[4]);

        if (isNaN(this.projectId) || isNaN(this.areaId)) {
            console.error('[AreaProductsPage] Invalid IDs in URL:', {
                project: pathParts[2],
                area: pathParts[4]
            });
            Utils.showToast('Invalid Project or Area ID', 'error');
            return;
        }

        // Load data in parallel
        await Promise.all([
            this.loadArea(),
            this.loadConfigurations(),
            this.loadMasterData()
        ]);

        this.setupEventListeners();
        this.populateDropdowns();
    },

    async loadArea() {
        try {
            this.area = await API.get(`/projects/areas/${this.areaId}/`);
            document.getElementById('area-name-display').textContent = this.area.name;
            document.getElementById('area-code-display').textContent = this.area.area_code;
        } catch (error) {
            console.error('Failed to load area:', error);
            Utils.showToast('Failed to load area details', 'error');
        }
    },

    async loadConfigurations() {
        try {
            const response = await API.get(`/configurations/configurations/by-area/${this.areaId}/`);
            this.configurations = response || [];
            this.renderConfigurations();
            this.updateStats();
        } catch (error) {
            console.error('Failed to load configurations:', error);
            const tbody = document.getElementById('product-list');
            if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--error);">Failed to load configurations</td></tr>`;
        }
    },

    async loadMasterData() {
        try {
            const [productsRes, driversRes, accessoriesRes] = await Promise.all([
                API.get('/masters/products/'),
                API.get('/masters/drivers/'),
                API.get('/masters/accessories/')
            ]);

            // Handle both flat lists and paginated responses
            this.masters.products = productsRes.results || productsRes || [];
            this.masters.drivers = driversRes.results || driversRes || [];
            this.masters.accessories = accessoriesRes.results || accessoriesRes || [];
        } catch (error) {
            console.error('Failed to load master data:', error);
            Utils.showToast('Failed to load product/driver library', 'error');
        }
    },

    populateDropdowns() {
        console.log('[AreaProductsPage] populating dropdowns with:', this.masters);
        const productSelect = document.getElementById('select-product');
        const driverSelect = document.getElementById('select-driver');

        if (productSelect) {
            productSelect.innerHTML = '<option value="">-- Choose a Product --</option>';
            this.masters.products.forEach(p => {
                // CRITICAL: Product model uses prod_id as PRIMARY KEY, not id
                // The API returns products with prod_id field only
                const id = p.prod_id;
                const make = p.make || 'Unknown Make';
                const code = p.order_code || 'No Code';
                const opt = new Option(`${make} (${code})`, id);
                productSelect.add(opt);
            });
        }

        if (driverSelect) {
            driverSelect.innerHTML = '<option value="">-- No Driver --</option>';
            this.masters.drivers.forEach(d => {
                const opt = new Option(`${d.driver_make} - ${d.driver_code}`, d.id);
                driverSelect.add(opt);
            });
        }
    },

    setupEventListeners() {
        const form = document.getElementById('form-product');
        if (form) form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Driver qty toggle logic
        const driverSelect = document.getElementById('select-driver');
        const driverQtyInput = document.getElementById('driver-qty');
        const productQtyInput = document.getElementById('prod-qty');

        if (driverSelect) {
            driverSelect.addEventListener('change', () => {
                const hasDriver = !!driverSelect.value;
                driverQtyInput.disabled = !hasDriver;
                if (hasDriver && !driverQtyInput.value) {
                    driverQtyInput.value = productQtyInput.value;
                }
            });
        }

        // Sync driver qty with prod qty by default if enabled
        if (productQtyInput) {
            productQtyInput.addEventListener('input', () => {
                if (driverSelect && driverSelect.value && !driverQtyInput.disabled) {
                    driverQtyInput.value = productQtyInput.value;
                }
            });
        }
    },

    // --- ACCESSORY DYNAMIC ROWS ---

    addAccessoryRow(accessoryId = '', quantity = 1, recordId = '') {
        const container = document.getElementById('accessories-container');
        const row = document.createElement('div');
        row.className = 'accessory-row';
        row.dataset.recordId = recordId;

        let options = '<option value="">-- Select Accessory --</option>';
        this.masters.accessories.forEach(acc => {
            options += `<option value="${acc.id}" ${acc.id == accessoryId ? 'selected' : ''}>${acc.accessory_name}</option>`;
        });

        row.innerHTML = `
            <div class="form-group">
                <select class="form-control accessory-select" required>
                    ${options}
                </select>
            </div>
            <div class="form-group">
                <input type="number" class="form-control accessory-qty" min="1" value="${quantity}" required>
            </div>
            <button type="button" class="btn-icon" style="color: var(--error); padding-bottom: 0.5rem;" onclick="AreaProductsPage.removeAccessoryRow(this)">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        container.appendChild(row);
    },

    removeAccessoryRow(button) {
        button.closest('.accessory-row').remove();
    },

    // --- FORM ACTIONS ---

    openAddConfiguration() {
        const form = document.getElementById('form-product');
        if (!form) {
            console.error('[AreaProductsPage] Error: form-product not found');
            return;
        }
        form.reset();
        document.getElementById('config-id').value = '';
        document.getElementById('config-driver-record-id').value = '';
        document.getElementById('accessories-container').innerHTML = '';
        document.getElementById('product-modal-title').textContent = 'Add Configuration';

        // Reset driver qty state
        document.getElementById('driver-qty').disabled = true;

        Modals.open('drawer-product-form');
    },

    async editConfiguration(id) {
        if (!id || isNaN(id)) {
            console.error('[AreaProductsPage] Attempted to edit invalid config ID:', id);
            Utils.showToast('Invalid Configuration ID', 'error');
            return;
        }

        try {
            const config = await API.get(`/configurations/configurations/${id}/`);

            this.openAddConfiguration(); // Reset first

            document.getElementById('product-modal-title').textContent = 'Edit Configuration';
            document.getElementById('config-id').value = config.id;
            document.getElementById('select-product').value = config.product;
            document.getElementById('prod-qty').value = config.quantity;

            if (config.driver) {
                document.getElementById('select-driver').value = config.driver.driver;
                document.getElementById('driver-qty').value = config.driver.quantity;
                document.getElementById('driver-qty').disabled = false;
                document.getElementById('config-driver-record-id').value = config.driver.id;
            }

            if (config.accessories) {
                config.accessories.forEach(acc => {
                    this.addAccessoryRow(acc.accessory, acc.quantity, acc.id);
                });
            }

            // Store original accessory IDs to handle deletions on save
            this.originalAccessoryIds = (config.accessories || []).map(a => a.id);

            Modals.open('drawer-product-form');
        } catch (error) {
            console.error('Failed to load configuration:', error);
            Utils.showToast('Failed to load configuration details', 'error');
        }
    },

    async handleSubmit(e) {
        e.preventDefault();

        // The button is outside the form, so e.target.querySelector won't find it.
        // We look for the button that points to this form.
        const submitBtn = document.querySelector(`button[form="${e.target.id}"]`) || e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : 'Save Configuration';

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        }

        try {
            const configId = document.getElementById('config-id').value;
            const productId = document.getElementById('select-product').value;
            const quantity = parseInt(document.getElementById('prod-qty').value);

            // Strict numeric area check
            if (isNaN(this.areaId)) {
                Utils.showToast('Session error: Invalid Area ID. Please refresh.', 'error');
                return;
            }

            // Client-side validation
            if (!productId || productId === 'undefined') {
                Utils.showToast('Please select a valid product', 'warning');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
                return;
            }
            if (isNaN(quantity) || quantity < 1) {
                Utils.showToast('Product quantity must be at least 1', 'warning');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
                return;
            }

            const driverId = document.getElementById('select-driver').value;
            const driverQty = parseInt(document.getElementById('driver-qty').value);
            const driverRecordId = document.getElementById('config-driver-record-id').value;

            // 1. Basic Configuration
            const configData = {
                area: parseInt(this.areaId),
                product: parseInt(productId),
                quantity: quantity
            };

            let savedConfig;
            if (configId) {
                savedConfig = await API.put(`/configurations/configurations/${configId}/`, configData);
            } else {
                savedConfig = await API.post('/configurations/configurations/', configData);
            }

            const activeConfigId = savedConfig.id;

            // 2. Driver Logic
            if (driverId) {
                const driverData = {
                    configuration: activeConfigId,
                    driver: driverId,
                    quantity: driverQty || quantity
                };
                if (driverRecordId) {
                    await API.put(`/configurations/configuration-drivers/${driverRecordId}/`, driverData);
                } else {
                    await API.post('/configurations/configuration-drivers/', driverData);
                }
            } else if (driverRecordId) {
                // Remove existing driver if deselected
                await API.delete(`/configurations/configuration-drivers/${driverRecordId}/`);
            }

            // 3. Accessories Logic (Dynamic Rows)
            const accessoryRows = document.querySelectorAll('.accessory-row');
            const currentAccessoryIds = [];

            for (const row of accessoryRows) {
                const accId = row.querySelector('.accessory-select').value;
                const accQty = parseInt(row.querySelector('.accessory-qty').value);
                const recordId = row.dataset.recordId;

                if (!accId) continue;

                const accData = {
                    configuration: activeConfigId,
                    accessory: accId,
                    quantity: accQty
                };

                if (recordId) {
                    await API.put(`/configurations/configuration-accessories/${recordId}/`, accData);
                    currentAccessoryIds.push(parseInt(recordId));
                } else {
                    const newAcc = await API.post('/configurations/configuration-accessories/', accData);
                    currentAccessoryIds.push(newAcc.id);
                }
            }

            // Delete removed accessories
            if (this.originalAccessoryIds) {
                for (const oldId of this.originalAccessoryIds) {
                    if (!currentAccessoryIds.includes(oldId)) {
                        await API.delete(`/configurations/configuration-accessories/${oldId}/`);
                    }
                }
            }

            Utils.showToast('Configuration saved successfully', 'success');
            Modals.close('drawer-product-form');
            await this.loadConfigurations();

        } catch (error) {
            console.error('Save failed:', error);
            if (error.response && error.response.data) {
                const data = error.response.data;
                const msg = Object.entries(data)
                    .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                    .join(' | ');
                Utils.showToast(msg, 'error');
            } else {
                Utils.showToast(error.message || 'Failed to save configuration', 'error');
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
    },

    renderConfigurations() {
        const tbody = document.getElementById('product-list');
        if (!tbody) return;

        if (!Array.isArray(this.configurations) || this.configurations.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No configurations found</td></tr>`;
            return;
        }

        tbody.innerHTML = this.configurations.map((config, index) => {
            // Defensive: Handle missing details
            const product = config.product_detail || {};
            const driver = config.driver ? (config.driver.driver_detail || {}) : null;
            const accessories = Array.isArray(config.accessories) ? config.accessories : [];

            const productName = product.make || 'Unknown Product';
            const productCode = product.order_code || 'N/A';
            const basePrice = parseFloat(product.base_price) || 0;
            const qty = parseInt(config.quantity) || 0;
            const total = basePrice * qty;

            const driverHtml = driver
                ? `<div>${Utils.escapeHtml(driver.driver_make || 'Unknown')}</div>
                   <div style="font-size: 0.75rem; color: var(--text-muted);">${Utils.escapeHtml(driver.driver_code || 'N/A')}</div>`
                : '<span style="color:var(--text-muted);">-</span>';

            const accHtml = accessories.length > 0
                ? `<div style="display: flex; flex-wrap: wrap; gap: 4px;">
                    ${accessories.map(a => {
                    const accDetail = a.accessory_detail || {};
                    return `<span class="product-code-badge" title="${Utils.escapeHtml(accDetail.accessory_name || '')}">
                            ${Utils.escapeHtml(accDetail.accessory_type || 'Acc')} (${a.quantity})
                        </span>`;
                }).join('')}
                   </div>`
                : '<span style="color:var(--text-muted);">-</span>';

            return `
                <tr class="product-row">
                    <td>${index + 1}</td>
                    <td>
                        <div class="product-name-cell">${Utils.escapeHtml(productName)}</div>
                        <div class="product-description">${Utils.escapeHtml(productCode)}</div>
                    </td>
                    <td>${driverHtml}</td>
                    <td>${accHtml}</td>
                    <td style="text-align: center;">${qty}</td>
                    <td style="text-align: right;">${Utils.formatCurrency(basePrice)}</td>
                    <td style="text-align: right; color: var(--accent); font-weight: 600;">${Utils.formatCurrency(total)}</td>
                    <td>
                        <div class="product-actions">
                            <button class="btn-icon" onclick="AreaProductsPage.editConfiguration(${config.id})" title="Edit">
                                <i class="fa-solid fa-edit"></i>
                            </button>
                            <button class="btn-icon" style="color: var(--error);" onclick="AreaProductsPage.deleteConfiguration(${config.id})" title="Delete">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    updateStats() {
        const totalCost = this.configurations.reduce((sum, c) => sum + ((c.product_detail.base_price || 0) * c.quantity), 0);
        document.getElementById('area-total-cost').textContent = Utils.formatCurrency(totalCost);
        document.getElementById('area-product-count').textContent = this.configurations.length;

        let driverCount = 0;
        let accCount = 0;
        this.configurations.forEach(c => {
            if (c.driver) driverCount++;
            if (c.accessories) accCount += c.accessories.length;
        });

        document.getElementById('area-driver-count').textContent = driverCount;
        document.getElementById('area-accessory-count').textContent = accCount;
    },

    async deleteConfiguration(id) {
        if (!confirm('Are you sure you want to delete this configuration?')) return;
        try {
            await API.delete(`/configurations/configurations/${id}/`);
            Utils.showToast('Configuration deleted', 'success');
            await this.loadConfigurations();
        } catch (error) {
            Utils.showToast('Failed to delete', 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AreaProductsPage.init();
});

window.AreaProductsPage = AreaProductsPage;
