import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { DEFAULT_PREFERENCES, STORAGE_KEYS } from '../constants';
import { StorageService } from '../storage/StorageService';
import type { AppLanguage, UserPreferences } from '../types';

type TranslationKey =
  | 'tabs.home'
  | 'tabs.ride'
  | 'tabs.contacts'
  | 'tabs.hospitals'
  | 'tabs.settings'
  | 'settings.title'
  | 'settings.appearance'
  | 'settings.safety'
  | 'settings.emergency'
  | 'settings.notifications'
  | 'settings.language'
  | 'settings.languageDescription'
  | 'settings.languageEnglish'
  | 'settings.languageHindi'
  | 'settings.languageGujarati'
  | 'settings.themeDescription'
  | 'settings.crashSensitivity'
  | 'settings.crashSensitivityHint'
  | 'settings.low'
  | 'settings.medium'
  | 'settings.high'
  | 'settings.sosDelay'
  | 'settings.sosDelayDescription'
  | 'settings.autoShareLocation'
  | 'settings.autoShareLocationDescription'
  | 'settings.rideAutoStart'
  | 'settings.rideAutoStartDescription'
  | 'settings.offlineEmergencyMode'
  | 'settings.offlineEmergencyModeDescription'
  | 'settings.pushNotifications'
  | 'settings.pushNotificationsDescription'
  | 'settings.openDeviceSettings'
  | 'settings.openDeviceSettingsDescription'
  | 'settings.about'
  | 'settings.appVersion'
  | 'settings.expoSdk'
  | 'settings.architecture'
  | 'settings.architectureDescription'
  | 'settings.dangerZone'
  | 'settings.dangerZoneDescription'
  | 'settings.resetAllData'
  | 'settings.resetAlertTitle'
  | 'settings.resetAlertBody'
  | 'settings.cancel'
  | 'settings.resetEverything'
  | 'settings.done'
  | 'settings.resetDone'
  | 'settings.nightModeActive'
  | 'home.title'
  | 'home.rideActive'
  | 'home.readyToRide'
  | 'contacts.title'
  | 'contacts.add'
  | 'contacts.loading';

type TranslationTable = Record<TranslationKey, string>;

