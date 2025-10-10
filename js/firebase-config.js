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

// Defensive code against browser extension conflicts
(function() {
    // Prevent extension interference with communication
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        // Block invalid chrome-extension requests that cause console errors
        if (typeof url === 'string' && url.startsWith('chrome-extension://invalid/')) {
            console.warn('Blocked invalid chrome-extension request');
            return Promise.reject(new Error('Invalid chrome extension URL'));
        }
        return originalFetch.call(this, url, options);
    };

    // Prevent extension from detecting competitor extensions
    Object.defineProperty(window, 'chrome', {
        configurable: false,
        enumerable: true,
        writable: false,
        value: window.chrome || {}
    });

    if (!window.chrome.runtime) {
        window.chrome.runtime = {};
    }

    // Intercept chrome.runtime.sendMessage to handle invalid extension IDs gracefully
    const originalSendMessage = window.chrome.runtime.sendMessage;
    window.chrome.runtime.sendMessage = function(extensionId, message, callback) {
        if (extensionId === 'invalid') {
            console.warn('Blocked invalid extension ID request');
            if (callback) callback();
            return;
        }
        if (originalSendMessage) {
            return originalSendMessage.call(this, extensionId, message, callback);
        }
    };
})();

export { app, db, collection, addDoc, serverTimestamp };
export default { app, db, collection, addDoc, serverTimestamp };
