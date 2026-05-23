import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

let sound: Audio.Sound | null = null;
let vibrateTimer: ReturnType<typeof setInterval> | null = null;
let active = false;

export const AlertController = {
  async startAlert(): Promise<void> {
    if (active) return;
    active = true;

    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound: s } = await Audio.Sound.createAsync(
        require('../assets/sounds/alarm.mp3'),
        { isLooping: true, shouldPlay: true },
      );
      sound = s;
    } catch (e) {
      console.warn('[AlertController] Local MP3 playback failed, attempting WAV fallback:', e);
      try {
        const { sound: s } = await Audio.Sound.createAsync(
          { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav' },
          { isLooping: true, shouldPlay: true },
        );
        sound = s;
      } catch (fallbackError) {
        console.error('[AlertController] Audio fallback also failed:', fallbackError);
      }
    }

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
