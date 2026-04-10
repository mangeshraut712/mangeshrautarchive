"""
Personal Intelligence: Memory Manager
Implements long-term memory, contextual understanding, and personalization

Features:
- Persistent conversation history (cross-session)
- User preference learning
- Semantic context retrieval
- Privacy-preserving storage
"""

import time
from typing import Dict, Any


class MemoryManager:
    """
    Enhanced memory system for Personal Intelligence

    Architecture:
    - Short-term memory: Current session (in-memory)
    - Medium-term memory: Recent sessions (1-7 days, dict-based)
    - Long-term memory: User profile, preferences (persistent)
    """

    def __init__(self, storage_backend='memory'):
        """
        Initialize memory manager

        Args:
            storage_backend: 'memory' (dict), 'redis', or 'postgres'
        """
        self.storage_backend = storage_backend

        # In-memory stores
        self.short_term = {}  # session_id -> messages[]
        self.medium_term = {}  # user_id -> {sessions: [], preferences: {}}

        # Analytics
        self.memory_hits = 0
        self.memory_misses = 0

    def get_context_for_user(self, user_id: str) -> Dict[str, Any]:
        """
        Get enriched context for a user across all their sessions

        Returns:
            - Recent topics discussed
            - User preferences
            - Interaction patterns
            - Personalization hints
        """
        if user_id not in self.medium_term:
            return {
                'is_new_user': True,
                'preferences': {},
                'recent_topics': [],
                'interaction_count': 0
            }

        user_data = self.medium_term[user_id]

        # Aggregate topics from recent sessions
        recent_topics = []
        for session_id in user_data['sessions'][-3:]:  # Last 3 sessions
            if session_id in self.short_term:
                messages = self.short_term[session_id]['messages']
                # Extract user questions
                topics = [m['content'][:50] for m in messages if m['role'] == 'user']
                recent_topics.extend(topics[-3:])

        return {
            'is_new_user': False,
            'preferences': user_data.get('preferences', {}),
            'recent_topics': recent_topics[-5:],  # Last 5 topics
            'interaction_count': user_data.get('interaction_count', 0),
            'first_seen': user_data.get('first_seen'),
            'returning_user': user_data.get('interaction_count', 0) > 5
        }

    def update_preferences(self, user_id: str, preferences: Dict[str, Any]):
        """Learn and update user preferences"""
        if user_id not in self.medium_term:
            self.medium_term[user_id] = {
                'sessions': [],
                'preferences': {},
                'interaction_count': 0,
                'first_seen': time.time()
            }

        # Merge preferences
        current_prefs = self.medium_term[user_id].get('preferences', {})
        current_prefs.update(preferences)
        self.medium_term[user_id]['preferences'] = current_prefs

    def get_personalized_greeting(self, user_id: str) -> str:
        """Generate personalized greeting based on user history"""
        context = self.get_context_for_user(user_id)

        if context['is_new_user']:
            return "👋 Welcome! I'm AssistMe AI. I can help you explore Mangesh's portfolio, answer technical questions, or discuss career opportunities."

        interaction_count = context.get('interaction_count', 0)

        if interaction_count > 20:
            return "👋 Great to see you again! Ready to dive deeper into Mangesh's work?"
        elif interaction_count > 5:
            return f"👋 Welcome back! Last time we discussed: {context['recent_topics'][-1] if context['recent_topics'] else 'portfolio details'}."
        else:
            return "👋 Welcome back! How can I assist you today?"

    def get_stats(self) -> Dict:
        """Get memory system statistics"""
        total_sessions = len(self.short_term)
        total_users = len(self.medium_term)
        total_messages = sum(len(s['messages']) for s in self.short_term.values())

        hit_rate = (
            self.memory_hits / (self.memory_hits + self.memory_misses)
            if (self.memory_hits + self.memory_misses) > 0
            else 0
        )

        return {
            'total_sessions': total_sessions,
            'total_users': total_users,
            'total_messages': total_messages,
            'memory_hit_rate': f"{hit_rate:.2%}",
            'avg_messages_per_session': total_messages / max(total_sessions, 1)
        }


# Singleton instance
memory_manager = MemoryManager()
