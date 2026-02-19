import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_KEY } from "@/lib/constants";
import { loginSchema } from "@/lib/validations/auth";

// External API URL - can be configured via environment variable
const EXTERNAL_API_URL = process.env.EXTERNAL_API_URL ?? "http://localhost:5253";

function isSecureRequest(request: NextRequest) {
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();

  return request.nextUrl.protocol === "https:" || forwardedProto === "https";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: parsed.error.issues[0]?.message ?? "Invalid credentials",
        },
        { status: 400 },
      );
    }

    const { username, password } = parsed.data;

    // Call external authentication API
    const externalApiUrl = `${EXTERNAL_API_URL}/api/auth/login`;
    
    let externalResponse: Response;
    try {
      externalResponse = await fetch(externalApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
    } catch (fetchError) {
      return NextResponse.json(
        {
          message: "Unable to connect to authentication service. Please try again later.",
        },
        { status: 503 },
      );
    }

    if (!externalResponse.ok) {
      const errorData = (await externalResponse.json().catch(() => null)) as
        | { message?: string }
        | null;
      
      return NextResponse.json(
        {
          message:
            errorData?.message ?? `Authentication failed (${externalResponse.status})`,
        },
        { status: externalResponse.status },
      );
    }

    const authData = (await externalResponse.json().catch(() => null)) as
      | { token?: string }
      | null;

    if (!authData?.token || typeof authData.token !== "string") {
      return NextResponse.json(
        {
          message: "Invalid response from authentication service",
        },
        { status: 500 },
      );
    }

    const response = NextResponse.json(
      {
        token: authData.token,
      },
      { status: 200 },
    );

    // Set the token in an httpOnly cookie
    response.cookies.set(AUTH_COOKIE_KEY, authData.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecureRequest(request),
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "An error occurred during login",
      },
      { status: 500 },
    );
  }
}
