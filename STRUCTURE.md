# 📁 Project Structure

Clean, organized, production-ready structure.

---

## 🗂️ Directory Overview

```
mangeshrautarchive/
├── api/                    # Backend (Vercel Serverless)
│   ├── chat.js            # Main chat endpoint
│   ├── chat-service.js    # AI service logic  
│   └── status.js          # API status check
│
├── src/                   # Frontend (GitHub Pages)
│   ├── assets/
│   │   ├── css/          # Stylesheets (5 files)
│   │   ├── images/       # Images & icons (4 files)
│   │   └── files/        # PDFs & documents (2 files)
│   │
│   ├── js/
│   │   ├── core/         # Core functionality
│   │   │   ├── chat.js   # Chatbot UI & logic
│   │   │   ├── config.js # App configuration
│   │   │   └── script.js # Main application script
│   │   │
│   │   ├── modules/      # Feature modules
│   │   │   ├── animations.js    # Scroll animations
│   │   │   ├── contact.js       # Contact form
│   │   │   ├── external-config.js # External configs
│   │   │   ├── math.js          # Math utilities
│   │   │   ├── overlay.js       # Mobile menu overlay
│   │   │   ├── projects.js      # Projects section
│   │   │   └── voice.js         # Voice module
│   │   │
│   │   └── utils/        # Utility functions
│   │       ├── api-status.js     # API status indicator
│   │       ├── smart-navbar.js   # Smart navigation
│   │       ├── theme.js          # Theme switcher
│   │       └── voice-manager.js  # Voice assistant
│   │
│   └── index.html        # Main HTML page
│
├── docs/                 # Documentation
│   ├── README.md        # Docs index
│   ├── setup/           # Setup guides
│   ├── deployment/      # Deployment guides
│   ├── api/             # API docs (planned)
│   └── guides/          # Various guides (57 files)
│
├── scripts/             # Build & development scripts
│   ├── build.js        
│   ├── local-server.js  
│   ├── security-check.js
│   └── start-dev.js     
│
├── .github/
│   └── workflows/
│       └── deploy.yml   # GitHub Actions CI/CD
│
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies & scripts
├── vercel.json         # Vercel configuration
├── README.md           # Main documentation
└── STRUCTURE.md        # This file
```

---

## 📊 File Statistics

| Category | Count | Location |
|----------|-------|----------|
| **API Endpoints** | 3 | `api/*.js` |
| **CSS Styles** | 5 | `src/assets/css/` |
| **Images** | 4 | `src/assets/images/` |
| **Documents** | 2 | `src/assets/files/` |
| **Core JS** | 3 | `src/js/core/` |
| **Modules** | 7 | `src/js/modules/` |
| **Utils** | 4 | `src/js/utils/` |
| **Documentation** | 60+ | `docs/` |
| **Build Scripts** | 4 | `scripts/` |

---

## 🎯 Key Files

### Configuration
- `vercel.json` - Vercel serverless config
- `package.json` - NPM dependencies
- `.gitignore` - Git exclusions

### Entry Points
- `src/index.html` - Main HTML entry
- `api/chat.js` - Chat API entry
- `src/js/core/script.js` - Main JS entry

### Documentation
- `README.md` - Project overview
- `docs/README.md` - Docs index
- `STRUCTURE.md` - This file

---

## 🚀 Import Paths

### HTML (src/index.html)
```html
<!-- CSS -->
<link rel="stylesheet" href="assets/css/style.css" />

<!-- Images -->
<img src="assets/images/profile.jpg" />

<!-- JavaScript -->
<script src="js/core/script.js"></script>
<script src="js/utils/theme.js"></script>
```

### JavaScript Modules
```javascript
// From core to modules
import { initContact } from './modules/contact.js';

// From modules to utils  
import { checkAPIStatus } from '../utils/api-status.js';
```

---

## 🗑️ Removed Files

The following were removed during cleanup:

### Test Files (9)
- `api/test-*.js` (5 files)
- `test-*.js` (2 files)
- `test-*.html` (2 files)
- `tests/` directory (6 files)

### Duplicate/Unused (8)
- `api/chat-v2.js` (duplicate)
- `src/js/voice-simple.js` (duplicate)
- `src/js/firebase-config.js` (unused)
- `src/js/services.js` (unused)
- `src/js/math.js` (duplicate of modules/math.js)
- `config/` directory (unused Firebase config)
- `server.js` (unused)
- `perplexity-mcp.json` (unused)

### Consolidated
- 57 markdown files moved from root to `docs/guides/`

**Total Removed**: ~75 files  
**Total Organized**: ~60 files  

---

## 📝 Organization Principles

1. **Separation of Concerns**
   - Backend (`api/`) separate from frontend (`src/`)
   - Assets organized by type (`css/`, `images/`, `files/`)
   - JavaScript organized by function (`core/`, `modules/`, `utils/`)

2. **Clear Naming**
   - `core/` = Essential functionality
   - `modules/` = Feature implementations  
   - `utils/` = Helper functions
   - `assets/` = Static resources

3. **Documentation**
   - All docs in `docs/`
   - Organized by category
   - README files for navigation

4. **Clean Root**
   - Only essential config files
   - No test or debug files
   - Clear project structure

---

## 🔍 Finding Files

### "Where is the chatbot code?"
- **Backend logic**: `api/chat.js` + `api/chat-service.js`
- **Frontend UI**: `src/js/core/chat.js`
- **Voice features**: `src/js/utils/voice-manager.js`

### "Where are the styles?"
- **Main styles**: `src/assets/css/style.css`
- **Performance**: `src/assets/css/instant-performance.css`
- **UI components**: `src/assets/css/chat-icon-fix.css`

### "Where is the deployment config?"
- **Vercel**: `vercel.json`
- **GitHub Actions**: `.github/workflows/deploy.yml`
- **Guides**: `docs/deployment/`

### "Where are the docs?"
- **Setup**: `docs/setup/`
- **Deployment**: `docs/deployment/`
- **Guides**: `docs/guides/`
- **Index**: `docs/README.md`

---

**Last Updated**: October 12, 2025  
**Total Files**: ~100 (after cleanup from ~175)  
**Status**: ✅ Production Ready
