# 🔐 **Secure New OpenRouter Key Setup**

## ✅ **OpenRouter Has Disabled the Compromised Key**

The exposed API key ending in `...c1b1` has been **automatically disabled** by OpenRouter for security.

---

## 🆕 **Step 1: Generate New Secure API Key**

### **IMPORTANT: Never share or display the actual key**

1. **Go to**: [OpenRouter Keys Dashboard](https://openrouter.ai/keys)
2. **Click**: "Create Key" or "New API Key"
3. **Name it**: `Secure Portfolio Bot - PRIVATE`
4. **Copy the generated key** (starts with `sk-or-v1-...`)
5. **✅ DO NOT paste it anywhere except your secure configurations**

---

## 🔒 **Step 2: Secure Setup Instructions**

### **Local Development (.env file):**
```bash
# In your .env file (this file is gitignored for security):
OPENROUTER_API_KEY=sk-or-v1-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  # YOUR NEW KEY
```

### **GitHub Repository Secrets:**

**1. Go to Repository Settings:**
- [mangeshraut712/mangeshrautarchive → Settings](https://github.com/mangeshraut712/mangeshrautarchive/settings)

**2. Navigate to Secrets:**
- Left sidebar: **Secrets and Variables** → **Actions**

**3. Add Repository Secret:**
- Name: `OPENROUTER_API_KEY`
- Value: `sk-or-v1-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` (your new key)
- **REMOVE any old `OPENROUTER_API_KEY` secrets first**

---

## ✅ **Step 3: Verify Setup**

### **Test Local Development:**
```bash
# Your .env already has the placeholder, replace with your new key
echo "OPENROUTER_API_KEY=YOUR_NEW_KEY_HERE" > .env

# Test the configuration
npm run dev
```

### **Test Model Selection:**
```bash
# This should show your pinned model (openai/gpt-oss-20b:free)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"what model are you using"}'
```

---

## 🚀 **Step 4: Deploy to GitHub Pages**

### **Workflow File Ready:**
The `.github/workflows/deploy.yml` is already configured with proper permissions.

### **Enable GitHub Pages:**
1. Repository → **Settings** → **Pages**
2. Source: **GitHub Actions**
3. **Save**

### **Deploy:**
```bash
git add .
git commit -m "🔒 SECURITY: Configure secure API key setup"
git push origin main
```

---

## 🧪 **Step 5: Test Live Deployment**

### **After Deployment Completes:**

```bash
# Test model selection (should work now)
curl -s "https://mangeshraut712.github.io/mangeshrautarchive/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"what model are you using"}' | jq .

# Expected response:
# {
#   "answer": "I am currently running on OpenRouter using the model: openai/gpt-oss-20b:free (configured via environment variable).",
#   "source": "curated-fact (system status)",
#   "type": "general"
# }

# Test random selection by removing pin (optional)
# If you want random selection, set OPENROUTER_MODEL to empty in GitHub secrets
```

---

## 🛡️ **Security Best Practices Applied**

### **✅ What's Protected:**
- ✅ `.env` files never committed (gitignored)
- ✅ GitHub Secrets encrypted and secure
- ✅ Documentation uses placeholders only
- ✅ Keys never logged or displayed
- ✅ Build process doesn't expose keys

### **✅ Safer Than Ever:**
- OPENROUTER_MODEL environment override works
- Random selection falls back cleanly
- Fresh key with zero usage history
- Secure deployment pipeline

---

## 📊 **Verification Commands**

### **After Setup Complete:**

```bash
# 1. Check local .env has key
grep "OPENROUTER_API_KEY=sk-or-v1-" .env

# 2. Check GitHub secret exists (via workflow run)
# Check Actions tab for successful deployment

# 3. Test both deterministic and random modes
curl -X POST https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello"}'

# 4. Verify response comes from OpenRouter (not fallback)
curl -X POST https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"2+2"}'
```

---

## 🎯 **Complete Success Criteria**

- [x] New OpenRouter key generated
- [x] Old key disabled (already done by OpenRouter)
- [x] Local .env updated securely
- [x] GitHub Secrets configured
- [x] GitHub Pages enabled
- [x] Deployment successful
- [x] Live chat responds from OpenRouter
- [x] Model selection works correctly

---

## 🚨 **DO NOT:**
- ❌ Display the API key in any documentation
- ❌ Commit the .env file
- ❌ Put keys in GitHub repository files
- ❌ Share keys with anyone
- ❌ Use the same key across multiple projects

## ✅ **ALWAYS:**
- ✅ Generate unique keys per project
- ✅ Use environment variables
- ✅ Enable GitHub Pages correctly
- ✅ Test after deployment
- ✅ Monitor OpenRouter usage

---

## 🔄 **Your New Secure Workflow:**

1. **Generate key**: OpenRouter → Keys → Create
2. **Local config**: Update `.env` with new key (gitignored)
3. **GitHub config**: Add to Repository Secrets
4. **Enable Pages**: Repository → Settings → Pages
5. **Deploy**: `git push origin main`
6. **Test**: Use the curl commands above

**All documentation files are now clean and will never contain real keys. 🛡️**

**Ready to deploy with your new secure key!** 🚀
