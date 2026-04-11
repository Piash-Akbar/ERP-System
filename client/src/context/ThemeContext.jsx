import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getPublicSettings } from '../services/setting.service';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

const COLOR_PRESETS = {
  orange: { 50: '#fff7ed', 100: '#ffedd5', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c' },
  blue: { 50: '#eff6ff', 100: '#dbeafe', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
  green: { 50: '#f0fdf4', 100: '#dcfce7', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d' },
  purple: { 50: '#faf5ff', 100: '#f3e8ff', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce' },
  red: { 50: '#fef2f2', 100: '#fee2e2', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' },
  teal: { 50: '#f0fdfa', 100: '#ccfbf1', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e' },
  indigo: { 50: '#eef2ff', 100: '#e0e7ff', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca' },
  pink: { 50: '#fdf2f8', 100: '#fce7f3', 400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d' },
};

const applyColorToDOM = (colorName) => {
  const palette = COLOR_PRESETS[colorName] || COLOR_PRESETS.orange;
  const root = document.documentElement;
  root.style.setProperty('--primary-50', palette[50]);
  root.style.setProperty('--primary-100', palette[100]);
  root.style.setProperty('--primary-400', palette[400]);
  root.style.setProperty('--primary-500', palette[500]);
  root.style.setProperty('--primary-600', palette[600]);
  root.style.setProperty('--primary-700', palette[700]);
};

const applyDarkModeToDOM = (isDark) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export const ThemeProvider = ({ children }) => {
  const [companyName, setCompanyName] = useState('Annex Leather');
  const [companyLogo, setCompanyLogo] = useState('');
  const [appColor, setAppColor] = useState('orange');
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const { data } = await getPublicSettings();
      if (data.success) {
        const s = data.data;
        if (s.company_name) setCompanyName(s.company_name);
        if (s.company_logo) setCompanyLogo(s.company_logo);
        if (s.app_color) {
          setAppColor(s.app_color);
          applyColorToDOM(s.app_color);
        }
        if (s.dark_mode !== undefined) {
          const isDark = s.dark_mode === true || s.dark_mode === 'true';
          setDarkMode(isDark);
          applyDarkModeToDOM(isDark);
        }
      }
    } catch {
      // Use defaults on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateColor = (colorName) => {
    setAppColor(colorName);
    applyColorToDOM(colorName);
  };

  const toggleDarkMode = (isDark) => {
    setDarkMode(isDark);
    applyDarkModeToDOM(isDark);
  };

  return (
    <ThemeContext.Provider
      value={{
        companyName,
        setCompanyName,
        companyLogo,
        setCompanyLogo,
        appColor,
        updateColor,
        darkMode,
        toggleDarkMode,
        loadSettings,
        loading,
        COLOR_PRESETS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
