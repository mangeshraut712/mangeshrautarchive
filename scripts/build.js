import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { mkdir, rm, cp, stat } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const distDir = resolve(projectRoot, 'dist');

const assets = [
    'index.html',
    'css',
    'js',
    'images',
    'files',
    'api',
    'server.js',
    'package.json',
    'package-lock.json',
    'firestore.rules'
];

// Include production config if available
const productionAssets = [
    'perplexity-mcp.json'
];

async function pathExists(path) {
    try {
        await stat(path);
        return true;
    } catch {
        return false;
    }
}

async function build() {
    await rm(distDir, { recursive: true, force: true });
    await mkdir(distDir, { recursive: true });

    // Copy main assets
    for (const item of assets) {
        const source = resolve(projectRoot, item);
        const destination = resolve(distDir, item);

        if (!(await pathExists(source))) {
            continue;
        }

        await cp(source, destination, { recursive: true });
    }

    // Copy production-specific assets
    for (const item of productionAssets) {
        const source = resolve(projectRoot, item);
        const destination = resolve(distDir, item);

        if (await pathExists(source)) {
            await cp(source, destination);
            console.log(`📋 Copied production config: ${item}`);
        }
    }

    console.log('✨ Build complete. Output written to dist/ with API keys embedded.');
}

build().catch((error) => {
    console.error('Build failed:', error);
    process.exitCode = 1;
});
