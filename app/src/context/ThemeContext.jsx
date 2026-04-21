import { createContext, useContext, useEffect, useState } from 'react';
import { read, write } from '../utils/storage';

const ThemeContext = createContext(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => read('theme', 'dark'));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    write('theme', mode);
  }, [mode]);

  const toggle = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggle, isDark: mode === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}
