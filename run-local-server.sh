#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       🚀 Starting Mangesh Raut Portfolio - Local Server      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📁 Serving from: $(pwd)/src/"
echo "🌐 Local URL: http://localhost:8000"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Server starting..."
echo ""
echo "INSTRUCTIONS:"
echo "1. Visit: http://localhost:8000"
echo "2. Look for chatbot icon (bottom-right)"
echo "3. Click to test functionality"
echo ""
echo "To stop server: Press CTRL+C"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd src && python3 -m http.server 8000
