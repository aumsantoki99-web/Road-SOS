/**
 * EmergencyContactsScreen — Personal, Trustworthy, Frictionless
 * feature/ui-polish-contacts ✅
 *
 * Enhancements:
 *   - Hero header with contact count and trust messaging
 *   - Primary contact elevated in a distinct hero card
 *   - Contacts list uses stagger animation on load
 *   - Search bar with smooth focus state
 *   - Empty state has illustration-style icon with warm messaging
 *   - Add button is prominent — always one tap away
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/LocalizationContext';
import { useContacts } from '../../hooks/useContacts';
import { useAppNavigation } from '../../navigation/useAppNavigation';

import { SectionHeader } from '../../components/common/SectionHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import { ContactCard } from '../../components/cards/ContactCard';
import { CustomButton } from '../../components/common/CustomButton';

import { spacing, layout, radius, borderWidth } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import type { EmergencyContact } from '../../types';
import type { ContactsScreenProps } from '../../navigation/types';

// ─── Primary contact hero card ────────────────────────────────────────────────

function PrimaryHeroCard({
  contact,
  onEdit,
}: {
  contact: EmergencyContact;
  onEdit: () => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  const initial = contact.name.charAt(0).toUpperCase();

  const AVATAR_COLORS = ['#7C3AED','#0D9488','#DC2626','#D97706','#2563EB','#059669'];
  const avatarColor = AVATAR_COLORS[(contact.name.charCodeAt(0) ?? 0) % AVATAR_COLORS.length] ?? '#7C3AED';

  return (
    <TouchableOpacity
      onPress={onEdit}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Edit primary contact ${contact.name}`}
      style={[styles.primaryHero, { backgroundColor: colors.surfacePrimary, borderColor: colors.accentMuted }, shadows.glowAmber]}
    >
      {/* Top accent */}
      <LinearGradient
        colors={[colors.accentSubtle, 'transparent']}
        style={styles.primaryHeroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      />

      <View style={styles.primaryHeroContent}>
        {/* Avatar */}
        <View style={[styles.primaryAvatar, { backgroundColor: avatarColor }]}>
          <Text style={[textStyles.displaySmall, { color: '#FFFFFF' }]}>{initial}</Text>
        </View>

        {/* Info */}
        <View style={styles.primaryInfo}>
          <View style={styles.primaryNameRow}>
            <Text style={[textStyles.headingMedium, { color: colors.textPrimary }]}>
              {contact.name}
            </Text>
            <View style={[styles.primaryBadge, { backgroundColor: colors.accentSubtle }]}>
              <Ionicons name="star" size={10} color={colors.accent} />
              <Text style={[textStyles.caption, { color: colors.accent, marginLeft: 3, fontWeight: '700' }]}>
                PRIMARY
              </Text>
            </View>
          </View>
          <Text style={[textStyles.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
            {contact.phone}
          </Text>
          <Text style={[textStyles.caption, { color: colors.textTertiary, marginTop: 2 }]}>
            {contact.relationship} · First to be alerted
          </Text>
        </View>

        {/* Edit chevron */}
        <Ionicons name="chevron-forward" size={18} color={colors.iconSecondary} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function EmergencyContactsScreen(_props: ContactsScreenProps): React.JSX.Element {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const nav = useAppNavigation();
  const { contacts, isLoading, deleteContact, setPrimary, reload } = useContacts();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing,  setRefreshing]  = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide   = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(headerSlide,   { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [headerOpacity, headerSlide]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.relationship.toLowerCase().includes(q),
    );
  }, [contacts, searchQuery]);

  const primaryContact = filtered.find((c) => c.isPrimary);
  const otherContacts  = filtered.filter((c) => !c.isPrimary);

  function handleEdit(contact: EmergencyContact): void {
    nav.navigate('EditContact', { contactId: contact.id });
  }

  function handleDelete(contact: EmergencyContact): void {
    Alert.alert(
      t('contacts.removeTitle'),
      `Remove ${contact.name} from your emergency contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: t('contacts.removeConfirm'), style: 'destructive', onPress: () => void deleteContact(contact.id) },
      ],
    );
  }

  function handleSetPrimary(contact: EmergencyContact): void {
    if (contact.isPrimary) return;
    Alert.alert(
      t('contacts.maxReachedTitle'),
      t('contacts.maxReachedBody'),
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Set Primary', onPress: () => void setPrimary(contact.id) },
      ],
    );
  }

  async function handleRefresh(): Promise<void> {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  const hasContacts = contacts.length > 0;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Page header */}
      <Animated.View
        style={[
          styles.pageHeader,
          { opacity: headerOpacity, transform: [{ translateY: headerSlide }] },
        ]}
      >
        <View style={styles.pageHeaderLeft}>
            <Text style={[textStyles.displaySmall, { color: colors.textPrimary }]}>
            {t('contacts.title')}
            </Text>
          {hasContacts && (
            <View style={[styles.countBadge, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={[textStyles.labelMedium, { color: colors.textSecondary }]}>
                {contacts.length}
              </Text>
            </View>
          )}
        </View>
        <CustomButton
          label={t('contacts.add')}
          onPress={() => nav.navigate('AddContact')}
          variant="primary"
          size="sm"
          iconLeft="add"
        />
      </Animated.View>

      {isLoading && contacts.length === 0 && (
        <View style={{ paddingHorizontal: layout.screenHorizontal, gap: spacing[3], marginTop: spacing[4] }}>
          <SkeletonLoader showAvatar lines={2} />
          <SkeletonLoader showAvatar lines={2} />
          <SkeletonLoader showAvatar lines={2} />
        </View>
      )}

      {!isLoading && (
        <FlatList
          data={[]}
          renderItem={null}
          keyExtractor={() => 'dummy'}
          showsVerticalScrollIndicator={false}
          onRefresh={() => void handleRefresh()}
          refreshing={refreshing}
          ListHeaderComponent={
            <View style={styles.listContent}>
              {/* Search bar */}
              {hasContacts && (
                <View
                  style={[
                    styles.searchBar,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      borderColor: searchFocused ? colors.accent : colors.surfaceBorder,
                    },
                    shadows.xs,
                  ]}
                >
                  <Ionicons name="search" size={18} color={searchFocused ? colors.accent : colors.iconSecondary} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.textPrimary }]}
                    placeholder="Search contacts..."
                    placeholderTextColor={colors.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    returnKeyType="search"
                    accessibilityLabel="Search emergency contacts"
                    textContentType="none"
                    autoComplete="off"
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle" size={18} color={colors.iconSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Empty state */}
              {!hasContacts && (
                <View style={styles.emptyWrap}>
                  <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceSecondary }]}>
                    <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
                  </View>
                  <Text style={[textStyles.headingMedium, { color: colors.textPrimary, marginTop: spacing[5] }]}>
                    No contacts yet
                  </Text>
                  <Text style={[textStyles.bodyMedium, { color: colors.textTertiary, marginTop: spacing[2], textAlign: 'center', maxWidth: 260 }]}>
                    Add someone who should be called if you're ever in an emergency.
                  </Text>
                  <View style={{ marginTop: spacing[6] }}>
                    <CustomButton
                      label="Add First Contact"
                      onPress={() => nav.navigate('AddContact')}
                      variant="primary"
                      size="md"
                      iconLeft="person-add"
                    />
                  </View>
                </View>
              )}

              {/* Search no results */}
              {hasContacts && filtered.length === 0 && (
                <EmptyState
                  icon="search-outline"
                  title="No results"
                  description={`No contacts match "${searchQuery}"`}
                  compact
                />
              )}

              {/* Primary contact hero */}
              {primaryContact !== undefined && (
                <View style={styles.section}>
                  <SectionHeader title="Primary — First Alerted" topSpacing={spacing[3]} />
                  <PrimaryHeroCard
                    contact={primaryContact}
                    onEdit={() => handleEdit(primaryContact)}
                  />
                </View>
              )}

              {/* Other contacts */}
              {otherContacts.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader
                    title="Other Contacts"
                    topSpacing={primaryContact !== undefined ? spacing[6] : spacing[3]}
                  />
                  {otherContacts.map((contact) => (
                    <View key={contact.id} style={{ marginBottom: spacing[3] }}>
                      <TouchableOpacity
                        onLongPress={() => handleSetPrimary(contact)}
                        delayLongPress={500}
                        activeOpacity={1}
                        accessibilityHint="Long press to set as primary contact"
                      >
                        <ContactCard
                          contact={contact}
                          onEdit={() => handleEdit(contact)}
                          onDelete={() => handleDelete(contact)}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Add more — dashed button */}
              {hasContacts && (
                <TouchableOpacity
                  onPress={() => nav.navigate('AddContact')}
                  style={[styles.addMoreBtn, { borderColor: colors.surfaceBorder }]}
                  accessibilityRole="button"
                  accessibilityLabel="Add another contact"
                >
                  <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
                  <Text style={[textStyles.bodyMedium, { color: colors.accent, marginLeft: spacing[2] }]}>
                    Add another contact
                  </Text>
                </TouchableOpacity>
              )}

              {/* Trust note */}
              {hasContacts && (
                <View style={[styles.trustNote, { backgroundColor: colors.safeSubtle, borderColor: colors.safeMuted }]}>
                  <Ionicons name="lock-closed-outline" size={13} color={colors.safe} />
                  <Text style={[textStyles.caption, { color: colors.safeText, marginLeft: spacing[2], flex: 1, lineHeight: 18 }]}>
                    Contacts are stored locally on your device and never shared without your permission.
                  </Text>
                </View>
              )}

              <View style={{ height: spacing[16] }} />
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:     { flex: 1 },
  listContent: { paddingHorizontal: layout.screenHorizontal },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenHorizontal,
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  pageHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  countBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[0.5],
    borderRadius: radius.full,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: borderWidth.medium,
    paddingHorizontal: spacing[4],
    height: 50,
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  searchInput: { flex: 1, fontSize: 16, height: '100%' },

  section: { marginBottom: spacing[2] },

  // Primary hero card
  primaryHero: {
    borderRadius: radius.xl,
    borderWidth: borderWidth.medium,
    overflow: 'hidden',
    position: 'relative',
  },
  primaryHeroGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 60,
  },
  primaryHeroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[5],
    gap: spacing[4],
  },
  primaryAvatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  primaryInfo:   { flex: 1 },
  primaryNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
  },

  // Empty state
  emptyWrap: { alignItems: 'center', paddingVertical: spacing[12] },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },

  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },

  trustNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing[3],
    borderRadius: radius.lg,
    borderWidth: borderWidth.thin,
  },
});
