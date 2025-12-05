#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

class SecurityChecker {
    constructor() {
        // Patterns that indicate potentially exposed secrets
        this.secrets = [
            { pattern: /sk-[a-zA-Z0-9_]{20,}/g, name: 'OpenAI API Key' },
            { pattern: /xai-[a-zA-Z0-9]{40,}/g, name: 'Grok API Key' },
            { pattern: /sk-ant-[a-zA-Z0-9_-]{80,}/g, name: 'Anthropic API Key' },
            { pattern: /pplx-[a-zA-Z0-9_-]{20,}/g, name: 'Perplexity API Key' },
            { pattern: /AIzaSy[a-zA-Z0-9_-]{35}/g, name: 'Google Gemini API Key' },
            { pattern: /sk-or-v1-[a-zA-Z0-9_-]{40,}/g, name: 'OpenRouter API Key' },
            { pattern: /hf_[a-zA-Z0-9]{20,}/g, name: 'Hugging Face API Key' },
            { pattern: /ghp_[a-zA-Z0-9]{36}/g, name: 'GitHub Personal Access Token' }
        ];

        // Files to always check
        this.alwaysCheck = [
            'src/index.html',
            'src/js/script.js',
            'server.js'
        ];

        // Files to skip entirely
        this.skipFiles = new Set([
            '.git/',
            'node_modules/',
            '.vscode/',
            '.next/',
            'dist/',
            'build/',
            '.env',
            'API_KEYS.txt',
            'src/js/config.local.js',
            'config.local.js'
        ]);
    }

    shouldSkipFile(filePath) {
        const relativePath = relative(PROJECT_ROOT, filePath);
        return this.skipFiles.has(relativePath) ||
            this.skipFiles.has(relativePath.split('/')[0] + '/') ||
            filePath.includes('.git/') ||
            filePath.includes('node_modules/');
    }

    checkFile(filePath) {
        try {
            const content = readFileSync(filePath, 'utf8');
            const found = [];

            for (const secret of this.secrets) {
                const matches = content.match(secret.pattern);
                if (matches) {
                    found.push({
                        type: secret.name,
                        pattern: secret.pattern.source,
                        matches: matches.length,
                        file: relative(PROJECT_ROOT, filePath)
                    });
                }
            }

            return found;
        } catch {
            return null; // File couldn't be read
        }
    }

    scanDirectory(dir, results = []) {
        const items = readdirSync(dir);

        for (const item of items) {
            const fullPath = join(dir, item);

            if (this.shouldSkipFile(fullPath)) {
                continue;
            }

            const stat = statSync(fullPath);

            if (stat.isDirectory()) {
                this.scanDirectory(fullPath, results);
            } else if (stat.isFile()) {
                const findings = this.checkFile(fullPath);
                if (findings && findings.length > 0) {
                    results.push(...findings);
                }
            }
        }

        return results;
    }

    run() {
        console.log('🔍 Running security check for exposed API keys...\n');

        // Always check critical files first
        const criticalFindings = [];
        for (const file of this.alwaysCheck) {
            const fullPath = join(PROJECT_ROOT, file);
            const findings = this.checkFile(fullPath);

            // Filter out obvious false positives (comments, safe demo code)
            const realFindings = findings?.filter(_f => {
                const content = readFileSync(fullPath, 'utf8');
                const lines = content.split('\n');
                // Skip this finding if it's in a comment or marked as revoked
                return !lines.some(line => line.includes('// REVOKED:') || line.includes('# REVOKED:'));
            }) || [];

            if (realFindings && realFindings.length > 0) {
                criticalFindings.push(...realFindings);
            }
        }

        // Scan all files
        const allFindings = this.scanDirectory(PROJECT_ROOT);

        if (criticalFindings.length > 0 || allFindings.length > 0) {
            console.error('🚨 SECURITY RISK: Exposed API keys detected!\n');
            console.error('Found:');

            const all = [...criticalFindings, ...allFindings];
            for (const finding of all) {
                console.error(`  ❌ ${finding.type}: ${finding.matches} match(es) in ${finding.file}`);
            }

            console.error('\n❌ BLOCKED: Commit aborted. Please remove exposed keys immediately.');
            console.error('\n🔧 Actions to take:');
            console.error('  1. Revoke/rotate all exposed API keys immediately');
            console.error('  2. Move secrets to config.local.js (git-ignored)');
            console.error('  3. Run: npm run security-check');
            console.error('\n📞 Emergency: Check provider dashboards and revoke keys now!');

            process.exit(1);
        } else {
            console.log('✅ No exposed API keys detected in codebase.');
            console.log('🔒 All secrets appear to be properly secured.');
        }
    }
}

// Run the checker
const checker = new SecurityChecker();
checker.run();
