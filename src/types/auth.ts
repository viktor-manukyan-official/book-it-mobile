// Shared auth types — mirror the book-it-backend public GraphQL contract
// (see tasks/BOOK-54 03-backend.md: phoneExists + authenticateWithFirebase).

export type Gender = "male" | "female" | "other";

export interface FirebaseAuthInput {
  idToken: string;
  firstName?: string; // required on the new-user (registration) path
  lastName?: string;
  email?: string;
  gender?: Gender;
}

export interface RoleType {
  id: string;
  name: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
  emailVerified: boolean;
  mustChangePassword: boolean;
  roles: RoleType[];
}

export interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

// Persisted session — BookIt JWT tokens (NOT the Firebase ID token).
export interface Session {
  accessToken: string;
  refreshToken: string;
}
