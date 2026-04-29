export interface Location {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  description?: string;
  createdAt: string;
}

interface LocationPayload {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  description?: string;
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

  const response = await fetch(`${beUrl}/api/locations`, {
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

export async function getLocations(limit = 50, offset = 0): Promise<LocationsResponse> {
  const beUrl = getBeUrl();

  const response = await fetch(
    `${beUrl}/api/locations?limit=${limit}&offset=${offset}`,
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

export async function deleteLocation(id: string): Promise<void> {
  const beUrl = getBeUrl();

  const response = await fetch(`${beUrl}/api/locations/${id}`, {
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
