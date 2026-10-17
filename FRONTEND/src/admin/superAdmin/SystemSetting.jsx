import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import axiosInstance from '../../utils/axiosInstance';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function SystemSetting() {
  const toast = useToast();
  const { refreshSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'limits', 'security'
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const defaultSettingsState = {
    siteName: "Bharath Marriage",
    supportEmail: "support@bharathmarriage.com",
    contactPhone: "+91 98450 12345",
    copyright: "© 2026 Bharath Marriage. All rights reserved.",
    minBrideAge: 18,
    minGroomAge: 21,
    maxPhotos: 5,
    autoVerifyProfiles: false,
    sessionExpiry: 60, // minutes
    enableCaptcha: true,
    maintenanceMode: false
  };
  
  // Settings States
  const [settings, setSettings] = useState(defaultSettingsState);
  const [initialSettings, setInitialSettings] = useState(defaultSettingsState);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/admin/settings');
        if (response.data && response.data.settings) {
          const mergedSettings = {
            ...defaultSettingsState,
            ...response.data.settings
          };
          setSettings(mergedSettings);
          setInitialSettings(mergedSettings);
        }
      } catch (error) {
        console.error('Error loading system settings:', error);
        toast.error('Failed to load system settings from server.');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const brideAgeNum = parseInt(settings.minBrideAge, 10);
    const groomAgeNum = parseInt(settings.minGroomAge, 10);

    if (isNaN(brideAgeNum) || brideAgeNum < 18) {
      toast.error('Minimum age limit for Bride cannot be less than 18 years.');
      return;
    }

    if (isNaN(groomAgeNum) || groomAgeNum < 18) {
      toast.error('Minimum age limit for Groom cannot be less than 18 years.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...settings,
        minBrideAge: brideAgeNum,
        minGroomAge: groomAgeNum,
        maxPhotos: parseInt(settings.maxPhotos, 10) || 5,
        sessionExpiry: parseInt(settings.sessionExpiry, 10) || 60
      };

      const response = await axiosInstance.put('/admin/settings', payload);
      if (response.data && response.data.settings) {
        const mergedSettings = {
          ...defaultSettingsState,
          ...response.data.settings
        };
        setSettings(mergedSettings);
        setInitialSettings(mergedSettings);
      }
      refreshSettings();
      toast.success(response.data?.message || "Website configurations and settings saved successfully!");
    } catch (error) {
      console.error('Error saving system settings:', error);
      toast.error(error.response?.data?.error || "Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  if (loading) {
    return (
      <div className="py-12 flex justify-center items-center">
        <LoadingSpinner text="Loading system settings..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header section */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon"></span>
          System Settings
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure global site metadata, registration age limits, and platform security flags.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 text-xs font-bold text-slate-500 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`pb-2 transition-colors cursor-pointer ${
            activeTab === 'general'
              ? 'border-b-2 border-deep-maroon text-deep-maroon'
              : 'hover:text-slate-700'
          }`}
        >
          General Settings
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('limits')}
          className={`pb-2 transition-colors cursor-pointer ${
            activeTab === 'limits'
              ? 'border-b-2 border-deep-maroon text-deep-maroon'
              : 'hover:text-slate-700'
          }`}
        >
          Matrimonial Limits
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`pb-2 transition-colors cursor-pointer ${
            activeTab === 'security'
              ? 'border-b-2 border-deep-maroon text-deep-maroon'
              : 'hover:text-slate-700'
          }`}
        >
          Security & Maintenance
        </button>
      </div>

      {/* Settings Form Body */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-slate-450 font-bold">Website Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => handleChange('siteName', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 font-medium bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-450 font-bold">Support Email</label>
                  <input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => handleChange('supportEmail', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 font-medium bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-450 font-bold">Contact Phone</label>
                  <input
                    type="text"
                    value={settings.contactPhone}
                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 font-medium bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-slate-450 font-bold">Footer Copyright Notice</label>
                <input
                  type="text"
                  value={settings.copyright}
                  onChange={(e) => handleChange('copyright', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 font-medium bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* Limits Tab */}
          {activeTab === 'limits' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase text-slate-500 font-bold">Min Age Limit (Bride)</label>
                    <span className="text-[9.5px] font-semibold text-slate-400">Min. 18 years</span>
                  </div>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={settings.minBrideAge}
                    onChange={(e) => handleChange('minBrideAge', e.target.value)}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (isNaN(val) || val < 18) {
                        handleChange('minBrideAge', 18);
                      }
                    }}
                    className={`w-full border rounded-lg p-2 font-medium bg-slate-50/50 focus:outline-none focus:bg-white transition-colors ${
                      settings.minBrideAge !== '' && parseInt(settings.minBrideAge, 10) < 18
                        ? 'border-rose-400 focus:ring-1 focus:ring-rose-400 text-rose-700 bg-rose-50/20'
                        : 'border-slate-200 focus:ring-1 focus:ring-deep-maroon'
                    }`}
                  />
                  {settings.minBrideAge !== '' && parseInt(settings.minBrideAge, 10) < 18 && (
                    <p className="text-[10px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      Bride minimum age cannot be less than 18 years
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase text-slate-500 font-bold">Min Age Limit (Groom)</label>
                    <span className="text-[9.5px] font-semibold text-slate-400">Min. 18 years</span>
                  </div>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={settings.minGroomAge}
                    onChange={(e) => handleChange('minGroomAge', e.target.value)}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (isNaN(val) || val < 18) {
                        handleChange('minGroomAge', 21);
                      }
                    }}
                    className={`w-full border rounded-lg p-2 font-medium bg-slate-50/50 focus:outline-none focus:bg-white transition-colors ${
                      settings.minGroomAge !== '' && parseInt(settings.minGroomAge, 10) < 18
                        ? 'border-rose-400 focus:ring-1 focus:ring-rose-400 text-rose-700 bg-rose-50/20'
                        : 'border-slate-200 focus:ring-1 focus:ring-deep-maroon'
                    }`}
                  />
                  {settings.minGroomAge !== '' && parseInt(settings.minGroomAge, 10) < 18 && (
                    <p className="text-[10px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      Groom minimum age cannot be less than 18 years
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-slate-500 font-bold">Max Photos Upload Limit</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.maxPhotos}
                  onChange={(e) => handleChange('maxPhotos', e.target.value)}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (isNaN(val) || val < 1) {
                      handleChange('maxPhotos', 4);
                    }
                  }}
                  className="w-full border border-slate-200 rounded-lg p-2 font-medium bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:bg-white"
                />
              </div>

              {/* Automatic Profile verification Toggle Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <div>
                  <span className="font-bold text-slate-700 block">Auto-Verify Profiles</span>
                  <span className="text-[10px] text-slate-400 font-medium">Verify profiles automatically upon email verification.</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('autoVerifyProfiles', !settings.autoVerifyProfiles)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    settings.autoVerifyProfiles ? 'bg-deep-maroon' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.autoVerifyProfiles ? 'translate-x-5' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>
            </div>
          )}

          {/* Security & Maintenance Tab */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-slate-455 font-bold">Session Expiry (Minutes)</label>
                <input
                  type="number"
                  value={settings.sessionExpiry}
                  onChange={(e) => handleChange('sessionExpiry', parseInt(e.target.value) || 60)}
                  className="w-full border border-slate-200 rounded-lg p-2 font-medium bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-deep-maroon focus:bg-white"
                />
              </div>



              {/* Maintenance Mode */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-rose-100 bg-rose-50/20">
                <div>
                  <span className="font-bold text-rose-800 block">Website Maintenance Mode</span>
                  <span className="text-[10px] text-slate-400 font-medium">Temporarily disable front-end user access.</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('maintenanceMode', !settings.maintenanceMode)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    settings.maintenanceMode ? 'bg-rose-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving || !hasChanges}
              className={`px-5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-md ${
                isSaving || !hasChanges
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
                  : 'bg-deep-maroon hover:bg-primary text-white cursor-pointer active:scale-95'
              }`}
            >
              <span className={`material-symbols-outlined text-sm ${isSaving ? 'animate-spin' : ''}`}>
                {isSaving ? 'refresh' : 'save'}
              </span>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
