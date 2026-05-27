import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { STORAGE_KEYS } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { StorageService } from '../../storage/StorageService';
import type { AuthProfile } from '../../types';

interface AuthScreenProps {
  onAuthenticated?: () => void;
}

interface AuthSessionPayload {
  isLoggedIn: boolean;
  loggedInAt: number;
  displayName: string;
}

type Mode = 'login' | 'signup';
type LoginField = 'loginMobileNo' | 'loginPassword';
type SignupField =
  | 'fullName'
  | 'email'
  | 'mobileNo'
  | 'bloodGroup'
  | 'aadharCard'
  | 'additionalMedicalInfo'
  | 'signupPassword'
  | 'confirmPassword';

type LoginErrors = Partial<Record<LoginField, string>>;
type SignupErrors = Partial<Record<SignupField, string>>;

const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

function normalizeDigits(value: string): string {
  return value.replace(/\D+/g, '');
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidBloodGroup(value: string): boolean {
  return BLOOD_GROUP_OPTIONS.includes(value.trim().toUpperCase() as (typeof BLOOD_GROUP_OPTIONS)[number]);
}

function isValidPassword(value: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value);
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const [mode, setMode] = useState<Mode>('login');

  const [loginMobileNo, setLoginMobileNo] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [aadharCard, setAadharCard] = useState('');
  const [additionalMedicalInfo, setAdditionalMedicalInfo] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [signupErrors, setSignupErrors] = useState<SignupErrors>({});

  const palette = useMemo(
    () => ({
      background: colors.bgPrimary,
      card: colors.surfacePrimary,
      cardBorder: colors.surfaceBorder,
      title: colors.textPrimary,
      inputBg: isDark ? '#1C1F22' : colors.bgMuted,
      inputBorder: isDark ? '#2B2F33' : colors.surfaceBorder,
      inputText: colors.textPrimary,
      inputPlaceholder: colors.textTertiary,
      buttonBg: isDark ? '#1B1E21' : colors.bgSecondary,
      buttonBorder: isDark ? '#2E3236' : colors.surfaceBorder,
      buttonText: colors.textPrimary,
      switchText: colors.textSecondary,
      switchLink: colors.accent,
      cardShadow: isDark ? '#000000' : '#64748B',
      error: colors.emergency,
    }),
    [colors, isDark],
  );

  function switchMode(nextMode: Mode): void {
    setMode(nextMode);
    setLoginErrors({});
    setSignupErrors({});
  }

  async function setSession(displayName: string): Promise<void> {
    const session: AuthSessionPayload = {
      isLoggedIn: true,
      loggedInAt: Date.now(),
      displayName,
    };
    await StorageService.set(STORAGE_KEYS.AUTH_SESSION, session);
    onAuthenticated?.();
  }

  function validateLoginForm(): LoginErrors {
    const errors: LoginErrors = {};
    const mobile = normalizeDigits(loginMobileNo);

    if (!loginMobileNo.trim()) {
      errors.loginMobileNo = 'Mobile number is required.';
    } else if (!/^[6-9]\d{9}$/.test(mobile)) {
      errors.loginMobileNo = 'Enter a valid 10-digit Indian mobile number.';
    }

    if (!loginPassword) {
      errors.loginPassword = 'Password is required.';
    }
    return errors;
  }

  function validateSignupForm(): SignupErrors {
    const errors: SignupErrors = {};
    const name = fullName.trim();
    const mail = email.trim().toLowerCase();
    const mobile = normalizeDigits(mobileNo);
    const aadhar = normalizeDigits(aadharCard);
    const bg = bloodGroup.trim().toUpperCase();

    if (!name) errors.fullName = 'Full name is required.';
    if (!mail) errors.email = 'Email is required.';
    if (!mobileNo.trim()) errors.mobileNo = 'Mobile number is required.';
    if (!bloodGroup.trim()) errors.bloodGroup = 'Blood group is required.';
    if (!aadharCard.trim()) errors.aadharCard = 'Aadhaar number is required.';
    if (!signupPassword) errors.signupPassword = 'Password is required.';
    if (!confirmPassword) errors.confirmPassword = 'Confirm password is required.';

    if (name && name.length < 3) {
      errors.fullName = 'Full name must be at least 3 characters.';
    }
    if (mail && !isValidEmail(mail)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (mobileNo.trim() && !/^[6-9]\d{9}$/.test(mobile)) {
      errors.mobileNo = 'Enter a valid 10-digit Indian mobile number.';
    }
    if (bloodGroup.trim() && !isValidBloodGroup(bg)) {
      errors.bloodGroup = 'Use valid blood group (A+, O-, AB+, etc.).';
    }
    if (aadharCard.trim() && !/^\d{12}$/.test(aadhar)) {
      errors.aadharCard = 'Aadhaar must be exactly 12 digits.';
    }
    if (additionalMedicalInfo.trim() && additionalMedicalInfo.trim().length > 300) {
      errors.additionalMedicalInfo = 'Additional medical info must be under 300 characters.';
    }
    if (signupPassword && !isValidPassword(signupPassword)) {
      errors.signupPassword = 'Min 8 chars with upper, lower, number, special char.';
    }
    if (confirmPassword && confirmPassword !== signupPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    return errors;
  }

  async function handleLogin(): Promise<void> {
    const errors = validateLoginForm();
    setLoginErrors(errors);
    if (Object.keys(errors).length > 0) {
      Alert.alert('Validation error', 'Please fix login fields.');
      return;
    }

    const profileResult = await StorageService.get<AuthProfile>(STORAGE_KEYS.AUTH_PROFILE);
    if (!profileResult.success || profileResult.data === null) {
      Alert.alert('No account found', 'Please sign up first.');
      switchMode('signup');
      return;
    }

    const profile = profileResult.data;
    const mobileMatch = normalizeDigits(loginMobileNo) === profile.mobileNo;
    const passwordMatch = loginPassword === profile.password;

    if (!mobileMatch || !passwordMatch) {
      Alert.alert('Login failed', 'Invalid mobile number or password.');
      return;
    }

    await setSession(profile.fullName);
  }

  async function handleSignup(): Promise<void> {
    const errors = validateSignupForm();
    setSignupErrors(errors);
    if (Object.keys(errors).length > 0) {
      Alert.alert('Validation error', 'Please correct highlighted signup fields.');
      return;
    }

    const payload: AuthProfile = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      mobileNo: normalizeDigits(mobileNo),
      bloodGroup: bloodGroup.trim().toUpperCase(),
      aadharCard: normalizeDigits(aadharCard),
      additionalMedicalInfo: additionalMedicalInfo.trim(),
      password: signupPassword,
      createdAt: Date.now(),
    };

    await StorageService.set(STORAGE_KEYS.AUTH_PROFILE, payload);
    await setSession(payload.fullName);
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: palette.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.card,
              borderColor: palette.cardBorder,
              shadowColor: palette.cardShadow,
            },
          ]}
        >
          <Text style={[styles.formDetails, { color: palette.title }]}>
            {mode === 'login' ? 'Login' : 'Sign Up'}
          </Text>

          {mode === 'login' ? (
            <>
              <TextInput
                placeholder="Mobile Number"
                placeholderTextColor={palette.inputPlaceholder}
                style={[
                  styles.input,
                  {
                    color: palette.inputText,
                    backgroundColor: palette.inputBg,
                    borderColor: palette.inputBorder,
                    shadowColor: palette.cardShadow,
                  },
                ]}
                value={loginMobileNo}
                onChangeText={(value) => {
                  setLoginMobileNo(value);
                  if (loginErrors.loginMobileNo) {
                    setLoginErrors((prev) => ({ ...prev, loginMobileNo: undefined }));
                  }
                }}
                keyboardType="number-pad"
                autoCorrect={false}
              />
              {loginErrors.loginMobileNo ? (
                <Text style={[styles.errorText, { color: palette.error }]}>{loginErrors.loginMobileNo}</Text>
              ) : null}

              <TextInput
                placeholder="Password"
                placeholderTextColor={palette.inputPlaceholder}
                style={[
                  styles.input,
                  {
                    color: palette.inputText,
                    backgroundColor: palette.inputBg,
                    borderColor: palette.inputBorder,
                    shadowColor: palette.cardShadow,
                  },
                ]}
                value={loginPassword}
                onChangeText={(value) => {
                  setLoginPassword(value);
                  if (loginErrors.loginPassword) {
                    setLoginErrors((prev) => ({ ...prev, loginPassword: undefined }));
                  }
                }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              {loginErrors.loginPassword ? (
                <Text style={[styles.errorText, { color: palette.error }]}>{loginErrors.loginPassword}</Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.btn,
                  {
                    backgroundColor: palette.buttonBg,
                    borderColor: palette.buttonBorder,
                    shadowColor: palette.cardShadow,
                  },
                ]}
                onPress={() => void handleLogin()}
              >
                <Text style={[styles.btnText, { color: palette.buttonText }]}>Login</Text>
              </TouchableOpacity>

              <Text style={[styles.switchText, { color: palette.switchText }]}>
                Don't have an account?{' '}
                <Text style={[styles.switchLink, { color: palette.switchLink }]} onPress={() => switchMode('signup')}>
                  Sign Up
                </Text>
              </Text>
            </>
          ) : (
            <>
              <TextInput
                placeholder="Full Name"
                placeholderTextColor={palette.inputPlaceholder}
                style={[
                  styles.input,
                  {
                    color: palette.inputText,
                    backgroundColor: palette.inputBg,
                    borderColor: palette.inputBorder,
                    shadowColor: palette.cardShadow,
                  },
                ]}
                value={fullName}
                onChangeText={(value) => {
                  setFullName(value);
                  if (signupErrors.fullName) setSignupErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
              />
              {signupErrors.fullName ? (
                <Text style={[styles.errorText, { color: palette.error }]}>{signupErrors.fullName}</Text>
              ) : null}

              <TextInput
                placeholder="Email"
                placeholderTextColor={palette.inputPlaceholder}
                style={[
                  styles.input,
                  {
                    color: palette.inputText,
                    backgroundColor: palette.inputBg,
                    borderColor: palette.inputBorder,
                    shadowColor: palette.cardShadow,
                  },
                ]}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (signupErrors.email) setSignupErrors((prev) => ({ ...prev, email: undefined }));
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
              {signupErrors.email ? (
                <Text style={[styles.errorText, { color: palette.error }]}>{signupErrors.email}</Text>
              ) : null}

              <TextInput
                placeholder="Mobile Number"
                placeholderTextColor={palette.inputPlaceholder}
                style={[
                  styles.input,
                  {
                    color: palette.inputText,
                    backgroundColor: palette.inputBg,
                    borderColor: palette.inputBorder,
                    shadowColor: palette.cardShadow,
                  },
                ]}
                value={mobileNo}
                onChangeText={(value) => {
                  setMobileNo(value);
                  if (signupErrors.mobileNo) setSignupErrors((prev) => ({ ...prev, mobileNo: undefined }));
                }}
                keyboardType="number-pad"
                autoCorrect={false}
              />
              {signupErrors.mobileNo ? (
                <Text style={[styles.errorText, { color: palette.error }]}>{signupErrors.mobileNo}</Text>
              ) : null}

              <View style={styles.bloodGroupWrap}>
                <Text style={[styles.selectorLabel, { color: palette.inputText }]}>Blood Group</Text>
                <View style={styles.bloodGroupGrid}>
                  {BLOOD_GROUP_OPTIONS.map((option) => {
                    const selected = bloodGroup === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.bloodGroupOption,
                          {
                            backgroundColor: selected ? palette.switchLink : palette.inputBg,
                            borderColor: selected ? palette.switchLink : palette.inputBorder,
                          },
                        ]}
                        onPress={() => {
                          setBloodGroup(option);
                          if (signupErrors.bloodGroup) {
                            setSignupErrors((prev) => ({ ...prev, bloodGroup: undefined }));
                          }
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Select blood group ${option}`}
                      >
                        <Text
                          style={[
                            styles.bloodGroupOptionText,
                            { color: selected ? palette.buttonText : palette.inputText },
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              {signupErrors.bloodGroup ? (
                <Text style={[styles.errorText, { color: palette.error }]}>{signupErrors.bloodGroup}</Text>
              ) : null}

              <TextInput
                placeholder="Aadhaar Card Number"
                placeholderTextColor={palette.inputPlaceholder}
                style={[
                  styles.input,
                  {
                    color: palette.inputText,
                    backgroundColor: palette.inputBg,
                    borderColor: palette.inputBorder,
                    shadowColor: palette.cardShadow,
                  },
                ]}
                value={aadharCard}
                onChangeText={(value) => {
                  setAadharCard(value);
                  if (signupErrors.aadharCard) setSignupErrors((prev) => ({ ...prev, aadharCard: undefined }));
                }}
                keyboardType="number-pad"
                autoCorrect={false}
              />
              {signupErrors.aadharCard ? (
                <Text style={[styles.errorText, { color: palette.error }]}>{signupErrors.aadharCard}</Text>
              ) : null}

              <TextInput
                placeholder="Additional Medical Information (optional)"
                placeholderTextColor={palette.inputPlaceholder}
                style={[
                  styles.input,
                  styles.multilineInput,
                  {
                    color: palette.inputText,
                    backgroundColor: palette.inputBg,
                    borderColor: palette.inputBorder,
                    shadowColor: palette.cardShadow,
                  },
                ]}
                value={additionalMedicalInfo}
                onChangeText={(value) => {
                  setAdditionalMedicalInfo(value);
                  if (signupErrors.additionalMedicalInfo) {
                    setSignupErrors((prev) => ({ ...prev, additionalMedicalInfo: undefined }));
                  }
                }}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                autoCorrect={false}
              />
              {signupErrors.additionalMedicalInfo ? (
                <Text style={[styles.errorText, { color: palette.error }]}>{signupErrors.additionalMedicalInfo}</Text>
              ) : null}

              <TextInput
                placeholder="Password"
                placeholderTextColor={palette.inputPlaceholder}
                style={[
                  styles.input,
                  {
                    color: palette.inputText,
                    backgroundColor: palette.inputBg,
                    borderColor: palette.inputBorder,
                    shadowColor: palette.cardShadow,
                  },
                ]}
                value={signupPassword}
                onChangeText={(value) => {
                  setSignupPassword(value);
                  if (signupErrors.signupPassword) setSignupErrors((prev) => ({ ...prev, signupPassword: undefined }));
                }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              {signupErrors.signupPassword ? (
                <Text style={[styles.errorText, { color: palette.error }]}>{signupErrors.signupPassword}</Text>
              ) : null}

              <TextInput
                placeholder="Confirm Password"
                placeholderTextColor={palette.inputPlaceholder}
                style={[
                  styles.input,
                  {
                    color: palette.inputText,
                    backgroundColor: palette.inputBg,
                    borderColor: palette.inputBorder,
                    shadowColor: palette.cardShadow,
                  },
                ]}
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  if (signupErrors.confirmPassword) setSignupErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              {signupErrors.confirmPassword ? (
                <Text style={[styles.errorText, { color: palette.error }]}>{signupErrors.confirmPassword}</Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.btn,
                  {
                    backgroundColor: palette.buttonBg,
                    borderColor: palette.buttonBorder,
                    shadowColor: palette.cardShadow,
                  },
                ]}
                onPress={() => void handleSignup()}
              >
                <Text style={[styles.btnText, { color: palette.buttonText }]}>Signup</Text>
              </TouchableOpacity>

              <Text style={[styles.switchText, { color: palette.switchText }]}>
                Already have an account?{' '}
                <Text style={[styles.switchLink, { color: palette.switchLink }]} onPress={() => switchMode('login')}>
                  Sign In
                </Text>
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    paddingVertical: 30,
    paddingHorizontal: 22,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  formDetails: {
    fontSize: 27,
    fontWeight: '700',
    marginBottom: 14,
  },
  input: {
    width: '100%',
    minHeight: 46,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 7,
    borderWidth: 2,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.85,
    shadowRadius: 8,
    elevation: 5,
  },
  multilineInput: {
    minHeight: 84,
    paddingTop: 10,
  },
  btn: {
    marginTop: 4,
    minHeight: 42,
    width: 140,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 5,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  switchText: {
    marginTop: 16,
    fontSize: 13,
    textAlign: 'center',
  },
  switchLink: {
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  errorText: {
    width: '100%',
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  bloodGroupWrap: {
    width: '100%',
    marginBottom: 6,
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  bloodGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodGroupOption: {
    width: '23%',
    minHeight: 42,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodGroupOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
