import { NextRequest, NextResponse } from "next/server";

/**
 * Backend base URL for server-side proxy routes only (never exposed to the browser).
 * Set BE_URL or BACKEND_URL in Dockploy / Docker runtime — no rebuild required.
 */
export function getBackendBaseUrl(): string | null {
  const raw =
    process.env.BE_URL ??
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_BE_URL;
  if (!raw?.trim()) return null;
  return raw.trim().replace(/\/$/, "");
}

export function backendUnavailableResponse(): NextResponse {
  return NextResponse.json(
    {
      error:
        "Backend URL is not configured. Set BE_URL or BACKEND_URL in the server environment.",
    },
    { status: 503 }
  );
}

/** Forwards the incoming request to the backend path (including query string). */
export async function proxyToBackend(
  req: NextRequest,
  backendPathname: string
): Promise<NextResponse> {
  const base = getBackendBaseUrl();
  if (!base) return backendUnavailableResponse();

  const search = req.nextUrl.search;
  const url = `${base}${backendPathname.startsWith("/") ? backendPathname : `/${backendPathname}`}${search}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    const ct = req.headers.get("content-type");
    if (ct) headers["Content-Type"] = ct;
  }

  const init: RequestInit = {
    method: req.method,
    headers,
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  try {
    const upstream = await fetch(url, init);
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ?? "application/json",
        "X-Proxy-Upstream": url,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown upstream error";

    return NextResponse.json(
      {
        error: "Failed to reach upstream backend.",
        upstream: url,
        method: req.method,
        reason: message,
      },
      { status: 502 }
    );
  }
}
