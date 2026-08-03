import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  clearSession,
  getSession,
  getUser,
  saveSession,
  saveUser,
} from "../services/session";
import type { Session, UserProfile } from "../types/auth";

export interface AuthContextValue {
  session: Session | null;
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Persist a new session + user (after a successful authenticate call). */
  signIn: (session: Session, user: UserProfile) => Promise<void>;
  /** Clear the stored session and return the user to the auth flow. */
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load any persisted session on mount so route gating can decide where to go.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [storedSession, storedUser] = await Promise.all([
          getSession(),
          getUser(),
        ]);
        if (active) {
          setSession(storedSession);
          setUser(storedUser);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (next: Session, nextUser: UserProfile) => {
    await saveSession(next);
    await saveUser(nextUser);
    setSession(next);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    setSession(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      isLoading,
      isAuthenticated: session !== null,
      signIn,
      signOut,
    }),
    [session, user, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
