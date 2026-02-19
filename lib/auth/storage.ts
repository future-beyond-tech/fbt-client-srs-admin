"use client";

import { AUTH_USER_KEY } from "@/lib/constants";

export interface AuthUser {
  username: string;
  role: string;
}

export function getAuthToken() {
  return null;
}

export function setAuthSession(_token: string, user: AuthUser) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch {
    // Ignore localStorage write failures.
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(AUTH_USER_KEY);
  } catch {
    // Ignore localStorage cleanup failures.
  }
}
