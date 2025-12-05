#!/bin/bash

# Project Cleanup & Organization Script
# Removes duplicates, conflicts, and organizes structure

echo "🧹 Starting Project Cleanup..."

# Create organized directory structure
echo "📁 Creating organized structure..."
mkdir -p src/core/{css,js}
mkdir -p src/themes
mkdir -p src/layout
mkdir -p src/components

# Backup before cleanup
echo "💾 Creating backup..."
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r src/assets/css "$BACKUP_DIR/" 2>/dev/null || true

echo "✅ Backup created at: $BACKUP_DIR"

# Remove .DS_Store files
echo "🗑️  Removing .DS_Store files..."
find . -name ".DS_Store" -type f -delete 2>/dev/null || true

# Remove backup files
echo "🗑️  Removing backup files..."
find src -type f \( -name "*.backup" -o -name "*.old" -o -name "*.tmp" -o -name "*~" \) -delete 2>/dev/null || true

# List CSS files for review
echo ""
echo "📊 CSS Files Analysis:"
echo "====================="
find src/assets/css -name "*.css" -exec wc -l {} + 2>/dev/null | sort -rn | head -20

echo ""
echo "✅ Cleanup Phase 1 Complete!"
echo ""
echo "Next steps:"
echo "1. Review backup at: $BACKUP_DIR"
echo "2. Consolidate CSS files"
echo "3. Remove duplicates"
echo "4. Test thoroughly"
