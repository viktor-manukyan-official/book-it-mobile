import * as SecureStore from "expo-secure-store";

// Remembers the venue the customer last landed on so Home is stable across
// launches and forward-compatible with multi-venue discovery (BOOK-67). This
// is not sensitive data, but SecureStore is already the app's storage layer so
// we avoid pulling in another dependency.
const LAST_VENUE_KEY = "bookit_last_venue_id";

export async function getLastVenueId(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(LAST_VENUE_KEY);
  } catch {
    return null;
  }
}

export async function setLastVenueId(id: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(LAST_VENUE_KEY, id);
  } catch {
    // Best-effort — a persistence failure just means Home falls back to the
    // backend default next launch.
  }
}
