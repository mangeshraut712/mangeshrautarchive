import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { mkdir, rm, cp, stat } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const distDir = resolve(projectRoot, 'dist');

const srcDir = resolve(projectRoot, 'src');

const staticExtras = [
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

    console.log('✨ Build complete. Static assets written to dist/.');
}

build().catch((error) => {
    console.error('Build failed:', error);
    process.exitCode = 1;
});
