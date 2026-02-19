"use client";

import axios from "axios";
import { API_TIMEOUT_MS } from "@/lib/constants";
import { clearAuthSession } from "@/lib/auth/storage";

let handlingUnauthorized = false;
const apiClient = axios.create({
  baseURL: "/api",
  timeout: API_TIMEOUT_MS,
});

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

      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }

      setTimeout(() => {
        handlingUnauthorized = false;
      }, 400);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
