# GitHub Pages Newsletter and Contact Design

## Goal

Make GitHub Pages the temporary canonical publishing surface and guarantee that newsletter subscriptions and contact messages are persisted through the existing Cloudflare Worker into Supabase.

## Architecture

The browser sends JSON only to `https://assistme-chat.mangeshraut712.workers.dev`. The Worker validates origin, payload type, field lengths, email format, and a honeypot before using its server-only Supabase service-role credential. The browser never receives a database key. FastAPI remains compatible for a future Vercel return but is not the active Pages write path.

Supabase stores subscriptions in `newsletter_subscribers` and messages in `contact_messages`. Both tables have RLS enabled, no `anon` or `authenticated` privileges, and explicit `service_role` access. A database failure returns an error; the UI must never report a non-persisted submission as successful.

## User Experience

- The existing homepage newsletter form remains.
- The standalone blog index and every standalone article include a compact newsletter form.
- Newsletter forms promise subscriber capture only and include concise privacy text.
- The contact form saves the message directly instead of opening a mail client.
- Successful responses reset the form and confirm that the record was saved.
- Failed responses preserve the submitted values and provide a direct-email fallback.
- Forms include a visually hidden honeypot field and disable submission while a request is active.

## Publishing and Attribution

- GitHub Pages is the canonical fallback used by local/build defaults while `mangeshraut.pro` is unavailable.
- Blog pages include `twitter:creator`, large image previews, article-specific social images, RSS/Atom discovery, and BlogPosting image metadata.
- Newsletter records include source, landing path, referrer, and UTM fields so daily.dev conversion can be measured without storing unnecessary browsing history.

## Security and Privacy

- Supabase service-role credentials stay only in Cloudflare Worker secrets.
- Tables deny direct browser access and rely on the Worker as the only public write boundary.
- Input length limits are enforced in the browser, Worker, and database constraints.
- Worker responses never expose upstream database bodies or credentials.
- Logs contain record IDs and status only, never message bodies or email addresses.
- Synthetic verification records use `example.com` addresses and are removed after live validation.

## Verification

- Unit tests exercise valid writes, invalid input, missing storage configuration, upstream failures, attribution normalization, and honeypot behavior.
- API tests retain FastAPI validation coverage.
- Playwright verifies newsletter forms on the blog index/article and the contact form on mobile and desktop.
- Supabase MCP verifies table structure, RLS, grants, advisors, and synthetic write cleanup.
- GitHub Actions must pass for the exact deployed commit before completion is reported.
