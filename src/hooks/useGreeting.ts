/**
 * useGreeting — Time-aware greeting hook
 *
 * Returns a greeting based on the current hour of day.
 * Updates reactively when the hour changes (polls every minute).
 *
 * Morning   05:00–11:59 → "Good morning"
 * Afternoon 12:00–16:59 → "Good afternoon"
 * Evening   17:00–20:59 → "Good evening"
 * Night     21:00–04:59 → "Ride safe tonight"  ← rider-specific at night
 *
 * Usage:
 *   const { greeting, emoji, isNightRide } = useGreeting();
 */

import { useEffect, useState } from 'react';

type GreetingPeriod = 'morning' | 'afternoon' | 'evening' | 'night';

interface GreetingResult {
  greeting: string;
  subtext: string;
  emoji: string;
  period: GreetingPeriod;
  isNightRide: boolean;
}

function resolveGreeting(hour: number): GreetingResult {
  if (hour >= 5 && hour < 12) {
    return {
      greeting: 'Good morning',
      subtext: 'Stay protected on every ride.',
      emoji: '☀️',
      period: 'morning',
      isNightRide: false,
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      greeting: 'Good afternoon',
      subtext: 'Your safety companion is ready.',
      emoji: '🌤️',
      period: 'afternoon',
      isNightRide: false,
    };
  }
  if (hour >= 17 && hour < 21) {
    return {
      greeting: 'Good evening',
      subtext: 'Night mode activates after 7 PM.',
      emoji: '🌆',
      period: 'evening',
      isNightRide: false,
    };
  }
  return {
    greeting: 'Ride safe tonight',
    subtext: 'High-contrast night mode is active.',
    emoji: '🌙',
    period: 'night',
    isNightRide: true,
  };
}

export function useGreeting(): GreetingResult {
  const [hour, setHour] = useState(() => new Date().getHours());

  useEffect(() => {
    // Update every minute to catch hour changes
    const interval = setInterval(() => {
      setHour(new Date().getHours());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  return resolveGreeting(hour);
}
