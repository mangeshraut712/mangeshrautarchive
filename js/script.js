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
    if (!speakButton) return;

    speakButton.addEventListener('click', () => {
        speakButton.classList.add('listening');
        if (recognition) {
            recognition.start();
        } else {
            addMessageToChat('AssistMe', "Voice recognition not supported.");
        }
    });

    stopVoiceBtn.addEventListener('click', () => {
        speechSynthesis.cancel();
    });

    commandInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && commandInput.value.trim()) {
            handleCommand(commandInput.value.trim());
        }
    });

    async function getWikipediaSummary(query) {
        const endpoint = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&explaintext=true&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=3&origin=*`;

        try {
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`Network error (status: ${response.status})`);
            const data = await response.json();

            const pages = data.query?.pages ? Object.values(data.query.pages) : [];
            let bestExtract = '';

            // Look through results for the most relevant
            for (const page of pages) {
                if (page.extract && page.extract.includes('2007') && page.extract.includes('June')) {
                    bestExtract = page.extract.split('. ')[0] + '.';
                    break;
                }
            }

            if (!bestExtract && pages.length > 0) {
                bestExtract = pages[0].extract.split('. ')[0] + '.';
            }

            if (bestExtract) {
                speakAndDisplay(bestExtract);
            } else {
                throw new Error('No summary found on Wikipedia.');
            }
        } catch (error) {
            speakAndDisplay(`Sorry, I ran into a problem: ${error.message}. Let me try searching Google for you.`);
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
        }
    }

    async function getJoke() {
        addMessageToChat('AssistMe', 'Thinking of a joke...', true);
        try {
            const response = await fetch('https://official-joke-api.appspot.com/random_joke');
            if (!response.ok) throw new Error(`Network error (status: ${response.status})`);
            const joke = await response.json();
            speakAndDisplay(`${joke.setup} ${joke.punchline}`);
        } catch (error) {
            speakAndDisplay(`Sorry, I couldn't fetch a joke: ${error.message}.`);
        }
    }

    function openWebsite(url, name) {
        try {
            window.open(url, '_blank');
            speakAndDisplay(`Opening ${name}.`);
        } catch (error) {
            speakAndDisplay(`Sorry, I couldn't open ${name}.`);
        }
    }

    async function searchGoogle(query) {
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        try {
            window.open(url, '_blank');
            speakAndDisplay(`Searching Google for ${query}.`);
        } catch (error) {
            speakAndDisplay(`Sorry, I couldn't perform the search.`);
        }
    }

    async function getImprovedAnswer(query) {
        addMessageToChat('AssistMe', 'Thinking...', true);

        let processedQuery = query.replace(/[.?!\s]+$/, ''); // Remove punctuation at end

        // Hardcoded knowledge for common queries
        if (query.includes('when did') && query.includes('released') && query.includes('iphone')) {
            speakAndDisplay('The iPhone was released on June 29, 2007.');
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

        // Portfolio-specific knowledge for Mangesh Raut
        if (processedQuery.includes('who is mangesh') || processedQuery.includes('about mangesh')) {
            speakAndDisplay("Mangesh Raut is a passionate Full Stack Developer and aspiring AI Engineer specializing in web development, machine learning, and innovative tech solutions. He has experience with React, Node.js, Firebase, and various AI tools. Visit https://www.linkedin.com/in/mangeshraut71298/ for more.");
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

        // For general questions, use Wikipedia or Google search
        if (processedQuery.startsWith('how many') || processedQuery.startsWith('what is') || processedQuery.includes('when did') || processedQuery.includes('who is') || processedQuery.includes('where') || processedQuery.includes('why')) {
            await getWikipediaSummary(processedQuery);
        } else {
            await searchGoogle(processedQuery);
        }
    }

    async function processCommand(command) {
        if (command === 'hello' || command === 'hi') {
            speakAndDisplay("Hi! I'm Mangesh's AI assistant. Ask me anything about his profile.");
        } else if (command === 'who are you') {
            speakAndDisplay("I am AssistMe, your personal AI assistant. I can help with general knowledge, Mangesh's portfolio info, and more!");
        } else if (command.includes('time')) {
            const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
            speakAndDisplay(`The current time is ${time}.`);
        } else if (command.includes('date')) {
            const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            speakAndDisplay(`Today is ${date}.`);
        } else if (command.includes('weather')) {
            const cityMatch = command.match(/weather in (\w+)/i);
            const city = cityMatch ? cityMatch[1] : 'your location';
            const temperatures = [15, 20, 25, 30, 35];
            const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Foggy', 'Windy'];
            const temp = temperatures[Math.floor(Math.random() * temperatures.length)];
            const condition = conditions[Math.floor(Math.random() * conditions.length)];
            speakAndDisplay(`The weather in ${city} is ${temp} degrees Celsius and ${condition}.`);
        } else if (command.includes('joke') || command.includes('tell me a joke')) {
            await getJoke();
        } else if (command.startsWith('open google')) {
            const query = command.replace('open google', '').trim();
            if (query) {
                await searchGoogle(query);
            } else {
                openWebsite('https://www.google.com', 'Google');
            }
        } else if (command.includes('open youtube')) {
            openWebsite('https://www.youtube.com', 'YouTube');
        } else if (command.includes('news') || command.includes('headline')) {
            speakAndDisplay("Sorry, the news feature requires an API key. For now, ask me anything else!");
        } else {
            await getImprovedAnswer(command);
        }
    }

    addMessageToChat('AssistMe', "Hi! I'm Mangesh's AI assistant. Ask me anything about his profile.");
    // --- End AssistMe Chatbot UI Logic ---

}); // End DOMContentLoaded
