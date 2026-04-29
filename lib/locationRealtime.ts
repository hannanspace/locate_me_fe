import { Location } from "@/lib/api";

interface GenericSocketPayload {
  event?: string;
  type?: string;
  data?: unknown;
  location?: unknown;
  payload?: unknown;
}

const LOCATION_EVENT_NAMES = new Set([
  "location:created",
  "locations:created",
  "location.created",
  "locations.created",
]);

function getWsUrlFromBeUrl(beUrl: string): string {
  if (beUrl.startsWith("https://")) {
    return beUrl.replace("https://", "wss://");
  }
  if (beUrl.startsWith("http://")) {
    return beUrl.replace("http://", "ws://");
  }
  return beUrl;
}

export function getRealtimeWsUrl(): string {
  const explicitWsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (explicitWsUrl) {
    return explicitWsUrl;
  }

  const beUrl = process.env.NEXT_PUBLIC_BE_URL;
  if (!beUrl) {
    throw new Error(
      "NEXT_PUBLIC_WS_URL or NEXT_PUBLIC_BE_URL must be configured for realtime updates."
    );
  }

  return getWsUrlFromBeUrl(beUrl);
}

function isLocationLike(value: unknown): value is Location {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Location> & { id?: string | number };
  return (
    (typeof candidate.id === "string" || typeof candidate.id === "number") &&
    typeof candidate.latitude === "number" &&
    typeof candidate.longitude === "number" &&
    typeof candidate.timestamp === "string" &&
    typeof candidate.country === "string" &&
    typeof candidate.state === "string"
  );
}

function normalizeLocation(value: Location | (Location & { id: string | number })): Location {
  return {
    ...value,
    id: String(value.id),
  };
}

export function extractInsertedLocation(payload: unknown): Location | null {
  if (isLocationLike(payload)) {
    return normalizeLocation(payload);
  }

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const parsedPayload = payload as GenericSocketPayload;
  const eventName = parsedPayload.event ?? parsedPayload.type;
  if (eventName && !LOCATION_EVENT_NAMES.has(eventName)) {
    return null;
  }

  const candidates: unknown[] = [
    parsedPayload.data,
    parsedPayload.location,
    parsedPayload.payload,
    parsedPayload.data && typeof parsedPayload.data === "object"
      ? (parsedPayload.data as GenericSocketPayload).data
      : null,
    parsedPayload.data && typeof parsedPayload.data === "object"
      ? (parsedPayload.data as GenericSocketPayload).location
      : null,
    parsedPayload.payload && typeof parsedPayload.payload === "object"
      ? (parsedPayload.payload as GenericSocketPayload).data
      : null,
    parsedPayload.payload && typeof parsedPayload.payload === "object"
      ? (parsedPayload.payload as GenericSocketPayload).location
      : null,
  ];

  const location = candidates.find((candidate) => isLocationLike(candidate));
  return location ? normalizeLocation(location) : null;
}

export function toJsonPayload(rawMessage: string): unknown {
  try {
    return JSON.parse(rawMessage);
  } catch {
    return null;
  }
}
