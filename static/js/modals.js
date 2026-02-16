// Modal Management for Lighting ERP
const Modals = {
    // Open modal or drawer
    open(id) {
        const el = document.getElementById(id);
        if (!el) {
            console.error(`Modals.open: Element with ID "${id}" not found.`);
            return;
        }

        // Add 'open' class for CSS animations/side-drawers
        el.classList.add('open');

        // Backwards compatibility: ensure element is visible
        // Most legacy modals are hidden via display: none or style="display: none"
        el.style.display = 'flex';

        // Handle Overlay via data-overlay attribute
        const overlayId = el.getAttribute('data-overlay');
        if (overlayId) {
            const overlay = document.getElementById(overlayId);
            if (overlay) {
                overlay.classList.add('open');
                overlay.style.display = 'block';
            }
        }

        document.body.style.overflow = 'hidden';
    },

    // Close modal or drawer
    close(id) {
        const el = document.getElementById(id);
        if (!el) return;

        el.classList.remove('open');
        el.style.display = 'none';

        // Handle Overlay via data-overlay attribute
        const overlayId = el.getAttribute('data-overlay');
        if (overlayId) {
            const overlay = document.getElementById(overlayId);
            if (overlay) {
                overlay.classList.remove('open');
                overlay.style.display = 'none';
            }
        }

        // Restore scroll if no other modals/drawers are open
        const anyOpen = document.querySelector('.modal.open, .modal-overlay.open, .drawer.open, .drawer-overlay.open');
        if (!anyOpen) {
            document.body.style.overflow = '';
        }
    },

    // Global setup for closing modals on overlay click
    setupOverlayClose() {
        document.addEventListener('click', (e) => {
            const target = e.target;

            // Check if user clicked on an overlay
            if (target.classList.contains('modal-overlay') || target.classList.contains('drawer-overlay')) {
                // If it's a legacy modal where the overlay itself has the ID being tracked
                if (target.id && !target.hasAttribute('data-overlay')) {
                    this.close(target.id);
                } else {
                    // If it's a drawer overlay, find the drawer that points to it
                    const overlayId = target.id;
                    const drawer = document.querySelector(`[data-overlay="${overlayId}"]`);
                    if (drawer) {
                        this.close(drawer.id);
                    } else if (target.id) {
                        // Fallback
                        this.close(target.id);
                    }
                }
            }
        });
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    Modals.setupOverlayClose();
});

// Export for global access
window.Modals = Modals;
