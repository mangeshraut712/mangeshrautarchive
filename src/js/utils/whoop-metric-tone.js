const TONE_CLASSES = ['metric-green', 'metric-yellow', 'metric-red'];

export function getWhoopMetricTone(metric, value) {
  if (value === null || value === undefined || value === '') return null;
  const score = Number(value);
  if (!Number.isFinite(score)) return null;

  if (metric === 'recovery') {
    if (score >= 67) return 'metric-green';
    if (score >= 34) return 'metric-yellow';
    return 'metric-red';
  }

  if (metric === 'sleep') {
    if (score >= 85) return 'metric-green';
    if (score >= 70) return 'metric-yellow';
    return 'metric-red';
  }

  return null;
}

export function applyWhoopMetricTone(card, metric, value) {
  if (!card) return;
  card.classList.remove(...TONE_CLASSES);
  const tone = getWhoopMetricTone(metric, value);
  if (tone) card.classList.add(tone);
}
