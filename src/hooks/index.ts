/**
 * Custom Hooks barrel — All branches ✅
 *
 * Import from here for clean paths:
 *   import { useRideSession, useFadeIn } from '@hooks';
 */

// feature/home-screen
export { useGreeting }      from './useGreeting';
export { useSOSCountdown }  from './useSOSCountdown';

// feature/ride-monitoring
export { useRideTimer }     from './useRideTimer';
export { useRideSession }   from './useRideSession';

// feature/emergency-contacts
export { useContacts }      from './useContacts';
export { useContactForm }   from './useContactForm';

// feature/local-storage
export { useStorage }       from './useStorage';

// feature/offline-mode
export { useNetworkStatus } from './useNetworkStatus';

// feature/accessibility
export { useReducedMotion } from './useReducedMotion';
export { useScreenReader }  from './useScreenReader';

// feature/animations
export {
  useFadeIn,
  useSlideUp,
  useSpringScale,
  usePulse,
  useShimmer,
  useStagger,
  useCountUp,
} from './useAnimation';
