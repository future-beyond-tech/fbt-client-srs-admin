import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromRequest } from "@/lib/auth/server-auth";
import { EXTERNAL_API_URL_DEFAULT } from "@/lib/constants";

const DEFAULT_EXTERNAL_API_URL = EXTERNAL_API_URL_DEFAULT;

interface BackendRequestOptions {
  method: string;
  backendPath: string;
  includeQuery?: boolean;
  forwardBody?: boolean;
  jsonBody?: unknown;
}

type BackendFetchResult =
  | {
      ok: true;
      response: Response;
      url: string;
    }
  | {
      ok: false;
      response: NextResponse;
    };

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Unknown connection error";
}

function getExternalApiBaseUrl() {
  return (process.env.EXTERNAL_API_URL ?? DEFAULT_EXTERNAL_API_URL).trim();
}

function buildExternalUrl(
  request: NextRequest,
  backendPath: string,
  includeQuery: boolean,
) {
  try {
    const url = new URL(backendPath, getExternalApiBaseUrl());

    if (includeQuery) {
      url.search = request.nextUrl.search;
    }

    return url.toString();
  } catch {
    return null;
  }
}

async function buildForwardHeaders(request: NextRequest, includeContentType: boolean) {
  const headers = new Headers();
  const token = await extractTokenFromRequest(request);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (includeContentType) {
    const contentType = request.headers.get("content-type");

    if (contentType) {
      headers.set("Content-Type", contentType);
    }
  }

  const accept = request.headers.get("accept");

  if (accept) {
    headers.set("Accept", accept);
  }

  return headers;
}

export async function fetchFromBackend(
  request: NextRequest,
  options: BackendRequestOptions,
): Promise<BackendFetchResult> {
  const targetUrl = buildExternalUrl(
    request,
    options.backendPath,
    options.includeQuery ?? false,
  );

  if (!targetUrl) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          message:
            process.env.NODE_ENV === "development"
              ? "Invalid EXTERNAL_API_URL. Use a full URL like http://localhost:5253."
              : "Backend service is misconfigured.",
        },
        { status: 500 },
      ),
    };
  }

  const shouldForwardContentType = (options.forwardBody ?? false) && options.jsonBody === undefined;
  const headers = await buildForwardHeaders(request, shouldForwardContentType);
  const init: RequestInit = {
    method: options.method,
    headers,
    cache: "no-store",
  };

  if (options.jsonBody !== undefined) {
    headers.set("Content-Type", "application/json");
    init.body = JSON.stringify(options.jsonBody);
  } else if (options.forwardBody) {
    const rawBody = await request.arrayBuffer();

    if (rawBody.byteLength > 0) {
      init.body = rawBody;
    }
  }

  try {
    const response = await fetch(targetUrl, init);

    return {
      ok: true,
      response,
      url: targetUrl,
    };
  } catch (error) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          message:
            process.env.NODE_ENV === "development"
              ? `Unable to connect to backend service at ${targetUrl}: ${getErrorMessage(error)}`
              : "Unable to connect to backend service.",
        },
        { status: 503 },
      ),
    };
  }
}

export async function toNextResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.toLowerCase().includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as
      | Record<string, unknown>
      | unknown[]
      | null;

    return NextResponse.json(payload ?? {}, { status: response.status });
  }

  const body = await response.arrayBuffer();
  const headers = new Headers();

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const contentDisposition = response.headers.get("content-disposition");

  if (contentDisposition) {
    headers.set("Content-Disposition", contentDisposition);
  }

  const setCookie = response.headers.get("set-cookie");

  if (setCookie) {
    headers.set("set-cookie", setCookie);
  }

  return new NextResponse(body, {
    status: response.status,
    headers,
  });
}

export async function proxyToBackend(
  request: NextRequest,
  options: BackendRequestOptions,
) {
  const result = await fetchFromBackend(request, options);

  if (!result.ok) {
    return result.response;
  }

  return toNextResponse(result.response);
}
