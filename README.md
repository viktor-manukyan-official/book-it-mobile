# BookIt Mobile

React Native (Expo) mobile app for customers to discover and book restaurants, services, and activities in Armenia.

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based)
- **Language**: TypeScript

## Prerequisites

- Node.js >= 20
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npx expo`)
- iOS Simulator (macOS) or Android Emulator, or Expo Go on a physical device

## Setup

```bash
# Install dependencies
npm install

# Start the development server
npx expo start
```

Then press `i` for iOS Simulator, `a` for Android Emulator, or scan the QR code with Expo Go.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run ios` | Start on iOS Simulator |
| `npm run android` | Start on Android Emulator |
| `npm run web` | Start web version |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type check (`tsc --noEmit`) |

## Phone + OTP authentication (Firebase)

Customer sign-in uses phone number + SMS OTP via **Firebase Authentication**
(`@react-native-firebase/app` + `@react-native-firebase/auth`). The app verifies
the OTP client-side, obtains a Firebase ID token, and exchanges it with the
backend (`authenticateWithFirebase`) for a **BookIt JWT** session, which is stored
in `expo-secure-store`. The Firebase ID token is used only for that one exchange;
all other API calls use the BookIt access token.

### Requirements — this does NOT run in Expo Go

Native phone auth needs a **custom dev build**. Expo Go cannot execute the native
Firebase modules.

1. **Public Firebase config only.** Add the platform config files at the repo root
   (referenced from `app.json`):
   - iOS: `GoogleService-Info.plist`
   - Android: `google-services.json`

   > These are **public client** config files. Never commit the `firebase-admin`
   > service-account key to this app — it is a backend secret and was removed from
   > this repo. Rotate it in the Firebase console if it was ever exposed.

2. **Backend URL.** Set `EXPO_PUBLIC_API_URL` (e.g. `https://api.bookit.am`) or
   `expo.extra.apiUrl` in `app.json`. Defaults to `http://localhost:3000`.

3. **Build and run a dev build:**
   ```bash
   npx expo prebuild
   npx expo run:ios      # or run:android
   # or, with EAS:
   eas build --profile development
   ```

4. **Firebase console setup:** enable Phone provider; for iOS configure APNs
   (silent push) or reCAPTCHA fallback; for Android register the app's SHA-1 /
   SHA-256 fingerprints and enable Play Integrity / reCAPTCHA fallback. Add
   **test phone numbers** to bypass real SMS during QA.

### QA limitation

The full OTP flow (SMS delivery + code confirmation) **cannot be exercised
headless** — it needs a real device/emulator dev build and a configured Firebase
project. Static checks (`npm run lint`, `npm run typecheck`) cover the code; the
OTP happy path and route gating are verified manually on a dev build.
