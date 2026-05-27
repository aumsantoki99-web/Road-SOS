import * as SMS from 'expo-sms';
import { Platform, Linking } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, EMERGENCY_SERVER } from '../constants';
import type { EmergencyContact, MedicalProfile, OfflineReason } from '../types';
import type { CrashEvent } from './crashDetection.service';
import { QueueService } from '../storage/QueueService';
import { HospitalService } from './hospital.service';
import { StorageService } from '../storage/StorageService';
import { queueEmergencyEvent } from './emergencyQueue.service';

export const EMERGENCY_NUMBER = '112';

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

// Periodic Background Location updater to sync operator with moving GPS
function startBackgroundLocationUpdates(callSid: string, serverUrl: string) {
  if (locationUpdateInterval) clearInterval(locationUpdateInterval);

  console.log('[SosService] Initiated background location updates to voice server for SID:', callSid);

  locationUpdateInterval = setInterval(async () => {
    try {
      const location = await HospitalService.getUserLocation();
      const lat = location.latitude;
      const lng = location.longitude;

      if (lat !== null && lng !== null) {
        const url = `${serverUrl}/update-location`;
        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Bypass-Tunnel-Reminder': 'true',
          },
          body: JSON.stringify({
            call_sid: callSid,
            lat,
            lng,
          }),
        });
        console.log(`[SosService] Pushed live coordinate update to server: ${lat}, ${lng}`);
      }
    } catch (err) {
      console.warn('[SosService] Live coordinates update error:', err);
    }
  }, 20000); // 20s interval
}

export function stopBackgroundLocationUpdates() {
  if (locationUpdateInterval) {
    clearInterval(locationUpdateInterval);
    locationUpdateInterval = null;
    console.log('[SosService] Terminated background location updates.');
  }
}

