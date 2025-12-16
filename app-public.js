// =======================================================================
// PUBLIC MENU APPLICATION (index.html)
// =======================================================================

// App State
let inventory = {}; 
let currentCategory = 'Flower';
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
// appId will be set from index.html initialization
let appId = 'union-live-menu';

// Function to update appId
function setAppId(newAppId) {
    appId = newAppId;
}
window.setAppId = setAppId;

// Use shared config
const categoryIcons = SHARED_CONFIG.categoryIcons;
const categoryFields = SHARED_CONFIG.categoryFields;

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

// === UI Functions ===

function hideItemDetailModal() { 
    document.getElementById('item-detail-modal').classList.add('hidden'); 
}

function showItemDetailModal(itemId) {
    let item = null;
    for (const cat of allCategories) {
        if (inventory[cat] && inventory[cat][itemId]) { 
            item = inventory[cat][itemId]; 
            break; 
        }
    }

    if (!item) { 
        showMessage("Error: Product details not found.", true); 
        return; 
    }

    if (item.isSoldOut) return;

    const modalTitle = document.getElementById('detail-modal-title');
    const modalBody = document.getElementById('detail-modal-body');
    
    modalTitle.textContent = item.name;
    
    let html = `<p class="text-sm font-semibold text-sage/90 mb-4">${item.category.toUpperCase()} | ${item.brand || item.grower || ''}</p>`;
    
    // Dynamic Price Display
    html += `<div class="p-4 bg-sage/10 rounded-lg space-y-2 border border-sage/20"><h4 class="text-lg font-bold text-forest">Pricing Options</h4>`;

    if (item.category === 'Flower') {
        if (item.price_1g) html += `<p class="flex justify-between font-medium"><span>1 gram:</span> <span class="text-xl font-bold ${item.isFeatured ? 'text-red_sale' : 'text-forest'}">${item.price_1g}</span></p>`;
        if (item.price_35g) html += `<p class="flex justify-between font-medium"><span>3.5 grams (Eighth):</span> <span class="text-lg font-semibold">${item.price_35g}</span></p>`;
        if (item.price_7g) html += `<p class="flex justify-between font-medium"><span>7 grams (Quarter):</span> <span class="text-lg font-semibold">${item.price_7g}</span></p>`;
    } else {
         html += `<p class="flex justify-between font-medium"><span>Unit Price:</span> <span class="text-xl font-bold ${item.isFeatured ? 'text-red_sale' : 'text-forest'}">${item.price || 'N/A'}</span></p>`;
    }
    html += `</div>`;

    // Full Details
    html += `<div class="mt-6 space-y-3"><h4 class="text-lg font-bold text-forest border-b border-sage/30 pb-1">Product Details</h4>`;

    if (item.description) { 
        html += `<p class="text-base">${item.description}</p>`; 
    }

    // Filter out admin-only fields
    const detailFields = categoryFields[item.category].filter(f => 
        !['name', 'description', 'price', 'price_1g', 'price_35g', 'price_7g', 'staffNotes'].includes(f.id)
    );
    
    detailFields.forEach(field => {
        if (item[field.id]) {
            html += `<p class="text-sm"><span class="font-semibold text-forest/80">${field.label.split('(')[0].trim()}:</span> ${item[field.id]}</p>`;
        }
    });
    html += `</div>`;

    document.getElementById('detail-modal-body').innerHTML = html;
    document.getElementById('item-detail-modal').classList.remove('hidden');
}

function changeCategory(category) {
    currentCategory = category;
    
    const supportsTypeFilter = ['All Products', 'Flower', 'Cartridges', 'Concentrates', 'Pre-Rolls', 'Edibles'].includes(category);
    if (!supportsTypeFilter) { 
        currentTypeFilter = 'All'; 
    }
    
    // Reset ALL specific filters when changing categories
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

    renderCategories();
    renderControls();
    renderMenu();
}

// === Search, Filter & Sort Functions ===
function handleSearch(event) { 
    currentSearchQuery = event.target.value.toLowerCase().trim(); 
    renderControls(); 
    renderMenu(); 
}

function handleTypeFilter(type) { 
    currentTypeFilter = type; 
    renderControls(); 
    renderMenu(); 
}

function handleFormatFilter(format) { 
    currentFormatFilter = format; 
    renderControls(); 
    renderMenu(); 
}

function handleDeviceFilter(device) { 
    currentDeviceFilter = device; 
    renderControls(); 
    renderMenu(); 
}

function handleVolumeFilter(volume) { 
    currentVolumeFilter = volume; 
    renderControls(); 
    renderMenu(); 
}

function handleRatioFilter(ratio) { 
    currentRatioFilter = ratio; 
    renderControls(); 
    renderMenu(); 
}

function handleFormFilter(form) { 
    currentFormFilter = form; 
    renderControls(); 
    renderMenu(); 
}

function handleWeightFilter(weight) { 
    currentWeightFilter = weight; 
    renderControls(); 
    renderMenu(); 
}

function handlePackagingFilter(packaging) { 
    currentPackagingFilter = packaging; 
    renderControls(); 
    renderMenu(); 
}

function handleInfusionFilter(infused) { 
    currentInfusionFilter = infused; 
    renderControls(); 
    renderMenu(); 
}

function handleCannabinoidFilter(cannabinoid) { 
    currentCannabinoidFilter = cannabinoid; 
    renderControls(); 
    renderMenu(); 
}

function handleEdibleFormFilter(form) { 
    currentEdibleFormFilter = form; 
    renderControls(); 
    renderMenu(); 
}

