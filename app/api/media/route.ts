import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { EXTERNAL_API_URL_DEFAULT } from "@/lib/constants";

const DEFAULT_EXTERNAL_API_URL = EXTERNAL_API_URL_DEFAULT;

function getExternalApiBaseUrl() {
  return (process.env.EXTERNAL_API_URL ?? DEFAULT_EXTERNAL_API_URL).trim();
}

function resolveMediaUrl(source: string) {
  const value = source.trim();

  if (!value) {
    return null;
  }

  try {
    if (/^https?:\/\//i.test(value)) {
      return new URL(value).toString();
    }

    const baseUrl = getExternalApiBaseUrl();
    return new URL(value.startsWith("/") ? value : `/${value}`, baseUrl).toString();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const source = request.nextUrl.searchParams.get("src");

  if (!source) {
    return NextResponse.json({ message: "Missing src query parameter." }, { status: 400 });
  }

  const targetUrl = resolveMediaUrl(source);

  if (!targetUrl) {
    return NextResponse.json({ message: "Invalid media source." }, { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: `Failed to load media (${response.status}).` },
        { status: response.status },
      );
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") ?? "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ message: "Unable to fetch media." }, { status: 503 });
  }
}
