# 🔧 Grok API Key Issue - Troubleshooting

**Issue**: xAI API returning "Incorrect API key provided"  
**Status**: Investigating  

---

## 🔍 PROBLEM IDENTIFIED

The error message from xAI:
```json
{
  "code": "Client specified an invalid argument",
  "error": "Incorrect API key provided: ***. You can obtain an API key from https://console.x.ai."
}
```

This means the API key in Vercel is either:
1. ❌ Not the correct format
2. ❌ Has extra whitespace
3. ❌ Is an old/revoked key
4. ❌ Wrong variable name

---

## ✅ FIXES APPLIED

### **Code Changes:**
```javascript
// Now trimming all keys to remove whitespace
const GROK_API_KEY = (process.env.GROK_API_KEY || process.env.XAI_API_KEY || '').trim();

// Better error logging to see what's wrong
console.log(`🔑 Grok: Key starts with "${GROK_API_KEY.substring(0, 4)}..." (length: ${GROK_API_KEY.length})`);
console.error(`❌ Grok ${model} HTTP ${response.status}:`, JSON.stringify(errorData));
```

---

## 📋 YOUR CHECKLIST

### **Step 1: Verify the API Key in Vercel**
```
1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select: mangeshrautarchive project
3. Settings → Environment Variables
4. Find: GROK_API_KEY

Check these details:
   ✓ Variable name is exactly: GROK_API_KEY (all caps)
   ✓ Value starts with: xai-
   ✓ No extra spaces before or after
   ✓ Length is ~70-90 characters
   ✓ All 3 environments checked: ✓ Production ✓ Preview ✓ Development
```

### **Step 2: Verify the Key is Valid**
```bash
# Test the key directly (replace YOUR_KEY_HERE)
curl -s "https://api.x.ai/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KEY_HERE" \
  -d '{
    "model": "grok-beta",
    "messages": [{"role": "user", "content": "Hi"}],
    "stream": false
  }'
```

**Expected**: Should return a response with choices  
**If error**: The key is invalid or revoked

### **Step 3: Get a Fresh Key**

If the key is wrong, get a new one:
```
1. Go to: https://console.x.ai/
2. Sign in with your account
3. API Keys section
4. Create new API key or copy existing valid key
5. Copy the FULL key (starts with xai-)
6. Update in Vercel (paste exactly, no extra spaces)
7. Click Save
8. Redeploy: Deployments → ⋯ → Redeploy
```

---

## 🧪 **TESTING OPTIONS**

### **Option 1: Check Vercel Function Logs**
```
1. Vercel Dashboard → mangeshrautarchive
2. Deployments → Latest
3. Functions → /api/chat
4. Look for these logs:

GOOD (key found):
  🔑 Grok: Key starts with "xai-..." (length: 78)
  🚀 Trying Grok model: grok-beta
  
BAD (key wrong):
  ❌ Grok grok-beta HTTP 401: {"code":"Client specified an invalid argument"...}
  
MISSING (no key):
  ❌ Grok: No API key found
```

### **Option 2: Test on Website**
```
1. Go to: https://mangeshraut712.github.io/mangeshrautarchive/
2. Open chatbot
3. Ask: "What is 2+2?"
4. Look at response "Source"

CURRENT: "source": "openrouter (deepseek/deepseek-chat)"
EXPECTED: "source": "grok (grok-beta)"
```

---

## 🎯 **MOST LIKELY CAUSE**

Based on the error, the most likely issues are:

**1. Wrong Key Format** ❌
```
Wrong: GROK_API_KEY = xai-abc123...  (with extra space)
Wrong: GROK_API_KEY = "xai-abc123..." (with quotes)
Right: GROK_API_KEY = xai-abc123...   (just the key)
```

**2. Old/Revoked Key** ❌
```
You mentioned updating the key after it was leaked.
Make sure you're using the NEW key, not the old one.
```

**3. Variable Name Mismatch** ❌
```
In Vercel, it must be exactly: GROK_API_KEY
Not: XAI_API_KEY (though this also works)
Not: GROK_KEY
Not: grok_api_key (lowercase won't work)
```

---

## 💡 **RECOMMENDED ACTION**

**Do this now:**
```
1. Open Vercel Dashboard
2. Environment Variables for mangeshrautarchive
3. Delete the existing GROK_API_KEY (if it exists)
4. Create NEW environment variable:
   Name: GROK_API_KEY
   Value: [Your full xai- key from https://console.x.ai/]
   Environments: ✓ Production ✓ Preview ✓ Development
5. Click Add
6. Go to Deployments
7. Latest deployment → ⋯ menu → Redeploy
8. Wait 2-3 minutes
9. Test on website or run:
   curl -X POST https://mangeshrautarchive.vercel.app/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"test"}'
```

---

## 🚀 **ALTERNATIVE: Use Gemini Instead**

If you want to use Gemini while fixing Grok:

**Get Gemini Key:**
```
1. Go to: https://makersuite.google.com/app/apikey
2. Create API key
3. Add to Vercel as: GEMINI_API_KEY
4. Redeploy
```

Gemini will work as backup while you fix Grok!

---

**Current Status**: OpenRouter working, Grok failing due to incorrect API key  
**Next**: Verify and update GROK_API_KEY in Vercel
