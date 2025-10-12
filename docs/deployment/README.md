# 🚀 Deployment Guide

How to deploy the portfolio to production.

---

## 🌐 Deployment Architecture

- **Frontend**: GitHub Pages
- **Backend**: Vercel Serverless Functions
- **CI/CD**: GitHub Actions

---

## 📦 GitHub Pages (Frontend)

### Automatic Deployment

Pushes to `main` branch automatically deploy to GitHub Pages.

```bash
git add .
git commit -m "Update portfolio"
git push origin main
```

### Manual Deployment

1. Go to repository Settings
2. Pages → Source → `main` branch
3. Save
4. Wait 2-3 minutes
5. Visit: `https://mangeshraut712.github.io/mangeshrautarchive/`

---

## ⚡ Vercel (Backend)

### Automatic Deployment

Connected to GitHub - auto-deploys on push.

### Manual Deployment

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project: `mangeshrautarchive`
3. Click "Deployments"
4. Click "..." → "Redeploy"
5. **Important**: Uncheck "Use existing Build Cache"
6. Click "Redeploy"
7. Wait 2-3 minutes

### Environment Variables

Must be set in Vercel Dashboard:

```env
OPENROUTER_API_KEY=your_key_here
```

**To add/update:**
1. Vercel Dashboard → Project
2. Settings → Environment Variables
3. Add/Edit variables
4. **Important**: Redeploy after changing!

---

## 🔄 Deployment Status

### Check Deployment

**Frontend:**
```bash
curl -I https://mangeshraut712.github.io/mangeshrautarchive/
# Should return: HTTP/2 200
```

**Backend:**
```bash
curl https://mangeshrautarchive.vercel.app/api/status
# Should return: JSON with API status
```

### Common Issues

**Deployment Failed:**
- Check GitHub Actions logs
- Verify vercel.json syntax
- Check for build errors

**API 404:**
- Verify vercel.json configuration
- Check environment variables
- Redeploy with cache OFF

**Stale Cache:**
- Clear Vercel build cache
- Force redeploy
- Wait 5 minutes

---

## 📊 Monitoring

- GitHub Actions: Repository → Actions tab
- Vercel Logs: Dashboard → Project → Deployments → View Logs
- Analytics: Vercel Dashboard → Analytics

---

## 🔧 Rollback

### GitHub Pages

```bash
git revert HEAD
git push origin main
```

### Vercel

1. Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

---

## 📝 Deployment Checklist

Before deploying:

- [ ] Test locally
- [ ] Update version in package.json
- [ ] Check all asset paths
- [ ] Verify environment variables
- [ ] Test API endpoints
- [ ] Check mobile responsiveness
- [ ] Run lighthouse audit
- [ ] Update README if needed

---

## 🚨 Emergency

**Site Down:**
1. Check GitHub Pages status
2. Check Vercel status
3. Review recent commits
4. Rollback if needed

**API Down:**
1. Check Vercel logs
2. Verify environment variables
3. Test API key validity
4. Redeploy if needed

---

## 📚 Related Docs

- [Setup Guide](../setup/)
- [API Documentation](../api/)
- [Troubleshooting](../guides/)
