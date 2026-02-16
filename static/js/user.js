/**
 * user.js - Handles fetching current user profile and updating UI roles
 */

async function fetchCurrentUser() {
    const token = getAccessToken();
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}common/auth/me/`);
        if (response.ok) {
            const user = await response.json();
            updateUIForUser(user);
        } else if (response.status === 401) {
            // Handled by fetch interceptor (logout)
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
    }
}

function updateUIForUser(user) {
    // 1. Update Title Bar
    const navUsername = document.getElementById('nav-username');
    const navRole = document.getElementById('nav-role');
    const userInfoHeader = document.getElementById('user-info');

    if (navUsername) navUsername.textContent = user.username;
    if (navRole) {
        // Display primary role (highest seniority for simple UI)
        const primaryRole = user.roles && user.roles.length > 0 ? user.roles[0] : (user.is_superuser ? 'Superuser' : 'User');
        navRole.textContent = primaryRole;
        navRole.className = `user-role badge badge-${primaryRole.toLowerCase()}`;
    }
    if (userInfoHeader) userInfoHeader.style.display = 'flex';

    // 2. Sidebar Link Visibility
    const roles = user.roles || [];
    const isAdmin = roles.includes('Admin') || user.is_superuser;
    const isSales = roles.includes('Sales');
    const isFinance = roles.includes('Finance');

    // Sidebar selectors
    const navMasters = document.getElementById('nav-masters');
    const navAudit = document.getElementById('nav-audit');
    const navProjects = document.getElementById('nav-projects');
    const navConfigurations = document.getElementById('nav-configurations');

    // Rule: Masters - Admin Only
    if (navMasters) {
        if (!isAdmin) navMasters.style.display = 'none';
    }

    // Rule: Audit Logs - Authenticated (based on latest user request, everyone can see but usually restricted)
    // Actually, user said "Everyone can see the audit logs" now.
    if (navAudit) {
        navAudit.style.display = 'block';
    }

    // Rule: Projects - Admin and Sales
    if (navProjects) {
        if (!isAdmin && !isSales) navProjects.style.display = 'none';
    }

    // 3. Page specific elements (Approve Buttons, etc.)
    // These might not be in the DOM yet if on a different page, 
    // but we can look for them or run this function on DOM mutations if needed.
    // For now, handle what is in base.html

    // Global Approve Button Rule (Admin Only)
    const approveButtons = document.querySelectorAll('.btn-approve');
    approveButtons.forEach(btn => {
        if (!isAdmin) btn.style.display = 'none';
    });
}

// Initial fetch on load
document.addEventListener('DOMContentLoaded', () => {
    if (getAccessToken()) {
        fetchCurrentUser();
    }
});
