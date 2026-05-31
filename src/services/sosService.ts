import * as SMS from 'expo-sms';
import { Platform, Linking } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { STORAGE_KEYS, EMERGENCY_SERVER } from '../constants';
import type { EmergencyContact, MedicalProfile, OfflineReason, AuthProfile } from '../types';
import type { CrashEvent } from './crashDetection.service';
import { QueueService } from '../storage/QueueService';
import { HospitalService } from './hospital.service';
import { StorageService } from '../storage/StorageService';
import { queueEmergencyEvent } from './emergencyQueue.service';
import { requestJson } from './apiClient';
import { getEmergencyNumbers } from '../utils/emergencyNumbers';

export const EMERGENCY_NUMBER = '+91 9023134500';

export interface SosSendResult {
  contactsAttempted: number;
  contactsReached: number;
  dialOpened: boolean;
  message: string;
}

// Background Location update interval reference
let locationUpdateInterval: NodeJS.Timeout | null = null;

function normalizePhone(raw: string): string {
  let phone = raw.trim().replace(/[\s\-()]/g, '');
  if (!phone.startsWith('+') && phone.length === 10) {
    phone = `+91${phone}`;
  }
  return phone;
}

function buildSOSMessage(latitude: number, longitude: number, hospital: any, police: any) {
  const myLocationLink = `https://maps.google.com/?q=${latitude},${longitude}`;

  const hospitalText = hospital
    ? `🏥 NEAREST HOSPITAL:\n` +
      `${hospital.name} (${hospital.distance})\n` +
      `📞 ${hospital.phone}\n` +
      `🗺 https://maps.google.com/?q=${hospital.latitude},${hospital.longitude}`
    : `🏥 NEAREST HOSPITAL:\nNot found nearby`;

  const policeText = police
    ? `🚓 NEAREST POLICE STATION:\n` +
      `${police.name} (${police.distance})\n` +
      `📞 ${police.phone}\n` +
      `🗺 https://maps.google.com/?q=${police.latitude},${police.longitude}`
    : `🚓 NEAREST POLICE STATION:\nNot found nearby`;

  return (
    `🚨 EMERGENCY SOS ALERT 🚨\n\n` +
    `Road accident reported! Please send help immediately!\n\n` +
    `📍 VICTIM LOCATION:\n${myLocationLink}\n\n` +
    `${hospitalText}\n\n` +
    `${policeText}\n\n` +
    `Please respond urgently!\n` +
    `Sent via RoadGuard Emergency App`
  );
}

function buildHospitalMessage(latitude: number, longitude: number, hospital: any, police: any) {
  return (
    `🚨 EMERGENCY ALERT — HOSPITAL REQUIRED 🚨\n\n` +
    `A road accident has occurred nearby. Patient may need immediate medical attention.\n\n` +
    `📍 ACCIDENT LOCATION:\n` +
    `https://maps.google.com/?q=${latitude},${longitude}\n\n` +
    `📏 Distance from your hospital: ${hospital ? hospital.distance : 'Nearby'}\n\n` +
    `🚓 Police also alerted: ${police ? police.name : 'Not found'}\n\n` +
    `Please dispatch ambulance immediately!\n` +
    `Sent via RoadGuard Emergency App`
  );
}

function buildPoliceMessage(latitude: number, longitude: number, hospital: any, police: any) {
  return (
    `🚨 EMERGENCY ALERT — POLICE ASSISTANCE REQUIRED 🚨\n\n` +
    `A road accident has occurred in your area. Immediate police assistance needed.\n\n` +
    `📍 ACCIDENT LOCATION:\n` +
    `https://maps.google.com/?q=${latitude},${longitude}\n\n` +
    `📏 Distance from your station: ${police ? police.distance : 'Nearby'}\n\n` +
    `🏥 Nearest hospital alerted: ${hospital ? hospital.name : 'Not found'}\n\n` +
    `Please dispatch officers immediately!\n` +
    `Sent via RoadGuard Emergency App`
  );
}

