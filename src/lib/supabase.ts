import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Source {
  id: string
  source_name: string
  source_type: 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'website' | 'rss'
  source_url: string
  scraping_frequency_minutes: number
  last_scraped_at?: string
  is_active: boolean
  error_count: number
  success_count: number
  created_at: string
  updated_at: string
}

export interface Content {
  id: string
  source_id: string
  content_type: 'Event' | 'Local News' | 'Business Update' | 'Community Activity'
  title: string
  description?: string
  start_date?: string
  end_date?: string
  location?: string
  location_coordinates?: any
  price_info?: string
  original_url?: string
  image_urls: string[]
  extracted_at: string
  processed_at?: string
  is_active: boolean
  engagement_score: number
  content_hash?: string
  language_code: string
  metadata: any
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  category_name: string
  parent_category_id?: string
  description?: string
  color_code: string
  is_active: boolean
  created_at: string
}

export interface ScrapingLog {
  id: string
  source_id: string
  started_at: string
  completed_at?: string
  status: 'running' | 'completed' | 'failed' | 'timeout'
  items_found: number
  items_processed: number
  items_new: number
  items_updated: number
  error_message?: string
  execution_time_ms?: number
  metadata: any
  created_at: string
}