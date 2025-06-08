import React, { useState } from 'react';
import { TrendingUp, Users, FileText, Clock, Award, MapPin, Filter, Calendar } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('content');

  // Mock data for analytics
  const dailyMetrics = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    return {
      date: format(date, 'yyyy-MM-dd'),
      content: Math.floor(Math.random() * 50) + 20,
      sources: Math.floor(Math.random() * 8) + 15,
      engagement: Math.floor(Math.random() * 30) + 60,
      errors: Math.floor(Math.random() * 5),
    };
  });

  const contentTypeData = [
    { type: 'Events', count: 145, color: '#F97316', growth: '+12%' },
    { type: 'Local News', count: 89, color: '#3B82F6', growth: '+8%' },
    { type: 'Business Updates', count: 67, color: '#10B981', growth: '+23%' },
    { type: 'Community Activities', count: 34, color: '#8B5CF6', growth: '+15%' },
  ];

  const locationData = [
    { district: 'Stare Miasto', count: 78, percentage: 23.4 },
    { district: 'Krzyki', count: 45, percentage: 13.5 },
    { district: 'Fabryczna', count: 42, percentage: 12.6 },
    { district: 'Śródmieście', count: 38, percentage: 11.4 },
    { district: 'Psie Pole', count: 35, percentage: 10.5 },
    { district: 'Nadodrze', count: 32, percentage: 9.6 },
    { district: 'Other', count: 63, percentage: 18.9 },
  ];

  const sourcePerformance = [
    { source: 'Facebook Groups', scraped: 245, success: 234, errors: 11, rate: 95.5 },
    { source: 'Instagram', scraped: 189, success: 176, errors: 13, rate: 93.1 },
    { source: 'wroclaw.pl', scraped: 156, success: 151, errors: 5, rate: 96.8 },
    { source: 'Local News Sites', scraped: 123, success: 115, errors: 8, rate: 93.5 },
    { source: 'RSS Feeds', scraped: 89, success: 87, errors: 2, rate: 97.8 },
  ];

  const engagementTrends = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    events: Math.floor(Math.random() * 40) + 10,
    news: Math.floor(Math.random() * 30) + 5,
    business: Math.floor(Math.random() * 25) + 3,
  }));

  const topKeywords = [
    { keyword: 'festiwal', count: 45, trend: 'up' },
    { keyword: 'koncert', count: 38, trend: 'up' },
    { keyword: 'restauracja', count: 34, trend: 'stable' },
    { keyword: 'park', count: 29, trend: 'down' },
    { keyword: 'galeria', count: 26, trend: 'up' },
    { keyword: 'warsztaty', count: 23, trend: 'up' },
    { keyword: 'sport', count: 21, trend: 'stable' },
    { keyword: 'kultura', count: 19, trend: 'up' },
  ];

  const getTimeRangeData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return dailyMetrics.slice(-days);
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (trend === 'down') return <TrendingUp className="w-3 h-3 text-red-500 transform rotate-180" />;
    return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Content scraping performance and insights
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Content</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">1,247</p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">+89 this week</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Daily Scraped</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">43</p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">+12% from last week</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">94.2%</p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">+1.2% improvement</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">2.3s</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">+0.1s slower</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Scraping Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content Scraping Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={getTimeRangeData()}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                className="text-sm"
              />
              <YAxis className="text-sm" />
              <Tooltip 
                labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Area type="monotone" dataKey="content" stroke="#F97316" fill="#F97316" fillOpacity={0.3} name="Content Scraped" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Content Types Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={contentTypeData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                label={({ type, count }) => `${type}: ${count}`}
              >
                {contentTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content by District</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={locationData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" className="text-sm" />
              <YAxis dataKey="district" type="category" width={80} className="text-sm" />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hourly Activity Pattern</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={engagementTrends}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="hour" tickFormatter={(value) => `${value}:00`} className="text-sm" />
              <YAxis className="text-sm" />
              <Tooltip labelFormatter={(value) => `${value}:00`} />
              <Line type="monotone" dataKey="events" stroke="#F97316" strokeWidth={2} name="Events" />
              <Line type="monotone" dataKey="news" stroke="#3B82F6" strokeWidth={2} name="News" />
              <Line type="monotone" dataKey="business" stroke="#10B981" strokeWidth={2} name="Business" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Source Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Success Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sourcePerformance.map((source, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{source.source}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{source.scraped} total</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${source.rate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{source.rate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        source.errors <= 5 ? 'bg-green-100 text-green-800' : 
                        source.errors <= 10 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {source.errors}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Keywords */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trending Keywords</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topKeywords.map((keyword, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">#{keyword.keyword}</span>
                    {getTrendIcon(keyword.trend)}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{keyword.count} mentions</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;