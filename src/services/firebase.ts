import {
  getAuth,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "@react-native-firebase/auth";

// Firebase phone-auth wrappers (client-side SMS OTP).
//
// IMPORTANT: this uses the PUBLIC Firebase client config only. The native
// google-services.json / GoogleService-Info.plist supply it at build time.
// The firebase-admin service-account key must NEVER live in this app.
//
// Native phone auth requires a custom dev build — it does NOT run in Expo Go.

export type { ConfirmationResult };

/**
 * Trigger Firebase SMS phone auth for an E.164 number.
 * Returns a confirmation handle used to verify the OTP code the user receives.
 */
export function sendOtp(phoneE164: string): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(getAuth(), phoneE164);
}

// The confirmation handle is not serializable, so it cannot travel through
// expo-router params. Hold the in-flight handle in module memory between the
// phone-entry and OTP screens instead.
let pendingConfirmation: ConfirmationResult | null = null;

export function setPendingConfirmation(confirmation: ConfirmationResult): void {
  pendingConfirmation = confirmation;
}

export function getPendingConfirmation(): ConfirmationResult | null {
  return pendingConfirmation;
}

export function clearPendingConfirmation(): void {
  pendingConfirmation = null;
}

/**
 * Verify the SMS code against a confirmation handle and return a fresh
 * Firebase ID token (forceRefresh) to send to the BookIt backend.
 */
export async function confirmOtp(
  confirmation: ConfirmationResult,
  code: string,
): Promise<string> {
  const credential = await confirmation.confirm(code);
  const user = credential?.user;
  if (!user) {
    throw new Error("OTP confirmation did not return a user.");
  }
  return user.getIdToken(true);
}
