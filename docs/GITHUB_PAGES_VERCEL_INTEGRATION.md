# GitHub Pages + Vercel Backend Integration Guide

## Overview
This document explains how the GitHub Pages frontend integrates with the Vercel backend API using OpenRouter for AI responses.

## Architecture

```
GitHub Pages (Frontend)
    ↓
  HTTPS Request with CORS headers
    ↓
Vercel API (Backend)
    ↓
OpenRouter API (AI Provider)
```

## Configuration

### 1. Environment Variables

#### Vercel (Backend)
Set in Vercel Dashboard → Project → Settings → Environment Variables:
- `OPENROUTER_API_KEY` - Your OpenRouter API key

#### GitHub Actions (Optional - for build-time checks)
Set in GitHub → Repository → Settings → Secrets and variables → Actions:
- `OPENROUTER_API_KEY` - Same key as Vercel

### 2. API Endpoint Configuration

**File: `src/js/config.js`**
```javascript
export const localConfig = {
    apiBaseUrl: 'https://mangeshrautarchive.vercel.app',
    // ... other config
};
```

This configures the frontend to call your Vercel backend.

### 3. CORS Configuration

**File: `vercel.json`**
- Headers are set at the platform level
- Allows requests from `https://mangeshraut712.github.io`
- Handles preflight OPTIONS requests

**Files: `api/chat.js`, `api/chat-router.js`, `api/status.js`**
- Each API endpoint applies CORS headers
- Defaults to GitHub Pages origin when no origin header present
- Supports local development on localhost

## How It Works

### 1. Frontend Initialization

When the page loads on GitHub Pages:

1. **Detection**: `chat.js` detects GitHub Pages environment
2. **API Check**: Verifies `localConfig.apiBaseUrl` is set
3. **Hybrid Mode**: Enables API calls with fallback to client-side processing

```javascript
// From chat.js
if (isGitHubPages) {
    if (localConfig.apiBaseUrl && localConfig.apiBaseUrl.includes('vercel.app')) {
        console.log('✅ Vercel API configured - hybrid mode enabled');
        this.canUseServerAI = true;
        return true; // API is available
    }
}
```

### 2. API Request Flow

**User Input → Chat Manager → API Call:**

```javascript
// From chat.js - callApi method
const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin
    },
    body: JSON.stringify({
        message: query,
        messages: conversationHistory
    }),
    signal: AbortSignal.timeout(30000)
});
```

### 3. Backend Processing

**API Handler (`api/chat.js`):**

1. **CORS Headers**: Applied to all responses (including errors)
2. **Validation**: Checks message is valid
3. **OpenRouter Call**: Sends request to OpenRouter API
4. **Response**: Returns formatted JSON with answer

```javascript
{
    answer: "The AI-generated response",
    type: "general",
    confidence: 0.82,
    processingTime: 1234,
    source: "openrouter (model-name)",
    providers: ["openrouter"],
    winner: "OpenRouter"
}
```

### 4. Voice Mode Integration

**Voice Input → Speech Recognition → API Call → Voice Output:**

```javascript
// From voice-manager.js
async executeQuery(query) {
    const { content, metadata } = await this.chatManager.fetchAssistantResponse(query);
    
    if (this.chatManager.voiceOutputEnabled) {
        this.speak(content); // Text-to-speech output
    }
}
```

## Features

### ✅ Working Features

1. **Chat Interface**: Text-based Q&A with AI
2. **Voice Input**: Speech-to-text for queries
3. **Voice Output**: Text-to-speech for responses
4. **Continuous Listening**: Voice conversation mode
5. **Semantic Matching**: S2R-inspired intent recognition
6. **Fallback**: Client-side processing when API unavailable
7. **Error Handling**: Graceful degradation

### 🎯 AI Capabilities

- General knowledge questions
- Technical/coding questions
- Portfolio information queries
- Mathematical calculations
- Conversational responses

## Testing

### Test the Integration

1. **Open GitHub Pages**: Navigate to `https://mangeshraut712.github.io/mangeshrautarchive/`

2. **Check Console Logs**: Look for initialization messages:
   ```
   🤖 GitHub Pages detected - checking API availability...
   ✅ Vercel API configured - hybrid mode enabled
   ```

