# Adding Admin Users to Union Menu

## Method 1: Using Firebase Console (Easiest)

### Steps:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `union-live-menu`

2. **Navigate to Authentication**
   - In the left sidebar, click on **"Authentication"**
   - Click on the **"Users"** tab (you should see this at the top)

3. **Add a New User**
   - Click the **"Add user"** button
   - Enter the user's email address
   - Enter a temporary password (at least 6 characters)
   - Click **"Add user"**

4. **Share Login Credentials**
   - The user will use the email and password you created to log in at `login.html`
   - **Important**: After first login, users should change their password (if you implement password reset functionality)

5. **Optional: Email Verification**
   - Firebase will automatically send a verification email to the new user
   - You can enable/disable email verification in Authentication > Settings > Templates

---

## Method 2: Using Firebase Admin SDK (For Bulk Users)

If you need to add many users at once, you can use the Firebase Admin SDK with a Node.js script.

### Setup (One-time):

```bash
npm install firebase-admin
```

### Create a script (`add-admin-users.js`):

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function addAdminUser(email, password) {
  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: true // Set to false if you want users to verify
    });
    console.log('Successfully created new user:', userRecord.uid);
    return userRecord;
  } catch (error) {
    console.error('Error creating new user:', error);
    throw error;
  }
}

// Add users
addAdminUser('admin1@uniondispensary.com', 'SecurePassword123!');
addAdminUser('admin2@uniondispensary.com', 'SecurePassword456!');
```

**Note**: To use this method, you need to:
1. Generate a service account key in Firebase Console > Project Settings > Service Accounts
2. Download the JSON key file
3. Keep it secure (add to .gitignore)

---

## Method 3: Self-Registration (Not Recommended for Admin)

For regular customer accounts, you could add a registration page. For admin accounts, it's safer to manually create them via Method 1.

---

## Security Best Practices

1. **Strong Passwords**: Ensure all admin users have strong, unique passwords
2. **Email Verification**: Enable email verification for added security
3. **Two-Factor Authentication**: Consider enabling 2FA in Firebase Authentication settings
4. **Regular Audits**: Periodically review active admin users in Firebase Console
5. **Remove Inactive Users**: Delete users who no longer need access

---

## Current Login Flow

Users you create will:
1. Go to `login.html`
2. Enter their email and password
3. Get redirected to `admin.html` if credentials are correct
4. Stay logged in (session persists) until they click "Sign Out"

---

## Troubleshooting

**User can't log in?**
- Check Firebase Console > Authentication > Users to verify the user exists
- Verify email is spelled correctly
- Check if email verification is required and hasn't been completed
- Verify password meets Firebase requirements (6+ characters)

**Need to reset a password?**
- In Firebase Console > Authentication > Users, click on the user
- Click "Reset password" - Firebase will send them an email
- Or manually change it in the user's details

**Want to remove a user?**
- Go to Firebase Console > Authentication > Users
- Find the user and click the three dots menu
- Click "Delete user"

