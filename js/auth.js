// ===================================
// Authentication & User State Management (Supabase)
// ===================================

if (!window.showToast) {
    const ensureToastContainer = () => {
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
    };

    window.showToast = (message, type = 'info') => {
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
    };
}

const UserManager = (() => {
    let currentUser = null;

    const baseUserShape = () => ({
        borrowedBooks: [],
        returnedBooks: [],
        isPaid: false,
        isLoggedIn: false,
    });

    const persistUser = (user) => {
        currentUser = { ...baseUserShape(), ...user };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    };

    const loadFromStorage = () => {
        const saved = localStorage.getItem('currentUser');
        if (saved) {
            currentUser = JSON.parse(saved);
        }
        return currentUser;
    };

    // Login with Supabase - supports both username and email
    const login = async (identifier, password) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .or(`username.eq.${identifier},email.eq.${identifier}`)
                .eq('password', password)
                .single();

            if (error || !data) {
                throw new Error('Invalid credentials');
            }

            // Fetch user's borrowed books from borrowings table
            const { data: borrowings } = await supabase
                .from('borrowings')
                .select('*, books(*)')
                .eq('user_id', data.id)
                .eq('status', 'borrowed');

            const borrowedBooks = (borrowings || []).map(b => ({
                bookId: b.book_id,
                borrowingId: b.id,
                title: b.books?.title || '',
                author: b.books?.author || '',
                image: b.books?.image || '',
                borrowDate: b.borrow_date,
                returnDate: b.due_date,
                dueDate: b.due_date,
                returnRequested: b.return_requested,
                personalDetails: {
                    fullName: b.full_name,
                    phoneNumber: b.phone_number,
                    address: b.address,
                    city: b.city,
                    postalCode: b.postal_code
                }
            }));

            // Fetch returned books
            const { data: returnedBorrowings } = await supabase
                .from('borrowings')
                .select('*, books(*)')
                .eq('user_id', data.id)
                .eq('status', 'returned');

            const returnedBooks = (returnedBorrowings || []).map(b => ({
                bookId: b.book_id,
                title: b.books?.title || '',
                author: b.books?.author || '',
                borrowDate: b.borrow_date,
                returnedDate: b.return_date
            }));

            const hydratedUser = {
                ...data,
                isLoggedIn: true,
                isPaid: data.is_paid,
                borrowedBooks,
                returnedBooks,
            };

            persistUser(hydratedUser);
            setAuthToken('supabaseToken');
            return hydratedUser;
        } catch (error) {
            console.error('Login error:', error);
            throw new Error('Invalid credentials');
        }
    };

    const logout = () => {
        currentUser = null;
        removeAuthToken();
        removeCurrentUser();
    };

    const markUserAsPaid = async () => {
        if (!currentUser) return;
        
        try {
            const { error } = await supabase
                .from('users')
                .update({ is_paid: true })
                .eq('id', currentUser.id);

            if (error) throw error;

            currentUser.is_paid = true;
            currentUser.isPaid = true;
            persistUser(currentUser);
        } catch (error) {
            console.error('Error marking user as paid:', error);
        }
    };

    const canBorrow = () => {
        if (!currentUser || !currentUser.isLoggedIn) {
            return { status: false, message: 'Please log in to borrow books.' };
        }
        if (!currentUser.is_paid && !currentUser.isPaid) {
            return {
                status: false,
                message: 'Please pay the one-time security fee to borrow books.',
            };
        }
        if ((currentUser.borrowedBooks || []).length >= 2) {
            return {
                status: false,
                message:
                    'You have already borrowed 2 books. Please return a book before borrowing another.',
            };
        }
        return { status: true, message: 'You can borrow this book.' };
    };

    const borrowBook = async (bookId, personalDetails, bookData) => {
        if (!currentUser) return false;
        
        try {
            const borrowDate = new Date();
            const dueDate = new Date(borrowDate);
            dueDate.setDate(dueDate.getDate() + 14);

            // Insert borrowing record with 'pending' status - admin must accept
            const { data: borrowing, error: borrowError } = await supabase
                .from('borrowings')
                .insert({
                    user_id: currentUser.id,
                    book_id: bookId,
                    due_date: dueDate.toISOString(),
                    full_name: personalDetails.fullName,
                    phone_number: personalDetails.phoneNumber,
                    address: personalDetails.address,
                    city: personalDetails.city,
                    postal_code: personalDetails.postalCode,
                    status: 'pending',
                    return_requested: false
                })
                .select()
                .single();

            if (borrowError) throw borrowError;

            // Don't update book availability yet - wait for admin to accept
            // Book availability will be updated when admin accepts the borrow request

            // Update local user state with pending status
            const borrowedBook = {
                bookId,
                borrowingId: borrowing.id,
                title: bookData.title,
                author: bookData.author,
                image: bookData.image,
                borrowDate: borrowDate.toISOString(),
                returnDate: dueDate.toISOString(),
                dueDate: dueDate.toISOString(),
                personalDetails,
                returnRequested: false,
                status: 'pending',
            };

            currentUser.borrowedBooks = currentUser.borrowedBooks || [];
            currentUser.borrowedBooks.push(borrowedBook);
            currentUser.borrowed_books_count = currentUser.borrowedBooks.length;
            persistUser(currentUser);
            
            // Clear books cache
            if (window.refreshBooksData) window.refreshBooksData();
            
            return true;
        } catch (error) {
            console.error('Error borrowing book:', error);
            return false;
        }
    };

    const requestReturn = async (bookId) => {
        if (!currentUser) return false;
        
        try {
            const bookIndex = (currentUser.borrowedBooks || []).findIndex(
                (b) => b.bookId === bookId || b.bookId === bookId.toString()
            );
            if (bookIndex === -1) return false;

            const borrowingId = currentUser.borrowedBooks[bookIndex].borrowingId;

            // Update borrowing in Supabase
            const { error } = await supabase
                .from('borrowings')
                .update({ return_requested: true })
                .eq('id', borrowingId);

            if (error) throw error;

            currentUser.borrowedBooks[bookIndex].returnRequested = true;
            persistUser(currentUser);
            return true;
        } catch (error) {
            console.error('Error requesting return:', error);
            return false;
        }
    };

    const getDaysRemaining = (returnDate) => {
        const today = new Date();
        const returnDay = new Date(returnDate);
        const timeDiff = returnDay - today;
        return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    };

    const getMembers = async () => {
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
    };

    return {
        init: loadFromStorage,
        login,
        logout,
        markUserAsPaid,
        canBorrow,
        borrowBook,
        requestReturn,
        getDaysRemaining,
        getCurrentUser: () => currentUser,
        persistUser,
        getMembers,
    };
})();

window.userManager = UserManager;

// Keep backward compatibility for existing code paths
window.canBorrow = UserManager.canBorrow;
window.borrowBook = async (bookId, personalDetails) => {
    const book = typeof getBookById === 'function' ? await getBookById(bookId) : null;
    if (!book) return false;
    return UserManager.borrowBook(bookId, personalDetails, book);
};
window.requestReturn = UserManager.requestReturn;
window.markUserAsPaid = UserManager.markUserAsPaid;
window.getDaysRemaining = UserManager.getDaysRemaining;
window.initUserState = UserManager.init;
window.logout = UserManager.logout;
