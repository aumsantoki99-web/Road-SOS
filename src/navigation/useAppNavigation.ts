/**
 * useAppNavigation — typed navigation hook
 *
 * A thin wrapper around React Navigation's useNavigation that
 * provides the full typed RootStackParamList automatically.
 *
 * Usage (any screen or component):
 *   const nav = useAppNavigation();
 *   nav.navigate('EditContact', { contactId: '123' }); // ✅ fully typed
 *   nav.navigate('EditContact', { typo: '123' });       // ❌ compile error
 *   nav.goBack();
 *
 * No need to import NativeStackNavigationProp everywhere.
 */

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

export type AppNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function useAppNavigation(): AppNavigationProp {
  return useNavigation<AppNavigationProp>();
}
