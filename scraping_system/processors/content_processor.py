"""
Content processor for cleaning, categorizing, and enhancing scraped content
"""

import asyncio
import re
import hashlib
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

from config.settings import settings

class ContentProcessor:
    """Process and enhance scraped content"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    async def process_item(self, item: Dict, source: Dict) -> Optional[Dict]:
        """
        Process a single scraped item
        
        Args:
            item: Raw scraped item
            source: Source configuration
            
        Returns:
            Processed item or None if invalid
        """
        try:
            # Validate basic requirements
            if not self.is_valid_item(item):
                return None
            
            # Clean and normalize text
            processed_item = await self.clean_and_normalize(item)
            
            # Add source information
            processed_item['source_id'] = source['id']
            
            # Auto-categorize content
            if settings.ENABLE_AUTO_CATEGORIZATION:
                categories = self.auto_categorize(processed_item)
                processed_item['categories'] = categories
            
            # Extract keywords
            keywords = self.extract_keywords(processed_item)
            processed_item['keywords'] = keywords
            
            # Enhance location data
            processed_item = await self.enhance_location_data(processed_item)
            
            # Calculate engagement score
            processed_item['engagement_score'] = self.calculate_engagement_score(processed_item)
            
            # Set processing timestamp
            processed_item['processed_at'] = datetime.utcnow().isoformat()
            
            return processed_item
            
        except Exception as e:
            self.logger.error(f"Error processing item: {e}")
            return None
    
    def is_valid_item(self, item: Dict) -> bool:
        """Validate if item meets basic requirements"""
        # Must have title and description
        if not item.get('title') or not item.get('description'):
            return False
        
        # Title length check
        title_len = len(item['title'].strip())
        if title_len < 5 or title_len > 300:
            return False
        
        # Description length check
        desc_len = len(item['description'].strip())
        if desc_len < 10:
            return False
        
        # Must be Wrocław-related
        title = item['title'].lower()
        description = item['description'].lower()
        text = f"{title} {description}"
        
        wroclaw_related = any(keyword.lower() in text for keyword in settings.WROCLAW_KEYWORDS)
        if not wroclaw_related:
            return False
        
        return True
    
    async def clean_and_normalize(self, item: Dict) -> Dict:
        """Clean and normalize item data"""
        cleaned_item = item.copy()
        
        # Clean title
        if 'title' in cleaned_item:
            cleaned_item['title'] = self.clean_text(cleaned_item['title'])
        
        # Clean description
        if 'description' in cleaned_item:
            cleaned_item['description'] = self.clean_text(cleaned_item['description'])
        
        # Normalize location
        if 'location' in cleaned_item and cleaned_item['location']:
            cleaned_item['location'] = self.normalize_location(cleaned_item['location'])
        
        # Clean price info
        if 'price_info' in cleaned_item and cleaned_item['price_info']:
            cleaned_item['price_info'] = self.clean_text(cleaned_item['price_info'])
        
        # Validate and clean image URLs
        if 'image_urls' in cleaned_item:
            cleaned_item['image_urls'] = self.clean_image_urls(cleaned_item['image_urls'])
        
        return cleaned_item
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text content"""
        if not text:
            return ""
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Remove unwanted characters
        text = re.sub(r'[^\w\s\-.,!?():;/&@#%+=\[\]{}"]', '', text)
        
        # Remove common spam patterns
        spam_patterns = [
            r'przeczytaj więcej.*',
            r'read more.*',
            r'zobacz więcej.*',
            r'click here.*',
            r'kliknij tutaj.*',
            r'www\.\w+\.\w+',  # Remove URLs
        ]
        
        for pattern in spam_patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        return text.strip()
    
    def normalize_location(self, location: str) -> str:
        """Normalize location string"""
        if not location:
            return ""
        
        location = location.strip()
        
        # Common location normalizations for Wrocław
        normalizations = {
            'wroclaw': 'Wrocław',
            'wroclawiu': 'Wrocław',
            'we wroclawiu': 'Wrocław',
            'stare miasto': 'Stare Miasto, Wrocław',
            'rynek': 'Rynek, Wrocław',
            'ostrow tumski': 'Ostrów Tumski, Wrocław',
            'ostrów tumski': 'Ostrów Tumski, Wrocław',
            'nadodrze': 'Nadodrze, Wrocław',
            'krzyki': 'Krzyki, Wrocław',
            'fabryczna': 'Fabryczna, Wrocław',
            'psie pole': 'Psie Pole, Wrocław',
        }
        
        location_lower = location.lower()
        for pattern, replacement in normalizations.items():
            if pattern in location_lower:
                return replacement
        
        # If it contains Wrocław keywords but isn't normalized, add Wrocław
        if any(keyword.lower() in location_lower for keyword in settings.WROCLAW_KEYWORDS):
            if 'wrocław' not in location_lower:
                return f"{location}, Wrocław"
        
        return location
    
    def clean_image_urls(self, image_urls: List[str]) -> List[str]:
        """Clean and validate image URLs"""
        if not image_urls:
            return []
        
        cleaned_urls = []
        for url in image_urls:
            if self.is_valid_image_url(url):
                cleaned_urls.append(url.strip())
        
        return cleaned_urls[:settings.content.get('maxImageUrls', 5)]
    
    def is_valid_image_url(self, url: str) -> bool:
        """Check if image URL is valid"""
        if not url or len(url) < 10:
            return False
        
        # Must be HTTP/HTTPS
        if not url.startswith(('http://', 'https://')):
            return False
        
        # Should have image extension or be from known image services
        image_patterns = [
            r'\.(jpg|jpeg|png|gif|webp)(\?|$)',
            r'images\.pexels\.com',
            r'unsplash\.com',
            r'pixabay\.com',
        ]
        
        url_lower = url.lower()
        return any(re.search(pattern, url_lower) for pattern in image_patterns)
    
    def auto_categorize(self, item: Dict) -> List[str]:
        """Automatically categorize content based on keywords"""
        text = f"{item.get('title', '')} {item.get('description', '')}".lower()
        
        categories = []
        
        for category, keywords in settings.CATEGORY_KEYWORDS.items():
            if any(keyword.lower() in text for keyword in keywords):
                categories.append(category)
        
        # If no categories found, try to infer from content type
        if not categories:
            content_type = item.get('content_type', '')
            if content_type == 'Event':
                categories.append('Events')
            elif content_type == 'Local News':
                categories.append('News')
            elif content_type == 'Business Update':
                categories.append('Business')
            elif content_type == 'Community Activity':
                categories.append('Community')
        
        return categories[:3]  # Limit to 3 categories
    
    def extract_keywords(self, item: Dict) -> List[Dict]:
        """Extract relevant keywords from content"""
        text = f"{item.get('title', '')} {item.get('description', '')}".lower()
        
        # Remove common Polish stop words
        stop_words = {
            'i', 'w', 'na', 'z', 'do', 'o', 'a', 'że', 'się', 'to', 'jest', 'nie',
            'ma', 'jak', 'ale', 'czy', 'już', 'tylko', 'też', 'może', 'będzie',
            'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with'
        }
        
        # Extract words (minimum 3 characters)
        words = re.findall(r'\b[a-ząćęłńóśźż]{3,}\b', text)
        
        # Count word frequency
        word_freq = {}
        for word in words:
            if word not in stop_words:
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # Convert to keyword objects
        keywords = []
        for word, freq in sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]:
            keywords.append({
                'keyword': word,
                'frequency': freq,
                'relevance_score': min(freq / len(words), 1.0)
            })
        
        return keywords
    
    async def enhance_location_data(self, item: Dict) -> Dict:
        """Enhance location data with coordinates if possible"""
        location = item.get('location')
        if not location:
            return item
        
        # For now, just add Wrocław coordinates for Wrocław-related content
        # In production, you might use a geocoding service
        if 'wrocław' in location.lower():
            item['location_coordinates'] = {
                'type': 'Point',
                'coordinates': list(settings.WROCLAW_COORDINATES)  # [longitude, latitude]
            }
        
        return item
    
    def calculate_engagement_score(self, item: Dict) -> int:
        """Calculate engagement score based on content quality"""
        score = 50  # Base score
        
        # Title quality
        title = item.get('title', '')
        if len(title) > 20:
            score += 10
        if any(word in title.lower() for word in ['festiwal', 'koncert', 'wydarzenie']):
            score += 15
        
        # Description quality
        description = item.get('description', '')
        if len(description) > 100:
            score += 10
        if len(description) > 300:
            score += 10
        
        # Has location
        if item.get('location'):
            score += 10
        
        # Has images
        if item.get('image_urls'):
            score += 10
        
        # Has price info
        if item.get('price_info'):
            score += 5
        
        # Recent content
        if item.get('start_date'):
            try:
                start_date = datetime.fromisoformat(item['start_date'].replace('Z', '+00:00'))
                days_from_now = (start_date - datetime.now()).days
                if 0 <= days_from_now <= 30:  # Event in next 30 days
                    score += 15
            except:
                pass
        
        return min(score, 100)  # Cap at 100