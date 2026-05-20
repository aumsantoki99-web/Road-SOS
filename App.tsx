/**
 * App.tsx — RideSafe Root Component
 *
 * Provider tree (outermost → innermost):
 *   GestureHandlerRootView   [react-native-gesture-handler]
 *   SafeAreaProvider         [react-native-safe-area-context]
 *   ThemeProvider            [feature/theme-system]      ✅
 *   NetworkProvider          [feature/offline-mode]      ✅
 *   AppStateProvider         [feature/app-setup]         ✅
 *   NavigationContainer      [feature/navigation-system] ✅
 *     AppNavigator           [feature/navigation-system] ✅
 *
 * Teammates: Do NOT add screen logic here.
 * Add new providers by wrapping inside the provider tree below.
 */

import React, { useCallback, useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AppStateProvider } from './src/context/AppStateContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { LocalizationProvider } from './src/context/LocalizationContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAppFonts } from './src/theme/fonts';
import { StorageService } from './src/storage/StorageService';

SplashScreen.preventAutoHideAsync().catch(() => {});

// ─── Navigation theme — bridges RideSafe tokens to React Navigation ───────────

function useNavigationTheme(
  colors: ReturnType<typeof useTheme>['colors'],
  isDark: boolean,
) {
  return {
    dark: isDark,
    colors: {
      primary:      colors.accent,
      background:   colors.bgPrimary,
      card:         colors.bgSecondary,
      text:         colors.textPrimary,
      border:       colors.surfaceBorder,
      notification: colors.emergency,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' as const },
      medium:  { fontFamily: 'System', fontWeight: '500' as const },
      bold:    { fontFamily: 'System', fontWeight: '700' as const },
      heavy:   { fontFamily: 'System', fontWeight: '900' as const },
    },
  };
}

// ─── Inner App — rendered after ThemeProvider is mounted ──────────────────────

function AppInner(): React.JSX.Element | null {
  const { colors, isDark } = useTheme();
  const [appIsReady, setAppIsReady] = useState(false);
  const [fontsLoaded] = useAppFonts();
  const navigationTheme = useNavigationTheme(colors, isDark);

  useEffect(() => {
    async function prepare(): Promise<void> {
      try {
        if (!fontsLoaded) return;
        await StorageService.initialize();
        await new Promise<void>((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.warn('[App] Initialization error:', error);
      } finally {
        setAppIsReady(true);
      }
    }
    void prepare();
  }, [fontsLoaded]);

  const onLayoutRootView = useCallback(async (): Promise<void> => {
    if (appIsReady) await SplashScreen.hideAsync();
  }, [appIsReady]);

  if (!appIsReady || !fontsLoaded) return null;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      onLayout={onLayoutRootView}
    >
      <NavigationContainer theme={navigationTheme}>
        <AppNavigator />
      </NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LocalizationProvider>
            <NetworkProvider>
              <AppStateProvider>
                <AppInner />
              </AppStateProvider>
            </NetworkProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1 },
  container: { flex: 1 },
});
