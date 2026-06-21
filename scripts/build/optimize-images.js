#!/usr/bin/env node
/**
 * Image Optimization Script
 * Converts images to WebP format and generates responsive variants
 * Run: node scripts/optimize-images.js
 */

import sharp from 'sharp';
import { existsSync, mkdirSync, statSync, readdirSync } from 'fs';
import { join, basename, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INPUT_DIR = join(__dirname, '../../src/assets/images');
const OUTPUT_DIR = join(__dirname, '../../src/assets/images/optimized');

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
 * Recursively get all image files from directory
 */
function getImageFiles(dir, relativePath = '') {
  const files = [];
  const items = readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = join(dir, item.name);
    const relPath = join(relativePath, item.name);

    if (item.isDirectory()) {
      files.push(...getImageFiles(fullPath, relPath));
    } else if (/\.(jpg|jpeg|png)$/i.test(item.name)) {
      files.push({
        fullPath,
        relativePath: relPath,
        dir: relativePath,
        name: item.name,
      });
    }
  }

  return files;
}

/**
 * Process all images in directory (recursively)
 */
async function processImages() {
  console.log('🚀 Starting image optimization...\n');

  const imageFiles = getImageFiles(INPUT_DIR);

  if (imageFiles.length === 0) {
    console.log('⚠️  No images found to optimize');
    return;
  }

  console.log(`📸 Found ${imageFiles.length} images to process\n`);

  let totalSavings = 0;
  let processedCount = 0;

  await Promise.all(
    imageFiles.map(async file => {
      const baseName = basename(file.name, extname(file.name));
      const outputSubdir = join(OUTPUT_DIR, file.dir);

      // Ensure subdirectory exists
      if (!existsSync(outputSubdir)) {
        mkdirSync(outputSubdir, { recursive: true });
      }

      console.log(`\n📷 Processing: ${file.relativePath}`);

      // Get original size
      const originalStats = statSync(file.fullPath);
      const originalSize = originalStats.size;

      // Generate WebP version (single high-quality version, not multiple sizes)
      const webpPath = join(outputSubdir, `${baseName}.webp`);
      await convertToWebP(file.fullPath, webpPath, null);

      // Calculate savings
      try {
        const webpStats = statSync(webpPath);
        const savings = originalSize - webpStats.size;
        const percentSaved = ((savings / originalSize) * 100).toFixed(1);
        totalSavings += savings;
        processedCount++;
        console.log(`   💾 Saved: ${(savings / 1024).toFixed(2)} KB (${percentSaved}%)`);
      } catch (_e) {
        // WebP creation failed, skip savings calc
      }

      // Generate optimized original format
      const optimizedPath = join(outputSubdir, file.name);
      await optimizeImage(file.fullPath, optimizedPath);
    })
  );

  console.log('\n✨ Image optimization complete!');
  console.log(`📁 Optimized images saved to: ${OUTPUT_DIR}`);
  console.log(
    `📊 Total: ${processedCount} images, ${(totalSavings / 1024 / 1024).toFixed(2)} MB saved`
  );

  // Generate usage examples
  if (imageFiles.length > 0) {
    generateUsageExamples(imageFiles[0].name);
  }
}

/**
 * Generate HTML usage examples
 */
function generateUsageExamples(sampleFile) {
  const baseName = basename(sampleFile, extname(sampleFile));

  console.log('\n📝 Example HTML usage:\n');
  console.log('<!-- WebP with fallback -->');
  console.log('<picture>');
  console.log(`  <source type="image/webp" srcset="assets/images/optimized/${baseName}.webp" />`);
  console.log(
    `  <img src="assets/images/optimized/${sampleFile}" alt="Description" loading="lazy" />`
  );
  console.log('</picture>\n');
  console.log(
    '💡 Tip: Use <picture> element to serve WebP to modern browsers with fallback to original format\n'
  );
}

// Run the script
processImages().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
