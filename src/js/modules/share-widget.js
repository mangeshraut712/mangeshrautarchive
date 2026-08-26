/**
 * Website Share Widget
 * Provides a QR card, copy link, native share, and social share options.
 */

import { sitePath } from '../utils/site-base.js';

const SHARE_MIRRORS = [
  { name: 'GitHub Pages (live)', url: 'https://mangeshraut712.github.io/mangeshrautarchive/' },
  { name: 'Custom domain (Vercel)', url: 'https://mangeshraut.pro' },
  { name: 'Vercel app', url: 'https://mraut.vercel.app' },
];

let activeMirrorUrl = SHARE_MIRRORS[0].url;
const SHARE_TOGGLE_ID = 'website-share-toggle';
const SHARE_TOGGLE_LABEL = 'Share website';
const SHARE_TITLE = 'Mangesh Raut Archive';
const SHARE_TEXT =
  "Explore Mangesh Raut's software engineering portfolio, projects, writing, and systems work.";
const RESUME_PDF_PATH = 'assets/files/Mangesh_Raut_Resume.pdf';

const SHARE_OPTIONS = [
  {
    label: 'X (Twitter)',
    icon: 'fa-brands fa-x-twitter',
    href: url =>
      `https://x.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(url)}`,
  },
  {
    label: 'LinkedIn',
    icon: 'fa-brands fa-linkedin-in',
    href: url => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    label: 'Email',
    icon: 'fa-solid fa-envelope',
    href: url =>
      `mailto:?subject=${encodeURIComponent(SHARE_TITLE)}&body=${encodeURIComponent(`${SHARE_TEXT}\n\n${url}`)}`,
  },
];

const getQrCodeUrl = url =>
  `https://quickchart.io/qr?size=320&dark=0071e3&light=ffffff&ecLevel=H&margin=1&text=${encodeURIComponent(url)}`;

const waitForFrame = () =>
  new Promise(resolve => {
    requestAnimationFrame(() => resolve());
  });

function createShareToggleButton() {
  const button = document.createElement('button');
  button.id = SHARE_TOGGLE_ID;
  button.type = 'button';
  button.className = 'website-share-fab';
  button.setAttribute('aria-label', SHARE_TOGGLE_LABEL);
  button.setAttribute('data-label', SHARE_TOGGLE_LABEL);
  button.innerHTML = `
    <span class="website-share-fab__icon" aria-hidden="true">
      <i class="fa-solid fa-share-nodes" style="font-size: 15px;"></i>
    </span>
  `;
  return button;
}

/**
 * Share FAB is independent of the accessibility menu (left dock, below a11y).
 * A11y sits above so its expanding panel never covers the share control.
 */
function repairShareToggle() {
  const existingToggle = document.getElementById(SHARE_TOGGLE_ID);
  if (existingToggle) {
    // Detach from legacy a11y toolbar if still nested there
    if (existingToggle.closest('.a11y-toolbar')) {
      existingToggle.classList.add('website-share-fab');
      document.body.appendChild(existingToggle);
    }
    return existingToggle;
  }

  const repairedToggle = createShareToggleButton();
  document.body.appendChild(repairedToggle);
  return repairedToggle;
}

