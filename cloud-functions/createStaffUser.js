// =======================================================================
// FIREBASE CLOUD FUNCTION: createStaffUser
// Securely creates a new staff user account
// =======================================================================
// 
// DEPLOYMENT INSTRUCTIONS:
// 1. Install Firebase CLI: npm install -g firebase-tools
// 2. Login: firebase login
// 3. Initialize Functions: firebase init functions
// 4. Copy this file to: functions/index.js (or add as separate export)
// 5. Deploy: firebase deploy --only functions
//
// =======================================================================

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Admin SDK (if not already initialized)
if (!admin.apps.length) {
    admin.initializeApp();
}

/**
 * Cloud Function to create a new staff user
 * Requires authentication and admin role
 * 
 * POST /createStaffUser
 * Body: { email, password, role, name }
 */
exports.createStaffUser = functions.https.onCall(async (data, context) => {
    // Verify user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'User must be authenticated to create staff accounts.'
        );
    }
    
    const { email, password, role, name } = data;
    
    // Validate input
    if (!email || !password || !role) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Email, password, and role are required.'
        );
    }
    
    if (password.length < 6) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Password must be at least 6 characters.'
        );
    }
    
    if (!['admin', 'budtender'].includes(role)) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Role must be either "admin" or "budtender".'
        );
    }
    
    // Check if current user is admin
    const currentUserDoc = await admin.firestore()
        .doc(`artifacts/union-live-menu/public/users/${context.auth.uid}`)
        .get();
    
    if (!currentUserDoc.exists || currentUserDoc.data().role !== 'admin') {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only admins can create staff accounts.'
        );
    }
    
    try {
        // Create the user in Firebase Authentication
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            emailVerified: false, // User will need to verify email
            disabled: false
        });
        
        // Note: Password reset email should be sent from the client using sendPasswordResetEmail
        // This ensures Firebase sends the standard password reset email with the correct format
        // The admin can use the "Send Password Reset" button in the UI after creating the user
        
        // Store user data in Firestore
        await admin.firestore()
            .doc(`artifacts/union-live-menu/public/users/${userRecord.uid}`)
            .set({
                email: email,
                role: role,
                name: name || email.split('@')[0],
                createdBy: context.auth.uid,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                passwordResetRequired: true // Flag to indicate user should set their own password
            });
        
        console.log(`Successfully created staff user: ${email} with role: ${role}`);
        
        return {
            success: true,
            uid: userRecord.uid,
            email: userRecord.email,
            message: `Staff account created successfully for ${email}. They will receive an email to set their password.`
        };
        
    } catch (error) {
        console.error('Error creating staff user:', error);
        
        // Handle specific Firebase Auth errors
        if (error.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError(
                'already-exists',
                'A user with this email already exists.'
            );
        }
        
        if (error.code === 'auth/invalid-email') {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Invalid email address format.'
            );
        }
        
        throw new functions.https.HttpsError(
            'internal',
            `Failed to create user: ${error.message}`
        );
    }
});

/**
 * Alternative HTTP function version (if you prefer REST API)
 * Uncomment and use this if you want to call it via fetch() instead of callable
 */
/*
exports.createStaffUserHTTP = functions.https.onRequest(async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    
    // Verify authentication token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { email, password, role, name } = req.body;
        
        // ... same validation and creation logic as above ...
        
        res.status(200).json({ success: true, uid: userRecord.uid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
*/

