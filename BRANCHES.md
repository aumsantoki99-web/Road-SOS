# RideSafe — Branching Strategy & Team Guide

## Branch Map

```
main
└── dev
    ├── feature/app-setup           ✅ Complete
    ├── feature/theme-system        ✅ Complete
    ├── feature/navigation-system   ✅ Complete
    ├── feature/reusable-components ✅ Complete
    ├── feature/home-screen         ✅ Complete
    ├── feature/ride-monitoring     ✅ Complete
    ├── feature/emergency-contacts  ✅ Complete
    ├── feature/offline-mode        ✅ Complete
    ├── feature/hospital-screen     ✅ Complete
    ├── feature/settings-screen     ✅ Complete
    ├── feature/local-storage       ✅ Complete
    ├── feature/placeholder-services ✅ Complete
    ├── feature/animations          ✅ Complete
    ├── feature/accessibility       ✅ Complete
    └── feature/refactor-cleanup    ✅ Complete
```

## Rules

1. **Never push directly to `main` or `dev`**
2. Always branch from `dev`
3. Open a PR to merge back into `dev`
4. At least 1 reviewer per PR
5. Run `npm run type-check && npm run lint` before opening PR

## Commit Format (Conventional Commits)

```
feat(home): add SOS button with pulse animation
fix(contacts): resolve AsyncStorage race condition
chore(deps): upgrade expo to 54.0.0
refactor(navigation): extract tab config to constants
a11y(sos-button): add screen reader announcement on press
docs(readme): add backend integration notes
```

## Getting Started

```bash
git clone https://github.com/your-org/ridesafe.git
cd ridesafe
npm install
npm start
```

## Backend Integration Points

| Service file | Connect to |
|---|---|
| `crashDetection.service.ts` | expo-sensors + ML model |
| `emergency.service.ts` | Twilio / Firebase Functions |
| `sync.service.ts` | Firestore / REST API |
| `hospital.service.ts` | Google Places API |
| `notification.service.ts` | expo-notifications |
| `NetworkContext` | @react-native-community/netinfo |
| Mock map container | Google Maps SDK / Mapbox |

*Last updated: feature/refactor-cleanup*
