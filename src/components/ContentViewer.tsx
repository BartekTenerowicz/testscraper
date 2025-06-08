import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, MapPin, ExternalLink, Tag, Eye, Edit, Trash2, Download, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useContent, useCategories } from '../hooks/useSupabase';

const ContentViewer = () => {
  const { content, loading, error, refetch } = useContent();
  const { categories } = useCategories();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'Event':
        return <Calendar className="w-4 h-4 text-orange-500" />;
      case 'Local News':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'Business Update':
        return <Tag className="w-4 h-4 text-green-500" />;
      case 'Community Activity':
        return <MapPin className="w-4 h-4 text-purple-500" />;
      default:
        return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEngagementColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const refreshContent = () => {
    refetch({
      search: searchTerm || undefined,
      contentType: selectedType !== 'all' ? selectedType : undefined,
      sourceType: selectedSource !== 'all' ? selectedSource : undefined,
      dateRange: dateRange !== 'all' ? dateRange : undefined
    });
  };

  const exportContent = () => {
    const csvContent = content.map(item => ({
      title: item.title,
      type: item.content_type,
      location: item.location || '',
      date: item.start_date ? format(new Date(item.start_date), 'yyyy-MM-dd') : '',
      source: (item as any).sources?.source_name || '',
      engagement: item.engagement_score
    }));
    
    const csv = [
      Object.keys(csvContent[0] || {}).join(','),
      ...csvContent.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'wroclaw-content.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Apply filters when they change
  useEffect(() => {
    refreshContent();
  }, [searchTerm, selectedType, selectedCategory, selectedSource, dateRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-32 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error Loading Content</h3>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <button 
            onClick={refreshContent}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Content Library</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and review scraped content from Wrocław sources
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshContent}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportContent}
            disabled={content.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Content Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="Event">Events</option>
              <option value="Local News">Local News</option>
              <option value="Business Update">Business Updates</option>
              <option value="Community Activity">Community Activities</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.category_name}>
                  {category.category_name}
                </option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Sources</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="website">Websites</option>
              <option value="rss">RSS Feeds</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Showing {content.length} items</span>
          <div className="flex items-center space-x-4">
            <span>Total Engagement: {content.reduce((sum, item) => sum + item.engagement_score, 0)}</span>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      {content.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No content found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || selectedType !== 'all' || selectedCategory !== 'all' || selectedSource !== 'all' || dateRange !== 'all'
              ? "Try adjusting your filters or search terms to find the content you're looking for."
              : "No content has been scraped yet. Add some sources to start collecting content."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {content.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
              {/* Image */}
              {item.image_urls && item.image_urls.length > 0 && (
                <div className="aspect-video bg-gray-200 dark:bg-gray-700">
                  <img
                    src={item.image_urls[0]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getContentTypeIcon(item.content_type)}
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {item.content_type}
                    </span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getEngagementColor(item.engagement_score)}`}>
                    {item.engagement_score}%
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                  {item.description}
                </p>

                {/* Location and Date */}
                <div className="space-y-2 mb-4">
                  {item.location && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="w-4 h-4 mr-2" />
                      {item.location}
                    </div>
                  )}
                  {item.start_date && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      {format(new Date(item.start_date), 'dd.MM.yyyy HH:mm')}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {(item as any).sources?.source_name || 'Unknown source'}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <Edit className="w-4 h-4" />
                    </button>
                    {item.original_url && (
                      <a 
                        href={item.original_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentViewer;