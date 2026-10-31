#!/usr/bin/env node
/**
 * Synchronize live GitHub repository statistics and cache them in static JSON.
 * Sourced directly from GitHub REST / GraphQL API for lightning-fast edge loads.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');
const OUTPUT_FILE = path.join(ROOT_DIR, 'src/js/data/github-stats.json');

const USERNAME = 'mangeshraut712';
const GITHUB_TOKEN =
  process.env.GH_TOKEN || process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || '';

function readDefaultStatsPayload() {
  try {
    return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

function writeDefaultStatsPayload(payload) {
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
}

export function hasGitHubStatsChanged(existingPayload, nextPayload) {
  if (!existingPayload) return true;

  const { lastSyncedAt: _existingLastSyncedAt, ...existingStats } = existingPayload;
  const { lastSyncedAt: _nextLastSyncedAt, ...nextStats } = nextPayload;
  return JSON.stringify(existingStats) !== JSON.stringify(nextStats);
}

export async function syncGitHubStats({
  fetchImpl = globalThis.fetch,
  now = () => new Date().toISOString(),
  readStats = readDefaultStatsPayload,
  writeStats = writeDefaultStatsPayload,
  hasExistingStats = () => fs.existsSync(OUTPUT_FILE),
} = {}) {
  console.log(`[github-sync] Fetching live stats for @${USERNAME}...`);

  const headers = {
    'User-Agent': 'mangeshraut-portfolio-sync/1.0',
    Accept: 'application/vnd.github.v3+json',
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
    console.log('[github-sync] Authenticated request with GitHub token.');
  } else {
    console.log('[github-sync] Unauthenticated request (subject to public rate limits).');
  }

  try {
    // 1. Fetch user profile stats
    const userRes = await fetchImpl(`https://api.github.com/users/${USERNAME}`, { headers });
    if (!userRes.ok) {
      throw new Error(`Failed to fetch user profile: HTTP ${userRes.status}`);
    }
    const userData = await userRes.json();

    // 2. Fetch public repositories (up to 100)
    const reposRes = await fetchImpl(
      `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`,
      { headers }
    );
    if (!reposRes.ok) {
      throw new Error(`Failed to fetch user repos: HTTP ${reposRes.status}`);
    }
    const reposData = await reposRes.json();

    const totalStars = reposData.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0);
    const totalForks = reposData.reduce((acc, repo) => acc + (repo.forks_count || 0), 0);

    const curatedRepos = reposData
      .filter(repo => !repo.fork && !repo.archived)
      .slice(0, 12)
      .map(repo => ({
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description || '',
        url: repo.html_url,
        homepage: repo.homepage || null,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language || 'Code',
        topics: repo.topics || [],
        updatedAt: repo.updated_at,
      }));

    const statsPayload = {
      username: USERNAME,
      lastSyncedAt: now(),
      publicReposCount: userData.public_repos || reposData.length,
      followersCount: userData.followers || 0,
      followingCount: userData.following || 0,
      totalStars,
      totalForks,
      repositories: curatedRepos,
    };

    const existingPayload = readStats();
    if (!hasGitHubStatsChanged(existingPayload, statsPayload)) {
      console.log('[github-sync] Public GitHub stats are unchanged; keeping the existing cache.');
      return { changed: false, payload: existingPayload };
    }

    writeStats(statsPayload);
    console.log('[github-sync] Successfully written GitHub stats cache');
    console.log(
      `[github-sync] Total stars: ${totalStars} | Public Repos: ${userData.public_repos}`
    );
    return { changed: true, payload: statsPayload };
  } catch (err) {
    console.warn(`[github-sync] Warning: Could not complete live sync (${err.message}).`);
    if (!hasExistingStats()) {
      // Fallback default snapshot
      const fallback = {
        username: USERNAME,
        lastSyncedAt: now(),
        publicReposCount: 25,
        followersCount: 15,
        totalStars: 42,
        totalForks: 12,
        repositories: [],
      };
      writeStats(fallback);
      return { changed: true, payload: fallback };
    }

    return { changed: false, payload: readStats() };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await syncGitHubStats();
}
