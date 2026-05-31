/**
 * EditContactScreen — Modal: Edit Emergency Contact
 *
 * Pre-fills the form with the existing contact's values.
 * Receives contactId via route params — looks up from useContacts.
 *
 * If the contactId is not found (edge case: deleted in background),
 * shows a friendly error and goes back.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useContacts } from '../../hooks/useContacts';
import { useContactForm } from '../../hooks/useContactForm';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { ContactFormSheet } from './ContactFormSheet';
import { CustomButton } from '../../components/common/CustomButton';
import { textStyles } from '../../theme/typography';
import { spacing, layout } from '../../theme/spacing';
import type { ContactFormValues } from '../../hooks/useContactForm';
import type { EditContactScreenProps } from '../../navigation/types';

function EditContactFormInner({ contact }: { contact: any }): React.JSX.Element {
  const { colors } = useTheme();
  const nav = useAppNavigation();
  const { editContact } = useContacts();

  const form = useContactForm({
    name: contact.name,
    phone: contact.phone,
    relationship: contact.relationship,
  });

  async function handleSubmit(values: ContactFormValues): Promise<void> {
    await editContact(contact.id, values);
    nav.goBack();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgSecondary }} edges={['top', 'bottom']}>
      <ContactFormSheet
        form={form}
        title="Edit Contact"
        submitLabel="Save Changes"
        onSubmit={handleSubmit}
        onCancel={() => nav.goBack()}
      />
    </SafeAreaView>
  );
}

export function EditContactScreen({ route }: EditContactScreenProps): React.JSX.Element {
  const { colors } = useTheme();
  const nav = useAppNavigation();
  const { contacts, isLoading } = useContacts();
  const { contactId } = route.params;

  // Wait for contacts to load
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.bgSecondary }]} edges={['top']}>
        <View style={styles.errorState}>
          <Text style={[textStyles.bodyMedium, { color: colors.textSecondary }]}>
            Loading contact...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const contact = contacts.find((c) => c.id === contactId);

  // Contact not found — edge case
  if (!contact) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.bgSecondary }]} edges={['top']}>
        <View style={styles.errorState}>
          <Text style={[textStyles.headingMedium, { color: colors.textPrimary }]}>
            Contact not found
          </Text>
          <Text style={[textStyles.bodyMedium, { color: colors.textTertiary, marginTop: spacing[2] }]}>
            This contact may have been deleted.
          </Text>
          <View style={{ marginTop: spacing[6] }}>
            <CustomButton label="Go Back" onPress={() => nav.goBack()} variant="secondary" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return <EditContactFormInner contact={contact} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenHorizontal,
  },
});
