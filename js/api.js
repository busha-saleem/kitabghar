/**
 * API Configuration and Helper Functions
 * Handles all API calls to Django backend
 */

// API Base URL - Change this to your backend URL
const API_BASE_URL = 'http://localhost:8000/api';

// Get authentication token from localStorage
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Set authentication token
function setAuthToken(token) {
    localStorage.setItem('authToken', token);
}

// Remove authentication token
function removeAuthToken() {
    localStorage.removeItem('authToken');
}

// Get current user from localStorage
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Set current user
function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// Remove current user
function removeCurrentUser() {
    localStorage.removeItem('currentUser');
}

// Make API request
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {}),
        },
    };
    
    try {
        const response = await fetch(url, finalOptions);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || data.detail || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Authentication API
const authAPI = {
    // Register new user
    register: async (userData) => {
        return await apiRequest('/auth/register/', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },
    
    // Login
    login: async (username, password) => {
        return await apiRequest('/auth/login/', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    },
    
    // Logout (client-side only)
    logout: () => {
        removeAuthToken();
        removeCurrentUser();
    },
    
    // Get current user
    getCurrentUser: async () => {
        return await apiRequest('/users/me/');
    },
};

// Books API - SUPABASE IMPLEMENTATION
const booksAPI = {
    // Get all books from Supabase
    getAll: async (params = {}) => {
        try {
            let query = supabase.from('books').select('*');
            
            // Apply search filter if provided
            if (params.search) {
                const searchTerm = params.search.toLowerCase();
                query = query.or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%`);
            }
            
            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching books:', error);
            return [];
        }
    },
    
    // Get book by ID
    getById: async (id) => {
        try {
            const { data, error } = await supabase
                .from('books')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching book:', error);
            return null;
        }
    },
    
    // Create book in Supabase
    create: async (bookData) => {
        try {
            const newBook = {
                title: bookData.title,
                author: bookData.author,
                genre: bookData.category || 'General',
                year: bookData.year ? parseInt(bookData.year) : null,
                pages: bookData.pages ? parseInt(bookData.pages) : null,
                description: bookData.description || '',
                total_copies: bookData.total_copies || 1,
                available_copies: bookData.total_copies || 1,
                available: true,
                category: 'latest',
                image: bookData.image || bookData.picture || 'https://via.placeholder.com/200x300?text=No+Image',
            };
            
            const { data, error } = await supabase
                .from('books')
                .insert(newBook)
                .select()
                .single();
            
            if (error) throw error;
            
            // Clear books cache
            if (window.refreshBooksData) window.refreshBooksData();
            
            return data;
        } catch (error) {
            console.error('Error creating book:', error);
            throw error;
        }
    },
    
    // Update book in Supabase
    update: async (id, bookData) => {
        try {
            const { data, error } = await supabase
                .from('books')
                .update(bookData)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            
            // Clear books cache
            if (window.refreshBooksData) window.refreshBooksData();
            
            return data;
        } catch (error) {
            console.error('Error updating book:', error);
            throw error;
        }
    },
};

// Categories API - SUPABASE IMPLEMENTATION
const categoriesAPI = {
    // Get all categories from Supabase
    getAll: async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    },
    
    // Get category by ID
    getById: async (id) => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching category:', error);
            return null;
        }
    },
    
    // Create category in Supabase
    create: async (categoryData) => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .insert({ name: categoryData.name })
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    },
};

// Transactions API
const transactionsAPI = {
    // Get all transactions
    getAll: async () => {
        return await apiRequest('/transactions/');
    },
    
    // Get transaction by ID
    getById: async (id) => {
        return await apiRequest(`/transactions/${id}/`);
    },
    
    // Create transaction (borrow request)
    create: async (transactionData) => {
        return await apiRequest('/transactions/', {
            method: 'POST',
            body: JSON.stringify(transactionData),
        });
    },
    
    // Approve borrow request (admin only)
    approve: async (id) => {
        return await apiRequest(`/transactions/${id}/approve/`, {
            method: 'POST',
        });
    },
    
    // Reject borrow request (admin only)
    reject: async (id) => {
        return await apiRequest(`/transactions/${id}/reject/`, {
            method: 'POST',
        });
    },
    
    // Request return
    requestReturn: async (id) => {
        return await apiRequest(`/transactions/${id}/request_return/`, {
            method: 'POST',
        });
    },
    
    // Accept return (admin only)
    acceptReturn: async (id) => {
        return await apiRequest(`/transactions/${id}/accept_return/`, {
            method: 'POST',
        });
    },
    
    // Get current borrowings
    getCurrentBorrowings: async () => {
        return await apiRequest('/transactions/current_borrowings/');
    },
    
    // Get overdue books
    getOverdue: async () => {
        return await apiRequest('/transactions/overdue/');
    },
    
    // Get pending requests (admin only)
    getPendingRequests: async () => {
        return await apiRequest('/transactions/pending_requests/');
    },
};

// Users API
const usersAPI = {
    // Get all users (admin only)
    getAll: async () => {
        return await apiRequest('/users/');
    },
    
    // Get all members (admin only)
    getMembers: async () => {
        return await apiRequest('/users/members/');
    },
    
    // Get user by ID
    getById: async (id) => {
        return await apiRequest(`/users/${id}/`);
    },
    
    // Update user
    update: async (id, userData) => {
        return await apiRequest(`/users/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(userData),
        });
    },
};

// Payments API
const paymentsAPI = {
    // Get all payments
    getAll: async () => {
        return await apiRequest('/payments/');
    },
    
    // Create payment
    create: async (paymentData) => {
        return await apiRequest('/payments/', {
            method: 'POST',
            body: JSON.stringify(paymentData),
        });
    },
};

// Damaged/Lost API - SUPABASE IMPLEMENTATION
const damagedLostAPI = {
    // Get all records from Supabase
    getAll: async () => {
        try {
            const { data, error } = await supabase
                .from('damaged_lost')
                .select('*, borrowings(*, users(*), books(*))')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching damaged/lost records:', error);
            return [];
        }
    },
    
    // Create record in Supabase
    create: async (recordData) => {
        try {
            const { data, error } = await supabase
                .from('damaged_lost')
                .insert({
                    borrowing_id: recordData.borrowing_id,
                    condition: recordData.condition,
                    fine_amount: recordData.fine_amount || 0,
                    fine_waived: false
                })
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating damaged/lost record:', error);
            throw error;
        }
    },
    
    // Impose fine
    imposeFine: async (id, fineAmount) => {
        try {
            const { error } = await supabase
                .from('damaged_lost')
                .update({ fine_amount: fineAmount })
                .eq('id', id);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error imposing fine:', error);
            return { success: false };
        }
    },
    
    // Waive fine
    waiveFine: async (id) => {
        try {
            const { error } = await supabase
                .from('damaged_lost')
                .update({ fine_waived: true })
                .eq('id', id);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error waiving fine:', error);
            return { success: false };
        }
    },
    
    // Get statistics
    getStats: async () => {
        try {
            const { data, error } = await supabase
                .from('damaged_lost')
                .select('condition, fine_amount');
            
            if (error) throw error;
            
            const records = data || [];
            return {
                total_damaged: records.filter(r => r.condition === 'damaged').length,
                total_lost: records.filter(r => r.condition === 'lost').length,
                total_fines: records.reduce((sum, r) => sum + (parseFloat(r.fine_amount) || 0), 0)
            };
        } catch (error) {
            console.error('Error fetching stats:', error);
            return { total_damaged: 0, total_lost: 0, total_fines: 0 };
        }
    },
};

// Dashboard API
const dashboardAPI = {
    // Get dashboard statistics (admin only)
    getStats: async () => {
        return await apiRequest('/dashboard/stats/');
    },
};

// Export APIs
window.authAPI = authAPI;
window.booksAPI = booksAPI;
window.categoriesAPI = categoriesAPI;
window.transactionsAPI = transactionsAPI;
window.usersAPI = usersAPI;
window.paymentsAPI = paymentsAPI;
window.damagedLostAPI = damagedLostAPI;
window.dashboardAPI = dashboardAPI;

// Helper functions
window.getAuthToken = getAuthToken;
window.getCurrentUser = getCurrentUser;
window.setCurrentUser = setCurrentUser;

