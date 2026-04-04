/**
 * ===================================
 * CONTACT FORM VALIDATION & SUBMISSION
 * Apple-inspired UX with Real-time Validation
 * ===================================
 */

document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contact-form');
  const submitButton = document.getElementById('contact-submit');

  if (!contactForm || !submitButton) return;

  // Form validation state
  let isSubmitting = false;

  // Validation patterns
  const patterns = {
    name: /^[a-zA-Z\s]{2,50}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: /^.{10,1000}$/,
  };

  // Validation messages
  const messages = {
    name: {
      required: 'Full name is required',
      pattern: 'Please enter a valid name (2-50 characters, letters only)',
      valid: 'Name looks good!',
    },
    email: {
      required: 'Email address is required',
      pattern: 'Please enter a valid email address',
      valid: 'Email looks good!',
    },
    subject: {
      required: 'Please select a subject',
      valid: 'Subject selected',
    },
    message: {
      required: 'Message is required',
      pattern: 'Please write a message (10-1000 characters)',
      valid: 'Message looks good!',
    },
  };

  // Real-time validation
  function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    const errorElement = document.getElementById(`${fieldName}-error`);
    const inputWrapper = field.closest('.input-wrapper');

    if (!errorElement) return true;

    // Reset previous validation state
    field.classList.remove('valid', 'invalid');
    errorElement.textContent = '';
    errorElement.className = 'form-error';

    // Check if field is required and empty
    if (field.hasAttribute('required') && !value) {
      showFieldError(field, messages[fieldName].required);
      return false;
    }

    // Skip pattern validation if field is empty and not required
    if (!value) return true;

    // Validate pattern
    if (patterns[fieldName] && !patterns[fieldName].test(value)) {
      showFieldError(field, messages[fieldName].pattern);
      return false;
    }

    // Special validation for subject select
    if (fieldName === 'subject' && (!value || value === '')) {
      showFieldError(field, messages[fieldName].required);
      return false;
    }

    // Field is valid
    showFieldSuccess(field);
    return true;
  }

  function showFieldError(field, message) {
    const errorElement = document.getElementById(`${field.name}-error`);
    const inputWrapper = field.closest('.input-wrapper');

    field.classList.remove('valid');
    field.classList.add('invalid');
    errorElement.textContent = message;
    errorElement.className = 'form-error visible';

    // Add shake animation
    inputWrapper.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
      inputWrapper.style.animation = '';
    }, 500);
  }

  function showFieldSuccess(field) {
    const errorElement = document.getElementById(`${field.name}-error`);

    field.classList.remove('invalid');
    field.classList.add('valid');
    errorElement.textContent = '';
    errorElement.className = 'form-error';
  }

  // Add real-time validation listeners
  const formFields = contactForm.querySelectorAll('input, select, textarea');
  formFields.forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('invalid')) {
        validateField(field);
      }
    });
  });

  // Form submission
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();

    if (isSubmitting) return;

    // Validate all fields
    let isFormValid = true;
    formFields.forEach(field => {
      if (!validateField(field)) {
        isFormValid = false;
      }
    });

    if (!isFormValid) {
      // Scroll to first error
      const firstError = contactForm.querySelector('.form-error.visible');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Start submission
    isSubmitting = true;
    const originalText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Sending...</span>';

    try {
      // Collect form data
      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData.entries());

      // Simulate API call (replace with actual endpoint)
      console.log('Contact form submission:', data);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Show success message
      showSubmissionSuccess();
    } catch (error) {
      console.error('Form submission error:', error);
      showSubmissionError('Failed to send message. Please try again.');
    } finally {
      isSubmitting = false;
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    }
  });

  function showSubmissionSuccess() {
    const resultArea = document.getElementById('test-result-area');
    resultArea.classList.add('visible');

    const content = document.getElementById('test-result-content');
    content.innerHTML = `
      <div class="test-result-header success">
        <div class="result-icon">✅</div>
        <div class="result-info">
          <div class="result-status">Message Sent Successfully!</div>
          <div class="result-details">
            Thank you for reaching out. I'll get back to you within 24 hours.
          </div>
        </div>
      </div>
      <div class="success-actions" style="padding: 16px; text-align: center;">
        <button onclick="this.closest('.test-result-area').classList.remove('visible'); this.closest('#test-result-content').innerHTML='';" class="btn-contact-submit" style="width: auto; padding: 8px 16px; font-size: 0.9rem;">
          <i class="fas fa-times"></i>
          <span>Close</span>
        </button>
      </div>
    `;

    // Reset form
    contactForm.reset();
    formFields.forEach(field => {
      field.classList.remove('valid', 'invalid');
    });

    // Scroll to success message
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showSubmissionError(message) {
    const resultArea = document.getElementById('test-result-area');
    resultArea.classList.add('visible');

    const content = document.getElementById('test-result-content');
    content.innerHTML = `
      <div class="test-result-header error">
        <div class="result-icon">❌</div>
        <div class="result-info">
          <div class="result-status">Submission Failed</div>
          <div class="result-details">
            ${message}
          </div>
        </div>
      </div>
      <div class="error-actions" style="padding: 16px; text-align: center;">
        <button onclick="this.closest('.test-result-area').classList.remove('visible'); this.closest('#test-result-content').innerHTML='';" class="btn-contact-submit" style="width: auto; padding: 8px 16px; font-size: 0.9rem; background: #ff3b30;">
          <i class="fas fa-times"></i>
          <span>Close</span>
        </button>
      </div>
    `;

    resultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Add CSS for shake animation and form states
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }

    .form-input.valid {
      border-color: #34c759 !important;
      box-shadow: 0 0 0 3px rgba(52, 199, 89, 0.1) !important;
    }

    .form-input.invalid {
      border-color: #ff3b30 !important;
      box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.1) !important;
    }

    .form-error.visible {
      opacity: 1;
    }

    .contact-form-card {
      position: relative;
    }

    #test-result-area {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1000;
      max-width: 90vw;
      width: 500px;
    }

    @media (max-width: 768px) {
      #test-result-area {
        position: fixed;
        top: auto;
        bottom: 20px;
        left: 20px;
        right: 20px;
        transform: none;
        max-width: none;
        width: auto;
      }
    }
  `;
  document.head.appendChild(style);
});
