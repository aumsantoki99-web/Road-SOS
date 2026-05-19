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
import { spacing, radius, layout, borderWidth } from '../theme/spacing';
import { shadows } from '../theme/shadows';
import { textStyles } from '../theme/typography';

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabConfig = {
  route: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const TAB_CONFIG: TabConfig[] = [
  { route: 'Home',      label: 'Home',     icon: 'home-outline',        iconActive: 'home'        },
  { route: 'Ride',      label: 'Ride',     icon: 'speedometer-outline', iconActive: 'speedometer' },
  { route: 'Contacts',  label: 'Contacts', icon: 'people-outline',      iconActive: 'people'      },
  { route: 'Hospitals', label: 'Nearby',   icon: 'medical-outline',     iconActive: 'medical'     },
  { route: 'Settings',  label: 'Settings', icon: 'settings-outline',    iconActive: 'settings'    },
];

// ─── SOS Button ───────────────────────────────────────────────────────────────

function SOSButton({ onPress }: { onPress: () => void }): React.JSX.Element {
  const { colors } = useTheme();
  const scale      = useRef(new Animated.Value(1)).current;
  const haloOpacity = useRef(new Animated.Value(0.35)).current;

  // Subtle ambient halo pulse
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(haloOpacity, { toValue: 0.65, duration: 1600, useNativeDriver: true }),
        Animated.timing(haloOpacity, { toValue: 0.35, duration: 1600, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [haloOpacity]);

  function handlePressIn(): void {
    Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 60, bounciness: 0 }).start();
  }
  function handlePressOut(): void {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 10 }).start();
  }

  return (
    <View style={styles.sosWrapper}>
      {/* Outer ambient halo */}
      <Animated.View
        style={[
          styles.sosHaloOuter,
          { borderColor: colors.emergency, opacity: haloOpacity },
        ]}
        pointerEvents="none"
      />
      {/* Inner halo ring */}
      <Animated.View
        style={[
          styles.sosHaloInner,
          { borderColor: colors.emergency, opacity: haloOpacity },
        ]}
        pointerEvents="none"
      />

      {/* Ring plate — lifts button above tab bar */}
      <View style={[styles.sosRing, { backgroundColor: colors.tabBarBackground }]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          accessibilityLabel="SOS Emergency Button"
          accessibilityHint="Opens emergency alert confirmation"
          accessibilityRole="button"
        >
          <Animated.View
            style={[
              styles.sosButton,
              { backgroundColor: colors.emergency },
              shadows.glowEmergency,
              { transform: [{ scale }] },
            ]}
          >
            <Text style={styles.sosLabel}>SOS</Text>
            <Text style={styles.sosSublabel}>EMERGENCY</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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

  const scale        = useRef(new Animated.Value(1)).current;
  const labelOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const pillWidth    = useRef(new Animated.Value(isActive ? 28 : 0)).current;
  const pillOpacity  = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  // Animate when isActive changes
  useEffect(() => {
    Animated.parallel([
      Animated.timing(labelOpacity, { toValue: isActive ? 1 : 0, duration: 180, useNativeDriver: true }),
      Animated.spring(pillWidth,    { toValue: isActive ? 28 : 0, useNativeDriver: false, speed: 20, bounciness: 4 }),
      Animated.timing(pillOpacity,  { toValue: isActive ? 1 : 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [isActive, labelOpacity, pillWidth, pillOpacity]);

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
      accessibilityLabel={config.label}
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View style={[styles.tabItemInner, { transform: [{ scale }] }]}>
        {/* Icon */}
        <Ionicons name={iconName} size={22} color={iconColor} />

        {/* Label — visible only when active */}
        <Animated.Text
          style={[textStyles.labelMedium, styles.tabLabel, { color: colors.tabBarActive, opacity: labelOpacity }]}
          numberOfLines={1}
        >
          {config.label}
        </Animated.Text>

        {/* Animated pill indicator */}
        <Animated.View
          style={[
            styles.activePill,
            {
              backgroundColor: colors.tabBarActive,
              width: pillWidth,
              opacity: pillOpacity,
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

  const leftTabs  = TAB_CONFIG.slice(0, 2);
  const rightTabs = TAB_CONFIG.slice(2);

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

  function handleSOSPress(): void {
    navigation.getParent()?.navigate('SOSConfirmation');
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
        <View style={styles.tabGroup}>
          {leftTabs.map((config) => (
            <TabItem
              key={config.route}
              config={config}
              isActive={isTabActive(config.route)}
              onPress={() => handleTabPress(config.route)}
            />
          ))}
        </View>

        <SOSButton onPress={handleSOSPress} />

        <View style={styles.tabGroup}>
          {rightTabs.map((config) => (
            <TabItem
              key={config.route}
              config={config}
              isActive={isTabActive(config.route)}
              onPress={() => handleTabPress(config.route)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const SOS_SIZE      = 62;
const SOS_RING_SIZE = SOS_SIZE + 14;
const SOS_HALO_IN   = SOS_SIZE + 26;
const SOS_HALO_OUT  = SOS_SIZE + 44;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'visible',
  },
  gradientOverlay: {
    top: -24,
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
  tabGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
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
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  activePill: {
    height: 3,
    borderRadius: radius.full,
    marginTop: 1,
  },

  // SOS
  sosWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -(SOS_RING_SIZE / 2 + spacing[4]),
  },
  sosHaloOuter: {
    position: 'absolute',
    width: SOS_HALO_OUT,
    height: SOS_HALO_OUT,
    borderRadius: SOS_HALO_OUT / 2,
    borderWidth: 1,
  },
  sosHaloInner: {
    position: 'absolute',
    width: SOS_HALO_IN,
    height: SOS_HALO_IN,
    borderRadius: SOS_HALO_IN / 2,
    borderWidth: 1.5,
  },
  sosRing: {
    width: SOS_RING_SIZE,
    height: SOS_RING_SIZE,
    borderRadius: SOS_RING_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 8 } }),
  },
  sosButton: {
    width: SOS_SIZE,
    height: SOS_SIZE,
    borderRadius: SOS_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ android: { elevation: 10 } }),
  },
  sosLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
    lineHeight: 17,
  },
  sosSublabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 6,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
});
