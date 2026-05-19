/**
 * AddContactScreen — Modal: Add Emergency Contact
 *
 * Thin wrapper around ContactFormSheet.
 * All logic delegated to useContactForm + useContacts.
 *
 * On success: dismisses modal, parent list refreshes via
 * AsyncStorage — no prop drilling needed.
 */

import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useContacts } from '../../hooks/useContacts';
import { useContactForm } from '../../hooks/useContactForm';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { ContactFormSheet } from './ContactFormSheet';
import type { ContactFormValues } from '../../hooks/useContactForm';

export function AddContactScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const nav = useAppNavigation();
  const { addContact } = useContacts();
  const form = useContactForm();

  async function handleSubmit(values: ContactFormValues): Promise<void> {
    await addContact(values);
    nav.goBack();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgSecondary }} edges={['top', 'bottom']}>
      <ContactFormSheet
        form={form}
        title="Add Contact"
        submitLabel="Save Contact"
        onSubmit={handleSubmit}
        onCancel={() => nav.goBack()}
      />
    </SafeAreaView>
  );
}
