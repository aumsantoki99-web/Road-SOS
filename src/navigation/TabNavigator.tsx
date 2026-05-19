/**
 * TabNavigator — Bottom Tab Navigation
 *
 * Renders the 5 main tabs: Home, Ride, Contacts, Hospitals, Settings.
 * Uses CustomTabBar instead of the default React Navigation tab bar.
 *
 * Screen components are stub shells at this stage.
 * Each screen is fully implemented in its own feature branch.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import type { TabParamList } from './types';
import { CustomTabBar } from './CustomTabBar';
import { useTranslation } from '../context/LocalizationContext';

// ── Screen imports (stubs — fleshed out in later branches) ────────────────────
import { HomeScreen } from '../screens/Home/HomeScreen';
import { RideMonitoringScreen } from '../screens/RideMonitoring/RideMonitoringScreen';
import { EmergencyContactsScreen } from '../screens/EmergencyContacts/EmergencyContactsScreen';
import { NearbyHospitalsScreen } from '../screens/NearbyHospitals/NearbyHospitalsScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        // All headers handled per-screen via AppHeader component
        headerShown: false,
      }}
      initialRouteName="Home"
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: t('tabs.home'),
        }}
      />
      <Tab.Screen
        name="Ride"
        component={RideMonitoringScreen}
        options={{
          title: t('tabs.ride'),
        }}
      />
      <Tab.Screen
        name="Contacts"
        component={EmergencyContactsScreen}
        options={{
          title: t('tabs.contacts'),
        }}
      />
      <Tab.Screen
        name="Hospitals"
        component={NearbyHospitalsScreen}
        options={{
          title: t('tabs.hospitals'),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('tabs.settings'),
        }}
      />
    </Tab.Navigator>
  );
}
