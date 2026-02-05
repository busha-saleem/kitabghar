// ===================================
// Main Application Logic
// ===================================

// Toast notification helper
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

window.showToast = showToast;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.userManager) {
        userManager.init();
    }
    initApp();
});
// Initialize application
function initApp() {
    // Set up hamburger menu
    setupHamburgerMenu();
    
    // Set up navigation
    setupNavigation();
    
    // Set up navbar search
    setupNavbarSearch();
    
    // Load home page content
    loadBookSection('latestArrivals', 'latest', 8);
    loadBookSection('mostPopular', 'popular', 8);
    
    // Update user panel
    updateUserPanel();
    
    // Set up hero background animation
    setupHeroBackgroundAnimation();
}

// Hero background animation
function setupHeroBackgroundAnimation() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    const backgrounds = [
        'linear-gradient(rgba(60, 47, 47, 0.85), rgba(60, 47, 47, 0.85)), url(https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200)',
        'linear-gradient(rgba(60, 47, 47, 0.85), rgba(60, 47, 47, 0.85)), url(https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200)',
        'linear-gradient(rgba(60, 47, 47, 0.85), rgba(60, 47, 47, 0.85)), url(https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200)'
    ];
    
    let currentIndex = 0;
    
    setInterval(() => {
        currentIndex = (currentIndex + 1) % backgrounds.length;
        hero.style.background = backgrounds[currentIndex] + ' center/cover';
    }, 5000); // Change every 5 seconds
}

// Set up hamburger menu functionality
function setupHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const userPanel = document.getElementById('userPanel');
    const panelOverlay = document.getElementById('panelOverlay');
    const closePanel = document.getElementById('closePanel');
    
    // Open panel
    hamburgerBtn.addEventListener('click', () => {
        openUserPanel();
    });
    
    // Close panel via close button
    closePanel.addEventListener('click', () => {
        closeUserPanel();
    });
    
    // Close panel via overlay click
    panelOverlay.addEventListener('click', () => {
        closeUserPanel();
    });
    
    // User panel buttons
    const loginRedirect = () => {
        localStorage.setItem('redirectAfterLogin', window.location.href);
        window.location.href = 'login.html';
    };
    document.getElementById('signupBtn').addEventListener('click', loginRedirect);
    document.getElementById('loginBtn').addEventListener('click', loginRedirect);
    document.getElementById('payNowBtn').addEventListener('click', () => {
        closeUserPanel();
        window.location.href = 'membership-status.html';
    });
    document.getElementById('logoutBtn1').addEventListener('click', handleUserLogout);
    document.getElementById('logoutBtn2').addEventListener('click', handleUserLogout);
    
    // My Account link
    document.getElementById('myAccountLink').addEventListener('click', (e) => {
        e.preventDefault();
        openUserPanel();
    });
}

// Open user panel
function openUserPanel() {
    const userPanel = document.getElementById('userPanel');
    const panelOverlay = document.getElementById('panelOverlay');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    
    userPanel.classList.add('active');
    panelOverlay.classList.add('active');
    hamburgerBtn.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Close user panel
function closeUserPanel() {
    const userPanel = document.getElementById('userPanel');
    const panelOverlay = document.getElementById('panelOverlay');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    
    userPanel.classList.remove('active');
    panelOverlay.classList.remove('active');
    hamburgerBtn.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

// Set up navigation
function setupNavigation() {
    document.querySelectorAll('[data-page]').forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            const page = element.dataset.page;
            navigateTo(page);
        });
    });
}

// Handle borrow book action (now async)
async function handleBorrowBook(bookId) {
    // getBookById is now async
    const book = await getBookById(bookId);
    if (!book) {
        showToast('Book not found', 'error');
        return;
    }
    
    // Check if book is available
    if (!book.available) {
        showToast('This book is currently borrowed by another member.', 'error');
        return;
    }
    
    // Check if user can borrow
    const borrowCheck = userManager ? userManager.canBorrow() : { status: false, message: 'Please log in to borrow books.' };
    if (!borrowCheck.status) {
        showToast(borrowCheck.message, 'error');
        const user = userManager ? userManager.getCurrentUser() : null;
        if (!user || !user.isLoggedIn) {
            openUserPanel();
        } else if (!user.isPaid && !user.is_paid) {
            window.location.href = 'membership-status.html';
        }
        return;
    }
    
    // Show personal details modal
    const modal = document.getElementById('personalDetailsModal');
    modal.classList.add('active');
}

