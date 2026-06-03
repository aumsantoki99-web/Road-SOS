# Road-SOS (Rescuel) 🏍️🚑

## 🌐 About & Live Download

Official download & guide page for Road-SOS (Resucel) — a React Native safety app for motorcyclists. Features APK download, Gradle build instructions, tech stack overview, and installation guide.

**Live Link**: [pranshupujara.github.io/Rescuel/](https://pranshupujara.github.io/Rescuel/)

**Road-SOS** is a real-time ride monitoring and emergency response application built with React Native. It is designed to act as a digital guardian for motorcyclists by providing a distraction-free riding cockpit, automated crash detection, and intelligent SOS routing that ensures help is always within reach.

---

## ✨ Key Features

- **Live Cockpit Dashboard**: A high-visibility, distraction-free UI that displays real-time speed (KM/H), trip distance, and duration.
- **Automated Crash Detection**: Utilizes device motion sensors (accelerometer/gyroscope) to detect potential accidents and trigger an SOS countdown.
- **Smart Emergency Routing**: Automatically formats and routes emergency SMS messages with live GPS coordinates to pre-configured emergency contacts.
- **Medical Intelligence Map**: Integrates with Google Maps to show live route tracking and plots nearby medical centers, with a specialized legend to highlight Trauma Centers versus regular hospitals.
- **Secure Authentication**: Email and password authentication via Firebase, completely replacing less reliable phone OTP flows, ensuring user accounts are secure and accessible globally.
- **Fluid UI/UX**: Built with custom animations, glassmorphism UI components, high-contrast dark mode support, and premium skeleton loading screens.

---

## 🛠️ Tech Stack

- **Frontend Framework**: [React Native](https://reactnative.dev/) (Bare Workflow via Expo Prebuild)
- **Language**: TypeScript
- **State Management & Routing**: [React Navigation](https://reactnavigation.org/)
- **Maps Integration**: `react-native-maps` with Google Maps SDK
- **Backend & Auth**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Local Storage**: `expo-secure-store`
- **Native Build System**: Gradle (Android)

---

## 📂 Project Structure

```
Road-SOS/
├── android/                 # Native Android code generated via Expo Prebuild
├── src/
│   ├── assets/              # App icons, adaptive icons, and static images
│   ├── components/          # Reusable UI components (Skeleton loaders, Modals, Buttons)
│   ├── context/             # React Contexts (Theme, Auth, Network, AppState)
│   ├── hooks/               # Custom React Hooks (useLiveLocation, useRideSession)
│   ├── navigation/          # React Navigation stacks and routers
│   ├── screens/             # Main application screens (Auth, RideMonitoring, Map)
│   ├── theme/               # Global styling, color palettes, and typography tokens
│   └── utils/               # Helper functions (formatters, validators, math helpers)
├── App.tsx                  # Application entry point and root Provider tree
├── app.json                 # Expo configuration (permissions, splash screen, bundle ID)
└── package.json             # Node.js dependencies and scripts
```

---

## 🚀 Installation & Setup

### Prerequisites
1. **Node.js**: Ensure Node.js (v18+) is installed.
2. **Android Studio**: Required for compiling the native Android application.
3. **Expo CLI**: Installed globally (`npm install -g expo-cli`).
4. **Firebase Account**: Required for Authentication services.

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/Road-SOS.git
cd Road-SOS
npm install
```

### 2. Configure Environment Variables
You must provide your own API keys. Ensure `google-services.json` is placed in the root directory for Firebase Android configuration.

Create a `.env` file in the root if you are using environment variables for the Google Maps API key, or ensure your `app.json` contains your valid Maps key under `android.config.googleMaps.apiKey`.

### 3. Start the Development Server
```bash
npx expo start
```
*Note: Because this project uses custom native modules (Bare Workflow), you cannot use Expo Go. You must build a custom development client or run on an emulator/device.*

### 4. Run on Android Device/Emulator
```bash
npx react-native run-android
# OR
npx expo run:android
```

---

## 📦 Building for Production

### Android (Locally via Gradle)
To generate a standalone, production-ready APK directly on your Windows or Mac machine:
```bash
cd android
.\gradlew clean
.\gradlew assembleRelease
```
The compiled APK will be output to: `android/app/build/outputs/apk/release/app-release.apk`

### iOS (via EAS Build)
Because iOS applications require macOS and Xcode to compile, Windows users can use Expo Application Services (EAS) to build the iOS app in the cloud:
1. Install EAS CLI: `npm install -g eas-cli`
2. Login to your Expo account: `eas login`
3. Configure the project: `eas build:configure`
4. Run the cloud build: `eas build --platform ios`

---

## 🔒 Security & Privacy Configurations

### Firebase Authentication
- The app uses `createUserWithEmailAndPassword` and `signInWithEmailAndPassword`.
- Passwords are never stored locally in plain text; authentication tokens are managed by Firebase and persisted locally using encrypted `expo-secure-store`.

### Android Permissions
The application strictly requests the following permissions in `app.json` / `AndroidManifest.xml`:
- `ACCESS_FINE_LOCATION` & `ACCESS_COARSE_LOCATION`: Required for live routing and mapping nearby hospitals.
- `ACCESS_BACKGROUND_LOCATION`: Required to track the user's ride and detect crashes even when the screen is locked.
- `FOREGROUND_SERVICE`: Ensures the operating system does not kill the app during an active ride.
- `VIBRATE`: Used to provide haptic feedback during SOS countdowns to alert the rider.

### Data Sanitization
- Emergency contact inputs are strictly validated. The app isolates the 10-digit subscriber number from the international prefix (e.g., `+91`) before executing validation to ensure no false negatives occur during SOS routing.

---

## 🎨 Customizing the Native App Icon & Splash Screen

If you need to change the application icon:
1. Replace `src/assets/icon.png` and `src/assets/adaptive-icon.png` with your new assets.
2. Run the Expo Prebuild command to cleanly regenerate the native Android resource directories:
   ```bash
   npx expo prebuild --platform android --clean
   ```
3. Rebuild the application using Gradle.

---

## 🐛 Troubleshooting

- **Google Maps Not Loading / Grey Grid:** Ensure your Google Maps API Key in `app.json` is valid and unrestricted, and that billing is enabled on your Google Cloud Console.
- **Firebase Auth Errors:** Double-check that your `google-services.json` is in the root directory and that the package name in `app.json` (`com.aumus.road_sos`) perfectly matches your Firebase project settings.
- **Gradle Build Failures:** If you encounter `splashscreen_logo` errors, ensure that your native Android `res/drawable` folders contain a valid PNG image, or run `expo prebuild --clean` to reset the native state.

---
*Road-SOS — Ride Hard. Ride Safe.*
