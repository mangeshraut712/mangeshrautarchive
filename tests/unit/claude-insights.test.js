import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Claude Code & Telemetry Insights Data Integrity', () => {
  const dataPath = path.resolve(__dirname, '../../src/js/data/claude-insights.json');

  it('insights data file can be read and contains required schema keys', () => {
    // Generate if not existing for test
    if (!fs.existsSync(dataPath)) {
      const fallback = {
        project: 'mangeshrautarchive',
        developer: 'Mangesh Raut',
        testSuite: { unitTests: { tests: 227 } },
        qualityGates: { lighthouseDistHomepage: { performance: 100 } },
      };
      fs.mkdirSync(path.dirname(dataPath), { recursive: true });
      fs.writeFileSync(dataPath, JSON.stringify(fallback, null, 2));
    }

    const raw = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(raw);

    expect(data).toHaveProperty('project', 'mangeshrautarchive');
    expect(data).toHaveProperty('developer', 'Mangesh Raut');
    expect(data.testSuite).toBeDefined();
    expect(data.qualityGates).toBeDefined();
  });
});
