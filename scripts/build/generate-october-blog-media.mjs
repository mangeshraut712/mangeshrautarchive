import sharp from 'sharp';
import { writeFile } from 'fs/promises';
import { createHash } from 'crypto';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../');

const geminiSvg = `<svg width="1600" height="900" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="deepmindBg" cx="50%" cy="40%" r="75%">
      <stop offset="0%" stop-color="#0d1117" />
      <stop offset="60%" stop-color="#04060a" />
      <stop offset="100%" stop-color="#010204" />
    </radialGradient>
    <linearGradient id="argonGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00E5FF" stop-opacity="0.8" />
      <stop offset="50%" stop-color="#2979FF" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#7C4DFF" stop-opacity="0.4" />
    </linearGradient>
    <linearGradient id="carbonGlow" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF3D00" stop-opacity="0.7" />
      <stop offset="50%" stop-color="#FF9100" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#00E676" stop-opacity="0.8" />
    </linearGradient>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#cbd5e1" />
    </linearGradient>
    <filter id="blurFilter" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="80" />
    </filter>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="24" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1600" height="900" fill="url(#deepmindBg)" />

  <!-- Ambient Light Orbs -->
  <circle cx="380" cy="400" r="320" fill="url(#argonGlow)" filter="url(#blurFilter)" opacity="0.45" />
  <circle cx="1220" cy="450" r="340" fill="url(#carbonGlow)" filter="url(#blurFilter)" opacity="0.4" />

  <!-- Grid overlay -->
  <g opacity="0.08" stroke="#ffffff" stroke-width="1">
    <line x1="0" y1="150" x2="1600" y2="150" />
    <line x1="0" y1="300" x2="1600" y2="300" />
    <line x1="0" y1="450" x2="1600" y2="450" />
    <line x1="0" y1="600" x2="1600" y2="600" />
    <line x1="0" y1="750" x2="1600" y2="750" />
    <line x1="200" y1="0" x2="200" y2="900" />
    <line x1="400" y1="0" x2="400" y2="900" />
    <line x1="600" y1="0" x2="600" y2="900" />
    <line x1="800" y1="0" x2="800" y2="900" />
    <line x1="1000" y1="0" x2="1000" y2="900" />
    <line x1="1200" y1="0" x2="1200" y2="900" />
    <line x1="1400" y1="0" x2="1400" y2="900" />
  </g>

  <!-- Central Elemental Rings -->
  <g transform="translate(800, 360)">
    <!-- Outer Orbit -->
    <circle cx="0" cy="0" r="230" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2" stroke-dasharray="8 8" />
    <circle cx="0" cy="0" r="180" fill="none" stroke="rgba(0,229,255,0.3)" stroke-width="1.5" />
    <circle cx="0" cy="0" r="130" fill="none" stroke="rgba(255,145,0,0.35)" stroke-width="1.5" stroke-dasharray="12 6" />

    <!-- Core Orb -->
    <circle cx="0" cy="0" r="70" fill="rgba(10,14,24,0.9)" stroke="rgba(255,255,255,0.3)" stroke-width="2" filter="url(#softGlow)" />
    
    <!-- Element nodes -->
    <!-- Argon (Ar 18) -->
    <g transform="translate(-180, 0)">
      <circle cx="0" cy="0" r="42" fill="#030b18" stroke="#00E5FF" stroke-width="2" filter="url(#softGlow)" />
      <text x="0" y="5" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" font-size="20" font-weight="800" fill="#00E5FF" text-anchor="middle">Ar</text>
      <text x="0" y="24" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', monospace" font-size="10" font-weight="600" fill="#94a3b8" text-anchor="middle">18 · 1M CTX</text>
    </g>

    <!-- Carbon (C 6) -->
    <g transform="translate(180, 0)">
      <circle cx="0" cy="0" r="42" fill="#140803" stroke="#FF9100" stroke-width="2" filter="url(#softGlow)" />
      <text x="0" y="5" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" font-size="20" font-weight="800" fill="#FF9100" text-anchor="middle">C</text>
      <text x="0" y="24" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', monospace" font-size="10" font-weight="600" fill="#cbd5e1" text-anchor="middle">6 · SEC-88%</text>
    </g>

    <!-- Center Spark / DeepMind Star -->
    <polygon points="0,-25 7,-7 25,0 7,7 0,25 -7,7 -25,0 -7,-7" fill="#ffffff" filter="url(#softGlow)" />
  </g>

  <!-- Typography & Headers -->
  <g text-anchor="middle">
    <!-- Brand Tag -->
    <rect x="680" y="68" width="240" height="34" rx="17" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
    <text x="800" y="90" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" font-size="12" font-weight="700" letter-spacing="3" fill="#38bdf8">GOOGLE DEEPMIND</text>

    <!-- Main Title -->
    <text x="800" y="660" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" font-size="52" font-weight="800" letter-spacing="-1" fill="url(#textGrad)">GEMINI 4: ARGON &amp; CARBON</text>

    <!-- Subtitle / Meta -->
    <text x="800" y="705" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" font-size="19" font-weight="500" letter-spacing="0.5" fill="#94a3b8">Frontier Reasoning · Autonomous Cyber Defense · October 2026</text>

    <!-- Stat Pills -->
    <g transform="translate(800, 755)">
      <rect x="-340" y="0" width="200" height="38" rx="8" fill="rgba(0,229,255,0.08)" stroke="rgba(0,229,255,0.3)" stroke-width="1"/>
      <text x="-240" y="24" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', monospace" font-size="13" font-weight="700" fill="#00E5FF">1M Context Window</text>

      <rect x="-100" y="0" width="200" height="38" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>
      <text x="0" y="24" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', monospace" font-size="13" font-weight="700" fill="#ffffff">#1 Analysis Index 59</text>

      <rect x="140" y="0" width="200" height="38" rx="8" fill="rgba(255,145,0,0.08)" stroke="rgba(255,145,0,0.3)" stroke-width="1"/>
      <text x="240" y="24" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', monospace" font-size="13" font-weight="700" fill="#FF9100">88.2% SEC-bench Pro</text>
    </g>
  </g>
</svg>`;

