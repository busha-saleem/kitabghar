/**
 * User Dashboard JavaScript (Supabase)
 */

document.addEventListener('DOMContentLoaded', async () => {
    const user = getStoredUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    renderWelcome(user);
    renderMembership(user);
    
    // Fetch fresh data from Supabase
    await loadUserBorrowings(user.id);
});

function getStoredUser() {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
}

// Load user borrowings from Supabase
async function loadUserBorrowings(userId) {
    try {
        // Get current borrowings (both pending and borrowed)
        const { data: borrowings, error: borrowError } = await supabase
            .from('borrowings')
            .select('*, books(title, author, image)')
            .eq('user_id', userId)
            .in('status', ['borrowed', 'pending'])
            .order('borrow_date', { ascending: false });
        
        if (borrowError) throw borrowError;
        
        // Get returned books
        const { data: returned, error: returnError } = await supabase
            .from('borrowings')
            .select('*, books(title, author)')
            .eq('user_id', userId)
            .eq('status', 'returned')
            .order('return_date', { ascending: false });
        
        if (returnError) throw returnError;
        
        const borrowedBooks = (borrowings || []).map(b => ({
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
        
        const returnedBooks = (returned || []).map(b => ({
            bookId: b.book_id,
            title: b.books?.title || 'Unknown',
            author: b.books?.author || 'Unknown',
            borrowDate: b.borrow_date,
            returnedDate: b.return_date
        }));
        
        // Update local storage with fresh data
        const user = getStoredUser();
        if (user) {
            user.borrowedBooks = borrowedBooks;
            user.returnedBooks = returnedBooks;
            localStorage.setItem('currentUser', JSON.stringify(user));
        }
        
        renderBorrowedBookSummary(borrowedBooks);
        renderBorrowHistory(borrowedBooks);
        renderReturnedHistory(returnedBooks);
        renderBorrowedBooksList(borrowedBooks);
    } catch (error) {
        console.error('Error loading borrowings:', error);
    }
}

function renderWelcome(user) {
    const nameEl = document.getElementById('userName');
    if (nameEl) {
        nameEl.textContent = user.first_name || user.username || 'User';
    }
}

function renderMembership(user) {
    const statusEl = document.getElementById('membershipStatus');
    const btn = document.getElementById('membershipBtn');
    if (statusEl) {
        statusEl.textContent = user.is_paid ? 'Paid' : 'Not Paid';
    }
    if (btn) {
        btn.textContent = user.is_paid ? 'Active' : 'Not Active';
        btn.classList.toggle('active', !!user.is_paid);
    }
}

function renderBorrowedBookSummary(borrowedBooks) {
    const content = document.getElementById('borrowedBookContent');

    if (!content) return;

    if (!borrowedBooks || !borrowedBooks.length) {
        content.innerHTML = '<p class="empty-message">No books currently borrowed</p>';
        return;
    }

    const book = borrowedBooks[0];
    content.innerHTML = `
        <div class="borrowed-book-card">
            <div class="book-info">
                <h4>${book.title}</h4>
                <p>Author: ${book.author || '-'}</p>
                <p>Borrowed: ${formatDate(book.borrowDate)}</p>
                <p>Due: ${formatDate(book.returnDate || book.dueDate)}</p>
            </div>
        </div>
    `;
}

function renderBorrowHistory(history) {
    const tbody = document.getElementById('borrowHistoryBody');
    if (!tbody) return;

    if (!history || !history.length) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No borrow history</td></tr>';
        return;
    }

    tbody.innerHTML = history
        .map(
            (book) => {
                let status = 'Active';
                if (book.status === 'pending') {
                    status = '<span style="color:#f39c12;">Pending Approval</span>';
                } else if (book.returnRequested) {
                    status = 'Return Requested';
                }
                return `
                <tr>
                    <td>${book.title}</td>
                    <td>${formatDate(book.borrowDate)}</td>
                    <td>${status}</td>
                </tr>
            `;
            }
        )
        .join('');
}

function renderReturnedHistory(returned) {
    const tbody = document.getElementById('returnedHistoryBody');
    if (!tbody) return;

    if (!returned || !returned.length) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No returned history</td></tr>';
        return;
    }

    tbody.innerHTML = returned
        .map(
            (book) => `
            <tr>
                <td>${book.title}</td>
                <td>${formatDate(book.borrowDate)}</td>
                <td>${formatDate(book.returnedDate)}</td>
            </tr>
        `
        )
        .join('');
}

function renderBorrowedBooksList(borrowed) {
    const list = document.getElementById('my-borrowed-books-list');
    if (!list) return;

    if (!borrowed || !borrowed.length) {
        list.innerHTML = '<p class="empty-message">No active borrowed books</p>';
        return;
    }

    list.innerHTML = borrowed
        .map(
            (book) => {
                let statusBadge = '';
                if (book.status === 'pending') {
                    statusBadge = '<span class="status-badge" style="background:#f39c12;color:#fff;padding:2px 8px;border-radius:4px;">⏳ Pending Approval</span>';
                } else if (book.returnRequested) {
                    statusBadge = '<span class="status-badge">Return Requested</span>';
                }
                return `
        <div class="borrowed-book-card">
            <h4>${book.title}</h4>
            <p>Due: ${formatDate(book.returnDate || book.dueDate)}</p>
            ${statusBadge}
        </div>
    `;
            }
        )
        .join('');
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

