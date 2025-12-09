// ============================================
// Firebase Configuration
// ============================================

// IMPORTANT: Replace with your Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyBFlx7tNISTTOatX6_QWTbu4p4ztjn-cEs",
    authDomain: "time-tracking-web-application.firebaseapp.com",
    projectId: "time-tracking-web-application",
    storageBucket: "time-tracking-web-application.appspot.com",
    messagingSenderId: "516236781054",
    appId: "1:516236781054:web:873c9a4577e6b4deac0caf"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence().catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
        console.warn('Persistence not available');
    }
});

console.log('Firebase initialized successfully');
