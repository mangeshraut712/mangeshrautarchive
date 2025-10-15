// Simple contact form - Direct Firebase connection
// No Vercel backend needed!

export function initContactForm(formId = 'contact-form', documentRef = document) {
    const form = documentRef.getElementById(formId);
    if (!form) {
        console.warn('Contact form not found with ID:', formId);
        return;
    }

    // Prevent duplicate initialization
    if (form.dataset.contactInitialized) {
        console.log('⚠️ Contact form already initialized, skipping');
        return;
    }
    form.dataset.contactInitialized = 'true';

    let isSubmitting = false;
    const submitButton = form.querySelector('button[type="submit"], .btn');
    const inputs = form.querySelectorAll('input, textarea');
    
    console.log('📬 Contact form initialized (Direct Firebase)');

    // Show message
    function showMessage(message, type = 'success') {
        const existing = form.querySelector('.contact-message');
        if (existing) existing.remove();

        const div = document.createElement('div');
        div.className = `contact-message alert alert-${type}`;
        div.style.cssText = type === 'success' ?
            `background: #dcfce7; color: #166534; padding: 12px; border-radius: 6px; margin-bottom: 16px; border: 1px solid #bbf7d0;` :
            `background: #fee2e2; color: #dc2626; padding: 12px; border-radius: 6px; margin-bottom: 16px; border: 1px solid #fca5a5;`;

        div.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle mr-2"></i>${message}`;
        form.insertBefore(div, form.firstChild);

        setTimeout(() => {
            if (div.parentNode) div.remove();
        }, 5000);
    }

    // Handle submit
    async function handleSubmit(event) {
        event.preventDefault();

        if (isSubmitting) {
            console.log('⚠️ Already submitting...');
            return;
        }

        // Get form data
        const formData = new FormData(form);
        const payload = {
            name: formData.get('name')?.trim() || '',
            email: formData.get('email')?.trim() || '',
            subject: formData.get('subject')?.trim() || '',
            message: formData.get('message')?.trim() || ''
        };

        console.log('📝 Form data:', payload);

        // Validate
        const missingFields = [];
        if (!payload.name) missingFields.push('name');
        if (!payload.email) missingFields.push('email');
        if (!payload.subject) missingFields.push('subject');
        if (!payload.message) missingFields.push('message');
        
        if (missingFields.length > 0) {
            showMessage(`❌ Please fill in: ${missingFields.join(', ')}`, 'error');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(payload.email)) {
            showMessage('❌ Please enter a valid email address', 'error');
            return;
        }

        // Set loading
        isSubmitting = true;
        const originalText = submitButton?.textContent || 'Send Message';
        
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner"></span> Sending...';
        }
        inputs.forEach(input => input.disabled = true);

        try {
            console.log('🔥 Initializing Firebase...');
            
            // Import Firebase SDK modules
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { getFirestore, collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Firebase configuration (your exact config)
            const firebaseConfig = {
                apiKey: "AIzaSyDJS4ncepUtvNqtpa5mN3L1RTuURuYWTOo",
                authDomain: "mangeshrautarchive.firebaseapp.com",
                projectId: "mangeshrautarchive",
                storageBucket: "mangeshrautarchive.firebasestorage.app",
                messagingSenderId: "560373560182",
                appId: "1:560373560182:web:218658d0db3b1aa6c60057",
                measurementId: "G-YX2XQWYSCQ"
            };
            
            console.log('🔥 Connecting to Firebase project:', firebaseConfig.projectId);
            
            // Initialize Firebase
            const app = initializeApp(firebaseConfig, 'contact-form-' + Date.now());
            const db = getFirestore(app); // Connects to (default) database
            
            console.log('✅ Firebase connected successfully');
            console.log('📬 Saving to Firestore collection: messages');

            // Prepare message data
            const messageData = {
                name: payload.name,
                email: payload.email,
                subject: payload.subject,
                message: payload.message,
                timestamp: serverTimestamp(),
                userAgent: navigator.userAgent,
                submittedFrom: window.location.href
            };

            console.log('💾 Message data prepared:', {
                name: messageData.name,
                email: messageData.email,
                subject: messageData.subject
            });

            // Save to Firestore (default database, messages collection)
            const messagesRef = collection(db, 'messages');
            const docRef = await addDoc(messagesRef, messageData);

            console.log('✅ Message saved successfully!');
            console.log('📝 Document ID:', docRef.id);
            console.log('🎉 Check Firebase Console: https://console.firebase.google.com/project/mangeshrautarchive/firestore/data/~2Fmessages~2F' + docRef.id);

            showMessage('✅ Thank you! Your message has been sent successfully. I\'ll get back to you soon!');
            form.reset();

        } catch (error) {
            console.error('❌ Firebase error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            
            let errorMessage = '❌ Failed to send message. ';
            
            if (error.code === 'permission-denied') {
                errorMessage += 'Permission denied. Please make sure Firestore security rules allow create operations.';
                console.error('💡 Tip: Check security rules at https://console.firebase.google.com/project/mangeshrautarchive/firestore/rules');
            } else if (error.message?.includes('Failed to fetch')) {
                errorMessage += 'Network error. Please check your internet connection.';
            } else if (error.message?.includes('transport')) {
                errorMessage += 'Connection error. Please try again.';
            } else {
                errorMessage += error.message || 'Unknown error occurred.';
            }
            
            errorMessage += ' Please email: mbr63@drexel.edu';
            
            showMessage(errorMessage, 'error');
        } finally {
            isSubmitting = false;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            }
            inputs.forEach(input => input.disabled = false);
        }
    }

    // Attach listener
    form.addEventListener('submit', handleSubmit);

    // Add spinner CSS
    if (!document.querySelector('#contact-form-styles')) {
        const style = document.createElement('style');
        style.id = 'contact-form-styles';
        style.textContent = `
            .spinner {
                display: inline-block;
                width: 12px;
                height: 12px;
                border: 2px solid transparent;
                border-radius: 50%;
                border-top-color: currentColor;
                animation: spin 1s linear infinite;
                margin-right: 8px;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Auto-initialize ONCE
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initContactForm();
        }, { once: true });
    } else {
        initContactForm();
    }
}

export default initContactForm;
