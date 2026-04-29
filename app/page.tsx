'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import MapViewWrapper from '@/components/MapViewWrapper';
import { Button } from '@/components/ui/button';
import { getAllLocations, Location, reverseGeocode, sendLocation } from '@/lib/api';
import {
  extractInsertedLocation,
  getRealtimeWsUrl,
  toJsonPayload,
} from '@/lib/locationRealtime';
import { MapPin, List, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const CHECKIN_COOKIE_KEY = 'locate_me_checked_in';
const CHECKIN_SESSION_KEY = 'locate_me_checked_in';
type RealtimeStatus = 'connecting' | 'connected' | 'disconnected';

export default function Home() {
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('connecting');
  const knownLocationIdsRef = useRef<Set<string>>(new Set());
  const hasLoadedInitialLocationsRef = useRef(false);
  const reconnectTimerRef = useRef<number | null>(null);
  const isSyncingLocationsRef = useRef(false);

  const prependLocationIfMissing = (nextLocation: Location, showToast = true) => {
    const locationId = String(nextLocation.id);
    if (knownLocationIdsRef.current.has(locationId)) {
      return;
    }

    knownLocationIdsRef.current.add(locationId);
    setLocations((prev) => [nextLocation, ...prev]);

    if (showToast) {
      toast.success('New location inserted');
    }
  };

  const syncLocationsFromApi = async (showNewToast = false) => {
    if (isSyncingLocationsRef.current) {
      return;
    }

    isSyncingLocationsRef.current = true;
    try {
      const allLocations = await getAllLocations();
      const nextIds = new Set(allLocations.map((location) => String(location.id)));
      let insertedCount = 0;
      if (showNewToast && hasLoadedInitialLocationsRef.current) {
        for (const id of nextIds) {
          if (!knownLocationIdsRef.current.has(id)) {
            insertedCount += 1;
          }
        }
      }

      knownLocationIdsRef.current = new Set(
        allLocations.map((location) => String(location.id))
      );
      hasLoadedInitialLocationsRef.current = true;
      setLocations(allLocations);

      if (insertedCount > 0) {
        toast.success(
          insertedCount === 1
            ? 'New location inserted'
            : `${insertedCount} new locations inserted`
        );
      }
    } catch (err) {
      console.error('Failed to sync locations:', err);
    } finally {
      isSyncingLocationsRef.current = false;
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const sessionValue = sessionStorage.getItem(CHECKIN_SESSION_KEY);
      const cookieValue = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith(`${CHECKIN_COOKIE_KEY}=`));
      setHasCheckedIn(Boolean(sessionValue || cookieValue));
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const fetchLocations = async () => {
      await syncLocationsFromApi(false);
      if (!hasLoadedInitialLocationsRef.current) {
        toast.error('Failed to load locations');
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void syncLocationsFromApi(true);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let isUnmounted = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const connect = () => {
      if (isUnmounted) {
        return;
      }

      let wsUrl = '';
      try {
        wsUrl = getRealtimeWsUrl();
      } catch (error) {
        console.error('WebSocket configuration error:', error);
        setRealtimeStatus('disconnected');
        return;
      }

      setRealtimeStatus('connecting');
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setRealtimeStatus('connected');
      };

      socket.onmessage = (event) => {
        const payload = toJsonPayload(String(event.data));
        const insertedLocation = extractInsertedLocation(payload);

        if (!insertedLocation) {
          // Fallback sync covers unexpected backend envelope variations.
          void syncLocationsFromApi();
          return;
        }

        prependLocationIfMissing(insertedLocation, hasLoadedInitialLocationsRef.current);
      };

      socket.onclose = () => {
        if (isUnmounted) {
          return;
        }

        setRealtimeStatus('disconnected');
        clearReconnectTimer();
        reconnectTimerRef.current = window.setTimeout(() => {
          connect();
        }, 2000);
      };

      socket.onerror = () => {
        setRealtimeStatus('disconnected');
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      clearReconnectTimer();
      socket?.close();
    };
  }, []);

  const markCheckedIn = () => {
    sessionStorage.setItem(CHECKIN_SESSION_KEY, 'true');
    // This cookie keeps the guard active for the current browser session.
    document.cookie = `${CHECKIN_COOKIE_KEY}=true; path=/; SameSite=Lax`;
    setHasCheckedIn(true);
  };

  const handleCheckIn = async () => {
    if (hasCheckedIn || isCheckingIn) {
      return;
    }

    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported in this browser');
      return;
    }

    setIsCheckingIn(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const roundedAccuracy = Math.round(accuracy);

        try {
          const geocode = await reverseGeocode(latitude, longitude);
          const payload = {
            latitude,
            longitude,
            accuracy: roundedAccuracy,
            timestamp: new Date().toISOString(),
            country: geocode.country,
            state: geocode.state,
            description: 'User check-in',
          };

          const createdLocation = await sendLocation(payload);
          prependLocationIfMissing(createdLocation, false);
          markCheckedIn();
          toast.success(`Checked in at ${geocode.state}, ${geocode.country}`);
        } catch (error) {
          console.error('Check-in failed:', error);
          toast.error('Check-in failed. Please try again.');
        } finally {
          setIsCheckingIn(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsCheckingIn(false);
        toast.error('Unable to get your location');
      }
    );
  };

  const recentLocations = useMemo(() => locations.slice(0, 10), [locations]);

  const stateTotals = useMemo(() => {
    const counts = locations.reduce<Record<string, number>>((acc, location) => {
      const stateName = location.state || 'Unknown State';
      acc[stateName] = (acc[stateName] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [locations]);

  return (
    <main className="min-h-[100dvh] w-full bg-slate-950 p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <section className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-200">
              <MapPin className="h-4 w-4" />
              Map
            </h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                realtimeStatus === 'connected'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : realtimeStatus === 'connecting'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              Live: {realtimeStatus}
            </span>
          </div>
          <div className="h-[45dvh] overflow-hidden rounded-lg border border-white/10">
            <MapViewWrapper locations={locations} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-200">
              <List className="h-4 w-4" />
              Past 10 Locations
            </h2>
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {recentLocations.length === 0 ? (
                <p className="text-sm text-slate-300">No check-ins yet.</p>
              ) : (
                recentLocations.map((location) => (
                  <div
                    key={location.id}
                    className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-200"
                  >
                    <p className="font-medium text-white">
                      {location.state}, {location.country}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(location.timestamp).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">
                      {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-200">
              <Building2 className="h-4 w-4" />
              Total by State
            </h2>
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {stateTotals.length === 0 ? (
                <p className="text-sm text-slate-300">No state data available yet.</p>
              ) : (
                stateTotals.map(([stateName, count]) => (
                  <div
                    key={stateName}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  >
                    <span className="text-slate-200">{stateName}</span>
                    <span className="rounded-full bg-blue-500/30 px-3 py-1 font-semibold text-blue-100">
                      {count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-200">
            Check In
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-300">
              Use this button to save your current location once per session.
            </p>
            <Button
              onClick={handleCheckIn}
              disabled={isCheckingIn || hasCheckedIn}
              className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isCheckingIn ? 'Checking in...' : hasCheckedIn ? 'Checked in' : 'Check in'}
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
