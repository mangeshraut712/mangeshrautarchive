import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readProjectFile(path) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('expensive visual progressive enhancements', () => {
  it('keeps liquid-glass WebGL behind an explicit user opt-in', () => {
    const engine = readProjectFile('src/js/modules/liquid-glass-engine.js');
    expect(engine).toContain("localStorage.getItem('liquid-glass-webgl') === '1'");
    expect(engine).toContain('window.__LG_WEBGL_ENABLED__ === true');
  });

  it('lets the travel list paint before MapLibre starts', () => {
    const atlas = readProjectFile('src/js/modules/travel-atlas.js');
    const page = readProjectFile('src/travel.html');
    expect(atlas).toContain('TRAVEL_MAP_AUTO_START_MS');
    expect(atlas).toContain("document.getElementById('travel-map-load')");
    expect(page).toContain('id="travel-map-load"');
  });

  it('never treats real mobile device models as performance audits', () => {
    const headDetector = readProjectFile('src/js/utils/perf-audit-head.js');
    const moduleDetector = readProjectFile('src/js/utils/perf-audit.js');
    for (const detector of [headDetector, moduleDetector]) {
      expect(detector).not.toMatch(/moto g power|Nexus 5X|Pixel 7/i);
    }
  });
});
