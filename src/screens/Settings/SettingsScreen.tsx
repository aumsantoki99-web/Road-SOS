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

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useAppState } from '../../context/AppStateContext';
import { useTranslation } from '../../context/LocalizationContext';
import { useStorage } from '../../hooks/useStorage';
import { StorageService } from '../../storage/StorageService';
import { LanguageSelectionModal } from '../../components/common/LanguageSelectionModal';
import { SosDelayModal } from '../../components/common/SosDelayModal';

import { SettingRow } from '../../components/common/SettingRow';
import { CustomButton } from '../../components/common/CustomButton';

import { spacing, layout, radius, borderWidth } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { STORAGE_KEYS, APP_VERSION, DEFAULT_PREFERENCES } from '../../constants';
import type { ThemeMode, CrashSensitivity, UserPreferences, AppLanguage, MedicalProfile } from '../../types';
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
  const { t } = useTranslation();

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
            {t('settings.nightModeActive')}
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
  const { t } = useTranslation();

  const options: { value: CrashSensitivity; label: string; color: string }[] = [
    { value: 'low',    label: t('settings.low'),    color: colors.safe },
    { value: 'medium', label: t('settings.medium'), color: colors.accent },
    { value: 'high',   label: t('settings.high'),   color: colors.emergency },
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

export function SettingsScreen({ navigation }: SettingsScreenProps): React.JSX.Element {
  const { colors } = useTheme();
  const { updatePreferences } = useAppState();
  const { t, language, setLanguage } = useTranslation();
  const [isResetting, setResetting] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [isDelayModalVisible, setIsDelayModalVisible] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    async function checkMedicalProfile(): Promise<void> {
      await StorageService.get<MedicalProfile>(STORAGE_KEYS.MEDICAL_PROFILE);
    }
    void checkMedicalProfile();

    const unsubscribe = navigation.addListener('focus', () => {
      void checkMedicalProfile();
    });
    return unsubscribe;
  }, [navigation]);

  const { data: prefs, save: savePrefs, isLoading } = useStorage<UserPreferences>(
    STORAGE_KEYS.PREFERENCES,
    DEFAULT_PREFERENCES,
  );

  const updatePref = useCallback(
    async <K extends keyof UserPreferences>(
      key: K,
      value: UserPreferences[K],
    ): Promise<void> => {
      const updated = { ...prefs, [key]: value };
      await savePrefs(updated);
      updatePreferences({ [key]: value });
    },
    [prefs, savePrefs, updatePreferences],
  );

  // Sync preferences state with context language dynamically to prevent stale overwrites
  useEffect(() => {
    if (!isLoading && prefs && prefs.language !== language) {
      void updatePref('language', language);
    }
  }, [language, prefs, isLoading, updatePref]);

  const languageOptions: { value: AppLanguage; label: string }[] = [
    { value: 'en', label: t('settings.languageEnglish') },
    { value: 'hi', label: t('settings.languageHindi') },
    { value: 'gu', label: t('settings.languageGujarati') },
    { value: 'mr', label: t('settings.languageMarathi') },
    { value: 'ta', label: t('settings.languageTamil') },
    { value: 'te', label: t('settings.languageTelugu') },
    { value: 'bn', label: t('settings.languageBengali') },
    { value: 'kn', label: t('settings.languageKannada') },
    { value: 'ml', label: t('settings.languageMalayalam') },
    { value: 'pa', label: t('settings.languagePunjabi') },
    { value: 'ur', label: t('settings.languageUrdu') },
    { value: 'es', label: t('settings.languageSpanish') },
    { value: 'fr', label: t('settings.languageFrench') },
    { value: 'de', label: t('settings.languageGerman') },
    { value: 'ar', label: t('settings.languageArabic') },
    { value: 'ja', label: t('settings.languageJapanese') },
    { value: 'zh', label: t('settings.languageChinese') },
  ];


  function handleReset(): void {
    setShowResetModal(true);
  }

  async function executeReset(): Promise<void> {
    setResetting(true);
    await StorageService.clear();
    await savePrefs(DEFAULT_PREFERENCES);
    updatePreferences(DEFAULT_PREFERENCES);
    await setLanguage(DEFAULT_PREFERENCES.language);
    setResetting(false);
    setShowResetModal(false);
    Alert.alert(t('settings.done'), t('settings.resetDone'));
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={[textStyles.displaySmall, { color: colors.textPrimary }]}>{t('settings.title')}</Text>
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
          <SettingsSection title={t('settings.appearance')} topSpacing={0}>
            <Text style={[textStyles.bodySmall, { color: colors.textTertiary, marginBottom: spacing[4] }]}>
              {t('settings.themeDescription')}
            </Text>
            <ThemePicker />
          </SettingsSection>

          <SettingsSection title={t('settings.language')}>
            <SettingRow
              label={t('settings.language')}
              description={t('settings.languageDescription')}
              icon="language-outline"
              iconColor={colors.info}
              control="value"
              valueText={languageOptions.find((option) => option.value === language)?.label}
              onPress={() => setIsLanguageModalVisible(true)}
              showDivider={false}
            />
          </SettingsSection>

          {/* ── Account ─────────────────────────────────────────────────── */}
          <SettingsSection title="Account">
            <SettingRow
              label="My Profile"
              description="View your account details and medical info"
              icon="person-circle-outline"
              iconColor={colors.accent}
              control="value"
              valueText="View"
              onPress={() => navigation.navigate('Profile')}
              showDivider={false}
            />
          </SettingsSection>

          {/* ── Safety ────────────────────────────────────────────────── */}
          <SettingsSection title={t('settings.safety')}>
            <Text style={[textStyles.labelMedium, { color: colors.textSecondary, marginBottom: spacing[3] }]}>
              {t('settings.crashSensitivity')}
            </Text>
            <SensitivityControl
              value={(prefs.crashSensitivity?.toLowerCase() as CrashSensitivity) || 'medium'}
              onChange={(v) => void updatePref('crashSensitivity', v)}
            />
            <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: spacing[2], marginBottom: spacing[5] }]}>
              {t('settings.crashSensitivityHint')}
            </Text>

            <View style={[styles.internalDivider, { backgroundColor: colors.divider }]} />

            <SettingRow
              label={t('settings.sosDelay')}
              description={t('settings.sosDelayDescription')}
              icon="timer-outline"
              iconColor={colors.emergency}
              control="value"
              valueText={`${prefs.sosDelay} sec`}
              onPress={() => setIsDelayModalVisible(true)}
              showDivider
            />
            <SettingRow
              label={t('settings.autoShareLocation')}
              description={t('settings.autoShareLocationDescription')}
              icon="location-outline"
              iconColor={colors.safe}
              control="toggle"
              toggleValue={prefs.autoShareLocation}
              onToggle={(v) => void updatePref('autoShareLocation', v)}
              showDivider={false}
            />
          </SettingsSection>

          {/* ── Emergency preferences ─────────────────────────────────── */}
          <SettingsSection title={t('settings.emergency')}>
            <SettingRow
              label={t('settings.rideAutoStart')}
              description={t('settings.rideAutoStartDescription')}
              icon="speedometer-outline"
              iconColor={colors.accent}
              control="toggle"
              toggleValue={!!prefs.rideAutoStart}
              onToggle={(v) => void updatePref('rideAutoStart', v)}
              showDivider
            />
            <SettingRow
              label={t('settings.offlineEmergencyMode')}
              description={t('settings.offlineEmergencyModeDescription')}
              icon="cloud-offline-outline"
              iconColor={colors.info}
              control="toggle"
              toggleValue={prefs.offlineModeEnabled}
              onToggle={(v) => void updatePref('offlineModeEnabled', v)}
              showDivider={false}
            />
          </SettingsSection>

          {/* ── About ─────────────────────────────────────────────────── */}
          <SettingsSection title={t('settings.about')}>
            <SettingRow
              label={t('settings.appVersion')}
              icon="information-circle-outline"
              iconColor={colors.info}
              control="value"
              valueText={APP_VERSION}
              showDivider
            />
            <SettingRow
              label={t('settings.expoSdk')}
              icon="layers-outline"
              iconColor={colors.accent}
              control="value"
              valueText="54.0.0"
              showDivider
            />
            <SettingRow
              label="Privacy Policy"
              icon="shield-checkmark-outline"
              iconColor={colors.safe}
              control="chevron"
              onPress={() => navigation.navigate('PrivacyPolicy' as never)}
              showDivider
            />
            <SettingRow
              label="Terms & Conditions"
              icon="document-text-outline"
              iconColor={colors.textTertiary}
              control="chevron"
              onPress={() => navigation.navigate('TermsConditions' as never)}
              showDivider
            />
            <SettingRow
              label={t('settings.architecture')}
              description={t('settings.architectureDescription')}
              icon="construct-outline"
              iconColor={colors.emergency}
              control="none"
              showDivider={false}
            />
          </SettingsSection>

          {/* ── Danger zone ───────────────────────────────────────────── */}
          <View style={[styles.dangerZone, { borderColor: colors.emergencyBorder, backgroundColor: colors.emergencySubtle }]}>
            <View style={styles.dangerZoneHeader}>
              <Ionicons name="warning-outline" size={16} color={colors.emergency} />
              <Text style={[textStyles.labelMedium, { color: colors.emergency, marginLeft: spacing[2] }]}>
                {t('settings.dangerZone')}
              </Text>
            </View>
            <Text style={[textStyles.bodySmall, { color: colors.emergencyText, marginTop: spacing[2], marginBottom: spacing[4] }]}>
              {t('settings.dangerZoneDescription')}
            </Text>
            <CustomButton
              label={t('settings.resetAllData')}
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
            <Text style={[textStyles.caption, { color: colors.textSecondary, fontWeight: '600', marginBottom: spacing[1] }]}>
              Made with ❤️ by Team Neurobyte
            </Text>
            <Text style={[textStyles.caption, { color: colors.textTertiary }]}>
              © {new Date().getFullYear()} Team Neurobyte. All rights reserved.
            </Text>
          </View>

          <View style={{ height: spacing[16] }} />
        </Animated.View>
      </Animated.ScrollView>
      <LanguageSelectionModal
        visible={isLanguageModalVisible}
        onClose={() => setIsLanguageModalVisible(false)}
      />
      <SosDelayModal
        visible={isDelayModalVisible}
        onClose={() => setIsDelayModalVisible(false)}
        currentDelay={prefs.sosDelay}
        onSelect={(delay) => void updatePref('sosDelay', delay)}
      />

      {/* ── RESET DATA MODAL ── */}
      <Modal visible={showResetModal} transparent animationType="fade" onRequestClose={() => setShowResetModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfacePrimary }]}>
            <View style={styles.modalHeaderCentered}>
              <Ionicons name="warning" size={56} color={colors.emergency} />
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('settings.resetAlertTitle')}</Text>
            </View>
            <Text style={[styles.modalBodyText, { color: colors.textSecondary }]}>
              {t('settings.resetAlertBody')}
            </Text>
            <View style={styles.modalButtonsRow}>
              <View style={{ flex: 1 }}>
                <CustomButton label={t('settings.cancel')} onPress={() => setShowResetModal(false)} variant="secondary" />
              </View>
              <View style={{ flex: 1 }}>
                <CustomButton label={t('settings.resetEverything')} onPress={executeReset} variant="danger" loading={isResetting} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
    gap: spacing[3],
  },
  themeCard: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: '45%',
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
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderCentered: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
  },
  modalBodyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
});
