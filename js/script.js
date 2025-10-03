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

    // --- MANGESH AI CHATBOT LOGIC (UPGRADED) ---
    const chatToggle = document.getElementById('portfolio-chat-toggle');
    const chatWidget = document.getElementById('portfolio-chat-widget');
    const chatClose = document.getElementById('portfolio-chat-close');
    const chatInput = document.getElementById('portfolio-chat-input');
    const chatMessages = document.getElementById('portfolio-chat-messages');
    const voiceInputBtn = document.getElementById('portfolio-voice-input');
    // const stopVoiceBtn = document.getElementById('portfolio-chat-stop-voice'); // Voiceover removed

    // --- API Keys & Configuration ---
    // IMPORTANT: Replace with your own keys for full functionality.
    const NEWS_API_KEY = '7c0f446a765249edab2c14df05956792'; 
    const NASA_API_KEY = 'AADXc64v1KehekFRHPZeqvR0mdD1DPwpSLUEsXhn';

    // --- Toggle chat widget visibility ---
    if (chatToggle && chatWidget && chatClose) {
        chatToggle.addEventListener('click', () => {
            chatWidget.classList.remove('hidden');
            if (chatMessages.children.length === 0) {
                addMessageToChat('assistant', "Hello! I'm AssistMe, an AI assistant. How can I help you today?");
            }
            chatInput.focus();
        });

        chatClose.addEventListener('click', () => {
            chatWidget.classList.add('hidden');
            // speechSynthesis.cancel(); // Voiceover removed
        });
    }

    // --- Stop voice button (Removed) ---

    // --- Add a message to the chat history ---
    function addMessageToChat(sender, text, isThinking = false) {
        const messageBubble = document.createElement('div');
        messageBubble.classList.add('message');

        if (sender === 'user') {
            messageBubble.classList.add('user-message');
            messageBubble.innerHTML = `<p>${text}</p>`;
        } else {
            messageBubble.classList.add('assistant-message');
            if (isThinking) {
                messageBubble.id = 'thinking-bubble';
                messageBubble.classList.add('typing');
                messageBubble.innerHTML = `<span></span><span></span><span></span>`;
            } else {
                // Use a library like 'marked' in the future to safely render markdown
                messageBubble.innerHTML = text.replace(/\n/g, '<br>');
            }
        }
        chatMessages.appendChild(messageBubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageBubble;
    }

    // --- Display response in UI (voiceover removed) ---
    function speakAndDisplay(text) {
        const thinkingBubble = document.getElementById('thinking-bubble');
        if (thinkingBubble) {
            thinkingBubble.innerHTML = text.replace(/\n/g, '<br>');
            thinkingBubble.classList.remove('typing');
            thinkingBubble.removeAttribute('id');
        } else {
            addMessageToChat('assistant', text);
        }
        // Voice synthesis has been removed.
    }

    // --- Handle user input (text or voice) ---
    async function handleCommand(command) {
        if (!command) return;
        addMessageToChat('user', command);
        chatInput.value = '';
        await processCommand(command.toLowerCase().trim());
    }

    // --- Send message on Enter key ---
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleCommand(chatInput.value.trim());
            }
        });
    }

    // --- Voice Recognition Logic ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && voiceInputBtn) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        voiceInputBtn.addEventListener('click', () => {
            recognition.start();
            voiceInputBtn.classList.add('recording');
        });

        recognition.onresult = (event) => {
            const speechResult = event.results[0][0].transcript;
            handleCommand(speechResult);
        };

        recognition.onend = () => voiceInputBtn.classList.remove('recording');
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            voiceInputBtn.classList.remove('recording');
            addMessageToChat('assistant', `Speech Error: ${event.error}. Please check microphone permissions.`);
        };
    } else if (voiceInputBtn) {
        voiceInputBtn.style.display = 'none'; // Hide if not supported
    }

    // --- Core Command Processing ---
    async function getImprovedAnswer(query) {
        addMessageToChat('assistant', '', true); // Thinking bubble
        const duckduckgoUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&t=AssistMe`;

        try {
            const response = await fetch(duckduckgoUrl);
            const data = await response.json();
            let answer = data.Answer || data.AbstractText || data.Definition;

            if (!answer && data.RelatedTopics && data.RelatedTopics.length > 0 && data.RelatedTopics[0].Text) {
                answer = data.RelatedTopics[0].Text;
            }

            if (answer) {
                speakAndDisplay(answer);
            } else {
                throw new Error('No answer found from DuckDuckGo.');
            }
        } catch (error) {
            console.error("API fetch error:", error);
            speakAndDisplay(`Sorry, I couldn't find information for "${query}". Please try rephrasing.`);
        }
    }

    async function getJoke() {
        addMessageToChat('assistant', '', true);
        try {
            const response = await fetch('https://official-joke-api.appspot.com/random_joke');
            const joke = await response.json();
            speakAndDisplay(`${joke.setup} ... ${joke.punchline}`);
        } catch (error) {
            speakAndDisplay("Sorry, I couldn't fetch a joke right now.");
        }
    }

    async function getNews() {
        addMessageToChat('assistant', '', true);
        try {
            const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${NEWS_API_KEY}`);
            const data = await response.json();
            if (data.articles && data.articles.length > 0) {
                let newsSummary = 'Here are some top headlines:\n';
                data.articles.slice(0, 3).forEach(article => {
                    newsSummary += `- ${article.title}\n`;
                });
                speakAndDisplay(newsSummary.trim());
            } else {
                speakAndDisplay('No news articles found.');
            }
        } catch (error) {
            speakAndDisplay("Sorry, I couldn't fetch the news. The API key might be invalid or expired.");
        }
    }
    
    async function getNASAAPOD() {
        addMessageToChat('assistant', '', true);
        try {
            const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`);
            const data = await response.json();
            speakAndDisplay(`NASA's Picture of the Day: ${data.title}. ${data.explanation.split('. ')[0]}.`);
        } catch (error) {
            speakAndDisplay("Sorry, I couldn't fetch NASA's picture of the day.");
        }
    }

    const commands = [
        { keywords: ['hello', 'hi', 'hey'], handler: () => speakAndDisplay("Hello! How can I assist you?") },
        { 
            keywords: ['who is mangesh', 'mangesh raut', 'creator', 'who made you'], 
            handler: () => {
                const bio = "Mangesh Raut is a skilled software engineer who created me, AssistMe. He specializes in building dynamic web applications and intelligent systems. His portfolio showcases projects using technologies like JavaScript and Python. You can learn more at his portfolio or connect with him on LinkedIn.";
                speakAndDisplay(bio);
            }
        },
        { keywords: ['who are you', 'what are you'], handler: () => speakAndDisplay("I am AssistMe, a portfolio AI assistant created by Mangesh Raut to demonstrate his skills.") },
        { keywords: ['time'], handler: () => speakAndDisplay(`The current time is ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })}.`) },
        { keywords: ['date', 'day'], handler: () => speakAndDisplay(`Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.`) },
        { keywords: ['joke'], handler: getJoke },
        { keywords: ['news', 'headlines'], handler: getNews },
        { keywords: ['nasa', 'space', 'astronomy'], handler: getNASAAPOD },
        {
            keywords: ['calculate', 'what is'],
            handler: (command) => {
                const expression = command.replace(/^(calculate|what is)\s*/, '').replace(/[=?]$/, '').trim();
                try {
                    // Basic and safe eval for math
                    const result = new Function('return ' + expression)();
                    if (isNaN(result)) throw new Error("Invalid calculation");
                    speakAndDisplay(`The answer is ${result}.`);
                } catch (e) {
                    getImprovedAnswer(command); // Fallback if not a simple calculation
                }
            }
        }
    ];

    // --- Process the command and route to the correct handler ---
    async function processCommand(command) {
        const lowerCaseCommand = command.toLowerCase().trim();

        for (const cmd of commands) {
            if (cmd.keywords.some(k => lowerCaseCommand.includes(k))) {
                await cmd.handler(lowerCaseCommand);
                return;
            }
        }

        // --- Fallback: Try to solve as a math problem, otherwise general query ---
    try {
        // Ensure math.js is loaded
        if (typeof math === 'undefined') {
            throw new Error("Math.js library not loaded.");
        }

        const result = math.evaluate(command);
        // Check if the result is something that can be displayed
        if (result !== undefined && typeof result !== 'function') {
            speakAndDisplay(math.format(result, { precision: 14 }));
        } else {
            throw new Error("Cannot evaluate expression.");
        }
    } catch (mathError) {
        // If math evaluation fails, try general question via DuckDuckGo
        console.error("Math evaluation error:", mathError);
        try {
            await getImprovedAnswer(command);
        } catch (generalError) {
            speakAndDisplay(`Sorry, I couldn't process that. Please ask me about Mangesh, or try a math calculation.`);
        }
    }
    }

    // --- Initial greeting ---
    addMessageToChat('assistant', 'Greetings! Welcome to AssistMe, your intelligent AI assistant! Ask me about Mangesh, general knowledge, or perform calculations.');
}

// Run initScript when DOM is ready
document.addEventListener('DOMContentLoaded', initScript);
