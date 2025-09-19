// BEGIN FILE: src/theme.js
import React, { createContext, useContext, useMemo, useState } from 'react';

export const darkTheme = {
  name: 'dark',
  colors: {
    bg: '#0B0F14',
    card: '#141A22',
    text: '#E6EEF8',
    subtext: '#9FB3C8',
    primary: '#4CC9F0',
    danger: '#FF6B6B',
    success: '#2CEAA3',
    border: '#243040',
    shadow: 'rgba(0,0,0,0.30)',
    timer: '#FFFFFF',      // chrono très lisible en dark
  },
  radius: { sm: 8, md: 16, lg: 24, xl: 32 },
  spacing: (n) => n * 8,
  font: { title: 28, h1: 24, h2: 20, body: 16, small: 14 },
};

export const lightTheme = {
  name: 'light',
  colors: {
    bg: '#FFFFFF',         // FOND BIEN CLAIR (plus de gris sombre)
    card: '#FFFFFF',
    text: '#0B0F14',       // texte très foncé
    subtext: '#475569',    // gris lisible
    primary: '#0EA5E9',    // bleu accent
    danger: '#DC2626',
    success: '#16A34A',
    border: '#E6EDF5',
    shadow: 'rgba(0,0,0,0.08)',
    timer: '#0B0F14',      // chrono noir profond en light
  },
  radius: darkTheme.radius,
  spacing: darkTheme.spacing,
  font: darkTheme.font,
};



// Compat héritée : si des composants importent encore { theme }
export const theme = darkTheme;

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('dark'); // 'dark' | 'light'
  const value = useMemo(() => {
    const t = mode === 'dark' ? darkTheme : lightTheme;
    return {
      theme: t,
      isDark: mode === 'dark',
      setIsDark: (v) => setMode(v ? 'dark' : 'light'),
      mode,
      setMode,
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  // fallback safe si jamais pas de provider (évite crash)
  return useContext(ThemeContext) || {
    theme: darkTheme,
    isDark: true,
    setIsDark: () => {},
    mode: 'dark',
    setMode: () => {},
  };
}

export default theme;
// END FILE
