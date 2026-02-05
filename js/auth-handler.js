/**
 * Authentication Handler
 */

document.addEventListener('DOMContentLoaded', () => {
    setupLoginForm();
    setupSignupForm();
});

function notify(message, type = 'info') {
    if (!window.showToast) {
        // Minimal inline toast if global helper is missing
        const containerId = 'toastContainer';
        let container = document.getElementById(containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.style.position = 'fixed';
            container.style.top = '20px';
            container.style.right = '20px';
            container.style.zIndex = '9999';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '10px';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.padding = '12px 16px';
        toast.style.borderRadius = '6px';
        toast.style.background = type === 'error' ? '#ffdddd' : '#f0f4ff';
        toast.style.borderLeft = `4px solid ${type === 'error' ? '#e74c3c' : '#3b82f6'}`;
        toast.style.boxShadow = '0 4px 10px rgba(0,0,0,0.12)';
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
            setTimeout(() => container.removeChild(toast), 200);
        }, 3000);
        return;
    }
    showToast(message, type);
}

// Setup login form
function setupLoginForm() {
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const usernameOrEmail = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            if (!usernameOrEmail || !password) {
                notify('Please enter both username/email and password', 'error');
                return;
            }
            
            try {
                // Login is now async with Supabase
                const user = await userManager.login(usernameOrEmail, password);
                setCurrentUser(user);
                setAuthToken('supabaseToken');
                localStorage.setItem('authToken', 'supabaseToken');
                checkRoleAndRedirect();
            } catch (error) {
                console.error('Login error:', error);
                notify('Login failed: ' + (error.message || 'Invalid credentials'), 'error');
            }
        });
    }
}

// Setup signup form
function setupSignupForm() {
    const form = document.getElementById('signupForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = document.getElementById('signupPassword').value;
            const password2 = document.getElementById('signupPassword2').value;
            
            if (password !== password2) {
                notify('Passwords do not match', 'error');
                return;
            }
            
            const userData = {
                username: document.getElementById('signupUsername').value.trim(),
                email: document.getElementById('signupEmail').value.trim(),
                password: password,
                first_name: document.getElementById('signupFirstName').value.trim(),
                last_name: document.getElementById('signupLastName').value.trim(),
                phone: document.getElementById('signupPhone').value.trim() || null,
                address: document.getElementById('signupAddress').value.trim() || null,
            };
            
            try {
                // Check if username already exists in Supabase
                const { data: existingUsername } = await supabase
                    .from('users')
                    .select('id')
                    .eq('username', userData.username)
                    .single();
                
                if (existingUsername) {
                    notify('Username already exists', 'error');
                    return;
                }
                
                // Check if email already exists in Supabase
                const { data: existingEmail } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', userData.email)
                    .single();
                
                if (existingEmail) {
                    notify('Email already exists', 'error');
                    return;
                }
                
                // Insert new user into Supabase
                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert({
                        username: userData.username,
                        email: userData.email,
                        password: userData.password,
                        first_name: userData.first_name,
                        last_name: userData.last_name,
                        phone: userData.phone,
                        address: userData.address,
                        role: 'user',
                        is_paid: false,
                        borrowed_books_count: 0
                    })
                    .select()
                    .single();
                
                if (insertError) {
                    throw insertError;
                }
                
                // Log the user in
                const loggedInUser = await userManager.login(userData.username, userData.password);
                setAuthToken('supabaseToken');
                setCurrentUser(loggedInUser);
                
                notify('Registration successful! Please pay the security fee to start borrowing books.', 'success');
                
                // Small delay to show the success message
                setTimeout(() => {
                    window.location.href = 'membership-status.html';
                }, 1000);
                
            } catch (error) {
                console.error('Registration error:', error);
                notify('Registration failed: ' + (error.message || 'Please check your information and try again'), 'error');
            }
        });
    }
}

// Show signup form
function showSignupForm() {
    document.getElementById('signupModal').classList.add('active');
}

// Close signup modal
function closeSignupModal() {
    document.getElementById('signupModal').classList.remove('active');
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

function checkRoleAndRedirect() {
    const userStr = localStorage.getItem('currentUser');
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const isAdmin = user.role === 'admin' || user.is_superuser;
    const isPaid = user.is_paid || user.isPaid;

    if (isAdmin) {
        // Use replace to avoid back button issues
        window.location.replace('dashboard.html');
        return;
    }

    if (!isPaid) {
        localStorage.removeItem('redirectAfterLogin');
        window.location.replace('membership-status.html');
        return;
    }

    const redirectUrl = localStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
        localStorage.removeItem('redirectAfterLogin');
        // Ensure proper CSS loading by using replace
        window.location.replace(redirectUrl);
        return;
    }

    window.location.replace('u_dash.html');
}


// Function to ensure CSS is loaded properly
function ensureCSSLoaded() {
    // Check if main stylesheet is loaded
    const mainCSS = document.querySelector('link[href*="styles.css"]');
    if (!mainCSS) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/styles.css';
        document.head.appendChild(link);
    }
    
    // Force a repaint to ensure styles are applied
    document.body.style.display = 'none';
    document.body.offsetHeight; // Trigger reflow
    document.body.style.display = '';
}

// Call this function when navigating back to main pages
window.ensureCSSLoaded = ensureCSSLoaded;

// Auto-fix CSS on page load
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure all resources are loaded
    setTimeout(ensureCSSLoaded, 100);
});