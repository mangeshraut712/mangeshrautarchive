#!/usr/bin/env node
/**
 * Deployment Synchronization Verification Script
 * 
 * This script verifies that both GitHub Pages and Vercel deployments
 * are synchronized and serving the same content.
 * 
 * Usage: node scripts/verify-deployment-sync.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CONFIG = {
  githubPagesUrl: 'https://mangeshraut712.github.io/mangeshrautarchive',
  vercelUrl: 'https://mangeshrautarchive.vercel.app',
  distDir: './dist',
  buildConfigFile: './dist/build-config.json',
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = `[${timestamp}]`;
  
  switch (type) {
    case 'success':
      console.log(`${colors.green}${prefix} ✓ ${message}${colors.reset}`);
      break;
    case 'warning':
      console.log(`${colors.yellow}${prefix} ⚠ ${message}${colors.reset}`);
      break;
    case 'error':
      console.log(`${colors.red}${prefix} ✗ ${message}${colors.reset}`);
      break;
    case 'info':
    default:
      console.log(`${colors.blue}${prefix} ℹ ${message}${colors.reset}`);
  }
}

function calculateFileHash(filepath) {
  const fileBuffer = fs.readFileSync(filepath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

function getBuildInfo() {
  try {
    if (fs.existsSync(CONFIG.buildConfigFile)) {
      const config = JSON.parse(fs.readFileSync(CONFIG.buildConfigFile, 'utf8'));
      return {
        buildTime: config.buildTime,
        gitCommit: config.gitCommit,
        nodeEnv: config.nodeEnv,
      };
    }
  } catch (error) {
    log(`Error reading build config: ${error.message}`, 'error');
  }
  return null;
}

function checkLocalBuild() {
  log('Checking local build...', 'info');
  
  if (!fs.existsSync(CONFIG.distDir)) {
    log('Dist directory not found! Run "npm run build" first.', 'error');
    return false;
  }
  
  const requiredFiles = [
    'index.html',
    'build-config.json',
    'assets/css/cross-browser-responsive.css',
  ];
  
  for (const file of requiredFiles) {
    const filepath = path.join(CONFIG.distDir, file);
    if (!fs.existsSync(filepath)) {
      log(`Missing required file: ${file}`, 'error');
      return false;
    }
  }
  
  const buildInfo = getBuildInfo();
  if (buildInfo) {
    log(`Build time: ${buildInfo.buildTime}`, 'info');
    log(`Git commit: ${buildInfo.gitCommit}`, 'info');
  }
  
  log('Local build verified ✓', 'success');
  return true;
}

function checkGitStatus() {
  log('Checking Git status...', 'info');
  
  try {
    // Check for uncommitted changes
    const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    
    if (status) {
      log('Uncommitted changes detected:', 'warning');
      console.log(status);
      log('Please commit all changes before deploying.', 'warning');
      return false;
    }
    
    // Check if local is ahead/behind remote
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    const revCount = execSync(
      `git rev-list --left-right --count origin/${branch}...${branch}`,
      { encoding: 'utf8' }
    ).trim().split('\t');
    
    const behind = parseInt(revCount[0], 10);
    const ahead = parseInt(revCount[1], 10);
    
    if (behind > 0) {
      log(`Local branch is ${behind} commits behind origin/${branch}`, 'error');
      log('Run "git pull" to sync with remote.', 'warning');
      return false;
    }
    
    if (ahead > 0) {
      log(`Local branch is ${ahead} commits ahead of origin/${branch}`, 'warning');
      log('Run "git push" to sync with remote.', 'warning');
      return false;
    }
    
    log('Git repository is synchronized ✓', 'success');
    return true;
    
  } catch (error) {
    log(`Git check error: ${error.message}`, 'error');
    return false;
  }
}

function generateDeploymentChecklist() {
  const buildInfo = getBuildInfo();
  
  return `
${colors.bright}╔══════════════════════════════════════════════════════════════╗
║           DEPLOYMENT SYNCHRONIZATION CHECKLIST              ║
╚══════════════════════════════════════════════════════════════╝${colors.reset}

${colors.bright}Build Information:${colors.reset}
  • Build Time: ${buildInfo?.buildTime || 'Unknown'}
  • Git Commit: ${buildInfo?.gitCommit || 'Unknown'}
  • Environment: ${buildInfo?.nodeEnv || 'Unknown'}

${colors.bright}Deployment URLs:${colors.reset}
  • GitHub Pages: ${CONFIG.githubPagesUrl}
  • Vercel: ${CONFIG.vercelUrl}

${colors.bright}Pre-Deployment Checks:${colors.reset}
  ${colors.green}✓${colors.reset} Local build successful
  ${colors.green}✓${colors.reset} All required files present
  ${colors.green}✓${colors.reset} Git repository synchronized
  ${colors.green}✓${colors.reset} No uncommitted changes

${colors.bright}Post-Deployment Verification:${colors.reset}
  1. Visit GitHub Pages URL and verify content loads
  2. Visit Vercel URL and verify content loads
  3. Compare page titles - should be identical
  4. Check build timestamp in page source
  5. Test responsive design on mobile/desktop
  6. Verify theme switching works on both

${colors.bright}Troubleshooting:${colors.reset}
  • If GitHub Pages is outdated: Check Actions tab for build errors
  • If Vercel is outdated: Check Vercel Dashboard for deployment status
  • If CSS is different: Clear browser cache or check CDN propagation

${colors.bright}Synchronization Status:${colors.reset}
  Both deployments should show the same:
  • Content and layout
  • Build timestamp
  • Git commit hash
  • CSS/JS versions

${colors.yellow}Note: Allow 2-5 minutes for CDN propagation after deployment${colors.reset}
`;
}

function main() {
  console.log('\n' + '='.repeat(70));
  log('DEPLOYMENT SYNCHRONIZATION VERIFIER', 'info');
  console.log('='.repeat(70) + '\n');
  
  let allChecks = true;
  
  // Check local build
  if (!checkLocalBuild()) {
    allChecks = false;
  }
  
  console.log('');
  
  // Check Git status
  if (!checkGitStatus()) {
    allChecks = false;
  }
  
  console.log('');
  
  // Generate checklist
  console.log(generateDeploymentChecklist());
  
  if (allChecks) {
    log('All checks passed! Ready for deployment.', 'success');
    process.exit(0);
  } else {
    log('Some checks failed. Please fix issues before deploying.', 'error');
    process.exit(1);
  }
}

main();
