"""
Personal Intelligence: Memory Manager
Implements long-term memory, contextual understanding, and personalization

Features:
- Persistent conversation history (cross-session)
- User preference learning
- Semantic context retrieval
- Privacy-preserving storage
"""

import json
import time
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import hashlib


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
        self.long_term_profiles = {}  # user_id -> UserProfile
        
        # Configuration
        self.short_term_ttl = 3600  # 1 hour
        self.medium_term_ttl = 604800  # 7 days
        self.max_messages_per_session = 50
        self.max_sessions_per_user = 10
        
        # Analytics
        self.memory_hits = 0
        self.memory_misses = 0
        
    def create_session(self, user_id: Optional[str] = None, session_id: Optional[str] = None) ->str:
        """Create a new conversation session"""
        if not session_id:
            session_id = self._generate_session_id(user_id)
            
        if not user_id:
            user_id = 'anonymous'
            
        # Initialize session
        self.short_term[session_id] = {
            'user_id': user_id,
            'messages': [],
            'created_at': time.time(),
            'last_access': time.time(),
            'context': {},
            'metadata': {}
        }
        
        # Link to user's medium-term memory
        if user_id not in self.medium_term:
            self.medium_term[user_id] = {
                'sessions': [],
                'preferences': {},
                'interaction_count': 0,
                'first_seen': time.time()
            }
            
        self.medium_term[user_id]['sessions'].append(session_id)
        
        # Keep only recent sessions
        if len(self.medium_term[user_id]['sessions']) > self.max_sessions_per_user:
            old_session = self.medium_term[user_id]['sessions'].pop(0)
            if old_session in self.short_term:
                del self.short_term[old_session]
        
        return session_id
    
    def add_message(self, session_id: str, role: str, content: str, metadata: Optional[Dict] = None):
        """Add a message to conversation history"""
        if session_id not in self.short_term:
            raise ValueError(f"Session {session_id} not found")
            
        message = {
            'role': role,
            'content': content,
            'timestamp': time.time(),
            'metadata': metadata or {}
        }
        
        session = self.short_term[session_id]
        session['messages'].append(message)
        session['last_access'] = time.time()
        
        # Trim if too long
        if len(session['messages']) > self.max_messages_per_session:
            session['messages'] = session['messages'][-self.max_messages_per_session:]
            
        # Update user statistics
        user_id = session.get('user_id', 'anonymous')
        if user_id in self.medium_term:
            self.medium_term[user_id]['interaction_count'] += 1
            
    def get_conversation_history(self, session_id: str, max_messages: int = 10) -> List[Dict]:
        """Retrieve recent conversation history"""
        if session_id not in self.short_term:
            self.memory_misses += 1
            return []
            
        self.memory_hits += 1
        session = self.short_term[session_id]
        session['last_access'] = time.time()
        
        messages = session['messages'][-max_messages:]
        return messages
    
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
        
    def detect_preferences_from_conversation(self, session_id: str) -> Dict[str, Any]:
        """
        Automatically detect user preferences from conversation patterns
        
        Detects:
        - Preferred response length (short vs detailed)
        - Technical level (beginner, intermediate, expert)
        - Interests (web dev, ML, cloud, etc.)
        - Communication style (formal vs casual)
        """
        if session_id not in self.short_term:
            return {}
            
        messages = self.short_term[session_id]['messages']
        user_messages = [m for m in messages if m['role'] == 'user']
        
        if not user_messages:
            return {}
            
        preferences = {}
        
        # Detect technical level
        technical_terms = [
            'api', 'microservices', 'kubernetes', 'docker', 'aws', 'ml',
            'algorithm', 'architecture', 'optimization', 'scalability'
        ]
        technical_count = sum(
            1 for msg in user_messages 
            for term in technical_terms 
            if term in msg['content'].lower()
        )
        
        if technical_count >= 3:
            preferences['technical_level'] = 'expert'
        elif technical_count >= 1:
            preferences['technical_level'] = 'intermediate'
        else:
            preferences['technical_level'] = 'beginner'
            
        # Detect interests
        interests = []
        interest_keywords = {
            'web_development': ['react', 'angular', 'frontend', 'ui', 'web'],
            'backend': ['api', 'spring boot', 'microservices', 'backend'],
            'machine_learning': ['ml', 'ai', 'tensorflow', 'model', 'neural'],
            'cloud': ['aws', 'cloud', 'docker', 'kubernetes', 'devops'],
            'career': ['job', 'resume', 'interview', 'hiring', 'career']
        }
        
        for interest, keywords in interest_keywords.items():
            if any(kw in ' '.join([m['content'].lower() for m in user_messages]) for kw in keywords):
                interests.append(interest)
                
        preferences['interests'] = interests
        
        # Detect communication style
        casual_markers = ['hey', 'cool', 'awesome', 'thanks', 'pls']
        formal_markers = ['please', 'thank you', 'kindly', 'could you']
        
        all_user_text = ' '.join([m['content'].lower() for m in user_messages])
        casual_score = sum(1 for marker in casual_markers if marker in all_user_text)
        formal_score = sum(1 for marker in formal_markers if marker in all_user_text)
        
        if formal_score > casual_score:
            preferences['communication_style'] = 'formal'
        elif casual_score > formal_score:
            preferences['communication_style'] = 'casual'
        else:
            preferences['communication_style'] = 'balanced'
            
        return preferences
    
    def cleanup_expired_sessions(self):
        """Remove expired sessions to save memory"""
        now = time.time()
        expired_sessions = []
        
        for session_id, session in self.short_term.items():
            if now - session['last_access'] > self.short_term_ttl:
                expired_sessions.append(session_id)
                
        for session_id in expired_sessions:
            del self.short_term[session_id]
            
        return len(expired_sessions)
    
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
    
    def export_user_data(self, user_id: str) -> Dict:
        """Export all data for a user (GDPR compliance)"""
        data = {
            'user_id': user_id,
            'exported_at': datetime.now().isoformat(),
            'sessions': [],
            'preferences': {},
            'statistics': {}
        }
        
        if user_id in self.medium_term:
            user_data = self.medium_term[user_id]
            data['preferences'] = user_data.get('preferences', {})
            data['statistics'] = {
                'total_interactions': user_data.get('interaction_count', 0),
                'first_seen': datetime.fromtimestamp(user_data.get('first_seen', 0)).isoformat(),
                'total_sessions': len(user_data.get('sessions', []))
            }
            
            # Include recent sessions
            for session_id in user_data['sessions'][-5:]:
                if session_id in self.short_term:
                    session = self.short_term[session_id]
                    data['sessions'].append({
                        'session_id': session_id,
                        'created_at': datetime.fromtimestamp(session['created_at']).isoformat(),
                        'message_count': len(session['messages'])
                    })
                    
        return data
    
    def delete_user_data(self, user_id: str) -> bool:
        """Delete all data for a user (GDPR right to be forgotten)"""
        deleted = False
        
        # Delete from medium-term memory
        if user_id in self.medium_term:
            # Find and delete all sessions
            for session_id in self.medium_term[user_id].get('sessions', []):
                if session_id in self.short_term:
                    del self.short_term[session_id]
                    
            del self.medium_term[user_id]
            deleted = True
            
        return deleted
    
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
    
    def _generate_session_id(self, user_id: Optional[str] = None) -> str:
        """Generate unique session ID"""
        data = f"{user_id or 'anon'}{time.time()}{id(self)}"
        return hashlib.md5(data.encode()).hexdigest()[:16]


# Singleton instance
memory_manager = MemoryManager()
