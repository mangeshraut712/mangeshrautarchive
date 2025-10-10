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
            // Direct Firebase v9 call
            import('./firebase-config.js').then(async (firebaseConfig) => {
                const { collection, addDoc, serverTimestamp } = firebaseConfig;

                const db = firebaseConfig.app ? firebaseConfig.db : null;
                if (!db) {
                    throw new Error('Firebase database not available');
                }

                const messageData = {
                    ...payload,
                    timestamp: serverTimestamp(),
                    userAgent: navigator.userAgent || 'unknown',
                    submittedFrom: window.location.href
                };

                await addDoc(collection(db, 'messages'), messageData);

                showMessage('Thank you! Your message has been sent successfully.');
                form.reset();

                console.log('Message sent successfully');
            }).catch(error => {
                console.error('Firebase error:', error);
                showMessage('Failed to send your message. Please try again.', 'error');
            });

        } catch (error) {
            console.error('Error:', error);
            showMessage('Failed to send your message. Please try again.', 'error');
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
