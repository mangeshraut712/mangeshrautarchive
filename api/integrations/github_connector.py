"""
Personal Intelligence: GitHub Integration
Connects to GitHub API to provide real-time repository data and code analysis

Features:
- Fetch live repository statistics
- Analyze code contributions
- Extract project insights
- Privacy-preserving (public repos only by default)
"""

import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import asyncio


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
        
    async def get_user_profile(self, username: str = "mangeshraut712") -> Dict[str, Any]:
        """Fetch user profile information"""
        cache_key = f"profile:{username}"
        
        # Check cache
        if self._is_cached(cache_key):
            return self.cache[cache_key]['data']
            
        url = f"{self.base_url}/users/{username}"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=self.headers, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
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
            return {'error': str(e)}
    
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
            return self.cache[cache_key]['data'][:max_repos]
            
        url = f"{self.base_url}/users/{username}/repos"
        params = {
            'sort': sort,
            'direction': 'desc',
            'per_page': max_repos
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=self.headers, params=params, timeout=10.0)
                response.raise_for_status()
                repos_data = response.json()
                
                # Extract key info
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
            return []
    
    async def get_repository_languages(self, owner: str, repo: str) -> Dict[str, int]:
        """Get programming languages used in a repository"""
        cache_key = f"languages:{owner}:{repo}"
        
        if self._is_cached(cache_key):
            return self.cache[cache_key]['data']
            
        url = f"{self.base_url}/repos/{owner}/{repo}/languages"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=self.headers, timeout=10.0)
                response.raise_for_status()
                languages = response.json()
                
                self._cache_data(cache_key, languages)
                return languages
                
        except httpx.HTTPError as e:
            print(f"Error fetching repo languages: {e}")
            return {}
    
    async def get_user_activity_summary(self, username: str = "mangeshraut712") -> Dict[str, Any]:
        """
        Get a comprehensive summary of user's GitHub activity
        
        Returns:
            - Total repos
            - Primary languages
            - Most starred projects
            - Recent activity
        """
        # Fetch profile and repos concurrently
        profile_task = self.get_user_profile(username)
        repos_task = self.get_repositories(username, sort='updated', max_repos=20)
        
        profile, repos = await asyncio.gather(profile_task, repos_task)
        
        if not repos:
            return {'error': 'No repositories found'}
            
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
        
        # Calculate activity metrics
        total_stars = sum(r.get('stars', 0) for r in repos)
        total_forks = sum(r.get('forks', 0) for r in repos)
        active_repo_count = sum(1 for r in repos if self._is_recently_updated(r.get('updated_at')))
        
        return {
            'username': username,
            'profile_url': f"https://github.com/{username}",
            'total_public_repos': len(repos),
            'total_stars': total_stars,
            'total_forks': total_forks,
            'active_repos_last_month': active_repo_count,
            'top_languages': [{'language': lang, 'repo_count': count} for lang, count in top_languages],
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
            ]
        }
    
    async def search_user_repos(self, username: str, query: str) -> List[Dict]:
        """Search user's repos by keyword"""
        repos = await self.get_repositories(username)
        
        query_lower = query.lower()
        matching_repos = []
        
        for repo in repos:
            # Search in name, description, and topics
            if (query_lower in str(repo.get('name', '')).lower() or
                query_lower in str(repo.get('description', '')).lower() or
                any(query_lower in topic.lower() for topic in repo.get('topics', []))):
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
            lang_str = ', '.join([f"{l['language']} ({l['repo_count']} repos)" for l in top_langs[:3]])
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
        except:
            return False
    
    def clear_cache(self):
        """Clear all cached data"""
        self.cache = {}


# Singleton instance
github_connector = GitHubConnector()
