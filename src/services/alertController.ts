import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { stopBackgroundLocationUpdates } from './sosService';

let sound: Audio.Sound | null = null;
let vibrateTimer: ReturnType<typeof setInterval> | null = null;
let volumeEnforceTimer: ReturnType<typeof setInterval> | null = null;
let active = false;

const MAX_ALERT_VOLUME = 1.0;

export const AlertController = {
  async startAlert(): Promise<void> {
    if (active) return;
    active = true;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });
      const { sound: s } = await Audio.Sound.createAsync(
        require('../assets/sounds/alarm.mp3'),
        { isLooping: true, shouldPlay: true, volume: MAX_ALERT_VOLUME, isMuted: false },
      );
      if (!active) {
        await s.unloadAsync();
        return;
      }
      sound = s;
      await sound.setVolumeAsync(MAX_ALERT_VOLUME);
      await sound.setIsMutedAsync(false);
      await sound.playAsync();
    } catch (e) {
      console.warn('[AlertController] Local MP3 playback failed, attempting WAV fallback:', e);
      try {
        const { sound: s } = await Audio.Sound.createAsync(
          { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav' },
          { isLooping: true, shouldPlay: true, volume: MAX_ALERT_VOLUME, isMuted: false },
        );
        if (!active) {
          await s.unloadAsync();
          return;
        }
        sound = s;
        await sound.setVolumeAsync(MAX_ALERT_VOLUME);
        await sound.setIsMutedAsync(false);
        await sound.playAsync();
      } catch (fallbackError) {
        console.error('[AlertController] Audio fallback also failed:', fallbackError);
      }
    }

    volumeEnforceTimer = setInterval(() => {
      if (!sound) return;
      void sound.setVolumeAsync(MAX_ALERT_VOLUME);
      void sound.setIsMutedAsync(false);
    }, 700);

    vibrateTimer = setInterval(() => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }, 2000);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  async stopAlert(): Promise<void> {
    active = false;
    if (vibrateTimer) {
      clearInterval(vibrateTimer);
      vibrateTimer = null;
    }
    if (volumeEnforceTimer) {
      clearInterval(volumeEnforceTimer);
      volumeEnforceTimer = null;
    }
    try {
      stopBackgroundLocationUpdates();
    } catch (err) {
      console.warn('[AlertController] Failed to stop background location sync:', err);
    }
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }
    } catch (e) {
      console.warn('[AlertController] Stop playback failed:', e);
    }
    sound = null;
  },
} as const;