3. **Test Chat**: Type a message like "hello" or "who is the CEO of Apple?"

4. **Check API Call**: Console should show:
   ```
   🖥️ Calling API: https://mangeshrautarchive.vercel.app/api/chat
   ✅ API response received: {...}
   ```

5. **Test Voice Mode**:
   - Click microphone icon
   - Say "What is your experience?"
   - Should get spoken response

### Troubleshooting

**Issue: CORS Errors**
- **Solution**: Redeploy Vercel to apply updated CORS headers
- **Check**: Verify `vercel.json` has correct headers configuration

**Issue: API Not Available**
- **Solution**: Check `src/js/config.js` has correct `apiBaseUrl`
- **Check**: Verify Vercel deployment is live

**Issue: Empty Responses**
- **Solution**: Check OPENROUTER_API_KEY is set in Vercel
- **Check**: View Vercel function logs for errors

**Issue: Voice Not Working**
- **Browser**: Use Chrome/Edge (best support for Web Speech API)
- **Permissions**: Allow microphone access when prompted
- **HTTPS**: Voice APIs require secure context (HTTPS)

## Monitoring

### Vercel Function Logs

View real-time logs:
1. Go to Vercel Dashboard
2. Select your project
3. Click "Functions" tab
4. View logs for `/api/chat`

### Console Logs (Frontend)

The frontend provides detailed logging:
- `🤖` System initialization
- `📡` API configuration
- `🖥️` API calls
- `✅` Successful responses
- `❌` Errors and fallbacks
- `🎤` Voice input/output
- `🔍` S2R semantic matching

## API Endpoints

### POST /api/chat
**Request:**
```json
{
    "message": "Your question here",
    "messages": [
        {"role": "user", "content": "Previous message"},
        {"role": "assistant", "content": "Previous response"}
    ]
}
```

**Response:**
```json
{
    "answer": "AI-generated response",
    "type": "general",
    "confidence": 0.82,
    "processingTime": 1234,
    "source": "openrouter (model-name)",
    "providers": ["openrouter"],
    "winner": "OpenRouter"
}
```

### GET /api/status
**Response:**
```json
{
    "grok": {"available": false},
    "anthropic": {"available": false},
    "perplexity": {"available": false},
    "gemini": {"available": false},
    "huggingface": {"available": false},
    "openai": {"available": false},
    "timestamp": "2025-10-12T...",
    "server": "local",
    "version": "1.0"
}
```

## Security

- API keys are stored securely in Vercel environment variables
- CORS restricts API access to allowed origins only
- Rate limiting prevents abuse (30 requests/minute)
- No API keys are exposed to frontend code
- All communication uses HTTPS

## Updates and Maintenance

### To Update OpenRouter Model

Edit `api/chat.js`:
```javascript
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/Meta-Llama-3-8B-Instruct:free';
```

Or set `OPENROUTER_MODEL` environment variable in Vercel.

### To Add New Origins

Edit `api/chat.js`, `api/chat-router.js`, `api/status.js`:
```javascript
const allowedOrigins = [
    'https://mangeshraut712.github.io',
    'http://localhost:3000',
    // Add new origin here
];
```

### To Deploy Changes

1. **Frontend (GitHub Pages)**:
   ```bash
   git add .
   git commit -m "Update frontend"
   git push origin main
   ```
   GitHub Actions will automatically deploy

2. **Backend (Vercel)**:
   ```bash
   git push origin main
   ```
   Vercel will automatically deploy

## Performance

- **Average Response Time**: 1-3 seconds
- **API Timeout**: 30 seconds
- **Cache**: Responses cached client-side
- **Fallback**: Instant local processing when API unavailable

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Chat | ✅ | ✅ | ✅ | ✅ |
| Voice Input | ✅ | ❌ | ✅ | ✅ |
| Voice Output | ✅ | ✅ | ✅ | ✅ |
| Continuous Mode | ✅ | ❌ | ✅ | ✅ |

**Note**: Firefox doesn't support Web Speech Recognition API

## Support

For issues or questions:
- Check Vercel function logs
- Review browser console logs
- Verify environment variables are set
- Test API endpoint directly using curl

---

**Last Updated**: 2025-10-12
**Status**: ✅ Production Ready
