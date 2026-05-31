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

const scheduled = new Map<string, ReturnType<typeof setTimeout>>();

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
    NotificationService.isPermissionGranted = true; // mock approval
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
    delaySeconds = 0,
  ): Promise<string> {
    const notificationId = `local-notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fire = () => {
      console.log('[NotificationService] Notification fired:', payload.type, payload.title);
      scheduled.delete(notificationId);
    };
    if (delaySeconds > 0) {
      const timeout = setTimeout(fire, delaySeconds * 1000);
      scheduled.set(notificationId, timeout);
    } else {
      fire();
    }
    return notificationId;
  },

  /**
   * Cancel a scheduled notification by ID.
   *
   * TODO: await Notifications.cancelScheduledNotificationAsync(notifId);
   */
  async cancel(notifId: string): Promise<void> {
    const timeout = scheduled.get(notifId);
    if (timeout) {
      clearTimeout(timeout);
      scheduled.delete(notifId);
    }
  },

  /**
   * Send a crash detected notification immediately.
   * Called by CrashDetectionService listener in RideMonitoringScreen.
   */
  async notifyCrashDetected(countdownSeconds: number): Promise<void> {
    await NotificationService.schedule({
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
    await NotificationService.schedule({
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
    return null;
  },
};
