export interface Location {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  description?: string;
  country: string;
  state: string;
  createdAt: string;
}

export interface LocationPayload {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  description?: string;
  country: string;
  state: string;
}

interface LocationsResponse {
  locations: Location[];
  total: number;
  limit: number;
  offset: number;
}

const getBeUrl = () => {
  const beUrl = process.env.NEXT_PUBLIC_BE_URL;
  if (!beUrl) {
    throw new Error(
      "NEXT_PUBLIC_BE_URL is not configured. Check your .env.local file."
    );
  }
  return beUrl;
};

export async function sendLocation(payload: LocationPayload): Promise<Location> {
  const beUrl = getBeUrl();

  const response = await fetch(`${beUrl}/api/v1/locations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Server responded with ${response.status}: ${errorText}`
    );
  }

  return response.json();
}

interface ReverseGeocodeResponse {
  address?: {
    country?: string;
    state?: string;
    region?: string;
    county?: string;
  };
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<{
  country: string;
  state: string;
}> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed with status ${response.status}`);
  }

  const data: ReverseGeocodeResponse = await response.json();
  const country = data.address?.country || "Unknown Country";
  const state =
    data.address?.state ||
    data.address?.region ||
    data.address?.county ||
    "Unknown State";

  return { country, state };
}

export async function getLocations(limit = 50, offset = 0): Promise<LocationsResponse> {
  const beUrl = getBeUrl();

  const response = await fetch(
    `${beUrl}/api/v1/locations?limit=${limit}&offset=${offset}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Server responded with ${response.status}: ${errorText}`
    );
  }

  return response.json();
}

export async function getAllLocations(pageSize = 200): Promise<Location[]> {
  const allLocations: Location[] = [];
  let offset = 0;
  let total = 0;

  do {
    const page = await getLocations(pageSize, offset);
    allLocations.push(...page.locations);
    total = page.total;
    offset += page.locations.length;

    if (page.locations.length === 0) {
      break;
    }
  } while (offset < total);

  return allLocations;
}

export async function deleteLocation(id: string): Promise<void> {
  const beUrl = getBeUrl();

  const response = await fetch(`${beUrl}/api/v1/locations/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Server responded with ${response.status}: ${errorText}`
    );
  }
}
