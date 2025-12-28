// =======================================================================
// ADMIN MENU APPLICATION (admin.html)
// Admin panel for managing inventory - add, edit, delete products
// Extends public app functionality with CRUD operations
// =======================================================================

// === Application State ===
// Inherits all state from public app plus admin-specific state
let inventory = {}; 
let currentCategory = 'Flower';
let isAdmin = false;
let currentSearchQuery = '';
let currentTypeFilter = 'All'; 
let currentSortBy = 'name'; 
let currentSortDirection = 'asc'; 
let currentFormatFilter = 'All'; 
let currentDeviceFilter = 'All'; 
let currentVolumeFilter = 'All';
let currentRatioFilter = 'All'; 
let currentPackagingFilter = 'All'; 
let currentInfusionFilter = 'All'; 
let currentFormFilter = 'All'; 
let currentWeightFilter = 'All'; 
let currentCannabinoidFilter = 'All'; 
let currentEdibleFormFilter = 'All';

// Filter state persistence - stores filter state per category
let categoryFilterState = {}; // { 'Flower': { typeFilter: 'Indica', sortBy: 'name', ... }, ... }

// Infinite scroll state
let itemsPerPage = 24; // Number of items to display initially
let currentPage = 1;
let allFilteredItems = []; // Store filtered/sorted items for pagination

// View mode: 'grid' or 'list'
let currentViewMode = localStorage.getItem('adminViewMode') || 'grid';

let appId = 'union-live-menu';

// Use shared config
const categoryIcons = SHARED_CONFIG.categoryIcons;
const categoryFields = SHARED_CONFIG.categoryFields;

// Add staffNotes field to all categories for admin use (internal notes not visible to customers)
// This extends the shared config without modifying it directly
Object.keys(categoryFields).forEach(cat => {
    if (!categoryFields[cat].some(f => f.id === 'staffNotes')) {
        categoryFields[cat].push({ id: 'staffNotes', label: 'Staff Notes', type: 'textarea', adminOnly: true });
    }
});

// === Firebase Data Functions ===

function setupDataListeners() {
    allCategories.forEach(category => {
        const path = getCollectionPath(category, appId);
        const q = window.query(window.collection(window.db, path));
        
        window.onSnapshot(q, (snapshot) => {
            const itemsMap = {};
            snapshot.forEach(doc => {
                const data = doc.data();
                itemsMap[doc.id] = { 
                    id: doc.id, 
                    ...data, 
                    category: category,
                    isFeatured: !!data.isFeatured,
                    isSoldOut: data.isSoldOut !== undefined ? !!data.isSoldOut : false,
                    isLowStock: data.isLowStock !== undefined ? !!data.isLowStock : false,
                    isOnSale: data.isOnSale !== undefined ? !!data.isOnSale : false 
                };
            });
            inventory[category] = itemsMap;
            renderMenu();
            
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
        }, (error) => {
            console.error(`Error listening to Firestore for ${category}:`, error);
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.textContent = `Error loading menu. Please refresh.`;
                loadingIndicator.classList.add('text-red_sale');
            }
        });
    });
}

// === Admin CRUD Functions ===
// Create, Read, Update, Delete operations for products

/**
 * Save a new or existing product to Firestore
 * Validates required fields, formats prices, and handles admin status flags
 * Called when admin submits the add/edit product form
 */
async function saveItem() {
    const form = document.getElementById('admin-form');
    const itemId = document.getElementById('edit-item-id').value;
    const isNewItem = !itemId;
    const docId = isNewItem ? crypto.randomUUID() : itemId; 
    const path = getCollectionPath(currentCategory, appId);
    
    let itemData = { category: currentCategory };
    let isValid = true;
    
    // Collect data from dynamic fields
    const fields = categoryFields[currentCategory];
    fields.forEach(field => {
        const input = document.getElementById(`field-${field.id}`);
        if (input) {
            const value = input.value;
            if (field.required && !value) {
                isValid = false;
                input.classList.add('border-red_sale');
                showMessage(`Field "${field.label}" is required.`, true);
            } else {
                input.classList.remove('border-red_sale');
                let finalValue = value;
                
                // Auto-format price fields
                if (field.priceField && finalValue) {
                    finalValue = `$${String(finalValue).replace(/\$/g, '').trim()}`;
                }
                
                itemData[field.id] = finalValue;
            }
        }
    });
    
    if (!isValid) return;

    // Collect admin status data
    itemData.isFeatured = document.getElementById('isFeatured').checked;
    itemData.isOnSale = document.getElementById('isOnSale').checked;
    itemData.isLowStock = document.getElementById('isLowStock').checked;
    itemData.isSoldOut = document.getElementById('isSoldOut').checked;
    itemData.staffNotes = document.getElementById('staffNotes').value || '';
    
    // Add timestamps for tracking
    const now = new Date().toISOString();
    if (isNewItem) {
        itemData.createdAt = now;
        itemData.updatedAt = now;
    } else {
        itemData.updatedAt = now;
        // Preserve createdAt if it exists
        if (inventory[currentCategory] && inventory[currentCategory][itemId] && inventory[currentCategory][itemId].createdAt) {
            itemData.createdAt = inventory[currentCategory][itemId].createdAt;
        } else {
            itemData.createdAt = now; // Fallback if missing
        }
    }
    
    try {
        const docRef = window.doc(window.db, path, docId);
        await window.setDoc(docRef, itemData);
        showMessage(isNewItem ? 'Item added successfully!' : 'Item updated successfully!');
        hideAdminModal();
    } catch (e) {
        console.error("Error saving item:", e);
        showMessage("Error: Could not save item.", true);
    }
}

/**
 * Delete a product from Firestore after user confirmation
 * @param {string} itemId - Unique product ID to delete
 * @param {string} category - Product category (determines collection path)
 */
async function handleDeleteItem(itemId, category) {
    if (!confirm(`Are you sure you want to delete this item?\n\n${inventory[category][itemId].name}\n\nThis action cannot be undone.`)) {
        return;
    }
    
    const path = getCollectionPath(category, appId);
    try {
        const docRef = window.doc(window.db, path, itemId);
        await window.deleteDoc(docRef);
        showMessage("Item deleted successfully.");
    } catch (e) {
        console.error("Error deleting item:", e);
        showMessage("Error: Could not delete item.", true);
    }
}

/**
 * Duplicate a product - creates a copy with "- Copy" suffix
 * @param {string} itemId - Product ID to duplicate
 * @param {string} category - Product category
 */
async function handleDuplicateItem(itemId, category) {
    const item = inventory[category] ? inventory[category][itemId] : null;
    if (!item) {
        showMessage("Error: Could not find item to duplicate.", true);
        return;
    }
    
    // Create duplicate with modified name
    const duplicateData = { ...item };
    delete duplicateData.id; // Remove ID so it gets a new one
    duplicateData.name = `${item.name} - Copy`;
    
    // Generate new ID
    const newId = crypto.randomUUID();
    const path = getCollectionPath(category, appId);
    
    // Set timestamps
    const now = new Date().toISOString();
    duplicateData.createdAt = now;
    duplicateData.updatedAt = now;
    
    try {
        const docRef = window.doc(window.db, path, newId);
        await window.setDoc(docRef, duplicateData);
        showMessage('Product duplicated successfully!');
        
        // Switch to the new item's category and scroll to it (if possible)
        if (currentCategory !== category) {
            changeCategory(category);
        }
    } catch (e) {
        console.error("Error duplicating item:", e);
        showMessage("Error: Could not duplicate item.", true);
    }
}

/**
 * Quick edit - opens a simplified modal for price and status only
 * @param {string} itemId - Product ID to quick edit
 * @param {string} category - Product category
 */
