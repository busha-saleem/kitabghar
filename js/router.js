// ===================================
// Client-Side Router for SPA Navigation
// ===================================

let currentPage = 'home';
let currentBookId = null;
const age=10;
// Load HTML gtemplate files
async function loadTemplate(templateName) {
    try {
        const response = await fetch(`${templateName}.html`);
        const html = await response.text();
        return html;
    } catch (error) {
        console.error('Error loading template:', error);
        return '';
    }
}

// Navigate to a specific page
async function navigateTo(page, bookId = null) {
    console.log('navigateTo called:', page, 'bookId:', bookId);
    currentPage = page;
    currentBookId = bookId;
    
    const mainContent = document.getElementById('mainContent');
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
    
    switch(page) {
        case 'home':
            await renderHomePage();
            break;
        case 'browse':
            await renderBrowsePage();
            break;
        case 'book-detail':
            await renderBookDetailPage(bookId);
            break;
        case 'payment':
            await renderPaymentPage();
            break;
        default:
            await renderHomePage();
    }
}

// Render Home Page
async function renderHomePage() {
    const mainContent = document.getElementById('mainContent');
    
    // Reload the original home page content
    mainContent.innerHTML = `
        <!-- Hero Section -->
        <section class="hero">
            <div class="hero-content">
                <h1>Bringing the Library to Your Door.</h1>
                <h2>Borrow Books Anytime, Anywhere</h2>
                <p>Access thousands of books from the comfort of your home across Pakistan</p>
                <button class="btn-hero" onclick="navigateTo('browse')">Browse Books</button>
            </div>
        </section>
        
        <!-- Latest Arrivals Section -->
        <section class="book-section">
            <div class="container">
                <div class="section-header">
                    <h2 class="section-title">LATEST ARRIVALS</h2>
                    <div class="slider-controls">
                        <button class="slider-btn prev-btn" onclick="slideBooks('latestArrivals', 'left')">‹</button>
                        <button class="slider-btn next-btn" onclick="slideBooks('latestArrivals', 'right')">›</button>
                    </div>
                </div>
                <div class="book-slider-wrapper">
                    <div class="book-slider" id="latestArrivals"></div>
                </div>
            </div>
        </section>
        
        <!-- Most Popular Section -->
        <section class="book-section">
            <div class="container">
                <div class="section-header">
                    <h2 class="section-title">MOST POPULAR</h2>
                    <div class="slider-controls">
                        <button class="slider-btn prev-btn" onclick="slideBooks('mostPopular', 'left')">‹</button>
                        <button class="slider-btn next-btn" onclick="slideBooks('mostPopular', 'right')">›</button>
                    </div>
                </div>
                <div class="book-slider-wrapper">
                    <div class="book-slider" id="mostPopular"></div>
                </div>
            </div>
        </section>
        
        <!-- How It Works Section -->
        <section class="how-it-works-section">
            <div class="container">
                <h2 class="section-title">HOW IT WORKS</h2>
                <div class="steps-grid">
                    <div class="step-card">
                        <div class="step-icon">📚</div>
                        <h3>Browse Books</h3>
                        <p>Search and explore thousands of books from our extensive collection</p>
                    </div>
                    <div class="step-card">
                        <div class="step-icon">💳</div>
                        <h3>Pay Security Fee</h3>
                        <p>One-time payment of Rs. 500 to become a member</p>
                    </div>
                    <div class="step-card">
                        <div class="step-icon">📦</div>
                        <h3>Borrow & Receive</h3>
                        <p>Select books and get them delivered to your doorstep</p>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- About Us Section -->
        <section class="about-section">
            <div class="container">
                <div class="about-content">
                    <div class="about-text">
                        <h2>ABOUT US</h2>
                        <p>We are Pakistan's leading online library service, bringing books to your doorstep. With thousands of titles available, you can borrow books from anywhere in the country.</p>
                        <p>Our mission is to make reading accessible to everyone. Simply browse, borrow, and enjoy reading from the comfort of your home.</p>
                        <ul>
                            <li>Access to thousands of books</li>
                            <li>Delivery across Pakistan</li>
                            <li>Affordable one-time security fee</li>
                            <li>Borrow up to 2 books at a time</li>
                        </ul>
                    </div>
                    <div class="about-image">
                        <img src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500" alt="Books Stack">
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Footer -->
        <footer class="footer">
            <div class="container">
                <div class="footer-content">
                    <div class="footer-section">
                        <h3>Online Library</h3>
                        <p>Bringing books to your doorstep across Pakistan</p>
                    </div>
                    <div class="footer-section">
                        <h4>Contact Us</h4>
                        <p>Email: info@onlinelibrary.pk</p>
                        <p>Phone: +92 300 1234567</p>
                        <p>Address: Karachi, Pakistan</p>
                    </div>
                    <div class="footer-section">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><a href="#" onclick="navigateTo('home')">Home</a></li>
                            <li><a href="#" onclick="navigateTo('browse')">Browse Books</a></li>
                            <li><a href="#">Terms & Conditions</a></li>
                            <li><a href="#">Privacy Policy</a></li>
                        </ul>
                    </div>
                    <div class="footer-section">
                        <h4>Follow Us</h4>
                        <div class="social-links">
                            <a href="#" class="social-icon">Facebook</a>
                            <a href="#" class="social-icon">Twitter</a>
                            <a href="#" class="social-icon">Instagram</a>
                        </div>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>&copy; 2025 Online Library Pakistan. All rights reserved.</p>
                </div>
            </div>
        </footer>
    `;
    
    // Load books into sections
    loadBookSection('latestArrivals', 'latest', 8);
    loadBookSection('mostPopular', 'popular', 8);
}

