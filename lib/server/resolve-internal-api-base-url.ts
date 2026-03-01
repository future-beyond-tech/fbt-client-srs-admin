import "server-only";
import { headers } from "next/headers";
import { resolveInternalApiBaseUrlFromHeaders } from "./internal-api-base-url-core";

export async function resolveInternalApiBaseUrl(): Promise<string | null> {
  const requestHeaders = await headers();
  return resolveInternalApiBaseUrlFromHeaders(requestHeaders);
}
