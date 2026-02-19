export interface ParsedJwtUser {
  username: string;
  role: string;
}

function base64UrlDecode(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

  if (typeof atob === "function") {
    return atob(padded);
  }

  return Buffer.from(padded, "base64").toString("utf-8");
}

export function parseUserFromJwt(token: string): ParsedJwtUser {
  try {
    const [, payloadPart] = token.split(".");

    if (!payloadPart) {
      return { username: "admin", role: "Admin" };
    }

    const payloadRaw = base64UrlDecode(payloadPart);
    const payload = JSON.parse(payloadRaw) as Record<string, unknown>;

    const usernameCandidate =
      payload.unique_name ?? payload.username ?? payload.name ?? payload.sub;

    const roleCandidate =
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
      payload.role;

    return {
      username:
        typeof usernameCandidate === "string" && usernameCandidate.trim()
          ? usernameCandidate
          : "admin",
      role:
        typeof roleCandidate === "string" && roleCandidate.trim()
          ? roleCandidate
          : "Admin",
    };
  } catch {
    return { username: "admin", role: "Admin" };
  }
}