async function handleQuickEdit(itemId, category) {
    const item = inventory[category] ? inventory[category][itemId] : null;
    if (!item) {
        showMessage("Error: Could not find item to edit.", true);
        return;
    }
    
    // Switch to item's category if needed
    if (currentCategory !== category) {
        changeCategory(category);
    }
    
    const isFlower = item.category === 'Flower';
    
    // Create quick edit modal HTML
    let priceFieldsHtml = '';
    if (isFlower) {
        priceFieldsHtml = `
            <div>
                <label class="block text-sm font-bold text-forest mb-1">Price (1g)</label>
                <input type="text" id="quick-edit-price-1g" value="${(item.price_1g || '').replace('$', '')}" class="w-full p-2 border-2 border-sage/50 rounded-xl bg-white text-forest focus:outline-none focus:ring-2 focus:ring-sage font-serif" placeholder="$9 - $12">
            </div>
            <div>
                <label class="block text-sm font-bold text-forest mb-1">Price (3.5g)</label>
                <input type="text" id="quick-edit-price-35g" value="${(item.price_35g || '').replace('$', '')}" class="w-full p-2 border-2 border-sage/50 rounded-xl bg-white text-forest focus:outline-none focus:ring-2 focus:ring-sage font-serif" placeholder="$25 - $40">
            </div>
        `;
    } else {
        priceFieldsHtml = `
            <div>
                <label class="block text-sm font-bold text-forest mb-1">Price</label>
                <input type="text" id="quick-edit-price" value="${(item.price || '').replace('$', '')}" class="w-full p-2 border-2 border-sage/50 rounded-xl bg-white text-forest focus:outline-none focus:ring-2 focus:ring-sage font-serif">
            </div>
        `;
    }
    
    const quickEditModal = document.createElement('div');
    quickEditModal.id = 'quick-edit-modal';
    quickEditModal.className = 'fixed inset-0 bg-forest bg-opacity-75 flex items-center justify-center z-50 p-4';
    quickEditModal.innerHTML = `
        <div class="bg-cream p-6 rounded-xl shadow-2xl w-full max-w-md">
            <h3 class="text-2xl font-bold text-forest mb-4">Quick Edit: ${item.name}</h3>
            <div class="space-y-4">
                ${priceFieldsHtml}
                <fieldset class="border-2 border-sage/50 p-3 rounded-xl">
                    <legend class="text-sm font-bold px-2 text-forest">Status</legend>
                    <div class="grid grid-cols-2 gap-2 mt-2">
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" id="quick-edit-featured" ${item.isFeatured ? 'checked' : ''} class="h-5 w-5 text-red_sale rounded">
                            <span class="text-sm font-semibold">Featured ⭐</span>
                        </label>
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" id="quick-edit-onSale" ${item.isOnSale ? 'checked' : ''} class="h-5 w-5 text-sale_blue rounded">
                            <span class="text-sm font-semibold">On Sale 🏷️</span>
                        </label>
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" id="quick-edit-lowStock" ${item.isLowStock ? 'checked' : ''} class="h-5 w-5 text-orange_low rounded">
                            <span class="text-sm font-semibold">Low Stock ⚠️</span>
                        </label>
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" id="quick-edit-soldOut" ${item.isSoldOut ? 'checked' : ''} class="h-5 w-5 text-gray-600 rounded">
                            <span class="text-sm font-semibold">Sold Out ❌</span>
                        </label>
                    </div>
                </fieldset>
            </div>
            <div class="mt-6 flex justify-end space-x-3">
                <button onclick="closeQuickEdit()" class="bg-gray-400 text-black px-4 py-2 rounded-lg font-bold hover:bg-gray-500 transition">Cancel</button>
                <button onclick="saveQuickEdit('${itemId}', '${category}')" class="bg-forest text-cream px-4 py-2 rounded-lg font-bold hover:bg-sage transition">Save</button>
            </div>
        </div>
    `;
    document.body.appendChild(quickEditModal);
}

/**
 * Save quick edit changes
 */
async function saveQuickEdit(itemId, category) {
    const item = inventory[category] ? inventory[category][itemId] : null;
    if (!item) {
        showMessage("Error: Item not found.", true);
        return;
    }
    
    const path = getCollectionPath(category, appId);
    const isFlower = item.category === 'Flower';
    
    // Get updated values
    const updateData = {
        ...item,
        isFeatured: document.getElementById('quick-edit-featured').checked,
        isOnSale: document.getElementById('quick-edit-onSale').checked,
        isLowStock: document.getElementById('quick-edit-lowStock').checked,
        isSoldOut: document.getElementById('quick-edit-soldOut').checked,
        updatedAt: new Date().toISOString()
    };
    
    // Update prices
    if (isFlower) {
        const price1g = document.getElementById('quick-edit-price-1g').value.trim();
        const price35g = document.getElementById('quick-edit-price-35g').value.trim();
        if (price1g) updateData.price_1g = `$${price1g.replace('$', '')}`;
        if (price35g) updateData.price_35g = `$${price35g.replace('$', '')}`;
    } else {
        const price = document.getElementById('quick-edit-price').value.trim();
        if (price) updateData.price = `$${price.replace('$', '')}`;
    }
    
    try {
        const docRef = window.doc(window.db, path, itemId);
        await window.setDoc(docRef, updateData);
        showMessage('Quick edit saved successfully!');
        closeQuickEdit();
    } catch (e) {
        console.error("Error saving quick edit:", e);
        showMessage("Error: Could not save changes.", true);
    }
}

/**
 * Close quick edit modal
 */
function closeQuickEdit() {
    const modal = document.getElementById('quick-edit-modal');
    if (modal) {
        modal.remove();
    }
}

// === Admin Modal Functions ===
// Functions for managing modals (product details, edit/add forms, category selection)

/**
 * Hide the product detail modal (customer view, rarely used in admin)
 */
function hideItemDetailModal() { 
    document.getElementById('item-detail-modal').style.display = 'none'; 
}

function hideAdminModal() { 
    document.getElementById('admin-modal').style.display = 'none'; 
}

function hideCategorySelectModal() { 
    document.getElementById('category-select-modal').style.display = 'none'; 
}

function showCategorySelectModal() {
    const modal = document.getElementById('category-select-modal');
    const buttonContainer = document.getElementById('category-select-buttons');
    
    let buttonsHtml = '';
    const categoriesToAdd = allCategories.filter(cat => cat !== 'Specials');
    
    categoriesToAdd.forEach(cat => {
        buttonsHtml += `<button class="bg-sage text-cream p-3 rounded-lg font-bold hover:bg-forest transition btn-brand" onclick="selectCategoryForAdd('${cat}')">${cat}</button>`;
    });
    
    buttonContainer.innerHTML = buttonsHtml;
    modal.style.display = 'flex';
}

function selectCategoryForAdd(category) {
    hideCategorySelectModal();
    currentCategory = category;
    renderCategories(); 
    openAdminModal(null);
}

/**
 * Open the admin edit/add product modal
 * Dynamically generates form fields based on category field definitions
 * @param {Object|null} item - Product object to edit, or null for new product
 */
