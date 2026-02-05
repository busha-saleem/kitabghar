/**
 * Common Admin Functions
 * Shared functions for all admin pages
 */

// Toast notification helper for admin pages
function ensureToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        document.body.appendChild(container);
    }
    return container;
}

function showToast(message, type = 'info') {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.padding = '12px 16px';
    toast.style.borderRadius = '6px';
    toast.style.boxShadow = '0 4px 10px rgba(0,0,0,0.12)';
    toast.style.background =
        type === 'error'
            ? '#ffdddd'
            : type === 'success'
            ? '#e8f7ef'
            : '#f0f4ff';
    toast.style.color = '#1f2937';
    toast.style.minWidth = '240px';
    toast.style.fontWeight = '600';
    toast.style.borderLeft = `4px solid ${
        type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3b82f6'
    }`;
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';

    container.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => {
            container.removeChild(toast);
        }, 200);
    }, 3000);
}

// Handle logout
function handleLogout() {
    if (window.authAPI) {
        authAPI.logout();
    }
    localStorage.removeItem('libraryUser');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    window.location.href = 'index.html';
}

// Load page function (works from any admin page)
function loadPage(page) {
    window.location.href = `${page}.html`;
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    const token = getAuthToken();
    
    if (!user || !token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Check if user is admin
    if (user.role !== 'admin' && !user.is_superuser) {
        showToast('Access denied. Admin privileges required.', 'error');
        window.location.href = 'u_dash.html';
        return;
    }
});

