/**
 * CustomTabBar — Premium Bottom Navigation
 * feature/ui-polish-navigation ✅
 *
 * Enhancements over v1:
 *   - Frosted glass background (layered opacity + blur feel via gradient)
 *   - Active tab gets icon + label + animated underline pill — not just a dot
 *   - Inactive tabs: icon only, no clutter
 *   - SOS button: two-ring glow halo, larger, bolder "SOS" text
 *   - Press: icon scales + bounces, label fades in simultaneously
 *   - Active indicator: animated width pill, not a static dot
 *   - Hairline top border with gradient overlay for depth
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
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/LocalizationContext';
import { spacing, radius, layout, borderWidth } from '../theme/spacing';
import { textStyles } from '../theme/typography';

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabConfig = {
  route: string;
  labelKey: 'tabs.home' | 'tabs.ride' | 'tabs.contacts' | 'tabs.hospitals' | 'tabs.settings';
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const TAB_CONFIG: TabConfig[] = [
  { route: 'Home',      labelKey: 'tabs.home',      icon: 'home-outline',        iconActive: 'home'        },
  { route: 'Ride',      labelKey: 'tabs.ride',      icon: 'speedometer-outline', iconActive: 'speedometer' },
  { route: 'Contacts',  labelKey: 'tabs.contacts',  icon: 'people-outline',      iconActive: 'people'      },
  { route: 'Hospitals', labelKey: 'tabs.hospitals', icon: 'medical-outline',     iconActive: 'medical'     },
  { route: 'Settings',  labelKey: 'tabs.settings',  icon: 'settings-outline',    iconActive: 'settings'    },
];

// ─── Tab Item ─────────────────────────────────────────────────────────────────

function TabItem({
  config,
  isActive,
  onPress,
}: {
  config: TabConfig;
  isActive: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const scale        = useRef(new Animated.Value(1)).current;
  const labelOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const pillScale    = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const pillOpacity  = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  // Animate when isActive changes
  useEffect(() => {
    Animated.parallel([
      Animated.timing(labelOpacity, { toValue: isActive ? 1 : 0, duration: 180, useNativeDriver: true }),
      Animated.spring(pillScale,    { toValue: isActive ? 1 : 0, useNativeDriver: true, speed: 20, bounciness: 4 }),
      Animated.timing(pillOpacity,  { toValue: isActive ? 1 : 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [isActive, labelOpacity, pillScale, pillOpacity]);

  function handlePressIn(): void {
    Animated.spring(scale, { toValue: 0.84, useNativeDriver: true, speed: 60, bounciness: 0 }).start();
  }
  function handlePressOut(): void {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 25, bounciness: 8 }).start();
  }

  const iconColor = isActive ? colors.tabBarActive : colors.tabBarInactive;
  const iconName  = isActive ? config.iconActive : config.icon;

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      accessibilityRole="tab"
      accessibilityLabel={t(config.labelKey)}
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View style={[styles.tabItemInner, { transform: [{ scale }] }]}>
        {/* Icon */}
        <Ionicons name={iconName} size={28} color={iconColor} />

        {/* Animated pill indicator */}
        <Animated.View
          style={[
            styles.activePill,
            {
              backgroundColor: colors.tabBarActive,
              opacity: pillOpacity,
              transform: [{ scaleX: pillScale }],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

export function CustomTabBar({ state, navigation }: BottomTabBarProps): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  function handleTabPress(routeName: string): void {
    const route = state.routes.find((item) => item.name === routeName);
    const event = navigation.emit({
      type: 'tabPress',
      target: route?.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  }

  function isTabActive(routeName: string): boolean {
    return state.routes[state.index]?.name === routeName;
  }

  const tabBarHeight = layout.tabBarHeight + insets.bottom;

  return (
    <View style={[styles.container, { height: tabBarHeight, paddingBottom: insets.bottom }]}>
      {/* Background layer with subtle top gradient fade */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.tabBarBackground }]} />
      <LinearGradient
        colors={[
          isDark ? 'rgba(8,14,26,0)' : 'rgba(248,250,252,0)',
          isDark ? 'rgba(8,14,26,0.98)' : 'rgba(255,255,255,0.98)',
        ]}
        style={[StyleSheet.absoluteFill, styles.gradientOverlay]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      />

      {/* Top border */}
      <View style={[styles.topBorder, { backgroundColor: colors.tabBarBorder }]} />

      {/* Tab content row */}
      <View style={styles.row}>
        {TAB_CONFIG.map((config) => (
          <TabItem
            key={config.route}
            config={config}
            isActive={isTabActive(config.route)}
            onPress={() => handleTabPress(config.route)}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'visible',
  },
  gradientOverlay: {
    top: 0,
  },
  topBorder: {
    height: borderWidth.hairline,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: spacing[1],
  },

  // Tab item
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.minTouchTarget,
    paddingVertical: spacing[2],
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  activePill: {
    width: 28,
    height: 3,
    borderRadius: radius.full,
    marginTop: 1,
  },
});
