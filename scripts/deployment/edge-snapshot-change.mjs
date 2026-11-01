import { isDeepStrictEqual } from 'node:util';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeEdgeSnapshotForComparison(snapshot) {
  const normalized = structuredClone(snapshot);

  // These fields only describe when an export or read-only API response ran.
  // They do not represent a snapshot change that needs maintainer review.
  delete normalized.exportedAt;
  if (isRecord(normalized.reach)) {
    delete normalized.reach.timestamp;
    if (isRecord(normalized.reach.insights)) {
      delete normalized.reach.insights.last_updated;
    }
  }
  if (isRecord(normalized.healthVitals)) {
    delete normalized.healthVitals.timestamp;
    if (isRecord(normalized.healthVitals.refresh)) {
      delete normalized.healthVitals.refresh.ageMinutes;
    }
  }

  return normalized;
}

export function hasMeaningfulEdgeSnapshotChange(existingSnapshot, candidateSnapshot) {
  if (!existingSnapshot) return true;

  return !isDeepStrictEqual(
    normalizeEdgeSnapshotForComparison(existingSnapshot),
    normalizeEdgeSnapshotForComparison(candidateSnapshot)
  );
}