const createShareMarkup = () => `
  <div id="website-share-dialog" class="website-share-dialog hidden" role="dialog" aria-modal="true" aria-labelledby="website-share-title" aria-hidden="true" tabindex="-1" style="display:none">
    <div class="website-share-backdrop" data-share-close></div>
    <div class="website-share-card" aria-describedby="website-share-description">
      <div class="website-share-card-top">
        <div class="website-share-mirrors" role="tablist" aria-label="Select website mirror">
          ${SHARE_MIRRORS.map(
            (mirror, idx) => `
          <div class="share-mirror-tab ${idx === 0 ? 'active' : ''}" role="tab" aria-selected="${idx === 0 ? 'true' : 'false'}" tabindex="0" data-mirror-idx="${idx}">
            ${mirror.name.split(' ')[0]}
          </div>
        `
          ).join('')}
        </div>
        <button class="website-share-close" type="button" aria-label="Close share options" data-share-close>
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </div>

      <div class="website-share-qr-section">
        <!-- Generative Botanical/Neural Tree Canvas (tree.icqr.com inspired) -->
        <canvas class="qr-tree-canvas" width="300" height="270" aria-hidden="true"></canvas>

        <div class="website-share-qr-ambient" aria-hidden="true">
          <div class="qr-ambient-pulse qr-pulse-1"></div>
          <div class="qr-ambient-pulse qr-pulse-2"></div>
        </div>
        <div class="website-share-qr-shell" aria-label="QR code for webpage">
          <!-- Glass Specular Reflection -->
          <div class="qr-specular-gloss" aria-hidden="true"></div>

          <!-- Cyber/Apple Viewfinder Corner Brackets -->
          <div class="qr-corner-bracket qr-bracket-tl" aria-hidden="true"></div>
          <div class="qr-corner-bracket qr-bracket-tr" aria-hidden="true"></div>
          <div class="qr-corner-bracket qr-bracket-bl" aria-hidden="true"></div>
          <div class="qr-corner-bracket qr-bracket-br" aria-hidden="true"></div>
          
          <!-- Animated Laser Scanning Beam -->
          <div class="qr-laser-scanner" aria-hidden="true">
            <div class="qr-laser-line"></div>
            <div class="qr-laser-glow"></div>
          </div>

          <img class="website-share-qr" data-src="${getQrCodeUrl(activeMirrorUrl)}" alt="QR code" width="168" height="168" loading="lazy" decoding="async" onerror="this.onerror=null;this.closest('.website-share-qr-section')?.classList.add('is-hidden');">
          <span class="website-share-qr-logo" aria-hidden="true">
            <img src="assets/images/profile.webp" alt="Mangesh Raut" width="32" height="32" loading="lazy" decoding="async">
          </span>
        </div>
        <div class="qr-scan-hint" aria-hidden="true">
          <i class="fa-solid fa-camera" aria-hidden="true"></i>
          <span>Scan to visit portfolio</span>
        </div>
      </div>

      <div class="website-share-actions-list">
        <div id="website-share-copy" class="share-action-row" role="button" tabindex="0">
          <span>Copy Link</span>
          <i class="fas fa-copy" aria-hidden="true"></i>
        </div>
        
        <div id="website-native-share" class="share-action-row" role="button" tabindex="0">
          <span>System Share...</span>
          <i class="fa-solid fa-arrow-up-from-bracket" aria-hidden="true"></i>
        </div>

        <a class="share-action-row" data-social="X" href="${SHARE_OPTIONS[0].href(activeMirrorUrl)}" target="_blank" rel="noopener noreferrer">
          <span>Share on X (Twitter)</span>
          <i class="fa-brands fa-x-twitter" aria-hidden="true"></i>
        </a>

        <a class="share-action-row" data-social="LinkedIn" href="${SHARE_OPTIONS[1].href(activeMirrorUrl)}" target="_blank" rel="noopener noreferrer">
          <span>Share on LinkedIn</span>
          <i class="fa-brands fa-linkedin-in" aria-hidden="true"></i>
        </a>

        <a class="share-action-row" data-social="Email" href="${SHARE_OPTIONS[2].href(activeMirrorUrl)}" target="_blank" rel="noopener noreferrer">
          <span>Send via Email</span>
          <i class="fa-solid fa-envelope" aria-hidden="true"></i>
        </a>
      </div>

      <p id="website-share-status" class="website-share-status" role="status" aria-live="polite"></p>
    </div>
  </div>
`;

