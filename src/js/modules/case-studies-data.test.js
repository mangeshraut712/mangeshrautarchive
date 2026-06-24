import { describe, expect, it } from 'vitest';
import {
  getCaseStudyEvidenceLinks,
  getProjectEvidenceLinks,
  normalizeExternalUrl,
  renderRepoEvidenceRow,
} from './case-studies-data.js';

describe('normalizeExternalUrl', () => {
  it('returns null for empty values', () => {
    expect(normalizeExternalUrl(null)).toBeNull();
    expect(normalizeExternalUrl('')).toBeNull();
    expect(normalizeExternalUrl('   ')).toBeNull();
  });

  it('adds https when protocol is missing', () => {
    expect(normalizeExternalUrl('example.com')).toBe('https://example.com/');
    expect(normalizeExternalUrl('mangeshraut.pro')).toBe('https://mangeshraut.pro/');
  });

  it('preserves explicit http(s) URLs', () => {
    expect(normalizeExternalUrl('https://github.com/mangeshraut712/mangeshrautarchive')).toBe(
      'https://github.com/mangeshraut712/mangeshrautarchive'
    );
  });

  it('rejects non-http(s) protocols', () => {
    expect(normalizeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeExternalUrl('data:text/html,hello')).toBeNull();
  });
});

describe('getProjectEvidenceLinks', () => {
  it('defaults architecture for repos without a case study', () => {
    const links = getProjectEvidenceLinks({
      name: 'random-repo',
      html_url: 'https://github.com/mangeshraut712/random-repo',
      homepage: 'demo.example.com',
    });

    expect(links.architecture).toBe('systems.html#architecture');
    expect(links.demo).toBe('https://demo.example.com/');
    expect(links.story).toBeNull();
  });

  it('maps flagship portfolio repo to case study anchors', () => {
    const links = getProjectEvidenceLinks({
      name: 'mangeshrautarchive',
      html_url: 'https://github.com/mangeshraut712/mangeshrautarchive',
      homepage: 'https://mangeshraut.pro/',
    });

    expect(links.architecture).toBe('systems.html#architecture-dual-host');
    expect(links.story).toBe('case-studies/portfolio.html');
  });
});

describe('getCaseStudyEvidenceLinks', () => {
  it('sanitizes invalid architecture anchors', () => {
    const links = getCaseStudyEvidenceLinks({
      slug: 'x',
      repoUrl: 'https://github.com/example/x',
      demoUrl: null,
      architectureAnchor: 'javascript:alert(1)',
    });

    expect(links.find(item => item.label === 'Architecture')?.href).toBe(
      'systems.html#architecture'
    );
  });
});

describe('renderRepoEvidenceRow', () => {
  it('escapes repo names in aria-label and marks missing demo unavailable', () => {
    const html = renderRepoEvidenceRow({
      name: 'repo<script>',
      html_url: 'https://github.com/mangeshraut712/repo',
      homepage: null,
    });

    expect(html).toContain('aria-label="Project evidence for repo&lt;script&gt;"');
    expect(html).toContain(
      'class="project-evidence-link is-unavailable" aria-disabled="true">Demo</span>'
    );
    expect(html).toContain('href="systems.html#architecture"');
  });
});
