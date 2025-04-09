// filepath: /Users/mangeshraut/http-mangeshrautarchive.github.io-/js/script.js
document.addEventListener('DOMContentLoaded', () => {

    const menuToggle = document.getElementById('menu-btn');
    const menuClose = document.getElementById('menu-close');
    const overlayMenu = document.getElementById('overlay-menu');
    const body = document.body;
    const visitorCountSpan = document.getElementById('visitor-count'); // Get the span for count

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

    // --- Simple Local Visitor Counter ---
    const updateLocalVisitorCount = () => {
        const visitedFlag = 'portfolioVisited';
        const countKey = 'portfolioVisitorCount';
        let currentCount = parseInt(localStorage.getItem(countKey) || '1', 10); // Start from 1 if no count exists

        if (!sessionStorage.getItem(visitedFlag)) { // Use sessionStorage to count only once per session
            sessionStorage.setItem(visitedFlag, 'true');
            currentCount++; // Increment count only for new sessions
            localStorage.setItem(countKey, currentCount.toString()); // Store the updated count
        }

        if (visitorCountSpan) {
            // Animate the count display slightly
            visitorCountSpan.style.opacity = '0';
            setTimeout(() => {
                visitorCountSpan.textContent = currentCount < 1000 ? currentCount.toString() : currentCount.toLocaleString(); // Display the count
                visitorCountSpan.style.opacity = '1';
            }, 150);
        }
    };

    updateLocalVisitorCount(); // Call the function to update and display the count

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

            if (typeof db !== 'undefined') { // Check if Firebase db is available
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

    // --- Firebase Unique Visitor Tracking (Optional - can be removed if not needed) ---
    /*
    if (typeof firebase !== 'undefined' && typeof db !== 'undefined') {
         if (!localStorage.getItem('visited')) { // Keep using localStorage for this specific Firebase action if desired
            db.collection('visitors').add({
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                userAgent: navigator.userAgent,
                pagePath: window.location.pathname
            }).catch((error) => {
                console.error("Error adding visitor: ", error);
            });
            localStorage.setItem('visited', 'true');
        }
    } else {
        console.warn("Firebase not fully initialized for visitor tracking.");
    }
    */

}); // End DOMContentLoaded