function openAdminModal(item = null) {
    const isNewItem = !item;
    const modalTitle = document.getElementById('admin-modal-title');
    const formFields = document.getElementById('admin-form-fields');
    
    modalTitle.textContent = isNewItem ? `Add New ${currentCategory}` : `Edit ${item.name}`;
    
    document.getElementById('edit-item-id').value = isNewItem ? '' : item.id;
    
    let html = '';
    const fields = categoryFields[currentCategory];
    
    fields.forEach(field => {
        // Don't render admin-only staffNotes in the main form loop (it's in a separate section)
        if (field.adminOnly && field.id === 'staffNotes') return;

        const value = isNewItem ? '' : (item[field.id] || '');
        const required = field.required ? 'required' : '';
        
        html += `<div><label for="field-${field.id}" class="block text-sm font-bold text-forest mb-1">${field.label} ${field.required ? '<span class="text-red_sale">*</span>' : ''}</label>`;
        
        const commonClasses = "w-full p-2 border-2 border-sage/50 rounded-xl bg-white text-forest focus:outline-none focus:ring-2 focus:ring-sage font-serif";

        if (field.type === 'textarea') {
            html += `<textarea id="field-${field.id}" rows="3" class="${commonClasses}" placeholder="${field.placeholder || ''}">${value}</textarea>`;
        } else if (field.type === 'select') {
            html += `<select id="field-${field.id}" class="${commonClasses}" ${required}>`;
            html += `<option value="">Select ${field.label}</option>`;
            (field.options || []).forEach(opt => {
                html += `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`;
            });
            html += `</select>`;
        } else {
            html += `<input type="text" id="field-${field.id}" value="${value}" class="${commonClasses}" placeholder="${field.placeholder || ''}" ${required}>`;
        }
        html += `</div>`;
    });
    
    formFields.innerHTML = html;

    // Populate admin status fields
    document.getElementById('isFeatured').checked = isNewItem ? false : !!item.isFeatured;
    document.getElementById('isOnSale').checked = isNewItem ? false : !!item.isOnSale;
    document.getElementById('isLowStock').checked = isNewItem ? false : !!item.isLowStock;
    document.getElementById('isSoldOut').checked = isNewItem ? false : !!item.isSoldOut;
    document.getElementById('staffNotes').value = isNewItem ? '' : (item.staffNotes || '');

    document.getElementById('admin-modal').style.display = 'flex';
}

function handleAddItemClick() {
    if (currentCategory === 'All Products') {
         showCategorySelectModal();
         return;
    }
    openAdminModal(null);
}

function handleEditItem(itemId, category) {
    const item = inventory[category] ? inventory[category][itemId] : null;
    if (!item) {
        showMessage("Error: Could not find item to edit.", true);
        return;
    }
    
    if (currentCategory !== category) {
        changeCategory(category);
    }
    
    currentCategory = category;
    openAdminModal(item);
}

// === Admin Authentication ===

/**
 * Handle admin login form submission
 * Uses Firebase email/password authentication
 * @param {Event} event - Form submit event
 */
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorP = document.getElementById('login-error');
    errorP.textContent = '';
    
    if (!window.auth) {
        console.error("Login Error: window.auth is not initialized. Check firebaseConfig.");
        errorP.textContent = 'Error: Firebase config is missing or invalid.';
        return;
    }
    
    window.signInWithEmailAndPassword(window.auth, email, password)
        .then((userCredential) => {
            // Success, handled by onAuthStateChanged
        })
        .catch((error) => {
            console.error("Login Error:", error);
            errorP.textContent = 'Login Failed. Check username or password.';
        });
}

function handleLogout() {
    window.signOut(window.auth).catch((error) => {
        console.error("Logout Error:", error);
        showMessage("Error logging out.", true);
    });
}

/**
 * Show or hide admin controls based on authentication state
 * Controls visibility of edit/delete buttons, add item button, logout button
 * @param {boolean} isLoggedIn - Whether user is authenticated as admin
 */
function toggleAdminUI(isLoggedIn) {
    isAdmin = isLoggedIn;
    const adminElements = document.querySelectorAll('.admin-controls');
    const loginModal = document.getElementById('login-modal');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    if (isLoggedIn) {
        adminElements.forEach(el => el.style.display = 'block');
        if (loginModal) loginModal.style.display = 'none';
        if (loadingIndicator) loadingIndicator.textContent = 'Loading menu data...';
    } else {
        adminElements.forEach(el => el.style.display = 'none');
        if (loginModal) loginModal.style.display = 'flex';
        if (loadingIndicator) loadingIndicator.textContent = 'Please log in.';
    }
    renderMenu();
}

// === UI Functions (inherited from public app with admin enhancements) ===
// Most UI functions are identical to public app but some include admin-specific features

/**
 * Save current filter state for the current category (admin version)
 */
function saveFilterState() {
    categoryFilterState[currentCategory] = {
        searchQuery: currentSearchQuery,
        typeFilter: currentTypeFilter,
        sortBy: currentSortBy,
        sortDirection: currentSortDirection,
        formatFilter: currentFormatFilter,
        deviceFilter: currentDeviceFilter,
        volumeFilter: currentVolumeFilter,
        ratioFilter: currentRatioFilter,
        packagingFilter: currentPackagingFilter,
        infusionFilter: currentInfusionFilter,
        formFilter: currentFormFilter,
        weightFilter: currentWeightFilter,
        cannabinoidFilter: currentCannabinoidFilter,
        edibleFormFilter: currentEdibleFormFilter
    };
}

/**
 * Restore filter state for a category, or use defaults (admin version)
 */
function restoreFilterState(category) {
    const savedState = categoryFilterState[category];
    if (savedState) {
        currentSearchQuery = savedState.searchQuery || '';
        currentTypeFilter = savedState.typeFilter || 'All';
        currentSortBy = savedState.sortBy || 'name';
        currentSortDirection = savedState.sortDirection || 'asc';
        currentFormatFilter = savedState.formatFilter || 'All';
        currentDeviceFilter = savedState.deviceFilter || 'All';
        currentVolumeFilter = savedState.volumeFilter || 'All';
        currentRatioFilter = savedState.ratioFilter || 'All';
        currentPackagingFilter = savedState.packagingFilter || 'All';
        currentInfusionFilter = savedState.infusionFilter || 'All';
        currentFormFilter = savedState.formFilter || 'All';
        currentWeightFilter = savedState.weightFilter || 'All';
        currentCannabinoidFilter = savedState.cannabinoidFilter || 'All';
        currentEdibleFormFilter = savedState.edibleFormFilter || 'All';
    } else {
        // Default values for new category
        currentSearchQuery = '';
        currentTypeFilter = 'All';
        currentSortBy = 'name';
        currentSortDirection = 'asc';
        currentFormatFilter = 'All';
        currentDeviceFilter = 'All';
        currentVolumeFilter = 'All';
        currentRatioFilter = 'All';
        currentPackagingFilter = 'All';
        currentInfusionFilter = 'All';
        currentFormFilter = 'All';
        currentWeightFilter = 'All';
        currentCannabinoidFilter = 'All';
        currentEdibleFormFilter = 'All';
    }
}

/**
 * Switch category and update admin UI elements (like Add Item button label)
 * Now preserves filters when switching categories
 * @param {string} category - Category name to switch to
 */
function changeCategory(category) {
    // Save current category's filter state before switching
    saveFilterState();
    
    currentCategory = category;
    
    // Restore filter state for the new category
    restoreFilterState(category);
    
    // Reset page for infinite scroll
    currentPage = 1;

    // Update Add Item button label
    const addBtnLabel = document.getElementById('add-item-category-label');
    if (addBtnLabel) {
        if (category === 'All Products') {
             addBtnLabel.textContent = '...';
        } else {
             addBtnLabel.textContent = category;
        }
    }
    
    renderCategories();
    renderControls();
    renderMenu();
}

// Import filter handlers from public app (they're the same)
function handleSearch(event) { 
    currentSearchQuery = event.target.value.toLowerCase().trim(); 
    saveFilterState();
    currentPage = 1;
    renderControls(); 
    renderMenu(); 
}

function handleTypeFilter(type) { 
    currentTypeFilter = type; 
    saveFilterState();
    currentPage = 1;
    renderControls(); 
    renderMenu(); 
}

function handleFormatFilter(format) { 
    currentFormatFilter = format; 
    saveFilterState();
    currentPage = 1;
    renderControls(); 
    renderMenu(); 
}

function handleDeviceFilter(device) { 
    currentDeviceFilter = device; 
    saveFilterState();
    currentPage = 1;
    renderControls(); 
    renderMenu(); 
}

function handleVolumeFilter(volume) { 
    currentVolumeFilter = volume; 
    saveFilterState();
    currentPage = 1;
    renderControls(); 
    renderMenu(); 
}

function handleRatioFilter(ratio) { 
    currentRatioFilter = ratio; 
    saveFilterState();
    currentPage = 1;
    renderControls(); 
    renderMenu(); 
}

