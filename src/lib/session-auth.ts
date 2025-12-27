import { neonAuth } from "@neondatabase/auth/next/server";
import { cookies } from "next/headers";

const ANON_COOKIE_NAME = "writer_anon_key";

export async function getOwnerId(): Promise<string | null> {
  try {
    const { user } = await neonAuth();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function getAnonKey(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(ANON_COOKIE_NAME)?.value;
  return value && value.length > 0 ? value : null;
}

export async function ensureAnonKey(): Promise<string> {
  const store = await cookies();
  const existing = store.get(ANON_COOKIE_NAME)?.value;
  if (existing && existing.length > 0) {
    return existing;
  }

  const anonKey = crypto.randomUUID();
  store.set(ANON_COOKIE_NAME, anonKey, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return anonKey;
}

export function canAccessSession(input: {
  sessionOwnerId: string | null;
  sessionAnonKey: string | null;
  ownerId: string | null;
  anonKey: string | null;
}): boolean {
  if (input.ownerId) {
    return input.sessionOwnerId === input.ownerId;
  }

  if (!input.anonKey) {
    return false;
  }

  if (input.sessionOwnerId) {
    return false;
  }

  return input.sessionAnonKey === input.anonKey;
}
