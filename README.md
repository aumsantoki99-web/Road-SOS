# RideSafe 🛡️

> **Your smart rider safety companion**
> A production-quality mobile app for bikers, cyclists, delivery riders, solo travelers, and commuters.

---

## Overview

RideSafe monitors your rides, detects crashes, alerts your emergency contacts, and helps you find nearby hospitals — all with offline-first resilience and a premium dark-steel safety aesthetic.

This repository contains the **complete frontend skeleton**. Backend, ML, and sensor modules integrate via the placeholder service layer.

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/your-org/ridesafe.git
cd ridesafe

# 2. Install (Node 18+ required)
npm install

# 3. Start
npm start
# Scan QR code with Expo Go (SDK 54)
# Press 'a' for Android emulator, 'i' for iOS simulator
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + **Expo SDK 54** |
| Language | TypeScript (strict mode) |
| Navigation | React Navigation v6 |
| State | Context API + useReducer |
| Storage | AsyncStorage via StorageService |
| Animations | React Native Animated API |
| Icons | @expo/vector-icons (Ionicons) |
| Gradients | expo-linear-gradient |

---

## Scripts

| Script | Description |
|---|---|
| `npm start` | Start Expo dev server |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run type-check` | TypeScript validation |
| `npm run lint` | ESLint with auto-fix |
| `npm run format` | Prettier format |

---

## Project Structure

```
RideSafe/
├── App.tsx                          # Root — provider tree
├── index.js                         # Entry point
├── app.json                         # Expo SDK 54 config
├── tsconfig.json                    # Strict TypeScript
├── BRANCHES.md                      # Team branching guide
├── ACCESSIBILITY.md                 # A11y audit + checklist
└── src/
    ├── components/
    │   ├── common/                  # AppHeader, CustomButton, ToggleSwitch...
    │   ├── cards/                   # EmergencyCard, ActionCard, RideStatusCard...
    │   ├── buttons/                 # FloatingSOSButton
    │   └── banners/                 # StatusBanner, OfflineBanner
    ├── screens/
    │   ├── Home/                    # HomeScreen, SOSConfirmationScreen
    │   ├── RideMonitoring/          # RideMonitoringScreen, SpeedGauge
    │   ├── EmergencyContacts/       # CRUD screens + ContactFormSheet
    │   ├── NearbyHospitals/         # List + HospitalDetailScreen
    │   ├── OfflineMode/             # OfflineModeScreen
    │   └── Settings/                # SettingsScreen
    ├── context/                     # ThemeContext, AppStateContext, NetworkContext
    ├── hooks/                       # 12 custom hooks
    ├── services/                    # 5 integration-ready placeholder services
    ├── storage/                     # StorageService, QueueService
    ├── navigation/                  # AppNavigator, TabNavigator, CustomTabBar
    ├── theme/                       # colors, typography, spacing, shadows
    ├── types/                       # All TypeScript types
    ├── constants/                   # STORAGE_KEYS, DEFAULT_PREFERENCES...
    ├── utils/                       # Formatters, validators, a11y helpers
    └── mock/                        # Static mock data
```

---

## Design System

### Color Palettes
| Mode | Trigger | Character |
|---|---|---|
| **Dark** | System dark / forced | Deep slate + electric amber |
| **Light** | System light / forced | Clean white + warm amber |
| **Night** | Auto mode after 19:00 | Near-black + high-contrast crimson |

**Night mode** reduces display glare while riding after sunset. Activates automatically in `auto` theme mode. Toggle in Settings → Appearance → Auto.

### Typography
- **Display / Headers:** Syne (geometric, confident)
- **UI / Body:** DM Sans (clean, readable at speed)
- **Stats / Timer:** System monospace (consistent number width)

### Key Metrics
- Base grid: 4pt
- Minimum touch target: 44pt (Apple HIG)
- Border radius scale: xs(4) → full(9999)

---

## Path Aliases

```typescript
import { CustomButton }   from '@components/common';
import { useRideSession } from '@hooks';
import { colors }         from '@theme/colors';
import { StorageService } from '@storage';
import { EmergencyService } from '@services/emergency.service';
```

Configured in `tsconfig.json` + `babel.config.js`.

---

## Backend Integration Guide

### Crash Detection
- **File:** `src/services/crashDetection.service.ts`
- **Connect:** `expo-sensors` Accelerometer + ML model
- **Wire point:** `RideMonitoringScreen` → `CrashDetectionService.onCrashDetected()`

### SOS Alerts
- **File:** `src/services/emergency.service.ts`
- **Connect:** Twilio SMS / Firebase Cloud Functions
- **Wire point:** `SOSConfirmationScreen` on countdown complete

### Backend Sync
- **File:** `src/services/sync.service.ts`
- **Connect:** Firebase Firestore / REST API
- **Wire point:** `NetworkContext.flush()` on reconnect

### Hospital Lookup
- **File:** `src/services/hospital.service.ts`
- **Connect:** Google Places API + `expo-location`
- **Wire point:** `NearbyHospitalsScreen` → `HospitalService.getNearby()`

### Push Notifications
- **File:** `src/services/notification.service.ts`
- **Connect:** `expo-notifications` + Expo Push Service
- **Wire point:** `CrashDetectionService.onCrashDetected()`

---

## Accessibility

Full audit in `ACCESSIBILITY.md`.

- ✅ WCAG 2.1 AA colour contrast on all 3 themes
- ✅ 44pt minimum touch targets throughout
- ✅ VoiceOver / TalkBack compatible
- ✅ `useReducedMotion()` — pauses animations when system preference set
- ✅ `useScreenReader()` — announces dynamic state changes
- ✅ Font scaling up to 1.5× tested

---

## Branching Strategy

See `BRANCHES.md` for the full team guide.

```
main ← dev ← feature/*
```

All 15 branches complete. Each branch is an independently mergeable unit.

---

## Branch Summary

| Branch | Owner | Status |
|---|---|---|
| `feature/app-setup` | Lead Developer | ✅ |
| `feature/theme-system` | UI Developer | ✅ |
| `feature/navigation-system` | Frontend Developer | ✅ |
| `feature/reusable-components` | UI Developer | ✅ |
| `feature/home-screen` | UI Developer | ✅ |
| `feature/ride-monitoring` | Frontend Developer | ✅ |
| `feature/emergency-contacts` | Frontend Developer | ✅ |
| `feature/offline-mode` | Frontend Developer | ✅ |
| `feature/hospital-screen` | UI Developer | ✅ |
| `feature/settings-screen` | Frontend Developer | ✅ |
| `feature/local-storage` | Backend-leaning FE | ✅ |
| `feature/placeholder-services` | Integration Developer | ✅ |
| `feature/animations` | UI Developer | ✅ |
| `feature/accessibility` | Any Developer | ✅ |
| `feature/refactor-cleanup` | Tech Lead | ✅ |

---

*RideSafe Frontend Skeleton — Expo SDK 54 · TypeScript Strict · Offline-First*
