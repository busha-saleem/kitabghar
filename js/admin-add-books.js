/**
 * Admin Add Books JavaScript
 * Using Supabase for book management
 */

let imageUrl = '';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadCategories();
    setupImageInput();
    setupForm();
});

function checkAuth() {
    // Authentication check is handled in admin-common.js
}

// Load categories for dropdown from Supabase
async function loadCategories() {
    try {
        const { data: categories, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        const datalist = document.getElementById('categories');
        datalist.innerHTML = (categories || []).map(cat => 
            `<option value="${cat.name}">`
        ).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Setup image URL input (replacing file upload)
function setupImageInput() {
    const uploadBox = document.getElementById('imageUploadBox');
    const previewBox = document.getElementById('previewBox');
    
    // Replace file upload with URL input
    uploadBox.innerHTML = `
        <span class="upload-icon">🔗</span>
        <p>Enter image URL below</p>
        <input type="text" id="bookImageUrl" placeholder="https://example.com/image.jpg" 
               style="width: 100%; padding: 8px; margin-top: 10px; border: 1px solid #ddd; border-radius: 4px;">
    `;
    
    const imageInput = document.getElementById('bookImageUrl');
    imageInput.addEventListener('input', (e) => {
        imageUrl = e.target.value.trim();
        if (imageUrl) {
            previewBox.innerHTML = `<img src="${imageUrl}" alt="Preview" style="max-width: 100%; max-height: 200px; object-fit: contain;" onerror="this.src='https://via.placeholder.com/200x300?text=Invalid+URL'">`;
        } else {
            previewBox.innerHTML = '<p>No image selected</p>';
        }
    });
}

// Setup form submission
function setupForm() {
    const form = document.getElementById('addBookForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('bookName').value.trim(),
            author: document.getElementById('bookAuthor').value.trim(),
            genre: document.getElementById('bookCategory').value.trim() || 'General',
            year: document.getElementById('bookYear').value ? parseInt(document.getElementById('bookYear').value) : null,
            pages: document.getElementById('bookPages').value ? parseInt(document.getElementById('bookPages').value) : null,
            description: document.getElementById('bookDescription').value.trim() || null,
            total_copies: parseInt(document.getElementById('totalCopies').value) || 1,
            available_copies: parseInt(document.getElementById('totalCopies').value) || 1,
            available: true,
            category: 'latest',
            image: imageUrl || 'https://via.placeholder.com/200x300?text=No+Image',
        };
        
        await addBookToSupabase(formData);
    });
}

// Add book to Supabase
async function addBookToSupabase(formData) {
    try {
        // Check if category exists, create if not
        if (formData.genre) {
            const { data: existingCat } = await supabase
                .from('categories')
                .select('id')
                .eq('name', formData.genre)
                .single();
            
            if (!existingCat) {
                // Create new category
                await supabase
                    .from('categories')
                    .insert({ name: formData.genre });
            }
        }
        
        // Insert book into Supabase
        const { data: newBook, error } = await supabase
            .from('books')
            .insert(formData)
            .select()
            .single();
        
        if (error) throw error;
        
        // Clear books cache
        if (window.refreshBooksData) window.refreshBooksData();
        
        showToast('Book added successfully!', 'success');
        
        // Reset form
        document.getElementById('addBookForm').reset();
        imageUrl = '';
        document.getElementById('previewBox').innerHTML = '<p>No image selected</p>';
        const imageInput = document.getElementById('bookImageUrl');
        if (imageInput) imageInput.value = '';
        
        // Reload categories in case a new one was added
        loadCategories();
        
    } catch (error) {
        console.error('Error adding book:', error);
        showToast('Failed to add book: ' + error.message, 'error');
    }
}

