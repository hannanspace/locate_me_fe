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

const MALAYSIA_COORDINATE_RANGE: CoordinateRange = {
  latMin: 0.85,
  latMax: 7.4,
  lngMin: 99.6,
  lngMax: 119.5,
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

const randomBetween = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

const randomIntBetween = (min: number, max: number): number =>
  Math.floor(randomBetween(min, max + 1));

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const createRandomLocationPayload = () => {
  const latitude = randomBetween(
    MALAYSIA_COORDINATE_RANGE.latMin,
    MALAYSIA_COORDINATE_RANGE.latMax
  );
  const longitude = randomBetween(
    MALAYSIA_COORDINATE_RANGE.lngMin,
    MALAYSIA_COORDINATE_RANGE.lngMax
  );

  return {
    latitude,
    longitude,
    accuracy: randomIntBetween(5, 60),
    timestamp: new Date().toISOString(),
    country: 'Malaysia',
    state: MALAYSIA_STATES[randomIntBetween(0, MALAYSIA_STATES.length - 1)],
    description: 'Backoffice random seed',
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

        const payload = createRandomLocationPayload();
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
            Inserts one-by-one with random delays between 1 and 4 seconds.
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