function handleFormFilter(form) { 
    currentFormFilter = form; 
    saveFilterState();
    currentPage = 1;
    renderControls(); 
    renderMenu(); 
}

function handleWeightFilter(weight) { 
    currentWeightFilter = weight; 
    saveFilterState();
    currentPage = 1;
    renderControls(); 
    renderMenu(); 
}

function handlePackagingFilter(packaging) { 
    currentPackagingFilter = packaging; 
    saveFilterState();
    currentPage = 1;
    renderControls(); 
    renderMenu(); 
}

function handleInfusionFilter(infused) { 
    currentInfusionFilter = infused; 
    saveFilterState();
    currentPage = 1;
    renderControls(); 
    renderMenu(); 
}

function handleCannabinoidFilter(cannabinoid) { 
    currentCannabinoidFilter = cannabinoid; 
    saveFilterState();
    currentPage = 1;
    renderControls(); 
    renderMenu(); 
}

function handleEdibleFormFilter(form) { 
    currentEdibleFormFilter = form; 
    saveFilterState();
    currentPage = 1;
    renderControls(); 
    renderMenu(); 
}

function handleSortChange(event) { 
    currentSortBy = event.target.value; 
    saveFilterState();
    currentPage = 1;
    renderControls(); 
    renderMenu(); 
}

function handleSortDirection(direction) { 
    currentSortDirection = direction; 
    saveFilterState();
    currentPage = 1;
    renderControls(); 
    renderMenu(); 
}

// === Render Functions ===

function renderCategories() {
    const tabsContainer = document.getElementById('category-tabs');
    tabsContainer.innerHTML = '';
    navCategories.forEach(category => {
        const isActive = currentCategory === category;
        const button = document.createElement('button');
        button.onclick = () => window.changeCategory(category);
        const iconHtml = categoryIcons[category] || '';
        const activeClasses = 'bg-sage text-cream border-b-4 border-cream';
        const inactiveClasses = 'text-cream/70 hover:text-cream/90 hover:bg-forest/70 transition';
        button.innerHTML = `<span class="flex justify-center items-center space-x-1 sm:space-x-2">${iconHtml}<span>${category}</span></span>`;
        button.className = `p-3 sm:p-4 flex-grow flex-shrink-0 text-xs sm:text-base font-bold ${isActive ? activeClasses : inactiveClasses} whitespace-nowrap`;
        tabsContainer.appendChild(button);
    });
}

