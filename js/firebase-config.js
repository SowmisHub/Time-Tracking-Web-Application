// firebase-config.js
// Firebase compat (v10 compat scripts expected in HTML)
// Replace with your real config if different

const firebaseConfig = {
    apiKey: "AIzaSyBFlx7tNISTTOatX6_QWTbu4p4ztjn-cEs",
    authDomain: "time-tracking-web-application.firebaseapp.com",
    projectId: "time-tracking-web-application",
    storageBucket: "time-tracking-web-application.appspot.com",
    messagingSenderId: "516236781054",
    appId: "1:516236781054:web:873c9a4577e6b4deac0caf"
};

// initialize (compat)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// compat service handles used across app
const auth = firebase.auth();
const db = firebase.firestore();

// enable persistence if available
db.enablePersistence().catch((err) => {
    if (err && err.code === 'failed-precondition') {
        console.warn('Persistence failed: multiple tabs open');
    } else if (err && err.code === 'unimplemented') {
        console.warn('Persistence not available in this browser');
    }
});

console.log('Firebase initialized (compat)');
