# 🔥 Firebase Database Configuration Check

## ⚠️ The Transport Error Issue

The `WebChannelConnection RPC 'Write' stream transport errored` happens when:

1. **Wrong database name** - Code expects `(default)` but database is named `messages`
2. **Wrong database mode** - Created as "Datastore mode" instead of "Native mode"
3. **Security rules not published** - Rules exist but not applied

---

## 🔍 STEP 1: Check Your Database Configuration

### Go to Firebase Console
https://console.firebase.google.com/project/mangeshrautarchive/firestore

### Check Database Name
Look at the top of the Firestore page - you'll see the database name.

**It should be one of these:**
- `(default)` - Standard name
- `messages` - Custom name
- Something else - Need to update code

**Take a screenshot or note the EXACT name!**

### Check Database Mode
- ✅ **CORRECT**: "Cloud Firestore (Native mode)"
- ❌ **WRONG**: "Cloud Datastore"

**If it says "Cloud Datastore", you need to create a NEW database in Native mode!**

---

## 🔧 STEP 2: Fix Based on Your Database Name

### Option A: Database is named `(default)` ✅
**This is the standard configuration - no changes needed!**

The Vercel backend is already configured for this.

### Option B: Database is named `messages`
**Add environment variable to Vercel:**

1. Go to: https://vercel.com/mangesh-rauts-projects/mangeshrautarchive/settings/environment-variables
2. Click "Add New"
3. Enter:
   - **Key**: `FIREBASE_DATABASE_ID`
   - **Value**: `messages`
   - **Environment**: Production
4. Click "Save"
5. Redeploy Vercel

### Option C: Database has a different name
**Add environment variable with YOUR database name:**

1. Go to Vercel environment variables (link above)
2. Add:
   - **Key**: `FIREBASE_DATABASE_ID`
   - **Value**: `your-database-name-here`
3. Save and redeploy

---

## 🛠️ STEP 3: Verify Security Rules

### Go to Firestore Rules
https://console.firebase.google.com/project/mangeshrautarchive/firestore/rules

### Ensure These Rules Are Set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to create messages
    match /messages/{messageId} {
      allow create: if true;
      allow read, update, delete: if false;
    }
    
    // Deny all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### ⚠️ CRITICAL: Click "Publish" Button!
Rules don't take effect until you click **"Publish"** at the top!

---

## 🆕 STEP 4: Create New Database (If Needed)

### If Your Database Is in "Datastore Mode":

1. **Go to**: https://console.firebase.google.com/project/mangeshrautarchive/firestore
2. Click **"⋮" (three dots)** next to your database name
3. Select **"Create database"**
4. **Database ID**: Leave as `(default)` OR enter `messages`
5. **Location**: Choose closest to your users (e.g., `us-central1`)
6. **Start mode**: Select **"Production mode"**
7. Click **"Create"**

### Then Apply Security Rules (from Step 3)

---

## 🧪 STEP 5: Test the Configuration

### Quick Test Script

```bash
# Test if your database is accessible
curl -X POST https://mangeshrautarchive.vercel.app/api/contact \
  -H "Content-Type: application/json" \
  -H "Origin: https://mangeshraut712.github.io" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Config Test",
    "message": "Testing database configuration"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Message sent successfully!",
  "id": "abc123xyz"
}
```

---

## 📋 Current Setup (Vercel Backend)

### Environment Variables You Need:

**Required:**
- ✅ `GEMINI_FIREBASE_API_KEY` - You already have this!

**Optional (for custom database):**
- ⏸️ `FIREBASE_DATABASE_ID` - Only if database is NOT named `(default)`

### How Backend Works:

```
Frontend
    ↓
POST /api/contact
    ↓
Vercel Backend (api/contact.js)
    ↓
Firebase REST API
    ↓
https://firestore.googleapis.com/v1/projects/mangeshrautarchive/
      databases/{FIREBASE_DATABASE_ID OR (default)}/
      documents/messages
```

---

## 🎯 Action Checklist

- [ ] 1. Check database name in Firebase Console
- [ ] 2. Verify database is in "Native mode" (not Datastore)
- [ ] 3. Confirm security rules are published
- [ ] 4. If database is custom name, add `FIREBASE_DATABASE_ID` to Vercel
- [ ] 5. Redeploy Vercel (if env var added)
- [ ] 6. Test contact form
- [ ] 7. Verify message appears in Firebase

---

## 🆘 Still Getting Errors?

### Check Firestore Rules Match Database Name

In the Firebase Console Rules tab, make sure the rules are applied to the CORRECT database!

If you have multiple databases, you might need to select the right one from the dropdown.

### Check API Key Permissions

1. Go to: https://console.cloud.google.com/apis/credentials?project=mangeshrautarchive
2. Find your API key (starts with `AIzaSy...`)
3. Click "Edit"
4. Under "API restrictions", ensure **Cloud Firestore API** is enabled

### Enable Cloud Firestore API

1. Go to: https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=mangeshrautarchive
2. Click **"Enable"**
3. Wait 1-2 minutes
4. Test again

---

## 📝 What To Share With Me

If it's still not working, share:

1. **Database name** (from Firebase Console)
2. **Database mode** (Native or Datastore?)
3. **Security rules status** (Published?)
4. **Console error** (exact message)
5. **Vercel logs** (from deployment)

---

**Next**: Check your Firebase Console and let me know what database name you see! 🔍
