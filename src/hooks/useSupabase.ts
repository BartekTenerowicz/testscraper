import { useState, useEffect } from 'react'
import { supabase, type Source, type Content, type Category, type ScrapingLog } from '../lib/supabase'

export function useSources() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSources = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSources(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const addSource = async (sourceData: Omit<Source, 'id' | 'created_at' | 'updated_at' | 'error_count' | 'success_count'>) => {
    try {
      const { data, error } = await supabase
        .from('sources')
        .insert([sourceData])
        .select()

      if (error) throw error
      if (data) {
        setSources(prev => [data[0], ...prev])
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to add source' }
    }
  }

  const updateSource = async (id: string, updates: Partial<Source>) => {
    try {
      const { data, error } = await supabase
        .from('sources')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error
      if (data) {
        setSources(prev => prev.map(source => source.id === id ? data[0] : source))
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update source' }
    }
  }

  const deleteSource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sources')
        .delete()
        .eq('id', id)

      if (error) throw error
      setSources(prev => prev.filter(source => source.id !== id))
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete source' }
    }
  }

  useEffect(() => {
    fetchSources()
  }, [])

  return {
    sources,
    loading,
    error,
    refetch: fetchSources,
    addSource,
    updateSource,
    deleteSource
  }
}

export function useContent() {
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContent = async (filters?: {
    search?: string
    contentType?: string
    category?: string
    sourceType?: string
    dateRange?: string
  }) => {
    try {
      setLoading(true)
      let query = supabase
        .from('content')
        .select(`
          *,
          sources!inner(source_name, source_type)
        `)
        .eq('is_active', true)
        .order('extracted_at', { ascending: false })

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`)
      }

      if (filters?.contentType && filters.contentType !== 'all') {
        query = query.eq('content_type', filters.contentType)
      }

      if (filters?.sourceType && filters.sourceType !== 'all') {
        query = query.eq('sources.source_type', filters.sourceType)
      }

      if (filters?.dateRange && filters.dateRange !== 'all') {
        const now = new Date()
        let filterDate = new Date()
        
        switch (filters.dateRange) {
          case 'today':
            filterDate.setHours(0, 0, 0, 0)
            break
          case 'week':
            filterDate.setDate(now.getDate() - 7)
            break
          case 'month':
            filterDate.setMonth(now.getMonth() - 1)
            break
        }
        
        query = query.gte('extracted_at', filterDate.toISOString())
      }

      const { data, error } = await query.limit(100)

      if (error) throw error
      setContent(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContent()
  }, [])

  return {
    content,
    loading,
    error,
    refetch: fetchContent
  }
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('category_name')

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories
  }
}

export function useScrapingLogs() {
  const [logs, setLogs] = useState<ScrapingLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = async (limit = 50) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('scraping_logs')
        .select(`
          *,
          sources!inner(source_name, source_type)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      setLogs(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  return {
    logs,
    loading,
    error,
    refetch: fetchLogs
  }
}

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // Fetch various analytics data
      const [
        contentStats,
        sourceStats,
        recentActivity,
        contentByType
      ] = await Promise.all([
        supabase.from('content').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('sources').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('scraping_logs').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('content').select('content_type').eq('is_active', true)
      ])

      const data = {
        totalContent: contentStats.count || 0,
        totalSources: sourceStats.count || 0,
        recentActivity: recentActivity.data || [],
        contentByType: contentByType.data || []
      }

      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics
  }
}