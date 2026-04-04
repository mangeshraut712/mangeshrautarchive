#!/bin/bash
# API Monitor Startup Script
echo "🚀 Starting API Monitor Backend..."
echo "📊 Monitor Center: http://localhost:8000"
echo "🔗 Frontend: http://localhost:3000/monitor.html"
echo ""

cd api && python3.12 -m uvicorn monitor:app --reload --host 0.0.0.0 --port 8000