// renderControls is very similar to public version - we can reuse most of it
// For now, I'll include a simplified version that matches the admin needs
function renderControls() {
    const controlsContainer = document.getElementById('controls-container');
    const searchPlaceholder = currentCategory === 'All Products' ? 'Search all products...' : `Search in ${currentCategory}...`;

    let html = `<div class="mb-2"><input type="text" id="search-input" oninput="handleSearch(event)" value="${currentSearchQuery}" class="w-full p-2 border-2 border-sage rounded-xl bg-white text-forest focus:outline-none focus:ring-2 focus:ring-sage placeholder-sage/70 font-serif text-sm" placeholder="${searchPlaceholder}"></div>`;
    
    // Type Filter
    const typeFilters = ['All Types', 'Indica', 'Sativa', 'Hybrid'];
    const supportsTypeFilter = ['All Products', 'Flower', 'Cartridges', 'Concentrates', 'Pre-Rolls', 'Edibles'].includes(currentCategory);

    if (supportsTypeFilter) {
        html += `<div class="mb-2 p-2 bg-cream shadow-inner rounded-xl border border-sage/30">
                     <label class="text-xs font-bold text-forest mb-1 block">Filter by Type:</label>
                     <div class="flex flex-wrap gap-2">`;
        typeFilters.forEach(type => {
            const filterValue = type === 'All Types' ? 'All' : type;
            const isActive = currentTypeFilter === filterValue;
            const buttonClass = isActive ? 'bg-forest text-cream' : 'bg-white text-forest border border-sage/50 hover:bg-sage/10';
            html += `<button onclick="handleTypeFilter('${filterValue}')" class="p-1.5 px-3 rounded-lg transition text-xs font-semibold btn-brand ${buttonClass}">${type}</button>`;
        });
        html += `</div></div>`;
    }

    // Edibles Filters
    if (currentCategory === 'Edibles') {
        const cannabinoidFilters = ['All Cannabinoids', 'THC', 'CBD', 'CBG', 'CBN', 'CBC'];
        html += `<div class="mb-2 p-2 bg-cream shadow-inner rounded-xl border border-sage/30">
                      <label class="text-xs font-bold text-forest mb-1 block">Filter by Cannabinoid Focus:</label>
                      <div class="flex flex-wrap gap-2">`;
        cannabinoidFilters.forEach(cb => {
            const filterValue = cb === 'All Cannabinoids' ? 'All' : cb;
            const isActive = currentCannabinoidFilter === filterValue;
            const buttonClass = isActive ? 'bg-forest text-cream' : 'bg-white text-forest border border-sage/50 hover:bg-sage/10';
            html += `<button onclick="handleCannabinoidFilter('${filterValue}')" class="p-1.5 px-3 rounded-lg transition text-xs font-semibold btn-brand ${buttonClass}">${cb}</button>`;
        });
        html += `</div></div>`;
        
        const edibleFormFilters = ['All Forms', 'Gummies', 'Chocolates', 'Mints', 'Drinks', 'FECO', 'Other'];
        html += `<div class="mb-2 p-2 bg-cream shadow-inner rounded-xl border border-sage/30">
                      <label class="text-xs font-bold text-forest mb-1 block">Filter by Edible Form:</label>
                      <div class="flex flex-wrap gap-2">`;
        edibleFormFilters.forEach(form => {
            const filterValue = form === 'All Forms' ? 'All' : form;
            const isActive = currentEdibleFormFilter === filterValue;
            const buttonClass = isActive ? 'bg-forest text-cream' : 'bg-white text-forest border border-sage/50 hover:bg-sage/10';
            html += `<button onclick="handleEdibleFormFilter('${filterValue}')" class="p-1.5 px-3 rounded-lg transition text-xs font-semibold btn-brand ${buttonClass}">${form}</button>`;
        });
        html += `</div></div>`;
    }

    // Concentrates Format Filter
    if (currentCategory === 'Concentrates') {
        const formatFilters = ['All Formats', 'Live Resin', 'Live Rosin', 'Other'];
        html += `<div class="mb-2 p-2 bg-cream shadow-inner rounded-xl border border-sage/30">
                     <label class="text-xs font-bold text-forest mb-1 block">Filter by Concentrate Format:</label>
                     <div class="flex flex-wrap gap-2">`;
        formatFilters.forEach(format => {
            const filterValue = format === 'All Formats' ? 'All' : format;
            const isActive = currentFormatFilter === filterValue;
            const buttonClass = isActive ? 'bg-forest text-cream' : 'bg-white text-forest border border-sage/50 hover:bg-sage/10';
            html += `<button onclick="handleFormatFilter('${filterValue}')" class="p-1.5 px-3 rounded-lg transition text-xs font-semibold btn-brand ${buttonClass}">${format}</button>`;
        });
        html += `</div></div>`;
    }

    // Tinctures Ratio Filter
    if (currentCategory === 'Tinctures') {
        const ratioFilters = ['All Ratios', '1:1', '5:1 CBD', 'CBD Only', 'THC Only'];
        html += `<div class="mb-2 p-2 bg-cream shadow-inner rounded-xl border border-sage/30">
                     <label class="text-xs font-bold text-forest mb-1 block">Filter by Cannabinoid Ratio:</label>
                     <div class="flex flex-wrap gap-2">`;
        ratioFilters.forEach(ratio => {
            const filterValue = ratio === 'All Ratios' ? 'All' : ratio;
            const isActive = currentRatioFilter === filterValue;
            const buttonClass = isActive ? 'bg-forest text-cream' : 'bg-white text-forest border border-sage/50 hover:bg-sage/10';
            html += `<button onclick="handleRatioFilter('${filterValue}')" class="p-1.5 px-3 rounded-lg transition text-xs font-semibold btn-brand ${buttonClass}">${ratio}</button>`;
        });
        html += `</div></div>`;
    }

    // Topicals Form Filter
    if (currentCategory === 'Topicals') {
        const formFilters = ['All Forms', 'Lotion', 'Balm', 'Salt', 'Oil'];
        html += `<div class="mb-2 p-2 bg-cream shadow-inner rounded-xl border border-sage/30">
                     <label class="text-xs font-bold text-forest mb-1 block">Filter by Product Form:</label>
                     <div class="flex flex-wrap gap-2">`;
        formFilters.forEach(form => {
            const filterValue = form === 'All Forms' ? 'All' : form;
            const isActive = currentFormFilter === filterValue;
            const buttonClass = isActive ? 'bg-forest text-cream' : 'bg-white text-forest border border-sage/50 hover:bg-sage/10';
            html += `<button onclick="handleFormFilter('${filterValue}')" class="p-1.5 px-3 rounded-lg transition text-xs font-semibold btn-brand ${buttonClass}">${form}</button>`;
        });
        html += `</div></div>`;
    }

    // Cartridges Filters
    if (currentCategory === 'Cartridges') {
        const cartFormatFilters = ['All Contents', 'Live Rosin', 'Live Resin', 'Distillate', 'Oil'];
        html += `<div class="mb-2 p-2 bg-cream shadow-inner rounded-xl border border-sage/30">
                     <label class="text-xs font-bold text-forest mb-1 block">Filter by Content:</label>
                     <div class="flex flex-wrap gap-2">`;
        cartFormatFilters.forEach(format => {
            const filterValue = format === 'All Contents' ? 'All' : format;
            const isActive = currentFormatFilter === filterValue;
            const buttonClass = isActive ? 'bg-forest text-cream' : 'bg-white text-forest border border-sage/50 hover:bg-sage/10';
            html += `<button onclick="handleFormatFilter('${filterValue}')" class="p-1.5 px-3 rounded-lg transition text-xs font-semibold btn-brand ${buttonClass}">${format}</button>`;
        });
        html += `</div></div>`;
        
        const volumeFilters = ['All Volumes', '0.5g', '1g', '2g'];
        html += `<div class="mb-2 p-2 bg-cream shadow-inner rounded-xl border border-sage/30">
                     <label class="text-xs font-bold text-forest mb-1 block">Filter by Volume:</label>
                     <div class="flex flex-wrap gap-2">`;
        volumeFilters.forEach(volume => {
            const filterValue = volume === 'All Volumes' ? 'All' : volume;
            const isActive = currentVolumeFilter === filterValue;
            const buttonClass = isActive ? 'bg-forest text-cream' : 'bg-white text-forest border border-sage/50 hover:bg-sage/10';
            html += `<button onclick="handleVolumeFilter('${filterValue}')" class="p-1.5 px-3 rounded-lg transition text-xs font-semibold btn-brand ${buttonClass}">${volume}</button>`;
        });
        html += `</div></div>`;

        const deviceFilters = ['All Devices', '510 Screw On', 'All-In-One'];
        html += `<div class="mb-2 p-2 bg-cream shadow-inner rounded-xl border border-sage/30">
                     <label class="text-xs font-bold text-forest mb-1 block">Filter by Device Type:</label>
                     <div class="flex flex-wrap gap-2">`;
        deviceFilters.forEach(device => {
            const filterValue = device === 'All Devices' ? 'All' : device;
            const isActive = currentDeviceFilter === filterValue;
            const buttonClass = isActive ? 'bg-forest text-cream' : 'bg-white text-forest border border-sage/50 hover:bg-sage/10';
            html += `<button onclick="handleDeviceFilter('${filterValue}')" class="p-1.5 px-3 rounded-lg transition text-xs font-semibold btn-brand ${buttonClass}">${device}</button>`;
        });
        html += `</div></div>`;
    }

    // Pre-Rolls Filters
    if (currentCategory === 'Pre-Rolls') {
        const weightFilters = ['All Weights', '0.5g', '1g', '1.5g'];
        html += `<div class="mb-2 p-2 bg-cream shadow-inner rounded-xl border border-sage/30">
                     <label class="text-xs font-bold text-forest mb-1 block">Filter by Weight:</label>
                     <div class="flex flex-wrap gap-2">`;
        weightFilters.forEach(weight => {
            const filterValue = weight === 'All Weights' ? 'All' : weight;
            const isActive = currentWeightFilter === filterValue;
            const buttonClass = isActive ? 'bg-forest text-cream' : 'bg-white text-forest border border-sage/50 hover:bg-sage/10';
            html += `<button onclick="handleWeightFilter('${filterValue}')" class="p-1.5 px-3 rounded-lg transition text-xs font-semibold btn-brand ${buttonClass}">${weight}</button>`;
        });
        html += `</div></div>`;
        
        const packInfusionFilters = ['All Packaging', 'Singles', 'Packs', 'Infused', 'Non-Infused'];
        html += `<div class="mb-2 p-2 bg-cream shadow-inner rounded-xl border border-sage/30">
                     <label class="text-xs font-bold text-forest mb-1 block">Filter by Packaging/Infusion:</label>
                     <div class="flex flex-wrap gap-2">`;
        packInfusionFilters.forEach(filter => {
            const filterValue = filter === 'All Packaging' ? 'All' : filter;
            let isActive = false;
            let handler = '';
            
            if (filter === 'Singles' || filter === 'Packs') {
                isActive = currentPackagingFilter === filter;
                handler = `currentPackagingFilter = '${filterValue}'; currentInfusionFilter = 'All'`;
            } else if (filter === 'Infused') {
                isActive = currentInfusionFilter === 'Yes';
                handler = `currentInfusionFilter = 'Yes'; currentPackagingFilter = 'All'`;
            } else if (filter === 'Non-Infused') {
                 isActive = currentInfusionFilter === 'No';
                 handler = `currentInfusionFilter = 'No'; currentPackagingFilter = 'All'`;
            } else {
                isActive = currentPackagingFilter === 'All' && currentInfusionFilter === 'All';
                handler = `currentPackagingFilter = 'All'; currentInfusionFilter = 'All'`; 
            }
            
            const buttonClass = isActive ? 'bg-forest text-cream' : 'bg-white text-forest border border-sage/50 hover:bg-sage/10';
            html += `<button onclick="${handler}; renderControls(); renderMenu();" class="p-1.5 px-3 rounded-lg transition text-xs font-semibold btn-brand ${buttonClass}">${filter}</button>`;
        });
        html += `</div></div>`;
    }

    // Sort Controls
    let sortOptions = [{ value: 'name', label: 'Name' }];
    const fields = categoryFields[currentCategory] || [];
    
    fields.forEach(f => {
        if(f.sortable && f.id !== 'name') {
            if (currentCategory === 'Flower' && f.id.startsWith('price_')) {
                if (f.id === 'price_1g') {
                    sortOptions.push({ value: 'price_1g', label: 'Price (1g Base)' });
                }
                return;
            } 
            sortOptions.push({ value: f.id, label: f.label.split('(')[0].trim() });
        }
    });
    
    if (currentCategory === 'All Products' || currentCategory === 'Specials') {
         sortOptions = [
             { value: 'name', label: 'Name' }, 
             { value: 'price', label: 'Price (Default)' }, 
             { value: 'type', label: 'Type' },
             { value: 'updatedAt', label: 'Recently Modified' },
             { value: 'createdAt', label: 'Newest First' }
         ];
         if(!['name', 'price', 'type', 'updatedAt', 'createdAt'].includes(currentSortBy)) { currentSortBy = 'name'; }
    } else if (currentCategory !== 'Flower') {
         sortOptions = sortOptions.filter(opt => !opt.value.startsWith('price_'));
         if (!sortOptions.some(opt => opt.value === 'price')) {
           sortOptions.push({ value: 'price', label: 'Price' });
         }
         // Add timestamp sorting
         if (!sortOptions.some(opt => opt.value === 'updatedAt')) {
           sortOptions.push({ value: 'updatedAt', label: 'Recently Modified' });
         }
         if (!sortOptions.some(opt => opt.value === 'createdAt')) {
           sortOptions.push({ value: 'createdAt', label: 'Newest First' });
         }
    } else {
        // Flower category - add timestamp sorting
        if (!sortOptions.some(opt => opt.value === 'updatedAt')) {
           sortOptions.push({ value: 'updatedAt', label: 'Recently Modified' });
        }
        if (!sortOptions.some(opt => opt.value === 'createdAt')) {
           sortOptions.push({ value: 'createdAt', label: 'Newest First' });
        }
    }

    // View Mode Toggle
    html += `
        <div class="mb-2 p-2 bg-cream shadow-inner rounded-xl border border-sage/30 flex items-center justify-between">
            <div class="flex items-center space-x-2">
                <span class="text-xs font-bold text-forest whitespace-nowrap">View:</span>
                <button onclick="toggleViewMode('grid')" class="p-1.5 px-3 rounded-lg text-xs font-semibold transition btn-brand ${currentViewMode === 'grid' ? 'bg-forest text-cream' : 'bg-white text-forest border border-sage/50 hover:bg-sage/10'}" title="Grid View">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block mr-1"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    Grid
                </button>
                <button onclick="toggleViewMode('list')" class="p-1.5 px-3 rounded-lg text-xs font-semibold transition btn-brand ${currentViewMode === 'list' ? 'bg-forest text-cream' : 'bg-white text-forest border border-sage/50 hover:bg-sage/10'}" title="List View">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block mr-1"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                    List
                </button>
            </div>
        </div>
    `;

    html += `
        <div class="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-2 p-2 bg-cream shadow-inner rounded-xl border border-sage/30">
            <div class="flex items-center space-x-2 w-full sm:w-auto">
                <label for="sort-by" class="text-xs font-bold text-forest whitespace-nowrap">Sort By:</label>
                <select id="sort-by" onchange="handleSortChange(event)" class="p-1.5 border border-sage/50 rounded-lg bg-white text-forest text-xs w-full font-serif">
    `;
    sortOptions.forEach(opt => { 
        html += `<option value="${opt.value}" ${currentSortBy === opt.value ? 'selected' : ''}>${opt.label}</option>`; 
    });

    html += `</select></div><div class="flex space-x-2 w-full sm:w-auto justify-end">
                <button class="flex items-center space-x-1 p-1.5 rounded-lg text-xs transition btn-brand w-1/2 sm:w-auto ${currentSortDirection === 'asc' ? 'bg-forest text-cream' : 'bg-gray-200 text-forest hover:bg-gray-300'}" onclick="handleSortDirection('asc')" title="Sort Ascending">A-Z / Low <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg></button>
                <button class="flex items-center space-x-1 p-1.5 rounded-lg text-xs transition btn-brand w-1/2 sm:w-auto ${currentSortDirection === 'desc' ? 'bg-forest text-cream' : 'bg-gray-200 text-forest hover:bg-gray-300'}" onclick="handleSortDirection('desc')" title="Sort Descending">Z-A / High <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg></button>
            </div>
        </div>
    `;
    
    controlsContainer.innerHTML = html;
    if (document.getElementById('search-input')) { 
        document.getElementById('search-input').value = currentSearchQuery; 
    }
    if (document.getElementById('sort-by')) { 
        document.getElementById('sort-by').value = currentSortBy; 
    }
}

