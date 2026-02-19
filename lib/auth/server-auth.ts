import { NextRequest } from "next/server";
import { AUTH_COOKIE_KEY } from "@/lib/constants";
import { parseUserFromJwt } from "@/lib/auth/jwt-claims";
import { verifyAuthToken } from "@/lib/auth/token";

export interface RequestAuth {
  username: string;
  role: string;
  token: string;
}

export async function extractTokenFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim();
  }

  return request.cookies.get(AUTH_COOKIE_KEY)?.value ?? null;
}

export async function requireAuth(request: NextRequest): Promise<RequestAuth | null> {
  const token = await extractTokenFromRequest(request);

  if (!token) {
    return null;
  }

  const verified = await verifyAuthToken(token);

  if (verified?.username && verified?.role) {
    return {
      username: verified.username,
      role: verified.role,
      token,
    };
  }

  const decoded = parseUserFromJwt(token);

  return {
    username: decoded.username,
    role: decoded.role,
    token,
  };
}
