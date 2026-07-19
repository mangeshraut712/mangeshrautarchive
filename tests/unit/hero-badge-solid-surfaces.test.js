import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');

const HERO_BADGE_SHEETS = [
  'src/assets/css/chrome-surfaces.css',
  'src/assets/css/homepage.css',
  'src/assets/css/sections-apple-premium.css',
  'src/assets/css/apple-premium-overrides.css',
  'src/assets/css/theme-solid-surfaces.css',
];

const FORBIDDEN_DARK_FILLS =
  /html\.dark[^{}]*vibe-coder-badge[^{]*\{[^}]*background(?:-color)?\s*:\s*(?:#(?:1c1c1e|2c2c2e|3a3a3c)|rgba?\(\s*28\s*,\s*28\s*,\s*30|rgb\(\s*255\s+255\s+255\s*\/)/i;

describe('hero Vibe Coder / Reach solid surfaces', () => {
  it('keeps a dark-mode solid black lock in chrome-surfaces', () => {
    const css = readFileSync(resolve(ROOT, 'src/assets/css/chrome-surfaces.css'), 'utf8');
    expect(css).toMatch(/html\.dark #home :is\(\.vibe-coder-badge/);
    expect(css).toMatch(/background:\s*#000000\s*!important/);
    expect(css).toMatch(/border-radius:\s*980px\s*!important/);
    expect(css).not.toMatch(/hero-pill-badge[\s\S]{0,80}#2c2c2e/);
  });

  it('does not reintroduce elevated grey fills on dark vibe-coder rules', () => {
    for (const rel of HERO_BADGE_SHEETS) {
      const css = readFileSync(resolve(ROOT, rel), 'utf8');
      expect(css, rel).not.toMatch(FORBIDDEN_DARK_FILLS);
    }
  });

  it('does not force hero pills into luxury mini-card radius', () => {
    const css = readFileSync(resolve(ROOT, 'src/assets/css/apple-cards-luxury-2026.css'), 'utf8');
    const compactBlock = css.match(
      /Compact chips \/ badges[\s\S]*?:is\(([\s\S]*?)\)\s*\{[\s\S]*?border-radius:\s*var\(--lux-radius-sm\)/
    );
    expect(compactBlock?.[1] || '').not.toMatch(
      /hero-pill-badge|portfolio-reach-badge|vibe-coder-badge/
    );
  });
});
