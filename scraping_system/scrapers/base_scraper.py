"""
Base scraper class for CoTenWrocław content scraping
"""

import asyncio
import aiohttp
import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from datetime import datetime
import hashlib
import re

from config.settings import settings

class BaseScraper(ABC):
    """Abstract base class for all content scrapers"""
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.session: Optional[aiohttp.ClientSession] = None
        self.rate_limit_delay = settings.DEFAULT_RATE_LIMIT_DELAY / 1000  # Convert to seconds
    
    async def __aenter__(self):
        """Async context manager entry"""
        await self.initialize_session()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.cleanup_session()
    
    async def initialize_session(self):
        """Initialize HTTP session with proper headers"""
        timeout = aiohttp.ClientTimeout(total=settings.DEFAULT_REQUEST_TIMEOUT)
        headers = {
            'User-Agent': settings.USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'pl,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
        
        self.session = aiohttp.ClientSession(
            timeout=timeout,
            headers=headers
        )
    
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    @abstractmethod
    async def scrape(self, source: Dict) -> List[Dict]:
        """
        Scrape content from the given source
        
        Args:
            source: Source configuration dictionary
            
        Returns:
            List of scraped content items
        """
        pass
    
    async def fetch_url(self, url: str, retries: int = None) -> Optional[str]:
        """
        Fetch content from URL with retry logic
        
        Args:
            url: URL to fetch
            retries: Number of retry attempts
            
        Returns:
            HTML content or None if failed
        """
        if retries is None:
            retries = settings.DEFAULT_RETRY_ATTEMPTS
        
        for attempt in range(retries + 1):
            try:
                await asyncio.sleep(self.rate_limit_delay)  # Rate limiting
                
                async with self.session.get(url) as response:
                    if response.status == 200:
                        content = await response.text()
                        self.logger.debug(f"Successfully fetched {url}")
                        return content
                    elif response.status == 429:  # Rate limited
                        wait_time = min(2 ** attempt, 60)  # Exponential backoff, max 60s
                        self.logger.warning(f"Rate limited on {url}, waiting {wait_time}s")
                        await asyncio.sleep(wait_time)
                    else:
                        self.logger.warning(f"HTTP {response.status} for {url}")
                        
            except asyncio.TimeoutError:
                self.logger.warning(f"Timeout fetching {url} (attempt {attempt + 1})")
            except Exception as e:
                self.logger.error(f"Error fetching {url}: {e} (attempt {attempt + 1})")
            
            if attempt < retries:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
        
        self.logger.error(f"Failed to fetch {url} after {retries + 1} attempts")
        return None
    
    def generate_content_hash(self, title: str, description: str, url: str = None) -> str:
        """
        Generate a unique hash for content to detect duplicates
        
        Args:
            title: Content title
            description: Content description
            url: Optional URL
            
        Returns:
            SHA-256 hash string
        """
        content = f"{title.strip().lower()}{description.strip().lower()}"
        if url:
            content += url.strip().lower()
        
        return hashlib.sha256(content.encode('utf-8')).hexdigest()
    
    def extract_location_from_text(self, text: str) -> Optional[str]:
        """
        Extract Wrocław location information from text
        
        Args:
            text: Text to analyze
            
        Returns:
            Extracted location or None
        """
        text_lower = text.lower()
        
        # Look for Wrocław-specific locations
        wroclaw_locations = [
            'rynek', 'stare miasto', 'ostrów tumski', 'nadodrze',
            'krzyki', 'fabryczna', 'psie pole', 'śródmieście',
            'karłowice', 'gaj', 'wojszyce', 'biskupin', 'żerniki'
        ]
        
        for location in wroclaw_locations:
            if location in text_lower:
                # Try to extract more context around the location
                pattern = rf'.{{0,20}}{re.escape(location)}.{{0,20}}'
                match = re.search(pattern, text_lower)
                if match:
                    return match.group().strip()
        
        # Look for street addresses
        street_pattern = r'ul\.\s*[\w\s]+\s*\d*'
        street_match = re.search(street_pattern, text_lower)
        if street_match:
            return street_match.group().strip()
        
        # Default to Wrocław if content contains Wrocław keywords
        for keyword in settings.WROCLAW_KEYWORDS:
            if keyword.lower() in text_lower:
                return "Wrocław"
        
        return None
    
    def extract_price_info(self, text: str) -> Optional[str]:
        """
        Extract price information from text
        
        Args:
            text: Text to analyze
            
        Returns:
            Extracted price info or None
        """
        # Polish price patterns
        price_patterns = [
            r'(\d+[-\s]*zł)',  # "20 zł", "20-30 zł"
            r'(bezpłatny|za darmo|wstęp wolny)',  # Free variations
            r'(\d+[-\s]*PLN)',  # PLN currency
            r'(bilet:?\s*\d+)',  # "bilet: 20"
            r'(cena:?\s*\d+)',  # "cena: 20"
        ]
        
        text_lower = text.lower()
        for pattern in price_patterns:
            match = re.search(pattern, text_lower)
            if match:
                return match.group().strip()
        
        return None
    
    def is_wroclaw_related(self, title: str, description: str = "") -> bool:
        """
        Check if content is related to Wrocław
        
        Args:
            title: Content title
            description: Content description
            
        Returns:
            True if content is Wrocław-related
        """
        text = f"{title} {description}".lower()
        
        # Check for Wrocław keywords
        for keyword in settings.WROCLAW_KEYWORDS:
            if keyword.lower() in text:
                return True
        
        return False
    
    def extract_dates_from_text(self, text: str) -> tuple:
        """
        Extract date information from text
        
        Args:
            text: Text to analyze
            
        Returns:
            Tuple of (start_date, end_date) or (None, None)
        """
        # This is a simplified implementation
        # In a production system, you'd want more sophisticated date parsing
        
        # Look for common Polish date patterns
        date_patterns = [
            r'\d{1,2}\.\d{1,2}\.\d{4}',  # DD.MM.YYYY
            r'\d{1,2}/\d{1,2}/\d{4}',   # DD/MM/YYYY
            r'\d{4}-\d{1,2}-\d{1,2}',   # YYYY-MM-DD
        ]
        
        dates = []
        for pattern in date_patterns:
            matches = re.findall(pattern, text)
            dates.extend(matches)
        
        if dates:
            # For now, just return the first date found
            # In production, you'd parse these properly
            return (dates[0], None)
        
        return (None, None)
    
    def clean_text(self, text: str) -> str:
        """
        Clean and normalize text content
        
        Args:
            text: Raw text to clean
            
        Returns:
            Cleaned text
        """
        if not text:
            return ""
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Remove common unwanted patterns
        unwanted_patterns = [
            r'przeczytaj więcej',
            r'read more',
            r'zobacz więcej',
            r'click here',
            r'kliknij tutaj',
        ]
        
        for pattern in unwanted_patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        return text.strip()
    
    def extract_content_type(self, title: str, description: str = "") -> str:
        """
        Determine content type based on title and description
        
        Args:
            title: Content title
            description: Content description
            
        Returns:
            Content type string
        """
        text = f"{title} {description}".lower()
        
        # Event indicators
        event_keywords = ['wydarzenie', 'event', 'festiwal', 'koncert', 'spektakl', 'wystawa']
        if any(keyword in text for keyword in event_keywords):
            return 'Event'
        
        # News indicators
        news_keywords = ['wiadomości', 'news', 'informacja', 'ogłoszenie', 'komunikat']
        if any(keyword in text for keyword in news_keywords):
            return 'Local News'
        
        # Business indicators
        business_keywords = ['otwarcie', 'promocja', 'sklep', 'firma', 'biznes']
        if any(keyword in text for keyword in business_keywords):
            return 'Business Update'
        
        # Community indicators
        community_keywords = ['społeczność', 'wolontariat', 'pomoc', 'inicjatywa', 'community']
        if any(keyword in text for keyword in community_keywords):
            return 'Community Activity'
        
        # Default to Event for most Wrocław content
        return 'Event'