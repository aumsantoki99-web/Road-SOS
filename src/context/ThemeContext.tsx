/**
 * RideSafe ThemeContext
 *
 * Modes:
 *   'light'   → Force light theme
 *   'dark'    → Force dark theme
 *   'system'  → Follow device preference
 *   'auto'    → Follow device + auto-switch to NIGHT mode after sunset.
 *               High-contrast red-and-black palette. Reduces glare while
 *               riding at night. Communicates real-world usage thinking.
 *
 * Auto Time-Switch:
 *   When themeMode === 'auto', checks clock every minute.
 *   19:00–06:00 → nightColors (red-and-black high contrast)
 *   Otherwise   → follows system dark/light preference
 *
 *   TODO (feature/settings-screen): expose 'auto' in theme picker UI.
 *   TODO (feature/settings-screen): wire to expo-location for GPS-accurate
 *   sunset times (SunCalc). Currently uses fixed 19:00–06:00 window.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { darkColors, lightColors, nightColors, type ColorTokens } from '../theme/colors';
import type { ThemeMode } from '../types';

const THEME_STORAGE_KEY = '@ridesafe/theme_mode';
const NIGHT_START_HOUR = 19;
const NIGHT_END_HOUR   = 6;

function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
}

interface ThemeContextValue {
  colors: ColorTokens;
  isDark: boolean;
  /** True when the night (red-and-black) palette is active post-sunset */
  isNight: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isThemeLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isThemeLoading, setIsThemeLoading] = useState(true);
  const [nightActive, setNightActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load persisted preference
  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system' || stored === 'auto') {
          setThemeModeState(stored);
        }
      } catch {
        console.warn('[ThemeContext] Could not load persisted theme');
      } finally {
        setIsThemeLoading(false);
      }
    }
    void load();
  }, []);

  // Auto time-switch — poll every minute when mode === 'auto'
  useEffect(() => {
    if (themeMode !== 'auto') {
      setNightActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setNightActive(isNightTime());
    timerRef.current = setInterval(() => {
      setNightActive(isNightTime());
    }, 60_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [themeMode]);

  const resolvedIsDark =
    themeMode === 'system' || themeMode === 'auto'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  const isNight = themeMode === 'auto' && nightActive;

  const colors: ColorTokens = isNight
    ? nightColors
    : resolvedIsDark
    ? darkColors
    : lightColors;

  const setThemeMode = useCallback(async (mode: ThemeMode): Promise<void> => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      console.warn('[ThemeContext] Could not persist theme preference');
    }
  }, []);

  return (
    <ThemeContext.Provider value={{
      colors,
      isDark: resolvedIsDark || isNight,
      isNight,
      themeMode,
      setThemeMode,
      isThemeLoading,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme — access active color tokens and theme controls.
 *
 * @example
 * const { colors, isDark, isNight } = useTheme();
 * // isNight === true after 19:00 in 'auto' mode
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider.');
  return context;
}
