/**
 * Navigation barrel export — feature/navigation-system ✅
 *
 * Usage:
 *   import { AppNavigator } from '@navigation/AppNavigator';
 *   import { useAppNavigation } from '@navigation/useAppNavigation';
 *   import type { RootStackParamList, TabParamList } from '@navigation/types';
 */

export { AppNavigator } from './AppNavigator';
export { TabNavigator } from './TabNavigator';
export { CustomTabBar } from './CustomTabBar';
export { useAppNavigation } from './useAppNavigation';
export type {
  RootStackParamList,
  TabParamList,
  HomeScreenProps,
  RideScreenProps,
  ContactsScreenProps,
  HospitalsScreenProps,
  SettingsScreenProps,
  EditContactScreenProps,
  HospitalDetailScreenProps,
} from './types';