// Formulates the structured offline payload that the voice server processes automatically
function buildOfflineSOSPayload(
  lat: number,
  lng: number,
  category: string,
  profile: MedicalProfile | null
): string {
  const name = profile?.name || 'Unknown';
  const age = profile?.age !== undefined ? String(profile.age) : 'Unknown';
  const bg = profile?.bloodGroup || 'Unknown';
  const cond = profile?.conditions || 'None reported';
  const phone = profile?.phone || 'Unknown';
  const gender = profile?.gender || 'Unknown';

  return `SOS|${lat}|${lng}|${category}|${name}|${age}|${bg}|${cond}|${phone}|${gender}`;
}

async function dialEmergency(): Promise<boolean> {
  try {
    return await Linking.openURL(`tel:${EMERGENCY_NUMBER}`);
  } catch (e) {
    console.warn('[SosService] Dial emergency failed:', e);
    return false;
  }
}

export function stopBackgroundLocationUpdates() {
  if (locationUpdateInterval) {
    clearInterval(locationUpdateInterval);
    locationUpdateInterval = null;
    console.log('[SosService] Terminated background location updates.');
  }
}

async function sendSmsAlerts(event: CrashEvent, isTest = false): Promise<SosSendResult> {
  // Step 1: Resolve live GPS coordinates
  let lat = event.latitude;
  let lon = event.longitude;

  if (lat === null || lon === null || lat === undefined || lon === undefined) {
    try {
      const liveLoc = await HospitalService.getUserLocation();
      lat = liveLoc.latitude;
      lon = liveLoc.longitude;
    } catch {
      lat = 22.3039; // Fallback to Rajkot
      lon = 70.8022;
    }
  }

  const finalLat: number = lat ?? 22.3039;
  const finalLon: number = lon ?? 70.8022;

  // Step 2: Query physical closest hospital and police station
  let hospital = null;
  let police = null;
  try {
    hospital = await HospitalService.findNearestPlace(finalLat, finalLon, 'hospital');
    police = await HospitalService.findNearestPlace(finalLat, finalLon, 'police');
  } catch (err) {
    console.warn('[SosService] Failed to find nearest places:', err);
  }

  // Step 3: Get contacts
  let contacts: EmergencyContact[] = [];
  try {
    const contactResult = await StorageService.get<EmergencyContact[]>(STORAGE_KEYS.CONTACTS);
    contacts = contactResult.success && contactResult.data ? contactResult.data : [];
  } catch (e) {
    console.warn('[SosService] Failed to load contacts from storage, using fallbacks:', e);
  }

  // Fallback to default numbers set by RoadGuard teammate if empty
  if (!contacts || contacts.length === 0) {
    contacts = [
      { id: 'default-1', name: 'Emergency Contact 1', phone: '+918238426469', relationship: 'Primary Help', isPrimary: true, createdAt: Date.now(), updatedAt: Date.now() },
      { id: 'default-2', name: 'Emergency Contact 2', phone: '+918980864615', relationship: 'Backup Help', isPrimary: false, createdAt: Date.now(), updatedAt: Date.now() }
    ];
  }

  // Load Medical ID Profile for structured offline SMS formatting
  let profile: MedicalProfile | null = null;
  try {
    const res = await StorageService.get<MedicalProfile>(STORAGE_KEYS.MEDICAL_PROFILE);
    if (res.success && res.data) {
      profile = res.data;
    }
  } catch (e) {
    console.warn('[SosService] Failed to load user profile for offline SMS:', e);
  }

  // Build specialized payloads
  const contactSmsBody = buildSOSMessage(finalLat, finalLon, hospital, police);
  const hospitalSmsBody = buildHospitalMessage(finalLat, finalLon, hospital, police);
  const policeSmsBody = buildPoliceMessage(finalLat, finalLon, hospital, police);
  const offlineStructuredSmsBody = buildOfflineSOSPayload(finalLat, finalLon, 'Emergency Impact', profile);

  const contactPhones = contacts.map((c) => normalizePhone(c.phone)).filter(Boolean);

  if (!contactPhones.length) {
    return {
      contactsAttempted: contacts.length,
      contactsReached: 0,
      dialOpened: false,
      message: 'Invalid emergency contact numbers.',
    };
  }

  // Load offlineModeEnabled preference
  let offlineModeEnabled = true;
  try {
    const prefRes = await StorageService.get<any>(STORAGE_KEYS.PREFERENCES);
    if (prefRes.success && prefRes.data) {
      offlineModeEnabled = prefRes.data.offlineModeEnabled ?? true;
    }
  } catch (e) {
    console.warn('[SosService] Failed to fetch preferences for offline mode:', e);
  }

  // Queue alerts offline only if enabled
  if (offlineModeEnabled) {
    await QueueService.enqueue('sos', {
      event,
      phones: contactPhones,
      body: contactSmsBody,
      isTest,
      timestamp: Date.now(),
    } as unknown as Record<string, unknown>);
  }

  let contactsSent = false;

  try {
    const available = await SMS.isAvailableAsync();
    if (available) {
      // Send message to emergency contacts
      const { result: contactResult } = await SMS.sendSMSAsync(contactPhones, contactSmsBody);
      contactsSent = contactResult === 'sent';

      // Send to hospital if available
      if (hospital && typeof hospital.phone === 'string') {
        const hospitalPhone = normalizePhone(hospital.phone);
        await SMS.sendSMSAsync([hospitalPhone], hospitalSmsBody);
      }

      // Send to police if available
      if (police && typeof police.phone === 'string') {
        const policePhone = normalizePhone(police.phone);
        await SMS.sendSMSAsync([policePhone], policeSmsBody);
      }

      // Offline mode: also dispatch the structured payload to our Twilio gateway
      if (EMERGENCY_SERVER.DEFAULT_VOICE_TARGET) {
        await SMS.sendSMSAsync([EMERGENCY_SERVER.DEFAULT_VOICE_TARGET], offlineStructuredSmsBody);
      }

      if (contactsSent) {
        return {
          contactsAttempted: contactPhones.length,
          contactsReached: contactPhones.length,
          dialOpened: false,
          message: `SOS SMS successfully dispatched.`,
        };
      }
    }
  } catch (e) {
    console.warn('[SosService] expo-sms failed, trying deep links:', e);
  }

  // Fallbacks using SMS Deep Linking
  let opened = 0;
  for (const phone of contactPhones) {
    try {
      const uri = `sms:${phone}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(contactSmsBody)}`;
      if (await Linking.canOpenURL(uri)) {
        await Linking.openURL(uri);
        opened++;
      }
    } catch (err) {
      console.warn(`[SosService] Failed to open contact SMS:`, err);
    }
  }

  if (hospital && hospital.phone) {
    try {
      const hospitalPhone = normalizePhone(hospital.phone);
      const uri = `sms:${hospitalPhone}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(hospitalSmsBody)}`;
      if (await Linking.canOpenURL(uri)) {
        await Linking.openURL(uri);
      }
    } catch (err) {
      console.warn(`[SosService] Failed to open hospital SMS:`, err);
    }
  }

  if (police && police.phone) {
    try {
      const policePhone = normalizePhone(police.phone);
      const uri = `sms:${policePhone}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(policeSmsBody)}`;
      if (await Linking.canOpenURL(uri)) {
        await Linking.openURL(uri);
      }
    } catch (err) {
      console.warn(`[SosService] Failed to open police SMS:`, err);
    }
  }

  // Trigger deep link for Twilio SMS gateway fallback
  try {
    const uri = `sms:${EMERGENCY_SERVER.DEFAULT_VOICE_TARGET}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(offlineStructuredSmsBody)}`;
    if (await Linking.canOpenURL(uri)) {
      await Linking.openURL(uri);
    }
  } catch (err) {
    console.warn(`[SosService] Failed to open gateway fallback SMS:`, err);
  }

  return {
    contactsAttempted: contactPhones.length,
    contactsReached: opened,
    dialOpened: false,
    message: opened > 0 ? `Opened SMS client fallback.` : 'Could not open native SMS client.',
  };
}

