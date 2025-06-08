import React, { useState } from 'react';
import { Save, Database, Key, Globe, Bell, Shield, Trash2, Download, Upload } from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      systemName: 'CoTenWrocław',
      defaultLanguage: 'pl',
      timezone: 'Europe/Warsaw',
      maxConcurrentScrapers: 5,
      globalRateLimit: 2000,
      enableRealTimeUpdates: true,
    },
    database: {
      connectionString: 'postgresql://localhost:5432/cotenwroclaw',
      maxConnections: 20,
      backupFrequency: 'daily',
      retentionPeriod: 90,
      enableEncryption: true,
    },
    scraping: {
      defaultFrequency: 60,
      requestTimeout: 30000,
      retryAttempts: 3,
      respectRobotsTxt: true,
      enableProxyRotation: false,
      minDelayBetweenRequests: 1000,
    },
    notifications: {
      emailNotifications: true,
      errorAlerts: true,
      dailyReports: true,
      webhookUrl: '',
      slackChannel: '',
    },
    content: {
      enableDuplicateDetection: true,
      duplicateSimilarityThreshold: 85,
      autoCategorizationEnabled: true,
      contentExpiryDays: 30,
      enableImageScraping: true,
      maxImageUrls: 5,
    }
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'scraping', label: 'Scraping', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'content', label: 'Content', icon: Shield },
  ];

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const saveSettings = () => {
    // In a real app, this would save to Supabase
    console.log('Saving settings:', settings);
    // Show success notification
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cotenwroclaw-settings.json';
    link.click();
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setSettings(importedSettings);
        } catch (error) {
          console.error('Error importing settings:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            System Name
          </label>
          <input
            type="text"
            value={settings.general.systemName}
            onChange={(e) => handleSettingChange('general', 'systemName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Default Language
          </label>
          <select
            value={settings.general.defaultLanguage}
            onChange={(e) => handleSettingChange('general', 'defaultLanguage', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="pl">Polish</option>
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Timezone
          </label>
          <select
            value={settings.general.timezone}
            onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="Europe/Warsaw">Europe/Warsaw</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Max Concurrent Scrapers
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={settings.general.maxConcurrentScrapers}
            onChange={(e) => handleSettingChange('general', 'maxConcurrentScrapers', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Global Rate Limit (ms)
          </label>
          <input
            type="number"
            min="100"
            max="10000"
            value={settings.general.globalRateLimit}
            onChange={(e) => handleSettingChange('general', 'globalRateLimit', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="realTimeUpdates"
          checked={settings.general.enableRealTimeUpdates}
          onChange={(e) => handleSettingChange('general', 'enableRealTimeUpdates', e.target.checked)}
          className="mr-3 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
        />
        <label htmlFor="realTimeUpdates" className="text-sm text-gray-700 dark:text-gray-300">
          Enable real-time updates
        </label>
      </div>
    </div>
  );

  const renderDatabaseSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Connection String
          </label>
          <input
            type="password"
            value={settings.database.connectionString}
            onChange={(e) => handleSettingChange('database', 'connectionString', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Connections
            </label>
            <input
              type="number"
              min="5"
              max="100"
              value={settings.database.maxConnections}
              onChange={(e) => handleSettingChange('database', 'maxConnections', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Backup Frequency
            </label>
            <select
              value={settings.database.backupFrequency}
              onChange={(e) => handleSettingChange('database', 'backupFrequency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Retention Period (days)
            </label>
            <input
              type="number"
              min="7"
              max="365"
              value={settings.database.retentionPeriod}
              onChange={(e) => handleSettingChange('database', 'retentionPeriod', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableEncryption"
            checked={settings.database.enableEncryption}
            onChange={(e) => handleSettingChange('database', 'enableEncryption', e.target.checked)}
            className="mr-3 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
          />
          <label htmlFor="enableEncryption" className="text-sm text-gray-700 dark:text-gray-300">
            Enable database encryption
          </label>
        </div>
      </div>
    </div>
  );

  const renderScrapingSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Default Frequency (minutes)
          </label>
          <input
            type="number"
            min="5"
            max="1440"
            value={settings.scraping.defaultFrequency}
            onChange={(e) => handleSettingChange('scraping', 'defaultFrequency', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Request Timeout (ms)
          </label>
          <input
            type="number"
            min="5000"
            max="120000"
            value={settings.scraping.requestTimeout}
            onChange={(e) => handleSettingChange('scraping', 'requestTimeout', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Retry Attempts
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={settings.scraping.retryAttempts}
            onChange={(e) => handleSettingChange('scraping', 'retryAttempts', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Min Delay Between Requests (ms)
          </label>
          <input
            type="number"
            min="100"
            max="10000"
            value={settings.scraping.minDelayBetweenRequests}
            onChange={(e) => handleSettingChange('scraping', 'minDelayBetweenRequests', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="respectRobotsTxt"
            checked={settings.scraping.respectRobotsTxt}
            onChange={(e) => handleSettingChange('scraping', 'respectRobotsTxt', e.target.checked)}
            className="mr-3 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
          />
          <label htmlFor="respectRobotsTxt" className="text-sm text-gray-700 dark:text-gray-300">
            Respect robots.txt directives
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableProxyRotation"
            checked={settings.scraping.enableProxyRotation}
            onChange={(e) => handleSettingChange('scraping', 'enableProxyRotation', e.target.checked)}
            className="mr-3 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
          />
          <label htmlFor="enableProxyRotation" className="text-sm text-gray-700 dark:text-gray-300">
            Enable proxy rotation
          </label>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="emailNotifications"
            checked={settings.notifications.emailNotifications}
            onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
            className="mr-3 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
          />
          <label htmlFor="emailNotifications" className="text-sm text-gray-700 dark:text-gray-300">
            Enable email notifications
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="errorAlerts"
            checked={settings.notifications.errorAlerts}
            onChange={(e) => handleSettingChange('notifications', 'errorAlerts', e.target.checked)}
            className="mr-3 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
          />
          <label htmlFor="errorAlerts" className="text-sm text-gray-700 dark:text-gray-300">
            Send error alerts
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="dailyReports"
            checked={settings.notifications.dailyReports}
            onChange={(e) => handleSettingChange('notifications', 'dailyReports', e.target.checked)}
            className="mr-3 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
          />
          <label htmlFor="dailyReports" className="text-sm text-gray-700 dark:text-gray-300">
            Send daily reports
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Webhook URL
          </label>
          <input
            type="url"
            value={settings.notifications.webhookUrl}
            onChange={(e) => handleSettingChange('notifications', 'webhookUrl', e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Slack Channel
          </label>
          <input
            type="text"
            value={settings.notifications.slackChannel}
            onChange={(e) => handleSettingChange('notifications', 'slackChannel', e.target.value)}
            placeholder="#cotenwroclaw-alerts"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
    </div>
  );

  const renderContentSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Duplicate Similarity Threshold (%)
          </label>
          <input
            type="number"
            min="50"
            max="100"
            value={settings.content.duplicateSimilarityThreshold}
            onChange={(e) => handleSettingChange('content', 'duplicateSimilarityThreshold', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content Expiry (days)
          </label>
          <input
            type="number"
            min="1"
            max="365"
            value={settings.content.contentExpiryDays}
            onChange={(e) => handleSettingChange('content', 'contentExpiryDays', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Max Image URLs per Content
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={settings.content.maxImageUrls}
            onChange={(e) => handleSettingChange('content', 'maxImageUrls', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableDuplicateDetection"
            checked={settings.content.enableDuplicateDetection}
            onChange={(e) => handleSettingChange('content', 'enableDuplicateDetection', e.target.checked)}
            className="mr-3 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
          />
          <label htmlFor="enableDuplicateDetection" className="text-sm text-gray-700 dark:text-gray-300">
            Enable duplicate detection
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoCategorizationEnabled"
            checked={settings.content.autoCategorizationEnabled}
            onChange={(e) => handleSettingChange('content', 'autoCategorizationEnabled', e.target.checked)}
            className="mr-3 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
          />
          <label htmlFor="autoCategorizationEnabled" className="text-sm text-gray-700 dark:text-gray-300">
            Enable auto-categorization
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableImageScraping"
            checked={settings.content.enableImageScraping}
            onChange={(e) => handleSettingChange('content', 'enableImageScraping', e.target.checked)}
            className="mr-3 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
          />
          <label htmlFor="enableImageScraping" className="text-sm text-gray-700 dark:text-gray-300">
            Enable image URL scraping
          </label>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'database':
        return renderDatabaseSettings();
      case 'scraping':
        return renderScrapingSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'content':
        return renderContentSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure your CoTenWrocław scraping system
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import</span>
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              className="hidden"
            />
          </label>
          <button
            onClick={exportSettings}
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={saveSettings}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <nav className="space-y-1 p-4">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              {tabs.find(tab => tab.id === activeTab)?.label} Settings
            </h3>
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-800">
        <div className="p-6 border-b border-red-200 dark:border-red-800">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            These actions are permanent and cannot be undone.
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Clear All Content</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Remove all scraped content from the database
                </p>
              </div>
              <button className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
                <span>Clear Content</span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Reset All Settings</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Reset all configuration to default values
                </p>
              </div>
              <button className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
                <span>Reset Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;