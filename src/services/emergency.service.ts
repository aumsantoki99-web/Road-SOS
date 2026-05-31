/**
 * EmergencyService — Placeholder
 *
 * Integration point for SOS alert dispatch.
 *
 * When connecting real emergency alerts:
 *   Option A — Twilio SMS:
 *     Backend endpoint receives contactIds + location,
 *     calls Twilio API, sends SMS to each contact.
 *
 *   Option B — Firebase Cloud Functions:
 *     Firestore write triggers a Cloud Function,
 *     which sends FCM push + Twilio SMS.
 *
 *   Option C — Direct device SMS (limited):
 *     import * as SMS from 'expo-sms';
 *     SMS.sendSMSAsync(phoneNumbers, message);
 *     (Requires user confirmation on iOS — not silent)
 *
 * Architecture:
 *   triggerSOS() → backend API → contacts notified
 *   All calls are fire-and-forget with local queue fallback
 *   (QueueService stores the alert if offline)
 *
 * DO NOT implement real alert dispatch here.
 * This file is owned by: feature/placeholder-services
 */

import { QueueService } from '../storage/QueueService';
import { StorageService } from '../storage/StorageService';
import type { EmergencyContact } from '../types';
import * as SMS from 'expo-sms';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SOSPayload {
  contactIds: string[];
  /** GPS coordinates — null if location unavailable */
  latitude: number | null;
  longitude: number | null;
  /** Triggered manually or by crash detection */
  triggeredBy: 'manual' | 'crash';
  rideSessionId?: string;
  timestamp: number;
}

export interface SOSResult {
  success: boolean;
  queued: boolean;
  alertId: string;
  smsOpened?: boolean;
  error?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const EmergencyService = {

  /**
   * Trigger an SOS alert to a list of emergency contacts.
   *
   * Current behaviour: queues the alert for later sync (offline-safe).
   *
   * TODO: Replace with real implementation:
   *   const response = await fetch('https://your-api.com/api/sos', {
   *     method: 'POST',
   *     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
   *     body: JSON.stringify(payload),
   *   });
   *   if (!response.ok) throw new Error('SOS dispatch failed');
   */
  async triggerSOS(
    contacts: EmergencyContact[],
    location: { latitude: number | null; longitude: number | null },
    triggeredBy: 'manual' | 'crash' = 'manual',
    rideSessionId?: string,
  ): Promise<SOSResult> {
    const payload: SOSPayload = {
      contactIds: contacts.map((c) => c.id),
      latitude: location.latitude,
      longitude: location.longitude,
      triggeredBy,
      rideSessionId,
      timestamp: Date.now(),
    };

    console.warn('[EmergencyService] triggerSOS() — mock mode:', payload);

    // Queue for offline safety — sent when online if offlineModeEnabled is true
    let queuedId = 'mock-alert-id';
    let offlineModeEnabled = true;
    try {
      const prefRes = await StorageService.get<Record<string, unknown>>('@ridesafe/user_preferences');
      if (prefRes.success && prefRes.data) {
        offlineModeEnabled = (prefRes.data.offlineModeEnabled as boolean) ?? true;
      }
    } catch {
      // Ignore
    }

    if (offlineModeEnabled) {
      const queued = await QueueService.enqueue('sos', payload as unknown as Record<string, unknown>);
      queuedId = queued.id;
    }

    const phoneNumbers = contacts
      .map((contact) => contact.phone.trim())
      .filter((phone) => phone.length > 0);

    let smsOpened = false;
    if (phoneNumbers.length > 0) {
      try {
        const smsAvailable = await SMS.isAvailableAsync();
        if (smsAvailable) {
          const message = EmergencyService.buildAlertMessage('RideSafe user', location, triggeredBy);
          await SMS.sendSMSAsync(phoneNumbers, message);
          smsOpened = true;
        }
      } catch (error) {
        console.warn('[EmergencyService] SMS composer failed:', error);
      }
    }

    // TODO: attempt immediate backend send if online
    // const result = await fetch('/api/sos', { method: 'POST', body: JSON.stringify(payload) });

    return {
      success: true, // mock — real success requires API confirmation
      queued: offlineModeEnabled,
      alertId: queuedId,
      smsOpened,
    };
  },

  /**
   * Cancel a pending SOS alert (within the countdown window).
   *
   * TODO: Call backend cancel endpoint if alert was already sent.
   */
  async cancelSOS(alertId: string): Promise<void> {
    console.warn('[EmergencyService] cancelSOS():', alertId);
    await QueueService.remove(alertId);
    // TODO: await fetch(`/api/sos/${alertId}/cancel`, { method: 'POST' });
  },

  /**
   * Build the SMS/notification message text sent to contacts.
   * Centralised here so message format is consistent.
   */
  buildAlertMessage(
    riderName: string,
    location: { latitude: number | null; longitude: number | null },
    triggeredBy: 'manual' | 'crash',
  ): string {
    const trigger = triggeredBy === 'crash' ? 'A crash was detected' : 'manually triggered an SOS alert';
    const locationText =
      location.latitude !== null && location.longitude !== null
        ? `https://maps.google.com/?q=${location.latitude},${location.longitude}`
        : 'Location unavailable';

    return (
      `🚨 RIDESAFE EMERGENCY ALERT\n\n` +
      `${riderName} ${trigger}.\n\n` +
      `Last known location:\n${locationText}\n\n` +
      `Please check on them immediately.`
    );
  },
} as const;
