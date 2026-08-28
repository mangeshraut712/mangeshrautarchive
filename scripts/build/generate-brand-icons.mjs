import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '../..');
const sourceIcon = resolve(projectRoot, 'src/favicon.svg');

function getCleanLogoSvg(pathD, fill = '#ffffff') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <path fill="${fill}" fill-rule="evenodd" d="${pathD}" />
  </svg>`;
}

async function renderTransparentPng(pathD, size, fill = '#ffffff') {
  const logoSvg = getCleanLogoSvg(pathD, fill);
  return sharp(Buffer.from(logoSvg))
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
}

async function renderSquircleTouchIcon(pathD, size) {
  const squircleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" rx="106" fill="#000000"/>
  </svg>`;

  const squircleBg = await sharp(Buffer.from(squircleSvg)).resize(size, size).png().toBuffer();
  const innerSize = Math.round(size * 0.7);
  const offset = Math.round((size - innerSize) / 2);
  const whiteLogoSvg = getCleanLogoSvg(pathD, '#ffffff');
  const innerLogo = await sharp(Buffer.from(whiteLogoSvg))
    .resize(innerSize, innerSize)
    .png()
    .toBuffer();

  return sharp(squircleBg)
    .composite([{ input: innerLogo, top: offset, left: offset }])
    .png({ compressionLevel: 9 })
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
  const svgContent = await readFile(sourceIcon, 'utf8');
  const pathMatch = svgContent.match(/<path[\s\S]*?d="([\s\S]*?)"/);
  if (!pathMatch) {
    throw new Error('Unable to extract path data from src/favicon.svg');
  }
  const pathD = pathMatch[1];

  const [png16, png32, png48, touch180, pwa192, pwa512] = await Promise.all([
    renderTransparentPng(pathD, 16, '#ffffff'),
    renderTransparentPng(pathD, 32, '#ffffff'),
    renderTransparentPng(pathD, 48, '#ffffff'),
    renderSquircleTouchIcon(pathD, 180),
    renderSquircleTouchIcon(pathD, 192),
    renderSquircleTouchIcon(pathD, 512),
  ]);

  const ico = createPngIco([
    { size: 16, buffer: png16 },
    { size: 32, buffer: png32 },
    { size: 48, buffer: png48 },
  ]);

  const writes = [
    ['src/favicon-16x16.png', png16],
    ['src/favicon-32x32.png', png32],
    ['src/favicon.ico', ico],
    ['src/apple-touch-icon.png', touch180],
    ['src/apple-touch-icon-precomposed.png', touch180],
    ['src/assets/icons/favicon-16x16.png', png16],
    ['src/assets/icons/favicon-32x32.png', png32],
    ['src/assets/icons/favicon-48x48.png', png48],
    ['src/assets/icons/favicon.ico', ico],
    ['src/assets/icons/apple-touch-icon.png', touch180],
    ['src/assets/icons/icon-192.png', pwa192],
    ['src/assets/icons/icon-512.png', pwa512],
  ];

  await Promise.all(
    writes.map(([path, contents]) => writeFile(resolve(projectRoot, path), contents))
  );
  console.log('🎨 Brand favicon and Apple touch assets regenerated successfully');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await generateBrandIcons();
}
