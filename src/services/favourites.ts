import * as SecureStore from "expo-secure-store";

// Saved/favourite venues, persisted per user on the device (BOOK-70). SecureStore
// keys allow [A-Za-z0-9._-] only, so a UUID user id is used verbatim and any
// non-conforming id falls back to "anon".
const PREFIX = "bookit_favourite_venues_";

function keyFor(userId: string | null | undefined): string {
  const safe = userId && /^[A-Za-z0-9._-]+$/.test(userId) ? userId : "anon";
  return `${PREFIX}${safe}`;
}

export async function getFavourites(userId: string | null): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(keyFor(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

/** Toggle a venue's favourite state; returns the new list. */
export async function toggleFavourite(
  userId: string | null,
  venueId: string,
): Promise<string[]> {
  const current = await getFavourites(userId);
  const next = current.includes(venueId)
    ? current.filter((id) => id !== venueId)
    : [venueId, ...current];
  try {
    await SecureStore.setItemAsync(keyFor(userId), JSON.stringify(next));
  } catch {
    // Best-effort persistence.
  }
  return next;
}
