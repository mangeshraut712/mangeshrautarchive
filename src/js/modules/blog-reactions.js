/**
 * Medium-style local reactions for blog articles.
 * Counts persist in localStorage per post id (no backend required).
 */

const STORAGE_KEY = 'mangesh-blog-reactions-v1';

const REACTIONS = [
  { id: 'clap', label: 'Useful', icon: 'fa-hands-clapping' },
  { id: 'insight', label: 'Insightful', icon: 'fa-lightbulb' },
  { id: 'bookmark', label: 'Save', icon: 'fa-bookmark' },
];

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* private mode / quota — ignore */
  }
}

function getPostState(postId) {
  const store = readStore();
  const entry = store[postId] || { counts: {}, mine: {} };
  entry.counts = entry.counts || {};
  entry.mine = entry.mine || {};
  return { store, entry };
}

function renderBar(root, postId) {
  const { entry } = getPostState(postId);
  root.innerHTML = `
    <p class="article-reactions__label">React to this field note</p>
    <div class="article-reactions__row" role="group" aria-label="Article reactions">
      ${REACTIONS.map(r => {
        const count = Number(entry.counts[r.id] || 0);
        const active = Boolean(entry.mine[r.id]);
        return `
          <button
            type="button"
            class="article-reaction${active ? ' is-active' : ''}"
            data-reaction="${r.id}"
            aria-pressed="${active ? 'true' : 'false'}"
          >
            <i class="fas ${r.icon}" aria-hidden="true"></i>
            <span class="article-reaction__label">${r.label}</span>
            <span class="article-reaction__count" data-count-for="${r.id}">${count}</span>
          </button>`;
      }).join('')}
    </div>
    <p class="article-reactions__hint">Reactions stay on this device — a quiet clap for useful writing.</p>
  `;
}

function toggleReaction(postId, reactionId) {
  const { store, entry } = getPostState(postId);
  const wasMine = Boolean(entry.mine[reactionId]);
  const next = Math.max(0, Number(entry.counts[reactionId] || 0) + (wasMine ? -1 : 1));
  entry.counts[reactionId] = next;
  if (wasMine) delete entry.mine[reactionId];
  else entry.mine[reactionId] = true;
  store[postId] = entry;
  writeStore(store);
  return entry;
}

export function mountArticleReactions(container, postId) {
  if (!container || !postId) return;
  let root = container.querySelector('[data-blog-reactions]');
  if (!root) {
    root = document.createElement('aside');
    root.className = 'article-reactions';
    root.setAttribute('data-blog-reactions', postId);
    root.setAttribute('aria-label', 'Article reactions');
    container.appendChild(root);
  } else {
    root.setAttribute('data-blog-reactions', postId);
  }

  renderBar(root, postId);

  root.onclick = event => {
    const btn = event.target.closest('[data-reaction]');
    if (!btn) return;
    const reactionId = btn.getAttribute('data-reaction');
    if (!reactionId) return;
    const entry = toggleReaction(postId, reactionId);
    renderBar(root, postId);
    const live = root.querySelector(`[data-count-for="${reactionId}"]`);
    if (live) live.textContent = String(entry.counts[reactionId] || 0);
  };
}

export function initArticleReactions() {
  const article = document.querySelector('.blog-article[data-post-id], .blog-article');
  const main = document.querySelector('.blog-article-main');
  const postId =
    article?.getAttribute('data-post-id') ||
    main?.getAttribute('data-post-id') ||
    document.body.getAttribute('data-post-id');
  if (!postId) return;

  let host = document.querySelector('[data-blog-reactions-host]');
  if (!host && article) {
    host = document.createElement('div');
    host.setAttribute('data-blog-reactions-host', '');
    const related = article.querySelector('.article-related');
    if (related) article.insertBefore(host, related);
    else article.appendChild(host);
  }
  if (host) mountArticleReactions(host, postId);
}
