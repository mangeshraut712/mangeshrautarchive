#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       🚀 Starting Mangesh Raut Portfolio - Local Server      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check for Python 3
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3 to continue.${NC}"
    exit 1
fi

# Setup Virtual Environment
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📦 Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate Virtual Environment
echo -e "${GREEN}🔌 Activating virtual environment...${NC}"
source venv/bin/activate

# Install Dependencies
if [ -f "requirements.txt" ]; then
    echo -e "${YELLOW}⬇️  Installing dependencies...${NC}"
    pip install -r requirements.txt > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install dependencies.${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ requirements.txt not found!${NC}"
    exit 1
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating a template...${NC}"
    echo "OPENROUTER_API_KEY=" > .env
    echo "VERCEL_ENV=development" >> .env
    echo -e "${GREEN}✅ Created .env file. Please add your OPENROUTER_API_KEY if needed.${NC}"
fi

# Start Server
echo ""
echo -e "${GREEN}✅ Server starting...${NC}"
echo -e "📁 Serving from: $(pwd)"
echo -e "🌐 Local URL: ${BLUE}http://localhost:8000${NC}"
echo ""
echo "INSTRUCTIONS:"
echo "1. Visit: http://localhost:8000"
echo "2. The API and Frontend are now running together."
echo ""
echo "To stop server: Press CTRL+C"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run FastAPI with Uvicorn
uvicorn api.index:app --reload --host 0.0.0.0 --port 8000
