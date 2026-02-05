// ==========================================
// Borrowings Management using Supabase
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadBorrowings();
    loadStats();
    setupNewBorrowingForm();
});

function checkAuth() {
    // Already handled in auth.js via UserManager
}

// Load all borrowings from Supabase (includes pending requests)
async function loadBorrowings() {
    const tbody = document.getElementById('borrowingsTableBody');
    
    try {
        // Get both pending and borrowed status
        const { data: borrowings, error } = await supabase
            .from('borrowings')
            .select('*, users(first_name, last_name, email), books(title, author)')
            .in('status', ['borrowed', 'pending'])
            .order('borrow_date', { ascending: false });
        
        if (error) throw error;

        document.getElementById('borrowingsCount').textContent = borrowings ? borrowings.length : 0;

        if (!borrowings || borrowings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">No current borrowings</td></tr>';
            return;
        }

        tbody.innerHTML = borrowings.map(borrow => {
            const isPending = borrow.status === 'pending';
            const statusBadge = isPending 
                ? '<span class="status-badge pending" style="background:#f39c12;color:#fff;padding:2px 8px;border-radius:4px;">Pending</span>'
                : '<span class="status-badge borrowed" style="background:#27ae60;color:#fff;padding:2px 8px;border-radius:4px;">Borrowed</span>';
            
            const actionButtons = isPending
                ? `<button class="btn-accept" onclick="handleAcceptBorrow('${borrow.id}')">Accept</button>
                   <button class="btn-reject" onclick="handleReject('${borrow.id}')">Reject</button>`
                : `<button class="btn-accept" onclick="handleReturn('${borrow.id}')">Accept</button>
                   <button class="btn-reject" onclick="handleReject('${borrow.id}')">Cancel</button>`;
            
            return `
                <tr>
                    <td>${borrow.books?.title || 'Unknown'} by ${borrow.books?.author || 'Unknown'}</td>
                    <td>${borrow.users?.first_name || ''} ${borrow.users?.last_name || ''}<br>${borrow.users?.email || ''}</td>
                    <td>${formatDate(borrow.borrow_date)}</td>
                    <td>${formatDate(borrow.due_date)}</td>
                    <td>${statusBadge}</td>
                    <td>${borrow.address || '-'}</td>
                    <td>${actionButtons}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading borrowings:', error);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Error loading borrowings</td></tr>';
    }
}

// Handle accepting a pending borrow request
async function handleAcceptBorrow(borrowingId) {
    if (!confirm('Accept this borrow request?')) return;
    
    try {
        // Get the borrowing to find the book and user
        const { data: borrowing } = await supabase
            .from('borrowings')
            .select('book_id, user_id')
            .eq('id', borrowingId)
            .single();
        
        // Update borrowing status to 'borrowed'
        const { error } = await supabase
            .from('borrowings')
            .update({ status: 'borrowed' })
            .eq('id', borrowingId);
        
        if (error) throw error;

        // Now decrement book availability since admin accepted
        if (borrowing) {
            const { data: book } = await supabase
                .from('books')
                .select('available_copies')
                .eq('id', borrowing.book_id)
                .single();
            
            if (book) {
                const newCopies = Math.max(0, (book.available_copies || 1) - 1);
                await supabase
                    .from('books')
                    .update({ 
                        available_copies: newCopies,
                        available: newCopies > 0
                    })
                    .eq('id', borrowing.book_id);
            }
            
            // Update user's borrowed_books_count
            const { data: user } = await supabase
                .from('users')
                .select('borrowed_books_count')
                .eq('id', borrowing.user_id)
                .single();
            
            if (user) {
                await supabase
                    .from('users')
                    .update({ 
                        borrowed_books_count: (user.borrowed_books_count || 0) + 1
                    })
                    .eq('id', borrowing.user_id);
            }
        }

        showToast('Borrow request accepted!', 'success');
        loadBorrowings();
        loadStats();
    } catch (error) {
        console.error('Error accepting borrow:', error);
        showToast('Failed to accept borrow request', 'error');
    }
}

// Load borrowings statistics from Supabase
async function loadStats() {
    try {
        // Get current borrowings count
        const { data: borrowings } = await supabase
            .from('borrowings')
            .select('id, due_date')
            .eq('status', 'borrowed');
        
        const totalBorrowed = borrowings ? borrowings.length : 0;
        const overdueBooks = borrowings ? borrowings.filter(b => new Date(b.due_date) < new Date()).length : 0;
        
        // Get available books count
        const { data: books } = await supabase
            .from('books')
            .select('id')
            .eq('available', true);
        
        const availableBooks = books ? books.length : 0;

        document.getElementById('currentBorrowings').textContent = totalBorrowed;
        document.getElementById('availableBooks').textContent = availableBooks;
        document.getElementById('overdueBooks').textContent = overdueBooks;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Setup new borrowing form
function setupNewBorrowingForm() {
    const form = document.getElementById('newBorrowingForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('borrowMember').value.trim();
        const title = document.getElementById('borrowBook').value.trim();
        const address = document.getElementById('borrowAddress').value.trim();

        try {
            // Find member by email
            const { data: member, error: memberError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();
            
            if (memberError || !member) {
                showToast('Member not found', 'error');
                return;
            }

            // Find book by title
            const { data: books, error: bookError } = await supabase
                .from('books')
                .select('*')
                .ilike('title', `%${title}%`)
                .eq('available', true)
                .limit(1);
            
            if (bookError || !books || books.length === 0) {
                showToast('Book not found or not available', 'error');
                return;
            }
            
            const book = books[0];

            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 14);

            // Create borrowing record
            const { error: borrowError } = await supabase
                .from('borrowings')
                .insert({
                    user_id: member.id,
                    book_id: book.id,
                    due_date: dueDate.toISOString(),
                    address: address,
                    status: 'borrowed',
                    return_requested: false
                });
            
            if (borrowError) throw borrowError;

            // Update book availability
            const newCopies = Math.max(0, (book.available_copies || 1) - 1);
            await supabase
                .from('books')
                .update({ 
                    available_copies: newCopies,
                    available: newCopies > 0
                })
                .eq('id', book.id);

            showToast('Borrowing created successfully!', 'success');
            form.reset();
            closeNewBorrowingModal();
            loadBorrowings();
            loadStats();
        } catch (error) {
            console.error('Error creating borrowing:', error);
            showToast('Failed to create borrowing', 'error');
        }
    });
}

// Handle accepting return
async function handleReturn(borrowingId) {
    if (!confirm('Accept this return request?')) return;
    
    try {
        // Get the borrowing to find the book and user
        const { data: borrowing } = await supabase
            .from('borrowings')
            .select('book_id, user_id')
            .eq('id', borrowingId)
            .single();
        
        // Update borrowing status
        const { error } = await supabase
            .from('borrowings')
            .update({ 
                status: 'returned',
                return_date: new Date().toISOString()
            })
            .eq('id', borrowingId);
        
        if (error) throw error;

        // Update book availability
        if (borrowing) {
            const { data: book } = await supabase
                .from('books')
                .select('available_copies')
                .eq('id', borrowing.book_id)
                .single();
            
            if (book) {
                await supabase
                    .from('books')
                    .update({ 
                        available_copies: (book.available_copies || 0) + 1,
                        available: true
                    })
                    .eq('id', borrowing.book_id);
            }
            
            // Decrement user's borrowed_books_count
            const { data: user } = await supabase
                .from('users')
                .select('borrowed_books_count')
                .eq('id', borrowing.user_id)
                .single();
            
            if (user) {
                await supabase
                    .from('users')
                    .update({ 
                        borrowed_books_count: Math.max(0, (user.borrowed_books_count || 1) - 1)
                    })
                    .eq('id', borrowing.user_id);
            }
        }

        showToast('Return accepted!', 'success');
        loadBorrowings();
        loadStats();
    } catch (error) {
        console.error('Error accepting return:', error);
        showToast('Failed to accept return', 'error');
    }
}

// Handle rejecting/canceling borrowing
async function handleReject(borrowingId) {
    if (!confirm('Cancel this borrowing?')) return;
    
    try {
        // Get the borrowing to find the book
        const { data: borrowing } = await supabase
            .from('borrowings')
            .select('book_id')
            .eq('id', borrowingId)
            .single();
        
        // Delete the borrowing
        const { error } = await supabase
            .from('borrowings')
            .delete()
            .eq('id', borrowingId);
        
        if (error) throw error;

        // Update book availability
        if (borrowing) {
            const { data: book } = await supabase
                .from('books')
                .select('available_copies')
                .eq('id', borrowing.book_id)
                .single();
            
            if (book) {
                await supabase
                    .from('books')
                    .update({ 
                        available_copies: (book.available_copies || 0) + 1,
                        available: true
                    })
                    .eq('id', borrowing.book_id);
            }
        }

        showToast('Borrowing cancelled!', 'info');
        loadBorrowings();
        loadStats();
    } catch (error) {
        console.error('Error canceling borrowing:', error);
        showToast('Failed to cancel borrowing', 'error');
    }
}

// Show new borrowing modal
function showNewBorrowingModal() {
    document.getElementById('newBorrowingModal').classList.add('active');
}

// Close new borrowing modal
function closeNewBorrowingModal() {
    document.getElementById('newBorrowingModal').classList.remove('active');
}

// Format date nicely
function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
}
