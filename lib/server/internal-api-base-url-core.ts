export interface HeaderValueReader {
  get(name: string): string | null;
}

function getFirstHeaderValue(rawValue: string | null): string | null {
  if (!rawValue) {
    return null;
  }

  const firstValue = rawValue.split(",")[0]?.trim();
  return firstValue || null;
}

export function resolveInternalApiBaseUrlFromHeaders(
  requestHeaders: HeaderValueReader,
): string | null {
  const host =
    getFirstHeaderValue(requestHeaders.get("x-forwarded-host")) ??
    getFirstHeaderValue(requestHeaders.get("host"));

  if (!host) {
    return null;
  }

  const forwardedProto = getFirstHeaderValue(requestHeaders.get("x-forwarded-proto"));

  const protocol =
    forwardedProto ||
    (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${protocol}://${host}`;
}