function renderMenu() {
    const productList = document.getElementById('product-list');
    let itemsToDisplay = [];
    
    if (currentCategory === 'All Products') {
        for (const cat in inventory) { 
            for (const id in inventory[cat]) { 
                itemsToDisplay.push(inventory[cat][id]); 
            } 
        }
    } else if (currentCategory === 'Specials') {
         itemsToDisplay = [];
         for (const cat in inventory) {
             for (const id in inventory[cat]) {
                 const item = inventory[cat][id];
                 if ((cat === 'Specials' && !item.isSoldOut) || 
                     ((item.isFeatured || item.isOnSale) && item.category !== 'Specials' && !item.isSoldOut) ) {
                     itemsToDisplay.push(item);
                 }
             }
         }
         itemsToDisplay = itemsToDisplay.filter((value, index, self) =>
            index === self.findIndex((t) => (t.id === value.id && t.category === value.category))
         );
    } else if (inventory[currentCategory]) {
        itemsToDisplay = Object.values(inventory[currentCategory]);
    }

    // Apply search filter
    if (currentSearchQuery.length > 0) {
        itemsToDisplay = itemsToDisplay.filter(item => 
            Object.values(item).some(value => 
                typeof value === 'string' && value.toLowerCase().includes(currentSearchQuery)
            )
        );
    }
    
    // Apply category-specific filters (same as public)
    if (currentTypeFilter !== 'All') {
        itemsToDisplay = itemsToDisplay.filter(item => item.type && item.type === currentTypeFilter);
    }
    
    if (currentCategory === 'Concentrates' && currentFormatFilter !== 'All') {
        itemsToDisplay = itemsToDisplay.filter(item => item.format && item.format === currentFormatFilter);
    }
    
    if (currentCategory === 'Topicals' && currentFormFilter !== 'All') {
         itemsToDisplay = itemsToDisplay.filter(item => item.form && item.form === currentFormFilter);
    }

    if (currentCategory === 'Tinctures' && currentRatioFilter !== 'All') {
         itemsToDisplay = itemsToDisplay.filter(item => item.ratio && item.ratio === currentRatioFilter);
    }

    if (currentCategory === 'Edibles' && currentCannabinoidFilter !== 'All') {
         itemsToDisplay = itemsToDisplay.filter(item => item.cannabinoids && item.cannabinoids.includes(currentCannabinoidFilter));
    }

    if (currentCategory === 'Edibles' && currentEdibleFormFilter !== 'All') {
       itemsToDisplay = itemsToDisplay.filter(item => item.edibleForm && item.edibleForm === currentEdibleFormFilter);
    }
    
    if (currentCategory === 'Cartridges') {
        if (currentFormatFilter !== 'All') { 
            itemsToDisplay = itemsToDisplay.filter(item => item.format_type && item.format_type === currentFormatFilter); 
        }
        if (currentDeviceFilter !== 'All') { 
            itemsToDisplay = itemsToDisplay.filter(item => item.device_type && item.device_type === currentDeviceFilter); 
        }
        if (currentVolumeFilter !== 'All') { 
            itemsToDisplay = itemsToDisplay.filter(item => item.volume && item.volume === currentVolumeFilter); 
        }
    }

    if (currentCategory === 'Pre-Rolls') {
        if (currentWeightFilter !== 'All') { 
            itemsToDisplay = itemsToDisplay.filter(item => item.weight && item.weight === currentWeightFilter); 
        }
        if (currentPackagingFilter !== 'All') { 
            itemsToDisplay = itemsToDisplay.filter(item => item.packaging && item.packaging === currentPackagingFilter); 
        }
        if (currentInfusionFilter !== 'All') { 
            itemsToDisplay = itemsToDisplay.filter(item => item.infused && item.infused === currentInfusionFilter); 
        }
    }
    
    // Sorting (same as public)
    itemsToDisplay.sort((a, b) => {
        const featuredCompare = (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
        if (featuredCompare !== 0) return featuredCompare;
        const soldOutCompare = (a.isSoldOut ? 1 : 0) - (b.isSoldOut ? 1 : 0);
        if (soldOutCompare !== 0) return soldOutCompare;

        let aValue = a[currentSortBy] || '';
        let bValue = b[currentSortBy] || '';
        let comparison = 0;
        
        // Handle timestamp sorting (newest first by default)
        if (currentSortBy === 'updatedAt' || currentSortBy === 'createdAt') {
            const aTime = aValue ? new Date(aValue).getTime() : 0;
            const bTime = bValue ? new Date(bValue).getTime() : 0;
            comparison = bTime - aTime; // Newest first (descending)
        } else {
        
        const priceFields = ['price_1g', 'price_35g', 'price_7g', 'price'];
        if (priceFields.includes(currentSortBy) || ((currentCategory === 'All Products' || currentCategory === 'Specials') && currentSortBy === 'price')) {
            if ((currentCategory === 'All Products' || currentCategory === 'Specials') && currentSortBy === 'price') {
                aValue = a.price_1g || a.price;
                bValue = b.price_1g || b.price;
            } else if (currentCategory === 'Flower' && currentSortBy === 'price_1g') {
                aValue = a.price_1g;
                bValue = b.price_1g;
            }
            
            const numericA = extractPrice(aValue);
            const numericB = extractPrice(bValue);
            comparison = numericA - numericB;
        } else {
            comparison = String(aValue).localeCompare(String(bValue), undefined, { numeric: true });
        }
        }
        
        // For timestamp fields, reverse if ascending (oldest first)
        if ((currentSortBy === 'updatedAt' || currentSortBy === 'createdAt') && currentSortDirection === 'asc') {
            return -comparison;
        }
        
        return currentSortDirection === 'asc' ? comparison : -comparison;
    });

    // Store filtered items for infinite scroll
    allFilteredItems = itemsToDisplay;
    
    // Calculate items to display for current page
    const itemsToShow = allFilteredItems.slice(0, currentPage * itemsPerPage);
    const hasMore = allFilteredItems.length > itemsToShow.length;
    
    // Apply view mode classes to container
    if (currentViewMode === 'list') {
        productList.className = 'pt-4 bg-white rounded-lg overflow-hidden border border-sage/20 shadow-md';
    } else {
        productList.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 md:gap-3 pt-4';
    }
    
    // Render
    if (itemsToDisplay.length === 0) {
        let message = `No items available in the ${currentCategory} category.`;
        if (currentCategory === 'Specials') { 
            message = `No specials are currently active.`; 
        } else if (currentSearchQuery.length > 0) { 
            message = `No products found matching "${currentSearchQuery}".`; 
        } else if (currentTypeFilter !== 'All') { 
            message = `No ${currentTypeFilter} products found in this category.`; 
        }
        productList.className = 'pt-4';
        productList.innerHTML = `<div class="col-span-full text-center text-xl text-sage pt-10 font-serif">${message}</div>`;
    } else {
        if (currentViewMode === 'list') {
            productList.innerHTML = itemsToShow.map(renderProductListItem).join('');
        } else {
            productList.innerHTML = itemsToShow.map(renderProductCard).join('');
        }
        
        // Add "Load More" button or infinite scroll trigger
        if (hasMore) {
            const loadMoreHtml = `
                <div id="load-more-container" class="${currentViewMode === 'list' ? 'p-4 bg-cream border-t border-sage/20' : 'col-span-full'} flex justify-center py-4">
                    <button id="load-more-btn" onclick="loadMoreItems()" class="bg-sage text-cream px-6 py-3 rounded-lg font-bold hover:bg-forest transition btn-brand text-sm">
                        Load More (${allFilteredItems.length - itemsToShow.length} remaining)
                    </button>
                </div>
            `;
            productList.innerHTML += loadMoreHtml;
        }
    }
    
    // Remove old scroll listener and add new one
    removeScrollListener();
    if (hasMore) {
        setupInfiniteScroll();
    }
}

/**
 * Load more items (infinite scroll) - admin version
 */
function loadMoreItems() {
    currentPage++;
    renderMenu();
}

/**
 * Setup infinite scroll listener - admin version
 */
let scrollListener = null;
function setupInfiniteScroll() {
    scrollListener = () => {
        // Check if user scrolled near bottom (within 200px)
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
            const loadMoreBtn = document.getElementById('load-more-btn');
            if (loadMoreBtn && loadMoreBtn.offsetParent !== null) {
                loadMoreItems();
            }
        }
    };
    window.addEventListener('scroll', scrollListener, { passive: true });
}

