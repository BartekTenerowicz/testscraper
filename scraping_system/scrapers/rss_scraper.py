"""
RSS feed scraper for local news and content
"""

import asyncio
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional
from datetime import datetime
import re
from urllib.parse import urljoin

from .base_scraper import BaseScraper

class RSSFeedScraper(BaseScraper):
    """Scraper for RSS feeds from local news sources"""
    
    def __init__(self):
        super().__init__()
    
    async def scrape(self, source: Dict) -> List[Dict]:
        """
        Scrape content from RSS feed
        
        Args:
            source: Source configuration
            
        Returns:
            List of scraped content items
        """
        try:
            url = source['source_url']
            self.logger.info(f"Scraping RSS feed: {url}")
            
            # Initialize session
            await self.initialize_session()
            
            # Fetch RSS content
            rss_content = await self.fetch_url(url)
            if not rss_content:
                return []
            
            # Parse RSS XML
            try:
                root = ET.fromstring(rss_content)
            except ET.ParseError as e:
                self.logger.error(f"Error parsing RSS XML: {e}")
                return []
            
            # Extract items
            scraped_items = []
            
            # Handle different RSS formats
            items = root.findall('.//item') or root.findall('.//{http://www.w3.org/2005/Atom}entry')
            
            for item in items[:20]:  # Limit to 20 items
                try:
                    extracted_item = self.extract_rss_item(item, url)
                    if extracted_item and self.is_valid_item(extracted_item):
                        scraped_items.append(extracted_item)
                except Exception as e:
                    self.logger.error(f"Error extracting RSS item: {e}")
                    continue
            
            self.logger.info(f"Scraped {len(scraped_items)} items from RSS feed")
            return scraped_items
            
        except Exception as e:
            self.logger.error(f"Error scraping RSS feed {source['source_url']}: {e}")
            return []
        finally:
            await self.cleanup_session()
    
    def extract_rss_item(self, item, feed_url: str) -> Optional[Dict]:
        """Extract data from RSS item"""
        try:
            # Extract title
            title_elem = item.find('title') or item.find('.//{http://www.w3.org/2005/Atom}title')
            title = title_elem.text.strip() if title_elem is not None and title_elem.text else ""
            
            if not title:
                return None
            
            # Extract description
            desc_elem = (item.find('description') or 
                        item.find('summary') or 
                        item.find('.//{http://www.w3.org/2005/Atom}summary') or
                        item.find('.//{http://www.w3.org/2005/Atom}content'))
            
            description = ""
            if desc_elem is not None and desc_elem.text:
                description = self.clean_html(desc_elem.text)
                description = self.clean_text(description)
            
            # Check if content is Wrocław-related
            if not self.is_wroclaw_related(title, description):
                return None
            
            # Extract link
            link_elem = item.find('link') or item.find('.//{http://www.w3.org/2005/Atom}link')
            original_url = ""
            if link_elem is not None:
                if link_elem.text:
                    original_url = link_elem.text.strip()
                elif link_elem.get('href'):
                    original_url = link_elem.get('href')
            
            # Extract publication date
            pub_date = self.extract_publication_date(item)
            
            # Extract categories/tags
            categories = self.extract_categories(item)
            
            # Extract location
            location = self.extract_location_from_text(f"{title} {description}")
            
            # Extract price info
            price_info = self.extract_price_info(f"{title} {description}")
            
            # Determine content type
            content_type = self.extract_content_type(title, description)
            
            # Generate content hash
            content_hash = self.generate_content_hash(title, description, original_url)
            
            return {
                'title': title,
                'description': description,
                'content_type': content_type,
                'location': location,
                'price_info': price_info,
                'original_url': original_url,
                'start_date': pub_date,
                'content_hash': content_hash,
                'language_code': 'pl',
                'extracted_at': datetime.utcnow().isoformat(),
                'metadata': {
                    'scraper_type': 'rss',
                    'feed_url': feed_url,
                    'categories': categories
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error extracting RSS item: {e}")
            return None
    
    def clean_html(self, html_text: str) -> str:
        """Remove HTML tags from text"""
        if not html_text:
            return ""
        
        # Remove HTML tags
        clean_text = re.sub(r'<[^>]+>', '', html_text)
        
        # Decode HTML entities
        clean_text = clean_text.replace('&amp;', '&')
        clean_text = clean_text.replace('&lt;', '<')
        clean_text = clean_text.replace('&gt;', '>')
        clean_text = clean_text.replace('&quot;', '"')
        clean_text = clean_text.replace('&#39;', "'")
        clean_text = clean_text.replace('&nbsp;', ' ')
        
        return clean_text.strip()
    
    def extract_publication_date(self, item) -> Optional[str]:
        """Extract publication date from RSS item"""
        # Try different date fields
        date_fields = ['pubDate', 'published', 'updated', 'dc:date']
        
        for field in date_fields:
            date_elem = item.find(field) or item.find(f'.//{{{self.get_namespace(field)}}}{field.split(":")[-1]}')
            if date_elem is not None and date_elem.text:
                return self.parse_rss_date(date_elem.text)
        
        return None
    
    def get_namespace(self, field: str) -> str:
        """Get namespace for RSS field"""
        namespaces = {
            'dc': 'http://purl.org/dc/elements/1.1/',
            'atom': 'http://www.w3.org/2005/Atom'
        }
        
        if ':' in field:
            prefix = field.split(':')[0]
            return namespaces.get(prefix, '')
        
        return ''
    
    def parse_rss_date(self, date_str: str) -> Optional[str]:
        """Parse RSS date string to ISO format"""
        if not date_str:
            return None
        
        # Common RSS date formats
        date_formats = [
            '%a, %d %b %Y %H:%M:%S %z',  # RFC 2822
            '%a, %d %b %Y %H:%M:%S GMT',
            '%Y-%m-%dT%H:%M:%S%z',       # ISO 8601
            '%Y-%m-%dT%H:%M:%SZ',
            '%Y-%m-%d %H:%M:%S',
            '%d.%m.%Y %H:%M:%S',         # Polish format
        ]
        
        for fmt in date_formats:
            try:
                dt = datetime.strptime(date_str.strip(), fmt)
                return dt.isoformat() + 'Z'
            except ValueError:
                continue
        
        # If no format matches, try to extract just the date
        date_match = re.search(r'(\d{4}-\d{2}-\d{2})', date_str)
        if date_match:
            return f"{date_match.group(1)}T00:00:00Z"
        
        return None
    
    def extract_categories(self, item) -> List[str]:
        """Extract categories/tags from RSS item"""
        categories = []
        
        # Look for category elements
        category_elems = item.findall('category')
        for cat_elem in category_elems:
            if cat_elem.text:
                categories.append(cat_elem.text.strip())
        
        # Look for tags
        tag_elems = item.findall('.//tag') or item.findall('.//keyword')
        for tag_elem in tag_elems:
            if tag_elem.text:
                categories.append(tag_elem.text.strip())
        
        return categories[:5]  # Limit to 5 categories
    
    def is_valid_item(self, item: Dict) -> bool:
        """Validate RSS item"""
        # Must have title
        if not item.get('title') or len(item['title']) < 10:
            return False
        
        # Should have some description
        if not item.get('description') or len(item['description']) < 20:
            return False
        
        # Must be Wrocław-related
        if not self.is_wroclaw_related(item['title'], item['description']):
            return False
        
        return True