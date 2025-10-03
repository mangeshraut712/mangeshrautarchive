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
                addMessageToChat('assistant', 'Greetings! Welcome to AssistMe, your intelligent AI assistant! Ask me about Mangesh, general knowledge, or perform calculations. (Answers sourced from DuckDuckGo and Wikipedia for accuracy.)');
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

        // 1. Try to solve as a math problem first
        try {
            // Use math.js if the query looks like a calculation
            if (/[0-9]/.test(query) && /[+\-*/.^]/.test(query)) {
                const expression = query.replace(/^(what is|calculate|compute)\s*/i, '').replace(/[=?]$/, '').trim();
                if (typeof math !== 'undefined') {
                    const result = math.evaluate(expression);
                    speakAndDisplay(`The answer is ${result}.`);
                    return;
                }
            }
        } catch (error) {
            // Not a valid math expression, proceed to other APIs.
            console.log("Math evaluation failed, trying APIs.");
        }

        // 2. Use a generic knowledge API for other questions
        const searchQuery = query.replace(/[.?!\s]+$/, '');
        const duckduckgoUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&format=json&no_html=1&t=AssistMe`;

        try {
            const response = await fetch(duckduckgoUrl);
            const data = await response.json();

            // Prioritize Answer, then AbstractText, then Definition
            let answer = data.Answer || data.AbstractText || data.Definition;

            if (answer) {
                // Clean up DuckDuckGo's source links if they exist
                answer = answer.replace(/<a href=.*?>.*?<\/a>/g, '').trim();
                speakAndDisplay(answer);
                return;
            }

            // 3. Fallback to Wikipedia with search to verify accuracy
            try {
                // Wiki search to find the correct page
                const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(searchQuery)}&limit=1&origin=*`;
                const searchResponse = await fetch(searchUrl);
                const searchData = await searchResponse.json();
                if (searchData.query && searchData.query.search.length > 0) {
                    const title = searchData.query.search[0].title;
                    // Now fetch summary for the searched title to verify/correct the information
                    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
                    const wikiResponse = await fetch(wikiUrl);
                    const wikiData = await wikiResponse.json();
                    if (wikiData.extract && !wikiData.type?.includes('disambiguation')) {
                        // Return the first one or two sentences for a concise summary
                        const sentences = wikiData.extract.split('. ');
                        const shortSummary = sentences[0] + (sentences[1] ? '. ' + sentences[1] : '') + '.';
                        speakAndDisplay(shortSummary);
                        return;
                    }
                }
            } catch (wikiError) {
                console.error("Wikipedia search/fetch error:", wikiError);
            }

            // 4. If all APIs fail, give a generic response
            throw new Error('No answer found from any API.');

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
            if (!response.ok) throw new Error(`Network error (status: ${response.status})`);
            const data = await response.json();
            if (data.articles && data.articles.length > 0) {
                let newsSummary = 'Here are some top headlines:\n';
                for (let i = 0; i < Math.min(5, data.articles.length); i++) {
                    const article = data.articles[i];
                    newsSummary += `- ${article.title} (Source: ${article.source.name})\n`;
                }
                speakAndDisplay(newsSummary.trim());
            } else {
                speakAndDisplay('No news articles found.');
            }
        } catch (error) {
            speakAndDisplay(`Sorry, I couldn't fetch the news: ${error.message}.`);
        }
    }
    
    async function getNASAAPOD() {
        addMessageToChat('assistant', '', true);
        try {
            const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`);
            if (!response.ok) throw new Error(`Network error (status: ${response.status})`);
            const data = await response.json();
            speakAndDisplay(`NASA Astronomy Picture of the Day: ${data.title}. Explanation: ${data.explanation}`);
        } catch (error) {
            speakAndDisplay(`Sorry, I couldn't fetch NASA's APOD: ${error.message}.`);
        }
    }

    async function getWeather(city) {
        addMessageToChat('assistant', '', true);
        try {
            // Simulating weather with random data since no API key
            const temperatures = [15, 20, 25, 30, 35];
            const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Foggy', 'Windy'];
            const temp = temperatures[Math.floor(Math.random() * temperatures.length)];
            const condition = conditions[Math.floor(Math.random() * conditions.length)];
            speakAndDisplay(`The weather in ${city} is ${temp} degrees Celsius and ${condition}.`);
        } catch (error) {
            speakAndDisplay(`Sorry, I couldn't fetch the weather data: ${error.message}.`);
        }
    }

    async function getReddit(subreddit) {
        addMessageToChat('assistant', '', true);
        try {
            const response = await fetch(`https://www.reddit.com/r/${encodeURIComponent(subreddit)}/.json?limit=5`);
            if (!response.ok) throw new Error(`Network error (status: ${response.status})`);
            const data = await response.json();
            if (data.data && data.data.children.length > 0) {
                let postsSummary = `Top 5 posts from r/${subreddit}:\n`;
                data.data.children.forEach((post, i) => {
                    postsSummary += `${i+1}. ${post.data.title} (Score: ${post.data.score})\n`;
                });
                speakAndDisplay(postsSummary.trim());
            } else {
                speakAndDisplay(`r/${subreddit} not found or no posts available.`);
            }
        } catch (error) {
            speakAndDisplay(`Sorry, I couldn't fetch Reddit posts: ${error.message}.`);
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

    function searchGoogle(query) {
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        try {
            window.open(url, '_blank');
            speakAndDisplay(`Searching Google for ${query}.`);
        } catch (error) {
            speakAndDisplay(`Sorry, I couldn't perform the search.`);
        }
    }

    const commands = [
        {
            keywords: ['hello', 'hi'],
            handler: () => speakAndDisplay("Hello! How can I help you today?")
        },
        {
            keywords: ['who are you', 'what are you'],
            handler: () => speakAndDisplay("I am AssistMe, your web-based virtual assistant.")
        },
        {
            keywords: ['who is mangesh', 'mangesh raut', 'creator', 'who made you'],
            handler: () => {
                const bio = "Mangesh Raut is a skilled software engineer who created me, AssistMe. He specializes in building dynamic web applications and intelligent systems. His portfolio showcases projects using technologies like JavaScript and Python. You can learn more at https://mangeshraut712.github.io/mangeshrautarchive/ or connect with him on LinkedIn at https://www.linkedin.com/in/mangeshraut71298/.";
                speakAndDisplay(bio);
            }
        },
        {
            keywords: ['time'],
            handler: () => {
                const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
                speakAndDisplay(`The current time is ${time}.`);
            }
        },
        {
            keywords: ['mangesh skills', 'skills mangesh', 'what skills does mangesh have'],
            handler: () => speakAndDisplay("Mangesh specializes in programming languages like Java, Python, SQL, and JavaScript. He is skilled in frameworks such as Spring Boot, AngularJS, TensorFlow, and scikit-learn. His cloud and DevOps expertise includes AWS, Docker, Jenkins, and Terraform. He also works with databases like PostgreSQL, MongoDB, and MySQL, and tools like Git, Jira, Wireshark, and networking technologies like Cisco.")
        },
        {
            keywords: ['mangesh experience', 'experience mangesh', 'where has mangesh worked'],
            handler: () => speakAndDisplay("Mangesh worked as a Software Engineer at Customized Energy Solutions (2024-present), improving energy analytics dashboards and reducing latency by 40%. Previously at IoasiZ (2023-2024), he refactored Java microservices and improved code efficiency by 20%. He also worked as a Network Engineer at Harshwardhan Enterprises (2020-2021), deploying Cisco routers and reducing latency by 35%.")
        },
        {
            keywords: ['mangesh education', 'education mangesh', 'where did mangesh study'],
            handler: () => speakAndDisplay("Mangesh has a Master of Science in Computer Science from Drexel University (GPA 3.3, 2021-2023) and a Bachelor of Engineering in Computer Engineering from Pune University (GPA 3.6, 2017-2020).")
        },
        {
            keywords: ['mangesh projects', 'projects mangesh', 'what projects has mangesh done'],
            handler: () => speakAndDisplay("Mangesh has developed a Starlight Blogging Website using Angular and Flask with attractive over 100 users. He also worked on Real-Time Face Emotion Recognition with 95% accuracy using Python and OpenCV. Additionally, he created a PC Crime Detector using Java for reduced security breaches.")
        },
        {
            keywords: ['contact mangesh', 'how to contact mangesh', 'mangeshdex contact'],
            handler: () => speakAndDisplay("You can connect with Mangesh on LinkedIn at https://www.linkedin.com/in/mangeshraut71298/ or visit his portfolio at https://mangeshraut712.github.io/mangeshrautarchive/. Email: mbr63drexel@gmail.com, Phone: +1 (609) 505-3500, Location: Philadelphia, PA.")
        },
        {
            keywords: ['date', 'day'],
            handler: () => {
                const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
                speakAndDisplay(`Today is ${date}.`);
            }
        },
        {
            keywords: ['weather'],
            handler: async (command) => {
                const cityMatch = command.match(/weather in (\w+)/i);
                await getWeather(cityMatch ? cityMatch[1] : 'your location');
            }
        },
        {
            keywords: ['joke'],
            handler: getJoke
        },
        {
            keywords: ['news', 'headline'],
            handler: getNews
        },
        {
            keywords: ['nasa', 'apod', 'astronomy'],
            handler: getNASAAPOD
        },
        {
            regex: /^open google(.*)/i,
            handler: async (command, matches) => {
                const query = matches[1].trim();
                if (query) {
                    searchGoogle(query);
                } else {
                    openWebsite('https://www.google.com', 'Google');
                }
            }
        },
        {
            regex: /^open youtube/i,
            handler: () => openWebsite('https://www.youtube.com', 'YouTube')
        },
        {
            regex: /^reddit (.*)/i,
            handler: async (command, matches) => {
                const subreddit = matches[1].trim();
                if (subreddit) await getReddit(subreddit);
            }
        }
    ];

    // --- Process the command and route to the correct handler ---
    async function processCommand(command) {
        for (const cmd of commands) {
            if (cmd.keywords && cmd.keywords.some(k => command.includes(k))) {
                await cmd.handler(command);
                return;
            }
            if (cmd.regex) {
                const matches = command.match(cmd.regex);
                if (matches) {
                    await cmd.handler(command, matches);
                    return;
                }
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
