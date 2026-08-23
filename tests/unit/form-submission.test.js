import { describe, expect, it, vi } from 'vitest';
import {
  getFormsApiBase,
  getSubmissionContext,
  submitStoredForm,
} from '../../src/js/services/form-submission.js';

describe('stored form submission helpers', () => {
  it('uses the Cloudflare Worker for GitHub Pages and local API for development', () => {
    expect(getFormsApiBase({ hostname: 'mangeshraut712.github.io' })).toBe(
      'https://assistme-chat.mangeshraut712.workers.dev'
    );
    expect(getFormsApiBase({ hostname: '127.0.0.1' })).toBe('http://127.0.0.1:8001');
    expect(getFormsApiBase({ hostname: 'localhost' })).toBe('http://127.0.0.1:8001');
    expect(getFormsApiBase({ hostname: 'example.vercel.app' })).toBe('');
  });

  it('captures daily.dev attribution without leaking unrelated query fields', () => {
    const context = getSubmissionContext({
      source: 'blog_newsletter',
      location: {
        pathname: '/mangeshrautarchive/blog/example',
        search: '?utm_source=dailydev&utm_medium=community&utm_campaign=route-test&private=value',
        hash: '#section',
      },
      referrer: 'https://app.daily.dev/posts/123',
    });

    expect(context).toEqual({
      source: 'dailydev',
      landingPath:
        '/mangeshrautarchive/blog/example?utm_source=dailydev&utm_medium=community&utm_campaign=route-test#section',
      referrer: 'https://app.daily.dev/posts/123',
      utmSource: 'dailydev',
      utmMedium: 'community',
      utmCampaign: 'route-test',
    });
    expect(JSON.stringify(context)).not.toContain('private=value');
  });

  it('requires a persisted success response', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ success: true, persisted: false, message: 'soft accepted' }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
    );

    await expect(
      submitStoredForm('/api/newsletter/subscribe', { email: 'reader@example.com' }, { fetchImpl })
    ).rejects.toThrow('Subscription could not be saved');
  });

  it('returns the stored response for a real persistence success', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ success: true, persisted: true, id: 'stored-id' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
    );

    await expect(
      submitStoredForm('/api/contact', { name: 'Ada' }, { fetchImpl })
    ).resolves.toMatchObject({ persisted: true, id: 'stored-id' });
  });
});
