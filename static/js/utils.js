// Utility Functions for Lighting ERP
const Utils = {
    // Format currency
    formatCurrency(amount) {
        return `₹ ${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },

    // Format date
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    },

    // Show toast notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container') || this.createToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = type === 'success' ? 'check-circle' :
            type === 'error' ? 'exclamation-circle' :
                type === 'warning' ? 'exclamation-triangle' : 'info-circle';

        toast.innerHTML = `
            <i class="fa-solid fa-${icon}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
        return container;
    },

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    },

    // Unescape HTML
    unescapeHtml(html) {
        if (!html) return '';
        const div = document.createElement('div');
        div.innerHTML = String(html);
        return div.textContent || div.innerText || '';
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Get initials from name
    getInitials(name) {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    },

    // Audit Log implementation (ERP Contract Strictly Followed)
    async initAuditLog(moduleName, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="audit-panel">
                <div class="audit-header">
                    <h4><i class="fa-solid fa-clock-rotate-left"></i> Audit Logs: ${moduleName.toUpperCase()}</h4>
                    <button class="btn btn-sm btn-icon" onclick="Utils.initAuditLog('${moduleName}', '${containerId}')">
                        <i class="fa-solid fa-sync"></i>
                    </button>
                </div>
                <div class="audit-body" id="${containerId}-body">
                    <div style="text-align:center; padding: 2rem;">
                        <i class="fa-solid fa-spinner fa-spin"></i> Loading logs...
                    </div>
                </div>
            </div>
        `;

        try {
            const response = await fetch(`/api/common/audit/logs/?model=${moduleName}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            const body = document.getElementById(`${containerId}-body`);

            if (!data.results || data.results.length === 0) {
                body.innerHTML = `
                    <div style="text-align:center; padding: 2rem; color: var(--text-muted);">
                        No logs found for this module.
                    </div>`;
                return;
            }

            // 🎯 Frontend Strict Contract Usage: action, actor, timestamp, object
            body.innerHTML = data.results.map(log => `
                <div class="audit-entry">
                    <div class="audit-entry-top">
                        <span class="audit-action badge-${log.action.toLowerCase().replace(/ /g, '-')}">${log.action}</span>
                        <span class="audit-actor">by ${log.actor}</span>
                    </div>
                    <div class="audit-timestamp">${log.timestamp}</div>
                    <div class="audit-object-name">${log.object}</div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Failed to load audit logs:', error);
            const body = document.getElementById(`${containerId}-body`);
            if (body) {
                body.innerHTML = `
                    <div style="text-align:center; padding: 2rem; color: var(--error);">
                        Error loading logs
                    </div>`;
            }
        }
    }
};

// Export for use in other scripts
window.Utils = Utils;
