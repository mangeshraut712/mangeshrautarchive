/**
 * ═══════════════════════════════════════════════════════════
 * FIREBASE CONFIGURATION - Using Your Console SDK
 * Portfolio Contact Form Backend
 * ═══════════════════════════════════════════════════════════
 */

// Using CDN with your exact Firebase config from console
const firebaseScript = document.createElement('script');
firebaseScript.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
firebaseScript.type = 'module';

// Your web app's Firebase configuration (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyDJS4ncepUtvNqtpa5mN3L1RTuURuYWTOo",
  authDomain: "mangeshrautarchive.firebaseapp.com",
  projectId: "mangeshrautarchive",
  storageBucket: "mangeshrautarchive.firebasestorage.app",
  messagingSenderId: "560373560182",
  appId: "1:560373560182:web:218658d0db3b1aa6c60057",
  measurementId: "G-YX2XQWYSCQ"
};

// Initialize Firebase using script tag approach
window.initFirebaseForContact = async function() {
  console.log('🔥 Initializing Firebase from console SDK...');
  
  try {
    // Dynamically import Firebase
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getFirestore, collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase initialized successfully');
    console.log('📡 Project:', firebaseConfig.projectId);
    
    return { db, collection, addDoc, serverTimestamp };
  } catch (error) {
    console.error('❌ Firebase init error:', error);
    throw error;
  }
};

console.log('✅ Firebase config loaded');
