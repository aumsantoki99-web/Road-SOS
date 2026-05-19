/**
 * SettingsScreen — Modern Preference Centre
 * feature/ui-polish-settings ✅
 *
 * Enhancements:
 *   - Premium page header with user identity placeholder
 *   - Theme picker redesigned as visual cards with previews
 *   - Grouped sections use card containers with internal dividers
 *   - Crash sensitivity has a visual segmented control feel
 *   - Danger zone (reset) is isolated at the bottom, clearly separated
 *   - About section shows version info elegantly
 *   - Entrance animation on scroll content
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useAppState } from '../../context/AppStateContext';
import { useStorage } from '../../hooks/useStorage';
import { StorageService } from '../../storage/StorageService';

import { SettingRow } from '../../components/common/SettingRow';
import { CustomButton } from '../../components/common/CustomButton';

import { spacing, layout, radius, borderWidth } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { STORAGE_KEYS, APP_VERSION, DEFAULT_PREFERENCES } from '../../constants';
import type { ThemeMode, CrashSensitivity, UserPreferences } from '../../types';
import type { SettingsScreenProps } from '../../navigation/types';

// ─── Section wrapper ──────────────────────────────────────────────────────────

function SettingsSection({
  title,
  children,
  topSpacing = spacing[5],
}: {
  title: string;
  children: React.ReactNode;
  topSpacing?: number;
}): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: topSpacing }}>
      <Text style={[textStyles.labelCaps, { color: colors.textTertiary, marginBottom: spacing[3], paddingHorizontal: spacing[1] }]}>
        {title}
      </Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.surfacePrimary, borderColor: colors.surfaceBorder }, shadows.card]}>
        {children}
      </View>
    </View>
  );
}

// ─── Theme picker ─────────────────────────────────────────────────────────────

type ThemeOptionDef = {
  mode: ThemeMode;
  label: string;
  sublabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  previewBg: string;
  previewAccent: string;
};

const THEME_OPTIONS: ThemeOptionDef[] = [
  {
    mode: 'light',
    label: 'Light',
    sublabel: 'Clean & bright',
    icon: 'sunny-outline',
    previewBg: '#F8FAFC',
    previewAccent: '#F59E0B',
  },
  {
    mode: 'dark',
    label: 'Dark',
    sublabel: 'Easy on eyes',
    icon: 'moon-outline',
    previewBg: '#0F172A',
    previewAccent: '#FBBF24',
  },
  {
    mode: 'system',
    label: 'System',
    sublabel: 'Follows device',
    icon: 'phone-portrait-outline',
    previewBg: '#1E293B',
    previewAccent: '#94A3B8',
  },
  {
    mode: 'auto',
    label: 'Auto',
    sublabel: 'Night mode after 19:00',
    icon: 'time-outline',
    previewBg: '#0A0000',
    previewAccent: '#F87171',
  },
];

function ThemePicker(): React.JSX.Element {
  const { colors, themeMode, setThemeMode, isNight } = useTheme();

  return (
    <View>
      <View style={styles.themeGrid}>
        {THEME_OPTIONS.map((option) => {
          const isSelected = themeMode === option.mode;
          return (
            <TouchableOpacity
              key={option.mode}
              onPress={() => void setThemeMode(option.mode)}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.themeCard,
                {
                  backgroundColor: isSelected ? colors.accentSubtle : colors.surfaceSecondary,
                  borderColor: isSelected ? colors.accent : colors.surfaceBorder,
                },
              ]}
            >
              {/* Mini preview swatch */}
              <View style={[styles.themePreview, { backgroundColor: option.previewBg }]}>
                <View style={[styles.themePreviewAccent, { backgroundColor: option.previewAccent }]} />
                <View style={[styles.themePreviewLine, { backgroundColor: `${option.previewAccent}60` }]} />
                <View style={[styles.themePreviewLine, styles.themePreviewLineShort, { backgroundColor: `${option.previewAccent}30` }]} />
              </View>

              <Ionicons
                name={option.icon}
                size={16}
                color={isSelected ? colors.accent : colors.iconSecondary}
                style={{ marginTop: spacing[2] }}
              />
              <Text style={[textStyles.labelMedium, { color: isSelected ? colors.accent : colors.textPrimary, marginTop: spacing[1] }]}>
                {option.label}
              </Text>
              <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: 1, textAlign: 'center' }]}>
                {option.sublabel}
              </Text>

              {isSelected && (
                <View style={[styles.themeSelected, { backgroundColor: colors.accent }]}>
                  <Ionicons name="checkmark" size={9} color={colors.black} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Night mode active pill */}
      {isNight && (
        <View style={[styles.nightPill, { backgroundColor: '#1A0505', borderColor: '#3D0A0A' }]}>
          <Ionicons name="moon" size={13} color="#FF8080" />
          <Text style={[textStyles.caption, { color: '#FF8080', marginLeft: spacing[2] }]}>
            Night mode active · Red-black palette until 06:00
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Crash sensitivity segmented control ──────────────────────────────────────

function SensitivityControl({
  value,
  onChange,
}: {
  value: CrashSensitivity;
  onChange: (v: CrashSensitivity) => void;
}): React.JSX.Element {
  const { colors } = useTheme();

  const options: { value: CrashSensitivity; label: string; color: string }[] = [
    { value: 'low',    label: 'Low',    color: colors.safe },
    { value: 'medium', label: 'Medium', color: colors.accent },
    { value: 'high',   label: 'High',   color: colors.emergency },
  ];

  return (
    <View style={[styles.segmented, { backgroundColor: colors.surfaceSecondary, borderColor: colors.surfaceBorder }]}>
      {options.map((opt, i) => {
        const isSelected = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="radio"
            accessibilityLabel={`${opt.label} sensitivity`}
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.segmentedItem,
              i < options.length - 1 && { borderRightWidth: borderWidth.hairline, borderRightColor: colors.divider },
              isSelected && { backgroundColor: colors.bgElevated },
            ]}
          >
            <View style={[styles.segmentedDot, { backgroundColor: isSelected ? opt.color : colors.textTertiary }]} />
            <Text style={[textStyles.labelMedium, { color: isSelected ? opt.color : colors.textTertiary }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function SettingsScreen(_props: SettingsScreenProps): React.JSX.Element {
  const { colors } = useTheme();
  const { updatePreferences } = useAppState();
  const [isResetting, setResetting] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const { data: prefs, save: savePrefs } = useStorage<UserPreferences>(
    STORAGE_KEYS.PREFERENCES,
    DEFAULT_PREFERENCES,
  );

  async function updatePref<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
  ): Promise<void> {
    const updated = { ...prefs, [key]: value };
    await savePrefs(updated);
    updatePreferences({ [key]: value });
  }

  function handleReset(): void {
    Alert.alert(
      'Reset App Data',
      'This will delete all contacts, ride history, and preferences permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            await StorageService.clear();
            await savePrefs(DEFAULT_PREFERENCES);
            updatePreferences(DEFAULT_PREFERENCES);
            setResetting(false);
            Alert.alert('Done', 'All app data cleared.');
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={[textStyles.displaySmall, { color: colors.textPrimary }]}>Settings</Text>
        <View style={[styles.versionBadge, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={[textStyles.caption, { color: colors.textTertiary }]}>v{APP_VERSION}</Text>
        </View>
      </View>

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Appearance ────────────────────────────────────────────── */}
          <SettingsSection title="APPEARANCE" topSpacing={0}>
            <Text style={[textStyles.bodySmall, { color: colors.textTertiary, marginBottom: spacing[4] }]}>
              Auto mode activates a high-contrast red-black night palette after 19:00 to reduce glare while riding.
            </Text>
            <ThemePicker />
          </SettingsSection>

          {/* ── Safety ────────────────────────────────────────────────── */}
          <SettingsSection title="SAFETY">
            <Text style={[textStyles.labelMedium, { color: colors.textSecondary, marginBottom: spacing[3] }]}>
              Crash Detection Sensitivity
            </Text>
            <SensitivityControl
              value={prefs.crashSensitivity}
              onChange={(v) => void updatePref('crashSensitivity', v)}
            />
            <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: spacing[2], marginBottom: spacing[5] }]}>
              Higher sensitivity detects lighter impacts. Recommended: Medium.
            </Text>

            <View style={[styles.internalDivider, { backgroundColor: colors.divider }]} />

            <SettingRow
              label="SOS Auto-Send Delay"
              description="Seconds before alert sends automatically"
              icon="timer-outline"
              iconColor={colors.emergency}
              control="value"
              valueText="10 sec"
              onPress={() => Alert.alert('SOS Delay', 'Configurable delay coming in a future update.')}
              showDivider
            />
            <SettingRow
              label="Auto-Share Location"
              description="Include GPS coordinates in emergency alerts"
              icon="location-outline"
              iconColor={colors.safe}
              control="toggle"
              toggleValue={prefs.autoShareLocation}
              onToggle={(v) => void updatePref('autoShareLocation', v)}
              showDivider={false}
            />
          </SettingsSection>

          {/* ── Emergency preferences ─────────────────────────────────── */}
          <SettingsSection title="EMERGENCY">
            <SettingRow
              label="Ride Auto-Start"
              description="Begin monitoring automatically when motion is detected"
              icon="speedometer-outline"
              iconColor={colors.accent}
              control="toggle"
              toggleValue={prefs.rideAutoStart}
              onToggle={(v) => void updatePref('rideAutoStart', v)}
              showDivider
            />
            <SettingRow
              label="Offline Emergency Mode"
              description="Queue alerts locally when internet is unavailable"
              icon="cloud-offline-outline"
              iconColor={colors.info}
              control="toggle"
              toggleValue={prefs.offlineModeEnabled}
              onToggle={(v) => void updatePref('offlineModeEnabled', v)}
              showDivider={false}
            />
          </SettingsSection>

          {/* ── Notifications ─────────────────────────────────────────── */}
          <SettingsSection title="NOTIFICATIONS">
            <SettingRow
              label="Push Notifications"
              description="Ride reminders and safety alerts"
              icon="notifications-outline"
              iconColor="#8B5CF6"
              control="toggle"
              toggleValue={prefs.notificationsEnabled}
              onToggle={(v) => void updatePref('notificationsEnabled', v)}
              showDivider
            />
            <SettingRow
              label="Open Device Settings"
              description="Manage notification permissions"
              icon="settings-outline"
              iconColor={colors.textTertiary}
              control="chevron"
              onPress={() => Alert.alert('Device Settings', 'Open device settings to manage notifications.')}
              showDivider={false}
            />
          </SettingsSection>

          {/* ── About ─────────────────────────────────────────────────── */}
          <SettingsSection title="ABOUT">
            <SettingRow
              label="App Version"
              icon="information-circle-outline"
              iconColor={colors.info}
              control="value"
              valueText={APP_VERSION}
              showDivider
            />
            <SettingRow
              label="Expo SDK"
              icon="layers-outline"
              iconColor={colors.accent}
              control="value"
              valueText="54.0.0"
              showDivider
            />
            <SettingRow
              label="Architecture"
              description="Offline-first · TypeScript strict"
              icon="construct-outline"
              iconColor={colors.safe}
              control="none"
              showDivider={false}
            />
          </SettingsSection>

          {/* ── Danger zone ───────────────────────────────────────────── */}
          <View style={[styles.dangerZone, { borderColor: colors.emergencyBorder, backgroundColor: colors.emergencySubtle }]}>
            <View style={styles.dangerZoneHeader}>
              <Ionicons name="warning-outline" size={16} color={colors.emergency} />
              <Text style={[textStyles.labelMedium, { color: colors.emergency, marginLeft: spacing[2] }]}>
                Danger Zone
              </Text>
            </View>
            <Text style={[textStyles.bodySmall, { color: colors.emergencyText, marginTop: spacing[2], marginBottom: spacing[4] }]}>
              This permanently deletes all your contacts, ride history, and preferences. It cannot be undone.
            </Text>
            <CustomButton
              label="Reset All App Data"
              onPress={handleReset}
              variant="danger"
              size="md"
              loading={isResetting}
              iconLeft="trash-outline"
              fullWidth
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[textStyles.caption, { color: colors.textTertiary }]}>
              RideSafe · Built with Expo SDK 54
            </Text>
            <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: spacing[1] }]}>
              React Native · TypeScript Strict · Offline-First
            </Text>
          </View>

          <View style={{ height: spacing[16] }} />
        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:    { flex: 1 },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: layout.screenHorizontal, paddingTop: spacing[2] },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenHorizontal,
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  versionBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },

  sectionCard: {
    borderRadius: radius.xl,
    borderWidth: borderWidth.thin,
    padding: spacing[5],
    overflow: 'hidden',
  },

  internalDivider: {
    height: borderWidth.hairline,
    marginVertical: spacing[4],
  },

  // Theme picker
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  themeCard: {
    width: '47%',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: radius.lg,
    borderWidth: borderWidth.medium,
    position: 'relative',
    overflow: 'hidden',
  },
  themePreview: {
    width: '100%',
    height: 44,
    borderRadius: radius.sm,
    padding: spacing[2],
    justifyContent: 'center',
    gap: 3,
  },
  themePreviewAccent: { width: 20, height: 5, borderRadius: 2 },
  themePreviewLine:   { width: '80%', height: 3, borderRadius: 2 },
  themePreviewLineShort: { width: '55%' },
  themeSelected: {
    position: 'absolute',
    top: spacing[1.5],
    right: spacing[1.5],
    width: 18,
    height: 18,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2.5],
    borderRadius: radius.md,
    borderWidth: borderWidth.thin,
    marginTop: spacing[3],
  },

  // Segmented control
  segmented: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: borderWidth.thin,
    overflow: 'hidden',
  },
  segmentedItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
    gap: spacing[1],
  },
  segmentedDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },

  // Danger zone
  dangerZone: {
    marginTop: spacing[8],
    borderRadius: radius.xl,
    borderWidth: borderWidth.medium,
    padding: spacing[5],
  },
  dangerZoneHeader: { flexDirection: 'row', alignItems: 'center' },

  footer: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
});
