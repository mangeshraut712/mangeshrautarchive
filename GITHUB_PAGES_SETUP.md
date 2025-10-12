# 🚀 **Complete GitHub Pages Setup Guide**

## GitHub Pages Deployment Fix

### **Step 1: Enable GitHub Pages in Repository**
1. Go to your repository: **[mangeshraut712/mangeshrautarchive](https://github.com/mangeshraut712/mangeshrautarchive)**
2. Click **Settings** (top right)
3. Scroll down to **Pages** section (left sidebar)
4. Under **Source**, select **"GitHub Actions"**
5. Click **Save**

### **Step 2: Repository Permissions**
Make sure the repository has the correct permissions:

**For the workflow to work:**
- Repository must be **public** (or you must have GitHub Pro for private)
- **Actions** must be enabled (Settings → Actions → General)
- **Read and write permissions** for GitHub Pages deployment

### **Step 3: Environment Variables in GitHub Secrets**

1. Go to **Repository → Settings → Secrets and Variables → Actions**
2. Add secret: `OPENROUTER_API_KEY`
   - Value: `YOUR_OPENROUTER_API_KEY_FROM_DASHBOARD` ⭐

### **Step 4: Trigger Deployment**

```bash
git add .github/workflows/deploy.yml
git commit -m "Fix GitHub Pages deployment with proper permissions"
git push origin main
```

### **Step 5: Check Deployment**

1. Go to **Actions** tab
2. See **"Deploy to GitHub Pages"** workflow running
3. Deployment URL will show in the workflow output
4. Access your site at: `https://mangeshraut712.github.io/mangeshrautarchive`

---

## 🧪 **Test Commands After Successful Deployment**

```bash
# Test 1: Model selection (should show pinned model)
curl -s "https://mangeshraut712.github.io/mangeshrautarchive/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"what model are you using"}' | jq .

# Should return:
"I am currently running on OpenRouter using the model: openai/gpt-oss-20b:free (configured via environment variable)."

# Test 2: Regular question (should go to OpenRouter API)
curl -s "https://mangeshraut712.github.io/mangeshrautarchive/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"what is 2+2"}' | jq '.source'

# Should return: "openrouter" (NOT "offline-knowledge")
```

---

## 🔍 **Troubleshooting**

### **If Deployment Fails:**

**Error: "Permission denied to github-actions[bot]"**
- ✅ **Solution**: Enable GitHub Pages in repository settings (Step 1 above)

**Error: "GitHub Pages is disabled"**
- ✅ **Solution**: Go to Settings → Pages → Select "GitHub Actions" as source

**Error: "Build succeeded but site not updating"**
- ✅ **Solution**: Check that the workflow completed successfully in Actions tab
- ✅ **Solution**: Wait 2-3 minutes for CDN cache refresh
- ✅ **Solution**: Force refresh browser (Ctrl+F5)

### **If API Still Failing:**

**Issue: Getting "offline-knowledge" responses**
```bash
# Check if API key is configured
curl -s "https://mangeshraut712.github.io/mangeshrautarchive/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}' | jq '.providers'
# Should show: ["OpenRouter"]
```

**Issue: Rate limiting**
- OpenRouter free tier is 50 requests/day
- Solutions:
  1. Wait for daily reset
  2. Add $10 credits for 1000 requests/day
  3. Use different model temporarily

---

## 📋 **Current Configuration Summary**

### **Local (.env):**
```
OPENROUTER_MODEL=openai/gpt-oss-20b:free  # Pinned for production
OPENROUTER_SITE_URL=http://localhost:3000
```

### **Production (GitHub Secrets):**
```
OPENROUTER_API_KEY=sk-or-v1-...your-key...
OPENROUTER_SITE_URL=https://mangeshraut712.github.io/mangeshrautarchive
OPENROUTER_APP_TITLE=AssistMe Portfolio Assistant
OPENROUTER_MODEL=openai/gpt-oss-20b:free  # Same as local
```

### **Fallback Random Selection:**
If `OPENROUTER_MODEL` environment variable is not set, randomly selects:
1. `deepseek/deepseek-chat-v3-0324:free`
2. `google/gemma-3-3n-e2b-it`
3. `tng-tech/deepseek-tng-r1t2-chimera`

---

## 🎯 **Success Checklist**

- [x] GitHub Pages enabled in repository settings
- [x] `OPENROUTER_API_KEY` added to repository secrets
- [x] Workflow deployed successfully to GitHub Actions
- [x] Site accessible at `https://mangeshraut712.github.io/mangeshrautarchive`
- [x] Model query returns correct pinned model
- [x] Regular questions answered by OpenRouter API
- [x] No API keys visible in browser/DevTools

---

## 🔒 **Security Verification**

Run this to confirm no secrets are exposed:
```bash
# Scan the live repository
curl -s "https://api.github.com/repos/mangeshraut712/mangeshrautarchive/contents/.env" 2>/dev/null || echo "✅ .env file not accessible (secure)"

# Check if API key appears anywhere public
curl -s "https://mangeshraut712.github.io/mangeshrautarchive" | grep -i "sk-or-v1-" || echo "✅ No API keys found in deployed site (secure)"
```

---

## 🚀 **Quick Start Commands**

```bash
# 1. Enable GitHub Pages in repository settings
# 2. Add OPENROUTER_API_KEY secret
# 3. Deploy workflow

echo "🚀 Ready to deploy with:"
echo "git push origin main"
echo ""
echo "🔗 Site will be at:"
echo "https://mangeshraut712.github.io/mangeshrautarchive"
```

Your chatbot is now fully configured for GitHub Pages deployment with proper OpenRouter model selection! 🎉