const translations: Record<AppLanguage, TranslationTable> = {
  en: {
    'tabs.home': 'Home',
    'tabs.ride': 'Ride',
    'tabs.contacts': 'Contacts',
    'tabs.hospitals': 'Hospitals',
    'tabs.settings': 'Settings',
    'settings.title': 'Settings',
    'settings.appearance': 'APPEARANCE',
    'settings.safety': 'SAFETY',
    'settings.emergency': 'EMERGENCY',
    'settings.notifications': 'NOTIFICATIONS',
    'settings.language': 'Language',
    'settings.languageDescription': 'Choose the language used across the app',
    'settings.languageEnglish': 'English',
    'settings.languageHindi': 'Hindi',
    'settings.languageGujarati': 'Gujarati',
    'settings.themeDescription': 'Auto mode activates a high-contrast red-black night palette after 19:00 to reduce glare while riding.',
    'settings.crashSensitivity': 'Crash Detection Sensitivity',
    'settings.crashSensitivityHint': 'Higher sensitivity detects lighter impacts. Recommended: Medium.',
    'settings.low': 'Low',
    'settings.medium': 'Medium',
    'settings.high': 'High',
    'settings.sosDelay': 'SOS Auto-Send Delay',
    'settings.sosDelayDescription': 'Seconds before alert sends automatically',
    'settings.autoShareLocation': 'Auto-Share Location',
    'settings.autoShareLocationDescription': 'Include GPS coordinates in emergency alerts',
    'settings.rideAutoStart': 'Ride Auto-Start',
    'settings.rideAutoStartDescription': 'Begin monitoring automatically when motion is detected',
    'settings.offlineEmergencyMode': 'Offline Emergency Mode',
    'settings.offlineEmergencyModeDescription': 'Queue alerts locally when internet is unavailable',
    'settings.pushNotifications': 'Push Notifications',
    'settings.pushNotificationsDescription': 'Ride reminders and safety alerts',
    'settings.openDeviceSettings': 'Open Device Settings',
    'settings.openDeviceSettingsDescription': 'Manage notification permissions',
    'settings.about': 'ABOUT',
    'settings.appVersion': 'App Version',
    'settings.expoSdk': 'Expo SDK',
    'settings.architecture': 'Architecture',
    'settings.architectureDescription': 'Offline-first · TypeScript strict',
    'settings.dangerZone': 'Danger Zone',
    'settings.dangerZoneDescription': 'This permanently deletes all your contacts, ride history, and preferences. It cannot be undone.',
    'settings.resetAllData': 'Reset All App Data',
    'settings.resetAlertTitle': 'Reset App Data',
    'settings.resetAlertBody': 'This will delete all contacts, ride history, and preferences permanently.',
    'settings.cancel': 'Cancel',
    'settings.resetEverything': 'Reset Everything',
    'settings.done': 'Done',
    'settings.resetDone': 'All app data cleared.',
    'settings.nightModeActive': 'Night mode active · Red-black palette until 06:00',
    'home.title': 'Home',
    'home.rideActive': 'Ride Active',
    'home.readyToRide': 'Ready to ride',
    'contacts.title': 'Contacts',
    'contacts.add': 'Add',
    'contacts.loading': 'Loading contacts...',
  },
  hi: {
    'tabs.home': 'होम',
    'tabs.ride': 'राइड',
    'tabs.contacts': 'संपर्क',
    'tabs.hospitals': 'अस्पताल',
    'tabs.settings': 'सेटिंग्स',
    'settings.title': 'सेटिंग्स',
    'settings.appearance': 'रूप',
    'settings.safety': 'सुरक्षा',
    'settings.emergency': 'आपातकाल',
    'settings.notifications': 'सूचनाएं',
    'settings.language': 'भाषा',
    'settings.languageDescription': 'ऐप में उपयोग की जाने वाली भाषा चुनें',
    'settings.languageEnglish': 'अंग्रेज़ी',
    'settings.languageHindi': 'हिंदी',
    'settings.languageGujarati': 'गुजराती',
    'settings.themeDescription': 'ऑटो मोड 19:00 के बाद चमक कम करने के लिए उच्च-कॉन्ट्रास्ट लाल-काला नाइट पैलेट चालू करता है।',
    'settings.crashSensitivity': 'क्रैश डिटेक्शन संवेदनशीलता',
    'settings.crashSensitivityHint': 'उच्च संवेदनशीलता हल्के प्रभावों को भी पकड़ती है। सुझाया गया: मीडियम।',
    'settings.low': 'कम',
    'settings.medium': 'मध्यम',
    'settings.high': 'उच्च',
    'settings.sosDelay': 'SOS ऑटो-सेंड देरी',
    'settings.sosDelayDescription': 'अलर्ट अपने आप भेजने से पहले के सेकंड',
    'settings.autoShareLocation': 'लोकेशन अपने आप साझा करें',
    'settings.autoShareLocationDescription': 'आपातकालीन अलर्ट में GPS निर्देशांक शामिल करें',
    'settings.rideAutoStart': 'राइड ऑटो-स्टार्ट',
    'settings.rideAutoStartDescription': 'गति पहचानने पर मॉनिटरिंग अपने आप शुरू करें',
    'settings.offlineEmergencyMode': 'ऑफलाइन इमरजेंसी मोड',
    'settings.offlineEmergencyModeDescription': 'इंटरनेट न होने पर अलर्ट लोकली कतार में रखें',
    'settings.pushNotifications': 'पुश नोटिफिकेशन',
    'settings.pushNotificationsDescription': 'राइड रिमाइंडर और सुरक्षा अलर्ट',
    'settings.openDeviceSettings': 'डिवाइस सेटिंग्स खोलें',
    'settings.openDeviceSettingsDescription': 'नोटिफिकेशन अनुमति प्रबंधित करें',
    'settings.about': 'जानकारी',
    'settings.appVersion': 'ऐप संस्करण',
    'settings.expoSdk': 'एक्सपो SDK',
    'settings.architecture': 'आर्किटेक्चर',
    'settings.architectureDescription': 'ऑफलाइन-फर्स्ट · टाइपस्क्रिप्ट स्ट्रिक्ट',
    'settings.dangerZone': 'डेंजर ज़ोन',
    'settings.dangerZoneDescription': 'यह आपके सभी संपर्क, राइड हिस्ट्री और पसंद स्थायी रूप से मिटा देगा। इसे वापस नहीं लाया जा सकता।',
    'settings.resetAllData': 'सारा ऐप डेटा रीसेट करें',
    'settings.resetAlertTitle': 'ऐप डेटा रीसेट करें',
    'settings.resetAlertBody': 'यह सभी संपर्क, राइड हिस्ट्री और पसंद स्थायी रूप से मिटा देगा।',
    'settings.cancel': 'रद्द करें',
    'settings.resetEverything': 'सब कुछ रीसेट करें',
    'settings.done': 'पूर्ण',
    'settings.resetDone': 'सारा ऐप डेटा साफ़ कर दिया गया।',
    'settings.nightModeActive': 'नाइट मोड सक्रिय · 06:00 तक लाल-काला पैलेट',
    'home.title': 'होम',
    'home.rideActive': 'राइड सक्रिय',
    'home.readyToRide': 'राइड के लिए तैयार',
    'contacts.title': 'संपर्क',
    'contacts.add': 'जोड़ें',
    'contacts.loading': 'संपर्क लोड हो रहे हैं...',
  },
  gu: {
    'tabs.home': 'હોમ',
    'tabs.ride': 'રાઇડ',
    'tabs.contacts': 'સંપર્કો',
    'tabs.hospitals': 'હોસ્પિટલ',
    'tabs.settings': 'સેટિંગ્સ',
    'settings.title': 'સેટિંગ્સ',
    'settings.appearance': 'દેખાવ',
    'settings.safety': 'સુરક્ષા',
    'settings.emergency': 'આપત્કાળ',
    'settings.notifications': 'સૂચનાઓ',
    'settings.language': 'ભાષા',
    'settings.languageDescription': 'એપમાં ઉપયોગ થતી ભાષા પસંદ કરો',
    'settings.languageEnglish': 'અંગ્રેજી',
    'settings.languageHindi': 'હિન્દી',
    'settings.languageGujarati': 'ગુજરાતી',
    'settings.themeDescription': 'ઓટો મોડ 19:00 પછી ગ્લેર ઘટાડવા માટે હાઇ-કોન્ટ્રાસ્ટ લાલ-કાળો નાઇટ પેલેટ ચાલુ કરે છે.',
    'settings.crashSensitivity': 'ક્રેશ ડિટેક્શન સંવેદનશીલતા',
    'settings.crashSensitivityHint': 'વધુ સંવેદનશીલતા હળવા આઘાતને પણ ઓળખે છે. ભલામણ: મીડિયમ.',
    'settings.low': 'ઓછું',
    'settings.medium': 'મધ્યમ',
    'settings.high': 'ઉચ્ચ',
    'settings.sosDelay': 'SOS ઓટો-સેન્ડ વિલંબ',
    'settings.sosDelayDescription': 'અલર્ટ આપમેળે મોકલાય તે પહેલાંના સેકન્ડ',
    'settings.autoShareLocation': 'લોકેશન આપમેળે શેર કરો',
    'settings.autoShareLocationDescription': 'આપત્કાળીન અલર્ટમાં GPS સ્થાન ઉમેરો',
    'settings.rideAutoStart': 'રાઇડ ઓટો-સ્ટાર્ટ',
    'settings.rideAutoStartDescription': 'હલનચલન જણાય ત્યારે મોનિટરિંગ આપમેળે શરૂ કરો',
    'settings.offlineEmergencyMode': 'ઓફલાઇન ઇમરજન્સી મોડ',
    'settings.offlineEmergencyModeDescription': 'ઇન્ટરનેટ ન હોય ત્યારે અલર્ટ લોકલી કતારમાં રાખો',
    'settings.pushNotifications': 'પુશ નોટિફિકેશન્સ',
    'settings.pushNotificationsDescription': 'રાઇડ રિમાઇન્ડર અને સુરક્ષા અલર્ટ',
    'settings.openDeviceSettings': 'ડિવાઇસ સેટિંગ્સ ખોલો',
    'settings.openDeviceSettingsDescription': 'નોટિફિકેશન પરમિશન મેનેજ કરો',
    'settings.about': 'વિશે',
    'settings.appVersion': 'એપ વર્ઝન',
    'settings.expoSdk': 'એક્સ્પો SDK',
    'settings.architecture': 'આર્કિટેક્ચર',
    'settings.architectureDescription': 'ઓફલાઇન-ફર્સ્ટ · ટાઇપસ્ક્રિપ્ટ સ્ટ્રિક્ટ',
    'settings.dangerZone': 'ડેન્જર ઝોન',
    'settings.dangerZoneDescription': 'આ તમારા બધા સંપર્કો, રાઇડ ઇતિહાસ અને પસંદગીઓ કાયમ માટે કાઢી નાંખશે. તેને પાછું લાવી શકાશે નહીં.',
    'settings.resetAllData': 'બધું એપ ડેટા રિસેટ કરો',
    'settings.resetAlertTitle': 'એપ ડેટા રિસેટ કરો',
    'settings.resetAlertBody': 'આ બધા સંપર્કો, રાઇડ ઇતિહાસ અને પસંદગીઓ કાયમ માટે કાઢી નાંખશે.',
    'settings.cancel': 'રદ કરો',
    'settings.resetEverything': 'બધું રિસેટ કરો',
    'settings.done': 'પૂર્ણ',
    'settings.resetDone': 'બધું એપ ડેટા સાફ કરાયું.',
    'settings.nightModeActive': 'નાઇટ મોડ સક્રિય · 06:00 સુધી લાલ-કાળો પેલેટ',
    'home.title': 'હોમ',
    'home.rideActive': 'રાઇડ સક્રિય',
    'home.readyToRide': 'રાઇડ માટે તૈયાર',
    'contacts.title': 'સંપર્કો',
    'contacts.add': 'ઉમેરો',
    'contacts.loading': 'સંપર્કો લોડ થઈ રહ્યા છે...',
  },
};

interface LocalizationContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => Promise<void>;
  t: (key: TranslationKey) => string;
}

const LocalizationContext = createContext<LocalizationContextValue | undefined>(undefined);

export function LocalizationProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_PREFERENCES.language);

  useEffect(() => {
    async function loadPreferences(): Promise<void> {
      const result = await StorageService.get<UserPreferences>(STORAGE_KEYS.PREFERENCES);
      if (result.success && result.data?.language) {
        setLanguageState(result.data.language);
      }
    }

    void loadPreferences();
  }, []);

  async function setLanguage(languageCode: AppLanguage): Promise<void> {
    setLanguageState(languageCode);

    const result = await StorageService.get<UserPreferences>(STORAGE_KEYS.PREFERENCES);
    const preferences = result.success && result.data ? result.data : DEFAULT_PREFERENCES;

    await StorageService.set(STORAGE_KEYS.PREFERENCES, {
      ...preferences,
      language: languageCode,
    });
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: TranslationKey) => translations[language][key] ?? translations.en[key],
    }),
    [language],
  );

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useTranslation(): LocalizationContextValue {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useTranslation must be used within LocalizationProvider.');
  }
  return context;
}
