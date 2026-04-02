function shouldLoadVercelAnalytics() {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname || '';
  const isLocal = ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname);
  if (isLocal) return false;

  return hostname.endsWith('.vercel.app') || hostname.endsWith('mangeshraut.pro');
}

export async function initializeVercelAnalytics() {
  if (!shouldLoadVercelAnalytics()) {
    return;
  }

  try {
    const { inject } = await import('@vercel/analytics');
    inject();
    console.log('✓ Vercel Web Analytics initialized successfully');
  } catch (error) {
    console.warn('⚠ Vercel Web Analytics initialization failed:', error.message);
  }
}
