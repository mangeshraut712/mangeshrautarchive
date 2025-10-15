/**
 * Contact Form - Vercel Backend Version
 * Submits to /api/contact instead of direct Firebase
 */

export function initContactFormVercel(formId = 'contact-form', documentRef = document) {
    const form = documentRef.getElementById(formId);
    if (!form) {
        console.warn('Contact form not found with ID:', formId);
        return;
    }

    // Prevent duplicate initialization
    if (form.dataset.contactVercelInitialized) {
        console.log('⚠️ Contact form (Vercel) already initialized');
        return;
    }
    form.dataset.contactVercelInitialized = 'true';

    let isSubmitting = false;
    const submitButton = form.querySelector('button[type="submit"], .btn');
    const inputs = form.querySelectorAll('input, textarea');
    
    console.log('📬 Contact form initialized (Vercel backend)');

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

        setTimeout(() => div.remove(), 5000);
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

        console.log('📝 Payload:', payload);

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
            console.log('🚀 Submitting to Vercel backend...');
            
            const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3000/api/contact'
                : 'https://mangeshrautarchive.vercel.app/api/contact';

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            console.log('📥 Response:', data);

            if (response.ok && data.success) {
                console.log('✅ Message sent! ID:', data.id);
                showMessage('✅ Thank you! Your message has been sent successfully.');
                form.reset();
            } else {
                throw new Error(data.error || 'Failed to send message');
            }

        } catch (error) {
            console.error('❌ Error:', error);
            showMessage(`❌ ${error.message}. Please email: mbr63@drexel.edu`, 'error');
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
    if (!document.querySelector('#vercel-contact-styles')) {
        const style = document.createElement('style');
        style.id = 'vercel-contact-styles';
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
            initContactFormVercel();
        }, { once: true });
    } else {
        initContactFormVercel();
    }
}

export default initContactFormVercel;
