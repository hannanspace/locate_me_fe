'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { deleteAllLocations, getAllLocations, sendLocation } from '@/lib/api';
import { toast } from 'sonner';

const CHECKIN_COOKIE_KEY = 'locate_me_checked_in';
const CHECKIN_SESSION_KEY = 'locate_me_checked_in';
const DEFAULT_GENERATE_COUNT = 20;
const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 4000;

type CoordinateRange = {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
};

type UrbanSeed = {
  name: string;
  state: string;
  latitude: number;
  longitude: number;
};

const MALAYSIA_STATES = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Perak',
  'Perlis',
  'Pulau Pinang',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
  'Kuala Lumpur',
  'Putrajaya',
];

const MALAYSIA_URBAN_SEEDS: UrbanSeed[] = [
  { name: 'Kuala Lumpur', state: 'Kuala Lumpur', latitude: 3.139, longitude: 101.6869 },
  { name: 'Shah Alam', state: 'Selangor', latitude: 3.0738, longitude: 101.5183 },
  { name: 'Petaling Jaya', state: 'Selangor', latitude: 3.1073, longitude: 101.6067 },
  { name: 'Johor Bahru', state: 'Johor', latitude: 1.4927, longitude: 103.7414 },
  { name: 'George Town', state: 'Pulau Pinang', latitude: 5.4141, longitude: 100.3288 },
  { name: 'Ipoh', state: 'Perak', latitude: 4.5975, longitude: 101.0901 },
  { name: 'Kuantan', state: 'Pahang', latitude: 3.8077, longitude: 103.326 },
  { name: 'Kota Bharu', state: 'Kelantan', latitude: 6.1254, longitude: 102.2381 },
  { name: 'Kuala Terengganu', state: 'Terengganu', latitude: 5.3292, longitude: 103.1369 },
  { name: 'Seremban', state: 'Negeri Sembilan', latitude: 2.7297, longitude: 101.9381 },
  { name: 'Melaka City', state: 'Melaka', latitude: 2.1896, longitude: 102.2501 },
  { name: 'Kuching', state: 'Sarawak', latitude: 1.5533, longitude: 110.3592 },
  { name: 'Miri', state: 'Sarawak', latitude: 4.3995, longitude: 113.9914 },
  { name: 'Kota Kinabalu', state: 'Sabah', latitude: 5.9804, longitude: 116.0735 },
  { name: 'Sandakan', state: 'Sabah', latitude: 5.8388, longitude: 118.1171 },
  { name: 'Kangar', state: 'Perlis', latitude: 6.4449, longitude: 100.1986 },
];

const FORBIDDEN_LOCATION_TOKENS = [
  'forest',
  'wood',
  'nature_reserve',
  'water',
  'reservoir',
  'river',
  'stream',
  'wetland',
  'beach',
  'sea',
  'ocean',
  'island',
];

const randomBetween = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

const randomIntBetween = (min: number, max: number): number =>
  Math.floor(randomBetween(min, max + 1));

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const pickRandomSeed = (): UrbanSeed =>
  MALAYSIA_URBAN_SEEDS[randomIntBetween(0, MALAYSIA_URBAN_SEEDS.length - 1)];

const jitterUrbanCoordinate = (seed: UrbanSeed): [number, number] => {
  const radiusKm = randomBetween(0.5, 6);
  const angleRad = randomBetween(0, Math.PI * 2);
  const latOffset = (radiusKm / 111) * Math.cos(angleRad);
  const lngOffset =
    (radiusKm / (111 * Math.cos((seed.latitude * Math.PI) / 180))) * Math.sin(angleRad);

  return [seed.latitude + latOffset, seed.longitude + lngOffset];
};

const isForbiddenLocation = (category?: string, type?: string, addresstype?: string): boolean => {
  const text = `${category || ''} ${type || ''} ${addresstype || ''}`.toLowerCase();
  return FORBIDDEN_LOCATION_TOKENS.some((token) => text.includes(token));
};

const hasUrbanAddressSignal = (address?: Record<string, string>): boolean => {
  if (!address) {
    return false;
  }

  return Boolean(
    address.road ||
      address.neighbourhood ||
      address.suburb ||
      address.city ||
      address.town ||
      address.village ||
      address.hamlet
  );
};

const resolveUrbanPoint = async (): Promise<{
  latitude: number;
  longitude: number;
  state: string;
  cityName: string;
}> => {
  const maxRetries = 10;

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    const seed = pickRandomSeed();
    const [latitude, longitude] = jitterUrbanCoordinate(seed);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${latitude}&lon=${longitude}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as {
        category?: string;
        type?: string;
        addresstype?: string;
        address?: Record<string, string>;
      };

      const inMalaysia = (data.address?.country || '').toLowerCase() === 'malaysia';
      const forbidden = isForbiddenLocation(data.category, data.type, data.addresstype);
      const urbanSignal = hasUrbanAddressSignal(data.address);

      if (inMalaysia && !forbidden && urbanSignal) {
        return {
          latitude,
          longitude,
          state: data.address?.state || seed.state,
          cityName: seed.name,
        };
      }
    } catch {
      // Continue trying another point.
    }
  }

  // Fallback: still generate near urban center if validation retries are exhausted.
  const fallbackSeed = pickRandomSeed();
  const [fallbackLat, fallbackLng] = jitterUrbanCoordinate(fallbackSeed);
  return {
    latitude: fallbackLat,
    longitude: fallbackLng,
    state: fallbackSeed.state,
    cityName: fallbackSeed.name,
  };
};

