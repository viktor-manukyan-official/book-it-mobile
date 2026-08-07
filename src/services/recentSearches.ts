import * as SecureStore from "expo-secure-store";

// Recent search queries, persisted per user on the device (BOOK-68). Only
// queries that produced a tap-through are recorded; capped and de-duplicated,
// newest first. SecureStore keys allow [A-Za-z0-9._-] only, so the user id
// (a UUID) is used verbatim and non-conforming ids fall back to "anon".
const MAX_RECENTS = 5;
const PREFIX = "bookit_recent_searches_";

function keyFor(userId: string | null | undefined): string {
  const safe = userId && /^[A-Za-z0-9._-]+$/.test(userId) ? userId : "anon";
  return `${PREFIX}${safe}`;
}

export async function getRecentSearches(userId: string | null): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(keyFor(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export async function addRecentSearch(
  userId: string | null,
  query: string,
): Promise<string[]> {
  const trimmed = query.trim();
  if (!trimmed) return getRecentSearches(userId);
  const current = await getRecentSearches(userId);
  // De-duplicate case-insensitively, newest first, capped.
  const deduped = [
    trimmed,
    ...current.filter((q) => q.toLowerCase() !== trimmed.toLowerCase()),
  ].slice(0, MAX_RECENTS);
  try {
    await SecureStore.setItemAsync(keyFor(userId), JSON.stringify(deduped));
  } catch {
    // Best-effort persistence.
  }
  return deduped;
}

export async function clearRecentSearches(userId: string | null): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(keyFor(userId));
  } catch {
    // Best-effort.
  }
}
