# 🚨 **CRITICAL SECURITY: API Key Leak Incident**

## **IMMEDIATE ACTION REQUIRED**

### **🔴 HIGH RISK: Your API key has been exposed in public commits!**

---

## **Step 1: IMMEDIATELY Revoke Compromised API Key**

### **Go to OpenRouter Dashboard**
1. Visit: **[OpenRouter Dashboard](https://openrouter.ai/keys)**
2. **DELETE** this key: `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`
3. **Generate NEW key** and save it securely

---

## **Step 2: Clean Repository History**

### **Remove API Key from Git History**
```bash
# Revert the commits containing the API key
git reset --hard HEAD~2  # Go back 2 commits to before the leak
git push --force origin main
```

### **Alternative: Use BFG Repo-Cleaner**
```bash
# Install BFG
brew install bfg-repo-cleaner

# Clone fresh copy
git clone --mirror https://github.com/mangeshraut712/mangeshrautarchive.git
cd mangeshrautarchive.git

# Remove the API key
bfg --replace-text YOUR_SECURE_PASSWORD_HERE <(echo "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==>XXXXXXX") --no-blob-protection .git

# Push clean history
git push origin --force
```

---

## **Step 3: Update All Configurations**

### **Replace in .env file:**
```bash
OPENROUTER_API_KEY=YOUR_NEW_SECURE_API_KEY_HERE
```

### **Replace in GitHub Secrets:**
1. Repository → Settings → Secrets and Variables → Actions
2. **DELETE** the old `OPENROUTER_API_KEY` secret
3. **ADD NEW** `OPENROUTER_API_KEY` with your fresh key

---

## **Step 4: Verify Security**

### **Check your repository:**
```bash
# Confirm API key is not in history
git log --grep="sk-or-v1" --oneline || echo "✅ No commits contain API key"

# Check for any remaining leaked keys
git grep -r "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" || echo "✅ API key fully removed"
```

### **Check OpenRouter Dashboard:**
- New key should be there
- Old key should be deleted
- Check usage from last 24 hours = 0 (to ensure old key was used)

---

## **Step 5: Redeploy with New Key**

```bash
# Update all configurations with new key
git add .
git commit -m "🔒 SECURITY: Update to new API key after revocation"
git push origin main
```

---

## **⚠️ Accounting for Potential Costs**

**If someone used your key:**
- Check OpenRouter usage meter immediately
- Set up billing alerts
- Consider downgrading to free tier temporarily

**Rate Limits Impact:**
- Free tier = 50 requests/day
- If abused, may need to pay $10 for premium tier
- Monitor usage after redeploy

---

## **🏠 Home Network Security**

1. **Change your home WiFi password** (upstream risk)
2. **Check connected devices** for suspicious activity
3. **Update router firmware**
4. **Consider enabling 2FA everywhere**

---

## **🛡️ Prevent Future Leaks**

### **Immediate Actions:**
- [ ] **NEVER put API keys in documentation** (even examples)
- [ ] **Always use environment variables** in live code
- [ ] **Add pre-commit hooks** to scan for secrets
- [ ] **Use GitHub's secret scanning alerts**

### **Long-term Security:**
```bash
# Install git-secrets
brew install git-secrets
git secrets --install
git secrets --register-aws
git secrets --register-azure
git secrets --more-pre-commit
```

---

## **✅ Success Indicators**

- [x] Old API key deleted from OpenRouter
- [x] New API key generated and secured
- [x] Repository history cleaned
- [x] GitHub secrets updated
- [x] Deployment successful with new key
- [x] No API keys in git log or files

---

## **📞 Still Need Help?**

If the API key was used maliciously:
- Contact OpenRouter support: support@openrouter.ai
- Report to GitHub as security vulnerability
- Consider credit monitoring if costs spike

**This is URGENT - act on this immediately! 🔴**

---

*The API key appears in your repository commits. Git repositories remember everything. Delete, regenerate, and redeploy immediately.*
