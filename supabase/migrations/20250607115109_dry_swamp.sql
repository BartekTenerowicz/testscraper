/*
  # CoTenWrocław Content Scraping Database Schema

  1. New Tables
    - `sources` - Manages scraping sources (Facebook, Instagram, websites, etc.)
    - `content` - Stores scraped content from various sources
    - `categories` - Content categorization system
    - `scraping_logs` - Tracks scraping activities and errors
    - `content_categories` - Many-to-many relationship between content and categories
    - `keywords` - Extracted keywords from content for analytics

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
    - Create appropriate indexes for performance

  3. Features
    - Full-text search capabilities
    - Geolocation support for Wrocław content
    - Content duplication detection
    - Performance analytics and monitoring
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Sources table for managing scraping targets
CREATE TABLE IF NOT EXISTS sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('facebook', 'instagram', 'twitter', 'tiktok', 'website', 'rss')),
  source_url text NOT NULL,
  scraping_frequency_minutes integer DEFAULT 60,
  last_scraped_at timestamptz,
  is_active boolean DEFAULT true,
  scraping_config jsonb DEFAULT '{}',
  error_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Categories table for content classification
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name text UNIQUE NOT NULL,
  parent_category_id uuid REFERENCES categories(id),
  description text,
  color_code text DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Content table for storing scraped information
CREATE TABLE IF NOT EXISTS content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES sources(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('Event', 'Local News', 'Business Update', 'Community Activity')),
  title text NOT NULL,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  location text,
  location_coordinates geometry(POINT, 4326),
  price_info text,
  original_url text,
  image_urls jsonb DEFAULT '[]',
  extracted_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  is_active boolean DEFAULT true,
  engagement_score integer DEFAULT 0,
  content_hash text, -- For duplicate detection
  language_code text DEFAULT 'pl',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Content categories many-to-many relationship
CREATE TABLE IF NOT EXISTS content_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES content(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  confidence_score decimal(3,2) DEFAULT 1.0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(content_id, category_id)
);

-- Scraping logs for monitoring and debugging
CREATE TABLE IF NOT EXISTS scraping_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES sources(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'timeout')),
  items_found integer DEFAULT 0,
  items_processed integer DEFAULT 0,
  items_new integer DEFAULT 0,
  items_updated integer DEFAULT 0,
  error_message text,
  execution_time_ms integer,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Keywords table for content analysis
CREATE TABLE IF NOT EXISTS keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES content(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  frequency integer DEFAULT 1,
  relevance_score decimal(3,2) DEFAULT 0.5,
  extracted_at timestamptz DEFAULT now(),
  UNIQUE(content_id, keyword)
);

-- User preferences for newsletter personalization (future use)
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid, -- Will link to auth.users when user system is implemented
  preferred_categories jsonb DEFAULT '[]',
  preferred_locations jsonb DEFAULT '[]',
  preferred_content_types jsonb DEFAULT '[]',
  language_preference text DEFAULT 'pl',
  frequency_preference text DEFAULT 'daily',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing full access for now, can be restricted later)
CREATE POLICY "Allow all operations on sources" ON sources FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations on categories" ON categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations on content" ON content FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations on content_categories" ON content_categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations on scraping_logs" ON scraping_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations on keywords" ON keywords FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations on user_preferences" ON user_preferences FOR ALL TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sources_type ON sources(source_type);
CREATE INDEX IF NOT EXISTS idx_sources_active ON sources(is_active);
CREATE INDEX IF NOT EXISTS idx_sources_last_scraped ON sources(last_scraped_at);

CREATE INDEX IF NOT EXISTS idx_content_source ON content(source_id);
CREATE INDEX IF NOT EXISTS idx_content_type ON content(content_type);
CREATE INDEX IF NOT EXISTS idx_content_date ON content(start_date);
CREATE INDEX IF NOT EXISTS idx_content_location ON content USING GIST(location_coordinates);
CREATE INDEX IF NOT EXISTS idx_content_active ON content(is_active);
CREATE INDEX IF NOT EXISTS idx_content_hash ON content(content_hash);
CREATE INDEX IF NOT EXISTS idx_content_extracted ON content(extracted_at);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_content_search ON content USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

CREATE INDEX IF NOT EXISTS idx_scraping_logs_source ON scraping_logs(source_id);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_status ON scraping_logs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_date ON scraping_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_keywords_content ON keywords(content_id);
CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON keywords(keyword);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (category_name, description, color_code) VALUES
('Events', 'Cultural events, festivals, concerts', '#F97316'),
('News', 'Local news and announcements', '#3B82F6'),
('Business', 'Business updates, new openings, offers', '#10B981'),
('Community', 'Community activities and volunteering', '#8B5CF6'),
('Culture', 'Cultural activities and arts', '#F59E0B'),
('Food', 'Restaurants, cafes, food events', '#EF4444'),
('Transport', 'Transportation updates and changes', '#6B7280'),
('Sports', 'Sports events and activities', '#14B8A6'),
('Entertainment', 'Entertainment venues and shows', '#EC4899'),
('Education', 'Educational events and workshops', '#84CC16')
ON CONFLICT (category_name) DO NOTHING;

-- Insert sample sources for Wrocław
INSERT INTO sources (source_name, source_type, source_url, scraping_frequency_minutes) VALUES
('Wrocław Events - Facebook', 'facebook', 'https://facebook.com/groups/wroclaw-events', 30),
('Visit Wrocław - Instagram', 'instagram', 'https://instagram.com/visitwroclaw', 60),
('Wrocław Official Portal', 'website', 'https://wroclaw.pl', 240),
('Gazeta Wrocławska RSS', 'rss', 'https://gazetawroclawska.pl/rss', 60),
('Wrocław Foodie Guide', 'website', 'https://wroclawfoodie.pl', 120)
ON CONFLICT DO NOTHING;