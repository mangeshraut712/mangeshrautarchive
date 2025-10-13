# 🐛 Chatbot Troubleshooting

Common issues and how to fix them.

---

## Chatbot Not Opening

### Symptoms
- Clicking toggle button does nothing
- No console errors

### Solutions

1. **Check JavaScript loaded**
   ```javascript
   // Open browser console
   console.log(window.chatbot);
   // Should show chatbot object
   ```

2. **Verify HTML elements**
   ```javascript
   console.log(document.getElementById('chatbot-toggle'));
   console.log(document.getElementById('chatbot-widget'));
   // Both should return elements
   ```

3. **Check CSS loaded**
   - Inspect toggle button
   - Should have `position: fixed`, `z-index: 9998`

4. **Clear browser cache**
   - Hard refresh: `Ctrl+Shift+R` / `Cmd+Shift+R`

---

## API Not Responding

### Symptoms
- Messages sent but no response
- "Could not connect" error

### Solutions

1. **Test API manually**
   ```bash
   curl -X POST https://your-api.vercel.app/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"test"}'
   ```

2. **Check CORS**
   - Open browser console
   - Look for CORS errors
   - Verify API has proper CORS headers

3. **Verify API URL**
   - Check `chatbot/config/chatbot-config.js`
   - Ensure `baseUrl` is correct

---

## Styling Issues

### Symptoms
- Buttons overlapping
- Widget misplaced
- Wrong colors

### Solutions

1. **Check CSS specificity**
   - Chatbot CSS should load LAST
   - Use browser inspector to check styles

2. **Verify no conflicts**
   ```javascript
   // Check if other CSS overrides chatbot
   const widget = document.getElementById('chatbot-widget');
   console.log(window.getComputedStyle(widget).position);
   // Should be 'fixed'
   ```

3. **Reset styles**
   ```html
   <!-- Load chatbot CSS last -->
   <link rel="stylesheet" href="chatbot/styles/chatbot.css">
   ```

---

## Dark Mode Not Working

### Symptoms
- Stuck in light mode
- Colors don't change

### Solutions

1. **Check HTML class**
   ```javascript
   console.log(document.documentElement.classList.contains('dark'));
   // Should be true for dark mode
   ```

2. **Manually toggle**
   ```javascript
   document.documentElement.classList.toggle('dark');
   ```

3. **Check system preference**
   ```javascript
   console.log(window.matchMedia('(prefers-color-scheme: dark)').matches);
   ```

---

## Voice Not Working

### Symptoms
- Voice button does nothing
- "Not supported" error

### Solutions

1. **Check browser support**
   ```javascript
   console.log('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
   // Should be true
   ```

2. **Check HTTPS**
   - Voice API requires HTTPS
   - Won't work on `http://` (except localhost)

3. **Check permissions**
   - Browser may block microphone
   - Look for permission prompt

---

## Module Import Errors

### Symptoms
- "Cannot use import statement outside a module"
- "Unexpected token 'import'"

### Solutions

1. **Use `type="module"`**
   ```html
   <!-- Correct -->
   <script type="module" src="chatbot/chatbot-init.js"></script>
   
   <!-- Wrong -->
   <script src="chatbot/chatbot-init.js"></script>
   ```

2. **Check file paths**
   - All paths relative to `chatbot/`
   - Use `/` for absolute paths

---

## Performance Issues

### Symptoms
- Slow animations
- Laggy scrolling
- High CPU usage

### Solutions

1. **Check message count**
   - Clear old messages periodically
   - Limit to 50 messages max

2. **Disable animations (testing)**
   ```css
   * {
     animation: none !important;
     transition: none !important;
   }
   ```

3. **Check browser console**
   - Look for memory leaks
   - Check for infinite loops

---

## Still Having Issues?

1. **Enable debug mode**
   ```javascript
   // In chatbot/config/chatbot-config.js
   debug: true
   ```

2. **Check browser console**
   - All errors will be logged
   - Look for stack traces

3. **Test in isolation**
   - Create a minimal HTML file
   - Test chatbot alone
   - Gradually add other scripts

4. **Check version**
   - Clear cache completely
   - Verify latest files deployed

---

**Need more help?**  
Open an issue on GitHub or contact the developer.
