import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '@/constants';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch (e) {
      console.warn('Failed to parse saved settings, resetting:', e);
      return DEFAULT_SETTINGS;
    }
  });

  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((newSettings) => {
    setSettings(newSettings);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, settingsRef, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
