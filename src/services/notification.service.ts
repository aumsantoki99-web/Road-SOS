/**
 * NotificationService — Placeholder
 *
 * Integration point for push notification scheduling and dispatch.
 *
 * When connecting real notifications:
 *   npx expo install expo-notifications
 *
 *   import * as Notifications from 'expo-notifications';
 *
 *   // Request permission
 *   const { status } = await Notifications.requestPermissionsAsync();
 *
 *   // Schedule local notification
 *   await Notifications.scheduleNotificationAsync({
 *     content: { title, body, data },
 *     trigger: { seconds: delay },
 *   });
 *
 *   // Get push token for remote notifications
 *   const token = await Notifications.getExpoPushTokenAsync();
 *   // Send token to backend to enable server-push alerts
 *
 * DO NOT implement real notification logic here.
 * This file is owned by: feature/placeholder-services
 */

export type NotificationType =
  | 'crash_detected'
  | 'sos_sent'
  | 'sos_cancelled'
  | 'ride_reminder'
  | 'sync_complete';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export const NotificationService = {

  /** Whether push permissions have been granted */
  isPermissionGranted: false,

  /**
   * Request push notification permissions from the user.
   *
   * TODO:
   *   const { status } = await Notifications.requestPermissionsAsync();
   *   this.isPermissionGranted = status === 'granted';
   *   return status === 'granted';
   */
  async requestPermissions(): Promise<boolean> {
    console.warn('[NotificationService] requestPermissions() — mock. Wire expo-notifications here.');
    this.isPermissionGranted = true; // mock approval
    return true;
  },

  /**
   * Schedule a local notification.
   *
   * TODO:
   *   await Notifications.scheduleNotificationAsync({
   *     content: { title: payload.title, body: payload.body, data: payload.data },
   *     trigger: delaySeconds ? { seconds: delaySeconds } : null,
   *   });
   */
  async schedule(
    payload: NotificationPayload,
    _delaySeconds = 0,
  ): Promise<string> {
    console.warn('[NotificationService] schedule() — mock:', payload.type);
    // Return a mock notification ID
    return `mock-notif-${Date.now()}`;
  },

  /**
   * Cancel a scheduled notification by ID.
   *
   * TODO: await Notifications.cancelScheduledNotificationAsync(notifId);
   */
  async cancel(notifId: string): Promise<void> {
    console.warn('[NotificationService] cancel():', notifId);
    // TODO: await Notifications.cancelScheduledNotificationAsync(notifId);
  },

  /**
   * Send a crash detected notification immediately.
   * Called by CrashDetectionService listener in RideMonitoringScreen.
   */
  async notifyCrashDetected(countdownSeconds: number): Promise<void> {
    await this.schedule({
      type: 'crash_detected',
      title: '🚨 Crash Detected',
      body: `RideSafe will alert your contacts in ${countdownSeconds} seconds. Open app to cancel.`,
      data: { screen: 'SOSConfirmation' },
    });
  },

  /**
   * Send SOS dispatched confirmation.
   */
  async notifySOSSent(contactCount: number): Promise<void> {
    await this.schedule({
      type: 'sos_sent',
      title: '✅ SOS Alert Sent',
      body: `Emergency alert sent to ${contactCount} contact${contactCount !== 1 ? 's' : ''}.`,
    });
  },

  /**
   * Get the Expo Push Token for remote notifications.
   *
   * TODO:
   *   const token = await Notifications.getExpoPushTokenAsync({
   *     projectId: Constants.expoConfig?.extra?.eas?.projectId,
   *   });
   *   return token.data;
   */
  async getPushToken(): Promise<string | null> {
    console.warn('[NotificationService] getPushToken() — mock. Wire expo-notifications here.');
    return null;
  },
};
