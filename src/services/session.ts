import * as SecureStore from "expo-secure-store";

import type { Session, UserProfile } from "../types/auth";

// Keys for the BookIt JWT tokens + cached user in the device secure store.
const ACCESS_TOKEN_KEY = "bookit.accessToken";
const REFRESH_TOKEN_KEY = "bookit.refreshToken";
const USER_KEY = "bookit.user";

export async function saveSession(session: Session): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken);
}

export async function getSession(): Promise<Session | null> {
  const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!accessToken || !refreshToken) {
    return null;
  }
  return { accessToken, refreshToken };
}

/** Cache the authenticated user's profile for display (e.g. the Profile tab). */
export async function saveUser(user: UserProfile): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getUser(): Promise<UserProfile | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}
