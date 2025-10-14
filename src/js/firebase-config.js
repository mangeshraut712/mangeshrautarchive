/**
 * ═══════════════════════════════════════════════════════════
 * FIREBASE CONFIGURATION - MODULAR SDK (v10)
 * Portfolio Contact Form Backend
 * ═══════════════════════════════════════════════════════════
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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

console.log('🔥 Initializing Firebase...');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('✅ Firebase app initialized');
console.log('✅ Firestore database connected');
console.log('📡 Connection status:', {
  app: !!app,
  db: !!db,
  projectId: firebaseConfig.projectId
});

// Export Firebase services
export { db, collection, addDoc, serverTimestamp };
export default { db, collection, addDoc, serverTimestamp };
