import React, { useEffect, useState } from 'react';
import { Activity, Users, FileText, Globe, TrendingUp, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useAnalytics, useScrapingLogs } from '../hooks/useSupabase';
import { format } from 'date-fns';

const Dashboard = () => {
  const { analytics, loading: analyticsLoading } = useAnalytics();
  const { logs, loading: logsLoading } = useScrapingLogs();

  // Calculate stats from real data
  const stats = [
    {
      label: 'Total Sources',
      value: analytics?.totalSources?.toString() || '0',
      change: '+0',
      icon: Globe,
      color: 'bg-blue-500',
    },
    {
      label: 'Content Scraped',
      value: analytics?.totalContent?.toString() || '0',
      change: '+0',
      icon: FileText,
      color: 'bg-green-500',
    },
    {
      label: 'Active Scrapers',
      value: analytics?.totalSources?.toString() || '0',
      change: '+0',
      icon: Activity,
      color: 'bg-orange-500',
    },
    {
      label: 'Success Rate',
      value: '0%',
      change: '+0%',
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ];

  // Mock data for charts (will be replaced with real data processing)
  const scrapingData = [
    { time: '00:00', events: 0, news: 0, business: 0 },
    { time: '04:00', events: 0, news: 0, business: 0 },
    { time: '08:00', events: 0, news: 0, business: 0 },
    { time: '12:00', events: 0, news: 0, business: 0 },
    { time: '16:00', events: 0, news: 0, business: 0 },
    { time: '20:00', events: 0, news: 0, business: 0 },
  ];

  // Process content by type from real data
  const sourceTypes = analytics?.contentByType ? 
    analytics.contentByType.reduce((acc: any[], item: any) => {
      const existing = acc.find(x => x.source === item.content_type);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ source: item.content_type, count: 1, color: '#3B82F6' });
      }
      return acc;
    }, []) : [];

  // Process recent activity from logs
  const recentActivity = logs?.slice(0, 4).map((log: any, index: number) => ({
    id: index + 1,
    action: log.status === 'completed' ? 'Scraping completed' : 
            log.status === 'failed' ? 'Scraping failed' : 'Scraping in progress',
    source: log.sources?.source_name || 'Unknown source',
    time: log.completed_at ? format(new Date(log.completed_at), 'HH:mm') + ' ago' : 'Running',
    status: log.status === 'completed' ? 'success' : 'error',
    details: log.status === 'completed' ? 
      `${log.items_processed || 0} items processed` : 
      log.error_message || 'Processing...',
  })) || [];

  if (analyticsLoading || logsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    {stat.change} from yesterday
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scraping Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content Scraping Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={scrapingData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="time" className="text-sm" />
              <YAxis className="text-sm" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Line type="monotone" dataKey="events" stroke="#F97316" strokeWidth={2} name="Events" />
              <Line type="monotone" dataKey="news" stroke="#3B82F6" strokeWidth={2} name="News" />
              <Line type="monotone" dataKey="business" stroke="#10B981" strokeWidth={2} name="Business" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Source Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content by Type</h3>
          {sourceTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceTypes}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                >
                  {sourceTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
              No content data available
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentActivity.length > 0 ? recentActivity.map((activity) => (
            <div key={activity.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.status === 'success' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                }`}>
                  {activity.status === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{activity.source}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{activity.details}</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4 mr-1" />
                    {activity.time}
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No recent activity found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;