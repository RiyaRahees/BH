import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';

const defaultSettings = {
  siteName: "Bharath Marriage",
  supportEmail: "support@bharathmarriage.com",
  contactPhone: "+91 98450 12345",
  copyright: "© 2026 Bharath Marriage. All rights reserved.",
  minBrideAge: 18,
  minGroomAge: 21,
  maxPhotos: 5,
  autoVerifyProfiles: false,
  sessionExpiry: 60,
  enableCaptcha: true,
  maintenanceMode: false
};

const SettingsContext = createContext({
  settings: defaultSettings,
  loadingSettings: true,
  refreshSettings: () => {}
});

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const fetchPublicSettings = async () => {
    try {
      const response = await axiosInstance.get('/public/settings');
      if (response.data && response.data.settings) {
        setSettings(response.data.settings);
        if (response.data.settings.siteName) {
          document.title = response.data.settings.siteName;
        }
      }
    } catch (error) {
      console.error('Error fetching public system settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchPublicSettings();

    // 1. Polling interval every 5 seconds for real-time maintenance mode detection
    const interval = setInterval(() => {
      fetchPublicSettings();
    }, 5000);

    // 2. Immediate re-check whenever window gets focus
    const handleFocus = () => {
      fetchPublicSettings();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loadingSettings, refreshSettings: fetchPublicSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
