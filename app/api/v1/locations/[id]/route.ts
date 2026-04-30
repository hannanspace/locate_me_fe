import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/backendProxy";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return proxyToBackend(req, `/api/v1/locations/${encodeURIComponent(id)}`);
}
