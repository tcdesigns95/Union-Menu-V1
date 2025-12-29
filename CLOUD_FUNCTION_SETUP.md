# Cloud Function Setup for Staff User Creation

## Overview

To securely create staff users without logging out the current admin, you need to deploy a Firebase Cloud Function. This function uses the Firebase Admin SDK which has elevated permissions to create users.

## Prerequisites

1. Node.js installed (v14 or higher)
2. Firebase CLI installed
3. Firebase project with Blaze plan (required for Cloud Functions)

## Setup Steps

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Functions in Your Project

Navigate to your project directory and run:

```bash
firebase init functions
```

When prompted:
- Select your Firebase project: `union-live-menu`
- Choose JavaScript (or TypeScript if you prefer)
- Install dependencies: Yes

### 4. Install Required Dependencies

```bash
cd functions
npm install firebase-admin firebase-functions
```

### 5. Add the Function

Copy the code from `cloud-functions/createStaffUser.js` to `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.createStaffUser = functions.https.onCall(async (data, context) => {
    // ... (copy the full function code from createStaffUser.js)
});
```

### 6. Deploy the Function

```bash
firebase deploy --only functions:createStaffUser
```

### 7. Update Your App Code

The function is now available as a callable function. Update `app-admin.js` to use it:

```javascript
// In handleAddStaff function, replace the fetch call with:
const createStaffUser = window.functions.httpsCallable('createStaffUser');
const result = await createStaffUser({
    email: email,
    password: password,
    role: role,
    name: name
});
```

## Alternative: HTTP Function (Current Implementation)

The current code uses an HTTP function approach. To use that instead:

1. Deploy the HTTP version from `createStaffUser.js` (uncomment the HTTP function)
2. The URL will be: `https://us-central1-union-live-menu.cloudfunctions.net/createStaffUserHTTP`
3. The current `handleAddStaff` function already uses this approach

## Testing

1. Log in as an admin
2. Go to "Manage Staff" section
3. Fill out the form and submit
4. Check Firebase Console > Authentication to verify the user was created
5. Check Firestore > `artifacts/union-live-menu/public/users` to verify user data

## Security Notes

- The function verifies the caller is authenticated
- The function checks the caller has admin role
- Passwords are handled server-side only
- User data is stored in Firestore with proper structure

## Troubleshooting

**Function not found (404):**
- Make sure you've deployed the function
- Check the function name matches exactly
- Verify you're using the correct project ID

**Permission denied:**
- Ensure the current user has admin role in Firestore
- Check the user document exists in `artifacts/union-live-menu/public/users`

**Email already exists:**
- The function will return an error if the email is already registered
- Delete the user from Firebase Console > Authentication if needed

