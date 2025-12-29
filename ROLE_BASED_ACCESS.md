# Role-Based Access Control

## Overview

The Union Menu system now supports two user roles with different permission levels:

### Admin Role
**Full Access:**
- ✅ Add new products
- ✅ Edit products (all fields including prices)
- ✅ Delete products
- ✅ Duplicate products
- ✅ Mark items as sold out
- ✅ Set featured, on sale, low stock status
- ✅ Manage staff (create/delete users)
- ✅ Auto-delete items sold out 60+ days

### Budtender Role
**Quick Edit Access:**
- ✅ View all products
- ✅ Quick Edit - Update prices
- ✅ Quick Edit - Change status (Featured, On Sale, Low Stock, Sold Out)
- ❌ Cannot add products
- ❌ Cannot use Full Edit (all fields including descriptions)
- ❌ Cannot delete products
- ❌ Cannot duplicate products
- ❌ Cannot manage staff

## How It Works

### User Role Storage
- User roles are stored in Firestore: `artifacts/union-live-menu/public/users/{userId}`
- Each user document contains:
  ```javascript
  {
    email: "user@example.com",
    role: "admin" | "budtender",
    name: "User Name",
    createdBy: "adminUserId",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
  ```

### Role Loading
- When a user logs in, their role is automatically loaded from Firestore
- If a user doesn't exist in the users collection, they're created with default role "budtender"
- The first user (owner) should manually change their role to "admin" in Firebase Console if needed
- Role is checked before every action that requires permissions

### UI Restrictions
- Buttons are hidden/shown based on role
- Forms are restricted based on role
- Error messages inform users when they don't have permission

## Creating Staff Users

### Method 1: Using Manage Staff Section (Recommended)
1. Log in as an admin
2. Click "Show" in the "Manage Staff" section
3. Fill out the form:
   - Email address
   - Password (minimum 6 characters)
   - Role (Admin or Budtender)
   - Full Name (optional)
4. Click "Create Staff Account"

**Note:** This requires the Cloud Function to be deployed. See `CLOUD_FUNCTION_SETUP.md` for setup instructions.

### Method 2: Manual Creation (Fallback)
If Cloud Function is not deployed:
1. Go to Firebase Console > Authentication > Users
2. Click "Add user"
3. Enter email and password
4. User will be created in Firestore with default role "admin" on first login
5. Admin can then change their role in Firestore if needed

## Changing User Roles

### Via Firestore Console
1. Go to Firebase Console > Firestore Database
2. Navigate to: `artifacts/union-live-menu/public/users/{userId}`
3. Edit the `role` field: `"admin"` or `"budtender"`
4. Save changes

### Via Code (Future Enhancement)
A role management UI could be added to allow admins to change roles directly from the admin panel.

## Security Best Practices

1. **Individual Logins**: Never share one "admin" login. Each staff member should have their own account.

2. **Password Policy**: 
   - Minimum 6 characters (Firebase requirement)
   - Recommend strong passwords for compliance
   - Consider implementing password reset functionality

3. **Role Assignment**:
   - Only assign "admin" role to trusted managers
   - Most staff should be "budtender" role
   - Review roles periodically

4. **Firebase Console Access**:
   - Do NOT add employees as "Project Members" in Firebase Console
   - Only add them as "Users" in Authentication tab
   - This prevents accidental database deletion

5. **Audit Trail**:
   - All user actions are logged with timestamps
   - `createdBy` field tracks who created each user
   - `updatedAt` tracks when items were last modified

## Troubleshooting

**User can't see admin features:**
- Check their role in Firestore: `artifacts/union-live-menu/public/users/{userId}`
- Verify role is set to "admin" (not "budtender")
- Refresh the page after changing role

**Budtender can't mark items as sold out:**
- Verify they're logged in (check Firebase Auth)
- Check their role in Firestore
- Ensure they're clicking the "Quick Edit" button (⚡)

**Can't create staff users:**
- Check if Cloud Function is deployed (see `CLOUD_FUNCTION_SETUP.md`)
- Verify current user has "admin" role
- Check browser console for errors
- Fallback: Create user manually in Firebase Console

## Future Enhancements

- [ ] Password reset functionality
- [ ] Role change UI in admin panel
- [ ] Activity log showing who made what changes
- [ ] Two-factor authentication
- [ ] Session timeout for security
- [ ] Bulk user import from CSV

