import Constants from "expo-constants";

import { getSession } from "./session";

// Base API URL. Prefer EXPO_PUBLIC_API_URL, fall back to app.json `extra.apiUrl`,
// then a sensible localhost default for dev.
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv;
  }
  const fromExtra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)
    ?.apiUrl;
  if (fromExtra) {
    return fromExtra;
  }
  // Public (mobile) API lives under /api — the client appends /graphql.
  return "http://localhost:3000/api";
}

const GRAPHQL_ENDPOINT = `${resolveApiUrl().replace(/\/$/, "")}/graphql`;

interface GraphQLError {
  message: string;
  extensions?: { code?: string };
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

export class GraphQLRequestError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "GraphQLRequestError";
    this.code = code;
  }
}

/**
 * Minimal fetch-based GraphQL client for the BookIt backend.
 * Attaches the stored BookIt access token as a Bearer header when a session exists.
 */
export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  { withAuth = true }: { withAuth?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (withAuth) {
    const session = await getSession();
    if (session) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });
  } catch {
    throw new GraphQLRequestError("Network request failed. Please try again.");
  }

  if (!response.ok) {
    throw new GraphQLRequestError(`Request failed with status ${response.status}`);
  }

  const body = (await response.json()) as GraphQLResponse<T>;

  if (body.errors && body.errors.length > 0) {
    const first = body.errors[0];
    throw new GraphQLRequestError(first.message, first.extensions?.code);
  }

  if (!body.data) {
    throw new GraphQLRequestError("Empty response from server.");
  }

  return body.data;
}
