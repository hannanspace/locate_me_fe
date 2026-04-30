import { NextResponse } from "next/server";
import { getApiDebugConfig } from "@/lib/api";
import { getRealtimeDebugConfig } from "@/lib/locationRealtime";
import { getBackendBaseUrl } from "@/lib/server/backendProxy";

export async function GET() {
  return NextResponse.json({
    client: {
      ...getApiDebugConfig(),
      ...getRealtimeDebugConfig(),
    },
    server: {
      beUrl: getBackendBaseUrl(),
      proxyMode: Boolean(getBackendBaseUrl()),
    },
  });
}