const macbookSvg = `<svg width="1600" height="900" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="appleBg" cx="50%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#141419" />
      <stop offset="50%" stop-color="#09090c" />
      <stop offset="100%" stop-color="#020203" />
    </radialGradient>
    <linearGradient id="oledGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0071e3" stop-opacity="0.85" />
      <stop offset="35%" stop-color="#6366f1" stop-opacity="0.75" />
      <stop offset="70%" stop-color="#ec4899" stop-opacity="0.7" />
      <stop offset="100%" stop-color="#f97316" stop-opacity="0.8" />
    </linearGradient>
    <linearGradient id="metalRim" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#475569" />
      <stop offset="50%" stop-color="#94a3b8" />
      <stop offset="100%" stop-color="#334155" />
    </linearGradient>
    <filter id="hdrShine" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="60" />
    </filter>
    <filter id="touchRippleGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1600" height="900" fill="url(#appleBg)" />

  <!-- Radiant Tandem OLED Ambient Backdrop -->
  <ellipse cx="800" cy="380" rx="550" ry="260" fill="url(#oledGlow)" filter="url(#hdrShine)" opacity="0.32" />

  <!-- Grid Accents -->
  <g opacity="0.05" stroke="#ffffff" stroke-width="1">
    <line x1="0" y1="200" x2="1600" y2="200" />
    <line x1="0" y1="400" x2="1600" y2="400" />
    <line x1="0" y1="600" x2="1600" y2="600" />
    <line x1="0" y1="800" x2="1600" y2="800" />
    <line x1="400" y1="0" x2="400" y2="900" />
    <line x1="800" y1="0" x2="800" y2="900" />
    <line x1="1200" y1="0" x2="1200" y2="900" />
  </g>

  <!-- Laptop Display Rendering -->
  <g transform="translate(800, 360)">
    <!-- Display Bezel / Outer Clamshell -->
    <rect x="-420" y="-220" width="840" height="440" rx="18" fill="#111116" stroke="url(#metalRim)" stroke-width="2.5" />

    <!-- Inner Active Screen Area (PROLED XDR Display) -->
    <rect x="-404" y="-204" width="808" height="408" rx="8" fill="#050507" />

    <!-- Tandem OLED Color Burst inside Screen -->
    <path d="M-404,204 Q-200,-50 0,60 T404,-100 L404,204 Z" fill="url(#oledGlow)" opacity="0.45" />

    <!-- Dynamic Island at Top -->
    <rect x="-65" y="-198" width="130" height="26" rx="13" fill="#000000" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
    <circle cx="-38" cy="-185" r="5" fill="#1e293b" />
    <circle cx="36" cy="-185" r="4" fill="#0071e3" opacity="0.8" />

    <!-- Touch Interaction Ripple (Direct Multi-Touch Demonstration) -->
    <g transform="translate(140, 40)">
      <circle cx="0" cy="0" r="48" fill="none" stroke="#0071e3" stroke-width="2" opacity="0.4" stroke-dasharray="6 4" />
      <circle cx="0" cy="0" r="30" fill="none" stroke="#38bdf8" stroke-width="2.5" opacity="0.7" />
      <circle cx="0" cy="0" r="14" fill="#38bdf8" opacity="0.9" filter="url(#touchRippleGlow)" />
      <!-- Finger touch indicator line -->
      <path d="M0,0 L60,-40" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.6" />
      <rect x="65" y="-55" width="130" height="24" rx="6" fill="rgba(0,113,227,0.2)" stroke="#0071e3" stroke-width="1" />
      <text x="130" y="-39" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', monospace" font-size="11" font-weight="700" fill="#38bdf8" text-anchor="middle">DIRECT TOUCH</text>
    </g>

    <!-- Clamshell Base / Hinge Shadow -->
    <path d="M-470,220 L470,220 L430,234 L-430,234 Z" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <!-- Notch / Opening groove -->
    <rect x="-50" y="220" width="100" height="6" rx="3" fill="#090d16" />
  </g>

  <!-- Typography & Headers -->
  <g text-anchor="middle">
    <!-- Brand Badge -->
    <rect x="670" y="68" width="260" height="34" rx="17" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
    <text x="800" y="90" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" font-size="12" font-weight="700" letter-spacing="3" fill="#f8fafc">APPLE SPECIAL RELEASE</text>

    <!-- Main Title -->
    <text x="800" y="670" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" font-size="50" font-weight="800" letter-spacing="-1" fill="#ffffff">MacBook Pro with PROLED XDR</text>

    <!-- Subtitle / Meta -->
    <text x="800" y="712" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" font-size="19" font-weight="500" letter-spacing="0.5" fill="#94a3b8">First Touchscreen Mac · Tandem OLED · M5 Pro &amp; M5 Max</text>

    <!-- Feature Pills -->
    <g transform="translate(800, 760)">
      <rect x="-350" y="0" width="210" height="38" rx="8" fill="rgba(0,113,227,0.12)" stroke="rgba(0,113,227,0.4)" stroke-width="1"/>
      <text x="-245" y="24" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', monospace" font-size="13" font-weight="700" fill="#38bdf8">2,000 Nits Peak HDR</text>

      <rect x="-105" y="0" width="210" height="38" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
      <text x="0" y="24" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', monospace" font-size="13" font-weight="700" fill="#ffffff">In-Cell Multi-Touch</text>

      <rect x="140" y="0" width="210" height="38" rx="8" fill="rgba(168,85,247,0.12)" stroke="rgba(168,85,247,0.4)" stroke-width="1"/>
      <text x="245" y="24" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', monospace" font-size="13" font-weight="700" fill="#c084fc">M5 Pro / M5 Max</text>
    </g>
  </g>
</svg>`;

async function main() {
  console.log('Rendering Gemini 4 artwork...');
  const geminiBuffer = await sharp(Buffer.from(geminiSvg)).webp({ quality: 92 }).toBuffer();
  const geminiPath = resolve(root, 'src/assets/images/blog/original-sources/gemini-4-source.webp');
  await writeFile(geminiPath, geminiBuffer);
  const geminiHash = createHash('sha256').update(geminiBuffer).digest('hex');
  console.log(`Gemini 4 WebP written to: ${geminiPath}`);
  console.log(`Gemini 4 SHA256: ${geminiHash}`);

  console.log('Rendering MacBook Pro Touchscreen artwork...');
  const macbookBuffer = await sharp(Buffer.from(macbookSvg)).webp({ quality: 92 }).toBuffer();
  const macbookPath = resolve(
    root,
    'src/assets/images/blog/original-sources/macbook-pro-source.webp'
  );
  await writeFile(macbookPath, macbookBuffer);
  const macbookHash = createHash('sha256').update(macbookBuffer).digest('hex');
  console.log(`MacBook Pro WebP written to: ${macbookPath}`);
  console.log(`MacBook Pro SHA256: ${macbookHash}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
