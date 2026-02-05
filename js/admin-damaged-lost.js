/**
 * Admin Damaged/Lost Management JavaScript
 * Using Supabase for data management
 */

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadDamagedLost();
    loadStats();
    setupForm();
});

function checkAuth() {
    // Authentication check is handled in admin-common.js
}

// Load damaged/lost records from Supabase
async function loadDamagedLost() {
    const tbody = document.getElementById('damagedLostTableBody');
    
    try {
        const { data: records, error } = await supabase
            .from('damaged_lost')
            .select('*, borrowings(*, users(first_name, last_name, email), books(title, author))')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!records || records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No records found</td></tr>';
            return;
        }
        
        tbody.innerHTML = records.map(record => {
            const conditionClass = record.condition === 'damaged' ? 'damaged' : 'lost';
            const borrowing = record.borrowings;
            const bookTitle = borrowing?.books?.title || 'Unknown';
            const bookAuthor = borrowing?.books?.author || 'Unknown';
            const userName = `${borrowing?.users?.first_name || ''} ${borrowing?.users?.last_name || ''}`;
            const userEmail = borrowing?.users?.email || '';
            const borrowDate = borrowing?.borrow_date;
            const dueDate = borrowing?.due_date;
            
            const today = new Date();
            const dueDateObj = new Date(dueDate);
            const daysOverdue = Math.max(0, Math.ceil((today - dueDateObj) / (1000 * 60 * 60 * 24)));
            
            return `
                <tr>
                    <td>${bookTitle} by ${bookAuthor}</td>
                    <td>${userName}<br>${userEmail}</td>
                    <td>${formatDate(borrowDate)}</td>
                    <td>${formatDate(dueDate)}</td>
                    <td><span class="status-badge ${conditionClass}">${record.condition}</span></td>
                    <td>${daysOverdue} days overdue</td>
                    <td>
                        <button class="btn-waive" onclick="handleWaiveFine('${record.id}')" ${record.fine_waived ? 'disabled' : ''}>
                            ${record.fine_waived ? 'Waived' : 'Waive'}
                        </button>
                        <button class="btn-impose" onclick="handleImposeFine('${record.id}')" ${record.fine_amount > 0 && !record.fine_waived ? 'disabled' : ''}>
                            ${record.fine_amount > 0 && !record.fine_waived ? 'Imposed' : 'Impose'}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading damaged/lost records:', error);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Error loading records</td></tr>';
    }
}

// Load statistics from Supabase
async function loadStats() {
    try {
        const { data: records, error } = await supabase
            .from('damaged_lost')
            .select('condition, fine_amount');
        
        if (error) throw error;
        
        const totalDamaged = (records || []).filter(r => r.condition === 'damaged').length;
        const totalLost = (records || []).filter(r => r.condition === 'lost').length;
        const totalPenalties = (records || []).reduce((sum, r) => sum + (parseFloat(r.fine_amount) || 0), 0);
        
        document.getElementById('totalDamaged').textContent = totalDamaged;
        document.getElementById('totalLost').textContent = totalLost;
        document.getElementById('totalPenalties').textContent = `Rs. ${totalPenalties}`;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Setup form
function setupForm() {
    const form = document.getElementById('addDamagedLostForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const memberEmail = document.getElementById('memberEmail').value.trim();
        const bookTitle = document.getElementById('bookTitle').value.trim();
        const fineAmount = parseFloat(document.getElementById('fineAmount').value) || 0;
        const condition = document.getElementById('condition').value;
        
        try {
            // Find user from Supabase
            const { data: member, error: memberError } = await supabase
                .from('users')
                .select('*')
                .eq('email', memberEmail)
                .neq('role', 'admin')
                .single();
            
            if (memberError || !member) {
                showToast('Member not found', 'error');
                return;
            }
            
            // Find active borrowing for this member and book
            const { data: borrowings, error: borrowError } = await supabase
                .from('borrowings')
                .select('*, books(title)')
                .eq('user_id', member.id)
                .eq('status', 'borrowed');
            
            if (borrowError) throw borrowError;
            
            // Find the borrowing that matches the book title
            const borrowing = (borrowings || []).find(b => 
                b.books?.title?.toLowerCase() === bookTitle.toLowerCase()
            );
            
            if (!borrowing) {
                showToast('No active borrowing found for this member and book', 'error');
                return;
            }
            
            // Create damaged/lost record in Supabase
            const { error: insertError } = await supabase
                .from('damaged_lost')
                .insert({
                    borrowing_id: borrowing.id,
                    condition: condition,
                    fine_amount: fineAmount,
                    fine_waived: false
                });
            
            if (insertError) throw insertError;
            
            // Update borrowing status
            await supabase
                .from('borrowings')
                .update({ status: condition })
                .eq('id', borrowing.id);
            
            showToast('Record added successfully!', 'success');
            form.reset();
            loadDamagedLost();
            loadStats();
        } catch (error) {
            console.error('Error adding record:', error);
            showToast('Failed to add record: ' + error.message, 'error');
        }
    });
}

// Handle waive fine
async function handleWaiveFine(id) {
    if (!confirm('Waive the fine for this record?')) return;
    
    try {
        const { error } = await supabase
            .from('damaged_lost')
            .update({ fine_waived: true })
            .eq('id', id);
        
        if (error) throw error;
        
        showToast('Fine waived successfully!', 'success');
        loadDamagedLost();
        loadStats();
    } catch (error) {
        console.error('Error waiving fine:', error);
        showToast('Failed to waive fine: ' + error.message, 'error');
    }
}

// Handle impose fine
async function handleImposeFine(id) {
    const fineAmount = prompt('Enter fine amount:');
    if (!fineAmount || isNaN(fineAmount)) return;
    
    try {
        const { error } = await supabase
            .from('damaged_lost')
            .update({ fine_amount: parseFloat(fineAmount) })
            .eq('id', id);
        
        if (error) throw error;
        
        showToast('Fine imposed successfully!', 'success');
        loadDamagedLost();
        loadStats();
    } catch (error) {
        console.error('Error imposing fine:', error);
        showToast('Failed to impose fine: ' + error.message, 'error');
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

