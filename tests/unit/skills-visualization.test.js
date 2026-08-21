/**
 * @file Unit tests for SkillsVisualization module
 * @module tests/unit/skills-visualization.test.js
 */

import { describe, expect, it } from 'vitest';
import { SkillsVisualization } from '../../src/js/modules/skills-visualization.js';

describe('SkillsVisualization', () => {
  it('instantiates with expected core skill categories', () => {
    const viz = new SkillsVisualization();
    expect(viz.skills).toBeDefined();

    const categories = Object.keys(viz.skills);
    expect(categories).toContain('Programming Languages');
    expect(categories).toContain('Frontend Development');
    expect(categories).toContain('Backend & Databases');
    expect(categories).toContain('Cloud & DevOps');
    expect(categories).toContain('AI & Machine Learning');
    expect(categories.length).toBeGreaterThanOrEqual(5);
  });

  it('calculates comprehensive skill statistics', () => {
    const viz = new SkillsVisualization();
    const stats = viz.getStats();

    expect(stats.totalSkills).toBeGreaterThan(20);
    expect(stats.avgProficiency).toBeGreaterThan(70);
    expect(stats.avgProficiency).toBeLessThanOrEqual(100);
    expect(stats.expertSkills).toBeGreaterThan(0);
    expect(stats.categories).toBe(Object.keys(viz.skills).length);
  });

  it('assigns evidence-based competency tiers correctly in createSkillBadge', () => {
    const viz = new SkillsVisualization();

    const coreSkill = { name: 'Python', level: 95, icon: 'fab fa-python', color: '#3776AB' };
    const proficientSkill = { name: 'React', level: 85, icon: 'fab fa-react', color: '#61DAFB' };
    const familiarSkill = { name: 'Swift', level: 75, icon: 'fab fa-swift', color: '#FA7343' };

    const coreBadge = viz.createSkillBadge(coreSkill, 0);
    const proficientBadge = viz.createSkillBadge(proficientSkill, 1);
    const familiarBadge = viz.createSkillBadge(familiarSkill, 2);

    expect(coreBadge).toContain('Core');
    expect(coreBadge).toContain('Python');
    expect(coreBadge).toContain('fab fa-python');
    expect(coreBadge).toContain('width: 95%');

    expect(proficientBadge).toContain('Proficient');
    expect(proficientBadge).toContain('React');
    expect(proficientBadge).toContain('width: 85%');

    expect(familiarBadge).toContain('Familiar');
    expect(familiarBadge).toContain('Swift');
    expect(familiarBadge).toContain('width: 75%');
  });

  it('triples skills for seamless infinite marquee loop in createCategorySection', () => {
    const viz = new SkillsVisualization();
    const section = viz.createCategorySection(
      'Programming Languages',
      viz.skills['Programming Languages'],
      0
    );

    expect(section).toContain('skill-category-title');
    expect(section).toContain('Programming Languages');
    expect(section).toContain('skill-scroll-wrapper');

    // Count occurrences of Python in the section (should appear 3 times for seamless loop)
    const matches = section.match(/skill-badge-name">Python/g);
    expect(matches).not.toBeNull();
    expect(matches?.length).toBe(3);
  });
});
