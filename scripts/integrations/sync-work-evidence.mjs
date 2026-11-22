import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { format } from 'prettier';

export const CONTRIBUTION_QUERY =
  'author:mangeshraut712 is:pr is:merged is:public -user:mangeshraut712 -user:dayx61 -user:Roojool';
const EXCLUDED_OWNERS = new Set(['mangeshraut712', 'dayx61', 'roojool']);

export function normalizeContributions(items) {
  const seen = new Set();
  return items
    .flatMap(item => {
      const match = String(item.html_url || '').match(
        /^https:\/\/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)$/
      );
      if (
        !match ||
        !item.pull_request?.merged_at ||
        item.user?.login?.toLowerCase() !== 'mangeshraut712'
      )
        return [];
      const repository = match[1];
      const identity = item.id ?? `${repository.toLowerCase()}/pull/${Number(match[2])}`;
      if (EXCLUDED_OWNERS.has(repository.split('/')[0].toLowerCase()) || seen.has(identity))
        return [];
      seen.add(identity);
      return [
        {
          repository,
          number: Number(match[2]),
          title: item.title,
          url: item.html_url,
          mergedAt: item.pull_request.merged_at,
        },
      ];
    })
    .sort((a, b) => b.mergedAt.localeCompare(a.mergedAt) || a.url.localeCompare(b.url));
}

export async function fetchWorkEvidence({
  fetchImpl = fetch,
  token = '',
  now = () => new Date().toISOString(),
} = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const read = async url => {
    const response = await fetchImpl(url, { headers });
    if (!response.ok) throw new Error(`GitHub evidence request failed: ${response.status}`);
    return response.json();
  };
  const repositories = new Map();
  for (let page = 1; ; page++) {
    const items = await read(
      `https://api.github.com/users/mangeshraut712/repos?per_page=100&sort=updated&type=owner&page=${page}`
    );
    if (!Array.isArray(items)) throw new Error('Invalid repository page');
    for (const item of items) {
      if (item.private) continue;
      if (!item.full_name || !item.owner?.login) throw new Error('Invalid public repository');
      repositories.set(item.id ?? item.full_name.toLowerCase(), item);
    }
    if (items.length < 100) break;
    if (page >= 100) throw new Error('Repository pagination limit reached');
  }
  const pulls = [];
  let total;
  for (let page = 1; ; page++) {
    const data = await read(
      `https://api.github.com/search/issues?q=${encodeURIComponent(CONTRIBUTION_QUERY)}&per_page=100&page=${page}`
    );
    if (data.incomplete_results || !Array.isArray(data.items))
      throw new Error('Incomplete contribution search; previous snapshot retained');
    total = data.total_count;
    if (total > 1000)
      throw new Error('Contribution search requires date partitioning above 1000 results');
    pulls.push(...data.items);
    if (pulls.length >= total) break;
    if (!data.items.length || page >= 10)
      throw new Error('Contribution search ended before its total');
  }
  const contributions = normalizeContributions(pulls);
  if (contributions.length !== total)
    throw new Error('Contribution count changed or records failed verification; retry sync');
  return {
    verifiedAt: now(),
    query: CONTRIBUTION_QUERY,
    excludedOwners: [...EXCLUDED_OWNERS],
    contributions,
    repositories: [...repositories.values()].map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      homepage: repo.homepage,
      language: repo.language,
      topics: repo.topics || [],
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      open_issues_count: repo.open_issues_count,
      size: repo.size,
      license: repo.license ? { spdx_id: repo.license.spdx_id } : null,
      default_branch: repo.default_branch,
      updated_at: repo.updated_at,
      pushed_at: repo.pushed_at,
      fork: repo.fork,
      archived: repo.archived,
      owner: { login: repo.owner.login },
    })),
  };
}

export async function syncWorkEvidence() {
  const snapshot = await fetchWorkEvidence({
    token: process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '',
  });
  const target = 'src/js/data/work-evidence.js';
  let previous;
  try {
    previous = await readFile(target, 'utf8');
  } catch {
    /* First verified snapshot. */
  }
  const serialized = await format(`export const workEvidence = ${JSON.stringify(snapshot)};\n`, {
    parser: 'babel',
    singleQuote: true,
    trailingComma: 'es5',
    arrowParens: 'avoid',
    printWidth: 100,
  });
  const stripDate = value => value?.replace(/verifiedAt: '[^']*'/, "verifiedAt: ''");
  if (stripDate(previous) !== stripDate(serialized)) await writeFile(target, serialized);
  console.log(
    `Verified ${snapshot.contributions.length} merged external PRs and ${snapshot.repositories.length} public repositories.`
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  syncWorkEvidence().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
