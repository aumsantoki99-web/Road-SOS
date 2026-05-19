/**
 * SettingRow — Settings list item
 *
 * Supports four right-side control types:
 *   toggle     → ToggleSwitch (dark mode, notifications, etc.)
 *   chevron    → Navigates to a sub-screen
 *   value      → Displays the current value (e.g. "Medium")
 *   none       → No right element (informational row)
 *
 * The icon container uses a subtle tinted background — each setting
 * gets its own accent color for visual scanning (like iOS Settings).
 *
 * Usage:
 *   <SettingRow icon="moon" iconColor="#6366F1" label="Dark Mode" control="toggle" toggleValue={isDark} onToggle={toggle} />
 *   <SettingRow icon="notifications" iconColor="#F59E0B" label="Notifications" control="chevron" onPress={nav} />
 *   <SettingRow icon="speedometer" iconColor="#14B8A6" label="Sensitivity" control="value" valueText="Medium" onPress={nav} />
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { ToggleSwitch } from './ToggleSwitch';
import { spacing, radius, borderWidth, layout } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';

// ─── Types ────────────────────────────────────────────────────────────────────

type ControlType = 'toggle' | 'chevron' | 'value' | 'none';

export interface SettingRowProps {
  label: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Background color of the icon container */
  iconColor: string;
  control: ControlType;
  /** Required when control === 'toggle' */
  toggleValue?: boolean;
  /** Required when control === 'toggle' */
  onToggle?: (value: boolean) => void;
  /** Displayed when control === 'value' */
  valueText?: string;
  /** Required when control === 'chevron' or 'value' */
  onPress?: () => void;
  showDivider?: boolean;
  /** Makes the label and icon appear in danger red */
  destructive?: boolean;
  disabled?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SettingRow({
  label,
  description,
  icon,
  iconColor,
  control,
  toggleValue = false,
  onToggle,
  valueText,
  onPress,
  showDivider = true,
  destructive = false,
  disabled = false,
}: SettingRowProps): React.JSX.Element {
  const { colors } = useTheme();

  const labelColor = destructive ? colors.emergency : colors.textPrimary;
  const iconBgColor = destructive ? colors.emergencySubtle : `${iconColor}22`; // 22 = ~13% opacity
  const resolvedIconColor = destructive ? colors.emergency : iconColor;

  const isInteractable = (control === 'chevron' || control === 'value') && onPress !== undefined;

  function renderControl(): React.JSX.Element | null {
    switch (control) {
      case 'toggle':
        return (
          <ToggleSwitch
            value={toggleValue}
            onValueChange={onToggle ?? (() => {})}
            disabled={disabled}
            accessibilityLabel={label}
          />
        );
      case 'chevron':
        return (
          <Ionicons name="chevron-forward" size={16} color={colors.iconSecondary} />
        );
      case 'value':
        return (
          <View style={styles.valueRow}>
            {valueText !== undefined && (
              <Text style={[textStyles.bodySmall, { color: colors.textTertiary, marginRight: spacing[1] }]}>
                {valueText}
              </Text>
            )}
            <Ionicons name="chevron-forward" size={16} color={colors.iconSecondary} />
          </View>
        );
      case 'none':
      default:
        return null;
    }
  }

  const rowContent = (
    <View style={[styles.row, { opacity: disabled ? 0.45 : 1 }]}>
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon} size={18} color={resolvedIconColor} />
      </View>

      {/* Label + description */}
      <View style={styles.labelContainer}>
        <Text style={[textStyles.bodyMedium, { color: labelColor }]} numberOfLines={1}>
          {label}
        </Text>
        {description !== undefined && (
          <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: 1 }]} numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>

      {/* Right control */}
      <View style={styles.control}>
        {renderControl()}
      </View>
    </View>
  );

  return (
    <>
      {isInteractable ? (
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={styles.touchable}
        >
          {rowContent}
        </TouchableOpacity>
      ) : (
        <View style={styles.touchable}>{rowContent}</View>
      )}
      {showDivider && (
        <View
          style={[
            styles.divider,
            { backgroundColor: colors.divider, marginLeft: layout.screenHorizontal + 36 + spacing[3] },
          ]}
        />
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  touchable: {
    minHeight: layout.minTouchTarget + 4,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
    flexShrink: 0,
  },
  labelContainer: {
    flex: 1,
  },
  control: {
    marginLeft: spacing[3],
    flexShrink: 0,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: borderWidth.hairline,
  },
});
