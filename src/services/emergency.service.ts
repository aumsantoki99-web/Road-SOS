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
import type { EmergencyContact, CrashSensitivity } from '../types';

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

    // Queue for offline safety — sent when online
    const queued = await QueueService.enqueue('sos', payload as unknown as Record<string, unknown>);

    // TODO: attempt immediate send if online
    // const result = await fetch('/api/sos', { method: 'POST', body: JSON.stringify(payload) });

    return {
      success: true, // mock — real success requires API confirmation
      queued: true,
      alertId: queued.id,
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
