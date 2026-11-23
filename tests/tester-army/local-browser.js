export async function isolateBrowser({ browser }) {
  if (process.env.PORTFOLIO_LOCAL_ONLY !== '1') throw new Error('Use the isolated test runner.');
  await browser.route('**/*', route => {
    const url = new URL(route.request.url);
    return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      ? route.continue()
      : route.abort();
  });
}
