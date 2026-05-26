# RideSafe 🛡️

<div align="center">

**A smart rider safety companion for emergency-aware mobility.**

Built by **Team Neurobyte** for riders, cyclists, delivery partners, solo travelers, and daily commuters who need a safety net that feels fast, calm, and dependable.

![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=0B1220)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Offline First](https://img.shields.io/badge/Offline--First-Ready-F59E0B?style=for-the-badge)
![Accessibility](https://img.shields.io/badge/Accessibility-WCAG%20AA-14B8A6?style=for-the-badge)

</div>

---

## Overview

**RideSafe** is a production-quality mobile frontend for rider protection. It monitors rides, detects crash scenarios through the service layer, alerts emergency contacts, supports SOS escalation, helps locate nearby hospitals, and keeps critical flows resilient with offline-first foundations.

The app is designed around a **dark-steel emergency-tech identity**: deep slate surfaces, high-visibility amber interactions, teal safe states, and crimson reserved for true emergency moments.

> This repository contains the complete frontend skeleton. Backend, ML, notification, SMS, and sensor integrations connect through the existing placeholder service layer.

---

## Why RideSafe?

Riders often travel alone, at night, through low-connectivity areas, or under time pressure. In an emergency, an app should not feel busy or fragile. RideSafe focuses on:

- **Fast emergency recognition** with a dedicated SOS flow and high-contrast emergency states.
- **Low-stress interaction design** using large touch targets, clear copy, and readable visual hierarchy.
- **Offline-first resilience** so critical user context can remain available when connectivity is unstable.
- **Trust-building feedback** through status banners, safety state indicators, countdowns, and confirmation screens.
- **Integration-ready architecture** so backend, SMS, push, location, and crash detection modules can be connected cleanly.

---

## Core Features

| Area | What RideSafe Provides |
|---|---|
| **SOS Emergency Flow** | SOS confirmation, countdown, cancellation path, and dispatched alert state. |
| **Ride Monitoring** | Ride session UI, speed-focused components, ride history, and safety monitoring surfaces. |
| **Crash Response** | Crash countdown and dead-man-switch screens wired through crash detection services. |
| **Emergency Contacts** | Contact management screens and primary-contact alert presentation. |
| **Nearby Hospitals** | Hospital list and detail screens ready for location/API integration. |
| **Offline Mode** | Offline banners, queue/storage services, and reconnect sync foundations. |
| **Settings & Medical ID** | Preferences, profile setup, appearance controls, and emergency profile surfaces. |
| **Accessibility** | Screen reader support, reduced motion handling, minimum touch targets, and contrast-focused themes. |

---

## UX & Safety Principles

RideSafe is designed for stressful, time-sensitive moments. The interface prioritizes clarity over decoration.

- **Emergency actions are visually unmistakable.** Crimson is reserved for SOS, crash, and destructive states.
- **Safe and active states are distinct.** Teal communicates monitoring, readiness, and stability.
- **Touch targets stay rider-friendly.** Controls follow a 44pt minimum target guideline.
- **Motion is meaningful and respectful.** Animations guide attention, and reduced-motion preferences are supported.
- **Critical copy is direct.** Labels avoid ambiguity in countdowns, alerts, and cancel paths.
- **Themes serve safety.** Dark, light, and night palettes are tuned for readability and reduced glare.

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
| Language | TypeScript strict mode |
| Navigation | React Navigation v6 |
| State | Context API + useReducer |
| Storage | AsyncStorage via StorageService |
| Animations | React Native Animated API |
| Icons | @expo/vector-icons / Ionicons |
| Gradients | expo-linear-gradient |

---

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start Expo dev server |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run type-check` | Run TypeScript validation |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run format` | Format source files with Prettier |

---

## Architecture

RideSafe keeps presentation, state, services, storage, navigation, and theme concerns separated so integrations can be added without reshaping the app.

```text
RideSafe/
├── App.tsx                          # Root provider tree
├── index.js                         # Entry point
├── app.json                         # Expo SDK 54 config
├── tsconfig.json                    # Strict TypeScript config
├── BRANCHES.md                      # Branching guide
├── ACCESSIBILITY.md                 # Accessibility audit + checklist
└── src/
    ├── components/
    │   ├── common/                  # AppHeader, CustomButton, ToggleSwitch
    │   ├── cards/                   # EmergencyCard, ActionCard, RideStatusCard
    │   ├── buttons/                 # FloatingSOSButton
    │   └── banners/                 # StatusBanner, OfflineBanner
    ├── screens/
    │   ├── Home/                    # HomeScreen, SOSConfirmationScreen
    │   ├── RideMonitoring/          # RideMonitoringScreen, SpeedGauge
    │   ├── EmergencyContacts/       # Contact CRUD screens + form sheet
    │   ├── NearbyHospitals/         # Hospital list + detail screen
    │   ├── OfflineMode/             # OfflineModeScreen
    │   └── Settings/                # SettingsScreen, Medical ID
    ├── context/                     # Theme, app state, network, localization
    ├── hooks/                       # Custom app hooks
    ├── services/                    # Integration-ready service layer
    ├── storage/                     # StorageService, QueueService
    ├── navigation/                  # AppNavigator, tabs, navigation refs
    ├── theme/                       # Colors, typography, spacing, shadows
    ├── types/                       # Shared TypeScript types
    ├── constants/                   # Storage keys and defaults
    ├── utils/                       # Formatters, validators, a11y helpers
    └── mock/                        # Static mock data
```

---

## Design System

### Color Modes

| Mode | Trigger | Character |
|---|---|---|
| **Dark** | System dark / forced | Deep slate + electric amber |
| **Light** | System light / forced | Clean white + warm amber |
| **Night** | Auto mode after 19:00 | Near-black + high-contrast crimson |

Night mode reduces display glare while riding after sunset. It activates automatically in `auto` theme mode and can be configured in **Settings → Appearance → Auto**.

### Typography

| Role | Typeface |
|---|---|
| Display / Headers | Syne |
| UI / Body | DM Sans |
| Stats / Timer | System monospace |

### Key Metrics

- Base grid: **4pt**
- Minimum touch target: **44pt**
- Border radius scale: **xs(4) → full(9999)**

---

## Backend Integration Guide

The frontend is structured for clean handoff into real backend, ML, SMS, notification, and location services.

| Integration | File | Connect | Wire Point |
|---|---|---|---|
| Crash Detection | `src/services/crashDetection.service.ts` | `expo-sensors` Accelerometer + ML model | `RideMonitoringScreen` → `CrashDetectionService.onCrashDetected()` |
| SOS Alerts | `src/services/emergency.service.ts` | Twilio SMS / Firebase Cloud Functions | `SOSConfirmationScreen` on countdown complete |
| Backend Sync | `src/services/sync.service.ts` | Firebase Firestore / REST API | `NetworkContext.flush()` on reconnect |
| Hospital Lookup | `src/services/hospital.service.ts` | Google Places API + `expo-location` | `NearbyHospitalsScreen` → `HospitalService.getNearby()` |
| Push Notifications | `src/services/notification.service.ts` | `expo-notifications` + Expo Push Service | `CrashDetectionService.onCrashDetected()` |

---

## Path Aliases

```typescript
import { CustomButton } from '@components/common';
import { useRideSession } from '@hooks';
import { colors } from '@theme/colors';
import { StorageService } from '@storage';
import { EmergencyService } from '@services/emergency.service';
```

Configured in `tsconfig.json` and `babel.config.js`.

---

## Accessibility

Full audit: [`ACCESSIBILITY.md`](ACCESSIBILITY.md)

- WCAG 2.1 AA color contrast across all 3 themes
- 44pt minimum touch targets throughout
- VoiceOver / TalkBack compatible patterns
- `useReducedMotion()` pauses decorative motion when enabled
- `useScreenReader()` supports dynamic state announcements
- Font scaling up to 1.5x tested

---

## Branching Strategy

Full guide: [`BRANCHES.md`](BRANCHES.md)

```text
main ← dev ← feature/*
```

### Branch Summary

| Branch | Owner | Status |
|---|---|---|
| `feature/app-setup` | Lead Developer | Complete |
| `feature/theme-system` | UI Developer | Complete |
| `feature/navigation-system` | Frontend Developer | Complete |
| `feature/reusable-components` | UI Developer | Complete |
| `feature/home-screen` | UI Developer | Complete |
| `feature/ride-monitoring` | Frontend Developer | Complete |
| `feature/emergency-contacts` | Frontend Developer | Complete |
| `feature/offline-mode` | Frontend Developer | Complete |
| `feature/hospital-screen` | UI Developer | Complete |
| `feature/settings-screen` | Frontend Developer | Complete |
| `feature/local-storage` | Backend-leaning FE | Complete |
| `feature/placeholder-services` | Integration Developer | Complete |
| `feature/animations` | UI Developer | Complete |
| `feature/accessibility` | Any Developer | Complete |
| `feature/refactor-cleanup` | Tech Lead | Complete |

---

## Team Neurobyte

Built with focus, speed, and care by:

| Team Member |
|---|
| Aum Santoki |
| Deepam Raval |
| Hetvi Patoliya |
| Jwal Korat |
| Kashvi Porwal |
| Palash Kulkarni |
| Pranshu Pujara |
| Tanishk Joshi |

---

## Footer

**RideSafe** is a hackathon-built emergency safety frontend focused on credible UX, integration readiness, accessibility, and offline-first rider protection.

<div align="center">

**RideSafe by Team Neurobyte**  
Expo SDK 54 · TypeScript Strict · Offline-First · Emergency-Focused

</div>
