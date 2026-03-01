import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_KEY } from "@/lib/constants";

const protectedRoutes = [
  "/dashboard",
  "/customers",
  "/purchases",
  "/vehicles",
  "/sales",
  "/search",
  "/settings",
  "/manual-billing",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_KEY)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/customers/:path*",
    "/purchases/:path*",
    "/vehicles/:path*",
    "/sales/:path*",
    "/search/:path*",
    "/settings/:path*",
    "/manual-billing/:path*",
  ],
};
