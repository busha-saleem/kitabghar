// ===================================
// Admin Members Management (Supabase)
// ===================================

// Store members data for modal access
let membersData = [];

document.addEventListener('DOMContentLoaded', () => {
    loadMembers();
});

// Load members from Supabase
async function loadMembers(statusFilter = 'all') {
    try {
        // Query users from Supabase
        let query = supabase
            .from('users')
            .select('*')
            .neq('role', 'admin');
        
        // Apply status filter
        if (statusFilter === 'active') {
            query = query.eq('is_paid', true);
        } else if (statusFilter === 'inactive') {
            query = query.eq('is_paid', false);
        }
        
        const { data: users, error } = await query;
        
        if (error) throw error;
        
        // Get borrowing counts for each user
        const { data: borrowings } = await supabase
            .from('borrowings')
            .select('user_id, status');
        
        // Calculate borrowed counts
        const borrowedCounts = {};
        const totalBorrowedCounts = {};
        (borrowings || []).forEach(b => {
            totalBorrowedCounts[b.user_id] = (totalBorrowedCounts[b.user_id] || 0) + 1;
            if (b.status === 'borrowed') {
                borrowedCounts[b.user_id] = (borrowedCounts[b.user_id] || 0) + 1;
            }
        });
        
        const members = (users || []).map(member => ({
            ...member,
            borrowed_books_count: borrowedCounts[member.id] || 0,
            total_borrowed: totalBorrowedCounts[member.id] || 0,
        }));
        
        // Store for modal access
        membersData = members;

        document.getElementById('membersCount').textContent = members.length;

        const tbody = document.getElementById('membersTableBody');
        if (members.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No members found</td></tr>';
            return;
        }

        tbody.innerHTML = members.map(member => {
            const statusClass = member.is_paid ? 'active' : 'inactive';
            const statusText = member.is_paid ? 'active' : 'inactive';
            return `
                <tr>
                    <td>${member.first_name} ${member.last_name}</td>
                    <td>${member.email}</td>
                    <td>${member.phone || '-'}</td>
                    <td>${formatDate(member.membership_date)}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${member.borrowed_books_count}</td>
                    <td>${member.total_borrowed}</td>
                    <td>
                        <button class="btn-view" onclick="viewMember('${member.id}')" title="View">👁️</button>
                        <button class="btn-edit" onclick="editMember('${member.id}')" title="Edit">✏️</button>
                        <button class="btn-delete" onclick="deleteMember('${member.id}')" title="Delete">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading members:', error);
        document.getElementById('membersTableBody').innerHTML = 
            '<tr><td colspan="8" style="text-align: center;">Error loading members</td></tr>';
    }
}

// Filter members by status
function filterMembers() {
    const status = document.getElementById('statusFilter').value;
    loadMembers(status);
}

// View member details modal
function viewMember(id) {
    const member = membersData.find(u => u.id === id);
    if (!member) {
        showToast('Member not found', 'error');
        return;
    }

    const modal = document.getElementById('memberDetailsModal');
    const content = document.getElementById('memberDetailsContent');

    content.innerHTML = `
        <p><strong>Full Name:</strong> ${member.first_name} ${member.last_name}</p>
        <p><strong>Email:</strong> ${member.email}</p>
        <p><strong>Phone:</strong> ${member.phone || '-'}</p>
        <p><strong>Membership Date:</strong> ${formatDate(member.membership_date)}</p>
        <p><strong>Status:</strong> ${member.is_paid ? 'active' : 'inactive'}</p>
        <p><strong>Total Books Borrowed:</strong> ${member.total_borrowed || 0}</p>
        <p><strong>Currently Borrowed Books:</strong> ${member.borrowed_books_count || 0}</p>
    `;

    modal.classList.add('active');
}

// Close modal
function closeMemberDetailsModal() {
    document.getElementById('memberDetailsModal').classList.remove('active');
}

// Edit member placeholder
function editMember(id) {
    showToast('Edit functionality to be implemented', 'info');
}

// Delete member placeholder
function deleteMember(id) {
    if (!confirm('Are you sure you want to delete this member?')) return;
    showToast('Delete functionality to be implemented', 'info');
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
}
