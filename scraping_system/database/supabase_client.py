"""
Supabase database client for CoTenWrocław scraping system
"""

import asyncio
from typing import Dict, List, Optional, Any
from supabase import create_client, Client
import logging

from config.settings import settings

class SupabaseClient:
    """Wrapper for Supabase client with CoTenWrocław-specific methods"""
    
    def __init__(self):
        self.supabase: Optional[Client] = None
        self.logger = logging.getLogger(__name__)
    
    async def initialize(self):
        """Initialize the Supabase client"""
        try:
            self.supabase = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
            )
            self.logger.info("Supabase client initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize Supabase client: {e}")
            raise
    
    async def get_active_sources(self) -> List[Dict]:
        """Get all active scraping sources"""
        try:
            response = self.supabase.table('sources').select('*').eq('is_active', True).execute()
            return response.data if response.data else []
        except Exception as e:
            self.logger.error(f"Error fetching active sources: {e}")
            return []
    
    async def get_source_by_id(self, source_id: str) -> Optional[Dict]:
        """Get a specific source by ID"""
        try:
            response = self.supabase.table('sources').select('*').eq('id', source_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            self.logger.error(f"Error fetching source {source_id}: {e}")
            return None
    
    async def save_content(self, content_data: Dict) -> Dict:
        """Save scraped content to database"""
        try:
            response = self.supabase.table('content').insert(content_data).execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            self.logger.error(f"Error saving content: {e}")
            raise
    
    async def update_content(self, content_id: str, updates: Dict) -> Dict:
        """Update existing content"""
        try:
            response = self.supabase.table('content').update(updates).eq('id', content_id).execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            self.logger.error(f"Error updating content {content_id}: {e}")
            raise
    
    async def find_duplicate_content(self, content_hash: str) -> Optional[Dict]:
        """Find existing content with the same hash"""
        try:
            response = self.supabase.table('content').select('*').eq('content_hash', content_hash).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            self.logger.error(f"Error checking for duplicate content: {e}")
            return None
    
    async def get_categories(self) -> List[Dict]:
        """Get all available categories"""
        try:
            response = self.supabase.table('categories').select('*').eq('is_active', True).execute()
            return response.data if response.data else []
        except Exception as e:
            self.logger.error(f"Error fetching categories: {e}")
            return []
    
    async def add_content_category(self, content_id: str, category_id: str, confidence: float = 1.0):
        """Associate content with a category"""
        try:
            data = {
                'content_id': content_id,
                'category_id': category_id,
                'confidence_score': confidence
            }
            response = self.supabase.table('content_categories').insert(data).execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            self.logger.error(f"Error adding content category: {e}")
            raise
    
    async def save_keywords(self, content_id: str, keywords: List[Dict]):
        """Save extracted keywords for content"""
        try:
            keyword_data = []
            for keyword_info in keywords:
                keyword_data.append({
                    'content_id': content_id,
                    'keyword': keyword_info['keyword'],
                    'frequency': keyword_info.get('frequency', 1),
                    'relevance_score': keyword_info.get('relevance_score', 0.5)
                })
            
            if keyword_data:
                response = self.supabase.table('keywords').insert(keyword_data).execute()
                return response.data if response.data else []
        except Exception as e:
            self.logger.error(f"Error saving keywords: {e}")
            raise
    
    async def log_scraping_activity(self, log_data: Dict) -> Dict:
        """Log scraping activity"""
        try:
            response = self.supabase.table('scraping_logs').insert(log_data).execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            self.logger.error(f"Error logging scraping activity: {e}")
            raise
    
    async def update_source_stats(self, source_id: str, success: bool = True):
        """Update source success/error statistics"""
        try:
            # Get current stats
            response = self.supabase.table('sources').select('success_count, error_count').eq('id', source_id).execute()
            
            if response.data:
                current_data = response.data[0]
                if success:
                    new_success_count = current_data.get('success_count', 0) + 1
                    self.supabase.table('sources').update({
                        'success_count': new_success_count
                    }).eq('id', source_id).execute()
                else:
                    new_error_count = current_data.get('error_count', 0) + 1
                    self.supabase.table('sources').update({
                        'error_count': new_error_count
                    }).eq('id', source_id).execute()
        except Exception as e:
            self.logger.error(f"Error updating source stats: {e}")
    
    async def get_content_stats(self) -> Dict:
        """Get content statistics for analytics"""
        try:
            # Total content count
            total_response = self.supabase.table('content').select('id', count='exact').execute()
            total_content = total_response.count
            
            # Content by type
            type_response = self.supabase.table('content').select('content_type', count='exact').execute()
            
            # Recent content (last 7 days)
            from datetime import datetime, timedelta
            week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
            recent_response = self.supabase.table('content').select('id', count='exact').gte('created_at', week_ago).execute()
            
            return {
                'total_content': total_content,
                'recent_content': recent_response.count,
                'content_by_type': type_response.data
            }
        except Exception as e:
            self.logger.error(f"Error fetching content stats: {e}")
            return {}
    
    async def cleanup_old_content(self, days_old: int = 90):
        """Remove content older than specified days"""
        try:
            from datetime import datetime, timedelta
            cutoff_date = (datetime.utcnow() - timedelta(days=days_old)).isoformat()
            
            response = self.supabase.table('content').delete().lt('created_at', cutoff_date).execute()
            deleted_count = len(response.data) if response.data else 0
            
            self.logger.info(f"Cleaned up {deleted_count} old content items")
            return deleted_count
        except Exception as e:
            self.logger.error(f"Error cleaning up old content: {e}")
            return 0