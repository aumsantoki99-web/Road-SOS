import React, { useState } from 'react';
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
  Modal,
} from 'react-native';

import { STORAGE_KEYS } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { StorageService } from '../../storage/StorageService';
import type { AuthProfile } from '../../types';
import { firebaseAuth } from '../../services/firebase';
import { CountrySelectionModal, COUNTRY_CODES, type CountryCodeOption } from '../../components/common/CountrySelectionModal';

interface AuthScreenProps {
  onAuthenticated?: () => void;
}

interface AuthSessionPayload {
  isLoggedIn: boolean;
  loggedInAt: number;
  displayName: string;
}

type AuthMode = 'signup' | 'login';

const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export function AuthScreen({ onAuthenticated }: AuthScreenProps): React.JSX.Element {
  const { colors, isDark } = useTheme();

  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [isBloodGroupModalVisible, setIsBloodGroupModalVisible] = useState(false);
  const [aadharCard, setAadharCard] = useState('');
  const [additionalMedicalInfo, setAdditionalMedicalInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Country selection state
  const [selectedCountry, setSelectedCountry] = useState<CountryCodeOption>(
    COUNTRY_CODES[0] || { code: '+91', flag: '🇮🇳', name: 'India' }
  );
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);

  // Palette derived from theme logic
  const palette = {
    background: colors.bgPrimary,
    cardBg: isDark ? colors.surfacePrimary : '#FFFFFF',
    text: colors.textPrimary,
    textMuted: colors.textSecondary,
    border: colors.surfaceBorder,
    primary: colors.accent,
    primaryText: '#FFFFFF',
    danger: colors.emergency,
  };

  function isValidEmail(val: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }

  function isValidBloodGroup(val: string): boolean {
    return BLOOD_GROUP_OPTIONS.includes(val.trim().toUpperCase() as any);
  }

  async function handleForgotPassword() {
    if (!email.trim() || !isValidEmail(email.trim())) {
      Alert.alert('Validation Error', 'Please enter your registered email address first to reset your password.');
      return;
    }

    setIsLoading(true);
    try {
      await firebaseAuth.sendPasswordResetEmail(email.trim());
      Alert.alert('Success', 'Password reset email sent! Please check your inbox and spam folder.');
    } catch (error: any) {
      console.error('Password Reset Error:', error);
      if (error.code === 'auth/user-not-found') {
        Alert.alert('Error', 'No account found with this email address.');
      } else {
        Alert.alert('Error', 'Failed to send password reset email. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAuth() {
    if (!email.trim() || !isValidEmail(email.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters.');
      return;
    }

    if (authMode === 'signup') {
      if (!fullName.trim() || fullName.length < 3) {
        Alert.alert('Validation Error', 'Please enter a valid full name (min 3 characters).');
        return;
      }
      const cleanMobile = mobileNo.replace(/\D+/g, '');
      if (cleanMobile.length !== 10) {
        Alert.alert('Validation Error', 'Mobile number must be exactly 10 digits.');
        return;
      }
      const bg = bloodGroup.trim().toUpperCase();
      if (!bg || !isValidBloodGroup(bg)) {
        Alert.alert('Validation Error', 'Please select a valid blood group.');
        return;
      }
      const cleanAadhar = aadharCard.replace(/\D+/g, '');
      if (cleanAadhar && !/^\d{12}$/.test(cleanAadhar)) {
        Alert.alert('Validation Error', 'Aadhaar must be exactly 12 digits.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (authMode === 'signup') {
        // Create user in Firebase
        await firebaseAuth.createUserWithEmailAndPassword(email.trim(), password);
        
        // Save local profile
        const payload: AuthProfile = {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          mobileNo: mobileNo.replace(/\D+/g, ''),
          countryCode: selectedCountry.code,
          countryName: selectedCountry.name,
          bloodGroup: bloodGroup.trim().toUpperCase(),
          aadharCard: aadharCard.replace(/\D+/g, ''),
          additionalMedicalInfo: additionalMedicalInfo.trim(),
          passwordHash: 'secured-by-firebase', 
          createdAt: Date.now(),
        };

        await StorageService.set(STORAGE_KEYS.AUTH_PROFILE, payload);
        await StorageService.set(STORAGE_KEYS.MEDICAL_PROFILE, payload);
        await StorageService.set(STORAGE_KEYS.PROFILE_SETUP_DONE, 'true');

        const sessionPayload: AuthSessionPayload = {
          isLoggedIn: true,
          loggedInAt: Date.now(),
          displayName: payload.fullName,
        };
        await StorageService.set(STORAGE_KEYS.AUTH_SESSION, sessionPayload);

      } else {
        // Log in existing user
        await firebaseAuth.signInWithEmailAndPassword(email.trim(), password);
        
        let displayName = 'User';
        const profileRes = await StorageService.get<AuthProfile>(STORAGE_KEYS.AUTH_PROFILE);
        if (profileRes.success && profileRes.data) {
          displayName = profileRes.data.fullName;
        }

        const sessionPayload: AuthSessionPayload = {
          isLoggedIn: true,
          loggedInAt: Date.now(),
          displayName,
        };
        await StorageService.set(STORAGE_KEYS.AUTH_SESSION, sessionPayload);
        
        // Mark setup as done in case they uninstalled and reinstalled
        await StorageService.set(STORAGE_KEYS.PROFILE_SETUP_DONE, 'true');
      }

      if (onAuthenticated) {
        onAuthenticated();
      }
    } catch (error: any) {
      console.error('Auth Error:', error);
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'That email address is already registered. Try logging in.');
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        Alert.alert('Error', 'Invalid email or password.');
      } else {
        Alert.alert('Authentication Error', 'Failed to authenticate. Please check your credentials and internet connection.');
      }
    } finally {
      setIsLoading(false);
    }
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
            { backgroundColor: palette.cardBg, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.title, { color: palette.primary }]}>
            {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={[styles.subtitle, { color: palette.textMuted }]}>
            {authMode === 'signup' 
              ? 'Complete your emergency profile to continue.' 
              : 'Log in to access your emergency profile.'}
          </Text>

          <TextInput
            style={[
              styles.input,
              { color: palette.text, borderColor: palette.border, backgroundColor: palette.cardBg },
            ]}
            placeholder="Email Address *"
            placeholderTextColor={palette.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            maxLength={100}
            editable={!isLoading}
            textContentType="emailAddress"
            autoComplete="email"
            autoCorrect={false}
          />

          <TextInput
            style={[
              styles.input,
              { color: palette.text, borderColor: palette.border, backgroundColor: palette.cardBg },
            ]}
            placeholder="Password *"
            placeholderTextColor={palette.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            maxLength={50}
            editable={!isLoading}
            textContentType="password"
            autoComplete="password"
          />

          {authMode === 'signup' && (
            <>
              <View style={styles.divider} />
              <Text style={[styles.formDetails, { color: palette.text }]}>Personal Details</Text>

              <TextInput
                style={[
                  styles.input,
                  { color: palette.text, borderColor: palette.border, backgroundColor: palette.cardBg },
                ]}
                placeholder="Full Name *"
                placeholderTextColor={palette.textMuted}
                value={fullName}
                onChangeText={setFullName}
                maxLength={50}
                editable={!isLoading}
                textContentType="name"
                autoComplete="name"
                autoCapitalize="words"
                autoCorrect={false}
              />

              <View style={{ flexDirection: 'row', width: '100%', gap: 8, marginBottom: 16 }}>
                <TouchableOpacity
                  style={[
                    styles.input,
                    { flex: 0.3, justifyContent: 'center', alignItems: 'center', marginBottom: 0, borderColor: palette.border, backgroundColor: palette.cardBg },
                  ]}
                  onPress={() => setIsCountryModalVisible(true)}
                  disabled={isLoading}
                >
                  <Text style={{ color: palette.text, fontSize: 16 }}>
                    {selectedCountry.flag} {selectedCountry.code}
                  </Text>
                </TouchableOpacity>
                <TextInput
                  style={[
                    styles.input,
                    { flex: 0.7, color: palette.text, borderColor: palette.border, backgroundColor: palette.cardBg, marginBottom: 0 },
                  ]}
                  placeholder="Mobile Number *"
                  placeholderTextColor={palette.textMuted}
                  keyboardType="numeric"
                  maxLength={15}
                  value={mobileNo}
                  onChangeText={setMobileNo}
                  editable={!isLoading}
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                />
              </View>

              <View style={styles.row}>
                <TouchableOpacity
                  style={[
                    styles.input,
                    styles.flexInput,
                    { justifyContent: 'center', borderColor: palette.border, backgroundColor: palette.cardBg, marginRight: 8 },
                  ]}
                  onPress={() => setIsBloodGroupModalVisible(true)}
                  disabled={isLoading}
                >
                  <Text style={{ color: bloodGroup ? palette.text : palette.textMuted, fontSize: 16 }}>
                    {bloodGroup || 'Blood Group *'}
                  </Text>
                </TouchableOpacity>
                
                <TextInput
                  style={[
                    styles.input,
                    styles.flexInput,
                    { color: palette.text, borderColor: palette.border, backgroundColor: palette.cardBg, marginLeft: 8 },
                  ]}
                  placeholder="Aadhaar (Optional)"
                  placeholderTextColor={palette.textMuted}
                  keyboardType="numeric"
                  maxLength={12}
                  value={aadharCard}
                  onChangeText={setAadharCard}
                  editable={!isLoading}
                  textContentType="none"
                  autoComplete="off"
                />
              </View>

              <TextInput
                style={[
                  styles.input,
                  styles.multilineInput,
                  { color: palette.text, borderColor: palette.border, backgroundColor: palette.cardBg },
                ]}
                placeholder="Medical Conditions / Allergies (Optional)"
                placeholderTextColor={palette.textMuted}
                multiline
                numberOfLines={3}
                value={additionalMedicalInfo}
                onChangeText={setAdditionalMedicalInfo}
                maxLength={500}
                editable={!isLoading}
                autoCapitalize="sentences"
                autoCorrect={true}
              />
            </>
          )}

          {authMode === 'login' && (
            <TouchableOpacity 
              onPress={handleForgotPassword} 
              style={{ width: '100%', alignItems: 'flex-end', marginBottom: 12, marginTop: -8 }}
              disabled={isLoading}
            >
              <Text style={{ color: palette.primary, fontWeight: '600', fontSize: 13 }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: palette.primary, borderColor: palette.primary }]}
            onPress={handleAuth}
            disabled={isLoading}
          >
            <Text style={[styles.btnText, { color: palette.primaryText }]}>
              {isLoading ? 'Processing...' : authMode === 'signup' ? 'Sign Up' : 'Log In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
            style={{ marginTop: 20 }}
            disabled={isLoading}
          >
            <Text style={[styles.switchLink, { color: palette.primary }]}>
              {authMode === 'signup' 
                ? 'Already have an account? Log In' 
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Country Selection Modal */}
      <CountrySelectionModal
        visible={isCountryModalVisible}
        onClose={() => setIsCountryModalVisible(false)}
        onSelect={(country) => {
          setSelectedCountry(country);
          setIsCountryModalVisible(false);
        }}
        selectedCode={selectedCountry.code}
      />

      {/* Blood Group Modal */}
      <Modal visible={isBloodGroupModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: palette.cardBg }]}>
            <Text style={[styles.modalTitle, { color: palette.text }]}>Select Blood Group</Text>
            <View style={styles.bloodGroupGrid}>
              {BLOOD_GROUP_OPTIONS.map(bg => (
                <TouchableOpacity
                  key={bg}
                  style={[
                    styles.bloodGroupChip,
                    { borderColor: palette.border, backgroundColor: bg === bloodGroup ? palette.primary : palette.background }
                  ]}
                  onPress={() => {
                    setBloodGroup(bg);
                    setIsBloodGroupModalVisible(false);
                  }}
                >
                  <Text style={{ color: bg === bloodGroup ? palette.primaryText : palette.text, fontWeight: '700' }}>
                    {bg}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setIsBloodGroupModalVisible(false)}>
              <Text style={{ color: palette.primary, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  formDetails: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  input: {
    width: '100%',
    minHeight: 46,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderRadius: 7,
    borderWidth: 2,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.85,
    shadowRadius: 8,
    elevation: 5,
  },
  flexInput: {
    flex: 1,
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  btn: {
    marginTop: 10,
    minHeight: 46,
    width: '100%',
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
    fontSize: 16,
    fontWeight: '700',
  },
  switchLink: {
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  bloodGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  bloodGroupChip: {
    width: '22%',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  modalCancel: {
    marginTop: 24,
    padding: 10,
  },
});
