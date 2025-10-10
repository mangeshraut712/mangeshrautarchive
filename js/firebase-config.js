import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase configuration
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

export { app, db, collection, addDoc, serverTimestamp };
export default { app, db, collection, addDoc, serverTimestamp };
