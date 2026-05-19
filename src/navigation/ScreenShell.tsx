/**
 * ScreenShell — Shared scaffold for stub screens
 *
 * Provides a consistent themed container for screens that haven't
 * been fully implemented yet. Shows the screen name + branch info.
 *
 * This component is INTERNAL to the navigation branch.
 * It's replaced screen-by-screen as feature branches are merged.
 *
 * Design: Keeps the app looking intentional even before screens are built.
 * Not a blank white screen — it's a branded placeholder.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';
import { spacing, radius, layout } from '../theme/spacing';
import { textStyles } from '../theme/typography';
import { shadows } from '../theme/shadows';

interface ScreenShellProps {
  screenName: string;
  featureBranch: string;
  iconName: keyof typeof Ionicons.glyphMap;
  description: string;
  /** What this screen will contain when the branch is merged */
  upcoming: string[];
}

export function ScreenShell({
  screenName,
  featureBranch,
  iconName,
  description,
  upcoming,
}: ScreenShellProps): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.bgPrimary }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Screen identity */}
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.accentSubtle },
              shadows.glowAmber,
            ]}
          >
            <Ionicons name={iconName} size={layout.iconHero} color={colors.accent} />
          </View>
          <Text style={[textStyles.displaySmall, { color: colors.textPrimary, marginTop: spacing[4] }]}>
            {screenName}
          </Text>
          <Text style={[textStyles.bodyMedium, { color: colors.textTertiary, marginTop: spacing[2], textAlign: 'center' }]}>
            {description}
          </Text>
        </View>

        {/* Branch badge */}
        <View style={[styles.branchBadge, { backgroundColor: colors.accentSubtle, borderColor: colors.accentMuted }]}>
          <Ionicons name="git-branch-outline" size={14} color={colors.accent} />
          <Text style={[textStyles.labelMedium, { color: colors.accentText, marginLeft: spacing[1] }]}>
            {featureBranch}
          </Text>
        </View>

        {/* Upcoming features */}
        <View style={[styles.card, { backgroundColor: colors.surfacePrimary, borderColor: colors.surfaceBorder }, shadows.card]}>
          <Text style={[textStyles.labelCaps, { color: colors.textTertiary, marginBottom: spacing[3] }]}>
            COMING IN THIS BRANCH
          </Text>
          {upcoming.map((item, i) => (
            <View key={i} style={styles.upcomingRow}>
              <View style={[styles.upcomingDot, { backgroundColor: colors.accentMuted }]} />
              <Text style={[textStyles.bodySmall, { color: colors.textSecondary, flex: 1 }]}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenHorizontal,
    paddingTop: spacing[8],
    paddingBottom: spacing[12],
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
    borderWidth: 1,
    marginBottom: spacing[6],
  },
  card: {
    width: '100%',
    borderRadius: radius.lg,
    padding: spacing[5],
    borderWidth: 1,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  upcomingDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    marginTop: 6,
  },
});
