# Quick Start Guide - Union Menu

## For Customers
1. Open `index.html` in your browser (or visit the deployed URL)
2. Browse products by clicking category tabs at the top
3. Use search bar to find specific products
4. Click any product card to see detailed information
5. Use filters to narrow down products (type, format, volume, etc.)
6. Sort products using the dropdown and direction buttons

## For Admin/Staff
1. Open `admin.html` in your browser
2. Login with your admin credentials
3. Click "Add New Item" to add products
4. Click "Edit" on any product card to modify it
5. Click "Delete" on any product card to remove it (confirmation required)
6. Use status checkboxes (Featured, On Sale, Low Stock, Sold Out) to manage inventory visibility

## Running Locally
```bash
# Using Python 3
python3 -m http.server 8000

# Then open:
# http://localhost:8000/index.html (customer menu)
# http://localhost:8000/admin.html (admin panel)
```

## Key Files
- `index.html` - Customer-facing menu
- `admin.html` - Admin panel
- `app-public.js` - Customer menu logic
- `app-admin.js` - Admin panel logic
- `shared.js` - Configuration and utilities
- `shared.css` - Styles

## Firebase Setup Required
- Firestore database enabled
- Authentication enabled (Email/Password for admin, Anonymous for public)
- Firebase config in HTML files (already configured for union-live-menu)

## Common Tasks

### Adding a New Product
1. Login to admin panel
2. Navigate to desired category
3. Click "Add New Item"
4. Fill in required fields (marked with *)
5. Set status flags if needed
6. Click "Save Changes"

### Marking Product as Sold Out
1. Find product in admin panel
2. Click "Edit"
3. Check "Sold Out" checkbox
4. Click "Save Changes"

### Making a Product Featured
1. Edit the product in admin panel
2. Check "Featured ⭐" checkbox
3. Save changes (product will appear with red banner and in Specials category)



