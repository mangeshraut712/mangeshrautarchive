document.addEventListener('DOMContentLoaded', () => {

    const menuToggle = document.getElementById('menu-btn');
    const menuClose = document.getElementById('menu-close');
    const overlayMenu = document.getElementById('overlay-menu');
    const body = document.body;

    // --- Overlay Menu Toggle ---
    if (menuToggle && overlayMenu && menuClose) {
        menuToggle.addEventListener('click', () => {
            body.classList.add('menu-open');
        });

        menuClose.addEventListener('click', () => {
            body.classList.remove('menu-open');
        });
    }

    // --- Smooth Scrolling from Overlay Menu ---
    const overlayNavLinks = document.querySelectorAll('.overlay-nav-link');

    overlayNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            // Check if it's an internal link
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(href);

                if (targetElement) {
                    // Close the menu first
                    body.classList.remove('menu-open');

                    // Use a slight delay to allow the menu to visually start closing before scrolling
                    setTimeout(() => {
                        const navHeight = document.querySelector('nav')?.offsetHeight || 0; // Get nav height for offset
                        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight - 10; // Calculate position with offset

                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }, 100); // Short delay (adjust if needed)
                }
            }
        });
    });

    // --- Form submission ---
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;

            if (!name || !email || !subject || !message) {
                alert('Please fill out all fields.');
                return;
            }

            // Replace with actual form submission logic (e.g., Firebase)
            console.log('Form Data:', { name, email, subject, message });

            if (typeof firebase !== 'undefined' && firebase.firestore) { // Check if Firebase db is available
                const db = firebase.firestore();
                db.collection('messages').add({
                    name: name, email: email, subject: subject, message: message,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                })
                .then(() => {
                    alert('Thank you for your message! I will get back to you soon.');
                    form.reset();
                })
                .catch((error) => {
                    console.error("Error sending message: ", error);
                    alert('Sorry, there was an error sending your message. Please try again later.');
                });
            } else {
                 alert('Thank you for your message! (Simulated - DB not configured)');
                 form.reset();
            }
        });
    }

    // --- Fade-in animation on scroll ---
    const fadeElements = document.querySelectorAll('.fade-in');

    const observerOptionsAnimate = {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.1
    };

    const observerAnimate = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptionsAnimate);

    fadeElements.forEach(element => {
        observerAnimate.observe(element);
    });

    // --- Chatbot UI Logic ---
    const chatToggle = document.getElementById('chat-toggle');
    const chatWidget = document.getElementById('chat-widget');
    const chatClose = document.getElementById('chat-close');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');

    if (chatToggle && chatWidget && chatClose && chatMessages && chatInput && chatSend) {
        chatToggle.addEventListener('click', () => {
            chatWidget.classList.remove('hidden');
            setTimeout(() => {
                chatWidget.classList.remove('translate-y-8', 'opacity-0');
                chatWidget.classList.add('translate-y-0', 'opacity-100');
            }, 10);
        });

        chatClose.addEventListener('click', () => {
            chatWidget.classList.add('translate-y-8', 'opacity-0');
            setTimeout(() => {
                chatWidget.classList.add('hidden');
            }, 300);
        });

        chatSend.addEventListener('click', sendMessage);
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') sendMessage();
        });

        function appendMessage(text, isUser) {
            const msgDiv = document.createElement('div');
            msgDiv.className = isUser ? 'flex justify-end mb-3' : 'flex mb-3';
            msgDiv.innerHTML = `<div class="${isUser ? 'bg-gray-200 text-gray-800' : 'bg-blue-500 text-white'} p-3 rounded-lg max-w-xs shadow"><p class="text-sm">${text}</p></div>`;
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        async function sendMessage() {
            const text = chatInput.value.trim();
            if (!text) return;
            appendMessage(text, true);
            chatInput.value = '';
            appendMessage('...', false);

            // Since backend/AI is removed, show a coming soon message
            setTimeout(() => {
                chatMessages.removeChild(chatMessages.lastChild);
                appendMessage(
                    "AI-powered chat is a coming soon feature! Stay tuned for smart answers about Mangesh's profile.",
                    false
                );
            }, 600);
        }
    }
    // --- End Chatbot UI Logic ---

}); // End DOMContentLoaded
