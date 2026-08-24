# Multi-Calendar OAuth Setup & Configuration Guide

> **Step-by-step instructions for connecting Microsoft Outlook Calendar & Apple iCloud Calendar alongside Google Calendar.**

---

## 1. Microsoft Outlook Calendar & To-Do Setup

### Step 1: Register App in Microsoft Entra ID

1. Navigate to the [Microsoft Entra Admin Center](https://entra.microsoft.com/) (or Azure Portal App Registrations).
2. Click **Applications** → **App registrations** → **New registration**.
3. Set **Name**: `Mangesh Raut Portfolio Calendar`.
4. Set **Supported account types**: `Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)`.
5. Set **Redirect URI**:
   - Platform: `Web`
   - URI: `https://mangeshraut.pro/api/calendar/callback/microsoft` (for local testing: `http://127.0.0.1:4000/api/calendar/callback/microsoft`)
6. Click **Register**.

### Step 2: Create Client Secret & Configure API Permissions

1. Go to **Certificates & secrets** → **New client secret**.
2. Description: `Portfolio Integration Key` → Set expiry (e.g., 24 months) → Click **Add**.
3. **Copy the Secret Value** immediately (it will only be shown once).
4. Go to **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions**:
   - `User.Read`
   - `Calendars.Read`
   - `Calendars.Read.Shared`
   - `Tasks.ReadWrite`
   - `offline_access`
5. Click **Add permissions**.

### Step 3: Run Interactive Setup Script

Run the helper script to securely write credentials to `.env`:

```bash
node scripts/integrations/manual/set-microsoft-calendar-env.mjs
```

Follow the prompts to enter:

- **Client ID**: (Application Client ID from Azure Overview)
- **Client Secret**: (Secret value generated in Step 2)
- **Tenant ID**: `common`

---

## 2. Apple Calendar & iCloud Reminders Setup

### Option A: Direct iCloud CalDAV & Reminders Sync (Recommended)

1. Go to [appleid.apple.com](https://appleid.apple.com/) and sign in with your Apple ID.
2. In the **Sign-In and Security** section, select **App-Specific Passwords**.
3. Click **Generate an app-specific password** and label it `Portfolio Calendar Sync`.
4. Copy the generated password (e.g. `xxxx-xxxx-xxxx-xxxx`).
5. Run the helper script:

```bash
node scripts/integrations/manual/set-apple-calendar-env.mjs
```

Enter:

- **Apple ID / iCloud Email**: `your-email@icloud.com`
- **App-Specific Password**: `xxxx-xxxx-xxxx-xxxx`

### Option B: Sign in with Apple OAuth (Apple Developer Account)

1. In your [Apple Developer Account](https://developer.apple.com/account/resources/identifiers/list), create a **Services ID** (e.g. `pro.mangeshraut.calendar`).
2. Configure **Sign in with Apple** with Domains and Return URLs (`https://mangeshraut.pro/api/calendar/callback/apple`).
3. Create an Auth Key under **Keys**, enable **Sign in with Apple**, and download the `.p8` private key.
4. Set `APPLE_CALENDAR_CLIENT_ID`, `APPLE_CALENDAR_TEAM_ID`, `APPLE_CALENDAR_KEY_ID`, and `APPLE_CALENDAR_PRIVATE_KEY` in `.env`.

---

## 3. Connecting Your Accounts (Owner Authorization)

Once your `.env` variables are configured:

1. **Start the local server:**
   ```bash
   npm run dev
   ```
2. **Generate a secure connect URL:**
   ```bash
   curl -H "x-integration-admin-token: YOUR_ADMIN_TOKEN" http://127.0.0.1:4000/api/integrations/admin/connect-url/microsoft-calendar
   curl -H "x-integration-admin-token: YOUR_ADMIN_TOKEN" http://127.0.0.1:4000/api/integrations/admin/connect-url/apple-calendar
   ```
3. Open the generated URL in your browser and grant permission.
4. The OAuth tokens will be encrypted with AES-256-GCM and saved into your Supabase vault.

---

## 4. Verification & Testing

- Check provider status:
  ```bash
  curl http://127.0.0.1:4000/api/integrations/status
  ```
- Check multi-calendar availability aggregation:
  ```bash
  curl http://127.0.0.1:4000/api/calendar/availability
  ```
- Open [http://127.0.0.1:4000/#contact](http://127.0.0.1:4000/#contact) in your browser to view the multi-calendar schedule grid and reminders section.
