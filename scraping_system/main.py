#!/usr/bin/env python3
"""
CoTenWrocław Content Scraping System
Main orchestrator for the scraping system
"""

import asyncio
import logging
import os
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Any
import argparse

from config.settings import Settings
from database.supabase_client import SupabaseClient
from scrapers.scraper_factory import ScraperFactory
from processors.content_processor import ContentProcessor
from utils.logger import setup_logger
from utils.scheduler import ScrapingScheduler

class ScrapingOrchestrator:
    def __init__(self):
        self.settings = Settings()
        self.db_client = SupabaseClient()
        self.scraper_factory = ScraperFactory()
        self.content_processor = ContentProcessor()
        self.scheduler = ScrapingScheduler()
        self.logger = setup_logger(__name__)

    async def initialize(self):
        """Initialize the scraping system"""
        try:
            await self.db_client.initialize()
            self.logger.info("Scraping system initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize scraping system: {e}")
            raise

    async def run_single_scrape(self, source_id: str = None, source_type: str = None):
        """Run a single scraping operation"""
        try:
            sources = await self.get_sources_to_scrape(source_id, source_type)
            
            if not sources:
                self.logger.info("No sources to scrape")
                return

            tasks = []
            for source in sources:
                task = self.scrape_source(source)
                tasks.append(task)

            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            successful = sum(1 for r in results if not isinstance(r, Exception))
            failed = len(results) - successful
            
            self.logger.info(f"Scraping completed: {successful} successful, {failed} failed")

        except Exception as e:
            self.logger.error(f"Error during scraping operation: {e}")
            raise

    async def run_continuous(self):
        """Run continuous scraping based on schedules"""
        self.logger.info("Starting continuous scraping mode")
        
        while True:
            try:
                # Get sources that need scraping
                sources = await self.get_sources_due_for_scraping()
                
                if sources:
                    self.logger.info(f"Found {len(sources)} sources due for scraping")
                    
                    # Process sources in batches to avoid overwhelming the system
                    batch_size = self.settings.MAX_CONCURRENT_SCRAPERS
                    for i in range(0, len(sources), batch_size):
                        batch = sources[i:i + batch_size]
                        tasks = [self.scrape_source(source) for source in batch]
                        await asyncio.gather(*tasks, return_exceptions=True)
                
                # Wait before next check
                await asyncio.sleep(self.settings.SCHEDULER_CHECK_INTERVAL)
                
            except KeyboardInterrupt:
                self.logger.info("Received shutdown signal")
                break
            except Exception as e:
                self.logger.error(f"Error in continuous scraping: {e}")
                await asyncio.sleep(60)  # Wait before retrying

    async def get_sources_to_scrape(self, source_id: str = None, source_type: str = None) -> List[Dict]:
        """Get sources that should be scraped"""
        try:
            query = self.db_client.supabase.table('sources').select('*').eq('is_active', True)
            
            if source_id:
                query = query.eq('id', source_id)
            elif source_type:
                query = query.eq('source_type', source_type)
            
            response = query.execute()
            return response.data if response.data else []
            
        except Exception as e:
            self.logger.error(f"Error fetching sources: {e}")
            return []

    async def get_sources_due_for_scraping(self) -> List[Dict]:
        """Get sources that are due for scraping based on their frequency"""
        try:
            current_time = datetime.utcnow()
            
            response = self.db_client.supabase.table('sources').select('*').eq('is_active', True).execute()
            
            if not response.data:
                return []

            due_sources = []
            for source in response.data:
                frequency_minutes = source.get('scraping_frequency_minutes', 60)
                last_scraped = source.get('last_scraped_at')
                
                if not last_scraped:
                    # Never scraped before, add to queue
                    due_sources.append(source)
                else:
                    last_scraped_time = datetime.fromisoformat(last_scraped.replace('Z', '+00:00'))
                    next_scrape_time = last_scraped_time + timedelta(minutes=frequency_minutes)
                    
                    if current_time >= next_scrape_time:
                        due_sources.append(source)
            
            return due_sources
            
        except Exception as e:
            self.logger.error(f"Error checking sources due for scraping: {e}")
            return []

    async def scrape_source(self, source: Dict) -> Dict:
        """Scrape a single source"""
        source_id = source['id']
        source_name = source['source_name']
        source_type = source['source_type']
        
        # Create scraping log entry
        log_entry = await self.create_scraping_log(source_id)
        log_id = log_entry['id']
        
        try:
            self.logger.info(f"Starting scraping for {source_name} ({source_type})")
            
            # Get appropriate scraper
            scraper = self.scraper_factory.get_scraper(source_type)
            if not scraper:
                raise ValueError(f"No scraper available for source type: {source_type}")
            
            # Perform scraping
            start_time = datetime.utcnow()
            scraped_items = await scraper.scrape(source)
            
            # Process content
            processed_items = []
            new_items = 0
            updated_items = 0
            
            for item in scraped_items:
                try:
                    processed_item = await self.content_processor.process_item(item, source)
                    if processed_item:
                        processed_items.append(processed_item)
                        
                        # Save to database
                        saved_item = await self.save_content_item(processed_item)
                        if saved_item.get('is_new'):
                            new_items += 1
                        else:
                            updated_items += 1
                            
                except Exception as e:
                    self.logger.error(f"Error processing item: {e}")
                    continue
            
            # Update source last_scraped_at
            await self.update_source_last_scraped(source_id)
            
            # Update scraping log
            execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            await self.update_scraping_log(log_id, {
                'status': 'completed',
                'completed_at': datetime.utcnow().isoformat(),
                'items_found': len(scraped_items),
                'items_processed': len(processed_items),
                'items_new': new_items,
                'items_updated': updated_items,
                'execution_time_ms': execution_time
            })
            
            # Update source success count
            await self.increment_source_success_count(source_id)
            
            self.logger.info(f"Completed scraping for {source_name}: {new_items} new, {updated_items} updated")
            
            return {
                'source_id': source_id,
                'source_name': source_name,
                'status': 'success',
                'items_found': len(scraped_items),
                'items_new': new_items,
                'items_updated': updated_items
            }
            
        except Exception as e:
            self.logger.error(f"Error scraping {source_name}: {e}")
            
            # Update scraping log with error
            await self.update_scraping_log(log_id, {
                'status': 'failed',
                'completed_at': datetime.utcnow().isoformat(),
                'error_message': str(e)
            })
            
            # Update source error count
            await self.increment_source_error_count(source_id)
            
            return {
                'source_id': source_id,
                'source_name': source_name,
                'status': 'error',
                'error': str(e)
            }

    async def create_scraping_log(self, source_id: str) -> Dict:
        """Create a new scraping log entry"""
        log_data = {
            'source_id': source_id,
            'status': 'running',
            'started_at': datetime.utcnow().isoformat()
        }
        
        response = self.db_client.supabase.table('scraping_logs').insert(log_data).execute()
        return response.data[0]

    async def update_scraping_log(self, log_id: str, updates: Dict):
        """Update a scraping log entry"""
        self.db_client.supabase.table('scraping_logs').update(updates).eq('id', log_id).execute()

    async def update_source_last_scraped(self, source_id: str):
        """Update the last_scraped_at timestamp for a source"""
        self.db_client.supabase.table('sources').update({
            'last_scraped_at': datetime.utcnow().isoformat()
        }).eq('id', source_id).execute()

    async def increment_source_success_count(self, source_id: str):
        """Increment the success count for a source"""
        # Get current count
        response = self.db_client.supabase.table('sources').select('success_count').eq('id', source_id).execute()
        current_count = response.data[0]['success_count'] if response.data else 0
        
        # Update with incremented count
        self.db_client.supabase.table('sources').update({
            'success_count': current_count + 1
        }).eq('id', source_id).execute()

    async def increment_source_error_count(self, source_id: str):
        """Increment the error count for a source"""
        # Get current count
        response = self.db_client.supabase.table('sources').select('error_count').eq('id', source_id).execute()
        current_count = response.data[0]['error_count'] if response.data else 0
        
        # Update with incremented count
        self.db_client.supabase.table('sources').update({
            'error_count': current_count + 1
        }).eq('id', source_id).execute()

    async def save_content_item(self, item: Dict) -> Dict:
        """Save a content item to the database"""
        try:
            # Check if content already exists (duplicate detection)
            content_hash = item.get('content_hash')
            if content_hash:
                existing = self.db_client.supabase.table('content').select('id').eq('content_hash', content_hash).execute()
                if existing.data:
                    # Update existing content
                    response = self.db_client.supabase.table('content').update(item).eq('content_hash', content_hash).execute()
                    return {'id': existing.data[0]['id'], 'is_new': False}
            
            # Insert new content
            response = self.db_client.supabase.table('content').insert(item).execute()
            return {'id': response.data[0]['id'], 'is_new': True}
            
        except Exception as e:
            self.logger.error(f"Error saving content item: {e}")
            raise

async def main():
    parser = argparse.ArgumentParser(description='CoTenWrocław Content Scraping System')
    parser.add_argument('--mode', choices=['single', 'continuous'], default='single', 
                       help='Scraping mode: single run or continuous')
    parser.add_argument('--source-id', help='Specific source ID to scrape')
    parser.add_argument('--source-type', help='Specific source type to scrape')
    parser.add_argument('--log-level', default='INFO', help='Logging level')
    
    args = parser.parse_args()
    
    # Set up logging
    logging.basicConfig(
        level=getattr(logging, args.log_level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    orchestrator = ScrapingOrchestrator()
    
    try:
        await orchestrator.initialize()
        
        if args.mode == 'continuous':
            await orchestrator.run_continuous()
        else:
            await orchestrator.run_single_scrape(args.source_id, args.source_type)
            
    except KeyboardInterrupt:
        logging.info("Shutting down...")
    except Exception as e:
        logging.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    asyncio.run(main())