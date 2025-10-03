function initScript() {

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

    // --- CLEAN PORTFOLIO CHATBOT LOGIC ---
    const portfolioChatToggle = document.getElementById('portfolio-chat-toggle');
    const portfolioChatWidget = document.getElementById('portfolio-chat-widget');
    const portfolioChatClose = document.getElementById('portfolio-chat-close');
    const portfolioChatMessages = document.getElementById('portfolio-chat-messages');
    const portfolioChatInput = document.getElementById('portfolio-chat-input');
    const portfolioChatSend = document.getElementById('portfolio-chat-send');
    const portfolioVoiceInput = document.getElementById('portfolio-voice-input');
    const portfolioVoiceToggle = document.getElementById('portfolio-voice-toggle');
    const portfolioVoiceStop = document.getElementById('portfolio-voice-stop');

    if (!portfolioChatInput || !portfolioChatMessages || !portfolioChatToggle) return;

    // Setup Voice Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;
    if (recognition) {
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.onend = () => portfolioVoiceInput.classList.remove('listening');
        recognition.onerror = (e) => addPortfolioMessage('AssistMe', `Voice error: ${e.error}`);
        recognition.onresult = (e) => processPortfolioCommand(e.results[0][0].transcript.toLowerCase());
    }

    // Event Listeners
    portfolioChatToggle.addEventListener('click', () => {
        portfolioChatWidget.classList.remove('hidden');
        setTimeout(() => {
            portfolioChatWidget.classList.remove('translate-y-8', 'opacity-0');
            portfolioChatWidget.classList.add('translate-y-0', 'opacity-100');
        }, 10);
    });

    portfolioChatClose.addEventListener('click', () => {
        portfolioChatWidget.classList.add('translate-y-8', 'opacity-0');
        setTimeout(() => {
            portfolioChatWidget.classList.add('hidden');
        }, 300);
    });

    portfolioVoiceInput.addEventListener('click', () => {
        if (recognition) {
            portfolioVoiceInput.classList.add('listening');
            recognition.start();
        } else {
            addPortfolioMessage('AssistMe', 'Voice input not supported on this browser.');
        }
    });

    portfolioVoiceStop.addEventListener('click', () => {
        speechSynthesis.cancel();
    });

    portfolioChatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && portfolioChatInput.value.trim()) {
            processPortfolioCommand(portfolioChatInput.value.trim().toLowerCase());
        }
    });

    portfolioChatSend.addEventListener('click', () => {
        const text = portfolioChatInput.value.trim();
        if (text) {
            processPortfolioCommand(text.toLowerCase());
        }
    });

    function addPortfolioMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = sender === 'user' ? 'flex justify-end mb-4' : 'flex mb-4';
        messageDiv.innerHTML = `<div class="${sender === 'user' ? 'bg-green-200 text-black dark:bg-green-700 dark:text-white' : 'bg-blue-500 text-white dark:bg-blue-600'} p-3 rounded-lg max-w-xs shadow-md"><p class="text-sm">${text}</p></div>`;
        portfolioChatMessages.appendChild(messageDiv);
        portfolioChatMessages.scrollTop = portfolioChatMessages.scrollHeight;
        return messageDiv;
    }

    function speakPortfolioMessage(text) {
        const msgDiv = addPortfolioMessage('AssistMe', text);
        if (portfolioVoiceToggle && portfolioVoiceToggle.checked) {
            try {
                speechSynthesis.cancel();
                portfolioVoiceStop.style.display = 'inline';
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.onend = () => portfolioVoiceStop.style.display = 'none';
                speechSynthesis.speak(utterance);
            } catch (error) {
                portfolioVoiceStop.style.display = 'none';
                console.error('Error speaking:', error);
            }
        }
    }

    async function processPortfolioCommand(command) {
        // Add user message
        addPortfolioMessage('user', command);
        portfolioChatInput.value = '';

        // Basic commands
        if (command === 'hello' || command === 'hi') {
            speakPortfolioMessage("Hi! I'm AssistMe, Mangesh's AI assistant. Ask me about his skills, projects, or general knowledge!");
        } else if (command === 'who are you') {
            speakPortfolioMessage("Hi! I'm AssistMe, Mangesh's AI assistant. Ask me about his skills, projects, or general knowledge!");
        } else if (command.includes('time')) {
            const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
            speakPortfolioMessage(`The current time is ${time}.`);
        } else if (command.includes('date')) {
            const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            speakPortfolioMessage(`Today is ${date}.`);
        } else if (command.includes('weather')) {
            const temperatures = [15, 20, 25, 30, 35];
            const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Foggy', 'Windy'];
            const temp = temperatures[Math.floor(Math.random() * temperatures.length)];
            const condition = conditions[Math.floor(Math.random() * conditions.length)];
            speakPortfolioMessage(`The weather is ${temp}°C and ${condition}.`);
        } else if (command.includes('mangesh') || command.includes('manges raut')) {
            speakPortfolioMessage("Mangesh Raut is a passionate Full Stack Developer and aspiring AI Engineer specializing in web development, machine learning, and innovative tech solutions. He has experience with React, Node.js, Firebase, and various AI tools. Visit https://www.linkedin.com/in/mangeshraut71298/ for more.");
        } else if (command.includes('skills')) {
            speakPortfolioMessage('Mangesh specializes in full-stack development with expertise in React, JavaScript, Node.js, Firebase, machine learning, and AI technologies.');
        } else if (command.includes('contact') || command.includes('email')) {
            speakPortfolioMessage('You can reach Mangesh via email at mangeshraut712@gmail.com, LinkedIn: https://www.linkedin.com/in/mangeshraut71298/, or through the contact form on this website.');
        } else if (command.includes('linkedin')) {
            speakPortfolioMessage('You can connect with Mangesh Raut on LinkedIn at https://www.linkedin.com/in/mangeshraut71298/');
        } else if (command.includes('who is tim cook')) {
            speakPortfolioMessage('Tim Cook is an American business executive who has been the chief executive officer of Apple Inc. since 2011.');
        } else if (command.includes('who is steve jobs')) {
            speakPortfolioMessage('Steve Jobs was an American entrepreneur, inventor, and industrial designer. He co-founded Apple Inc. and served as its CEO.');
        } else if (command.includes('what is tesla')) {
            speakPortfolioMessage('Tesla, Inc. is an American electric vehicle and clean energy company based in Palo Alto, California.');
        } else if (command.includes('joke')) {
            try {
                const response = await fetch('https://official-joke-api.appspot.com/random_joke');
                const joke = await response.json();
                speakPortfolioMessage(`${joke.setup} ${joke.punchline}`);
            } catch {
                speakPortfolioMessage("Why did the developer go broke? Because he used up all his cache!");
            }
        } else {
            speakPortfolioMessage(`I'm not sure about that. Try asking about Mangesh, his skills, or general topics like "who is Elon Musk?"`);
        }
    }

    // Initialize widget with greeting
    setTimeout(() => {
        addPortfolioMessage('AssistMe', "Hi! I'm AssistMe, Mangesh's AI assistant. Ask me about his skills, projects, or general knowledge!");
    }, 500);

    // --- End Portfolio Chatbot Logic ---

}

// Run initScript when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScript);
} else {
    initScript();
}
