#!/usr/bin/env node
/**
 * Image Optimization Script
 * Converts images to WebP format and generates responsive variants
 * Run: node scripts/optimize-images.js
 */

import sharp from 'sharp';
import { existsSync, mkdirSync, statSync, readdirSync } from 'fs';
import { join, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INPUT_DIR = join(__dirname, '../src/assets/images');
const OUTPUT_DIR = join(__dirname, '../src/assets/images/optimized');

// Responsive image sizes
const SIZES = [
  { width: 320, suffix: '-mobile' },
  { width: 768, suffix: '-tablet' },
  { width: 1200, suffix: '-desktop' },
  { width: 1920, suffix: '-hd' },
];

// Quality settings
const WEBP_QUALITY = 85;
const JPEG_QUALITY = 85;

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Convert image to WebP format
 */
async function convertToWebP(inputPath, outputPath, width = null) {
  try {
    let pipeline = sharp(inputPath);

    if (width) {
      pipeline = pipeline.resize(width, null, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    await pipeline.webp({ quality: WEBP_QUALITY }).toFile(outputPath);

    const stats = statSync(outputPath);
    console.log(`✅ Created: ${basename(outputPath)} (${(stats.size / 1024).toFixed(2)} KB)`);
  } catch (error) {
    console.error(`❌ Error converting ${inputPath}:`, error.message);
  }
}

/**
 * Optimize JPEG/PNG images
 */
async function optimizeImage(inputPath, outputPath, width = null) {
  try {
    const ext = extname(inputPath).toLowerCase();
    let pipeline = sharp(inputPath);

    if (width) {
      pipeline = pipeline.resize(width, null, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    if (ext === '.jpg' || ext === '.jpeg') {
      await pipeline.jpeg({ quality: JPEG_QUALITY, progressive: true }).toFile(outputPath);
    } else if (ext === '.png') {
      await pipeline.png({ quality: JPEG_QUALITY, progressive: true }).toFile(outputPath);
    }

    const stats = statSync(outputPath);
    console.log(`✅ Optimized: ${basename(outputPath)} (${(stats.size / 1024).toFixed(2)} KB)`);
  } catch (error) {
    console.error(`❌ Error optimizing ${inputPath}:`, error.message);
  }
}

/**
 * Process all images in directory
 */
async function processImages() {
  console.log('🚀 Starting image optimization...\n');

  const files = readdirSync(INPUT_DIR);
  const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));

  if (imageFiles.length === 0) {
    console.log('⚠️  No images found to optimize');
    return;
  }

  console.log(`📸 Found ${imageFiles.length} images to process\n`);

  for (const file of imageFiles) {
    const inputPath = join(INPUT_DIR, file);
    const baseName = basename(file, extname(file));

    console.log(`\n📷 Processing: ${file}`);

    // Generate WebP versions at different sizes
    for (const size of SIZES) {
      const webpPath = join(OUTPUT_DIR, `${baseName}${size.suffix}.webp`);
      await convertToWebP(inputPath, webpPath, size.width);
    }

    // Generate original format optimized version
    const optimizedPath = join(OUTPUT_DIR, file);
    await optimizeImage(inputPath, optimizedPath);
  }

  console.log('\n✨ Image optimization complete!');
  console.log(`📁 Optimized images saved to: ${OUTPUT_DIR}`);

  // Generate usage examples
  generateUsageExamples(imageFiles[0]);
}

/**
 * Generate HTML usage examples
 */
function generateUsageExamples(sampleFile) {
  const baseName = basename(sampleFile, extname(sampleFile));

  console.log('\n📝 Example HTML usage:\n');
  console.log('<!-- Responsive WebP with fallback -->');
  console.log('<picture>');
  console.log(`  <source`);
  console.log(`    type="image/webp"`);
  console.log(`    srcset="`);
  console.log(`      assets/images/optimized/${baseName}-mobile.webp 320w,`);
  console.log(`      assets/images/optimized/${baseName}-tablet.webp 768w,`);
  console.log(`      assets/images/optimized/${baseName}-desktop.webp 1200w,`);
  console.log(`      assets/images/optimized/${baseName}-hd.webp 1920w"`);
  console.log(`    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />`);
  console.log(`  <img`);
  console.log(`    src="assets/images/optimized/${sampleFile}"`);
  console.log(`    alt="Description"`);
  console.log(`    loading="lazy"`);
  console.log(`    width="1200"`);
  console.log(`    height="800" />`);
  console.log('</picture>\n');
}

// Run the script
processImages().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
