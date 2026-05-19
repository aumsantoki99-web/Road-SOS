/**
 * ContactFormSheet — Shared contact form UI
 *
 * Used by both AddContactScreen and EditContactScreen.
 * All form logic lives in useContactForm — this is pure UI.
 *
 * Fields:
 *   Name         → free text, auto-capitalised
 *   Phone        → numeric keyboard, formatted hint
 *   Relationship → quick-select chips + free text fallback
 *
 * The relationship chips (Wife, Mother, Father, Brother, Sister, Friend)
 * make it fast to fill the form — most riders know exactly which
 * relationship they're adding. Free text catches edge cases.
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { CustomButton } from '../../components/common/CustomButton';
import { spacing, radius, borderWidth, layout } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import type { ContactFormValues } from '../../hooks/useContactForm';
import type { useContactForm } from '../../hooks/useContactForm';

// ─── Relationship quick-picks ─────────────────────────────────────────────────

const RELATIONSHIP_CHIPS = [
  'Wife', 'Husband', 'Mother', 'Father',
  'Brother', 'Sister', 'Friend', 'Partner',
];

// ─── Types ────────────────────────────────────────────────────────────────────

type FormHook = ReturnType<typeof useContactForm>;

interface ContactFormSheetProps {
  form: FormHook;
  title: string;
  submitLabel: string;
  onSubmit: (values: ContactFormValues) => Promise<void>;
  onCancel: () => void;
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  error?: string;
  touched: boolean;
  children: React.ReactNode;
}

function Field({ label, error, touched, children }: FieldProps): React.JSX.Element {
  const { colors } = useTheme();
  const showError = touched && error !== undefined;

  return (
    <View style={styles.fieldWrapper}>
      <Text style={[textStyles.labelMedium, { color: colors.textSecondary, marginBottom: spacing[2] }]}>
        {label}
      </Text>
      {children}
      {showError && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={12} color={colors.emergency} />
          <Text style={[textStyles.caption, { color: colors.emergency, marginLeft: spacing[1] }]}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContactFormSheet({
  form,
  title,
  submitLabel,
  onSubmit,
  onCancel,
}: ContactFormSheetProps): React.JSX.Element {
  const { colors } = useTheme();

  function getInputStyle(field: keyof ContactFormValues): object {
    const hasError = form.touched[field] && form.errors[field] !== undefined;
    return {
      backgroundColor: colors.surfaceSecondary,
      borderColor: hasError ? colors.emergency : colors.surfaceBorder,
      color: colors.textPrimary,
    };
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.root, { backgroundColor: colors.bgSecondary }]}>
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <Text style={[textStyles.headingLarge, { color: colors.textPrimary }]}>
            {title}
          </Text>
          <TouchableOpacity
            onPress={onCancel}
            style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary }]}
            accessibilityLabel="Cancel"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={20} color={colors.iconSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Name field ──────────────────────────────────────────── */}
          <Field label="Full Name *" error={form.errors.name} touched={form.touched.name}>
            <TextInput
              style={[styles.input, getInputStyle('name')]}
              placeholder="e.g. Priya Sharma"
              placeholderTextColor={colors.textTertiary}
              value={form.values.name}
              onChangeText={(v) => form.setField('name', v)}
              onBlur={() => form.touchField('name')}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              accessibilityLabel="Contact name"
            />
          </Field>

          {/* ── Phone field ─────────────────────────────────────────── */}
          <Field label="Mobile Number *" error={form.errors.phone} touched={form.touched.phone}>
            <View style={styles.phoneRow}>
              {/* Country code badge */}
              <View style={[styles.countryCode, { backgroundColor: colors.surfaceSecondary, borderColor: colors.surfaceBorder }]}>
                <Text style={[textStyles.bodyMedium, { color: colors.textSecondary }]}>🇮🇳 +91</Text>
              </View>
              <TextInput
                style={[styles.input, styles.phoneInput, getInputStyle('phone')]}
                placeholder="98765 43210"
                placeholderTextColor={colors.textTertiary}
                value={form.values.phone}
                onChangeText={(v) => form.setField('phone', v.replace(/\D/g, '').slice(0, 10))}
                onBlur={() => form.touchField('phone')}
                keyboardType="phone-pad"
                maxLength={10}
                returnKeyType="next"
                accessibilityLabel="Phone number"
              />
            </View>
          </Field>

          {/* ── Relationship field ──────────────────────────────────── */}
          <Field
            label="Relationship *"
            error={form.errors.relationship}
            touched={form.touched.relationship}
          >
            {/* Quick-select chips */}
            <View style={styles.chips}>
              {RELATIONSHIP_CHIPS.map((rel) => {
                const isSelected = form.values.relationship === rel;
                return (
                  <TouchableOpacity
                    key={rel}
                    onPress={() => {
                      form.setField('relationship', rel);
                      form.touchField('relationship');
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.accentSubtle : colors.surfaceSecondary,
                        borderColor: isSelected ? colors.accent : colors.surfaceBorder,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={rel}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[
                        textStyles.labelMedium,
                        { color: isSelected ? colors.accent : colors.textSecondary },
                      ]}
                    >
                      {rel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Free text fallback */}
            <TextInput
              style={[styles.input, styles.relationshipInput, getInputStyle('relationship')]}
              placeholder="Or type your own (e.g. Colleague)"
              placeholderTextColor={colors.textTertiary}
              value={RELATIONSHIP_CHIPS.includes(form.values.relationship) ? '' : form.values.relationship}
              onChangeText={(v) => {
                form.setField('relationship', v);
                form.touchField('relationship');
              }}
              onBlur={() => form.touchField('relationship')}
              autoCapitalize="words"
              returnKeyType="done"
              accessibilityLabel="Custom relationship"
            />
          </Field>

          {/* ── Privacy note ────────────────────────────────────────── */}
          <View style={[styles.privacyNote, { backgroundColor: colors.infoSubtle }]}>
            <Ionicons name="lock-closed-outline" size={13} color={colors.info} />
            <Text style={[textStyles.caption, { color: colors.infoText, marginLeft: spacing[2], flex: 1 }]}>
              Contact details are stored locally on your device and never shared without your permission.
            </Text>
          </View>
        </ScrollView>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <View style={[styles.footer, { borderTopColor: colors.divider, backgroundColor: colors.bgSecondary }]}>
          <View style={styles.footerButtons}>
            <View style={styles.cancelBtn}>
              <CustomButton
                label="Cancel"
                onPress={onCancel}
                variant="secondary"
                size="lg"
                fullWidth
              />
            </View>
            <View style={styles.submitBtn}>
              <CustomButton
                label={submitLabel}
                onPress={() => void form.submit(onSubmit)}
                variant="primary"
                size="lg"
                fullWidth
                loading={form.isSubmitting}
                disabled={form.isSubmitting}
              />
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:   { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenHorizontal,
    paddingTop: spacing[6],
    paddingBottom: spacing[4],
    borderBottomWidth: borderWidth.hairline,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll:        { flex: 1 },
  scrollContent: {
    paddingHorizontal: layout.screenHorizontal,
    paddingTop: spacing[5],
    paddingBottom: spacing[6],
    gap: spacing[5],
  },

  fieldWrapper: { gap: 0 },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1.5],
  },

  input: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: borderWidth.thin,
    paddingHorizontal: spacing[4],
    fontSize: 16,
  },
  phoneRow:       { flexDirection: 'row', gap: spacing[2] },
  countryCode: {
    height: 52,
    paddingHorizontal: spacing[3],
    borderRadius: radius.md,
    borderWidth: borderWidth.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneInput:       { flex: 1 },
  relationshipInput: { marginTop: spacing[3] },

  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
    borderWidth: borderWidth.thin,
  },

  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing[3],
    borderRadius: radius.md,
  },

  footer: {
    padding: layout.screenHorizontal,
    borderTopWidth: borderWidth.hairline,
  },
  footerButtons: { flexDirection: 'row', gap: spacing[3] },
  cancelBtn:     { flex: 1 },
  submitBtn:     { flex: 2 },
});