/**
 * Remove scroll listener - admin version
 */
function removeScrollListener() {
    if (scrollListener) {
        window.removeEventListener('scroll', scrollListener);
        scrollListener = null;
    }
}

/**
 * Toggle between grid and list view (admin version)
 * @param {string} mode - 'grid' or 'list'
 */
function toggleViewMode(mode) {
    currentViewMode = mode;
    localStorage.setItem('adminViewMode', mode);
    renderControls(); // Re-render controls to update button colors
    renderMenu();
}

function renderProductCard(item) {
    const isFlower = item.category === 'Flower';
    const priceColorClass = item.isFeatured ? 'text-red_sale' : 'text-forest';

    let priceHtml = '';
    if (isFlower) {
        priceHtml = `
            <div class="flex flex-col space-y-0.5">
                <span class="text-base md:text-lg font-bold ${priceColorClass} leading-tight">${item.price_1g || 'N/A'}</span>
                <span class="text-[9px] text-sage/90 leading-tight">${item.price_35g || 'N/A'} / 3.5g</span>
            </div>
        `;
    } else {
        priceHtml = `<span class="text-base md:text-lg font-bold ${priceColorClass} leading-tight">${item.price || 'N/A'}</span>`;
    }
    
    const soldOutBadge = item.isSoldOut ? `<div class="absolute inset-0 bg-forest/80 flex items-center justify-center rounded-xl pointer-events-none z-10"><span class="text-xl md:text-2xl font-bold text-cream bg-red_sale/90 p-2 md:p-3 shadow-2xl transform -rotate-6 rounded-xl whitespace-nowrap">SOLD OUT</span></div>` : '';
    const featuredBanner = item.isFeatured ? `<div class="bg-red_sale text-cream text-center text-[10px] md:text-xs font-bold py-0.5 md:py-1 uppercase tracking-wider">⭐ FEATURED</div>` : '';
    
    let topRightBadges = '';
    let badges = [];
    if (item.isLowStock && !item.isSoldOut && !item.isFeatured) {
         badges.push(`<span class="bg-orange_low text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">LOW STOCK</span>`);
    }
    if (item.isOnSale && !item.isSoldOut && !item.isFeatured) {
         badges.push(`<span class="bg-sale_blue text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">ON SALE</span>`);
    }
    if (badges.length > 0) {
         topRightBadges = `<div class="flex space-x-1 absolute top-2 right-2 z-5">${badges.join('')}</div>`;
    }

    // Admin buttons
    let adminButtons = '';
    if (isAdmin) {
        adminButtons = `
            <div class="p-1.5 md:p-2 bg-forest/10 flex flex-wrap justify-end gap-1.5 md:gap-2">
                <button class="bg-sage text-cream px-2 py-1 md:px-2.5 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold btn-brand" onclick="event.stopPropagation(); handleQuickEdit('${item.id}', '${item.category}')" title="Quick Edit">⚡ Quick</button>
                <button class="bg-forest text-cream px-2 py-1 md:px-2.5 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold btn-brand" onclick="event.stopPropagation(); handleEditItem('${item.id}', '${item.category}')" title="Full Edit">Edit</button>
                <button class="bg-orange_low text-white px-2 py-1 md:px-2.5 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold btn-brand" onclick="event.stopPropagation(); handleDuplicateItem('${item.id}', '${item.category}')" title="Duplicate">Copy</button>
                <button class="bg-red_sale text-white px-2 py-1 md:px-2.5 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold btn-brand" onclick="event.stopPropagation(); handleDeleteItem('${item.id}', '${item.category}')" title="Delete">Del</button>
            </div>
        `;
    }

    // More compact grid card classes
    const cardClasses = `relative flex flex-col bg-white rounded-lg shadow-md transition-transform duration-200 hover:scale-[1.02] overflow-hidden border border-sage/20 ${item.isSoldOut ? 'sold-out' : ''}`;
    
    return `
        <div class="${cardClasses}">
            ${soldOutBadge}
            ${featuredBanner}
            ${topRightBadges}
            
            <div class="p-2 md:p-2.5 pt-2 flex flex-col justify-start flex-grow">
                ${(currentCategory === 'All Products' || currentCategory === 'Specials') && !item.isFeatured ? `<span class="text-[9px] font-bold text-sage block mb-0.5">${item.category.toUpperCase()}</span>` : ''}
                ${(currentCategory === 'All Products' || currentCategory === 'Specials') && item.isFeatured ? `<span class="text-[9px] font-bold text-sage block mt-3 mb-0.5">${item.category.toUpperCase()}</span>` : ''}
                ${(currentCategory === 'All Products' || currentCategory === 'Specials') && (item.isLowStock || item.isOnSale) && !item.isFeatured ? `<span class="text-[9px] font-bold text-sage block mt-3 mb-0.5">${item.category.toUpperCase()}</span>` : ''}

                <h2 class="text-sm md:text-base font-bold text-forest mb-0.5 truncate leading-tight" title="${item.name}">${item.name}</h2>
                <p class="text-[9px] text-sage mb-1 leading-tight"><span class="font-semibold">${item.brand || item.grower || ''}</span> ${item.type ? `| ${item.type}` : ''}</p>
                <p class="text-[10px] text-forest/70 line-clamp-1 leading-tight hidden md:block">${item.description || ''}</p>
            </div>

            <div class="p-2 md:p-2.5 pt-1.5 border-t border-sage/20 mt-auto flex justify-between items-center bg-cream/70">
                <div class="text-forest">${priceHtml}</div>
            </div>
            
            ${adminButtons}
        </div>`;
}

