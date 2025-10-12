import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { mkdir, rm, cp, stat, writeFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const distDir = resolve(projectRoot, 'dist');

const srcDir = resolve(projectRoot, 'src');

const staticExtras = [
    'perplexity-mcp.json'
];

// Build-time API key injection for GitHub Pages
async function injectApiKeys() {
    const config = {
        // API keys injected at build time
        deepseekApiKey: process.env.OPENROUTER_API_KEY || '',
        siteUrl: process.env.OPENROUTER_SITE_URL || '',
        appTitle: process.env.OPENROUTER_APP_TITLE || '',

        // Other configuration
        selectedModel: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3-0324:free',
        environment: process.env.NODE_ENV || 'production',

        // Build timestamp for cache busting
        buildTimestamp: new Date().toISOString()
    };

    // Create build config JSON file
    const configPath = resolve(distDir, 'build-config.json');
    await writeFile(configPath, JSON.stringify(config, null, 2));

    console.log('🔑 Injected API configuration for static hosting');
    console.log('📝 Config file written to: dist/build-config.json');

    // Also create a JavaScript config for direct browser import
    const jsConfig = `
// Auto-generated build configuration
// DO NOT EDIT - This file is created by the build process
const buildConfig = ${JSON.stringify(config, null, 2)};

export default buildConfig;
export { buildConfig };
`;
    const jsConfigPath = resolve(distDir, 'build-config.js');
    await writeFile(jsConfigPath, jsConfig);

    console.log('📝 JS config file written to: dist/build-config.js');
}

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
    if (!(await pathExists(srcDir))) {
        throw new Error('Source directory "src/" not found.');
    }

    await mkdir(distDir, { recursive: true });
    await cp(srcDir, distDir, { recursive: true });

    for (const item of staticExtras) {
        const source = resolve(projectRoot, item);
        if (await pathExists(source)) {
            const destination = resolve(distDir, item.split('/').pop());
            await cp(source, destination, { recursive: true });
            console.log(`📋 Copied extra asset: ${item}`);
        }
    }

    // Inject API keys and configuration at build time
    await injectApiKeys();

    console.log('✨ Build complete. Static assets written to dist/.');
}

build().catch((error) => {
    console.error('Build failed:', error);
    process.exitCode = 1;
});
