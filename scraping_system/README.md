# CoTenWrocław Content Scraping System

A comprehensive content scraping system for collecting local content from various sources in Wrocław, Poland. This system is designed to support the CoTenWrocław hyperpersonalized newsletter service.

## Features

- **Multi-source scraping**: Support for websites, RSS feeds, and social media platforms
- **Intelligent content processing**: Automatic categorization, duplicate detection, and content enhancement
- **Wrocław-focused filtering**: Content filtering specifically for Wrocław-related information
- **Database integration**: Full integration with Supabase for data storage and management
- **Scalable architecture**: Modular design for easy extension and maintenance
- **Comprehensive logging**: Detailed logging and monitoring capabilities

## Architecture

### Core Components

1. **Main Orchestrator** (`main.py`): Central coordinator for all scraping operations
2. **Scrapers**: Modular scrapers for different source types
   - `WebsiteScraper`: For general websites and local portals
   - `RSSFeedScraper`: For RSS feeds from local news sources
   - Social media scrapers (API-based, requires authentication)
3. **Content Processor**: Cleans, categorizes, and enhances scraped content
4. **Database Client**: Supabase integration for data storage
5. **Scheduler**: Manages scraping schedules and priorities

### Database Schema

The system uses a comprehensive PostgreSQL schema with the following main tables:

- `sources`: Manages scraping sources and configurations
- `content`: Stores scraped content with full metadata
- `categories`: Content categorization system
- `scraping_logs`: Tracks scraping activities and performance
- `keywords`: Extracted keywords for content analysis

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd scraping_system
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Configure Supabase**:
   - Create a Supabase project
   - Run the database migration script
   - Update environment variables with your Supabase credentials

## Configuration

### Environment Variables

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Scraping Configuration
MAX_CONCURRENT_SCRAPERS=5
DEFAULT_REQUEST_TIMEOUT=30
DEFAULT_RETRY_ATTEMPTS=3
DEFAULT_RATE_LIMIT_DELAY=1000

# Content Processing
ENABLE_DUPLICATE_DETECTION=true
DUPLICATE_SIMILARITY_THRESHOLD=0.85
ENABLE_AUTO_CATEGORIZATION=true

# Optional: Proxy Configuration
USE_PROXY=false
PROXY_LIST=proxy1:port,proxy2:port
```

### Adding New Sources

Sources can be added directly to the database or through the admin interface:

```sql
INSERT INTO sources (source_name, source_type, source_url, scraping_frequency_minutes) 
VALUES ('Wrocław Events', 'website', 'https://wroclaw.pl/events', 60);
```

## Usage

### Single Scraping Run

```bash
python main.py --mode single
```

### Continuous Scraping

```bash
python main.py --mode continuous
```

### Scrape Specific Source

```bash
python main.py --mode single --source-id <source-id>
```

### Scrape by Source Type

```bash
python main.py --mode single --source-type website
```

## Content Types

The system identifies and processes four main content types:

1. **Events**: Cultural events, festivals, concerts, exhibitions
2. **Local News**: News articles, announcements, official communications
3. **Business Updates**: New openings, promotions, business news
4. **Community Activities**: Volunteering, community initiatives, social activities

## Content Processing Pipeline

1. **Extraction**: Raw content extraction from sources
2. **Validation**: Check if content meets quality criteria
3. **Cleaning**: Text normalization and cleanup
4. **Categorization**: Automatic categorization based on keywords
5. **Enhancement**: Location data enhancement and metadata addition
6. **Deduplication**: Duplicate detection and handling
7. **Storage**: Save to database with full metadata

## Monitoring and Logging

The system provides comprehensive logging and monitoring:

- **Scraping logs**: Track all scraping activities and performance
- **Error handling**: Detailed error logging and retry mechanisms
- **Performance metrics**: Success rates, response times, content quality scores
- **Source statistics**: Track source reliability and performance

## Extending the System

### Adding New Scrapers

1. Create a new scraper class inheriting from `BaseScraper`
2. Implement the `scrape()` method
3. Register the scraper in `ScraperFactory`
4. Add appropriate configuration options

### Adding New Content Processors

1. Extend the `ContentProcessor` class
2. Add new processing methods
3. Update the processing pipeline

### Adding New Data Sources

1. Add source configuration to the database
2. Ensure appropriate scraper is available
3. Configure scraping frequency and parameters

## Social Media Integration

Social media scraping requires API access and proper authentication:

- **Facebook**: Requires Facebook Graph API access
- **Instagram**: Requires Instagram Basic Display API
- **Twitter**: Requires Twitter API v2
- **TikTok**: Requires TikTok API access

These scrapers are not included in the base system due to API requirements and terms of service considerations.

## Performance Considerations

- **Rate Limiting**: Configurable delays between requests
- **Concurrent Processing**: Configurable number of concurrent scrapers
- **Memory Management**: Efficient processing of large content volumes
- **Database Optimization**: Proper indexing and query optimization

## Legal and Ethical Considerations

- **Robots.txt Compliance**: Respects robots.txt directives
- **Rate Limiting**: Implements appropriate delays to avoid overwhelming sources
- **Public Content Only**: Only scrapes publicly available information
- **Attribution**: Maintains source attribution for all content
- **Terms of Service**: Designed to comply with website terms of service

## Troubleshooting

### Common Issues

1. **Connection Errors**: Check network connectivity and source availability
2. **Rate Limiting**: Increase delays between requests
3. **Content Not Found**: Verify source URLs and selectors
4. **Database Errors**: Check Supabase configuration and connectivity

### Debugging

Enable debug logging:
```bash
python main.py --log-level DEBUG
```

Check scraping logs in the database:
```sql
SELECT * FROM scraping_logs WHERE status = 'failed' ORDER BY created_at DESC;
```

## Contributing

1. Follow the existing code structure and patterns
2. Add appropriate tests for new functionality
3. Update documentation for any changes
4. Ensure compliance with legal and ethical guidelines

## License

This project is licensed under the MIT License. See LICENSE file for details.