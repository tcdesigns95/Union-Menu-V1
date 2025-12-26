# Union Dispensary Interactive Menu

A modern, interactive menu system for Union Dispensary built with vanilla JavaScript, Firebase, and Tailwind CSS. This application provides both a customer-facing menu interface and an admin panel for managing inventory.

## Features

### Customer Features
- **Interactive Product Browsing**: Browse products by category with intuitive navigation
- **Advanced Filtering**: Filter products by type, format, volume, weight, and more (category-specific)
- **Search Functionality**: Search across all product fields
- **Product Details**: Click any product to view detailed information
- **Special Deals**: Dedicated section for featured products and specials
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### Admin Features
- **Product Management**: Add, edit, and delete products from any category
- **Status Management**: Mark items as featured, on sale, low stock, or sold out
- **Staff Notes**: Internal notes that are not visible to customers
- **Real-time Updates**: Changes sync instantly across all users
- **Category Organization**: Products organized into logical categories

## Project Structure

```
union-menu-main/
├── index.html          # Public customer-facing menu
├── admin.html          # Admin panel for managing inventory
├── app-public.js       # Public menu application logic
├── app-admin.js        # Admin panel application logic
├── shared.js           # Shared configuration and utilities
└── shared.css          # Shared styles and responsive design
```

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Firebase project configured (see Firebase Setup below)
- Local web server (for development)

### Local Development Setup

1. **Clone or download this repository**

2. **Start a local web server** (required - file:// protocol won't work due to ES6 modules)

   Using Python 3:
   ```bash
   python3 -m http.server 8000
   ```

   Using Node.js (with http-server):
   ```bash
   npx http-server -p 8000
   ```

   Using PHP:
   ```bash
   php -S localhost:8000
   ```

3. **Open in your browser**
   - Public menu: `http://localhost:8000/index.html`
   - Admin panel: `http://localhost:8000/admin.html`

### Firebase Setup

The application requires Firebase for data storage and authentication. The Firebase configuration is already set up in both HTML files. To customize:

1. **Create a Firebase project** at https://console.firebase.google.com/
2. **Enable Firestore Database** (NoSQL database)
3. **Enable Authentication** (Email/Password for admin, Anonymous for public)
4. **Update Firebase config** in `index.html` and `admin.html`:

```javascript
firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

### Firestore Database Structure

Products are stored in Firestore collections following this pattern:
```
artifacts/{appId}/public/data/{Category}
```

Example collections:
- `artifacts/union-live-menu/public/data/Flower`
- `artifacts/union-live-menu/public/data/Edibles`
- `artifacts/union-live-menu/public/data/Cartridges`
- etc.

Each product document contains fields defined in `shared.js` under `categoryFields`.

## Usage Guide

### For Customers

1. **Navigate Categories**: Click on category tabs at the top to browse products
2. **Search Products**: Use the search bar to find specific products
3. **Filter Products**: Use category-specific filters (Type, Format, Volume, etc.)
4. **View Details**: Click on any product card to see full details
5. **Sort Products**: Use the sort dropdown and direction buttons

### For Admin/Staff

1. **Login**: Navigate to `admin.html` and login with your credentials
2. **Add Products**: Click "Add New Item" button and select a category
3. **Edit Products**: Click "Edit" on any product card
4. **Delete Products**: Click "Delete" on any product card (confirmation required)
5. **Set Status**: Use checkboxes in edit modal to mark items as featured, on sale, low stock, or sold out
6. **Add Notes**: Use the "Staff Notes" field for internal information not visible to customers

### Product Categories

- **Flower**: Cannabis flower with pricing for 1g, 3.5g, and 7g
- **Concentrates**: Live resin, rosin, and other concentrates
- **Cartridges**: Vape cartridges (510 screw-on and all-in-one)
- **Edibles**: Gummies, chocolates, drinks, and other edibles
- **Topicals**: Lotions, balms, salts, and oils
- **Tinctures**: Sublingual tinctures with various cannabinoid ratios
- **Pre-Rolls**: Pre-rolled joints with various weights and packaging
- **Specials**: Special deals and promotions

## Code Organization

### File Responsibilities

- **index.html / admin.html**: HTML structure, Firebase initialization, and app setup
- **app-public.js**: Public menu logic (filtering, sorting, display, product details)
- **app-admin.js**: Admin panel logic (CRUD operations, authentication, UI management)
- **shared.js**: Configuration (category fields, icons, navigation), utility functions
- **shared.css**: Global styles, responsive design, button effects

### Key Functions

**Public App (app-public.js)**:
- `initMenu()`: Initialize the menu and set up data listeners
- `renderMenu()`: Filter, sort, and display products
- `renderControls()`: Generate filter and sort controls based on category
- `showItemDetailModal()`: Display detailed product information

**Admin App (app-admin.js)**:
- `saveItem()`: Save new or updated product to Firestore
- `handleDeleteItem()`: Delete product with confirmation
- `openAdminModal()`: Open edit/add modal with dynamic form fields
- `toggleAdminUI()`: Show/hide admin controls based on auth state

**Shared (shared.js)**:
- `SHARED_CONFIG`: Category field definitions and icons
- `showMessage()`: Display toast notifications
- `extractPrice()`: Parse price strings for sorting
- `getCollectionPath()`: Generate Firestore collection paths

## Customization

### Adding New Categories

1. Add category to `categoryFields` in `shared.js`
2. Define fields for the category (name, price, description, etc.)
3. Add icon to `categoryIcons` object
4. Add to `navCategories` array if you want it in navigation

### Modifying Product Fields

Edit the `categoryFields` object in `shared.js`. Each field supports:
- `id`: Unique identifier
- `label`: Display label
- `type`: 'text', 'textarea', or 'select'
- `required`: Boolean for required fields
- `options`: Array for select dropdowns
- `sortable`: Boolean to enable sorting
- `priceField`: Boolean to auto-format as currency

### Styling

The app uses Tailwind CSS with custom colors defined in the HTML files:
- `cream`: #F8F2E2 (background)
- `sage`: #808A6F (accent)
- `forest`: #22352F (text/dark)
- `red_sale`: #EF4444 (featured/sold out)
- `orange_low`: #F59E0B (low stock)
- `sale_blue`: #3B82F6 (on sale)

Custom styles in `shared.css` handle responsive design and animations.

## Troubleshooting

### Products Not Loading
- Check Firebase configuration
- Verify Firestore database is enabled
- Check browser console for errors
- Ensure Firestore security rules allow read access

### Admin Login Not Working
- Verify email/password authentication is enabled in Firebase
- Check that user account exists in Firebase Authentication
- Review browser console for authentication errors

### Changes Not Saving
- Verify user is logged in (check for logout button)
- Check Firestore security rules allow write access
- Review browser console for permission errors

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Deployment

This application can be deployed to:
- GitHub Pages
- Firebase Hosting
- Any static hosting service (Netlify, Vercel, etc.)

For production deployment, ensure:
1. Firebase configuration is correct
2. Firestore security rules are properly configured
3. Authentication is properly set up
4. HTTPS is enabled (required for Firebase)

## Security Considerations

- Admin credentials should be secure and not hardcoded
- Firestore security rules should restrict write access to authenticated admin users
- Consider implementing rate limiting for production
- Regular security audits recommended

## Support

For issues or questions, please check:
1. Browser console for error messages
2. Firebase console for database/auth issues
3. Network tab for API errors

## License

This project is proprietary software for Union Dispensary.
