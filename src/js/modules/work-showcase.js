import { workEvidence } from '../data/work-evidence.js';
import { contributionStories, publicSecurityWork } from '../data/work-editorial.js';
import { escapeHtml } from '../utils/escape-html.js';

const e = escapeHtml;
const date = value =>
  new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const sourceLink = (url, text, className = '') =>
  `<a class="${className}" href="${e(url)}" target="_blank" rel="noopener noreferrer">${text}<span aria-hidden="true"> ↗</span></a>`;

export function renderWorkShowcase() {
  const root = document.getElementById('work-contributions');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  const prs = workEvidence.contributions;
  const byUrl = new Map(prs.map(pr => [pr.url, pr]));
  const repositories = new Set(prs.map(pr => pr.repository));
  const owners = new Set(prs.map(pr => pr.repository.split('/')[0]));
  const searchUrl = `https://github.com/search?q=${encodeURIComponent(workEvidence.query)}&type=pullrequests`;
  const row = pr =>
    `<li>${sourceLink(pr.url, `<span class="work-merge-repo">${e(pr.repository)} <span>#${pr.number}</span></span><span class="work-merge-title">${e(pr.title)}</span><span class="work-merge-date">Merged ${date(pr.mergedAt)}</span>`, 'work-merge-link')}</li>`;
  root.innerHTML = `
    <div class="work-impact">
      <div class="work-impact-number"><span class="work-eyebrow">Open source, upstream.</span><strong>${prs.length}</strong><span>Merged pull requests</span></div>
      <div class="work-impact-story"><h3>Work that lives<br>in other people’s projects.</h3><p>Fixes, features, and documentation accepted across ${repositories.size} repositories and ${owners.size} repository owners.</p>${sourceLink(searchUrl, 'Explore the public record', 'work-text-link')}</div>
    </div>
    <p class="work-verification">Verified ${date(workEvidence.verifiedAt)} · Public merged PRs only. Excludes my own and associated accounts. Repository names identify contribution destinations, not endorsements.</p>
    <div class="work-stories">${contributionStories
      .flatMap(story => {
        const pr = byUrl.get(story.url);
        if (!pr) return [];
        return [
          `<article class="work-story"><span class="work-eyebrow">${e(story.label)}</span><h4>${e(story.title)}</h4><p>${e(story.description)}</p>${sourceLink(pr.url, `${e(pr.repository)} #${pr.number}`, 'work-text-link')}<span class="work-story-date">Merged ${date(pr.mergedAt)}</span></article>`,
        ];
      })
      .join('')}</div>
    <details class="work-ledger"><summary><span>Every merge. A source behind it.</span><span class="work-ledger-count">${prs.length} contributions</span></summary><div class="work-ledger-body"><label for="work-merge-search">Find a contribution</label><input id="work-merge-search" type="search" placeholder="Repository, change, or PR number" autocomplete="off"><p id="work-merge-status" role="status">${prs.length} merged contributions</p><ul id="work-merge-list">${prs.map(row).join('')}</ul></div></details>`;
  const search = root.querySelector('#work-merge-search');
  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    const filtered = prs.filter(pr =>
      `${pr.repository} ${pr.title} ${pr.number}`.toLowerCase().includes(query)
    );
    root.querySelector('#work-merge-list').innerHTML = filtered.map(row).join('');
    root.querySelector('#work-merge-status').textContent =
      `${filtered.length} merged contribution${filtered.length === 1 ? '' : 's'}${query ? ' matching your search' : ''}`;
  });
  const security = document.getElementById('work-bounties');
  if (security)
    security.innerHTML = `<div class="work-security-intro"><span class="work-eyebrow">Bug bounties & responsible disclosure</span><h3>Security work.<br>Evidence first.</h3><p>No public bounty award or disclosure acknowledgement has been verified for this showcase yet.</p><p>The merged fixes below are public security-related engineering contributions. They are not presented as paid bounties or vulnerability awards.</p></div><ul class="work-security-list">${publicSecurityWork
      .filter(url => byUrl.has(url))
      .map(url => row(byUrl.get(url)))
      .join('')}</ul>`;
}
