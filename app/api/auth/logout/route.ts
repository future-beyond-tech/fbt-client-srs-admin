import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_KEY } from "@/lib/constants";

function isSecureRequest(request: NextRequest) {
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();

  return request.nextUrl.protocol === "https:" || forwardedProto === "https";
}

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ message: "Logged out" }, { status: 200 });

  response.cookies.set(AUTH_COOKIE_KEY, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: 0,
  });

  return response;
}
