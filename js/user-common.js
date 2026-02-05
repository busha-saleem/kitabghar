/**
 * Common User Functions
 * Shared functions for all user pages
 */

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

// Load user page function
function loadUserPage(page) {
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
    
    // Check if user is not admin (regular user)
    if (user.role === 'admin' || user.is_superuser) {
        // Admin trying to access user pages - redirect to admin panel
        window.location.href = 'dashboard.html';
        return;
    }
});

