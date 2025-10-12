# 🔑 OpenRouter API Configuration Guide

## Environment Variables Setup

### Local Development (.env file - Already configured)
Your `.env` file contains:
- `OPENROUTER_API_KEY`: Your free API key
- `OPENROUTER_MODEL`: Fallback model when random selection is disabled
- `OPENROUTER_SITE_URL`: http://localhost:3000 (for local development)
- `OPENROUTER_APP_TITLE`: S2R Enhanced AI Assistant

## Production Deployment Setup

### Option 1: Vercel Deployment
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to Settings → Environment Variables
4. Add these variables:

```bash
OPENROUTER_API_KEY=sk-or-v1-...your-key-here...
OPENROUTER_SITE_URL=https://your-app.vercel.app
OPENROUTER_APP_TITLE=AssistMe Portfolio Assistant
OPENROUTER_MODEL=openai/gpt-oss-20b:free  # Optional: Pin to specific model
```

### Option 2: GitHub Pages Deployment
1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Add repository secrets (for Actions) or update your deploy workflow:

For manual configuration, ensure your build process includes:
```bash
OPENROUTER_SITE_URL=https://mangeshraut712.github.io/mangeshrautarchive
OPENROUTER_APP_TITLE=AssistMe Portfolio Assistant
```

## Model Selection Behavior

### Random Selection (Default)
When `OPENROUTER_MODEL` is **not set** or **empty**, the system randomly selects from:
1. `deepseek/deepseek-chat-v3-0324:free`
2. `google/gemma-3-3n-e2b-it`
3. `tng-tech/deepseek-tng-r1t2-chimera`

### Deterministic Selection
When `OPENROUTER_MODEL` is **set**, that specific model is used for all requests.

## Security Notes

- ✅ **DO NOT commit `.env` files** (already gitignored)
- ✅ **Use Vercel's Environment Variables panel** - never put API keys in code
- ✅ **Use GitHub Secrets** for Actions deployments
- ✅ **Keep API keys private** - they provide access to your OpenRouter account

## Testing Your Configuration

To verify your setup:

```bash
# Local testing
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What model are you using?"}'

# Production testing (replace with your domain)
curl -X POST https://your-domain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What model are you using?"}'
```

The response will indicate whether random selection or the pinned model is being used.