// Set up personal details modal
function setupPersonalDetailsModal(bookId) {
    const modal = document.getElementById('personalDetailsModal');
    const closeModal = document.getElementById('closePersonalDetails');
    const form = document.getElementById('personalDetailsForm');
    
    // Close modal
    closeModal.onclick = () => {
        modal.classList.remove('active');
    };
    
    // Close modal when clicking outside
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    };
    
    // Handle form submission (now async)
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const personalDetails = {
            fullName: document.getElementById('fullName').value,
            phoneNumber: document.getElementById('phoneNumber').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            postalCode: document.getElementById('postalCode').value
        };
        
        // Borrow the book (now async)
        const success = await borrowBook(bookId, personalDetails);
        if (success) {
            showToast('Book borrowed successfully! It will be delivered to your address within 2-3 business days.', 'success');
            modal.classList.remove('active');
            form.reset();
            updateUserPanel();
            navigateTo('home');
        } else {
            showToast('Failed to borrow book. Please try again.', 'error');
        }
    };
}

// Set up payment methods
function setupPaymentMethods() {
    const paymentOptions = document.querySelectorAll('.payment-option');
    
    paymentOptions.forEach(option => {
        const radio = option.querySelector('input[type="radio"]');
        const header = option.querySelector('.payment-header');
        const form = option.querySelector('.payment-form');
        
        // Toggle payment form visibility
        header.addEventListener('click', () => {
            // Hide all forms first
            document.querySelectorAll('.payment-form').forEach(f => {
                f.style.display = 'none';
            });
            
            // Remove selected class from all options
            paymentOptions.forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Check the radio and show the form
            radio.checked = true;
            option.classList.add('selected');
            form.style.display = 'block';
        });
        
        // Handle form submission
        const paymentForm = option.querySelector('form');
        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                handlePayment(option.dataset.method);
            });
        }
    });
}

// Handle payment submission
function handlePayment(method) {
    // Simulate payment processing
    const methodNames = {
        'easypaisa': 'EasyPaisa',
        'jazzcash': 'JazzCash',
        'card': 'Credit/Debit Card'
    };
    
    const methodName = methodNames[method] || 'selected payment method';
    
    // Show processing message
    if (confirm(`Process payment of Rs. 500 via ${methodName}?`)) {
        // Simulate payment delay
        showToast('Processing payment...', 'info');
        
        setTimeout(() => {
            // Mark user as paid
            markUserAsPaid();
            updateUserPanel();
            showToast('Payment successful! You can now borrow books. Welcome to our library!', 'success');
            navigateTo('home');
        }, 1000);
    }
}

// Format card number input (add spaces)
function formatCardNumber(input) {
    let value = input.value.replace(/\s/g, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    input.value = formattedValue;
}

// Format expiry date (MM/YY)
function formatExpiry(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    input.value = value;
}

// Add input formatters after payment page loads
document.addEventListener('input', (e) => {
    if (e.target.id === 'cardNumber') {
        formatCardNumber(e.target);
    }
    if (e.target.id === 'cardExpiry') {
        formatExpiry(e.target);
    }
});

// Prevent default form submissions on Enter key for search
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.target.classList.contains('search-input') || e.target.classList.contains('filter-input'))) {
        e.preventDefault();
    }
});

// Smooth scroll to top when navigating
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Call scrollToTop when navigating
const originalNavigateTo = navigateTo;
navigateTo = async function(page, bookId = null) {
    await originalNavigateTo(page, bookId);
    scrollToTop();
};

// Set up navbar search
function setupNavbarSearch() {
    const navSearchInput = document.getElementById('navSearchInput');
    const navSearchBtn = document.querySelector('.nav-search-btn');
    
    if (navSearchInput && navSearchBtn) {
        // Search on button click
        navSearchBtn.addEventListener('click', () => {
            const searchTerm = navSearchInput.value.trim();
            if (searchTerm) {
                navigateTo('browse');
                // Wait for browse page to load, then apply search
                setTimeout(() => {
                    const browseSearchInput = document.getElementById('searchInput');
                    if (browseSearchInput) {
                        browseSearchInput.value = searchTerm;
                        browseSearchInput.dispatchEvent(new Event('input'));
                    }
                }, 100);
            }
        });
        
        // Search on Enter key
        navSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                navSearchBtn.click();
            }
        });
    }
}

