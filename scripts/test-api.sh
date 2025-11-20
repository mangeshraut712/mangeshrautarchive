#!/bin/bash

# ═══════════════════════════════════════════════════════════
# API HEALTH CHECK SCRIPT
# Tests both local and Vercel deployments
# ═══════════════════════════════════════════════════════════

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  API HEALTH CHECK - PORTFOLIO PROJECT                   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ───────────────────────────────────────────────────────────
# 1. CHECK LOCAL ENVIRONMENT
# ───────────────────────────────────────────────────────────
echo -e "${YELLOW}📋 Checking local environment...${NC}"

if [ -f .env ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
    
    if grep -q "OPENROUTER_API_KEY=your-openrouter-key-here" .env; then
        echo -e "${RED}❌ OpenRouter API key not configured in .env${NC}"
        echo -e "${YELLOW}   → Edit .env and add your actual OpenRouter API key${NC}"
        ENV_CONFIGURED=false
    elif grep -q "OPENROUTER_API_KEY=sk-or-v1-" .env; then
        echo -e "${GREEN}✅ OpenRouter API key configured in .env${NC}"
        ENV_CONFIGURED=true
    else
        echo -e "${RED}❌ Invalid OpenRouter API key format in .env${NC}"
        echo -e "${YELLOW}   → Key should start with 'sk-or-v1-'${NC}"
        ENV_CONFIGURED=false
    fi
else
    echo -e "${RED}❌ .env file not found${NC}"
    echo -e "${YELLOW}   → Run: cp .env.example .env${NC}"
    ENV_CONFIGURED=false
fi

echo ""

# ───────────────────────────────────────────────────────────
# 2. TEST LOCAL API
# ───────────────────────────────────────────────────────────
echo -e "${YELLOW}🖥️  Testing LOCAL API (http://localhost:3000)...${NC}"

# Check if local server is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Local server is running${NC}"
    
    # Test /api/status endpoint
    echo -e "${BLUE}   Testing /api/status...${NC}"
    STATUS_RESPONSE=$(curl -s http://localhost:3000/api/status)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✅ /api/status is reachable${NC}"
        echo -e "${BLUE}   Response: ${STATUS_RESPONSE:0:100}...${NC}"
    else
        echo -e "${RED}   ❌ /api/status failed${NC}"
    fi
    
    # Test /api/chat endpoint
    if [ "$ENV_CONFIGURED" = true ]; then
        echo -e "${BLUE}   Testing /api/chat...${NC}"
        CHAT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/chat \
            -H "Content-Type: application/json" \
            -d '{"message":"hello","messages":[],"context":{}}' \
            2>&1)
        
        if echo "$CHAT_RESPONSE" | grep -q '"answer"'; then
            if echo "$CHAT_RESPONSE" | grep -q '"source":"OpenRouter"' || echo "$CHAT_RESPONSE" | grep -q '"source":"Gemini'; then
                echo -e "${GREEN}   ✅ /api/chat is working (AI responses enabled)${NC}"
                echo -e "${GREEN}   Source: $(echo "$CHAT_RESPONSE" | grep -o '"source":"[^"]*"' | head -1)${NC}"
            else
                echo -e "${YELLOW}   ⚠️  /api/chat responding but using offline fallback${NC}"
                echo -e "${YELLOW}   Source: $(echo "$CHAT_RESPONSE" | grep -o '"source":"[^"]*"' | head -1)${NC}"
            fi
        else
            echo -e "${RED}   ❌ /api/chat failed or returned invalid response${NC}"
            echo -e "${BLUE}   Response: ${CHAT_RESPONSE:0:200}${NC}"
        fi
    else
        echo -e "${YELLOW}   ⏭️  Skipping /api/chat test (API key not configured)${NC}"
    fi
else
    echo -e "${RED}❌ Local server is NOT running${NC}"
    echo -e "${YELLOW}   → Run: npm run dev${NC}"
fi

echo ""

# ───────────────────────────────────────────────────────────
# 3. TEST VERCEL DEPLOYMENT
# ───────────────────────────────────────────────────────────
echo -e "${YELLOW}☁️  Testing VERCEL deployment (https://mangeshrautarchive.vercel.app)...${NC}"

# Test main page
if curl -s https://mangeshrautarchive.vercel.app > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Vercel deployment is live${NC}"
    
    # Test /api/status
    echo -e "${BLUE}   Testing /api/status...${NC}"
    VERCEL_STATUS=$(curl -s https://mangeshrautarchive.vercel.app/api/status)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✅ /api/status is reachable${NC}"
        echo -e "${BLUE}   Response: ${VERCEL_STATUS:0:100}...${NC}"
    else
        echo -e "${RED}   ❌ /api/status failed${NC}"
    fi
    
    # Test /api/chat
    echo -e "${BLUE}   Testing /api/chat...${NC}"
    VERCEL_CHAT=$(curl -s -X POST https://mangeshrautarchive.vercel.app/api/chat \
        -H "Content-Type: application/json" \
        -d '{"message":"test","messages":[],"context":{}}' \
        2>&1)
    
    if echo "$VERCEL_CHAT" | grep -q '"answer"'; then
        if echo "$VERCEL_CHAT" | grep -q '"source":"OpenRouter"' || echo "$VERCEL_CHAT" | grep -q '"source":"Gemini'; then
            echo -e "${GREEN}   ✅ /api/chat is working (AI responses enabled)${NC}"
            echo -e "${GREEN}   Source: $(echo "$VERCEL_CHAT" | grep -o '"source":"[^"]*"' | head -1)${NC}"
        else
            echo -e "${YELLOW}   ⚠️  /api/chat responding but using offline fallback${NC}"
            echo -e "${YELLOW}   This means OPENROUTER_API_KEY is not set in Vercel environment variables${NC}"
            echo -e "${BLUE}   Source: $(echo "$VERCEL_CHAT" | grep -o '"source":"[^"]*"' | head -1)${NC}"
        fi
    else
        echo -e "${RED}   ❌ /api/chat failed or returned invalid response${NC}"
    fi
else
    echo -e "${RED}❌ Vercel deployment is not reachable${NC}"
fi

echo ""

# ───────────────────────────────────────────────────────────
# 4. SUMMARY & NEXT STEPS
# ───────────────────────────────────────────────────────────
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  SUMMARY & NEXT STEPS                                    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$ENV_CONFIGURED" = true ]; then
    echo -e "${GREEN}✅ Local environment configured${NC}"
else
    echo -e "${RED}❌ Local environment needs configuration${NC}"
    echo -e "${YELLOW}   1. Get OpenRouter API key from: https://openrouter.ai/keys${NC}"
    echo -e "${YELLOW}   2. Edit .env file and add: OPENROUTER_API_KEY=sk-or-v1-your-key${NC}"
    echo -e "${YELLOW}   3. Restart dev server: npm run dev${NC}"
fi

echo ""
echo -e "${YELLOW}For Vercel deployment:${NC}"
echo -e "${YELLOW}   1. Go to: https://vercel.com/dashboard${NC}"
echo -e "${YELLOW}   2. Open project: mangeshrautarchive${NC}"
echo -e "${YELLOW}   3. Settings → Environment Variables${NC}"
echo -e "${YELLOW}   4. Add: OPENROUTER_API_KEY = your-key${NC}"
echo -e "${YELLOW}   5. Redeploy the project${NC}"

echo ""
echo -e "${BLUE}Test complete!${NC}"
