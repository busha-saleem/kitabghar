// ===================================
// Admin Return Management (Supabase)
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    loadReturns();
    loadStats();
});

// Load return requests from Supabase
async function loadReturns() {
    const tbody = document.getElementById('returnsTableBody');
    
    try {
        const { data: returnRequests, error } = await supabase
            .from('borrowings')
            .select('*, users(first_name, last_name, email), books(title, author)')
            .eq('return_requested', true)
            .eq('status', 'borrowed')
            .order('borrow_date', { ascending: false });
        
        if (error) throw error;

        if (!returnRequests || returnRequests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No return requests</td></tr>';
            return;
        }

        tbody.innerHTML = returnRequests.map(r => {
            const today = new Date();
            const dueDate = new Date(r.due_date);
            const isOverdue = today > dueDate;
            const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            const daysText = isOverdue ? `${Math.abs(daysDiff)} days overdue` : `${daysDiff} days remaining`;
            const statusClass = isOverdue ? 'overdue' : 'borrowed';
            
            return `
                <tr>
                    <td>${r.books?.title || 'Unknown'} by ${r.books?.author || 'Unknown'}</td>
                    <td>${r.users?.first_name || ''} ${r.users?.last_name || ''}<br>${r.users?.email || ''}</td>
                    <td>${formatDate(r.borrow_date)}</td>
                    <td>${formatDate(r.due_date)}</td>
                    <td><span class="status-badge ${statusClass}">Return Requested</span></td>
                    <td style="color: ${isOverdue ? '#e74c3c' : '#333'}">${daysText}</td>
                    <td>
                        <button class="btn-accept" onclick="handleAcceptReturn('${r.id}', '${r.book_id}')">Accept</button>
                        <button class="btn-reject" onclick="handleRejectReturn('${r.id}')">Reject</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading returns:', error);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Error loading return requests</td></tr>';
    }
}

// Load stats from Supabase
async function loadStats() {
    try {
        // Current return requests
        const { data: requests } = await supabase
            .from('borrowings')
            .select('id')
            .eq('return_requested', true)
            .eq('status', 'borrowed');
        
        // Returned books
        const { data: returned } = await supabase
            .from('borrowings')
            .select('id')
            .eq('status', 'returned');
        
        // Damaged/Lost count
        const { data: damagedLost } = await supabase
            .from('damaged_lost')
            .select('id');

        document.getElementById('currentRequests').textContent = requests ? requests.length : 0;
        document.getElementById('returnedCount').textContent = returned ? returned.length : 0;
        document.getElementById('damagedLostCount').textContent = damagedLost ? damagedLost.length : 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Accept return
async function handleAcceptReturn(borrowingId, bookId) {
    if (!confirm('Accept this return?')) return;

    try {
        // Get the borrowing to find the user
        const { data: borrowing } = await supabase
            .from('borrowings')
            .select('user_id')
            .eq('id', borrowingId)
            .single();
        
        // Update borrowing status
        const { error } = await supabase
            .from('borrowings')
            .update({ 
                status: 'returned',
                return_requested: false,
                return_date: new Date().toISOString()
            })
            .eq('id', borrowingId);
        
        if (error) throw error;

        // Update book availability
        const { data: book } = await supabase
            .from('books')
            .select('available_copies')
            .eq('id', bookId)
            .single();
        
        if (book) {
            await supabase
                .from('books')
                .update({ 
                    available_copies: (book.available_copies || 0) + 1,
                    available: true
                })
                .eq('id', bookId);
        }
        
        // Decrement user's borrowed_books_count
        if (borrowing) {
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

        showToast('Return accepted successfully!', 'success');
        loadReturns();
        loadStats();
    } catch (error) {
        console.error('Error accepting return:', error);
        showToast('Failed to accept return', 'error');
    }
}

// Reject return
async function handleRejectReturn(borrowingId) {
    if (!confirm('Reject this return request?')) return;

    try {
        const { error } = await supabase
            .from('borrowings')
            .update({ return_requested: false })
            .eq('id', borrowingId);
        
        if (error) throw error;

        showToast('Return request rejected', 'info');
        loadReturns();
        loadStats();
    } catch (error) {
        console.error('Error rejecting return:', error);
        showToast('Failed to reject return', 'error');
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}
