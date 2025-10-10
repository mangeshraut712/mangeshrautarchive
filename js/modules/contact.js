import { collection, addDoc, query, limit, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export function initContactForm(formId = 'contact-form', documentRef = document) {
    const form = documentRef.getElementById(formId);
    if (!form) {
        console.warn('Contact form not found with ID:', formId);
        return;
    }

    // Enhanced form state management
    let isSubmitting = false;

    // Enhanced DOM elements
    const submitButton = form.querySelector('button[type="submit"], .btn');
    const inputs = form.querySelectorAll('input, textarea');

    // Enhanced form validation
    function validateForm() {
        const errors = [];
        const formData = new FormData(form);

        // Trim all inputs
        const payload = {
            name: formData.get('name')?.trim(),
            email: formData.get('email')?.trim(),
            subject: formData.get('subject')?.trim(),
            message: formData.get('message')?.trim()
        };

        // Check required fields
        if (!payload.name) errors.push('Name is required');
        if (!payload.email) errors.push('Email is required');
        if (!payload.subject) errors.push('Subject is required');
        if (!payload.message) errors.push('Message is required');

        // Email validation
        if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
            errors.push('Please enter a valid email address');
        }

        // Length validations
        if (payload.name && payload.name.length < 2) errors.push('Name must be at least 2 characters');
        if (payload.subject && payload.subject.length < 5) errors.push('Subject must be at least 5 characters');
        if (payload.message && payload.message.length < 10) errors.push('Message must be at least 10 characters');

        return { isValid: errors.length === 0, errors, payload };
    }

    // Enhanced Firebase connection check with retry
    async function checkFirebaseConnection(maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            if (window.firebase && window.firebase.db) {
                try {
                    // Test connection by checking if we can get a reference
                    const db = window.firebase.db;
                    const collectionRef = collection(db, 'messages');
                    // Test connection with a simple limit query
                    await getDocs(query(collectionRef, limit(0)));
                    console.log('Firebase v9 connection verified');
                    return db;
                } catch (error) {
                    console.warn('Firebase connection test failed:', error.message);
                    if (i === maxRetries - 1) {
                        throw error; // Last attempt failed
                    }
                    // Wait before retry (increasing delay)
                    await new Promise(resolve => setTimeout(resolve, (i + 1) * 1000));
                }
            } else {
                if (i === maxRetries - 1) {
                    throw new Error('Firebase v9 not initialized');
                }
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, (i + 1) * 500));
            }
        }
    }

    // Enhanced error handling and feedback
    function showError(message) {
        // Try to show error in a user-friendly way
        const existingError = form.querySelector('.contact-error');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'contact-error alert alert-error';
        errorDiv.style.cssText = `
            background-color: #fee2e2;
            color: #dc2626;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 14px;
            border: 1px solid #fca5a5;
        `;
        errorDiv.innerHTML = `
            <svg class="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
            ${message}
        `;

        // Insert error message at the top of the form
        form.insertBefore(errorDiv, form.firstChild);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);

        // Scroll to error if needed
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function showSuccess(message) {
        // Remove any existing messages
        const existingMessages = form.querySelectorAll('.contact-error, .contact-success');
        existingMessages.forEach(msg => msg.remove());

        const successDiv = document.createElement('div');
        successDiv.className = 'contact-success alert alert-success';
        successDiv.style.cssText = `
            background-color: #dcfce7;
            color: #16a34a;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 14px;
            border: 1px solid #86efac;
        `;
        successDiv.innerHTML = `
            <svg class="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            ${message}
        `;

        form.insertBefore(successDiv, form.firstChild);

        // Auto-hide success message after 5 seconds, but keep it longer for UX
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 8000);
    }

    // Enhanced submit handler
    async function handleSubmit(event) {
        event.preventDefault();

        if (isSubmitting) return; // Prevent double submission

        // Validate form
        const validation = validateForm();
        if (!validation.isValid) {
            showError(validation.errors.join('<br>'));
            // Highlight first invalid field
            const firstError = validation.errors[0];
            if (firstError.includes('Name')) inputs[0].focus();
            else if (firstError.includes('Email')) inputs[1].focus();
            else if (firstError.includes('Subject')) inputs[2].focus();
            else inputs[3].focus();
            return;
        }

        // Set loading state
        isSubmitting = true;
        const originalButtonText = submitButton?.textContent;
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner"></span> Sending...';
            submitButton.style.cssText += `
                opacity: 0.7;
                cursor: not-allowed;
            `;
        }

        // Disable all inputs during submission
        inputs.forEach(input => {
            input.disabled = true;
            input.style.opacity = '0.7';
        });

        try {
            // Check Firebase connection
            console.log('Submitting contact form:', validation.payload);
            const db = await checkFirebaseConnection();

            // Prepare message data
            const messageData = {
                ...validation.payload,
                timestamp: serverTimestamp(),
                ip: null, // We don't collect IP for privacy
                userAgent: navigator.userAgent,
                submittedFrom: window.location.href,
                status: 'unread'
            };

            // Use Firebase v9 addDoc function
            const messagesRef = collection(db, 'messages');
            await addDoc(messagesRef, messageData);

            // Success feedback
            showSuccess('Thank you for your message! I will get back to you within 24 hours.');
            form.reset();

            // Analytics event (if available)
            if (typeof gtag !== 'undefined') {
                gtag('event', 'contact_form_submit', {
                    event_category: 'engagement',
                    event_label: 'contact_form'
                });
            }

            console.log('Contact message sent successfully');

        } catch (error) {
            console.error('Error sending contact message:', error);

            let errorMessage = 'Sorry, there was an error sending your message. ';

            if (error.code === 'permission-denied') {
                errorMessage += 'Please try again or contact me via email.';
            } else if (error.code === 'unavailable') {
                errorMessage += 'Database is temporarily unavailable. Please try again in a few minutes.';
            } else if (error.message?.includes('network')) {
                errorMessage += 'Please check your internet connection and try again.';
            } else {
                errorMessage += 'Please try again later or contact me via email.';
            }

            showError(errorMessage);

        } finally {
            // Reset loading state
            isSubmitting = false;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
                submitButton.style.removeProperty('opacity');
                submitButton.style.removeProperty('cursor');
            }

            // Re-enable inputs
            inputs.forEach(input => {
                input.disabled = false;
                input.style.removeProperty('opacity');
            });
        }
    }

    // Add form submission event listener
    form.addEventListener('submit', handleSubmit);

    // Enhanced real-time validation feedback
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            const validation = validateForm();
            if (!validation.isValid) {
                input.style.borderColor = '#dc2626';
                input.style.boxShadow = '0 0 0 1px #dc2626';
            } else {
                input.style.borderColor = '#22c55e';
                input.style.boxShadow = '0 0 0 1px #22c55e';
            }
        });

        input.addEventListener('focus', () => {
            input.style.borderColor = '';
            input.style.boxShadow = '';
        });
    });

    // Add CSS for enhanced styling with advanced animations
    if (!document.querySelector('#contact-form-enhancements')) {
        const style = document.createElement('style');
        style.id = 'contact-form-enhancements';
        style.textContent = `
            .spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid #ffffff;
                border-radius: 50%;
                border-top-color: transparent;
                animation: spin 1s ease-in-out infinite;
                margin-right: 8px;
            }

            .alert {
                position: relative;
                margin-bottom: 1rem;
                padding: 0.75rem 1rem;
                border: 1px solid transparent;
                border-radius: 0.5rem;
                animation: slideInFromTop 0.5s ease-out;
                overflow: hidden;
            }

            .alert-error {
                color: #dc2626;
                background-color: #fef2f2;
                border-color: #fecaca;
                animation: slideInFromTop 0.5s ease-out, shake 0.5s ease-in-out 0.5s;
            }

            .alert-success {
                color: #16a34a;
                background-color: #f0fdf4;
                border-color: #bbf7d0;
                animation: slideInFromTop 0.5s ease-out, bounceIn 0.6s ease-out 0.5s;
            }

            .alert-warning {
                color: #d97706;
                background-color: #fef3c7;
                border-color: #fcd34d;
            }

            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
            }

            @keyframes slideInFromTop {
                from {
                    transform: translateY(-100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }

            @keyframes bounceIn {
                0% {
                    transform: scale(0.3);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.05);
                    opacity: 0.8;
                }
                70% {
                    transform: scale(0.9);
                    opacity: 0.9;
                }
                100% {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            @keyframes successPulse {
                0% {
                    transform: scale(1);
                    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
                }
                50% {
                    transform: scale(1.02);
                    box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
                }
                100% {
                    transform: scale(1);
                    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
                }
            }

            input:focus, textarea:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
                transform: scale(1.01);
                transition: all 0.2s ease;
            }

            input:focus.valid {
                border-color: #22c55e;
                box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
            }

            input:focus.invalid {
                border-color: #dc2626;
                box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
            }

            #contact-form button[type="submit"] {
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            #contact-form button[type="submit"]:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
            }

            #contact-form button[type="submit"]:active:not(:disabled) {
                transform: translateY(-1px);
                box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
            }

            #contact-form button[type="submit"]:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                transform: none !important;
                box-shadow: none !important;
            }

            #contact-form input, #contact-form textarea {
                transition: all 0.2s ease;
                position: relative;
            }

            #contact-form input:hover, #contact-form textarea:hover {
                border-color: #94a3b8;
                transform: translateY(-1px);
            }

            .success-animation {
                animation: successPulse 2s ease-out;
            }

            /* Auto-fill styling */
            input:-webkit-autofill,
            input:-webkit-autofill:hover,
            input:-webkit-autofill:focus,
            textarea:-webkit-autofill,
            textarea:-webkit-autofill:hover,
            textarea:-webkit-autofill:focus {
                -webkit-box-shadow: 0 0 0 30px white inset;
                -webkit-text-fill-color: inherit;
            }

            /* Enhanced form layout */
            #contact-form .form-group {
                margin-bottom: 1.5rem;
                position: relative;
            }

            #contact-form .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
            }

            @media (max-width: 640px) {
                #contact-form .form-row {
                    grid-template-columns: 1fr;
                }
            }

            #contact-form button.success {
                background-color: #16a34a;
                animation: successPulse 2s ease-out;
            }

            /* Loading overlay for form */
            .form-loading-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(2px);
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                z-index: 10;
            }

            .form-loading-overlay::before {
                content: '';
                width: 40px;
                height: 40px;
                border: 4px solid #f1f5f9;
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
        `;
        document.head.appendChild(style);
    }

    console.log('Enhanced contact form initialized with Firebase integration');
}

export default initContactForm;
