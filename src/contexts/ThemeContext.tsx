import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';

// 타입을 정의합니다.
type ThemeMode = 'dark' | 'light';
type ThemeStyle = 'vibrant' | 'minimal';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  toggleThemeMode: () => void;
  themeStyle: ThemeStyle;
  setThemeStyle: (style: ThemeStyle) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [themeStyle, setThemeStyle] = useState<ThemeStyle>('vibrant');
  
  // 테마가 변경될 때마다 <html> 태그에 data-* 속성을 적용합니다.
  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-theme-mode', themeMode);
    root.setAttribute('data-theme-style', themeStyle);
  }, [themeMode, themeStyle]);

  const toggleThemeMode = () => {
    setThemeMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const value = {
    themeMode,
    isDarkMode: themeMode === 'dark',
    toggleThemeMode,
    themeStyle,
    setThemeStyle,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