// Rate limiting configuration
const SOS_RATE_LIMIT_MS = 60000; // 60 seconds
let lastSosTimestamp = 0;

export const SosService = {
  async triggerSOS(
    event: CrashEvent,
    escalationReason?: string,
  ): Promise<SosSendResult> {
    const now = Date.now();
    if (now - lastSosTimestamp < SOS_RATE_LIMIT_MS) {
      console.warn('[SosService] SOS triggered too recently. Rate limiting active.');
      return {
        contactsAttempted: 0,
        contactsReached: 0,
        dialOpened: false,
        message: 'SOS was triggered recently. Please wait a moment before trying again.',
      };
    }
    lastSosTimestamp = now;

    // Stop any existing location update processes first
    stopBackgroundLocationUpdates();

    // 2. Resolve coords
    const lat = event.latitude ?? 22.3039;
    const lng = event.longitude ?? 70.8022;

    // 2a. Write SOS into offline-first outbox for backend history sync.
    let offlineReason: OfflineReason = 'none';
    try {
      const network = await NetInfo.fetch();
      offlineReason = network.isConnected ? 'none' : 'no_internet';
    } catch {
      offlineReason = 'carrier_failure';
    }
    
    // Load offline mode preference
    let offlineModeEnabled = true;
    try {
      const prefRes = await StorageService.get<any>(STORAGE_KEYS.PREFERENCES);
      if (prefRes.success && prefRes.data) {
        offlineModeEnabled = prefRes.data.offlineModeEnabled ?? true;
      }
    } catch (e) {
      console.warn('[SosService] Failed to fetch preferences for offline mode:', e);
    }

    if (offlineModeEnabled) {
      await queueEmergencyEvent(lat, lng, 'trauma', offlineReason);
    }

    // Load Emergency Contacts
    let contacts: EmergencyContact[] = [];
    try {
      const contactResult = await StorageService.get<EmergencyContact[]>(STORAGE_KEYS.CONTACTS);
      contacts = contactResult.success && contactResult.data ? contactResult.data : [];
    } catch (e) {
      console.warn('[SosService] Failed to load contacts from storage, using fallbacks:', e);
    }
    const contactPhones = contacts.map((c) => normalizePhone(c.phone)).filter(Boolean);
    const primaryContact = contacts.find(c => c.isPrimary);
    const primaryContactPhone = primaryContact ? normalizePhone(primaryContact.phone) : null;

    // Load User Profile to get localized emergency numbers
    let countryCode: string | undefined;
    try {
      const authResult = await StorageService.get<AuthProfile>(STORAGE_KEYS.AUTH_PROFILE);
      if (authResult.success && authResult.data) {
        countryCode = authResult.data.countryCode;
      }
    } catch (e) {
      console.warn('[SosService] Failed to load AuthProfile for countryCode:', e);
    }
    
    const emergencyNumbers = getEmergencyNumbers(countryCode);

    // 4. Dispatch purely via background API without any user interaction
    let dispatchSuccess = false;
    let message = 'Backend dispatch skipped or failed.';
    try {
      const callNumbers = [emergencyNumbers.ambulance];
      if (primaryContactPhone) {
        callNumbers.push(primaryContactPhone);
      }

      const payload = {
        lat,
        lng,
        category: escalationReason || 'Automated SOS',
        smsContacts: [...contactPhones, emergencyNumbers.police, emergencyNumbers.ambulance],
        callNumbers: callNumbers
      };
      
      const response = await requestJson<{success: boolean, call_sid?: string}>(`${EMERGENCY_SERVER.DEFAULT_URL}/trigger-call`, {
        method: 'POST',
        body: payload
      });
      dispatchSuccess = !!response.success;
      message = dispatchSuccess ? 'Dispatched successfully via background Llama AI.' : 'Backend returned failure.';
    } catch (e) {
      console.error('[SosService] Failed to reach background AI dispatcher:', e);
      message = 'Failed to reach emergency backend server.';
    }
    
    console.log('[SosService] SOS triggered outcome:', { escalationReason, dispatchSuccess, message });
    
    return { 
      contactsAttempted: contactPhones.length,
      contactsReached: dispatchSuccess ? contactPhones.length : 0, 
      dialOpened: dispatchSuccess,
      message,
    };
  },

  async sendTestSms(): Promise<SosSendResult> {
    const event: CrashEvent = {
      timestamp: Date.now(),
      severity: 'moderate',
      gForce: 0,
      gyroRadS: 0,
      latitude: 22.3039, // Rajkot Test coords
      longitude: 70.8022,
      speedBeforeKmh: 0,
      speedAfterKmh: 0,
    };
    return sendSmsAlerts(event, true);
  },
} as const;
