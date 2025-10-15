#!/bin/bash

# Firebase Database Configuration Checker
# This script helps you identify and fix the transport error

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║    🔥 Firebase Database Configuration Checker 🔥            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo "This will help you fix the transport error!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1
echo "📋 STEP 1: Check Your Firebase Database"
echo ""
echo "1. Open this URL in your browser:"
echo "   👉 https://console.firebase.google.com/project/mangeshrautarchive/firestore"
echo ""
echo "2. Look at the TOP of the Firestore page"
echo ""
echo "3. You'll see the database name - it could be:"
echo "   • (default)      ← Most common"
echo "   • messages       ← Custom name"
echo "   • something else ← Your custom name"
echo ""
read -p "❓ What is your database name? Enter it here: " DB_NAME
echo ""

if [ -z "$DB_NAME" ]; then
    echo "❌ No database name entered. Exiting..."
    exit 1
fi

echo "✅ You entered: '$DB_NAME'"
echo ""

# Step 2
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 STEP 2: Check Database Mode"
echo ""
echo "In the Firebase Console, does it say:"
echo "   A) Cloud Firestore (Native mode) ✅"
echo "   B) Cloud Datastore ❌"
echo ""
read -p "❓ Enter A or B: " DB_MODE
echo ""

if [ "$DB_MODE" = "B" ] || [ "$DB_MODE" = "b" ]; then
    echo "❌ PROBLEM: Your database is in Datastore mode!"
    echo ""
    echo "🔧 FIX: You need to create a NEW database in Native mode:"
    echo ""
    echo "   1. In Firebase Console, click '⋮' (three dots) next to database name"
    echo "   2. Select 'Create database'"
    echo "   3. Name it: (default) or messages"
    echo "   4. Select location: us-central1 (or closest to you)"
    echo "   5. Choose 'Production mode'"
    echo "   6. Click 'Create'"
    echo ""
    echo "Then run this script again!"
    exit 1
fi

echo "✅ Great! Your database is in Native mode."
echo ""

# Step 3
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 STEP 3: Configuration Instructions"
echo ""

if [ "$DB_NAME" = "(default)" ]; then
    echo "✅ GOOD NEWS: Your database is named '(default)'"
    echo ""
    echo "🎯 NO CHANGES NEEDED in Vercel environment variables!"
    echo ""
    echo "Just redeploy Vercel and it will work."
else
    echo "⚠️ Your database is named: '$DB_NAME'"
    echo ""
    echo "🔧 YOU NEED TO ADD AN ENVIRONMENT VARIABLE:"
    echo ""
    echo "1. Go to Vercel:"
    echo "   👉 https://vercel.com/mangesh-rauts-projects/mangeshrautarchive/settings/environment-variables"
    echo ""
    echo "2. Click 'Add New'"
    echo ""
    echo "3. Enter:"
    echo "   Key: FIREBASE_DATABASE_ID"
    echo "   Value: $DB_NAME"
    echo "   Environment: Production"
    echo ""
    echo "4. Click 'Save'"
    echo ""
fi

# Step 4
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 STEP 4: Security Rules"
echo ""
echo "1. Go to Rules tab:"
echo "   👉 https://console.firebase.google.com/project/mangeshrautarchive/firestore/rules"
echo ""
echo "2. Make sure you have these rules:"
echo ""
echo "   rules_version = '2';"
echo "   service cloud.firestore {"
echo "     match /databases/{database}/documents {"
echo "       match /messages/{messageId} {"
echo "         allow create: if true;"
echo "         allow read, update, delete: if false;"
echo "       }"
echo "       match /{document=**} {"
echo "         allow read, write: if false;"
echo "       }"
echo "     }"
echo "   }"
echo ""
echo "3. ⚠️ CRITICAL: Click the 'Publish' button at the top!"
echo "   (Rules don't work until published!)"
echo ""
read -p "❓ Have you published the rules? (y/n): " RULES_PUBLISHED
echo ""

if [ "$RULES_PUBLISHED" != "y" ] && [ "$RULES_PUBLISHED" != "Y" ]; then
    echo "⚠️ Please publish the rules first, then continue!"
    echo ""
fi

# Step 5
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 STEP 5: Redeploy Vercel"
echo ""
echo "1. Go to Vercel:"
echo "   👉 https://vercel.com/mangesh-rauts-projects/mangeshrautarchive"
echo ""
echo "2. Click 'Deployments' tab"
echo ""
echo "3. Click 'Redeploy' on latest deployment"
echo ""
echo "4. ✅ UNCHECK 'Use existing Build Cache'"
echo ""
echo "5. Click 'Redeploy'"
echo ""
echo "6. Wait 2-3 minutes"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ SUMMARY"
echo ""
echo "Database Name: $DB_NAME"
echo "Database Mode: Native mode ✅"

if [ "$DB_NAME" = "(default)" ]; then
    echo "Vercel Env Var: Not needed ✅"
else
    echo "Vercel Env Var: FIREBASE_DATABASE_ID = $DB_NAME"
fi

echo ""
echo "🎯 NEXT STEPS:"
if [ "$DB_NAME" != "(default)" ]; then
    echo "   1. Add FIREBASE_DATABASE_ID to Vercel"
fi
echo "   2. Publish security rules"
echo "   3. Redeploy Vercel"
echo "   4. Wait 5 minutes"
echo "   5. Hard refresh browser (Ctrl+F5)"
echo "   6. Test contact form"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Configuration check complete!"
echo ""
