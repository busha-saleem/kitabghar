/**
 * User Membership Status JavaScript (Supabase)
 */

let selectedPaymentMethod = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadMembershipStatus();
});

function checkAuth() {
    // Authentication check is handled in user-common.js
}

// Load membership status from localStorage (synced with Supabase on login)
function loadMembershipStatus() {
    try {
        const userStr = localStorage.getItem('currentUser');
        const user = userStr ? JSON.parse(userStr) : null;
        
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        
        const nameEl = document.getElementById('userName');
        if (nameEl) {
            nameEl.textContent = user.first_name || user.username || 'User';
        }
        
        const statusText = document.getElementById('membershipStatusText');
        const statusBtn = document.getElementById('membershipStatusBtn');
        
        if (statusText) {
            statusText.textContent = user.is_paid ? 'Paid' : 'Not Paid';
        }
        if (statusBtn) {
            if (user.is_paid) {
                statusBtn.textContent = 'ACTIVE';
                statusBtn.classList.add('active');
            } else {
                statusBtn.textContent = 'Not Active';
                statusBtn.classList.remove('active');
            }
        }
    } catch (error) {
        console.error('Error loading membership status:', error);
    }
}

// Select payment method
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    document.getElementById(method).checked = true;
}

// Process payment using Supabase
async function processPayment() {
    if (!selectedPaymentMethod) {
        showToast('Please select a payment method', 'error');
        return;
    }
    
    if (!confirm('Process payment of Rs. 1000?')) return;
    
    try {
        const userStr = localStorage.getItem('currentUser');
        const user = userStr ? JSON.parse(userStr) : null;
        
        if (!user) {
            showToast('User not found. Please log in again.', 'error');
            return;
        }
        
        // Update user's is_paid status in Supabase
        const { error } = await supabase
            .from('users')
            .update({ is_paid: true })
            .eq('id', user.id);
        
        if (error) throw error;
        
        // Update local storage
        user.is_paid = true;
        user.isPaid = true;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        showToast('Payment successful! Your membership is now active.', 'success');
        loadMembershipStatus();
        
        // Redirect to user dashboard after a short delay
        setTimeout(() => {
            window.location.href = 'u_dash.html';
        }, 1500);
    } catch (error) {
        console.error('Error processing payment:', error);
        showToast('Failed to process payment: ' + error.message, 'error');
    }
}

// Functions defined in user-common.js

