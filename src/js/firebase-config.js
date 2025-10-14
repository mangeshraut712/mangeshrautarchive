/**
 * ═══════════════════════════════════════════════════════════
 * FIREBASE CONFIGURATION
 * Portfolio Contact Form Backend
 * ═══════════════════════════════════════════════════════════
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJS4ncepUtvNqtpa5mN3L1RTuURuYWTOo",
  authDomain: "mangeshrautarchive.firebaseapp.com",
  projectId: "mangeshrautarchive",
  storageBucket: "mangeshrautarchive.firebasestorage.app",
  messagingSenderId: "560373560182",
  appId: "1:560373560182:web:218658d0db3b1aa6c60057",
  measurementId: "G-YX2XQWYSCQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Analytics (optional)
let analytics = null;
try {
  analytics = getAnalytics(app);
  console.log('✅ Firebase Analytics initialized');
} catch (error) {
  console.log('ℹ️ Analytics not available (normal in some environments)');
}

console.log('✅ Firebase initialized successfully');

// Export Firebase services
export { db, collection, addDoc, serverTimestamp, analytics };
export default { db, collection, addDoc, serverTimestamp, analytics };
