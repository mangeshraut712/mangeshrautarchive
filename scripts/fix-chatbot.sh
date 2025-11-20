#!/bin/bash

# ═══════════════════════════════════════════════════════════
# FIX CHATBOT - Restart Server with New API Key
# ═══════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  CHATBOT FIX - Restart Development Server               ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

# Check if API key is configured
if grep -q "OPENROUTER_API_KEY=sk-or-v1-" .env; then
    echo -e "${GREEN}✅ OpenRouter API key found in .env${NC}"
    KEY_PREFIX=$(grep OPENROUTER_API_KEY .env | cut -d'=' -f2 | cut -c1-20)
    echo -e "${BLUE}   Key starts with: ${KEY_PREFIX}...${NC}"
else
    echo -e "${RED}❌ OpenRouter API key not configured in .env${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 INSTRUCTIONS:${NC}"
echo ""
echo -e "   Your API key is configured correctly, but the dev server"
echo -e "   needs to be restarted to load the new environment variable."
echo ""
echo -e "${YELLOW}   ACTION REQUIRED:${NC}"
echo -e "   1. Stop your current dev server (Press ${GREEN}Ctrl+C${NC} in the terminal)"
echo -e "   2. Then run: ${GREEN}npm run dev${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}TESTING API KEY:${NC}"
echo ""

# Test API key directly
TEST_RESPONSE=$(curl -s https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $(grep OPENROUTER_API_KEY .env | cut -d'=' -f2)" \
  -H "Content-Type: application/json" \
  -H "HTTP-Referer: https://mangeshraut712.github.io/mangeshrautarchive/" \
  -d '{
    "model": "google/gemini-2.0-flash-exp:free",
    "messages": [{"role": "user", "content": "Say hi"}]
  }' 2>&1)

if echo "$TEST_RESPONSE" | grep -q '"role":"assistant"'; then
    echo -e "${GREEN}✅ API key is VALID and working!${NC}"
    ANSWER=$(echo "$TEST_RESPONSE" | grep -o '"content":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}   AI Response: $ANSWER${NC}"
    echo ""
    echo -e "${GREEN}🎉 Your chatbot will work once you restart the server!${NC}"
else
    echo -e "${RED}❌ API key test failed${NC}"
    echo -e "${YELLOW}   Response: ${TEST_RESPONSE:0:100}${NC}"
fi

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  NEXT STEPS                                              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "   ${YELLOW}1.${NC} Stop dev server: ${GREEN}Ctrl+C${NC}"
echo -e "   ${YELLOW}2.${NC} Start fresh: ${GREEN}npm run dev${NC}"
echo -e "   ${YELLOW}3.${NC} Test chatbot on: ${BLUE}http://localhost:3000${NC}"
echo -e "   ${YELLOW}4.${NC} Send message: ${GREEN}Hello${NC}"
echo -e "   ${YELLOW}5.${NC} Should get AI response (not offline)${NC}"
echo ""
