import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/LocalizationContext';
import { textStyles } from '../../theme/typography';
import { spacing, radius, borderWidth } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import type { AppLanguage } from '../../types';

interface LanguageSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  isFirstLaunch?: boolean;
}

const LANGUAGES = [
  { value: 'en', native: 'English', english: 'English' },
  { value: 'hi', native: 'हिन्दी', english: 'Hindi' },
  { value: 'gu', native: 'ગુજરાતી', english: 'Gujarati' },
  { value: 'mr', native: 'मराठी', english: 'Marathi' },
  { value: 'ta', native: 'தமிழ்', english: 'Tamil' },
  { value: 'te', native: 'తెలుగు', english: 'Telugu' },
  { value: 'bn', native: 'বাংলা', english: 'Bengali' },
  { value: 'kn', native: 'ಕನ್ನಡ', english: 'Kannada' },
  { value: 'ml', native: 'മലയാളം', english: 'Malayalam' },
  { value: 'pa', native: 'ਪੰਜਾਬੀ', english: 'Punjabi' },
  { value: 'ur', native: 'اردو', english: 'Urdu' },
  { value: 'es', native: 'Español', english: 'Spanish' },
  { value: 'fr', native: 'Français', english: 'French' },
  { value: 'de', native: 'Deutsch', english: 'German' },
  { value: 'ar', native: 'العربية', english: 'Arabic' },
  { value: 'ja', native: '日本語', english: 'Japanese' },
  { value: 'zh', native: '简体中文', english: 'Chinese' },
] as const;

export function LanguageSelectionModal({
  visible,
  onClose,
  isFirstLaunch = false,
}: LanguageSelectionModalProps): React.JSX.Element {
  const { colors } = useTheme();
  const { t, language, setLanguage } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.bgSecondary,
              borderColor: colors.surfaceBorder,
            },
            shadows.float,
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.titleIcon, { backgroundColor: `${colors.info}18` }]}>
              <Ionicons name="language-outline" size={24} color={colors.info} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[textStyles.headingLarge, { color: colors.textPrimary }]}>
                {t('settings.language')}
              </Text>
              <Text style={[textStyles.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
                {t('settings.languageDescription')}
              </Text>
            </View>
            {!isFirstLaunch && (
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: colors.surfaceSecondary }]}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Languages Grid */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.grid}>
              {LANGUAGES.map((item) => {
                const isActive = item.value === language;
                const activeColor = colors.info;

                return (
                  <TouchableOpacity
                    key={item.value}
                    onPress={() => void setLanguage(item.value as AppLanguage)}
                    activeOpacity={0.8}
                    style={[
                      styles.langTile,
                      {
                        backgroundColor: colors.surfacePrimary,
                        borderColor: isActive ? activeColor : colors.surfaceBorder,
                        borderWidth: isActive ? borderWidth.medium : borderWidth.thin,
                      },
                      isActive && shadows.glowSafe,
                    ]}
                  >
                    <View style={styles.tileLeft}>
                      <Text style={[textStyles.headingSmall, { color: colors.textPrimary }]}>
                        {item.native}
                      </Text>
                      {item.native !== item.english && (
                        <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: 1 }]}>
                          {item.english}
                        </Text>
                      )}
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: isActive ? activeColor : colors.surfaceBorder,
                          backgroundColor: isActive ? activeColor : 'transparent',
                        },
                      ]}
                    >
                      {isActive && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Confirm Footer */}
          <View style={[styles.footer, { borderTopColor: colors.divider }]}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              style={[styles.confirmBtn, { backgroundColor: colors.info }]}
            >
              <Text style={[textStyles.labelLarge, styles.confirmBtnText]}>
                {t('settings.done').toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = SCREEN_HEIGHT * 0.72;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[5],
  },
  card: {
    width: '100%',
    maxHeight: CARD_HEIGHT,
    borderRadius: radius['2xl'],
    borderWidth: borderWidth.thin,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[5],
    gap: spacing[4],
  },
  titleIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexShrink: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[5],
  },
  grid: {
    gap: spacing[3],
  },
  langTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.xl,
  },
  tileLeft: {
    flex: 1,
    paddingRight: spacing[3],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: borderWidth.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: spacing[5],
    borderTopWidth: borderWidth.thin,
  },
  confirmBtn: {
    width: '100%',
    height: 52,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 1.2,
  },
});
