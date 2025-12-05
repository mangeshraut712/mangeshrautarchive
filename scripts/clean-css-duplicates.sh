#!/bin/bash

# CSS Duplicate Removal Progress Tracker

echo "🧹 Removing duplicates from all page CSS files..."
echo ""

# Array of files to clean
files=(
    "about.css"
    "experience.css"
    "education.css"
    "blog.css"
    "publications.css"
    "awards.css"
    "recommendations.css"
    "certifications.css"
    "calendar.css"
)

total=${#files[@]}
current=0

for file in "${files[@]}"; do
    current=$((current + 1))
    echo "[$current/$total] Checking src/assets/css/$file..."
    
    # Run stylelint to check for issues
    npx stylelint "src/assets/css/$file" --fix 2>&1 | grep -v "^$" || echo "  ✅ No issues found"
    
    echo ""
done

echo "✅ All files checked and cleaned!"
echo ""
echo "Summary:"
wc -l src/assets/css/*.css | grep -E "(about|experience|education|blog|publications|awards|recommendations|certifications|calendar)" | sort -n
