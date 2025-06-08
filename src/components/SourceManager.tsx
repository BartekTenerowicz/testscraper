import React, { useState } from 'react';
import { Plus, Settings, Play, Pause, Trash2, Globe, Facebook, Instagram, Twitter, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useSources } from '../hooks/useSupabase';
import { format } from 'date-fns';

const SourceManager = () => {
  const { sources, loading, error, addSource, updateSource, deleteSource, refetch } = useSources();
  const [showAddSource, setShowAddSource] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [formData, setFormData] = useState({
    source_name: '',
    source_type: '',
    source_url: '',
    scraping_frequency_minutes: 60,
    is_active: true
  });

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'facebook':
        return <Facebook className="w-5 h-5 text-blue-600" />;
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-600" />;
      case 'twitter':
        return <Twitter className="w-5 h-5 text-blue-400" />;
      case 'tiktok':
        return <div className="w-5 h-5 bg-black rounded text-white text-xs flex items-center justify-center font-bold">T</div>;
      case 'rss':
        return <div className="w-5 h-5 bg-orange-500 rounded text-white text-xs flex items-center justify-center">R</div>;
      default:
        return <Globe className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (source: any) => {
    const isActive = source.is_active;
    const hasErrors = source.error_count > 0;
    
    if (!isActive) {
      return (
        <div className="flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
          <Pause className="w-3 h-3 mr-1" />
          Paused
        </div>
      );
    }
    
    if (hasErrors) {
      return (
        <div className="flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
          <AlertCircle className="w-3 h-3 mr-1" />
          Error
        </div>
      );
    }
    
    return (
      <div className="flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addSource(formData);
    
    if (result.success) {
      setShowAddSource(false);
      setFormData({
        source_name: '',
        source_type: '',
        source_url: '',
        scraping_frequency_minutes: 60,
        is_active: true
      });
    } else {
      alert(result.error);
    }
  };

  const handleToggleActive = async (source: any) => {
    await updateSource(source.id, { is_active: !source.is_active });
  };

  const handleDelete = async (sourceId: string) => {
    if (confirm('Are you sure you want to delete this source?')) {
      await deleteSource(sourceId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-96"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error Loading Sources</h3>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <button 
            onClick={refetch}
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Content Sources</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your scraping sources and configurations</p>
        </div>
        <button
          onClick={() => setShowAddSource(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Source</span>
        </button>
      </div>

      {/* Sources Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {sources.length === 0 ? (
          <div className="p-12 text-center">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No sources configured</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add your first scraping source to start collecting content from Wrocław.
            </p>
            <button
              onClick={() => setShowAddSource(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Add Source
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Scraped
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Success/Errors
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sources.map((source) => (
                  <tr key={source.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {getSourceIcon(source.source_type)}
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{source.source_name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{source.source_url}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {source.source_type.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(source)}
                      {source.error_count > 0 && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {source.error_count} error{source.error_count !== 1 ? 's' : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        <Clock className="w-4 h-4 mr-1 text-gray-400" />
                        {source.last_scraped_at ? 
                          format(new Date(source.last_scraped_at), 'MMM dd, HH:mm') : 
                          'Never'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {source.success_count} / {source.error_count}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">success / errors</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      Every {source.scraping_frequency_minutes} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleToggleActive(source)}
                          className={`${source.is_active ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'} dark:text-yellow-400 dark:hover:text-yellow-300`}
                        >
                          {source.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                          <Settings className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(source.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Source Modal */}
      {showAddSource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Source</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Source Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.source_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, source_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter source name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Source Type
                </label>
                <select 
                  required
                  value={formData.source_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, source_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select source type</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="twitter">Twitter</option>
                  <option value="tiktok">TikTok</option>
                  <option value="website">Website</option>
                  <option value="rss">RSS Feed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  required
                  value={formData.source_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, source_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Scraping Frequency (minutes)
                </label>
                <select 
                  value={formData.scraping_frequency_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, scraping_frequency_minutes: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value={15}>Every 15 minutes</option>
                  <option value={30}>Every 30 minutes</option>
                  <option value={60}>Every hour</option>
                  <option value={240}>Every 4 hours</option>
                  <option value={1440}>Daily</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddSource(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  Add Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SourceManager;