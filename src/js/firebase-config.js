/**
 * ═══════════════════════════════════════════════════════════
 * FIREBASE CONFIGURATION - COMPAT MODE
 * Portfolio Contact Form Backend
 * Using compat for better transport stability
 * ═══════════════════════════════════════════════════════════
 */

import firebase from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
import 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js';

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

console.log('🔥 Initializing Firebase (Compat Mode for stability)...');

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Enable persistence for offline support
db.enablePersistence({ synchronizeTabs: true })
  .then(() => {
    console.log('✅ Firebase persistence enabled');
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('⚠️ Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.log('⚠️ Persistence not supported');
    }
  });

console.log('✅ Firebase app initialized');
console.log('✅ Firestore database connected');
console.log('📡 Connection status:', {
  app: !!app,
  db: !!db,
  projectId: firebaseConfig.projectId
});

// Export for compat mode
export { db };
export default { 
  db,
  // Compat mode helpers
  collection: (collectionName) => db.collection(collectionName),
  serverTimestamp: () => firebase.firestore.FieldValue.serverTimestamp(),
  addDoc: async (collectionRef, data) => {
    return await collectionRef.add(data);
  }
};
