#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
import { dirname, extname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

class SecurityChecker {
    constructor() {
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

        // High-risk files are checked first to fail fast.
        this.alwaysCheck = [
            'src/index.html',
            'src/js/core/script.js',
            'src/js/core/bootstrap.js',
            'api/contact.js',
            'api/index.py'
        ];

        this.skipDirectories = new Set([
            '.git',
            'node_modules',
            '.vscode',
            '.next',
            '.cursor',
            '.npmcache',
            'dist',
            'build',
            'coverage',
            'artifacts',
            'test-results',
            'playwright-report',
            '__pycache__',
            'venv'
        ]);

        this.skipFiles = new Set([
            '.env',
            'API_KEYS.txt',
            'src/js/config.local.js',
            'config.local.js'
        ]);

        this.maxFileSizeBytes = 2 * 1024 * 1024;
        this.allowedExtensions = new Set([
            '.cjs',
            '.css',
            '.env',
            '.html',
            '.js',
            '.json',
            '.jsx',
            '.md',
            '.mjs',
            '.py',
            '.sh',
            '.ts',
            '.tsx',
            '.txt',
            '.xml',
            '.yaml',
            '.yml'
        ]);
    }

    toRelativePath(filePath) {
        return relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');
    }

    shouldSkipFile(filePath) {
        const relativePath = this.toRelativePath(filePath);
        const firstPathSegment = relativePath.split('/')[0];

        if (this.skipFiles.has(relativePath)) {
            return true;
        }

        return this.skipDirectories.has(firstPathSegment);
    }

    shouldScanExtension(filePath) {
        const extension = extname(filePath).toLowerCase();
        // Scan extensionless files too.
        return extension === '' || this.allowedExtensions.has(extension);
    }

    checkFile(filePath) {
        try {
            if (!this.shouldScanExtension(filePath)) {
                return [];
            }

            const fileStats = statSync(filePath);
            if (fileStats.size > this.maxFileSizeBytes) {
                return [];
            }

            const content = readFileSync(filePath, 'utf8');
            const lines = content.split(/\r?\n/);
            const found = [];

            for (const secret of this.secrets) {
                let matchesCount = 0;

                for (const line of lines) {
                    if (line.includes('REVOKED:')) {
                        continue;
                    }

                    const matches = line.match(secret.pattern);
                    if (matches) {
                        matchesCount += matches.length;
                    }
                }

                if (matchesCount > 0) {
                    found.push({
                        type: secret.name,
                        pattern: secret.pattern.source,
                        matches: matchesCount,
                        file: this.toRelativePath(filePath)
                    });
                }
            }

            return found;
        } catch {
            return null;
        }
    }

    scanDirectory(dir, results = [], scannedFiles = new Set()) {
        const items = readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
            const fullPath = join(dir, item.name);

            if (this.shouldSkipFile(fullPath)) {
                continue;
            }

            if (item.isDirectory()) {
                this.scanDirectory(fullPath, results, scannedFiles);
                continue;
            }

            if (!item.isFile()) {
                continue;
            }

            const relativePath = this.toRelativePath(fullPath);
            if (scannedFiles.has(relativePath)) {
                continue;
            }

            scannedFiles.add(relativePath);
            const findings = this.checkFile(fullPath);
            if (findings && findings.length > 0) {
                results.push(...findings);
            }
        }

        return results;
    }

    run() {
        console.log('🔍 Running security check for exposed API keys...\n');

        const findings = [];
        const scannedFiles = new Set();

        for (const file of this.alwaysCheck) {
            const fullPath = join(PROJECT_ROOT, file);
            const relativePath = this.toRelativePath(fullPath);
            scannedFiles.add(relativePath);

            const fileFindings = this.checkFile(fullPath);
            if (fileFindings && fileFindings.length > 0) {
                findings.push(...fileFindings);
            }
        }

        this.scanDirectory(PROJECT_ROOT, findings, scannedFiles);

        if (findings.length > 0) {
            console.error('🚨 SECURITY RISK: Exposed API keys detected!\n');
            console.error('Found:');

            for (const finding of findings) {
                console.error(`  ❌ ${finding.type}: ${finding.matches} match(es) in ${finding.file}`);
            }

            console.error('\n❌ BLOCKED: Commit aborted. Please remove exposed keys immediately.');
            console.error('\n🔧 Actions to take:');
            console.error('  1. Revoke/rotate all exposed API keys immediately');
            console.error('  2. Move secrets to config.local.js (git-ignored)');
            console.error('  3. Run: npm run security-check');
            console.error('\n📞 Emergency: Check provider dashboards and revoke keys now!');

            process.exit(1);
        }

        console.log('✅ No exposed API keys detected in codebase.');
        console.log('🔒 All secrets appear to be properly secured.');
    }
}

const checker = new SecurityChecker();
checker.run();
