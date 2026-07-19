#!/usr/bin/env node
/**
 * Verify local build readiness and remote deployment sync between GitHub Pages and Vercel.
 *
 * Usage:
 *   node scripts/deployment/verify-deployment-sync.js
 *   node scripts/deployment/verify-deployment-sync.js --remote
 *   node scripts/deployment/verify-deployment-sync.js --remote --commit=<sha>
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const CONFIG = {
  githubPagesUrl: 'https://mangeshraut712.github.io/mangeshrautarchive/',
  vercelProductionUrl: 'https://mangeshraut.pro/',
  vercelPreviewUrl: 'https://mraut.vercel.app/',
  distDir: './dist',
  buildConfigFile: './dist/build-config.json',
  requestTimeoutMs: 10_000,
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, type = 'info') {
  const prefix = `[${new Date().toISOString().split('T')[1].split('.')[0]}]`;
  const palette = {
    success: colors.green,
    warning: colors.yellow,
    error: colors.red,
    info: colors.blue,
  };
  const icon = type === 'success' ? '✓' : type === 'warning' ? '⚠' : type === 'error' ? '✗' : 'ℹ';
  console.log(`${palette[type] || colors.blue}${prefix} ${icon} ${message}${colors.reset}`);
}

function parseArgs(argv) {
  const args = { remote: false, commit: '', parity: false, retries: 20, waitSeconds: 15 };
  for (const arg of argv) {
    if (arg === '--remote') args.remote = true;
    else if (arg === '--parity') args.parity = true;
    else if (arg.startsWith('--commit=')) args.commit = arg.slice('--commit='.length);
    else if (arg.startsWith('--retries=')) args.retries = Number(arg.slice('--retries='.length));
    else if (arg.startsWith('--wait=')) args.waitSeconds = Number(arg.slice('--wait='.length));
  }
  return args;
}

function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

function getBuildInfo() {
  try {
    if (fs.existsSync(CONFIG.buildConfigFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.buildConfigFile, 'utf8'));
    }
  } catch (error) {
    log(`Error reading build config: ${error.message}`, 'error');
  }
  return null;
}

function checkLocalBuild() {
  log('Checking local build...', 'info');

  if (!fs.existsSync(CONFIG.distDir)) {
    log('Dist directory not found. Run "npm run build" first.', 'error');
    return false;
  }

  const requiredFiles = ['index.html', 'build-config.json', 'travel.html', 'monitor.html'];
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(CONFIG.distDir, file))) {
      log(`Missing required file: ${file}`, 'error');
      return false;
    }
  }

  const buildInfo = getBuildInfo();
  if (buildInfo) {
    log(`Build time: ${buildInfo.buildTime}`, 'info');
    log(`Git commit: ${buildInfo.gitCommit || 'unknown'}`, 'info');
  }

  log('Local build verified', 'success');
  return true;
}

function checkGitStatus() {
  log('Checking Git status...', 'info');

  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    if (status) {
      log('Uncommitted changes detected', 'warning');
      console.log(status);
      return false;
    }

    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    const [behindRaw, aheadRaw] = execSync(
      `git rev-list --left-right --count origin/${branch}...${branch}`,
      {
        encoding: 'utf8',
      }
    )
      .trim()
      .split('\t');
    const behind = Number(behindRaw || 0);
    const ahead = Number(aheadRaw || 0);

    if (behind > 0) {
      log(`Local branch is ${behind} commits behind origin/${branch}`, 'error');
      return false;
    }

    if (ahead > 0) {
      log(`Local branch is ${ahead} commits ahead of origin/${branch}`, 'warning');
      return false;
    }

    log('Git repository is synchronized', 'success');
    return true;
  } catch (error) {
    log(`Git check error: ${error.message}`, 'error');
    return false;
  }
}

async function fetchBuildConfig(baseUrl) {
  const configUrl = new URL('build-config.json', baseUrl).toString();
  const response = await fetch(configUrl, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(CONFIG.requestTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`${configUrl} returned HTTP ${response.status}`);
  }

  return response.json();
}

async function probeSurfaceAvailability(baseUrl) {
  try {
    const healthUrl = new URL('api/health', baseUrl).toString();
    const response = await fetch(healthUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(CONFIG.requestTimeoutMs),
    });
    const body = await response.text().catch(() => '');
    if (response.status === 402 || /DEPLOYMENT_DISABLED|fair use|Payment required/i.test(body)) {
      return { available: false, reason: `DEPLOYMENT_DISABLED (HTTP ${response.status})` };
    }
    if (response.ok) {
      return { available: true, reason: `HTTP ${response.status}` };
    }
    // Fall through to build-config probe for static hosts without /api/health.
  } catch {
    // ignore and try build-config
  }

  try {
    await fetchBuildConfig(baseUrl);
    return { available: true, reason: 'build-config ok' };
  } catch (error) {
    const message = error?.message || String(error);
    if (/HTTP 402|DEPLOYMENT_DISABLED/i.test(message)) {
      return { available: false, reason: message };
    }
    return { available: false, reason: message };
  }
}

async function fetchPageTitle(baseUrl, pagePath = '') {
  const pageUrl = new URL(pagePath, baseUrl).toString();
  const response = await fetch(pageUrl, {
    cache: 'no-store',
    signal: AbortSignal.timeout(CONFIG.requestTimeoutMs),
  });
  if (!response.ok) {
    throw new Error(`${pageUrl} returned HTTP ${response.status}`);
  }
  const html = await response.text();
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim() || '';
}

async function verifyRemoteSync(options) {
  const vercelProbe = await probeSurfaceAvailability(CONFIG.vercelProductionUrl);
  const vercelRequired = vercelProbe.available;
  if (!vercelRequired) {
    log(
      `Vercel production unavailable (${vercelProbe.reason}) — treating as optional while fair-use/DEPLOYMENT_DISABLED`,
      'warning'
    );
  }

  const surfaces = [
    { name: 'GitHub Pages', url: CONFIG.githubPagesUrl, required: true },
    {
      name: 'Vercel Production',
      url: CONFIG.vercelProductionUrl,
      required: vercelRequired,
    },
    { name: 'Vercel Preview', url: CONFIG.vercelPreviewUrl, required: false },
  ];

  const expectedCommit = options.parity
    ? ''
    : options.commit ||
      process.env.GITHUB_SHA ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

  if (options.parity) {
    if (!vercelRequired) {
      log('Parity mode: Vercel disabled — verifying GitHub Pages commit presence only', 'info');
    } else {
      log(
        'Parity mode: requiring GitHub Pages and Vercel production to share the same commit',
        'info'
      );
    }
  } else {
    log(`Expected deployment commit: ${expectedCommit}`, 'info');
  }

  for (let attempt = 1; attempt <= options.retries; attempt += 1) {
    const results = [];
    let allRequiredSynced = true;

    for (const surface of surfaces) {
      if (surface.name.startsWith('Vercel') && !vercelRequired) {
        results.push({
          ...surface,
          synced: true,
          config: null,
          homeTitle: '',
          travelTitle: '',
          monitorTitle: '',
          error: vercelProbe.reason,
          skipped: true,
        });
        continue;
      }

      try {
        const [config, homeTitle, travelTitle, monitorTitle] = await Promise.all([
          fetchBuildConfig(surface.url),
          fetchPageTitle(surface.url),
          fetchPageTitle(surface.url, 'travel.html'),
          fetchPageTitle(surface.url, 'monitor.html'),
        ]);

        const synced = options.parity
          ? Boolean(config.gitCommit)
          : config.gitCommit === expectedCommit;
        results.push({
          ...surface,
          synced,
          config,
          homeTitle,
          travelTitle,
          monitorTitle,
          error: null,
        });

        if (surface.required && !synced) {
          allRequiredSynced = false;
        }
      } catch (error) {
        results.push({ ...surface, synced: false, error: error.message });
        if (surface.required) {
          allRequiredSynced = false;
        }
      }
    }

    if (options.parity) {
      const githubPages = results.find(
        result => result.name === 'GitHub Pages' && result.config?.gitCommit
      );
      const vercelProd = results.find(
        result => result.name === 'Vercel Production' && result.config?.gitCommit
      );
      if (!vercelRequired && githubPages) {
        allRequiredSynced = true;
        log(
          `Pages-only mode: GitHub Pages ${githubPages.config.gitCommit} (Vercel skipped)`,
          'success'
        );
      } else if (githubPages && vercelProd) {
        const parityOk = githubPages.config.gitCommit === vercelProd.config.gitCommit;
        allRequiredSynced = parityOk;
        log(
          `Cross-surface parity: GitHub Pages ${githubPages.config.gitCommit} · Vercel ${vercelProd.config.gitCommit}`,
          parityOk ? 'success' : 'warning'
        );
      }
    }

    for (const result of results) {
      if (result.skipped) {
        log(`${result.name}: skipped (${result.error})`, 'info');
        continue;
      }
      if (result.error) {
        log(`${result.name}: unavailable (${result.error})`, result.required ? 'warning' : 'info');
        continue;
      }

      const status = result.synced ? 'success' : 'warning';
      log(
        `${result.name}: commit ${result.config.gitCommit || 'missing'} · home "${result.homeTitle}" · travel "${result.travelTitle}" · monitor "${result.monitorTitle}"`,
        status
      );
    }

    if (allRequiredSynced) {
      log(
        vercelRequired
          ? 'GitHub Pages and Vercel production are synchronized'
          : 'GitHub Pages deployment verified (Vercel optional/disabled)',
        'success'
      );
      return true;
    }

    if (attempt < options.retries) {
      log(
        `Required surfaces not synced yet. Retrying in ${options.waitSeconds}s (${attempt}/${options.retries})...`,
        'warning'
      );
      await sleep(options.waitSeconds);
    }
  }

  log('Deployment sync verification timed out', 'error');
  return false;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  console.log('\n' + '='.repeat(70));
  log('DEPLOYMENT SYNCHRONIZATION VERIFIER', 'info');
  console.log('='.repeat(70) + '\n');

  if (options.remote) {
    const synced = await verifyRemoteSync(options);
    process.exit(synced ? 0 : 1);
  }

  const localOk = checkLocalBuild() && checkGitStatus();
  process.exit(localOk ? 0 : 1);
}

main().catch(error => {
  log(error.message || String(error), 'error');
  process.exit(1);
});
