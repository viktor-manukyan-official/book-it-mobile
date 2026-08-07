import * as SecureStore from "expo-secure-store";

// App interface language preference (BOOK-80). Persisted on device. NOTE: this
// stores the choice only — wiring it into an i18n layer that translates every
// screen is a separate effort. Venue/service names always stay as published.
export type LanguageCode = "en" | "hy" | "ru";

export const LANGUAGES: { code: LanguageCode; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hy", label: "Armenian", native: "Հայերեն" },
  { code: "ru", label: "Russian", native: "Русский" },
];

const KEY = "bookit_language";

export async function getLanguage(): Promise<LanguageCode> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (raw === "en" || raw === "hy" || raw === "ru") return raw;
  } catch {
    /* ignore */
  }
  return "en";
}

export async function setLanguage(code: LanguageCode): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, code);
  } catch {
    /* best-effort */
  }
}
