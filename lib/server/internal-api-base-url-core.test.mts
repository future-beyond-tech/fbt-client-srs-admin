import assert from "node:assert/strict";
import test from "node:test";
import { resolveInternalApiBaseUrlFromHeaders } from "./internal-api-base-url-core.ts";

interface HeaderMap {
  [key: string]: string | undefined;
}

function createHeaders(values: HeaderMap): { get(name: string): string | null } {
  const normalizedValues = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key.toLowerCase(), value]),
  );

  return {
    get(name: string): string | null {
      return normalizedValues[name.toLowerCase()] ?? null;
    },
  };
}

test("resolveInternalApiBaseUrlFromHeaders prefers x-forwarded-host over host", () => {
  const result = resolveInternalApiBaseUrlFromHeaders(
    createHeaders({
      "x-forwarded-host": "public.example.com",
      host: "internal.example.local",
      "x-forwarded-proto": "https",
    }),
  );

  assert.equal(result, "https://public.example.com");
});

test("resolveInternalApiBaseUrlFromHeaders falls back to host", () => {
  const result = resolveInternalApiBaseUrlFromHeaders(
    createHeaders({
      host: "localhost:3000",
    }),
  );

  assert.equal(result, "http://localhost:3000");
});

test("resolveInternalApiBaseUrlFromHeaders returns null when host headers are missing", () => {
  const result = resolveInternalApiBaseUrlFromHeaders(createHeaders({}));

  assert.equal(result, null);
});
