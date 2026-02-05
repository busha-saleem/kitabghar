
// -----------------------------------------------
// MEMBERS DATA - Load from Supabase
// -----------------------------------------------
async function getMembersData() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .neq('role', 'admin');
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching members:', error);
        return [];
    }
}

// -----------------------------------------------
// 1️⃣ DASHBOARD SUMMARY CARDS (Supabase)
// -----------------------------------------------
async function loadSummaryCards() {
    try {
        // Get total books from Supabase with available_copies
        const { data: books, error: booksError } = await supabase
            .from('books')
            .select('id, available, available_copies, total_copies');
        
        if (booksError) throw booksError;
        
        const totalBooks = books ? books.length : 0;
        // Sum up all available copies across all books
        const availableBooks = books ? books.reduce((sum, b) => sum + (b.available_copies || 0), 0) : 0;
        
        // Get borrowings from Supabase (only 'borrowed' status, not 'pending')
        const { data: borrowings, error: borrowingsError } = await supabase
            .from('borrowings')
            .select('id, status, return_requested, due_date')
            .eq('status', 'borrowed');
        
        if (borrowingsError) throw borrowingsError;
        
        const borrowedBooks = borrowings ? borrowings.length : 0;
        const pendingRequests = borrowings ? borrowings.filter(b => b.return_requested).length : 0;
        const overdueBooks = borrowings ? borrowings.filter(b => 
            new Date(b.due_date) < new Date()
        ).length : 0;

        // UPDATE UI
        document.getElementById("totalBooks").innerText = totalBooks;
        document.getElementById("availableBooks").innerText = availableBooks;
        document.getElementById("borrowedBooks").innerText = borrowedBooks;
        document.getElementById("pendingRequests").innerText = pendingRequests;
        document.getElementById("overdueBooks").innerText = overdueBooks;

        document.getElementById("overdueAlert").style.display =
            overdueBooks > 0 ? "block" : "none";
    } catch (error) {
        console.error('Error loading summary cards:', error);
    }
}


   
// Sidebar buttons
document.querySelectorAll('.sidebar-item').forEach(btn => {
    btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        navigateTo(page); // Uses the navigateTo() function to go to the page
    });
});

// Action tiles
document.querySelectorAll('.action-tile').forEach(tile => {
    tile.addEventListener('click', () => {
        const page = tile.dataset.page;
        navigateTo(page);
    });
});

// Navigation function
function navigateTo(page) {
    const pageMap = {
        'dashboard': 'dashboard.html',
        'add-books': 'add-books.html',
        'borrow': 'borrow.html',
        'return': 'return.html',
        'members': 'members.html',
        'damaged-lost': 'damaged-lost.html'
    };

    if (pageMap[page]) {
        window.location.href = pageMap[page];
    } else {
        console.warn("Page not found:", page);
    }
}

// -----------------------------------------------
// 2️⃣ MOST RECENT BORROWS LIST (Supabase)
// -----------------------------------------------
async function loadRecentBorrows() {
    const container = document.getElementById("recentBorrowsList");
    container.innerHTML = "";
    
    try {
        // Get recent borrowings from Supabase with user and book info
        const { data: borrowings, error } = await supabase
            .from('borrowings')
            .select('*, users(first_name, last_name), books(title, author)')
            .order('borrow_date', { ascending: false })
            .limit(5);
        
        if (error) throw error;

        if (!borrowings || borrowings.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">No recent borrows</p>';
            return;
        }

        borrowings.forEach(borrow => {
            const div = document.createElement("div");
            div.classList.add("borrow-item");
            div.innerHTML = `
                <div>
                    <strong>${borrow.books?.title || 'Unknown'}</strong> by ${borrow.books?.author || 'Unknown'}<br>
                    Borrowed by: <strong>${borrow.users?.first_name || ''} ${borrow.users?.last_name || ''}</strong>
                </div>
                <div>
                    <small>Borrowed: ${new Date(borrow.borrow_date).toLocaleDateString()}</small>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading recent borrows:', error);
        container.innerHTML = '<p style="text-align: center; color: #666;">Error loading borrows</p>';
    }
}


// -----------------------------------------------
// INIT
// -----------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    loadSummaryCards();
    loadRecentBorrows();
});
