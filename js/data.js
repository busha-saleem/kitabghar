// ===================================
// Book Data - Supabase Integration
// ===================================

// Cache for books data
let booksCache = [];
let booksCacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds

// Get books by category
async function getBooksByCategory(category) {
    try {
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .eq('category', category);
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching books by category:', error);
        return [];
    }
}

// Get all books
async function getAllBooks() {
    try {
        // Check cache
        if (booksCache.length > 0 && Date.now() - booksCacheTimestamp < CACHE_DURATION) {
            return booksCache;
        }
        
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Update cache
        booksCache = data || [];
        booksCacheTimestamp = Date.now();
        
        return booksCache;
    } catch (error) {
        console.error('Error fetching all books:', error);
        return [];
    }
}

// Get book by ID
async function getBookById(id) {
    try {
        if (!id || id === 'undefined' || id === 'null') {
            console.error('No book ID provided');
            return null;
        }
        
        // Use the ID as-is - Supabase will handle type conversion
        console.log('Fetching book with ID:', id, 'Type:', typeof id);
        
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) {
            console.error('Supabase error:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Error fetching book by ID:', error);
        return null;
    }
}

// Search and filter books
async function filterBooks(searchTerm = '', genre = '', author = '', availability = '') {
    try {
        let query = supabase.from('books').select('*');
        
        // Apply filters
        if (genre) {
            query = query.eq('genre', genre);
        }
        
        if (availability === 'available') {
            query = query.eq('available', true);
        } else if (availability === 'borrowed') {
            query = query.eq('available', false);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        let results = data || [];
        
        // Client-side filtering for search term and author (for partial matches)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(book => 
                book.title.toLowerCase().includes(term) ||
                book.author.toLowerCase().includes(term)
            );
        }
        
        if (author) {
            const authorTerm = author.toLowerCase();
            results = results.filter(book => 
                book.author.toLowerCase().includes(authorTerm)
            );
        }
        
        return results;
    } catch (error) {
        console.error('Error filtering books:', error);
        return [];
    }
}

// Clear books cache
function clearBooksCache() {
    booksCache = [];
    booksCacheTimestamp = 0;
}

// Function to refresh books data
window.refreshBooksData = function() {
    clearBooksCache();
};