class QrTreeAnimation {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.isRunning = false;
    this.animId = null;
    this.time = 0;
    this.particles = [];
    this.pulses = [];
    this.width = 300;
    this.height = 270;
    this.initCanvasSize();
    this.initParticles();
    this.initPulses();
  }

  initCanvasSize() {
    if (!this.canvas || !this.ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  initParticles() {
    this.particles = Array.from({ length: 22 }, () => ({
      x: 30 + Math.random() * (this.width - 60),
      y: 40 + Math.random() * (this.height - 60),
      vx: (Math.random() - 0.5) * 0.35,
      vy: -0.35 - Math.random() * 0.45,
      radius: 1 + Math.random() * 2,
      baseAlpha: 0.2 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03,
    }));
  }

  initPulses() {
    this.pulses = [
      { progress: 0, speed: 0.007, branchIndex: 0 },
      { progress: 0.33, speed: 0.006, branchIndex: 1 },
      { progress: 0.66, speed: 0.008, branchIndex: 2 },
      { progress: 0.5, speed: 0.0065, branchIndex: 3 },
    ];
  }

  start() {
    if (this.isRunning || !this.ctx) return;
    this.isRunning = true;
    this.initCanvasSize();
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  getBranches(time) {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const sway1 = Math.sin(time * 0.0012) * 5;
    const sway2 = Math.cos(time * 0.0016) * 6;
    const sway3 = Math.sin(time * 0.001) * 4;

    return [
      // Left side branches wrapping around the QR code
      {
        start: { x: cx - 20, y: this.height - 15 },
        cp1: { x: cx - 70 + sway1, y: this.height - 60 },
        cp2: { x: cx - 110 + sway2, y: cy + 40 },
        end: { x: cx - 95 + sway1, y: cy - 20 },
        subBranches: [
          {
            start: { x: cx - 100 + sway2, y: cy + 30 },
            cp: { x: cx - 130 + sway3, y: cy },
            end: { x: cx - 120 + sway1, y: cy - 50 },
          },
          {
            start: { x: cx - 95 + sway1, y: cy - 20 },
            cp: { x: cx - 90 + sway2, y: cy - 70 },
            end: { x: cx - 60 + sway3, y: cy - 90 },
          },
        ],
      },
      // Right side branches wrapping around the QR code
      {
        start: { x: cx + 20, y: this.height - 15 },
        cp1: { x: cx + 70 - sway1, y: this.height - 60 },
        cp2: { x: cx + 110 - sway2, y: cy + 40 },
        end: { x: cx + 95 - sway1, y: cy - 20 },
        subBranches: [
          {
            start: { x: cx + 100 - sway2, y: cy + 30 },
            cp: { x: cx + 130 - sway3, y: cy },
            end: { x: cx + 120 - sway1, y: cy - 50 },
          },
          {
            start: { x: cx + 95 - sway1, y: cy - 20 },
            cp: { x: cx + 90 - sway2, y: cy - 70 },
            end: { x: cx + 60 - sway3, y: cy - 90 },
          },
        ],
      },
      // Top crown canopy branches
      {
        start: { x: cx - 40, y: cy - 80 },
        cp1: { x: cx - 30 + sway2, y: cy - 105 },
        cp2: { x: cx - 10 + sway1, y: cy - 115 },
        end: { x: cx + sway3, y: cy - 118 },
        subBranches: [
          {
            start: { x: cx + 40, y: cy - 80 },
            cp: { x: cx + 20 + sway1, y: cy - 112 },
            end: { x: cx + sway3, y: cy - 118 },
          },
        ],
      },
    ];
  }

  draw() {
    if (!this.ctx) return;
    const isDark = document.documentElement.classList.contains('dark');
    this.ctx.clearRect(0, 0, this.width, this.height);

    const branchColor = isDark ? 'rgba(41, 151, 255, 0.42)' : 'rgba(0, 113, 227, 0.28)';
    const glowColor = isDark ? 'rgba(100, 210, 255, 0.7)' : 'rgba(0, 113, 227, 0.5)';
    const nodeColor = isDark ? '#64d2ff' : '#0071e3';

    const branches = this.getBranches(this.time);

    // Draw main trunks and sub-branches
    this.ctx.lineWidth = 1.6;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = branchColor;

    branches.forEach(b => {
      this.ctx.beginPath();
      this.ctx.moveTo(b.start.x, b.start.y);
      this.ctx.bezierCurveTo(b.cp1.x, b.cp1.y, b.cp2.x, b.cp2.y, b.end.x, b.end.y);
      this.ctx.stroke();

      // Node at main branch tip
      this.drawGlowNode(b.end.x, b.end.y, 2.5, nodeColor, glowColor);

      if (b.subBranches) {
        b.subBranches.forEach(sb => {
          this.ctx.beginPath();
          this.ctx.moveTo(sb.start.x, sb.start.y);
          this.ctx.quadraticCurveTo(sb.cp.x, sb.cp.y, sb.end.x, sb.end.y);
          this.ctx.stroke();

          // Node at sub-branch tip
          this.drawGlowNode(sb.end.x, sb.end.y, 2, nodeColor, glowColor);
        });
      }
    });

    // Draw synaptic light pulses moving along branches
    this.pulses.forEach(p => {
      p.progress += p.speed;
      if (p.progress > 1) p.progress = 0;
      const b = branches[p.branchIndex % branches.length];
      if (b) {
        const t = p.progress;
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;
        const px = uuu * b.start.x + 3 * uu * t * b.cp1.x + 3 * u * tt * b.cp2.x + ttt * b.end.x;
        const py = uuu * b.start.y + 3 * uu * t * b.cp1.y + 3 * u * tt * b.cp2.y + ttt * b.end.y;
        this.drawPulseGlow(px, py, isDark);
      }
    });

    // Draw floating bioluminescent particles/spores
    this.particles.forEach(p => {
      p.y += p.vy;
      p.x += p.vx + Math.sin(this.time * 0.002 + p.phase) * 0.25;
      p.phase += p.pulseSpeed;

      if (p.y < 10) {
        p.y = this.height - 20;
        p.x = 40 + Math.random() * (this.width - 80);
      }

      const alpha = p.baseAlpha * (0.6 + 0.4 * Math.sin(p.phase));
      this.ctx.fillStyle = isDark ? `rgba(100, 210, 255, ${alpha})` : `rgba(0, 113, 227, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  drawGlowNode(x, y, radius, color, glow) {
    const pulse = 1 + 0.25 * Math.sin(this.time * 0.003 + x);
    this.ctx.save();
    this.ctx.shadowColor = glow;
    this.ctx.shadowBlur = 8;
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius * pulse, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawPulseGlow(x, y, isDark) {
    this.ctx.save();
    this.ctx.fillStyle = isDark ? '#ffffff' : '#0071e3';
    this.ctx.shadowColor = isDark ? '#64d2ff' : '#2997ff';
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 3, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  loop() {
    if (!this.isRunning) return;
    this.time = performance.now();
    this.draw();
    this.animId = requestAnimationFrame(() => this.loop());
  }
}

function initQr3dParallax(cardSection, qrShell) {
  if (!cardSection || !qrShell) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const onMouseMove = e => {
    const rect = cardSection.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = (-y / (rect.height / 2)) * 10;
    const rotateY = (x / (rect.width / 2)) * 10;
    qrShell.style.transform = `perspective(600px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const onMouseLeave = () => {
    qrShell.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

  cardSection.addEventListener('mousemove', onMouseMove);
  cardSection.addEventListener('mouseleave', onMouseLeave);
}

function setDialogState(dialog, trigger, isOpen, treeAnim) {
  dialog.classList.toggle('active', isOpen);
  if (isOpen) {
    dialog.classList.remove('hidden');
    dialog.style.removeProperty('display');
    const qrImg = dialog.querySelector('.website-share-qr');
    if (qrImg && !qrImg.getAttribute('src') && qrImg.dataset.src) {
      qrImg.src = qrImg.dataset.src;
    }
    if (treeAnim) {
      treeAnim.start();
    }
  } else {
    dialog.classList.add('hidden');
    dialog.style.display = 'none';
    if (treeAnim) {
      treeAnim.stop();
    }
  }
  dialog.setAttribute('aria-hidden', String(!isOpen));
  if (trigger) {
    trigger.setAttribute('aria-expanded', String(isOpen));
  }
  document.body.classList.toggle('share-dialog-open', isOpen);
}

export async function ensureShareToggleReady() {
  const existingToggle = document.getElementById(SHARE_TOGGLE_ID);
  if (existingToggle) {
    return existingToggle;
  }

  try {
    await import('./accessibility.js');
  } catch (error) {
    console.warn('Share toggle bootstrap skipped:', error);
  }

  for (let attempts = 0; attempts < 3; attempts += 1) {
    const toggle = document.getElementById(SHARE_TOGGLE_ID) || repairShareToggle();
    if (toggle) return toggle;
    await waitForFrame();
  }

  return repairShareToggle();
}

if (typeof window !== 'undefined') {
  window.websiteShareWidget = {
    ...(window.websiteShareWidget || {}),
    ensureShareToggleReady,
  };
}

async function shareWithSystemSheet(status) {
  const payload = {
    title: SHARE_TITLE,
    text: SHARE_TEXT,
    url: activeMirrorUrl,
  };

  if (typeof navigator.canShare === 'function') {
    try {
      const response = await fetch(RESUME_PDF_PATH, { credentials: 'same-origin' });
      if (response.ok) {
        const blob = await response.blob();
        const file = new File([blob], 'Mangesh_Raut_Resume.pdf', {
          type: blob.type || 'application/pdf',
        });
        const withFiles = { ...payload, files: [file] };
        if (navigator.canShare(withFiles)) {
          await navigator.share(withFiles);
          status.textContent = 'Share sheet opened with resume.';
          return;
        }
      }
    } catch {
      // Fall through to URL-only share.
    }
  }

  await navigator.share(payload);
  status.textContent = 'Share sheet opened.';
}

async function copyShareUrl(status) {
  try {
    await navigator.clipboard.writeText(activeMirrorUrl);
    status.textContent = 'Portfolio link copied.';
    return true;
  } catch (_error) {
    const tempInput = document.createElement('input');
    tempInput.value = activeMirrorUrl;
    document.body.appendChild(tempInput);
    tempInput.select();
    const copied = document.execCommand?.('copy') || false;
    document.body.removeChild(tempInput);
    status.textContent = copied ? 'Portfolio link copied.' : 'Failed to copy link automatically.';
    return copied;
  }
}

function ensureShareWidgetStyles() {
  if (document.getElementById('share-widget-stylesheet')) return;
  if (document.querySelector('link[href*="share-widget.css"]')) return;

  const link = document.createElement('link');
  link.id = 'share-widget-stylesheet';
  link.rel = 'stylesheet';
  link.href = `${sitePath('/assets/css/share-widget.css')}?v=20260712s`;
  document.head.appendChild(link);
}

async function initShareWidget() {
  ensureShareWidgetStyles();
  if (document.getElementById('website-share-dialog')) return;

  await ensureShareToggleReady();
  document.body.insertAdjacentHTML('beforeend', createShareMarkup());

  const dialog = document.getElementById('website-share-dialog');
  const canvas = dialog.querySelector('.qr-tree-canvas');
  const treeAnim = canvas ? new QrTreeAnimation(canvas) : null;

  // Force closed layout even if stylesheet is still loading
  setDialogState(dialog, document.getElementById(SHARE_TOGGLE_ID), false, treeAnim);
  const card = dialog.querySelector('.website-share-card');
  const qrSection = dialog.querySelector('.website-share-qr-section');
  const qrShell = dialog.querySelector('.website-share-qr-shell');
  const copyButton = document.getElementById('website-share-copy');
  const nativeShareButton = document.getElementById('website-native-share');
  const status = document.getElementById('website-share-status');

  initQr3dParallax(qrSection, qrShell);

  const closeDialog = () => {
    const trigger = document.getElementById(SHARE_TOGGLE_ID);
    setDialogState(dialog, trigger, false, treeAnim);
    if (trigger) {
      trigger.focus({ preventScroll: true });
    }
  };

  const openDialog = () => {
    const trigger = document.getElementById(SHARE_TOGGLE_ID);
    status.textContent = '';
    setDialogState(dialog, trigger, true, treeAnim);
    dialog.focus({ preventScroll: true });
  };

  const handleShareToggle = async event => {
    const trigger = event.target.closest(`#${SHARE_TOGGLE_ID}`);
    if (!trigger) return;

    event.preventDefault();
    await ensureShareToggleReady();

    const isOpen = dialog.classList.contains('active');
    if (isOpen) {
      closeDialog();
    } else {
      openDialog();
    }
  };

  // Delegated activation for share toggle
  document.addEventListener('click', handleShareToggle);

  dialog.addEventListener('click', event => {
    if (event.target.closest('[data-share-close]')) {
      closeDialog();
    }
  });

  card.addEventListener('click', event => {
    // If the click is on the close button, let it bubble to the dialog listener
    if (event.target.closest('[data-share-close]')) {
      return;
    }
    event.stopPropagation();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && dialog.classList.contains('active')) {
      closeDialog();
    }
  });

  // Keyboard accessibility handler for role="button" divs
  const handleKeyboardActivation = (el, action) => {
    el.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        action();
      }
    });
  };

  // Mirror tabs switcher implementation
  const tabs = dialog.querySelectorAll('.share-mirror-tab');
  tabs.forEach(tab => {
    const activateTab = () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const idx = parseInt(tab.dataset.mirrorIdx, 10);
      const mirror = SHARE_MIRRORS[idx];
      activeMirrorUrl = mirror.url;

      // Update QR Code image source dynamically
      const qrImg = dialog.querySelector('.website-share-qr');
      if (qrImg) {
        qrImg.src = getQrCodeUrl(mirror.url);
      }

      // Update social links href values dynamically
      const updateSocialLink = (socialName, hrefGen) => {
        const link = dialog.querySelector(`.share-action-row[data-social="${socialName}"]`);
        if (link) {
          link.href = hrefGen(mirror.url);
        }
      };

      updateSocialLink('X', SHARE_OPTIONS[0].href);
      updateSocialLink('LinkedIn', SHARE_OPTIONS[1].href);
      updateSocialLink('Email', SHARE_OPTIONS[2].href);
    };

    tab.addEventListener('click', activateTab);
    handleKeyboardActivation(tab, activateTab);
  });

  const triggerCopy = async () => {
    await copyShareUrl(status);
  };
  copyButton.addEventListener('click', triggerCopy);
  handleKeyboardActivation(copyButton, triggerCopy);

  if (!navigator.share) {
    nativeShareButton.hidden = true;
  } else {
    const triggerNativeShare = async () => {
      try {
        await shareWithSystemSheet(status);
      } catch (error) {
        if (error?.name !== 'AbortError') {
          status.textContent = 'Share sheet is unavailable. Copy the link instead.';
        }
      }
    };
    nativeShareButton.addEventListener('click', triggerNativeShare);
    handleKeyboardActivation(nativeShareButton, triggerNativeShare);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShareWidget, { once: true });
} else {
  initShareWidget();
}
