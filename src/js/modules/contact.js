// Simple contact form - no validation warnings, minimum requirements
export function initContactForm(formId = 'contact-form', documentRef = document) {
    const form = documentRef.getElementById(formId);
    if (!form) {
        console.warn('Contact form not found with ID:', formId);
        return;
    }

    let isSubmitting = false;
    const submitButton = form.querySelector('button[type="submit"], .btn');
    const inputs = form.querySelectorAll('input, textarea');

    // Simple success/error display
    function showMessage(message, type = 'success') {
        const existing = form.querySelector('.contact-message');
        if (existing) {
            existing.remove();
        }

        const div = document.createElement('div');
        div.className = `contact-message alert alert-${type}`;
        div.style.cssText = type === 'success' ?
            `background: #dcfce7; color: #166534; padding: 12px; border-radius: 6px; margin-bottom: 16px; border: 1px solid #bbf7d0;` :
            `background: #fee2e2; color: #dc2626; padding: 12px; border-radius: 6px; margin-bottom: 16px; border: 1px solid #fca5a5;`;

        div.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle mr-2"></i>${message}`;
        form.insertBefore(div, form.firstChild);

        setTimeout(() => {
            if (div.parentNode) {
                div.remove();
            }
        }, 5000);
    }

    // Direct submit to Firebase
    async function handleSubmit(event) {
        event.preventDefault();

        if (isSubmitting) return;

        // Get form data
        const formData = new FormData(form);
        const payload = {
            name: formData.get('name')?.trim() || '',
            email: formData.get('email')?.trim() || '',
            subject: formData.get('subject')?.trim() || '',
            message: formData.get('message')?.trim() || ''
        };

        // Set loading state
        isSubmitting = true;
        const originalText = submitButton?.textContent;

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner mr-2"></span>Sending...';
        }

        // Disable inputs
        inputs.forEach(input => input.disabled = true);

        try {
            console.log('🔥 Connecting to Firebase...');
            
            // Import Firebase SDK directly
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { getFirestore, collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
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
            
            console.log('🔥 Initializing Firebase app...');
            const app = initializeApp(firebaseConfig);
            const db = getFirestore(app);
            
            console.log('✅ Firebase connected to project:', firebaseConfig.projectId);

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

            console.log('📬 Saving to Firestore collection: messages');

            // Save to Firestore
            const messagesRef = collection(db, 'messages');
            const docRef = await addDoc(messagesRef, messageData);

            console.log('✅ Message saved successfully!');
            console.log('📧 Document ID:', docRef.id);
            console.log('📬 From:', payload.name, `<${payload.email}>`);

            showMessage('✅ Thank you! Your message has been sent successfully. I\'ll get back to you soon!');
            form.reset();

        } catch (error) {
            console.error('❌ Firebase error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            
            if (error.code === 'permission-denied') {
                showMessage('❌ Permission denied. Please check Firestore rules.', 'error');
            } else if (error.message.includes('Failed to fetch')) {
                showMessage('❌ Network error. Please check your connection.', 'error');
            } else {
                showMessage(`❌ Error: ${error.message}. Please email: mbr63@drexel.edu`, 'error');
            }
        } finally {
            // Reset loading state
            isSubmitting = false;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            }

            // Re-enable inputs
            inputs.forEach(input => input.disabled = false);
        }
    }

    // Add event listener
    form.addEventListener('submit', handleSubmit);

    // Add basic spinner CSS
    if (!document.querySelector('#simple-contact-styles')) {
        const style = document.createElement('style');
        style.id = 'simple-contact-styles';
        style.textContent = `
            .spinner {
                display: inline-block;
                width: 12px;
                height: 12px;
                border: 2px solid transparent;
                border-radius: 50%;
                border-top-color: currentColor;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    console.log('Simple contact form initialized');
}

// Auto-initialize
if (typeof window !== 'undefined' && document.readyState !== 'loading') {
    initContactForm();
} else if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initContactForm();
    });
}

export default initContactForm;
