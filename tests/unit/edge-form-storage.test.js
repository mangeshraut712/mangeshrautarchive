import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from '../../workers/assistme-chat/src/index.js';

const ORIGIN = 'https://mangeshraut712.github.io';
const ENV = {
  ALLOWED_ORIGINS: ORIGIN,
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'server-secret',
};
const ctx = { waitUntil: vi.fn() };

function request(path, body, headers = {}) {
  return new Request(`https://assistme-chat.test${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, ...headers },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Cloudflare edge form storage', () => {
  it('persists a normalized newsletter subscription with acquisition context', async () => {
    const databaseFetch = vi.fn(
      async () =>
        new Response(JSON.stringify([{ id: 'newsletter-id' }]), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
    );
    vi.stubGlobal('fetch', databaseFetch);

    const response = await worker.fetch(
      request('/api/newsletter/subscribe', {
        email: ' Reader@Example.com ',
        source: 'dailydev',
        landingPath: '/mangeshrautarchive/blog/example?utm_source=dailydev',
        referrer: 'https://app.daily.dev/',
        utmSource: 'dailydev',
        utmMedium: 'community',
        utmCampaign: 'example-post',
        website: '',
      }),
      ENV,
      ctx
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      persisted: true,
      id: 'newsletter-id',
    });
    expect(databaseFetch).toHaveBeenCalledOnce();
    const [url, options] = databaseFetch.mock.calls[0];
    expect(url).toContain('/rest/v1/newsletter_subscribers?on_conflict=email');
    expect(JSON.parse(options.body)).toMatchObject({
      email: 'reader@example.com',
      source: 'dailydev',
      landing_path: '/mangeshrautarchive/blog/example?utm_source=dailydev',
      referrer: 'https://app.daily.dev/',
      utm_source: 'dailydev',
      utm_medium: 'community',
      utm_campaign: 'example-post',
    });
  });

  it('persists contact messages instead of opening a mail client', async () => {
    const databaseFetch = vi.fn(
      async () =>
        new Response(JSON.stringify([{ id: 'contact-id' }]), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
    );
    vi.stubGlobal('fetch', databaseFetch);

    const response = await worker.fetch(
      request('/api/contact', {
        name: 'Ada Lovelace',
        email: 'ADA@EXAMPLE.COM',
        subject: 'Architecture review',
        message: 'I would like to discuss the system architecture.',
        source: 'github_pages_contact',
        landingPath: '/mangeshrautarchive/#contact',
        referrer: 'https://github.com/',
        website: '',
      }),
      ENV,
      ctx
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      persisted: true,
      id: 'contact-id',
    });
    const [url, options] = databaseFetch.mock.calls[0];
    expect(url).toContain('/rest/v1/contact_messages');
    expect(JSON.parse(options.body)).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      subject: 'Architecture review',
      message: 'I would like to discuss the system architecture.',
      source: 'github_pages_contact',
    });
  });

  it('returns a storage error instead of a false success when secrets are absent', async () => {
    const response = await worker.fetch(
      request('/api/newsletter/subscribe', {
        email: 'reader@example.com',
        website: '',
      }),
      { ALLOWED_ORIGINS: ORIGIN },
      ctx
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      persisted: false,
    });
  });

  it('rejects invalid contact input before calling storage', async () => {
    const databaseFetch = vi.fn();
    vi.stubGlobal('fetch', databaseFetch);

    const response = await worker.fetch(
      request('/api/contact', {
        name: '',
        email: 'not-an-email',
        subject: '',
        message: '',
        website: '',
      }),
      ENV,
      ctx
    );

    expect(response.status).toBe(400);
    expect(databaseFetch).not.toHaveBeenCalled();
  });

  it('rate limits repeated form writes from one Cloudflare client IP', async () => {
    const databaseFetch = vi.fn(
      async () =>
        new Response(JSON.stringify([{ id: 'stored-id' }]), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
    );
    vi.stubGlobal('fetch', databaseFetch);

    const responses = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      responses.push(
        await worker.fetch(
          request(
            '/api/contact',
            {
              name: 'Rate Test',
              email: 'rate@example.com',
              subject: 'Rate limit',
              message: 'This message verifies the edge submission quota.',
              website: '',
            },
            { 'CF-Connecting-IP': '203.0.113.45' }
          ),
          ENV,
          ctx
        )
      );
    }

    expect(responses.slice(0, 5).every(response => response.status === 200)).toBe(true);
    expect(responses[5].status).toBe(429);
    expect(databaseFetch).toHaveBeenCalledTimes(5);
  });
});
