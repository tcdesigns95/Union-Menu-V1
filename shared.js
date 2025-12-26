// =======================================================================
// SHARED APPLICATION CODE
// Used by both index.html (public) and admin.html (admin)
// =======================================================================

// === Configuration ===
const SHARED_CONFIG = {
    // Icon mapping for categories
    categoryIcons: {
        'Flower': `<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H7"/><path d="M17 19H7"/><path d="M19 12c0 3.866-3.134 7-7 7s-7-3.134-7-7c0-3.866 3.134-7 7-7s7 3.134 7 7z"/></svg>`, 
        'Concentrates': `<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 11V7a4 4 0 0 0-8 0v4"/><path d="M22 11h-2a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2v-8z"/><path d="M2 11h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H2v-8z"/><path d="M10 21h4"/></svg>`,
        'Cartridges': `<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 11V7a4 4 0 0 0-8 0v4"/><path d="M12 21a2 2 0 0 0 2-2v-8a2 2 0 0 0-4 0v8a2 2 0 0 0 2 2z"/></svg>`,
        'Edibles': `<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/><path d="M16.2 7.8c-1-1-2.2-1.8-3.6-2.2-1.4-.4-2.8-.2-4.2.6-1.4.8-2.6 2-3.4 3.4-.8 1.4-1 3-1 4.6 0 1.6.4 3.2 1.2 4.6.8 1.4 2 2.6 3.4 3.4 1.4.8 3 .8 4.6.8s3.2-.4 4.6-1.2c1.4-.8 2.6-2 3.4-3.4.8-1.4 1.2-3 1.2-4.6 0-1.6-.4-3.2-1.2-4.6-.8-1.4-2-2.6-3.4-3.4z"/><path d="M12 18c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z"/></svg>`,
        'Topicals': `<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0-7-7h14a7 7 0 0 0-7 7z"/><path d="M12 15V3.5A1.5 1.5 0 0 1 13.5 2h0A1.5 1.5 0 0 1 15 3.5v3.5"/><path d="M12 15V3.5A1.5 1.5 0 0 0 10.5 2h0A1.5 1.5 0 0 0 9 3.5v3.5"/></svg>`,
        'Tinctures': `<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16V9a3 3 0 0 1 6 0v7"/><path d="M10 22h4"/><path d="M10 16a3 3 0 0 1-6 0h12a3 3 0 0 1-6 0z"/><path d="M10 16h4"/></svg>`,
        'Pre-Rolls': `<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6H6a4 4 0 0 0-4 4v4a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4v-4a4 4 0 0 0-4-4z"/><path d="M2 10h4"/><path d="M22 10h-4"/><path d="M2 14h4"/><path d="M22 14h-4"/></svg>`,
        'Specials': `<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 12.5c0 1.1-.9 2-2 2s-2-.9-2-2.9.9-2 2-2c1.1 0 2 .9 2 2.9z"/><path d="M17.5 14.5c0 1.1.9 2 2 2s2-.9 2-2.9-.9-2-2-2c-1.1 0-2 .9-2 2.9z"/><path d="M12.5 19.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/><path d="M14.5 17.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/><path d="M7 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M14 10.042A6.14 6.14 0 0 0 12.503 10a6.16 6.16 0 0 0-1.498.042"/><path d="M9.958 14A6.14 6.14 0 0 0 10 12.503a6.16 6.16 0 0 0-.042-1.498"/><path d="M17 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>`,
        'All Products': `<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 15h1.5a2.5 2.5 0 0 1 0 5H4"/><path d="M19.5 15H18a2.5 2.5 0 0 1 0 5h1.5"/><line x1="12" y1="9" x2="12" y2="15"/><line x1="9" y1="12" x2="15" y2="12"/></svg>`
    },

    // Category field definitions
    // Each category has an array of field objects that define:
    // - id: Unique field identifier (matches Firestore document property)
    // - label: Display label shown in forms and product cards
    // - type: Input type ('text', 'textarea', or 'select')
    // - required: Boolean indicating if field must be filled
    // - sortable: Boolean to include field in sort options
    // - priceField: Boolean to auto-format value as currency ($)
    // - options: Array of options for select dropdowns
    // - placeholder: Example text shown in empty input fields
    categoryFields: {
        'Flower': [
            { id: 'name', label: 'Strain Name / THC%', type: 'text', required: true, sortable: true },
            { id: 'type', label: 'Type (Indica/Sativa/Hybrid)', type: 'select', options: ['Indica', 'Sativa', 'Hybrid'], required: true, sortable: true },
            { id: 'grower', label: 'Grower/Brand Name', type: 'text', required: true, sortable: true },
            { id: 'description', label: 'Description (Effect/Notes)', type: 'textarea' },
            { id: 'terpenes', label: 'Key Terpenes (e.g., Myrcene, Linalool)', type: 'text' },
            { id: 'price_1g', label: 'Price (1 gram)', type: 'text', required: true, placeholder: '$9 - $12', priceField: true, sortable: true }, 
            { id: 'price_35g', label: 'Price (3.5g / Eighth)', type: 'text', required: true, placeholder: '$25 - $40', priceField: true, sortable: true },
            { id: 'price_7g', label: 'Price (7g / Quarter)', type: 'text', required: false, placeholder: '$50 - $80', priceField: true, sortable: true },
            { id: 'flowHubId', label: 'FlowHub Product ID (for sync)', type: 'text', required: false, placeholder: 'Optional - for POS integration' },
            { id: 'metrcLabel', label: 'Metrc Package Label', type: 'text', required: false, placeholder: 'Optional - for compliance tracking' },
        ],
        'Concentrates': [
            { id: 'name', label: 'Product Name (e.g., Live Resin)', type: 'text', required: true, sortable: true },
            { id: 'brand', label: 'Brand', type: 'text', required: true, sortable: true },
            { id: 'type', label: 'Type', type: 'select', options: ['Indica', 'Sativa', 'Hybrid', 'N/A'], required: false, sortable: true },
            { id: 'format', label: 'Format (Resin/Rosin)', type: 'select', options: ['Live Resin', 'Live Rosin', 'Other'], required: true, sortable: true }, 
            { id: 'potency', label: 'THC/Potency %', type: 'text' },
            { id: 'description', label: 'Description/Texture', type: 'textarea' },
            { id: 'price', label: 'Price (per unit)', type: 'text', required: true, priceField: true, sortable: true },
        ],
        'Cartridges': [
            { id: 'name', label: 'Strain/Flavor', type: 'text', required: true, sortable: true },
            { id: 'brand', label: 'Brand', type: 'text', required: true, sortable: true },
            { id: 'type', label: 'Type', type: 'select', options: ['Indica', 'Sativa', 'Hybrid', 'N/A'], required: false, sortable: true },
            { id: 'format_type', label: 'Content Type (Rosin/Resin)', type: 'select', options: ['Live Rosin', 'Live Resin', 'Distillate', 'Oil'], required: true, sortable: true }, 
            { id: 'volume', label: 'Volume (g)', type: 'select', options: ['0.5g', '1g', '2g'], required: true, sortable: true }, 
            { id: 'device_type', label: 'Device (510/AIO)', type: 'select', options: ['510 Screw On', 'All-In-One'], required: true, sortable: true }, 
            { id: 'potency', label: 'THC/Potency %', type: 'text' },
            { id: 'price', label: 'Price', type: 'text', required: true, priceField: true, sortable: true },
            { id: 'description', label: 'Description', type: 'textarea' },
        ],
        'Edibles': [
            { id: 'name', label: 'Product Name', type: 'text', required: true, sortable: true },
            { id: 'brand', label: 'Brand', type: 'text', required: true, sortable: true },
            { id: 'type', label: 'Type', type: 'select', options: ['Indica', 'Sativa', 'Hybrid', 'N/A'], required: false, sortable: true },
            { id: 'cannabinoids', label: 'Minor Cannabinoids', type: 'select', options: ['THC', 'CBD', 'CBG', 'CBN', 'CBC', 'Other'], required: false, sortable: true },
            { id: 'dosage', label: 'Total Dosage (e.g., 100mg)', type: 'text' },
            { id: 'flavor', label: 'Flavor/Type', type: 'text' },
            { id: 'edibleForm', label: 'Form', type: 'select', options: ['Gummies', 'Chocolates', 'Mints', 'Drinks','FECO', 'Other'], required: true, sortable: true },
            { id: 'description', label: 'Description', type: 'textarea' },
            { id: 'price', label: 'Price', type: 'text', required: true, priceField: true, sortable: true },
        ],
        'Topicals': [
            { id: 'name', label: 'Product Name', type: 'text', required: true, sortable: true },
            { id: 'brand', label: 'Brand', type: 'text', required: true, sortable: true },
            { id: 'form', label: 'Product Form', type: 'select', options: ['Lotion', 'Balm', 'Salt', 'Oil', 'Other'], required: true, sortable: true }, 
            { id: 'size', label: 'Size/Volume', type: 'text' },
            { id: 'cbd_ratio', label: 'CBD:THC Ratio', type: 'text' },
            { id: 'description', label: 'Description', type: 'textarea' },
            { id: 'price', label: 'Price', type: 'text', required: true, priceField: true, sortable: true },
        ],
        'Tinctures': [ 
            { id: 'name', label: 'Product Name', type: 'text', required: true, sortable: true },
            { id: 'brand', label: 'Brand', type: 'text', required: true, sortable: true },
            { id: 'ratio', label: 'Cannabinoid Ratio', type: 'select', options: ['1:1', '5:1 CBD', 'CBD Only', 'THC Only', 'Other'], required: true, sortable: true }, 
            { id: 'potency', label: 'Potency (mg)', type: 'text' },
            { id: 'size', label: 'Size (ml)', type: 'text' },
            { id: 'description', label: 'Description', type: 'textarea' },
            { id: 'price', label: 'Price', type: 'text', required: true, priceField: true, sortable: true },
        ],
        'Pre-Rolls': [
            { id: 'name', label: 'Strain Name', type: 'text', required: true, sortable: true },
            { id: 'type', label: 'Type', type: 'select', options: ['Indica', 'Sativa', 'Hybrid', 'N/A'], required: false, sortable: true },
            { id: 'weight', label: 'Weight (g)', type: 'select', options: ['0.5g', '1g', '1.5g', 'Other'], required: true, sortable: true }, 
            { id: 'packaging', label: 'Packaging', type: 'select', options: ['Singles', 'Packs', 'Other'], required: true, sortable: true }, 
            { id: 'infused', label: 'Infused?', type: 'select', options: ['No', 'Yes'], required: true, sortable: true }, 
            { id: 'potency', label: 'Potency/Notes', type: 'text' },
            { id: 'description', label: 'Description', type: 'textarea' },
            { id: 'price', label: 'Price', type: 'text', required: true, priceField: true, sortable: true },
        ],
        'Specials': [
            { id: 'name', label: 'Special Name (e.g., BOGO Deal)', type: 'text', required: true, sortable: true },
            { id: 'category_target', label: 'Target Category (e.g., Edibles)', type: 'text' },
            { id: 'description', label: 'Full Deal Details', type: 'textarea', required: true },
            { id: 'price', label: 'New Price/Discount', type: 'text', required: true, priceField: true, sortable: true },
        ],
    }
};

