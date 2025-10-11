# 🔐 Security Guide: Protect Your API Keys

## 🚨 IMMEDIATE ACTION REQUIRED

Your previous API keys were exposed in the codebase and are being revoked. Follow this guide immediately.

---

## 📋 Action Items (Do These Now!)

### 1. 🔑 Revoke All Exposed Keys
Visit each provider's dashboard and revoke/invalidate these keys:

- **OpenAI**: `sk-proj-Cvftck62OCTm4...` - Revoked ✅
- **Grok**: `xai-yXUWqZgbryXv8...` - Revoked ✅
- **Anthropic**: `sk-ant-api03-yhI6FRJ...` - Revoked ✅
- **Gemini**: `AIzaSyC-UcvKaYP-i...` - Revoked ✅
- **OpenRouter**: `sk-or-v1-6a4579...` - Revoked ✅
- **Other keys**: Check your provider accounts

### 2. 📁 Local Configuration Setup

Create your own secure keys:

```bash
# Create local config file (git-ignored)
cp src/js/config.local.js.example src/js/config.local.js

# Edit with YOUR OWN keys (not the revoked ones)
# Get new keys from each provider's website
```

### 3. 🔍 Run Security Checks

Before every commit, run:
```bash
npm run security-check
```

This will detect any accidentally exposed secrets.

---

## 🛠️ Security Architecture

### Secure Configuration Flow

```
1. src/js/config.js          # Base configuration (committed)
   ↓
2. src/js/config.local.js    # YOUR secrets (git-ignored)
   ↓
3. window.API_KEYS          # Frontend-safe object (empty strings)
```

### Files You Should NEVER Commit
```gitignore
# Already in your .gitignore
.env
.env.*
*_KEYS.txt
src/js/config.local.js
config.local.js
```

---

## 🚀 Quick Setup for New Keys

### 1. OpenAI
- Go to: https://platform.openai.com/api-keys
- Create new key: `sk-proj-...`
- Add to `config.local.js`

### 2. Grok (xAI)
- Go to: https://console.x.ai/
- Create new key: `xai-...`
- Add to `config.local.js`

### 3. Anthropic
- Go to: https://console.anthropic.com/
- Create new key: `sk-ant-api03-...`
- Add to `config.local.js`

### 4. Gemini
- Go to: https://makersuite.google.com/app/apikey
- Create new key: `AIzaSy...`
- Add to `config.local.js`

### 5. Other Providers
Check their respective APIs for key generation.

---

## 🔍 Security Monitoring

### Daily/Weekly Checks
```bash
# Run before each commit
npm run security-check

# Check git history for accidental commits
git log --grep="sk-" --grep="xai-" --grep="AIzaSy"
```

### Provider-Specific Monitoring
- **OpenAI**: Check usage at https://platform.openai.com/usage
- **Anthropic**: Monitor at https://console.anthropic.com/
- **Google**: Usage at https://makersuite.google.com/app/usage

---

## ⚠️ Critical Security Rules

### ❌ NEVER Do These:
- Hardcode keys in HTML/JavaScript files
- Commit API keys to version control
- Share keys in screenshots or documentation
- Use the same key across multiple projects
- Store keys in client-side code (unless properly secured)

### ✅ ALWAYS Do These:
- Use git-ignored local configuration files
- Rotate keys regularly (monthly)
- Monitor API usage and costs
- Use environment variables for production
- Run security checks before commits

---

## 🐛 If Something Goes Wrong

### "Security check failed"
1. Review the detected file
2. Move exposed keys to `config.local.js`
3. Remove from committed code
4. Re-run security check

### "Keys not working"
1. Verify keys in provider dashboards
2. Check key format (no quotes, no spaces)
3. Confirm correct key type (API vs Private vs Secret)

### "Git commit blocked"
1. Remove secrets from files
2. Use environment variables for production
3. Re-run security check

---

## 📞 Emergency Response Plan

### If Keys Are Compromised:
1. **IMMEDIATE**: Revoke key on provider dashboard
2. **CHECK**: Monitor usage patterns for abuse
3. **ROTATE**: Create new keys and update config
4. **MONITOR**: Watch for unauthorized usage
5. **REPORT**: Contact provider support if needed

### Contact Information:
- **OpenAI Support**: https://help.openai.com/
- **Anthropic Support**: support@anthropic.com
- **xAI Support**: https://x.ai/help
- **Google AI Support**: https://cloud.google.com/support

---

## 🎯 Best Practices Summary

### Development
- Keep all secrets in `.env` or `config.local.js`
- Use environment variables in production
- Never commit sensitive data

### Deployment
- Use Vercel/Unicorn environment variables
- Rotate keys every 30 days
- Monitor costs and usage

### Monitoring
- Run security checks daily
- Review provider dashboards weekly
- Set up billing alerts

---

**Status**: 🔒 SECURE CONFIGURATION ACTIVE
**Last Security Update**: October 12, 2025
**Revision**: 1.0

---

*This guide ensures your AI portfolio chatbot remains secure and protected against accidental key exposure.*
