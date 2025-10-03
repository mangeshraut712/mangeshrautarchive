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

    // --- AssistMe Chatbot UI Logic ---
    const chatToggle = document.getElementById('chat-toggle');
    const chatWidget = document.getElementById('chat-widget');
    const chatClose = document.getElementById('chat-close');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const voiceToggle = document.createElement('input');
    const stopVoiceBtn = document.createElement('button');

    // Setup voice controls (append to chat header)
    const chatHeader = document.querySelector('#chat-widget .chat-header h3');
    if (chatHeader) {
        voiceToggle.type = 'checkbox';
        voiceToggle.id = 'voiceToggle';
        voiceToggle.checked = true;
        voiceToggle.style = 'margin-left: auto; accent-color: #2563eb;';
        stopVoiceBtn.textContent = 'Stop Speaking';
        stopVoiceBtn.id = 'stopVoiceBtn';
        stopVoiceBtn.style = 'padding: 0.25rem 0.5rem; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; margin-left: 5px;';

        chatHeader.appendChild(voiceToggle);
        chatHeader.appendChild(stopVoiceBtn);
    }

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

        stopVoiceBtn.addEventListener('click', () => {
            speechSynthesis.cancel();
        });

        chatSend.addEventListener('click', sendMessage);
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') sendMessage();
        });

        function addMessageToChat(sender, text, isThinking = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = isThinking ? 'flex mb-3 blinking' : sender === 'user' ? 'flex justify-end mb-3' : 'flex mb-3';
            if (!isThinking) {
                messageDiv.innerHTML = `<div class="${sender === 'user' ? 'bg-gray-200 text-gray-800' : 'bg-blue-500 text-white'} p-3 rounded-lg max-w-xs shadow"><p class="text-sm">${text}</p></div>`;
            } else {
                messageDiv.innerHTML = `<div class="bg-blue-500 text-white p-3 rounded-lg max-w-xs shadow"><p class="text-sm">${text}</p></div>`;
            }
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            return messageDiv;
        }

        function speakAndDisplay(text) {
            const thinkingBubble = chatMessages.lastChild && chatMessages.lastChild.classList.contains('blinking');
            if (thinkingBubble) {
                chatMessages.removeChild(chatMessages.lastChild);
            }
            const msgDiv = addMessageToChat('AssistMe', text);
            if (voiceToggle.checked) {
                try {
                    speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(text);
                    speechSynthesis.speak(utterance);
                } catch (error) {
                    console.error('Error speaking:', error);
                }
            }
        }

        async function handleCommand(command) {
            addMessageToChat('user', command);
            chatInput.value = '';
            await processCommand(command.toLowerCase().trim());
        }

        async function getWikipediaSummary(query) {
            const endpoint = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&explaintext=true&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&origin=*`;

            try {
                const response = await fetch(endpoint);
                if (!response.ok) throw new Error(`Network error (status: ${response.status})`);
                const data = await response.json();

                const page = data.query?.pages ? Object.values(data.query.pages)[0] : null;
                if (page && page.extract) {
                    const firstSentence = page.extract.split('. ')[0] + '.';
                    speakAndDisplay(firstSentence);
                    return;
                } else {
                    throw new Error('No summary found on Wikipedia.');
                }
            } catch (error) {
                speakAndDisplay(`Sorry, I ran into a problem: ${error.message}. Let me try a different approach.`);
                // Simple Wikipedia REST API fallback
                const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
                try {
                    const response = await fetch(wikiUrl);
                    const data = await response.json();
                    if (data.extract) {
                        const sentences = data.extract.split('. ');
                        speakAndDisplay(sentences[0] + (sentences[1] ? '. ' + sentences[1] + '.' : '.'));
                        return;
                    }
                } catch (error2) {}
                speakAndDisplay(`Sorry, I couldn't find information about "${query}". Feel free to ask about Mangesh's skills or experience!`);
            }
        }

        async function getImprovedAnswer(query) {
            addMessageToChat('AssistMe', 'Thinking...', true);

            let processedQuery = query.replace(/[.?!\s]+$/, '');

            // Hardcoded knowledge for common queries
            if (query.includes('when did the iphone released') || query.includes('released date of iphone')) {
                speakAndDisplay('The first iPhone was released on June 29, 2007.');
                return;
            }
            if (query.includes('who is steve jobs')) {
                speakAndDisplay('Steve Jobs was an American entrepreneur, inventor, and industrial designer. He co-founded Apple Inc. and served as its CEO.');
                return;
            }
            if (query.includes('who is president of usa') || query.includes('president of united states of america')) {
                speakAndDisplay('Joe Biden is the current President of the United States.');
                return;
            }
            if (query.includes('who is prime minister of india')) {
                speakAndDisplay('Narendra Modi is the current Prime Minister of India.');
                return;
            }
            if (query.includes('who is first president of india')) {
                speakAndDisplay('Dr. Rajendra Prasad was the first President of India, serving from 1950 to 1962.');
                return;
            }
            if (query.includes('who is ceo of apple')) {
                speakAndDisplay('Tim Cook is the CEO of Apple Inc.');
                return;
            }
            if (query.includes('which country has world most population') || query.includes('country with most population')) {
                speakAndDisplay('India is the most populous country in the world, with approximately 1.42 billion people.');
                return;
            }
            if (query.includes('what is tesla')) {
                speakAndDisplay('Tesla, Inc. is an American electric vehicle and clean energy company based in Palo Alto, California.');
                return;
            }
            if (query.includes('best selling car in the world')) {
                speakAndDisplay('The Toyota Corolla is the best-selling car model in the world, with over 50 million sold.');
                return;
            }
            if (query.includes('best electric car in the world')) {
                speakAndDisplay('Tesla Model S is often considered one of the best electric cars in the world due to its performance and range.');
                return;
            }

            // Portfolio-specific knowledge
            if (processedQuery.includes('who is mangesh') || processedQuery.includes('about mangesh')) {
                speakAndDisplay('Mangesh Raut is a passionate Full Stack Developer and aspiring AI Engineer specializing in web development, machine learning, and innovative tech solutions. He has experience in React, Node.js, Firebase, and various AI tools. Check out his portfolio for more!');
                return;
            }
            if (processedQuery.includes('what are your skills') || processedQuery.includes('skills')) {
                speakAndDisplay('Mangesh specializes in full-stack development with expertise in React, JavaScript, Node.js, Firebase, machine learning, and AI technologies.');
                return;
            }
            if (processedQuery.includes('contact') || processedQuery.includes('email')) {
                speakAndDisplay('You can reach Mangesh via email at mangeshraut712@gmail.com, LinkedIn: https://www.linkedin.com/in/mangeshraut71298/, or through the contact form on this website.');
                return;
            }
            if (processedQuery.includes('linkedin') || processedQuery.includes('social')) {
                speakAndDisplay('You can connect with Mangesh Raut on LinkedIn at https://www.linkedin.com/in/mangeshraut71298/');
                return;
            }

            // Default to Wikipedia search for general questions
            await getWikipediaSummary(processedQuery);
        }

        async function processCommand(command) {
            if (command === 'hello' || command === 'hi') {
                speakAndDisplay("Hello! I'm AssistMe, Mangesh's personal assistant. How can I help you today?");
            } else if (command === 'who are you') {
                speakAndDisplay("I am AssistMe, Mangesh Raut's intelligent chatbot assistant. I can answer questions about Mangesh and general knowledge topics.");
            } else if (command.includes('time')) {
                const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
                speakAndDisplay(`The current time is ${time}.`);
            } else if (command.includes('date')) {
                const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                speakAndDisplay(`Today is ${date}.`);
            } else if (command.includes('weather')) {
                speakAndDisplay('Weather data requires an API. Focus on portfolio questions instead!');
            } else if (command.includes('joke')) {
                speakAndDisplay('Why did the developer go broke? Because he used up all his cache!');
            } else {
                await getImprovedAnswer(command);
            }
        }

        async function sendMessage() {
            const text = chatInput.value.trim();
            if (!text) return;
            handleCommand(text);
        }

        // Initialize
        addMessageToChat('AssistMe', 'Hello! I am AssistMe, Mangesh Raut\'s personal AI assistant. Ask me about his skills, projects, or general knowledge!');
    }
    // --- End AssistMe Chatbot UI Logic ---

}); // End DOMContentLoaded
