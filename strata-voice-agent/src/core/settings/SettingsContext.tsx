/**
 * Settings Context
 * Provides app-wide settings with persistence
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { AppSettings, DEFAULT_SETTINGS } from '../types';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_KEY = 'strata_voice_settings';
const SECURE_KEYS = ['n8nMcpToken', 'cfClientId', 'cfClientSecret', 'openWebUiToken'];

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load non-sensitive settings from AsyncStorage
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      let loadedSettings = stored ? JSON.parse(stored) : {};

      // Load sensitive settings from SecureStore
      for (const key of SECURE_KEYS) {
        const value = await SecureStore.getItemAsync(key);
        if (value) {
          loadedSettings[key] = value;
        }
      }

      setSettings({ ...DEFAULT_SETTINGS, ...loadedSettings });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    try {
      // Separate sensitive and non-sensitive data
      const secureUpdates: Record<string, string> = {};
      const regularUpdates: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(newSettings)) {
        if (SECURE_KEYS.includes(key)) {
          secureUpdates[key] = value as string;
        } else {
          regularUpdates[key] = value;
        }
      }

      // Save non-sensitive to AsyncStorage
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(regularUpdates));

      // Save sensitive to SecureStore
      for (const [key, value] of Object.entries(secureUpdates)) {
        if (value) {
          await SecureStore.setItemAsync(key, value);
        } else {
          await SecureStore.deleteItemAsync(key);
        }
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
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