const createRandomLocationPayload = async () => {
  const urbanPoint = await resolveUrbanPoint();

  return {
    latitude: urbanPoint.latitude,
    longitude: urbanPoint.longitude,
    accuracy: randomIntBetween(5, 60),
    timestamp: new Date().toISOString(),
    country: 'Malaysia',
    state: urbanPoint.state || MALAYSIA_STATES[randomIntBetween(0, MALAYSIA_STATES.length - 1)],
    description: `Backoffice random seed near ${urbanPoint.cityName}`,
  };
};

export default function BackofficePage() {
  const [targetCount, setTargetCount] = useState(DEFAULT_GENERATE_COUNT);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [isFlushing, setIsFlushing] = useState(false);
  const [currentTotal, setCurrentTotal] = useState(0);
  const stopRequestedRef = useRef(false);

  const refreshCount = async () => {
    try {
      const locations = await getAllLocations();
      setCurrentTotal(locations.length);
    } catch (error) {
      console.error('Failed to fetch total location count:', error);
    }
  };

  useEffect(() => {
    refreshCount();
  }, []);

  const handleGenerateRandomLocations = async () => {
    if (isGenerating || targetCount <= 0) {
      return;
    }

    setGeneratedCount(0);
    setIsGenerating(true);
    stopRequestedRef.current = false;

    try {
      for (let index = 0; index < targetCount; index += 1) {
        if (stopRequestedRef.current) {
          break;
        }

        const payload = await createRandomLocationPayload();
        await sendLocation(payload);
        setGeneratedCount(index + 1);

        if (index < targetCount - 1) {
          const randomDelay = randomIntBetween(MIN_DELAY_MS, MAX_DELAY_MS);
          await sleep(randomDelay);
        }
      }

      await refreshCount();
      toast.success('Random location generation finished');
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error('Failed while generating random locations');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStopGeneration = () => {
    stopRequestedRef.current = true;
    toast.info('Stopping generator after current insert');
  };

  const handleFlushAllData = async () => {
    if (isFlushing) {
      return;
    }

    setIsFlushing(true);
    try {
      const deletedCount = await deleteAllLocations();
      setCurrentTotal(0);
      toast.success(`Flushed ${deletedCount} location records`);
    } catch (error) {
      console.error('Flush failed:', error);
      toast.error('Failed to flush data');
    } finally {
      setIsFlushing(false);
    }
  };

  const handleClearCurrentUserCookies = () => {
    document.cookie = `${CHECKIN_COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    sessionStorage.removeItem(CHECKIN_SESSION_KEY);
    toast.success('Current user check-in cookie/session cleared');
  };

  return (
    <main className="min-h-[100dvh] w-full bg-slate-950 p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <section className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
          <h1 className="text-xl font-semibold text-white">Backoffice</h1>
          <p className="mt-1 text-sm text-slate-300">
            Total locations in database: <span className="font-semibold">{currentTotal}</span>
          </p>
          <Button onClick={refreshCount} className="mt-3 bg-slate-700 text-white hover:bg-slate-600">
            Refresh Total
          </Button>
        </section>

        <section className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
          <h2 className="text-base font-semibold text-white">1) Generate random locations</h2>
          <p className="mt-1 text-sm text-slate-300">
            Inserts one-by-one with random delays between 1 and 4 seconds, prioritizing urban
            Malaysia points and skipping forest/water-like areas.
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="text-sm text-slate-300">
              Number of records:
              <input
                type="number"
                min={1}
                value={targetCount}
                onChange={(event) => setTargetCount(Number(event.target.value) || 1)}
                className="ml-2 w-28 rounded border border-white/20 bg-slate-800 px-2 py-1 text-white"
              />
            </label>
            <Button
              onClick={handleGenerateRandomLocations}
              disabled={isGenerating}
              className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isGenerating ? `Generating ${generatedCount}/${targetCount}` : 'Start Generate'}
            </Button>
            <Button
              onClick={handleStopGeneration}
              disabled={!isGenerating}
              className="bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
            >
              Stop
            </Button>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
          <h2 className="text-base font-semibold text-white">2) Delete / flush all data</h2>
          <p className="mt-1 text-sm text-slate-300">
            Removes every location record currently in the database.
          </p>
          <Button
            onClick={handleFlushAllData}
            disabled={isFlushing}
            className="mt-3 bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isFlushing ? 'Flushing...' : 'Flush All Data'}
          </Button>
        </section>

        <section className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
          <h2 className="text-base font-semibold text-white">3) Delete current user cookies/session</h2>
          <p className="mt-1 text-sm text-slate-300">
            Clears the current browser check-in guard so this user can check in again.
          </p>
          <Button
            onClick={handleClearCurrentUserCookies}
            className="mt-3 bg-purple-600 text-white hover:bg-purple-700"
          >
            Clear Check-in Cookie + Session
          </Button>
        </section>
      </div>
    </main>
  );
}
