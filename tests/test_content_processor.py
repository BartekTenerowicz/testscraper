import os
import sys
from pathlib import Path

# Ensure project root is on sys.path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))  # for scraping_system package
sys.path.insert(0, str(ROOT / "scraping_system"))  # for config package

os.environ.setdefault('SUPABASE_URL', 'http://example.com')
os.environ.setdefault('SUPABASE_ANON_KEY', 'anon')

from scraping_system.processors.content_processor import ContentProcessor
from scraping_system.config.settings import settings, DEFAULT_MAX_IMAGE_URLS


def test_clean_image_urls_limit():
    processor = ContentProcessor()
    urls = [f"https://example.com/image{i}.jpg" for i in range(DEFAULT_MAX_IMAGE_URLS + 2)]
    cleaned = processor.clean_image_urls(urls)
    assert len(cleaned) == DEFAULT_MAX_IMAGE_URLS
