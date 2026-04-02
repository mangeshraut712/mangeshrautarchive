"""
Personal Intelligence: GitHub Integration
Connects to GitHub API to provide real-time repository data and code analysis

Features:
- Fetch live repository statistics
- Analyze code contributions
- Extract project insights
- Privacy-preserving (public repos only by default)
"""

import asyncio
import json
import os
import shutil
import subprocess
from collections import Counter
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

import httpx


class GitHubConnector:
    """
    GitHub API integration for Personal Intelligence

    Provides:
    - Real-time repo stats (stars, forks, languages)
    - Recent activity and contributions
    - Project descriptions and insights
    - Code quality metrics
    """

    def __init__(self, access_token: Optional[str] = None):
        """
        Initialize GitHub connector

        Args:
            access_token: Optional GitHub personal access token for higher rate limits
        """
        self.access_token = access_token
        self.base_url = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "AssistMe-Personal-Intelligence/1.0"
        }

        if access_token:
            self.headers["Authorization"] = f"token {access_token}"

        # Cache to avoid rate limits
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes

    async def _fetch_json(
        self,
        path: str,
        *,
        params: Optional[Dict[str, Any]] = None,
        timeout: float = 10.0,
    ) -> Any:
        url = f"{self.base_url}{path}"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=self.headers, params=params, timeout=timeout)
        except httpx.RequestError:
            raise

        should_try_gh = response.status_code in (403, 429) and not self.access_token and shutil.which('gh')
        if should_try_gh:
            gh_path = path.lstrip('/')
            if params:
                query = '&'.join(
                    f"{key}={httpx.QueryParams({key: value})[key]}"
                    for key, value in params.items()
                    if value is not None
                )
                if query:
                    gh_path = f"{gh_path}?{query}"

            try:
                gh_run = subprocess.run(
                    ['gh', 'api', gh_path],
                    capture_output=True,
                    text=True,
                    check=True,
                    timeout=12,
                )
                return json.loads(gh_run.stdout) if gh_run.stdout else {}
            except Exception:
                response.raise_for_status()

        response.raise_for_status()
        return response.json()

    async def get_user_profile(self, username: str = "mangeshraut712") -> Dict[str, Any]:
        """Fetch user profile information"""
        cache_key = f"profile:{username}"

        # Check cache
        if self._is_cached(cache_key):
            return self._get_cached_data(cache_key)

        url = f"{self.base_url}/users/{username}"

        try:
            data = await self._fetch_json(f"/users/{username}")

            # Extract relevant info
            profile = {
                'username': data.get('login'),
                'name': data.get('name'),
                'bio': data.get('bio'),
                'location': data.get('location'),
                'company': data.get('company'),
                'blog': data.get('blog'),
                'email': data.get('email'),
                'public_repos': data.get('public_repos'),
                'followers': data.get('followers'),
                'following': data.get('following'),
                'created_at': data.get('created_at'),
                'updated_at': data.get('updated_at'),
                'avatar_url': data.get('avatar_url'),
                'html_url': data.get('html_url')
            }

            self._cache_data(cache_key, profile)
            return profile

        except httpx.HTTPError as e:
            print(f"Error fetching GitHub profile: {e}")
            return self._get_cached_data(cache_key, allow_stale=True) or {'error': str(e)}

    async def get_repositories(
        self,
        username: str = "mangeshraut712",
        sort: str = "updated",
        max_repos: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Fetch user's public repositories

        Args:
            username: GitHub username
            sort: Sort by 'updated', 'created', 'pushed', or 'full_name'
            max_repos: Maximum number of repos to return
        """
        cache_key = f"repos:{username}:{sort}"

        if self._is_cached(cache_key):
            return self._get_cached_data(cache_key)[:max_repos]

        params = {
            'sort': sort,
            'direction': 'desc',
            'per_page': max_repos
        }

        try:
            repos_data = await self._fetch_json(f"/users/{username}/repos", params=params)

            repos = []
            for repo in repos_data:
                repos.append({
                    'name': repo.get('name'),
                    'full_name': repo.get('full_name'),
                    'description': repo.get('description'),
                    'html_url': repo.get('html_url'),
                    'homepage': repo.get('homepage'),
                    'language': repo.get('language'),
                    'languages_url': repo.get('languages_url'),
                    'stars': repo.get('stargazers_count'),
                    'forks': repo.get('forks_count'),
                    'watchers': repo.get('watchers_count'),
                    'open_issues': repo.get('open_issues_count'),
                    'created_at': repo.get('created_at'),
                    'updated_at': repo.get('updated_at'),
                    'pushed_at': repo.get('pushed_at'),
                    'size': repo.get('size'),
                    'topics': repo.get('topics', []),
                    'visibility': repo.get('visibility'),
                    'default_branch': repo.get('default_branch')
                })

            self._cache_data(cache_key, repos)
            return repos

        except httpx.HTTPError as e:
            print(f"Error fetching GitHub repos: {e}")
            return (self._get_cached_data(cache_key, allow_stale=True) or [])[:max_repos]

    async def get_repository_languages(self, owner: str, repo: str) -> Dict[str, int]:
        """Get programming languages used in a repository"""
        cache_key = f"languages:{owner}:{repo}"

        if self._is_cached(cache_key):
            return self._get_cached_data(cache_key)

        try:
            languages = await self._fetch_json(f"/repos/{owner}/{repo}/languages")

            self._cache_data(cache_key, languages)
            return languages

        except httpx.HTTPError as e:
            print(f"Error fetching repo languages: {e}")
            return self._get_cached_data(cache_key, allow_stale=True) or {}

    async def get_user_activity_summary(self, username: str = "mangeshraut712") -> Dict[str, Any]:
        """
        Get a comprehensive summary of user's GitHub activity

        Returns:
            - Total repos
            - Primary languages
            - Most starred projects
            - Recent activity
        """
        cache_key = f"summary:{username}"
        if self._is_cached(cache_key):
            return self._get_cached_data(cache_key)

        # Fetch profile and repos concurrently
        profile_task = self.get_user_profile(username)
        repos_task = self.get_repositories(username, sort='updated', max_repos=100)
        recent_events_task = self.get_recent_public_events(username, max_events=8)

        profile, repos, recent_events = await asyncio.gather(profile_task, repos_task, recent_events_task)

        if not repos and not recent_events:
            return self._get_cached_data(cache_key, allow_stale=True) or self._build_empty_summary(username)

        # Analyze languages across all repos
        language_stats = {}
        for repo in repos:
            lang = repo.get('language')
            if lang:
                language_stats[lang] = language_stats.get(lang, 0) + 1

        # Sort by usage
        top_languages = sorted(language_stats.items(), key=lambda x: x[1], reverse=True)[:5]

        # Find most popular projects
        popular_projects = sorted(repos, key=lambda r: r.get('stars', 0), reverse=True)[:5]

        # Recent projects
        recent_projects = sorted(repos, key=lambda r: r.get('updated_at', ''), reverse=True)[:5]

        # Aggregate project topics to show what the codebase is about right now.
        topic_counts: Dict[str, int] = {}
        for repo in repos:
            for topic in repo.get('topics', []) or []:
                normalized_topic = str(topic).strip().lower()
                if normalized_topic:
                    topic_counts[normalized_topic] = topic_counts.get(normalized_topic, 0) + 1

        top_topics = sorted(topic_counts.items(), key=lambda item: item[1], reverse=True)[:6]

        recent_event_counts = Counter(event.get('type') for event in recent_events)
        recent_repos_touched = sorted(
            {event.get('repo') for event in recent_events if event.get('repo')}
        )
        focus_repo = self._get_focus_repo(recent_events, recent_projects)
        latest_push_event = next((event for event in recent_events if event.get('type') == 'PushEvent'), None)

        # Calculate activity metrics
        total_stars = sum(r.get('stars', 0) for r in repos)
        total_forks = sum(r.get('forks', 0) for r in repos)
        active_repo_count = sum(1 for r in repos if self._is_recently_updated(r.get('updated_at')))

        summary = {
            'username': username,
            'profile_url': f"https://github.com/{username}",
            'total_public_repos': profile.get('public_repos') or len(repos),
            'total_stars': total_stars,
            'total_forks': total_forks,
            'followers': profile.get('followers', 0),
            'following': profile.get('following', 0),
            'language_count': len(language_stats),
            'active_repos_last_month': active_repo_count,
            'latest_profile_update': profile.get('updated_at'),
            'latest_activity_at': recent_events[0]['created_at'] if recent_events else None,
            'current_focus_repo': focus_repo,
            'latest_push_branch': latest_push_event.get('branch') if latest_push_event else None,
            'recent_activity_stats': {
                'public_events_fetched': len(recent_events),
                'pushes': recent_event_counts.get('PushEvent', 0),
                'pull_requests': recent_event_counts.get('PullRequestEvent', 0),
                'issues': recent_event_counts.get('IssuesEvent', 0),
                'repos_touched': len(recent_repos_touched),
            },
            'top_languages': [{'language': lang, 'repo_count': count} for lang, count in top_languages],
            'top_topics': [{'topic': topic, 'repo_count': count} for topic, count in top_topics],
            'most_popular_projects': [
                {
                    'name': p['name'],
                    'stars': p['stars'],
                    'description': p['description'],
                    'url': p['html_url'],
                    'language': p['language']
                }
                for p in popular_projects
            ],
            'recent_projects': [
                {
                    'name': p['name'],
                    'last_updated': p['updated_at'],
                    'description': p['description'],
                    'url': p['html_url']
                }
                for p in recent_projects
            ],
            'recent_events': recent_events,
        }

        self._cache_data(cache_key, summary)
        return summary

    async def get_recent_public_events(
        self,
        username: str = "mangeshraut712",
        max_events: int = 6,
    ) -> List[Dict[str, Any]]:
        cache_key = f"events:{username}"

        if self._is_cached(cache_key):
            return self._get_cached_data(cache_key)[:max_events]

        try:
            events_data = await self._fetch_json(
                f"/users/{username}/events/public",
                params={'per_page': max_events},
            )

            events = []
            for event in events_data:
                repo_name = (event.get('repo') or {}).get('name', '')
                repo_short_name = repo_name.split('/', 1)[-1] if repo_name else 'repository'
                event_type = event.get('type', 'Event')
                payload = event.get('payload') or {}
                branch_name = self._extract_branch_name(payload.get('ref'))

                action = self._describe_event_action(event_type, payload)
                url_suffix = ''
                if payload.get('pull_request', {}).get('html_url'):
                    url_suffix = payload['pull_request']['html_url']
                elif payload.get('issue', {}).get('html_url'):
                    url_suffix = payload['issue']['html_url']
                elif repo_name:
                    url_suffix = f"https://github.com/{repo_name}"

                events.append({
                    'type': event_type,
                    'action': action,
                    'repo': repo_short_name,
                    'repo_full_name': repo_name,
                    'branch': branch_name,
                    'icon': self._get_event_icon(event_type),
                    'created_at': event.get('created_at'),
                    'url': url_suffix,
                })

            self._cache_data(cache_key, events)
            return events[:max_events]

        except httpx.HTTPError as e:
            print(f"Error fetching GitHub events: {e}")
            return (self._get_cached_data(cache_key, allow_stale=True) or [])[:max_events]

    def _describe_event_action(self, event_type: str, payload: Dict[str, Any]) -> str:
        if event_type == 'PushEvent':
            branch_name = self._extract_branch_name(payload.get('ref'))
            if branch_name:
                return f"Updated {branch_name}"
            return "Pushed new changes"
        if event_type == 'PullRequestEvent':
            pr_action = payload.get('action', 'updated').replace('_', ' ')
            return f"{pr_action.title()} a pull request"
        if event_type == 'IssuesEvent':
            issue_action = payload.get('action', 'updated').replace('_', ' ')
            return f"{issue_action.title()} an issue"
        if event_type == 'CreateEvent':
            ref_type = payload.get('ref_type', 'branch')
            return f"Created a {ref_type}"
        if event_type == 'ReleaseEvent':
            return "Published a release"
        if event_type == 'WatchEvent':
            return "Received a star"
        return event_type.replace('Event', '')

    def _extract_branch_name(self, ref: Optional[str]) -> Optional[str]:
        if not ref:
            return None
        return str(ref).split('/')[-1] or None

    def _get_event_icon(self, event_type: str) -> str:
        icon_map = {
            'PushEvent': 'code-commit',
            'PullRequestEvent': 'code-pull-request',
            'IssuesEvent': 'circle-dot',
            'CreateEvent': 'sparkles',
            'ReleaseEvent': 'rocket-launch',
            'WatchEvent': 'star',
        }
        return icon_map.get(event_type, 'activity')

    def _get_focus_repo(
        self,
        recent_events: List[Dict[str, Any]],
        recent_projects: List[Dict[str, Any]],
    ) -> str:
        event_repos = [event.get('repo') for event in recent_events if event.get('repo')]
        if event_repos:
            return Counter(event_repos).most_common(1)[0][0]

        if recent_projects:
            return recent_projects[0].get('name') or 'Portfolio'

        return 'Portfolio'

    def _build_empty_summary(self, username: str) -> Dict[str, Any]:
        return {
            'username': username,
            'profile_url': f"https://github.com/{username}",
            'total_public_repos': 0,
            'total_stars': 0,
            'total_forks': 0,
            'followers': 0,
            'following': 0,
            'language_count': 0,
            'active_repos_last_month': 0,
            'latest_profile_update': None,
            'latest_activity_at': None,
            'current_focus_repo': 'Portfolio',
            'latest_push_branch': None,
            'recent_activity_stats': {
                'public_events_fetched': 0,
                'pushes': 0,
                'pull_requests': 0,
                'issues': 0,
                'repos_touched': 0,
            },
            'top_languages': [],
            'top_topics': [],
            'most_popular_projects': [],
            'recent_projects': [],
            'recent_events': [],
        }

    async def search_user_repos(self, username: str, query: str) -> List[Dict]:
        """Search user's repos by keyword"""
        repos = await self.get_repositories(username)

        query_lower = query.lower()
        matching_repos = []

        for repo in repos:
            # Search in name, description, and topics
            if (
                query_lower in str(repo.get('name', '')).lower()
                or query_lower in str(repo.get('description', '')).lower()
                or any(query_lower in topic.lower() for topic in repo.get('topics', []))
            ):
                matching_repos.append(repo)

        return matching_repos

    def generate_github_summary_for_ai(self, activity_summary: Dict) -> str:
        """
        Generate a natural language summary for AI context

        This provides enriched context for the AI to better represent the user
        """
        if 'error' in activity_summary:
            return ''

        username = activity_summary.get('username', '')
        total_repos = activity_summary.get('total_public_repos', 0)
        total_stars = activity_summary.get('total_stars', 0)
        top_langs = activity_summary.get('top_languages', [])
        popular_projects = activity_summary.get('most_popular_projects', [])

        summary_lines = [
            f"GitHub Profile: {username}",
            f"Public Repositories: {total_repos}",
            f"Total Stars Received: {total_stars}",
        ]

        if top_langs:
            lang_str = ', '.join(
                [f"{language_stat['language']} ({language_stat['repo_count']} repos)" for language_stat in top_langs[:3]]
            )
            summary_lines.append(f"Primary Languages: {lang_str}")

        if popular_projects:
            summary_lines.append("\\nMost Popular Projects:")
            for proj in popular_projects[:3]:
                summary_lines.append(
                    f"  • {proj['name']} - {proj['stars']} ⭐ ({proj['language']}) - {proj['description'] or 'No description'}"
                )

        return '\\n'.join(summary_lines)

    def _is_cached(self, key: str) -> bool:
        """Check if data is in cache and not expired"""
        if key not in self.cache:
            return False

        cached_at = self.cache[key]['timestamp']
        return (datetime.now().timestamp() - cached_at) < self.cache_ttl

    def _get_cached_data(self, key: str, allow_stale: bool = False):
        if key not in self.cache:
            return None
        if allow_stale or self._is_cached(key):
            return self.cache[key]['data']
        return None

    def _cache_data(self, key: str, data: Any):
        """Store data in cache with timestamp"""
        self.cache[key] = {
            'data': data,
            'timestamp': datetime.now().timestamp()
        }

    def _is_recently_updated(self, updated_at: Optional[str]) -> bool:
        """Check if repo was updated in last 30 days"""
        if not updated_at:
            return False

        try:
            update_time = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
            threshold = datetime.now().astimezone() - timedelta(days=30)
            return update_time > threshold
        except BaseException:
            return False

    def clear_cache(self):
        """Clear all cached data"""
        self.cache = {}


# Singleton instance
github_connector = GitHubConnector(
    access_token=os.getenv('GITHUB_PAT') or os.getenv('GITHUB_TOKEN') or os.getenv('GITHUB_ACCESS_TOKEN')
)
