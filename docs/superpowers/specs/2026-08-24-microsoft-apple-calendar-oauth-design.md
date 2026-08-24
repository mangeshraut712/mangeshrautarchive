# Multi-Calendar OAuth & Reminders Architecture Specification

> **Date:** 2026-08-24  
> **Status:** Approved & Implemented  
> **Target Providers:** Google Calendar, Microsoft Outlook Calendar & To-Do, Apple iCloud Calendar & Reminders

---

## 1. Executive Summary

This specification defines the unified multi-calendar availability aggregation and reminder synchronization engine for Mangesh Raut's portfolio website. Visitors booking 1:1 consultations now see aggregated free/busy availability across **Google Calendar**, **Microsoft Outlook**, and **Apple iCloud Calendar**, ensuring zero double-booking across personal and professional calendars.

Confirmed bookings automatically trigger:

1. **Google Calendar:** Event with Google Meet link, attendee invitation (`sendUpdates=all`), and owner email/popup reminders.
2. **Microsoft Outlook & To-Do:** Synchronized calendar event via Microsoft Graph API and task item in Microsoft To-Do with scheduled reminder alerts.
3. **Apple Calendar & Reminders:** One-click `.ics` RFC 5545 `VEVENT` and `VTODO` export with display alarms (`VALARM`) and direct CalDAV sync capabilities.

---

## 2. Security & Token Vault Architecture

- **Token Storage:** All OAuth access tokens, refresh tokens, and encrypted app credentials are stored in Supabase under the `integration_tokens` table.
- **Encryption:** Tokens are encrypted at rest using AES-256-GCM authenticated encryption via `api/integrations/token_crypto.py`.
- **Server-Side Exclusivity:** Client browsers receive only public free/busy availability and confirmed booking status. No OAuth tokens, client secrets, or private event descriptions are ever exposed to the client.
- **RLS Policy:** Supabase tables enforce Row Level Security with service-role-only access.

---

## 3. Provider Integration Specifications

### 3.1 Microsoft Graph API (Outlook Calendar & To-Do)

- **Identity Endpoint:** `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
- **Token Endpoint:** `https://login.microsoftonline.com/common/oauth2/v2.0/token`
- **Graph API Endpoints:**
  - Free/Busy Schedule: `POST https://graph.microsoft.com/v1.0/me/calendar/getSchedule`
  - Event Creation: `POST https://graph.microsoft.com/v1.0/me/events`
  - Task & Reminder: `POST https://graph.microsoft.com/v1.0/me/todo/lists/tasks/tasks`
- **OAuth Scopes:** `offline_access`, `User.Read`, `Calendars.Read`, `Calendars.Read.Shared`, `Tasks.ReadWrite`

### 3.2 Apple Calendar & iCloud Reminders

- **Sign in with Apple OAuth:** `https://appleid.apple.com/auth/authorize` with ES256 PKCS#8 signed JWT client secrets.
- **CalDAV Sync:** `https://caldav.icloud.com/` for RFC 4791 `free-busy-query` and RFC 5545 `VTODO` reminders.
- **Fallback .ics Generation:** In-browser RFC 5545 `BEGIN:VCALENDAR` and `BEGIN:VTODO` bundle with 30-minute display alarms.

---

## 4. Availability Aggregation Algorithm

When `GET /api/calendar/availability` is requested:

1. All connected providers are queried concurrently (`asyncio.gather`).
2. Free/busy intervals are extracted and mapped by date (`YYYY-MM-DD`).
3. If an interval is marked busy in **any** connected calendar (Google, Microsoft, or Apple), that interval is unioned into the combined busy block list.
4. Bookable slots are calculated only for slots that fall within working hours (10:00–16:00 ET, weekdays) and do not overlap with any busy block.
