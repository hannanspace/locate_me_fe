'use client';

import { useMemo, useState, useEffect } from 'react';
import MapViewWrapper from '@/components/MapViewWrapper';
import { Button } from '@/components/ui/button';
import { getAllLocations, Location, reverseGeocode, sendLocation } from '@/lib/api';
import { MapPin, List, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const CHECKIN_COOKIE_KEY = 'locate_me_checked_in';
const CHECKIN_SESSION_KEY = 'locate_me_checked_in';

export default function Home() {
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const allLocations = await getAllLocations();
        setLocations(allLocations);
      } catch (err) {
        console.error('Failed to fetch locations:', err);
        toast.error('Failed to load locations');
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    const sessionValue = sessionStorage.getItem(CHECKIN_SESSION_KEY);
    const cookieValue = document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith(`${CHECKIN_COOKIE_KEY}=`));
    setHasCheckedIn(Boolean(sessionValue || cookieValue));
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
          setLocations((prev) => [createdLocation, ...prev]);
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
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-200">
            <MapPin className="h-4 w-4" />
            Map
          </h2>
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
