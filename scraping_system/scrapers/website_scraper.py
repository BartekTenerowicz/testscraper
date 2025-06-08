"""
Website scraper for static content from Wrocław local websites
"""

import asyncio
from typing import Dict, List, Optional
from bs4 import BeautifulSoup
import re
from datetime import datetime
from urllib.parse import urljoin, urlparse

from .base_scraper import BaseScraper

class WebsiteScraper(BaseScraper):
    """Scraper for general websites and local portals"""
    
    def __init__(self):
        super().__init__()
        
        # Define scraping rules for different websites
        self.scraping_rules = {
            'wroclaw.pl': {
                'article_selector': 'article, .article, .news-item',
                'title_selector': 'h1, h2, h3, .title',
                'content_selector': '.content, .description, p',
                'date_selector': '.date, time, .published',
                'link_selector': 'a[href]',
            },
            'default': {
                'article_selector': 'article, .article, .post, .news',
                'title_selector': 'h1, h2, h3',
                'content_selector': '.content, .description, .summary, p',
                'date_selector': '.date, time',
                'link_selector': 'a[href]',
            }
        }
    
    async def scrape(self, source: Dict) -> List[Dict]:
        """
        Scrape content from a website source
        
        Args:
            source: Source configuration
            
        Returns:
            List of scraped content items
        """
        try:
            url = source['source_url']
            self.logger.info(f"Scraping website: {url}")
            
            # Initialize session
            await self.initialize_session()
            
            # Fetch main page
            html_content = await self.fetch_url(url)
            if not html_content:
                return []
            
            # Parse HTML
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Determine scraping rules based on domain
            domain = urlparse(url).netloc
            rules = self.get_scraping_rules(domain)
            
            # Extract articles/content items
            articles = soup.select(rules['article_selector'])
            
            scraped_items = []
            for article in articles[:20]:  # Limit to 20 items per scrape
                try:
                    item = await self.extract_article_data(article, rules, url)
                    if item and self.is_valid_item(item):
                        scraped_items.append(item)
                except Exception as e:
                    self.logger.error(f"Error extracting article: {e}")
                    continue
            
            self.logger.info(f"Scraped {len(scraped_items)} items from {url}")
            return scraped_items
            
        except Exception as e:
            self.logger.error(f"Error scraping website {source['source_url']}: {e}")
            return []
        finally:
            await self.cleanup_session()
    
    def get_scraping_rules(self, domain: str) -> Dict:
        """Get scraping rules for specific domain"""
        # Remove www. prefix for matching
        clean_domain = domain.replace('www.', '')
        
        for rule_domain, rules in self.scraping_rules.items():
            if rule_domain in clean_domain:
                return rules
        
        return self.scraping_rules['default']
    
    async def extract_article_data(self, article, rules: Dict, base_url: str) -> Optional[Dict]:
        """Extract data from a single article element"""
        try:
            # Extract title
            title_elem = article.select_one(rules['title_selector'])
            title = title_elem.get_text(strip=True) if title_elem else ""
            
            if not title or len(title) < 10:
                return None
            
            # Extract content/description
            content_elems = article.select(rules['content_selector'])
            content_parts = []
            for elem in content_elems:
                text = elem.get_text(strip=True)
                if text and len(text) > 20:
                    content_parts.append(text)
            
            description = " ".join(content_parts[:3])  # First 3 paragraphs
            description = self.clean_text(description)
            
            # Check if content is Wrocław-related
            if not self.is_wroclaw_related(title, description):
                return None
            
            # Extract link
            link_elem = article.select_one(rules['link_selector'])
            if link_elem:
                link = link_elem.get('href', '')
                if link:
                    original_url = urljoin(base_url, link)
                else:
                    original_url = base_url
            else:
                original_url = base_url
            
            # Extract date
            date_elem = article.select_one(rules['date_selector'])
            extracted_date = None
            if date_elem:
                date_text = date_elem.get_text(strip=True)
                extracted_date = self.parse_date(date_text)
            
            # Extract images
            image_urls = self.extract_images(article, base_url)
            
            # Extract location
            location = self.extract_location_from_text(f"{title} {description}")
            
            # Extract price info
            price_info = self.extract_price_info(f"{title} {description}")
            
            # Determine content type
            content_type = self.extract_content_type(title, description)
            
            # Generate content hash for duplicate detection
            content_hash = self.generate_content_hash(title, description, original_url)
            
            return {
                'title': title,
                'description': description,
                'content_type': content_type,
                'location': location,
                'price_info': price_info,
                'original_url': original_url,
                'image_urls': image_urls,
                'start_date': extracted_date,
                'content_hash': content_hash,
                'language_code': 'pl',
                'extracted_at': datetime.utcnow().isoformat(),
                'metadata': {
                    'scraper_type': 'website',
                    'domain': urlparse(base_url).netloc
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error extracting article data: {e}")
            return None
    
    def extract_images(self, article, base_url: str) -> List[str]:
        """Extract image URLs from article"""
        images = []
        img_tags = article.find_all('img')
        
        for img in img_tags:
            src = img.get('src') or img.get('data-src')
            if src:
                # Convert relative URLs to absolute
                absolute_url = urljoin(base_url, src)
                
                # Filter out small images (likely icons)
                if self.is_valid_image_url(absolute_url):
                    images.append(absolute_url)
        
        return images[:5]  # Limit to 5 images
    
    def is_valid_image_url(self, url: str) -> bool:
        """Check if image URL is valid for content"""
        # Skip very small images, icons, etc.
        skip_patterns = [
            'icon', 'logo', 'avatar', 'thumb',
            'pixel', 'tracking', 'analytics'
        ]
        
        url_lower = url.lower()
        return not any(pattern in url_lower for pattern in skip_patterns)
    
    def parse_date(self, date_text: str) -> Optional[str]:
        """Parse date from text"""
        if not date_text:
            return None
        
        # Common Polish date patterns
        date_patterns = [
            r'(\d{1,2})\.(\d{1,2})\.(\d{4})',  # DD.MM.YYYY
            r'(\d{4})-(\d{1,2})-(\d{1,2})',   # YYYY-MM-DD
            r'(\d{1,2})/(\d{1,2})/(\d{4})',   # DD/MM/YYYY
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, date_text)
            if match:
                try:
                    if '.' in pattern:  # DD.MM.YYYY
                        day, month, year = match.groups()
                        return f"{year}-{month.zfill(2)}-{day.zfill(2)}T00:00:00Z"
                    elif '-' in pattern:  # YYYY-MM-DD
                        year, month, day = match.groups()
                        return f"{year}-{month.zfill(2)}-{day.zfill(2)}T00:00:00Z"
                    elif '/' in pattern:  # DD/MM/YYYY
                        day, month, year = match.groups()
                        return f"{year}-{month.zfill(2)}-{day.zfill(2)}T00:00:00Z"
                except ValueError:
                    continue
        
        return None
    
    def is_valid_item(self, item: Dict) -> bool:
        """Validate if scraped item meets quality criteria"""
        # Must have title and description
        if not item.get('title') or not item.get('description'):
            return False
        
        # Title should be reasonable length
        title_len = len(item['title'])
        if title_len < 10 or title_len > 200:
            return False
        
        # Description should have some content
        desc_len = len(item['description'])
        if desc_len < 20:
            return False
        
        # Must be Wrocław-related
        if not self.is_wroclaw_related(item['title'], item['description']):
            return False
        
        return True