// =======================================================================
// FIREBASE AUTHENTICATION MODULE
// Handles Firebase initialization and authentication functions
// =======================================================================

// Global Firebase References
window.db = null;
window.auth = null;
window.userId = null;

/**
 * Initialize Firebase with configuration
 * Supports both canvas environment and fallback config
 */
async function initializeFirebase() {
    // Firebase Configuration
    let firebaseConfig = {};
    
    // Try to load config from canvas environment first
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
        try {
            firebaseConfig = JSON.parse(__firebase_config);
            console.log("Loaded Firebase config from canvas environment.");
        } catch (e) {
            console.error("Failed to parse canvas Firebase config.", e);
        }
    }
    
    // Fallback to hardcoded config (with placeholders)
    // NOTE: Replace these placeholders with your actual Firebase configuration
    // You can find these values in your Firebase Console > Project Settings > General > Your apps
    if (!firebaseConfig.apiKey) {
        console.log("Using fallback Firebase config.");
        firebaseConfig = {
            apiKey: "AIzaSyCpGjsm0Uawcfqjk_jwS1POpBXlXWGLcGE",
            authDomain: "union-live-menu.firebaseapp.com",
            projectId: "union-live-menu",
            storageBucket: "union-live-menu.firebasestorage.app",
            messagingSenderId: "724633408861",
            appId: "1:724633408861:web:82e65fae1db6e95a3404b4",
            measurementId: "G-E6C1E25NLW"
        };
    }
    
    // Check if config is valid
    if (!firebaseConfig.apiKey) {
        console.warn("Firebase config is missing. Please update firebase-auth.js with your actual Firebase credentials.");
        return false;
    }
    
    try {
        // Import Firebase modules dynamically
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js");
        const { getAuth, setPersistence, browserLocalPersistence } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js");
        const { getFirestore } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
        
        // Initialize Firebase App
        const app = initializeApp(firebaseConfig);
        
        // Initialize Auth with persistence (default is LOCAL, which persists across sessions)
        window.auth = getAuth(app);
        
        // Explicitly set persistence to LOCAL (browser will remember login)
        // This ensures login persists across browser refreshes
        try {
            await setPersistence(window.auth, browserLocalPersistence);
            console.log("Firebase Auth persistence set to LOCAL (login will persist).");
        } catch (persistenceError) {
            console.warn("Could not set auth persistence:", persistenceError);
            // Continue anyway - Firebase defaults to LOCAL persistence
        }
        
        // Initialize Firestore
        window.db = getFirestore(app);
        
        // Expose Firebase functions globally for use in other scripts
        window.initializeApp = initializeApp;
        window.getAuth = getAuth;
        window.getFirestore = getFirestore;
        
        // Expose auth functions
        const { 
            signInWithEmailAndPassword, 
            signOut, 
            onAuthStateChanged,
            signInAnonymously,
            signInWithCustomToken,
            sendPasswordResetEmail,
            updatePassword
        } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js");
        
        window.signInWithEmailAndPassword = signInWithEmailAndPassword;
        window.signOut = signOut;
        window.onAuthStateChanged = onAuthStateChanged;
        window.signInAnonymously = signInAnonymously;
        window.signInWithCustomToken = signInWithCustomToken;
        window.sendPasswordResetEmail = sendPasswordResetEmail;
        window.updatePassword = updatePassword;
        
        // Expose Firestore functions
        const { 
            collection, 
            onSnapshot, 
            doc, 
            getDoc,
            setDoc, 
            deleteDoc, 
            query, 
            writeBatch,
            getDocs
        } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
        
        window.collection = collection;
        window.onSnapshot = onSnapshot;
        window.doc = doc;
        window.getDoc = getDoc;
        window.setDoc = setDoc;
        window.deleteDoc = deleteDoc;
        window.query = query;
        window.writeBatch = writeBatch;
        window.getDocs = getDocs;
        
        console.log("Firebase initialized successfully.");
        return true;
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        return false;
    }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.initializeFirebase = initializeFirebase;
}