// Slider functionality for book sections
let sliderPositions = {
    latestArrivals: 0,
    mostPopular: 0
};

function slideBooks(sectionId, direction) {
    const slider = document.getElementById(sectionId);
    if (!slider) return;
    
    const cardWidth = 180 + 24; // card width + gap
    const visibleCards = Math.floor(slider.parentElement.offsetWidth / cardWidth);
    const maxScroll = slider.children.length - visibleCards;
    
    if (direction === 'left') {
        sliderPositions[sectionId] = Math.max(0, sliderPositions[sectionId] - 1);
    } else {
        sliderPositions[sectionId] = Math.min(maxScroll, sliderPositions[sectionId] + 1);
    }
    
    const translateX = -sliderPositions[sectionId] * cardWidth;
    slider.style.transform = `translateX(${translateX}px)`;
}

// Make slideBooks available globally
window.slideBooks = slideBooks;

function getUserState() {
    const user = userManager && userManager.getCurrentUser ? userManager.getCurrentUser() : null;
    if (user && user.isPaid === undefined) {
        user.isPaid = user.is_paid;
    }
    return user;
}

async function updateUserPanel() {
    const notLoggedInState = document.getElementById('notLoggedInState');
    const loggedInNotPaidState = document.getElementById('loggedInNotPaidState');
    const paidMemberState = document.getElementById('paidMemberState');

    if (!notLoggedInState || !loggedInNotPaidState || !paidMemberState) {
        return;
    }

    let user = getUserState();
    
    // Refresh borrowed books from Supabase if user is logged in
    if (user && user.isLoggedIn && user.id) {
        try {
            // Get both pending and borrowed status
            const { data: borrowings } = await supabase
                .from('borrowings')
                .select('*, books(title, author, image)')
                .eq('user_id', user.id)
                .in('status', ['borrowed', 'pending']);
            
            const { data: returned } = await supabase
                .from('borrowings')
                .select('*, books(title, author)')
                .eq('user_id', user.id)
                .eq('status', 'returned');
            
            user.borrowedBooks = (borrowings || []).map(b => ({
                bookId: b.book_id,
                borrowingId: b.id,
                title: b.books?.title || 'Unknown',
                author: b.books?.author || 'Unknown',
                image: b.books?.image || '',
                borrowDate: b.borrow_date,
                returnDate: b.due_date,
                dueDate: b.due_date,
                returnRequested: b.return_requested,
                status: b.status
            }));
            
            user.returnedBooks = (returned || []).map(b => ({
                bookId: b.book_id,
                title: b.books?.title || 'Unknown',
                author: b.books?.author || 'Unknown',
                borrowDate: b.borrow_date,
                returnedDate: b.return_date
            }));
            
            // Update localStorage
            localStorage.setItem('currentUser', JSON.stringify(user));
        } catch (error) {
            console.error('Error refreshing user borrowings:', error);
        }
    }

    notLoggedInState.style.display = 'none';
    loggedInNotPaidState.style.display = 'none';
    paidMemberState.style.display = 'none';

    if (!user || !user.isLoggedIn) {
        notLoggedInState.style.display = 'block';
        return;
    }

    if (user && user.isLoggedIn && !user.isPaid && !user.is_paid) {
        loggedInNotPaidState.style.display = 'block';
        const nameSpan = document.getElementById('userName');
        if (nameSpan) {
            nameSpan.textContent = user.name || user.first_name || user.username || 'User';
        }
        return;
    }

    paidMemberState.style.display = 'block';
    const namePaid = document.getElementById('userNamePaid');
    if (namePaid) {
        namePaid.textContent = user.name || user.first_name || user.username || 'User';
    }

    // Check if user is admin
    const isAdmin = user.role === 'admin';
    const memberTypeText = document.getElementById('memberTypeText');
    const borrowedBooksSection = document.getElementById('borrowedBooksSection');
    const returnedBooksSection = document.getElementById('returnedBooksSection');
    const goToDashboardBtn = document.getElementById('goToDashboard');

    if (isAdmin) {
        if (memberTypeText) memberTypeText.textContent = 'Admin';
        if (borrowedBooksSection) borrowedBooksSection.style.display = 'none';
        if (returnedBooksSection) returnedBooksSection.style.display = 'none';
        if (goToDashboardBtn) {
            goToDashboardBtn.textContent = 'Go to Admin Dashboard';
            goToDashboardBtn.onclick = () => { window.location.href = 'dashboard.html'; };
        }
    } else {
        if (memberTypeText) memberTypeText.textContent = 'Active Member';
        if (borrowedBooksSection) borrowedBooksSection.style.display = 'block';
        if (returnedBooksSection) returnedBooksSection.style.display = 'block';
        if (goToDashboardBtn) {
            goToDashboardBtn.textContent = 'Go to Dashboard';
            goToDashboardBtn.onclick = () => { window.location.href = 'u_dash.html'; };
        }
    }

    const borrowedBooks = user.borrowedBooks || [];
    const borrowedCount = document.getElementById('borrowedCount');
    if (borrowedCount) {
        borrowedCount.textContent = borrowedBooks.length;
    }

    const borrowedBooksList = document.getElementById('borrowedBooksList');
    if (borrowedBooksList) {
        if (!borrowedBooks.length) {
            borrowedBooksList.innerHTML = '<p class="empty-message">No books currently borrowed</p>';
        } else {
            borrowedBooksList.innerHTML = '';
            borrowedBooks.forEach((book) => {
                const isPending = book.status === 'pending';
                const daysRemaining = getDaysRemaining(book.returnDate || book.dueDate);
                const urgentClass = daysRemaining <= 3 ? 'urgent' : '';
                
                let statusText = '';
                let returnButton = '';
                
                if (isPending) {
                    statusText = '<p style="color: #f39c12; font-weight: bold;">⏳ Borrow Requested - Waiting for admin approval</p>';
                } else if (book.returnRequested) {
                    statusText = '<p style="color: #f39c12;">Return requested - Pending admin approval</p>';
                } else {
                    returnButton = `<button class="btn-return" onclick="handleReturnRequest('${book.bookId}')">Request Return</button>`;
                }

                borrowedBooksList.innerHTML += `
                    <div class="borrowed-book-item">
                        <h5>${book.title}</h5>
                        <p>By ${book.author || ''}</p>
                        ${isPending ? '' : `<p>Borrowed: ${book.borrowDate ? new Date(book.borrowDate).toLocaleDateString() : '-'}</p>`}
                        <p>Return by: ${book.returnDate ? new Date(book.returnDate).toLocaleDateString() : '-'}</p>
                        ${isPending ? '' : `<p class="days-remaining ${urgentClass}">${daysRemaining} days remaining</p>`}
                        ${statusText}
                        ${returnButton}
                    </div>
                `;
            });
        }
    }

    const returnedBooksList = document.getElementById('returnedBooksList');
    if (returnedBooksList) {
        const returnedBooks = user.returnedBooks || [];
        if (!returnedBooks.length) {
            returnedBooksList.innerHTML = '<p class="empty-message">No returned books yet</p>';
        } else {
            returnedBooksList.innerHTML = '';
            returnedBooks.forEach((book) => {
                returnedBooksList.innerHTML += `
                    <div class="returned-book-item">
                        <h5>${book.title}</h5>
                        <p>By ${book.author || ''}</p>
                        <p>Borrowed: ${book.borrowDate ? new Date(book.borrowDate).toLocaleDateString() : '-'}</p>
                        <p>Returned: ${book.returnedDate ? new Date(book.returnedDate).toLocaleDateString() : '-'}</p>
                    </div>
                `;
            });
        }
    }
}

function handleReturnRequest(bookId) {
    if (confirm('Are you sure you want to request return for this book? An admin will approve once they receive the book back.')) {
        if (userManager && userManager.requestReturn(bookId)) {
            showToast('Return request submitted successfully! You will be notified once the admin approves.', 'success');
            updateUserPanel();
        }
    }
}

function handleUserLogout() {
    if (userManager && userManager.logout) {
        userManager.logout();
    }
    localStorage.removeItem('libraryUser');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    updateUserPanel();
    closeUserPanel();
    window.location.reload();
}

// Console log for development
console.log('Online Library Web App Initialized');
console.log('Created by: Online Library Pakistan Team');
console.log('Ready for Django backend integration');
