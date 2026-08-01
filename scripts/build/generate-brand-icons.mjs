import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '../..');
const sourceIcon = resolve(projectRoot, 'src/assets/icons/icon-512.png');

async function renderPng(size) {
  return sharp(sourceIcon)
    .resize(size, size, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
}

function createPngIco(images) {
  const headerSize = 6;
  const entrySize = 16;
  let offset = headerSize + entrySize * images.length;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const entries = images.map(({ size, buffer }) => {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(size === 256 ? 0 : size, 0);
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += buffer.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map(image => image.buffer)]);
}

export async function generateBrandIcons() {
  const sizes = new Map();
  for (const size of [16, 32, 48, 180, 192]) {
    sizes.set(size, await renderPng(size));
  }

  const ico = createPngIco([16, 32, 48].map(size => ({ size, buffer: sizes.get(size) })));
  const writes = [
    ['src/favicon-16x16.png', sizes.get(16)],
    ['src/favicon-32x32.png', sizes.get(32)],
    ['src/favicon.ico', ico],
    ['src/apple-touch-icon.png', sizes.get(180)],
    ['src/apple-touch-icon-precomposed.png', sizes.get(180)],
    ['src/assets/icons/favicon-16x16.png', sizes.get(16)],
    ['src/assets/icons/favicon-32x32.png', sizes.get(32)],
    ['src/assets/icons/favicon-48x48.png', sizes.get(48)],
    ['src/assets/icons/favicon.ico', ico],
    ['src/assets/icons/apple-touch-icon.png', sizes.get(180)],
    ['src/assets/icons/icon-192.png', sizes.get(192)],
  ];

  await Promise.all(
    writes.map(([path, contents]) => writeFile(resolve(projectRoot, path), contents))
  );
  console.log('🎨 Brand favicon and Apple touch assets regenerated from icon-512.png');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await generateBrandIcons();
}
