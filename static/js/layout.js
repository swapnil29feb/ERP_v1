// Layout Management for Lighting ERP
const Layout = {
    // Initialize layout
    init() {
        this.restoreSidebarState();
        this.setupUserInfo();
        this.hideLoader();
    },

    // Toggle sidebar
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        }
    },

    // Restore sidebar state
    restoreSidebarState() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && localStorage.getItem('sidebarCollapsed') === 'true') {
            sidebar.classList.add('collapsed');
        }
    },

    // Setup user info
    async setupUserInfo() {
        try {
            const user = await API.getCurrentUser();
            if (user) {
                const initialsEl = document.getElementById('user-avatar-initials');
                const usernameEl = document.getElementById('user-username');
                const roleEl = document.getElementById('user-role-badge');

                if (initialsEl) initialsEl.textContent = Utils.getInitials(user.username);
                if (usernameEl) usernameEl.textContent = user.username;

                if (roleEl) {
                    if (user.is_superuser) {
                        roleEl.textContent = 'Admin';
                        roleEl.className = 'role-badge badge-admin';
                    } else if (user.is_staff) {
                        roleEl.textContent = 'Manager';
                        roleEl.className = 'role-badge badge-manager';
                    } else {
                        roleEl.textContent = 'Viewer';
                        roleEl.className = 'role-badge badge-viewer';
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load user info:', error);
        }
    },

    // Hide global loader
    hideLoader() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 500);
        }
    },

    // Logout
    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login/';
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    Layout.init();
});

// Export for use in other scripts
window.Layout = Layout;