function handleSortChange(event) { 
    currentSortBy = event.target.value; 
    renderControls(); 
    renderMenu(); 
}

function handleSortDirection(direction) { 
    currentSortDirection = direction; 
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

// This is a large function - keeping it here but could be split further
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
        // Cannabinoid Filter
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
        
        // Form Filter
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
        // Content Filter
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
        
        // Volume Filter
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

        // Device Filter
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
        // Weight Filter
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
        
        // Packaging/Infusion Filter
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
         sortOptions = [{ value: 'name', label: 'Name' }, { value: 'price', label: 'Price (Default)' }, { value: 'type', label: 'Type' }];
         if(!['name', 'price', 'type'].includes(currentSortBy)) { currentSortBy = 'name'; }
    } else if (currentCategory !== 'Flower') {
         sortOptions = sortOptions.filter(opt => !opt.value.startsWith('price_'));
         if (!sortOptions.some(opt => opt.value === 'price')) {
           sortOptions.push({ value: 'price', label: 'Price' });
         }
    }

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
    
    // Apply category-specific filters
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
    
    // Sorting
    itemsToDisplay.sort((a, b) => {
        const featuredCompare = (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
        if (featuredCompare !== 0) return featuredCompare;
        const soldOutCompare = (a.isSoldOut ? 1 : 0) - (b.isSoldOut ? 1 : 0);
        if (soldOutCompare !== 0) return soldOutCompare;

        let aValue = a[currentSortBy] || '';
        let bValue = b[currentSortBy] || '';
        let comparison = 0;
        
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
        
        return currentSortDirection === 'asc' ? comparison : -comparison;
    });

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
        productList.innerHTML = `<div class="col-span-full text-center text-xl text-sage pt-10 font-serif">${message}</div>`;
    } else {
        productList.innerHTML = itemsToDisplay.map(renderProductCard).join('');
    }
}

function renderProductCard(item) {
    const isFlower = item.category === 'Flower';
    const priceColorClass = item.isFeatured ? 'text-red_sale' : 'text-forest';

    let priceHtml = '';
    if (isFlower) {
        priceHtml = `
            <div class="flex flex-col space-y-1">
                <span class="text-xl font-bold ${priceColorClass}">${item.price_1g || 'N/A'}</span>
                <span class="text-xs text-sage/90">${item.price_35g || 'N/A'} / 3.5g</span>
            </div>
        `;
    } else {
        priceHtml = `<span class="text-xl font-bold ${priceColorClass}">${item.price || 'N/A'}</span>`;
    }
    
    const soldOutBadge = item.isSoldOut ? `<div class="absolute inset-0 bg-forest/80 flex items-center justify-center rounded-xl pointer-events-none z-10"><span class="text-xl md:text-2xl font-bold text-cream bg-red_sale/90 p-2 md:p-3 shadow-2xl transform -rotate-6 rounded-xl whitespace-nowrap">SOLD OUT</span></div>` : '';
    const featuredBanner = item.isFeatured ? `<div class="bg-red_sale text-cream text-center text-xs font-bold py-1 uppercase tracking-wider">⭐ FEATURED PRODUCT</div>` : '';
    
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

    const cardClasses = `relative flex flex-col bg-white rounded-xl shadow-lg transition-transform duration-300 hover:scale-[1.03] overflow-hidden border border-sage/30 ${item.isSoldOut ? 'sold-out' : 'cursor-pointer'}`;
    
    return `
        <div class="${cardClasses}" onclick="showItemDetailModal('${item.id}')">
            ${soldOutBadge}
            ${featuredBanner}
            ${topRightBadges}
            
            <div class="p-4 pt-3 flex flex-col justify-start flex-grow">
                ${(currentCategory === 'All Products' || currentCategory === 'Specials') && !item.isFeatured ? `<span class="text-xs font-bold text-sage block mb-1">${item.category.toUpperCase()}</span>` : ''}
                ${(currentCategory === 'All Products' || currentCategory === 'Specials') && item.isFeatured ? `<span class="text-xs font-bold text-sage block mt-6 mb-1">${item.category.toUpperCase()}</span>` : ''}
                ${(currentCategory === 'All Products' || currentCategory === 'Specials') && (item.isLowStock || item.isOnSale) && !item.isFeatured ? `<span class="text-xs font-bold text-sage block mt-6 mb-1">${item.category.toUpperCase()}</span>` : ''}

                <h2 class="text-xl font-bold text-forest mb-1 truncate" title="${item.name}">${item.name}</h2>
                <p class="text-sage text-xs mb-2"><span class="font-semibold">${item.brand || item.grower || ''}</span> ${item.type ? `| ${item.type}` : ''}</p>
                <p class="text-forest/80 text-sm line-clamp-2">${item.description || 'No description available.'}</p>
            </div>

            <div class="p-4 pt-3 border-t border-sage/20 mt-auto flex justify-between items-center bg-cream/70">
                <div class="text-forest">${priceHtml}</div>
            </div>
        </div>`;
}

// === Authentication & Initialization ===

async function authenticate() { 
    try {
        await window.signInAnonymously(window.auth);
        console.log("Anonymous sign-in request sent.");
    } catch (error) {
        console.error("Firebase Auth error:", error);
        showMessage("Could not authenticate with database.", true);
    }
}

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

// Export functions to window for HTML onclick handlers
window.hideItemDetailModal = hideItemDetailModal;
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
window.showItemDetailModal = showItemDetailModal;
window.initMenu = initMenu;
window.authenticate = authenticate;

