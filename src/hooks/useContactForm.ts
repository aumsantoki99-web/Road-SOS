/**
 * useContactForm — Contact form state + validation
 *
 * Manages field state, touched tracking, and validation rules
 * for both Add and Edit contact forms.
 *
 * Validation rules:
 *   name         → required, 2+ chars
 *   phone        → required, valid Indian mobile (6-9 start, 10 digits)
 *   relationship → required
 *
 * Usage:
 *   const form = useContactForm(initialValues);
 *   form.setField('name', 'Priya');
 *   form.submit(async (values) => await addContact(values));
 */

import { useCallback, useState, useEffect } from 'react';
import { isValidPhone, isNonEmpty } from '../utils';
import { COUNTRY_CODES } from '../components/common/CountrySelectionModal';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContactFormValues {
  name: string;
  phone: string;
  relationship: string;
}

interface FieldErrors {
  name?: string;
  phone?: string;
  relationship?: string;
}

interface ContactFormResult {
  values: ContactFormValues;
  errors: FieldErrors;
  touched: Record<keyof ContactFormValues, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  setField: (field: keyof ContactFormValues, value: string) => void;
  touchField: (field: keyof ContactFormValues) => void;
  submit: (onSubmit: (values: ContactFormValues) => Promise<void>) => Promise<void>;
  reset: () => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_VALUES: ContactFormValues = {
  name: '',
  phone: '',
  relationship: '',
};

const DEFAULT_TOUCHED = { name: false, phone: false, relationship: false };

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(values: ContactFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!isNonEmpty(values.name)) {
    errors.name = 'Name is required';
  } else if (values.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!isNonEmpty(values.phone)) {
    errors.phone = 'Phone number is required';
  } else {
    let localPart = values.phone;
    for (const country of COUNTRY_CODES) {
      if (localPart.startsWith(country.code)) {
        localPart = localPart.slice(country.code.length);
        break;
      }
    }
    const cleanLocal = localPart.replace(/\D/g, '');
    if (cleanLocal.length !== 10) {
      errors.phone = 'Mobile number must be exactly 10 digits (excluding country code)';
    }
  }

  if (!isNonEmpty(values.relationship)) {
    errors.relationship = 'Relationship is required';
  }

  return errors;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useContactForm(
  initial: Partial<ContactFormValues> = {},
): ContactFormResult {
  const [values, setValues] = useState<ContactFormValues>({
    ...DEFAULT_VALUES,
    ...initial,
  });
  const [touched, setTouched] = useState<Record<keyof ContactFormValues, boolean>>(DEFAULT_TOUCHED);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setValues((prev) => ({
      name: initial.name ?? prev.name,
      phone: initial.phone ?? prev.phone,
      relationship: initial.relationship ?? prev.relationship,
    }));
  }, [initial.name, initial.phone, initial.relationship]);

  const errors = validate(values);
  const isValid = Object.keys(errors).length === 0;

  const setField = useCallback((
    field: keyof ContactFormValues,
    value: string,
  ): void => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const touchField = useCallback((field: keyof ContactFormValues): void => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const submit = useCallback(async (
    onSubmit: (values: ContactFormValues) => Promise<void>,
  ): Promise<void> => {
    // Touch all fields to show all errors
    setTouched({ name: true, phone: true, relationship: true });

    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [isValid, values]);

  const reset = useCallback((): void => {
    setValues(DEFAULT_VALUES);
    setTouched(DEFAULT_TOUCHED);
    setIsSubmitting(false);
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setField,
    touchField,
    submit,
    reset,
  };
}
