# 🎯 Mangesh Raut - Portfolio & AI Assistant

A modern, responsive portfolio website featuring an intelligent AI chatbot powered by OpenRouter's Gemini 2.0 Flash model, with direct Firebase integration for contact form submissions.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://mangeshraut712.github.io/mangeshrautarchive/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange)](https://firebase.google.com/)
[![OpenRouter](https://img.shields.io/badge/AI-OpenRouter-blue)](https://openrouter.ai/)

---

## ✨ Features

### 🤖 AI Chatbot - "AssistMe"
- **Powered by**: OpenRouter API with Google Gemini 2.0 Flash (`google/gemini-2.0-flash-001`)
- **Capabilities**:
  - Portfolio Q&A (experience, skills, projects)
  - Real-time info (time, date, timezone)
  - Advanced mathematics calculations
  - Entertainment (jokes via Official Joke API)
  - Web commands (Google, YouTube search)
  - Voice mode (Speech-to-Retrieval)
  - Location-aware responses
- **UI/UX**: Apple iMessage-inspired design with light/dark mode
- **Response metadata**: Source, Model, Category, Confidence, Length, Runtime

### 📬 Contact Form
- **Direct Firebase Integration**: Saves messages to Firestore `(default)` database
- **Real-time validation**: Email format, required fields
- **User feedback**: Success/error messages with icons
- **No page reload**: AJAX-style submission
- **Security**: Firestore rules allow only `create` operations

### 🎨 Design
- **Apple.com-inspired** aesthetic
- **Responsive**: Mobile, tablet, desktop optimized
- **Dark/Light mode**: Theme-aware with CSS variables
- **Smooth animations**: 120Hz feel with cubic-bezier easing
- **Glassmorphism effects**: Modern UI components

---

## 🛠️ Tech Stack

### Frontend
- **HTML5/CSS3**: Semantic markup, modern styling
- **JavaScript (ES6+)**: Modular code, async/await
- **External CSS**: Theme-reactive styling with CSS variables
- **CDN Libraries**: 
  - Firebase SDK 10.7.1 (dynamic imports)
  - Font Awesome icons

### Backend/Services
- **Firebase Firestore**: NoSQL database for contact messages
- **OpenRouter API**: AI model aggregation service
- **Vercel**: Serverless functions (optional, for chatbot API)
- **GitHub Pages**: Static site hosting

### APIs
- **OpenRouter**: AI responses (Gemini 2.0 Flash)
- **Firebase REST API**: Direct Firestore writes
- **Official Joke API**: Entertainment responses
- **Browser APIs**: Geolocation, Speech Recognition

---

## 📁 Project Structure

```
mangeshrautarchive/
├── src/
│   ├── index.html              # Main HTML file
│   ├── assets/
│   │   └── css/
│   │       ├── chatbot-complete.css    # Chatbot styling
│   │       └── dark-mode-cards.css     # Theme styling
│   └── js/
│       ├── modules/
│       │   └── contact.js              # Contact form logic
│       └── core/
│           └── script.js               # Chatbot logic
├── api/
│   ├── chat.js                 # Chatbot API endpoint (Vercel)
│   └── chat-service.js         # AI service logic
├── scripts/
│   ├── diagnose-firebase.js    # Firebase diagnostic tool
│   └── test-all-features.js    # Chatbot feature tests
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ (for local testing)
- Firebase project with Firestore
- OpenRouter API key
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mangeshraut712/mangeshrautarchive.git
   cd mangeshrautarchive
   ```

2. **Configure Firebase**
   - Create a Firebase project: https://console.firebase.google.com
   - Enable Firestore in Native mode
   - Create `(default)` database
   - Update API key in `src/js/modules/contact.js` (line 104-110)

3. **Set up security rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /messages/{messageId} {
         allow create: if true;
         allow read, update, delete: if false;
       }
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

4. **Enable Firestore API**
   - Go to: https://console.cloud.google.com/apis/library/firestore.googleapis.com
   - Click "ENABLE"
   - Configure API key:
     - Go to: https://console.cloud.google.com/apis/credentials
     - Edit "Browser key (auto created by Firebase)"
     - Set to "Don't restrict key" OR add "Cloud Firestore API" to restrictions

5. **Deploy to GitHub Pages**
   - Push to GitHub
   - Enable GitHub Pages in repository settings
   - Source: `main` branch, `/` (root)

---

## 🧪 Testing

### Test Contact Form
```bash
# Run Firebase diagnostic
node scripts/diagnose-firebase.js
```

**Expected output:**
```
✅ PASS: Firestore API is accessible
✅ PASS: Successfully wrote to Firestore!
```

### Test Chatbot
```bash
# Test all chatbot features
node scripts/test-all-features.js
```

---

## 🔧 Configuration

### Firebase Config
Located in `src/js/modules/contact.js`:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

### OpenRouter Config
Located in `api/chat-service.js`:
```javascript
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'google/gemini-2.0-flash-001';
```

**Set environment variable in Vercel:**
- `OPENROUTER_API_KEY` = Your OpenRouter API key

---

## 🐛 Troubleshooting

### Contact Form Not Working

**Issue**: "Missing or insufficient permissions"  
**Fix**:
1. Enable Firestore API: https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=YOUR_PROJECT
2. Publish security rules in Firebase Console
3. Check API key restrictions allow Firestore API

**Issue**: Page reloads when submitting form  
**Fix**: Already fixed in latest version with `event.preventDefault()`

**Issue**: Transport errors  
**Fix**: 
```bash
# Run diagnostic to identify the issue
node scripts/diagnose-firebase.js
```

### Chatbot Not Responding

**Issue**: AI not responding  
**Fix**: 
1. Check OpenRouter API key in Vercel environment variables
2. Ensure `OPENROUTER_API_KEY` is set
3. Verify model name: `google/gemini-2.0-flash-001`

**Issue**: JavaScript errors  
**Fix**: 
1. Hard refresh: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
2. Clear browser cache
3. Check console for errors

---

## 📊 Features Breakdown

### Contact Form
- ✅ Direct Firebase Firestore integration
- ✅ Real-time validation
- ✅ No page reload (AJAX-style)
- ✅ Success/error feedback
- ✅ All fields saved: name, email, subject, message, timestamp

### AI Chatbot Categories
1. **Portfolio** - Questions about Mangesh's experience, skills, projects
2. **Time & Date** - Current time, date, timezone
3. **Mathematics** - Calculations, equations
4. **Entertainment** - Jokes
5. **Web Commands** - Google/YouTube search
6. **Programming** - Technical questions
7. **General** - Other queries via Gemini 2.0 Flash

### Response Metadata
Every response includes:
- **Source**: OpenRouter, AssistMe, Joke API, etc.
- **Model**: Gemini 2.0 Flash
- **Category**: Portfolio, Math, Entertainment, etc.
- **Confidence**: 0-100%
- **Length**: Character count
- **Runtime**: Response time in ms

---

## 🔒 Security

### Firestore Rules
- ✅ Allow `create` on `/messages` collection (contact form)
- ❌ Deny `read`, `update`, `delete` (privacy)
- ❌ Deny all other collections (security)

### API Keys
- ✅ Firebase API key in frontend (OK for Firestore with rules)
- ✅ OpenRouter API key in backend environment variables (Vercel)
- ✅ No sensitive data exposed in frontend

### CORS
- ✅ Firestore API allows `https://mangeshraut712.github.io`
- ✅ API endpoints use proper CORS headers

---

## 📈 Performance

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Chatbot Response**: 400-800ms average
- **Form Submission**: < 1s
- **Smooth Animations**: 60fps (120Hz feel)

---

## 🎯 Future Enhancements

- [ ] Email notifications for new contact messages
- [ ] Admin dashboard to view messages
- [ ] More AI model options (GPT-4, Claude, etc.)
- [ ] Chat history persistence
- [ ] Multi-language support
- [ ] Advanced analytics

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Mangesh Raut**
- Website: [mangeshraut712.github.io/mangeshrautarchive](https://mangeshraut712.github.io/mangeshrautarchive/)
- LinkedIn: [linkedin.com/in/mangeshraut71298](https://www.linkedin.com/in/mangeshraut71298/)
- Email: mbr63@drexel.edu

---

## 🙏 Acknowledgments

- **Firebase** - Backend database and hosting
- **OpenRouter** - AI model aggregation
- **Google Gemini** - AI model
- **Apple** - Design inspiration
- **Official Joke API** - Entertainment responses

---

## 🆘 Support

If you encounter any issues:

1. **Run diagnostics**: `node scripts/diagnose-firebase.js`
2. **Check console**: Press F12 and look for errors
3. **Hard refresh**: `Ctrl + F5` to clear cache
4. **Create an issue**: [GitHub Issues](https://github.com/mangeshraut712/mangeshrautarchive/issues)

---

**Built with ❤️ by Mangesh Raut**
