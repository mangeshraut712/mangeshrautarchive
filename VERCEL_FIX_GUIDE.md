# 🔧 Vercel Deployment Fix Guide - URGENT

**Issue**: Vercel webhook is working (showing checks in GitHub) but deployments are **FAILING**

**Status**: ⚠️ **BUILD FAILURES** - Manual intervention required

---

## 🚨 CRITICAL: What's Happening

### GitHub Shows:
```
✅ Deploy to GitHub Pages / build - Successful
✅ Deploy to GitHub Pages / deploy - Successful  
❌ Vercel - Deployment failed <-- THIS IS THE PROBLEM
```

### What This Means:
- ✅ Vercel **IS** connected to GitHub (webhook working)
- ✅ Vercel **IS** receiving push notifications
- ❌ Vercel **BUILD IS FAILING** (not building successfully)
- ❌ Old deployment still serving (from 11:18 AM)

---

## 🔍 STEP 1: Check Build Logs (DO THIS FIRST)

### Login to Vercel Dashboard
```
https://vercel.com/dashboard
```

### Navigate to Your Project
1. Click on `mangeshrautarchive` project
2. Click "Deployments" tab
3. Find the **LATEST** deployment (should show "Failed" or "Error")
4. Click on it to open

### Check Build Logs
1. Look for the "Build Logs" section
2. Scroll to find **RED ERROR MESSAGES**
3. Common errors to look for:
   ```
   ❌ Build failed
   ❌ Module not found
   ❌ Command failed
   ❌ Syntax error
   ❌ ENOENT: no such file or directory
   ```

### Take Screenshot or Copy Error
- We need to see the **EXACT** error message
- This will tell us what's wrong

---

## 🎯 STEP 2: Most Likely Issues & Fixes

### Issue 1: Missing Dependencies
**If you see**: `Module not found` or `Cannot find module`

**Fix**:
1. In Vercel Dashboard → Settings → General
2. Check "Install Command": Should be `npm install` or `npm ci`
3. If blank or different, set it to: `npm ci`
4. Save and redeploy

---

### Issue 2: Build Script Failing
**If you see**: `Command "npm run build" failed`

**Fix Option A** - Disable Build (Serve Static Only):
1. Go to Settings → General
2. Set "Build Command" to: ` ` (empty/leave blank)
3. Set "Output Directory" to: `src`
4. Save

**Fix Option B** - Fix Build Script:
1. The build script expects certain files
2. Check if error mentions missing files
3. May need to adjust `scripts/build.js`

---

### Issue 3: Wrong Node Version
**If you see**: `Node version` or `Engine` error

**Fix**:
1. Go to Settings → General
2. Check "Node.js Version"
3. Set to: `20.x` (should match package.json)
4. Save and redeploy

---

### Issue 4: API Route Issues
**If you see**: `api/` related errors

