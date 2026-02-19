"use client";

import { AUTH_COOKIE_KEY, AUTH_TOKEN_KEY, AUTH_USER_KEY } from "@/lib/constants";

export interface AuthUser {
  username: string;
  role: string;
}

export function getAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: AuthUser) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch {
    // Ignore localStorage write failures.
  }

  // Fallback cookie for middleware routing when backend response does not set cookie.
  document.cookie = `${AUTH_COOKIE_KEY}=${token}; path=/; max-age=${60 * 60 * 8}; samesite=lax`;
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  } catch {
    // Ignore localStorage cleanup failures.
  }

  document.cookie = `${AUTH_COOKIE_KEY}=; path=/; max-age=0; samesite=lax`;
}
