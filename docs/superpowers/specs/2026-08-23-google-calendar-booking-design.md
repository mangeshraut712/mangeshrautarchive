# Google Calendar Booking and Reminder Design

## Goal

Replace the Contact page's fictional calendar/reminders and Calendly popup with real availability and booking backed by Mangesh's primary Google Calendar on the active GitHub Pages + Cloudflare Worker architecture.

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

- Replace hard-coded event dots and fake reminder cards with a connection status and real slot list.
- Show times in the visitor's locale while retaining `ET` in accessible copy.
- Selecting a slot reveals name, email, and topic fields.
- Successful booking shows that a Google Calendar invitation was emailed.
- When Calendar needs owner reauthorization, visitors see a direct-email fallback rather than fake availability.
- Retire the Calendly runtime dependency from this widget.

## Security

- Google credentials, OAuth tokens, Supabase service-role keys, and integration admin tokens remain server-only.
- Calendar scopes are limited to `calendar.events.owned` and `calendar.freebusy`.
- Booking tables have RLS enabled, no anonymous/authenticated grants, and service-role-only access.
- Event visibility is private and guest modification/inviting is disabled.
- No event descriptions, titles, or attendee information are exposed by availability responses.

## Verification

- Unit tests prove signed-slot validation, slot generation, conflict rejection, event payload/reminders, OAuth exchange, refresh, and database state transitions.
- Playwright verifies connection, slot selection, booking success/failure, mobile fit, and removal of fake reminder content.
- Supabase MCP verifies schema, RLS, grants, advisors, and test-row cleanup.
- Live verification creates one synthetic event/booking, confirms Calendar API success and Supabase state, deletes the event and booking, and leaves no test data.
