/**
 * AppHeader — Universal Screen Header
 * feature/accessibility ✅ — full a11y props applied
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { spacing, layout, radius } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import { expandHitSlop } from '../../utils/accessibility';

type HeaderVariant = 'standard' | 'transparent' | 'modal';

interface RightAction {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
}

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  variant?: HeaderVariant;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: RightAction;
  backgroundColor?: string;
}

export function AppHeader({
  title,
  subtitle,
  variant = 'standard',
  showBack = false,
  onBackPress,
  rightAction,
  backgroundColor,
}: AppHeaderProps): React.JSX.Element {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useAppNavigation();
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleOpacity,    { toValue: 1, duration: 300, delay: 80, useNativeDriver: true }),
      Animated.timing(titleTranslateY, { toValue: 0, duration: 300, delay: 80, useNativeDriver: true }),
    ]).start();
  }, [titleOpacity, titleTranslateY]);

  function handleBack(): void {
    if (onBackPress) onBackPress();
    else nav.goBack();
  }

  const isTransparent = variant === 'transparent';
  const isModal       = variant === 'modal';
  const bgColor       = isTransparent ? 'transparent' : (backgroundColor ?? colors.bgSecondary);
  const paddingTop    = insets.top + (Platform.OS === 'android' ? spacing[2] : 0);
  const backLabel     = isModal ? 'Close' : 'Go back';
  const backIcon      = isModal ? 'close' : 'chevron-back';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: bgColor, paddingTop },
        !isTransparent && shadows.xs,
        !isTransparent && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.surfaceBorder },
      ]}
      accessibilityRole="header"
    >
      <View style={styles.row}>
        {/* Left — back / close */}
        <View style={styles.side}>
          {(showBack || isModal) && (
            <TouchableOpacity
              onPress={handleBack}
              style={[
                styles.iconBtn,
                { backgroundColor: isTransparent ? colors.overlay : colors.surfaceSecondary },
              ]}
              accessibilityLabel={backLabel}
              accessibilityRole="button"
              accessibilityHint={isModal ? 'Closes this screen' : 'Returns to previous screen'}
              hitSlop={expandHitSlop(36)}
            >
              <Ionicons name={backIcon} size={20} color={colors.iconPrimary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Centre — title */}
        <Animated.View
          style={[
            styles.titleContainer,
            { opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] },
          ]}
          accessible
          accessibilityRole="text"
        >
          <Text
            style={[textStyles.headingMedium, { color: colors.textPrimary }]}
            numberOfLines={1}
            accessibilityRole="header"
          >
            {title}
          </Text>
          {subtitle !== undefined && subtitle.length > 0 && (
            <Text
              style={[textStyles.caption, { color: colors.textTertiary, marginTop: 1 }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </Animated.View>

        {/* Right — optional action */}
        <View style={styles.side}>
          {rightAction !== undefined && (
            <TouchableOpacity
              onPress={rightAction.onPress}
              style={[
                styles.iconBtn,
                { backgroundColor: isTransparent ? colors.overlay : colors.surfaceSecondary },
              ]}
              accessibilityLabel={rightAction.accessibilityLabel}
              accessibilityRole="button"
              hitSlop={expandHitSlop(36)}
            >
              <Ionicons name={rightAction.icon} size={20} color={colors.iconPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: layout.screenHorizontal,
    paddingBottom: spacing[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.minTouchTarget,
  },
  side:            { width: 44, alignItems: 'center' },
  titleContainer:  { flex: 1, alignItems: 'center' },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
});