// Render Browse Page
async function renderBrowsePage() {
    const template = await loadTemplate('browse');
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = template;
    
    // Load all books initially (now async)
    const books = await getAllBooks();
    displayBrowseBooks(books);
    
    // Set up event listeners for filters
    setupBrowseFilters();
}

// Render Book Detail Page
async function renderBookDetailPage(bookId) {
    console.log('renderBookDetailPage called with bookId:', bookId, 'Type:', typeof bookId);
    
    if (!bookId || bookId === 'null' || bookId === 'undefined') {
        showToast('Invalid book ID', 'error');
        navigateTo('browse');
        return;
    }
    
    const template = await loadTemplate('book-detail');
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = template;
    
    // getBookById is now async
    const book = await getBookById(bookId);
    console.log('Book fetched:', book);
    if (!book) {
        showToast('Book not found', 'error');
        navigateTo('browse');
        return;
    }
    
    // Populate book details
    document.getElementById('detailBookCover').src = book.image;
    document.getElementById('detailBookCover').alt = book.title;
    document.getElementById('detailBookTitle').textContent = book.title;
    document.getElementById('detailBookAuthor').textContent = `by ${book.author}`;
    document.getElementById('detailBookGenre').textContent = book.genre;
    document.getElementById('detailBookYear').textContent = book.year;
    document.getElementById('detailBookPages').textContent = book.pages;
    document.getElementById('detailBookDescription').textContent = book.description;
    
    const availabilityBadge = document.getElementById('detailAvailability');
    if (book.available) {
        availabilityBadge.textContent = 'Available';
        availabilityBadge.classList.remove('borrowed');
    } else {
        availabilityBadge.textContent = 'Currently Borrowed';
        availabilityBadge.classList.add('borrowed');
    }
    
    // Set up Borrow Now button
    const borrowBtn = document.getElementById('borrowNowBtn');
    borrowBtn.onclick = () => handleBorrowBook(bookId);
    
    const user = getCurrentUser();
    if (user && user.is_paid === false) {
        borrowBtn.disabled = true;
        borrowBtn.style.backgroundColor = '#95a5a6';
        const advisory = document.createElement('p');
        advisory.textContent = 'Membership fee required to borrow';
        advisory.style.color = '#e74c3c';
        advisory.style.marginTop = '8px';
        borrowBtn.insertAdjacentElement('afterend', advisory);
    } else if (!book.available) {
        borrowBtn.disabled = true;
        borrowBtn.textContent = 'Currently Unavailable';
        borrowBtn.style.backgroundColor = '#95a5a6';
    }
    
    // Back button
    document.getElementById('backToBrowse').onclick = () => navigateTo('browse');
    
    // Set up personal details modal
    setupPersonalDetailsModal(bookId);
}

