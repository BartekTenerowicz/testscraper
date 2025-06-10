"""
Configuration settings for CoTenWrocław scraping system
"""

import os
from typing import Dict, Any
from dataclasses import dataclass, field

# Default values for various settings
DEFAULT_MAX_IMAGE_URLS: int = 5

@dataclass
class Settings:
    """Configuration settings loaded from environment variables"""
    
    # Database settings
    SUPABASE_URL: str = os.getenv('SUPABASE_URL', '')
    SUPABASE_ANON_KEY: str = os.getenv('SUPABASE_ANON_KEY', '')
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')
    
    # Scraping settings
    MAX_CONCURRENT_SCRAPERS: int = int(os.getenv('MAX_CONCURRENT_SCRAPERS', '5'))
    DEFAULT_REQUEST_TIMEOUT: int = int(os.getenv('DEFAULT_REQUEST_TIMEOUT', '30'))
    DEFAULT_RETRY_ATTEMPTS: int = int(os.getenv('DEFAULT_RETRY_ATTEMPTS', '3'))
    DEFAULT_RATE_LIMIT_DELAY: int = int(os.getenv('DEFAULT_RATE_LIMIT_DELAY', '1000'))

    # Content settings
    MAX_IMAGE_URLS: int = int(os.getenv('MAX_IMAGE_URLS', str(DEFAULT_MAX_IMAGE_URLS)))
    
    # Scheduler settings
    SCHEDULER_CHECK_INTERVAL: int = int(os.getenv('SCHEDULER_CHECK_INTERVAL', '300'))  # 5 minutes
    
    # Content processing settings
    ENABLE_DUPLICATE_DETECTION: bool = os.getenv('ENABLE_DUPLICATE_DETECTION', 'true').lower() == 'true'
    DUPLICATE_SIMILARITY_THRESHOLD: float = float(os.getenv('DUPLICATE_SIMILARITY_THRESHOLD', '0.85'))
    ENABLE_AUTO_CATEGORIZATION: bool = os.getenv('ENABLE_AUTO_CATEGORIZATION', 'true').lower() == 'true'
    
    # Location settings for Wrocław
    WROCLAW_COORDINATES: tuple = (51.1079, 17.0385)  # Wrocław city center
    SEARCH_RADIUS_KM: float = float(os.getenv('SEARCH_RADIUS_KM', '50'))  # 50km radius around Wrocław
    
    # User agent for web requests
    USER_AGENT: str = os.getenv('USER_AGENT', 'CoTenWrocław-Bot/1.0 (+https://cotenwroclaw.pl)')
    
    # Proxy settings (optional)
    USE_PROXY: bool = os.getenv('USE_PROXY', 'false').lower() == 'true'
    PROXY_LIST: list = field(default_factory=lambda: os.getenv('PROXY_LIST', '').split(',') if os.getenv('PROXY_LIST') else [])
    
    # Language settings
    SUPPORTED_LANGUAGES: list = field(default_factory=lambda: ['pl', 'en'])
    DEFAULT_LANGUAGE: str = 'pl'
    
    # Content filtering keywords for Wrocław
    WROCLAW_KEYWORDS: list = field(default_factory=lambda: [
        'wrocław', 'wroclaw', 'dolnośląskie', 'dolnoslaskie',
        'stare miasto', 'rynek', 'ostrów tumski', 'nadodrze',
        'krzyki', 'fabryczna', 'psie pole', 'śródmieście'
    ])
    
    # Category mapping for auto-categorization
    CATEGORY_KEYWORDS: Dict[str, list] = field(default_factory=lambda: {
        'Events': ['wydarzenie', 'event', 'festiwal', 'koncert', 'spektakl', 'wystawa'],
        'Food': ['restauracja', 'kawiarnia', 'bar', 'kuchnia', 'jedzenie', 'food'],
        'Business': ['firma', 'biznes', 'otwarcie', 'promocja', 'sklep', 'usługa'],
        'Culture': ['kultura', 'muzeum', 'teatr', 'galeria', 'sztuka', 'culture'],
        'Sports': ['sport', 'fitness', 'trening', 'bieg', 'mecz', 'zawody'],
        'Community': ['społeczność', 'community', 'wolontariat', 'pomoc', 'inicjatywa'],
        'Transport': ['transport', 'komunikacja', 'autobus', 'tramwaj', 'parking'],
        'News': ['news', 'wiadomości', 'informacja', 'ogłoszenie', 'komunikat']
    })
    
    def __post_init__(self):
        """Validate settings after initialization"""
        if not self.SUPABASE_URL or not self.SUPABASE_ANON_KEY:
            raise ValueError("Supabase configuration is required")
        
        if self.MAX_CONCURRENT_SCRAPERS < 1:
            raise ValueError("MAX_CONCURRENT_SCRAPERS must be at least 1")
        
        if self.DUPLICATE_SIMILARITY_THRESHOLD < 0.1 or self.DUPLICATE_SIMILARITY_THRESHOLD > 1.0:
            raise ValueError("DUPLICATE_SIMILARITY_THRESHOLD must be between 0.1 and 1.0")

        if self.MAX_IMAGE_URLS < 1:
            raise ValueError("MAX_IMAGE_URLS must be at least 1")

# Global settings instance
settings = Settings()
