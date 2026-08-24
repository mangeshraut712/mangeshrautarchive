# Google Calendar Booking and Reminder Design

## Goal

Restore the Contact page's Apple-style calendar, event/reminder sections, and integrated Calendly fallback while backing all displayed availability and booking state with the live Google Calendar flow on the active GitHub Pages + Cloudflare Worker architecture.

## Selected approach

Use Google Calendar rather than Gmail as the delivery system. Google Calendar creates the event, adds the visitor as an attendee, and sends the invitation with `sendUpdates=all`. The event overrides owner reminders with an email reminder 24 hours before and a popup 30 minutes before. No Gmail mailbox scope is requested.

OAuth runs on the Cloudflare Worker. Access and refresh tokens are encrypted with the existing integration encryption key and stored in the existing Supabase token vault. Reconnection requires a short-lived signed owner link requested locally with a rotated integration admin secret; no admin secret or signed connection URL is written to repository files or public Actions logs.

## Availability contract

- Public availability returns only bookable slots, never event titles or attendee details.
- Slots are 30 minutes in `America/New_York` on weekdays between 10:00 and 16:00.
- Availability covers the next 14 days, begins at least 24 hours from now, and excludes Google free/busy intervals.
- Each slot includes an HMAC-signed token containing start, end, and expiry. The booking endpoint accepts only a valid signed slot.
- Booking rechecks Google free/busy immediately before event creation.

## Booking contract

The visitor supplies name, email, topic, and the signed slot token. The Worker validates lengths, email format, honeypot, origin, rate limits, signature, booking window, and current free/busy state. It then reserves the slot in `calendar_bookings`, creates a private Google Calendar event with a Meet link request, attendee invitation, and owner reminders, and marks the audit row confirmed.

If Google rejects event creation, the reservation is marked failed and the UI receives a truthful error. A unique confirmed/pending slot constraint prevents duplicate bookings. The browser receives the confirmed start/end and event status but not OAuth tokens or private calendar data.

## Contact UI

- Restore the navigable Apple-style month grid. Availability dots come only from signed Google free slots; private busy-event details never render.
- Selecting a day filters the live slot list to that date.
- Restore an Events section that is empty before booking and shows only the meeting confirmed by the current visitor during the current session.
- Restore a Reminders section backed by the actual booking policy: attendee invitation email, owner email reminder at 24 hours, owner popup reminder at 30 minutes, and Apple/Outlook fallback availability after confirmation.
- Show times in the visitor's locale while retaining `ET` in accessible copy.
- Selecting a slot reveals name, email, and topic fields.
- Successful booking shows that a Google Calendar invitation was emailed.
- When Calendar needs owner reauthorization, visitors see a direct-email fallback rather than fake availability.
- Restore the original integrated Calendly panel and popup as a separate scheduling fallback without making it the source of Google availability.

## Apple Calendar and Outlook compatibility

Google remains the organizer and source of truth. Its attendee email invitation can be accepted by accounts connected to Apple Calendar or Outlook. After a successful booking, the confirmation also offers **Add to Apple Calendar** and **Add to Outlook** actions that generate the same RFC 5545 `.ics` event locally in the browser. The file contains the confirmed UTC start/end, private consultation title, Google Meet URL when available, and a 30-minute display alarm. No Apple ID, Microsoft account, mailbox permission, or additional OAuth token is requested or stored.

## Security

- Google credentials, OAuth tokens, Supabase service-role keys, and integration admin tokens remain server-only.
- Calendar scopes are limited to `calendar.events.owned` and `calendar.freebusy`.
- Booking tables have RLS enabled, no anonymous/authenticated grants, and service-role-only access.
- Event visibility is private and guest modification/inviting is disabled.
- No event descriptions, titles, or attendee information are exposed by availability responses.

## Verification

- Unit tests prove signed-slot validation, slot generation, conflict rejection, event payload/reminders, OAuth exchange, refresh, and database state transitions.
- Playwright verifies month navigation, real availability dots, day filtering, session event/reminder state, Calendly fallback, booking success/failure, Apple/Outlook actions, and mobile fit.
- Supabase MCP verifies schema, RLS, grants, advisors, and test-row cleanup.
- Live verification creates one synthetic event/booking, confirms Calendar API success and Supabase state, deletes the event and booking, and leaves no test data.
