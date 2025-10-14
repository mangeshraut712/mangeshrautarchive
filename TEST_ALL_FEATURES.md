# 🧪 Test All Chatbot Features

## Direct Commands (Instant - 0ms)

### Time & Date
```
"what time is it?"
"what date is today?"
"which day is today?"
```
Expected: Instant response with ⏰📅📆 icons

### Mathematics
```
"5 + 5"
"10 - 3"
"8 * 7"
"100 / 4"
```
Expected: Instant calculation with 🔢 icon

## API-Enhanced Features

### Entertainment (Joke API)
```
"tell me a joke"
"something funny"
```
Expected: Random joke from API with 😄 icon

### Weather (Simulated)
```
"weather in Philadelphia"
"weather"
```
Expected: Simulated weather with 🌤️ icon

### Web Commands (Built-in)
```
"open google AI"
"open youtube tutorials"
"search google machine learning"
```
Expected: Clickable URLs with 🔍📺 icons

## OpenRouter + Gemini Features

### Portfolio Questions
```
"What are Mangesh's skills?"
"Tell me about his experience"
"What's his highest qualification?"
"What projects has he worked on?"
```
Expected: Detailed responses from LinkedIn data

### General Knowledge
```
"Who is the Prime Minister of India?"
"What is machine learning?"
"Explain React"
```
Expected: AI-powered responses

### Programming Questions
```
"What is a function in JavaScript?"
"Explain Python decorators"
"What is REST API?"
```
Expected: Technical explanations

## All Commands Should Show Metadata

Format:
```
[Response text]

Source • Model • Category • Runtime
```

Examples:
- Direct Command • Built-in • Time & Date • 0ms
- Joke API • Entertainment • 420ms
- OpenRouter • Gemini 2.0 Flash • Portfolio • 520ms
- Web Command • Built-in • Web Command • 0ms

## Test Checklist

- [ ] Time commands work (instant)
- [ ] Math commands work (instant)
- [ ] Jokes work (from API)
- [ ] Weather works (simulated)
- [ ] Web commands work (links)
- [ ] Portfolio questions work (OpenRouter)
- [ ] General questions work (OpenRouter)
- [ ] Metadata shows for all responses
- [ ] Categories correct for each type
- [ ] Voice mode works for all commands

---

**All 11 categories should work with proper routing!**
