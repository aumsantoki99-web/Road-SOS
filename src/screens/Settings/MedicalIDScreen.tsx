/**
 * MedicalIDScreen — Premium Emergency Medical ID Setup & Editor
 * 
 * Part of the Twilio AI Emergency Dispatch voice assistant integration.
 * Allows users to register vital medical details stored locally
 * and transmitted automatically during critical road SOS triggers.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/LocalizationContext';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { StorageService } from '../../storage/StorageService';
import { STORAGE_KEYS, EMERGENCY_SERVER } from '../../constants';
import { CustomButton } from '../../components/common/CustomButton';
import { LanguageSelectionModal } from '../../components/common/LanguageSelectionModal';
import { CountrySelectionModal, COUNTRY_CODES, type CountryCodeOption } from '../../components/common/CountrySelectionModal';
import { spacing, radius, borderWidth, layout } from '../../theme/spacing';
import { textStyles } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import type { MedicalProfile } from '../../types';

interface MedicalIDScreenProps {
  route?: {
    params?: {
      isForceOnboarding?: boolean;
    };
  };
}

const BLOOD_GROUPS: MedicalProfile['bloodGroup'][] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS: MedicalProfile['gender'][] = ['Male', 'Female', 'Other'];

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  hi: 'हिन्दी (Hindi)',
  gu: 'ગુજરાતી (Gujarati)',
  mr: 'मराठी (Marathi)',
  ta: 'தமிழ் (Tamil)',
  te: 'తెలుగు (Telugu)',
  bn: 'বাংলা (Bengali)',
  kn: 'ಕನ್ನಡ (Kannada)',
  ml: 'മലയാളം (Malayalam)',
  pa: 'ਪੰਜਾਬੀ (Punjabi)',
  ur: 'اردو (Urdu)',
  es: 'Español (Spanish)',
  fr: 'Français (French)',
  de: 'Deutsch (German)',
  ar: 'العربية (Arabic)',
  ja: '日本語 (Japanese)',
  zh: '简体中文 (Chinese)',
};

export function MedicalIDScreen({ route }: MedicalIDScreenProps): React.JSX.Element {
  const { colors } = useTheme();
  const { t, language } = useTranslation();
  const nav = useAppNavigation();

  const isForceOnboarding = route?.params?.isForceOnboarding ?? false;

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Date of birth: separated into DD, MM, YYYY for maximum input robustness
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [age, setAge] = useState<number>(0);
  
  const [gender, setGender] = useState<MedicalProfile['gender']>('');
  const [bloodGroup, setBloodGroup] = useState<MedicalProfile['bloodGroup']>('');
  const [conditions, setConditions] = useState('');
  const [serverUrl, setServerUrl] = useState<string>(EMERGENCY_SERVER.DEFAULT_URL);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCodeOption>(COUNTRY_CODES[0] || { code: '+91', flag: '🇮🇳', name: 'India' });
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);

  // References for automatic textinput focus jumping
  const monthInputRef = useRef<TextInput>(null);
  const yearInputRef = useRef<TextInput>(null);

  // Check if first-launch language selection is needed
  useEffect(() => {
    if (isForceOnboarding) {
      async function checkLanguageOnboarding() {
        const result = await StorageService.get<string>('@ridesafe/language_selected_onboarding');
        if (!result.success || result.data !== 'true') {
          setIsLanguageModalVisible(true);
        }
      }
      void checkLanguageOnboarding();
    }
  }, [isForceOnboarding]);

  const handleConfirmLanguage = async () => {
    setIsLanguageModalVisible(false);
    await StorageService.set('@ridesafe/language_selected_onboarding', 'true');
  };

  // Load existing profile
  useEffect(() => {
    async function loadProfile() {
      const result = await StorageService.get<MedicalProfile>(STORAGE_KEYS.MEDICAL_PROFILE);
      if (result.success && result.data) {
        const p = result.data;
        setName(p.name || '');
        setGender(p.gender || '');
        setBloodGroup(p.bloodGroup || '');
        setConditions(p.conditions || '');
        setServerUrl(p.serverUrl || EMERGENCY_SERVER.DEFAULT_URL);

        if (p.phone) {
          // Check if it starts with any known country code
          const found = COUNTRY_CODES.find(c => p.phone.startsWith(c.code));
          if (found) {
            setSelectedCountry(found);
            setPhone(p.phone.slice(found.code.length));
          } else if (p.phone.startsWith('+')) {
            const digitsMatch = p.phone.match(/^\+(\d{1,4})/);
            if (digitsMatch) {
              const code = `+${digitsMatch[1]}`;
              setSelectedCountry({ code, flag: '🌐', name: 'Other' });
              setPhone(p.phone.slice(code.length));
            } else {
              setPhone(p.phone);
            }
          } else {
            setPhone(p.phone);
          }
        } else {
          setPhone('');
        }

        if (p.dob) {
          const parts = p.dob.split('-');
          if (parts.length === 3) {
            setDobYear(parts[0] || '');
            setDobMonth(parts[1] || '');
            setDobDay(parts[2] || '');
          }
        }
      }
    }
    void loadProfile();
  }, []);

  // Intercept back button during onboarding
  useEffect(() => {
    if (!isForceOnboarding) {
      return () => {};
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleCancel();
      return true;
    });

    return () => backHandler.remove();
  }, [isForceOnboarding, selectedCountry, phone]);

  // Request SMS permission upfront during forced onboarding
  useEffect(() => {
    if (isForceOnboarding) {
      const askPermission = () => {
        Alert.alert(
          '📱 SMS Dispatch Access Required',
          'To send instant distress messages to your family contacts and dispatch ambulances during an accident, the app requires permission to compose standard SMS alerts.\n\nDo you grant emergency SMS dispatch access?',
          [
            { 
              text: 'Grant Access', 
              onPress: () => {
                void StorageService.set(STORAGE_KEYS.SMS_PERMISSION_GRANTED, 'true');
              }
            },
            { 
              text: 'Cancel', 
              style: 'cancel',
              onPress: () => {
                void StorageService.set(STORAGE_KEYS.SMS_PERMISSION_GRANTED, 'false');
              }
            }
          ]
        );
      };
      // Brief timeout to let the screen animate open
      const timer = setTimeout(askPermission, 800);
      return () => clearTimeout(timer);
    }
    return () => {};
  }, [isForceOnboarding]);

  // Dynamic Age calculation
  useEffect(() => {
    const day = parseInt(dobDay, 10);
    const month = parseInt(dobMonth, 10);
    const year = parseInt(dobYear, 10);

    if (isNaN(day) || isNaN(month) || isNaN(year) || day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) {
      setAge(0);
      return;
    }

    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }

    setAge(calculatedAge >= 0 ? calculatedAge : 0);
  }, [dobDay, dobMonth, dobYear]);

  // Form submit handler
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name.');
      return;
    }
    const cleanedPhone = phone.replace(/\D/g, '');
    if (!phone.trim() || cleanedPhone.length < 7 || cleanedPhone.length > 15) {
      Alert.alert('Validation Error', 'Please enter a valid mobile number (7 to 15 digits).');
      return;
    }
    if (!gender) {
      Alert.alert('Validation Error', 'Please select your gender.');
      return;
    }
    if (!bloodGroup) {
      Alert.alert('Validation Error', 'Please select your blood group.');
      return;
    }
    if (age === 0) {
      Alert.alert('Validation Error', 'Please enter a valid Date of Birth (DD-MM-YYYY).');
      return;
    }

    setIsSubmitting(true);

    const formattedDob = `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`;

    const profileData: MedicalProfile = {
      name: name.trim(),
      phone: `${selectedCountry.code}${phone.trim()}`,
      gender,
      dob: formattedDob,
      age,
      bloodGroup,
      conditions: conditions.trim() || 'None reported',
      serverUrl: serverUrl.trim() || EMERGENCY_SERVER.DEFAULT_URL,
    };

    try {
      await StorageService.set(STORAGE_KEYS.MEDICAL_PROFILE, profileData);
      await StorageService.set(STORAGE_KEYS.PROFILE_SETUP_DONE, 'true');
      
      Alert.alert('Profile Saved', 'Your Emergency Medical ID has been stored securely on this device.', [
        {
          text: 'OK',
          onPress: () => {
            if (isForceOnboarding) {
              nav.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            } else {
              nav.goBack();
            }
          },
        },
      ]);
    } catch (e) {
      Alert.alert('Storage Error', 'Failed to save Medical ID. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isForceOnboarding) {
      Alert.alert(
        'Skip Medical ID Setup?',
        'Would you like to skip Emergency Medical ID setup for now?\n\n⚠️ Note: Active crash sensors and auto-SOS dispatch features will remain disabled until your profile is complete.',
        [
          { text: 'Keep Setting Up', style: 'cancel' },
          {
            text: 'Skip Setup',
            style: 'destructive',
            onPress: async () => {
              await StorageService.set(STORAGE_KEYS.PROFILE_SETUP_DONE, 'false');
              nav.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            },
          },
        ]
      );
    } else {
      nav.goBack();
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: '#09090C' }]} edges={['top', 'bottom']}>
      <LanguageSelectionModal
        visible={isLanguageModalVisible}
        onClose={handleConfirmLanguage}
        isFirstLaunch={isForceOnboarding}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleWrap}>
            <View style={styles.iconCircle}>
              <Ionicons name="heart-half-sharp" size={24} color="#EF4444" />
            </View>
            <View>
              <Text style={[textStyles.headingLarge, { color: '#FFFFFF' }]}>
                {isForceOnboarding ? 'Set Up Medical ID' : 'Emergency Medical ID'}
              </Text>
              <Text style={[textStyles.caption, { color: 'rgba(255,255,255,0.45)', marginTop: 2 }]}>
                Saved locally on your device for emergency dispatches
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.closeBtn}
            accessibilityLabel="Cancel"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Onboarding Tip Card */}
          {isForceOnboarding && (
            <View style={styles.tipCard}>
              <Ionicons name="shield-checkmark" size={20} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.tipText}>
                First responders will receive this information automatically during an emergency SOS voice call to expedite treatment.
              </Text>
            </View>
          )}

          {/* Language Selection option in Profile */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('settings.language').toUpperCase()} *</Text>
            <TouchableOpacity
              style={styles.languageSelector}
              onPress={() => setIsLanguageModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.languageSelectorLeft}>
                <Ionicons name="language-outline" size={20} color="#EF4444" style={{ marginRight: 12 }} />
                <Text style={styles.languageSelectorText}>
                  {LANGUAGE_LABELS[language] || 'English'}
                </Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>

          {/* Full Name */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>FULL NAME *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Priya Sharma"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Phone Number */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>MOBILE NUMBER *</Text>
            <View style={styles.phoneInputRow}>
              <TouchableOpacity
                style={styles.countryCodeBadge}
                onPress={() => setIsCountryModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.countryCodeText}>{selectedCountry.flag} {selectedCountry.code}</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="98765 43210"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={phone}
                onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 15))}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>
          </View>

          {/* Date of Birth row */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>DATE OF BIRTH (DD-MM-YYYY) *</Text>
            <View style={styles.dobRow}>
              <TextInput
                style={[styles.input, styles.dobDayInput]}
                placeholder="DD"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={dobDay}
                onChangeText={(v) => {
                  const val = v.replace(/\D/g, '').slice(0, 2);
                  setDobDay(val);
                  if (val.length === 2) monthInputRef.current?.focus();
                }}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={styles.dobSeparator}>/</Text>
              <TextInput
                ref={monthInputRef}
                style={[styles.input, styles.dobMonthInput]}
                placeholder="MM"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={dobMonth}
                onChangeText={(v) => {
                  const val = v.replace(/\D/g, '').slice(0, 2);
                  setDobMonth(val);
                  if (val.length === 2) yearInputRef.current?.focus();
                }}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={styles.dobSeparator}>/</Text>
              <TextInput
                ref={yearInputRef}
                style={[styles.input, styles.dobYearInput]}
                placeholder="YYYY"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={dobYear}
                onChangeText={(v) => setDobYear(v.replace(/\D/g, '').slice(0, 4))}
                keyboardType="numeric"
                maxLength={4}
              />

              {/* Age Display Swatch */}
              <View style={styles.ageBadge}>
                <Text style={styles.ageBadgeLabel}>CALCULATED AGE</Text>
                <Text style={styles.ageBadgeValue}>{age > 0 ? `${age} Yrs` : '--'}</Text>
              </View>
            </View>
          </View>

          {/* Gender selection */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>GENDER *</Text>
            <View style={styles.genderRow}>
              {GENDERS.map((g) => {
                const isSelected = gender === g;
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGender(g)}
                    style={[
                      styles.choiceBtn,
                      isSelected && { backgroundColor: '#EF4444', borderColor: '#EF4444' }
                    ]}
                  >
                    <Text style={[styles.choiceBtnText, isSelected && { color: '#FFFFFF' }]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Blood Group selection */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>BLOOD GROUP *</Text>
            <View style={styles.bloodGrid}>
              {BLOOD_GROUPS.map((bg) => {
                const isSelected = bloodGroup === bg;
                return (
                  <TouchableOpacity
                    key={bg}
                    onPress={() => setBloodGroup(bg)}
                    style={[
                      styles.bloodBtn,
                      isSelected && { backgroundColor: '#EF4444', borderColor: '#EF4444' }
                    ]}
                  >
                    <Text style={[styles.bloodBtnText, isSelected && { color: '#FFFFFF' }]}>
                      {bg}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Medical Conditions */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>MEDICAL CONDITIONS / ALLERGIES</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. Asthma, Diabetes, Penicillin Allergy, None"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={conditions}
              onChangeText={setConditions}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Advanced / Developer Options Section */}
          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => setShowAdvanced(!showAdvanced)}
            activeOpacity={0.8}
          >
            <Text style={styles.advancedToggleText}>
              {showAdvanced ? 'Hide API Dispatch Options' : 'Show API Dispatch Options'}
            </Text>
            <Ionicons
              name={showAdvanced ? 'chevron-up-outline' : 'chevron-down-outline'}
              size={14}
              color="rgba(255,255,255,0.4)"
            />
          </TouchableOpacity>

          {showAdvanced && (
            <View style={styles.advancedPanel}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>AI DISPATCH SERVER ENDPOINT</Text>
                <TextInput
                  style={[styles.input, styles.advancedInput]}
                  placeholder="https://..."
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={serverUrl}
                  onChangeText={setServerUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.resetServerBtn}
                  onPress={() => setServerUrl(EMERGENCY_SERVER.DEFAULT_URL)}
                >
                  <Text style={styles.resetServerBtnText}>Reset to Default Tunnel URL</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerButtons}>
            <View style={styles.cancelBtnWrap}>
              <CustomButton
                label={isForceOnboarding ? "Skip" : "Cancel"}
                onPress={handleCancel}
                variant="secondary"
                size="lg"
                fullWidth
              />
            </View>
            <View style={styles.submitBtnWrap}>
              <CustomButton
                label={isForceOnboarding ? "Finish & Go to Home" : "Save Medical ID"}
                onPress={handleSave}
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                disabled={isSubmitting}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <CountrySelectionModal
        visible={isCountryModalVisible}
        onClose={() => setIsCountryModalVisible(false)}
        onSelect={(country) => setSelectedCountry(country)}
        selectedCode={selectedCountry.code}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
    gap: spacing[5],
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    padding: spacing[3],
    borderRadius: radius.md,
  },
  tipText: {
    color: '#FF8080',
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  field: {
    gap: spacing[2],
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.5,
  },
  input: {
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    fontSize: 16,
    color: '#FFFFFF',
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  countryCodeBadge: {
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryCodeText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  dobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  dobDayInput: {
    width: 60,
    textAlign: 'center',
  },
  dobMonthInput: {
    width: 60,
    textAlign: 'center',
  },
  dobYearInput: {
    width: 80,
    textAlign: 'center',
  },
  dobSeparator: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ageBadge: {
    flex: 1,
    height: 52,
    backgroundColor: 'rgba(239,68,68,0.04)',
    borderColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
  },
  ageBadgeLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
    marginBottom: 2,
  },
  ageBadgeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EF4444',
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing[2.5],
  },
  choiceBtn: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
    fontSize: 14,
  },
  bloodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  bloodBtn: {
    width: '23%',
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
    fontSize: 14,
  },
  textArea: {
    height: 100,
    paddingTop: spacing[3],
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1.5],
    paddingVertical: spacing[2],
    marginTop: spacing[2],
  },
  advancedToggleText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
  advancedPanel: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    padding: spacing[3],
    borderRadius: radius.md,
    gap: spacing[4],
  },
  advancedInput: {
    fontSize: 13,
    height: 48,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#000000',
  },
  resetServerBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing[1],
  },
  resetServerBtnText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    height: 52,
  },
  languageSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageSelectorText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#09090C',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  cancelBtnWrap: {
    flex: 1,
  },
  submitBtnWrap: {
    flex: 2,
  },
});
