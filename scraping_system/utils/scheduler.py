"""
Scheduling utilities for CoTenWrocław scraping system
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, List
import logging

class ScrapingScheduler:
    """Scheduler for managing scraping tasks"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.running_tasks = {}
    
    def should_scrape_source(self, source: Dict) -> bool:
        """
        Check if a source should be scraped based on its schedule
        
        Args:
            source: Source configuration
            
        Returns:
            True if source should be scraped
        """
        if not source.get('is_active', True):
            return False
        
        frequency_minutes = source.get('scraping_frequency_minutes', 60)
        last_scraped = source.get('last_scraped_at')
        
        if not last_scraped:
            # Never scraped before
            return True
        
        try:
            last_scraped_time = datetime.fromisoformat(last_scraped.replace('Z', '+00:00'))
            next_scrape_time = last_scraped_time + timedelta(minutes=frequency_minutes)
            return datetime.utcnow() >= next_scrape_time.replace(tzinfo=None)
        except (ValueError, TypeError):
            # Invalid date format, scrape anyway
            return True
    
    def get_next_scrape_time(self, source: Dict) -> datetime:
        """
        Get the next scheduled scrape time for a source
        
        Args:
            source: Source configuration
            
        Returns:
            Next scrape time
        """
        frequency_minutes = source.get('scraping_frequency_minutes', 60)
        last_scraped = source.get('last_scraped_at')
        
        if not last_scraped:
            return datetime.utcnow()
        
        try:
            last_scraped_time = datetime.fromisoformat(last_scraped.replace('Z', '+00:00'))
            return last_scraped_time + timedelta(minutes=frequency_minutes)
        except (ValueError, TypeError):
            return datetime.utcnow()
    
    def calculate_priority(self, source: Dict) -> int:
        """
        Calculate priority for source scraping
        Higher priority = more urgent
        
        Args:
            source: Source configuration
            
        Returns:
            Priority score (higher = more urgent)
        """
        priority = 0
        
        # Base priority on frequency (more frequent = higher priority)
        frequency = source.get('scraping_frequency_minutes', 60)
        priority += max(0, 120 - frequency)  # Higher priority for more frequent scraping
        
        # Increase priority if overdue
        if self.should_scrape_source(source):
            next_scrape = self.get_next_scrape_time(source)
            overdue_minutes = (datetime.utcnow() - next_scrape).total_seconds() / 60
            if overdue_minutes > 0:
                priority += min(overdue_minutes, 100)  # Cap at 100
        
        # Decrease priority if source has many errors
        error_count = source.get('error_count', 0)
        if error_count > 5:
            priority -= error_count * 5
        
        return max(0, priority)
    
    def sort_sources_by_priority(self, sources: List[Dict]) -> List[Dict]:
        """
        Sort sources by scraping priority
        
        Args:
            sources: List of source configurations
            
        Returns:
            Sorted list of sources (highest priority first)
        """
        return sorted(sources, key=self.calculate_priority, reverse=True)