// Dispatches a POST to the Twilio emergency voice dispatch backend
async function triggerVoiceDispatch(
  lat: number,
  lng: number,
  category: string,
  profile: MedicalProfile | null,
  toPhone?: string
): Promise<{ success: boolean; callSid?: string; error?: string }> {
  const serverUrl = profile?.serverUrl || EMERGENCY_SERVER.DEFAULT_URL;
  const url = `${serverUrl}/trigger-call`;

  console.log('[SosService] Initiating Twilio Emergency voice call to server:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
      },
      body: JSON.stringify({
        lat,
        lng,
        category,
        name: profile?.name || 'Unknown',
        age: profile?.age !== undefined ? String(profile.age) : 'Unknown',
        bloodGroup: profile?.bloodGroup || 'Unknown',
        conditions: profile?.conditions || 'None reported',
        phone: profile?.phone || 'Unknown',
        gender: profile?.gender || 'Unknown',
        to_phone: toPhone || EMERGENCY_SERVER.DEFAULT_VOICE_TARGET,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[SosService] Voice server response successfully processed:', data);
      return {
        success: data.success ?? false,
        callSid: data.call_sid,
      };
    } else {
      console.warn('[SosService] Voice dispatch HTTP status failed:', response.status);
      return {
        success: false,
        error: `Server responded with status ${response.status}`,
      };
    }
  } catch (err: any) {
    console.warn('[SosService] Voice dispatch fetch failed:', err);
    return {
      success: false,
      error: err.message || String(err),
    };
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
    const rawContacts = await AsyncStorage.getItem(STORAGE_KEYS.CONTACTS);
    contacts = rawContacts ? JSON.parse(rawContacts) : [];
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

  // Queue alerts offline
  await QueueService.enqueue('sos', {
    event,
    phones: contactPhones,
    body: contactSmsBody,
    isTest,
    timestamp: Date.now(),
  } as unknown as Record<string, unknown>);

  let contactsSent = false;
  let hospitalSent = false;
  let policeSent = false;
  let gatewaySent = false;

  try {
    const available = await SMS.isAvailableAsync();
    if (available) {
      // Send message to emergency contacts
      const { result: contactResult } = await SMS.sendSMSAsync(contactPhones, contactSmsBody);
      contactsSent = contactResult === 'sent';

      // Send to hospital if available
      if (hospital && hospital.phone) {
        const hospitalPhone = normalizePhone(hospital.phone);
        await SMS.sendSMSAsync([hospitalPhone], hospitalSmsBody);
        hospitalSent = true;
      }

      // Send to police if available
      if (police && police.phone) {
        const policePhone = normalizePhone(police.phone);
        await SMS.sendSMSAsync([policePhone], policeSmsBody);
        policeSent = true;
      }

      // Offline mode: also dispatch the structured payload to our Twilio gateway
      if (EMERGENCY_SERVER.DEFAULT_VOICE_TARGET) {
        await SMS.sendSMSAsync([EMERGENCY_SERVER.DEFAULT_VOICE_TARGET], offlineStructuredSmsBody);
        gatewaySent = true;
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

export const SosService = {
  async triggerSOS(
    event: CrashEvent,
    escalationReason?: string,
  ): Promise<SosSendResult> {
    // Stop any existing location update processes first
    stopBackgroundLocationUpdates();

    // 1. Load User Profile details
    let profile: MedicalProfile | null = null;
    try {
      const res = await StorageService.get<MedicalProfile>(STORAGE_KEYS.MEDICAL_PROFILE);
      if (res.success && res.data) {
        profile = res.data;
      }
    } catch (e) {
      console.warn('[SosService] Failed to fetch Medical ID for dispatch:', e);
    }

    // 2. Resolve coords
    let lat = event.latitude ?? 22.3039;
    let lng = event.longitude ?? 70.8022;

    // 2a. Write SOS into offline-first outbox for backend history sync.
    let offlineReason: OfflineReason = 'none';
    try {
      const network = await NetInfo.fetch();
      offlineReason = network.isConnected ? 'none' : 'no_internet';
    } catch {
      offlineReason = 'carrier_failure';
    }
    await queueEmergencyEvent(lat, lng, 'trauma', offlineReason);

    // Resolve nearest hospital phone number to dial
    let hospital = null;
    try {
      hospital = await HospitalService.findNearestPlace(lat, lng, 'hospital');
    } catch (err) {
      console.warn('[SosService] Failed to find nearest hospital for voice call:', err);
    }
    const hospitalPhone = hospital?.phone ? normalizePhone(hospital.phone) : undefined;

    // 3. Initiate Online Voice Assistant Dispatch
    let dispatchText = 'Dialer to 112 was opened and custom emergency SMS coordinates were sent successfully.';
    let voiceTriggerSuccess = false;

    const voiceCallResult = await triggerVoiceDispatch(lat, lng, 'Emergency Impact', profile, hospitalPhone);
    if (voiceCallResult.success && voiceCallResult.callSid) {
      voiceTriggerSuccess = true;
      dispatchText = `🚨 AI VOICE DISPATCH ACTIVE 🚨\nAn outbound AI voice dispatch call (SID: ${voiceCallResult.callSid.slice(0, 8)}...) has been placed to emergency services.\n\nThe AI Operator is actively speaking with the responder in their native language to report your status.`;
      
      // Start background coordinates updates
      const serverUrl = profile?.serverUrl || EMERGENCY_SERVER.DEFAULT_URL;
      startBackgroundLocationUpdates(voiceCallResult.callSid, serverUrl);
    } else {
      console.log('[SosService] Voice call API failed, resorting to standard dial & SMS. Error:', voiceCallResult.error);
    }

    // 4. Dial emergency line & dispatch SMS
    const dialOpened = await dialEmergency();
    const sms = await sendSmsAlerts(event);
    
    console.log('[SosService] SOS triggered outcome:', { escalationReason, dialOpened, sms, voiceTriggerSuccess });
    
    return { 
      ...sms, 
      dialOpened,
      message: voiceTriggerSuccess ? dispatchText : sms.message,
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
