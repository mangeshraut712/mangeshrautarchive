import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  context: async ({ context }, use) => {
    if (process.env.PORTFOLIO_LOCAL_ONLY === '1') {
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return route.continue();
        return route.abort('blockedbyclient');
      });
    }
    await use(context);
  },
});
export { expect };
