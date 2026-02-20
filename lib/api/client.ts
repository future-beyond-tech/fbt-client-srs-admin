"use client";

import axios from "axios";
import { API_TIMEOUT_MS } from "@/lib/constants";
import { clearAuthSession } from "@/lib/auth/storage";

let handlingUnauthorized = false;
const apiClient = axios.create({
  baseURL: "/api",
  timeout: API_TIMEOUT_MS,
});

const LOGIN_PATH = "/login";
const SESSION_EXPIRED_PARAM = "session_expired";

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      error?.response?.status === 401 &&
      typeof window !== "undefined" &&
      !handlingUnauthorized
    ) {
      handlingUnauthorized = true;
      clearAuthSession();
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);

      if (!window.location.pathname.startsWith(LOGIN_PATH)) {
        const loginUrl = new URL(LOGIN_PATH, window.location.origin);
        loginUrl.searchParams.set(SESSION_EXPIRED_PARAM, "1");
        window.location.href = loginUrl.toString();
      }

      setTimeout(() => {
        handlingUnauthorized = false;
      }, 400);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