// Render Payment Page
async function renderPaymentPage() {
    const template = await loadTemplate('payment');
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = template;
    
    // Set up payment method selection
    setupPaymentMethods();
    
    // Cancel button
    document.getElementById('cancelPayment').onclick = () => {
        navigateTo('home');
    };
}

// Load books into a section (now async)
async function loadBookSection(elementId, category, limit = 8) {
    const container = document.getElementById(elementId);
    if (!container) return;
    
    // getBooksByCategory is now async
    const allBooks = await getBooksByCategory(category);
    const books = allBooks.slice(0, limit);
    container.innerHTML = '';
    
    books.forEach(book => {
        container.innerHTML += createBookCard(book);
    });
}

function escapeHtml(value) {
    const str = value === null || value === undefined ? '' : String(value);
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function sanitizeHttpUrl(value) {
    if (!value) return '';
    try {
        const url = new URL(String(value), window.location.href);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
            return url.toString();
        }
        return '';
    } catch {
        return '';
    }
}

// Create a book card HTML
function createBookCard(book) {
    if (!book || !book.id) {
        console.error('Invalid book data:', book);
        return '';
    }
    const safeTitle = escapeHtml(book.title || 'Unknown Title');
    const safeAuthor = escapeHtml(book.author || 'Unknown Author');
    const safePrice = escapeHtml(book.price || '');
    const safeImage = sanitizeHttpUrl(book.image) || 'https://via.placeholder.com/200x300?text=No+Image';
    return `
        <div class="book-card" onclick="navigateTo('book-detail', '${book.id}')">
            <img src="${safeImage}" alt="${safeTitle || 'Book'}" class="book-cover">
            <div class="book-info">
                <h3 class="book-title">${safeTitle}</h3>
                <p class="book-author">${safeAuthor}</p>
                <p class="book-price">${safePrice}</p>
                <button class="btn-view-details">View Details</button>
            </div>
        </div>
    `;
}

// Display books in browse page
function displayBrowseBooks(books) {
    const container = document.getElementById('browseBooksList');
    const resultsCount = document.getElementById('resultsCount');
    
    if (!container) return;
    
    if (books.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #7f8c8d;">No books found matching your criteria.</p>';
        resultsCount.textContent = 'No books found';
        return;
    }
    
    resultsCount.textContent = `Showing ${books.length} book${books.length !== 1 ? 's' : ''}`;
    container.innerHTML = '';
    
    books.forEach(book => {
        container.innerHTML += createBookCard(book);
    });
}

// Set up browse page filters
function setupBrowseFilters() {
    const searchInput = document.getElementById('searchInput');
    const genreFilter = document.getElementById('genreFilter');
    const authorFilter = document.getElementById('authorFilter');
    const availabilityFilter = document.getElementById('availabilityFilter');
    const clearFiltersBtn = document.getElementById('clearFilters');
    
    // Debounce timer for search
    let debounceTimer;
    
    async function applyFilters() {
        const searchTerm = searchInput.value;
        const genre = genreFilter.value;
        const author = authorFilter.value;
        const availability = availabilityFilter.value;
        
        // filterBooks is now async
        const filteredBooks = await filterBooks(searchTerm, genre, author, availability);
        displayBrowseBooks(filteredBooks);
    }
    
    // Debounced search input
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(applyFilters, 300);
    });
    genreFilter.addEventListener('change', applyFilters);
    authorFilter.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(applyFilters, 300);
    });
    availabilityFilter.addEventListener('change', applyFilters);
    
    clearFiltersBtn.addEventListener('click', () => {
        searchInput.value = '';
        genreFilter.value = '';
        authorFilter.value = '';
        availabilityFilter.value = '';
        applyFilters();
    });
}