/**
 * Generate HTML for a single product list item (list view - condensed) - admin version
 * Horizontal layout with minimal info for fast scanning
 * @param {Object} item - Product data object
 * @returns {string} HTML string for the list item
 */
function renderProductListItem(item) {
    const isFlower = item.category === 'Flower';
    const priceColorClass = item.isFeatured ? 'text-red_sale' : 'text-forest';
    
    let priceText = '';
    if (isFlower) {
        priceText = item.price_1g || 'N/A';
    } else {
        priceText = item.price || 'N/A';
    }
    
    // Status indicators
    let statusBadge = '';
    if (item.isFeatured) {
        statusBadge = '<span class="bg-red_sale text-cream text-[9px] font-bold px-1.5 py-0.5 rounded">⭐</span>';
    } else if (item.isSoldOut) {
        statusBadge = '<span class="bg-red_sale text-white text-[9px] font-bold px-1.5 py-0.5 rounded">OUT</span>';
    } else if (item.isOnSale) {
        statusBadge = '<span class="bg-sale_blue text-white text-[9px] font-bold px-1.5 py-0.5 rounded">SALE</span>';
    } else if (item.isLowStock) {
        statusBadge = '<span class="bg-orange_low text-white text-[9px] font-bold px-1.5 py-0.5 rounded">LOW</span>';
    }
    
    // Admin buttons for list view (compact)
    let adminButtonsList = '';
    if (isAdmin) {
        adminButtonsList = `
            <div class="flex-shrink-0 flex space-x-1 ml-2">
                <button class="bg-sage text-cream px-2 py-1 rounded text-[9px] font-bold btn-brand" onclick="event.stopPropagation(); handleQuickEdit('${item.id}', '${item.category}')" title="Quick Edit">⚡</button>
                <button class="bg-forest text-cream px-2 py-1 rounded text-[9px] font-bold btn-brand" onclick="event.stopPropagation(); handleEditItem('${item.id}', '${item.category}')" title="Edit">✏️</button>
                <button class="bg-orange_low text-white px-2 py-1 rounded text-[9px] font-bold btn-brand" onclick="event.stopPropagation(); handleDuplicateItem('${item.id}', '${item.category}')" title="Duplicate">📋</button>
                <button class="bg-red_sale text-white px-2 py-1 rounded text-[9px] font-bold btn-brand" onclick="event.stopPropagation(); handleDeleteItem('${item.id}', '${item.category}')" title="Delete">🗑️</button>
            </div>
        `;
    }
    
    const listItemClasses = `flex items-center justify-between p-2 md:p-2.5 bg-white border-b border-sage/20 hover:bg-cream/50 transition ${item.isSoldOut ? 'opacity-60' : ''}`;
    
    return `
        <div class="${listItemClasses}">
            <div class="flex-1 min-w-0 pr-2 flex items-center">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2">
                        ${statusBadge}
                        <h3 class="text-sm md:text-base font-bold text-forest truncate" title="${item.name}">${item.name}</h3>
                    </div>
                    <p class="text-[10px] md:text-xs text-sage truncate">
                        <span class="font-semibold">${item.brand || item.grower || ''}</span>
                        ${item.type ? ` | ${item.type}` : ''}
                        ${isFlower && item.price_35g ? ` | ${item.price_35g} / 3.5g` : ''}
                    </p>
                </div>
                <div class="flex-shrink-0 text-right mr-2">
                    <div class="text-base md:text-lg font-bold ${priceColorClass}">${priceText}</div>
                    ${(currentCategory === 'All Products' || currentCategory === 'Specials') ? `<div class="text-[9px] text-sage/70">${item.category}</div>` : ''}
                </div>
            </div>
            ${adminButtonsList}
        </div>
    `;
}

// === Initialization ===

/**
 * Initialize the admin menu application
 * Similar to public app but waits for authentication before showing UI
 * @param {boolean} isMock - If true, runs without Firebase (for testing/offline)
 */
function initMenu(isMock = false) {
     if (isMock) {
        console.warn("Firebase not initialized, running in mock mode (empty).");
        renderCategories();
        renderControls();
        renderMenu();
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
             loadingIndicator.textContent = 'Menu loaded (Mock Data - Empty)';
             setTimeout(() => loadingIndicator.classList.add('hidden'), 500);
        }
        return;
     }
    
    renderCategories();
    renderControls();
    setupDataListeners();
}

/**
 * Update the Firebase app ID (called from admin.html initialization)
 * @param {string} newAppId - New application ID
 */
function setAppId(newAppId) {
    appId = newAppId;
}
window.setAppId = setAppId;

// Export functions to window for HTML onclick handlers
window.hideItemDetailModal = hideItemDetailModal;
window.hideAdminModal = hideAdminModal;
window.hideCategorySelectModal = hideCategorySelectModal;
window.showCategorySelectModal = showCategorySelectModal;
window.selectCategoryForAdd = selectCategoryForAdd;
window.saveItem = saveItem;
window.handleAddItemClick = handleAddItemClick;
window.handleEditItem = handleEditItem;
window.handleDeleteItem = handleDeleteItem;
window.handleLogout = handleLogout;
window.changeCategory = changeCategory;
window.handleSearch = handleSearch;
window.handleTypeFilter = handleTypeFilter;
window.handleFormatFilter = handleFormatFilter;
window.handleDeviceFilter = handleDeviceFilter;
window.handleVolumeFilter = handleVolumeFilter;
window.handleRatioFilter = handleRatioFilter;
window.handleFormFilter = handleFormFilter;
window.handleWeightFilter = handleWeightFilter;
window.handlePackagingFilter = handlePackagingFilter;
window.handleInfusionFilter = handleInfusionFilter;
window.handleCannabinoidFilter = handleCannabinoidFilter;
window.handleEdibleFormFilter = handleEdibleFormFilter;
window.handleSortChange = handleSortChange;
window.handleSortDirection = handleSortDirection;
window.toggleViewMode = toggleViewMode;
window.loadMoreItems = loadMoreItems;
window.handleDuplicateItem = handleDuplicateItem;
window.handleQuickEdit = handleQuickEdit;
window.saveQuickEdit = saveQuickEdit;
window.closeQuickEdit = closeQuickEdit;
window.initMenu = initMenu;
window.toggleAdminUI = toggleAdminUI;


