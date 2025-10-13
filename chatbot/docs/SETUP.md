# 🚀 Chatbot Setup Guide

Quick guide to integrate the AssistMe chatbot into your website.

---

## 📋 Prerequisites

- Modern browser with ES6 module support
- Font Awesome loaded (for icons)
- API backend deployed (Vercel)

---

## 🔧 Installation

### Step 1: Include HTML

Add the chatbot widget to your HTML (before `</body>`):

```html
<!-- Copy from chatbot/components/chatbot-widget.html -->
<button id="chatbot-toggle">...</button>
<div id="chatbot-widget">...</div>
```

Or use server-side includes:

```html
<!-- PHP -->
<?php include 'chatbot/components/chatbot-widget.html'; ?>

<!-- SSI -->
<!--#include file="chatbot/components/chatbot-widget.html" -->
```

### Step 2: Include CSS

Add to your `<head>`:

```html
<link rel="stylesheet" href="chatbot/styles/chatbot.css">
```

### Step 3: Include JavaScript

Add before `</body>`:

```html
<script type="module" src="chatbot/chatbot-init.js"></script>
```

That's it! The chatbot will auto-initialize.

---

## ⚙️ Configuration

### Custom API Endpoint

Edit `chatbot/config/chatbot-config.js`:

```javascript
api: {
  baseUrl: 'https://your-api.vercel.app',
  // ...
}
```

### Disable Voice

```javascript
features: {
  voice: {
    enabled: false
  }
}
```

### Custom Colors

```javascript
theme: {
  colors: {
    primary: '#your-color',
    // ...
  }
}
```

---

## 🎨 Theming

### Dark Mode

Dark mode is auto-detected by default.

**Force dark mode:**

```javascript
// In chatbot-init.js
document.documentElement.classList.add('dark');
```

**Disable auto-detect:**

```javascript
features: {
  darkMode: {
    auto: false
  }
}
```

---

## 🐛 Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 📚 Next Steps

- [API Documentation](API.md)
- [Customization Guide](../README.md#customization)