// Get all categories from field definitions
const allCategories = Object.keys(SHARED_CONFIG.categoryFields);

// Navigation order: 'All Products' and 'Specials' first, then all other categories
// This controls the order of category tabs in the UI
const navCategories = ['All Products', 'Specials', ...allCategories.filter(c => c !== 'Specials')];

// === Utility Functions ===

/**
 * Display a toast notification message to the user
 * @param {string} text - Message text to display
 * @param {boolean} isError - If true, shows message with red background (error style)
 */
function showMessage(text, isError = false) {
    let messageBox = document.getElementById('message-box');
    if (!messageBox) return; 
    
    messageBox.style.backgroundColor = isError ? '#dc2626' : '#22352F';
    messageBox.textContent = text;
    messageBox.classList.remove('hidden', 'opacity-0');
    messageBox.classList.add('opacity-100');

    setTimeout(() => {
        messageBox.classList.remove('opacity-100');
        messageBox.classList.add('opacity-0');
        setTimeout(() => messageBox.classList.add('hidden'), 300);
    }, 3000);
}

/**
 * Extract numeric price value from price string for sorting
 * Handles formats like "$25", "$25.50", "$25 - $30" (takes first number)
 * @param {string} priceStr - Price string (e.g., "$25.50" or "$25 - $30")
 * @returns {number} Numeric price value, or Infinity if no number found
 */
function extractPrice(priceStr) {
    const match = priceStr ? String(priceStr).match(/(\d+\.?\d*)/) : null;
    return match ? parseFloat(match[1]) : Infinity;
}

/**
 * Generate Firestore collection path for a product category
 * Path format: artifacts/{appId}/public/data/{category}
 * Example: artifacts/union-live-menu/public/data/Flower
 * @param {string} category - Category name (e.g., 'Flower', 'Edibles')
 * @param {string} appId - Application ID (default: 'union-live-menu')
 * @returns {string} Full Firestore collection path
 */
function getCollectionPath(category, appId) {
    return `artifacts/${appId}/public/data/${category}`;
}

// === Export for use in both files ===
if (typeof window !== 'undefined') {
    window.SHARED_CONFIG = SHARED_CONFIG;
    window.allCategories = allCategories;
    window.navCategories = navCategories;
    window.showMessage = showMessage;
    window.extractPrice = extractPrice;
    window.getCollectionPath = getCollectionPath;
}

