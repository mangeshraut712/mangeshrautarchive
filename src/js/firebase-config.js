/**
 * ═══════════════════════════════════════════════════════════
 * FIREBASE CONFIGURATION
 * Portfolio Contact Form Backend
 * ═══════════════════════════════════════════════════════════
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized');
  
  db = getFirestore(app);
  console.log('✅ Firestore database connected');
  
  // Test connection
  console.log('📡 Firestore connection status:', {
    app: !!app,
    db: !!db,
    projectId: firebaseConfig.projectId
  });
  
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  throw error;
}

console.log('✅ Firebase initialized successfully');

// Export Firebase services
export { db, collection, addDoc, serverTimestamp };
export default { db, collection, addDoc, serverTimestamp };
