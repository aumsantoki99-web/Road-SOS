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
import { textStyles } from '../../theme/typography';
import { spacing, radius, borderWidth } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

export interface CountryCodeOption {
  code: string;
  flag: string;
  name: string;
}

export const COUNTRY_CODES: CountryCodeOption[] = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA/Canada' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+34', flag: '🇪🇸', name: 'Spain' },
  { code: '+39', flag: '🇮🇹', name: 'Italy' },
  { code: '+7', flag: '🇷🇺', name: 'Russia' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+62', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa' },
];

interface CountrySelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: CountryCodeOption) => void;
  selectedCode: string;
}

export function CountrySelectionModal({
  visible,
  onClose,
  onSelect,
  selectedCode,
}: CountrySelectionModalProps): React.JSX.Element {
  const { colors } = useTheme();

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
            <View style={[styles.titleIcon, { backgroundColor: `${colors.accent}18` }]}>
              <Ionicons name="globe-outline" size={24} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[textStyles.headingLarge, { color: colors.textPrimary }]}>
                Select Country Code
              </Text>
              <Text style={[textStyles.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
                Choose your country mobile dial prefix
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.surfaceSecondary }]}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* List */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.grid}>
              {COUNTRY_CODES.map((item) => {
                const isActive = item.code === selectedCode;
                const activeColor = colors.accent;

                return (
                  <TouchableOpacity
                    key={item.code}
                    onPress={() => {
                      onSelect(item);
                      onClose();
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.langTile,
                      {
                        backgroundColor: colors.surfacePrimary,
                        borderColor: isActive ? activeColor : colors.surfaceBorder,
                        borderWidth: isActive ? borderWidth.medium : borderWidth.thin,
                      },
                    ]}
                  >
                    <View style={styles.tileLeft}>
                      <Text style={styles.flag}>{item.flag}</Text>
                      <View style={{ marginLeft: spacing[3] }}>
                        <Text style={[textStyles.headingSmall, { color: colors.textPrimary }]}>
                          {item.name}
                        </Text>
                        <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: 1 }]}>
                          {item.code}
                        </Text>
                      </View>
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
                      {isActive && <Ionicons name="checkmark" size={14} color="#000" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 22,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: borderWidth.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
