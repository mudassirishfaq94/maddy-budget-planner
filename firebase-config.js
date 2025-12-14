// firebase-config.js - Firebase Configuration and Initialization

// Firebase configuration with your project credentials
const firebaseConfig = {
    apiKey: "AIzaSyD7nRXaFGC8IZRJ93IheKiABa7RrHrZ5g8",
    authDomain: "budget-manager-3bdd1.firebaseapp.com",
    databaseURL: "https://budget-manager-3bdd1-default-rtdb.firebaseio.com",
    projectId: "budget-manager-3bdd1",
    storageBucket: "budget-manager-3bdd1.firebasestorage.app",
    messagingSenderId: "640159110742",
    appId: "1:640159110742:web:bffe7733c4d134fcb00df7",
    measurementId: "G-RT63RTXRW8"
};

// Initialize Firebase (using compat version)
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence()
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
            console.warn('The current browser does not support offline persistence');
        }
    });

// Export for use in other files
window.auth = auth;
window.db = db;

console.log('Firebase initialized successfully!');
