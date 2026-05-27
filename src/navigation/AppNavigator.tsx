/**
 * AppNavigator — Root Stack Navigator
 *
 * The top-level navigator that wraps everything.
 *
 * Structure:
 *   RootStack
 *   ├── MainTabs          → TabNavigator (all 5 tabs)
 *   ├── AddContact        → Modal (slides up over tabs)
 *   ├── EditContact       → Modal (slides up over tabs)
 *   ├── HospitalDetail    → Modal (slides up over tabs)
 *   ├── RideHistory       → Modal (slides up over tabs)
 *   └── SOSConfirmation   → Modal (full-screen emergency overlay)
 *
 * Modal screens use 'transparentModal' presentation for the SOS screen
 * so the background stays visible during the countdown — intentional UX.
 *
 * Future: Auth flow slots in here before MainTabs when implemented.
 */

import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { RootStackParamList } from './types';
import { TabNavigator } from './TabNavigator';
import { useTheme } from '../context/ThemeContext';
import { STORAGE_KEYS } from '../constants';
import { StorageService } from '../storage/StorageService';
import { AuthScreen } from '../screens/Auth/AuthScreen';

// ── Modal screen imports ──────────────────────────────────────────────────────
// These are stub screens until their feature branches are built.
import { AddContactScreen } from '../screens/EmergencyContacts/AddContactScreen';
import { EditContactScreen } from '../screens/EmergencyContacts/EditContactScreen';
import { HospitalDetailScreen } from '../screens/NearbyHospitals/HospitalDetailScreen';
import { RideHistoryScreen } from '../screens/RideMonitoring/RideHistoryScreen';
import { SOSConfirmationScreen } from '../screens/Home/SOSConfirmationScreen';
import { OfflineModeScreen } from '../screens/OfflineMode/OfflineModeScreen';
import { InAppNavigationModal } from '../screens/RideMonitoring/InAppNavigationModal';
import { CrashCountdownScreen } from '../screens/SOS/CrashCountdownScreen';
import { DeadManSwitchScreen } from '../screens/SOS/DeadManSwitchScreen';
import { SosTriggeredScreen } from '../screens/SOS/SosTriggeredScreen';
import { MedicalIDScreen } from '../screens/Settings/MedicalIDScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface AuthSessionPayload {
  isLoggedIn: boolean;
}

export function AppNavigator(): React.JSX.Element {
  const { colors } = useTheme();
  const [authResolved, setAuthResolved] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadAuthState(): Promise<void> {
      try {
        const session = await StorageService.get<AuthSessionPayload>(STORAGE_KEYS.AUTH_SESSION);
        if (!mounted) return;
        setIsAuthenticated(Boolean(session.success && session.data?.isLoggedIn));
      } catch {
        if (mounted) setIsAuthenticated(false);
      } finally {
        if (mounted) setAuthResolved(true);
      }
    }

    void loadAuthState();
    return () => {
      mounted = false;
    };
  }, []);

  if (!authResolved) {
    return <View style={{ flex: 1, backgroundColor: colors.bgPrimary }} />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgPrimary },
        animation: 'slide_from_bottom',
        // Future auth: initialRouteName="Onboarding" when not onboarded
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen
          name="Auth"
          options={{ animation: 'none' }}
        >
          {() => <AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />}
        </Stack.Screen>
      ) : (
        <>
          {/* ── Main app (tab-based) ──────────────────────────────────────── */}
          <Stack.Screen
            name="MainTabs"
            component={TabNavigator}
            options={{ animation: 'none' }}
          />

          {/* ── Contact modals ────────────────────────────────────────────── */}
          <Stack.Screen
            name="AddContact"
            component={AddContactScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="EditContact"
            component={EditContactScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              headerShown: false,
            }}
          />

      {/* ── Hospital detail ───────────────────────────────────────────── */}
          <Stack.Screen
            name="HospitalDetail"
            component={HospitalDetailScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              headerShown: false,
            }}
          />

      {/* ── Emergency In-App Navigation ──────────────────────────────── */}
          <Stack.Screen
            name="InAppNavigation"
            component={InAppNavigationModal}
            options={{
              presentation: 'fullScreenModal',
              animation: 'fade',
              headerShown: false,
            }}
          />

      {/* ── Ride history ──────────────────────────────────────────────── */}
          <Stack.Screen
            name="RideHistory"
            component={RideHistoryScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              headerShown: false,
            }}
          />

      {/* ── SOS Confirmation — full-screen emergency overlay ─────────── */}
      {/* transparentModal keeps background visible for countdown urgency */}
          <Stack.Screen
            name="SOSConfirmation"
            component={SOSConfirmationScreen}
            options={{
              presentation: 'transparentModal',
              animation: 'fade',
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="MedicalID"
            component={MedicalIDScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              headerShown: false,
            }}
          />

      {/* ── Teammate SOS screens ─────────────────────────────────────── */}
          <Stack.Screen
            name="CrashCountdown"
            component={CrashCountdownScreen}
            options={{
              presentation: 'transparentModal',
              animation: 'fade',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="DeadManSwitch"
            component={DeadManSwitchScreen}
            options={{
              presentation: 'transparentModal',
              animation: 'fade',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="SosTriggered"
            component={SosTriggeredScreen}
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
              headerShown: false,
            }}
          />

      {/* ── Offline Mode ──────────────────────────────────────────────── */}
          <Stack.Screen
            name="OfflineMode"
            component={OfflineModeScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              headerShown: false,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

