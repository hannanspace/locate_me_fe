import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/backendProxy";

export async function GET(req: NextRequest) {
  return proxyToBackend(req, "/api/v1/locations");
}

export async function POST(req: NextRequest) {
  return proxyToBackend(req, "/api/v1/locations");
}
