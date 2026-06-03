/**
 * Navigation Type Definitions — feature/navigation-system
 *
 * All route param lists live here. Fully typed. No `any`.
 *
 * Teammates: When adding a new screen:
 *   1. Add it to the correct param list below
 *   2. Register it in AppNavigator.tsx or TabNavigator.tsx
 *   3. Create the screen file in src/screens/
 */

import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp, RouteProp, NavigatorScreenParams } from '@react-navigation/native';

// ─── Tab Navigator Param List ─────────────────────────────────────────────────

export type TabParamList = {
  Home: undefined;
  Ride: undefined;
  Contacts: undefined;
  Hospitals: undefined;
  Settings: undefined;
};

// ─── Root Stack Navigator Param List ─────────────────────────────────────────

export type RootStackParamList = {
  /** Auth: login / signup */
  Auth: undefined;

  /** Main tab layout — houses all 5 tab screens */
  MainTabs: NavigatorScreenParams<TabParamList> | undefined;

  /** Modal: Offline mode status and queue */
  OfflineMode: undefined;

  /** Modal: Add a new emergency contact */
  AddContact: undefined;

  /** Modal: Edit an existing contact by ID */
  EditContact: { contactId: string };

  /** Modal: Hospital detail view */
  HospitalDetail: { hospitalId: string };

  /** Modal: Past ride history list */
  RideHistory: undefined;

  /** Modal: SOS confirmation / countdown screen */
  SOSConfirmation: undefined;

  /** Modal: In-app emergency turn-by-turn navigation */
  InAppNavigation: { hospitalId: string };


  /** Screen: User Profile view */
  Profile: undefined;

  /** Teammate SOS integration routes */
  CrashCountdown: { event: import('../services/crashDetection.service').CrashEvent };
  DeadManSwitch: { event: import('../services/crashDetection.service').CrashEvent };
  SosTriggered: { event: import('../services/crashDetection.service').CrashEvent; sosMessage?: string };

  /** Convoy Mode */
  ConvoySetup: undefined;

  /** Legal Screens */
  PrivacyPolicy: undefined;
  TermsConditions: undefined;

  // ── Future auth flow (uncomment when auth branch begins) ──────────────────
  // Onboarding: undefined;
  // Login: undefined;
  // Register: { referralCode?: string };
};

// ─── Composed Navigation Props ────────────────────────────────────────────────
// Use these in screen components for full type-safety across both navigators.

/** Navigation prop for screens inside the tab navigator */
export type TabScreenNavigationProp<T extends keyof TabParamList> = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, T>,
  NativeStackNavigationProp<RootStackParamList>
>;

/** Route prop for screens inside the tab navigator */
export type TabScreenRouteProp<T extends keyof TabParamList> = RouteProp<TabParamList, T>;

/** Navigation prop for screens inside the root stack */
export type RootScreenNavigationProp<T extends keyof RootStackParamList> =
  NativeStackNavigationProp<RootStackParamList, T>;

/** Route prop for screens inside the root stack */
export type RootScreenRouteProp<T extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  T
>;

// ─── Screen Props bundles ─────────────────────────────────────────────────────
// Import these in screen components instead of assembling manually.

export type HomeScreenProps = {
  navigation: TabScreenNavigationProp<'Home'>;
  route: TabScreenRouteProp<'Home'>;
};

export type RideScreenProps = {
  navigation: TabScreenNavigationProp<'Ride'>;
  route: TabScreenRouteProp<'Ride'>;
};

export type ContactsScreenProps = {
  navigation: TabScreenNavigationProp<'Contacts'>;
  route: TabScreenRouteProp<'Contacts'>;
};

export type HospitalsScreenProps = {
  navigation: TabScreenNavigationProp<'Hospitals'>;
  route: TabScreenRouteProp<'Hospitals'>;
};

export type SettingsScreenProps = {
  navigation: TabScreenNavigationProp<'Settings'>;
  route: TabScreenRouteProp<'Settings'>;
};

export type EditContactScreenProps = {
  navigation: RootScreenNavigationProp<'EditContact'>;
  route: RootScreenRouteProp<'EditContact'>;
};

export type HospitalDetailScreenProps = {
  navigation: RootScreenNavigationProp<'HospitalDetail'>;
  route: RootScreenRouteProp<'HospitalDetail'>;
};

export type InAppNavigationScreenProps = {
  navigation: RootScreenNavigationProp<'InAppNavigation'>;
  route: RootScreenRouteProp<'InAppNavigation'>;
};