**Current vercel.json** (just pushed):
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [...],
  "rewrites": [...]
}
```

**If build fails, try this simpler version**:
1. Go to repository
2. Edit `vercel.json` to:
```json
{
  "version": 2,
  "buildCommand": "",
  "outputDirectory": "src",
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://mangeshraut712.github.io"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization, Origin, X-Requested-With, Accept"
        }
      ]
    }
  ]
}
```
3. Commit and push

---

## 🎯 STEP 3: Manual Deployment Test

### Option A: Deploy Without Build
1. Vercel Dashboard → Settings → General
2. **Build Command**: Leave **EMPTY** or set to ` `
3. **Output Directory**: `src`
4. **Install Command**: `npm ci`
5. Save Settings
6. Go to Deployments → Click any deployment → "Redeploy"
7. Watch build logs in real-time

### Option B: Bypass Build Entirely
Create `.vercelignore` file in repository:
```
scripts/
dist/
node_modules/
tests/
```

Then push and redeploy.

---

## 🎯 STEP 4: Ensure Auto-Deploy is Enabled

### While in Vercel Dashboard:
1. Go to Settings → Git
2. Check these settings:

**✓ Production Branch**: `main` (must match your branch)

**✓ Deploy Hooks**: Should show GitHub integration

**✓ Auto-Deploy**: Make sure it's **ENABLED** (toggle ON)

**✓ GitHub Repository**: Should show `mangeshraut712/mangeshrautarchive`

3. If anything is wrong, reconnect:
   - Click "Disconnect" if needed
   - Click "Connect Git Repository"
   - Select GitHub → Your Repo

---

## 🎯 STEP 5: Check Environment Variables

### In Vercel Dashboard → Settings → Environment Variables:

**Required**:
```
OPENROUTER_API_KEY = [your-actual-key-here]
```

**Set for**: Production, Preview, Development (check all 3)

If missing, add it:
1. Click "Add Variable"
2. Name: `OPENROUTER_API_KEY`
3. Value: Your OpenRouter API key
4. Check: Production, Preview, Development
5. Save

---

## 🧪 STEP 6: Test After Fix

### Once Deployment Shows "Ready":

**Test 1: Homepage**
```bash
curl -I https://mangeshrautarchive.vercel.app/
# Should show recent last-modified date
```

**Test 2: API Status**
```bash
curl https://mangeshrautarchive.vercel.app/api/status
# Should return JSON (not 404)
```

**Test 3: CORS**
```bash
curl -I -X OPTIONS \
  -H "Origin: https://mangeshraut712.github.io" \
  https://mangeshrautarchive.vercel.app/api/chat
# Should return 204 with CORS headers
```

**Test 4: Chat API**
```bash
curl -X POST https://mangeshrautarchive.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello"}'
# Should return JSON with AI response
```

---

## 📋 Quick Checklist

In Vercel Dashboard, verify:

- [ ] Latest deployment shows the correct commit hash
- [ ] Build logs show what failed
- [ ] Node.js version is 20.x
- [ ] Build Command is appropriate (or empty)
- [ ] Output Directory is set correctly
- [ ] Production Branch is `main`
- [ ] Auto-Deploy is **ENABLED**
- [ ] GitHub repo is connected
- [ ] `OPENROUTER_API_KEY` environment variable is set
- [ ] Environment variable is set for all: Production, Preview, Development

---

## 🚨 IF BUILD KEEPS FAILING - SIMPLE FIX

### Disable Build Entirely:

**In vercel.json** (simplest possible):
```json
{
  "version": 2,
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://mangeshraut712.github.io"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

**In Vercel Settings**:
- Build Command: ` ` (empty)
- Output Directory: `src`
- Install Command: ` ` (empty, no dependencies needed for static+API)

This will:
- ✅ Serve `src/` folder as static files
- ✅ Auto-detect `api/` folder for serverless functions
- ✅ No build step = no build failures
- ✅ CORS headers applied

---

## 📞 What to Send Me

After checking Vercel Dashboard, send me:

1. **Screenshot of build logs** (the error part)
2. **Current settings**:
   - Build Command: ?
   - Output Directory: ?
   - Node.js Version: ?
3. **Environment Variables**: Is `OPENROUTER_API_KEY` set?
4. **Git Integration**: Is it showing as connected?
5. **Latest deployment status**: Failed, Building, or Ready?

With this info, I can provide an exact fix!

---

## 🎯 Expected Final Result

Once fixed, you should see:

```bash
# GitHub Checks
✅ Deploy to GitHub Pages / build - Successful
✅ Deploy to GitHub Pages / deploy - Successful
✅ Vercel - Deployment successful  <-- THIS SHOULD TURN GREEN!
```

Then test with:
```
https://mangeshraut712.github.io/mangeshrautarchive/test-api-integration.html
```

All 3 tests should pass with ✅ green checkmarks!

---

**Action Required**: Check Vercel Dashboard build logs NOW to see the exact error!
