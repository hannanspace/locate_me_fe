'use client';

import { useState, useEffect } from 'react';
import MapViewWrapper from '@/components/MapViewWrapper';
import LocationTracker from '@/components/LocationTracker';
import LocationForm from '@/components/LocationForm';
import { getLocations, Location } from '@/lib/api';
import { toast } from 'sonner';

type UserState = 'idle' | 'locating' | 'located' | 'error';

interface Stats {
  locationsFound: number;
  distanceTraveled: number;
  timeElapsed: number;
  accuracy: number;
  successCount: number;
  failureCount: number;
  averageAccuracy: number;
  sessionDuration: number;
}

export default function Home() {
  const [isLocating, setIsLocating] = useState(false);
  const [userState, setUserState] = useState<UserState>('idle');
  const [locations, setLocations] = useState<Location[]>([]);
  const [accuracyHistory, setAccuracyHistory] = useState<number[]>([]);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [pendingLocationData, setPendingLocationData] = useState<{
    country: string;
    state: string;
    description?: string;
  } | null>(null);
  const [stats, setStats] = useState<Stats>({
    locationsFound: 0,
    distanceTraveled: 0,
    timeElapsed: 0,
    accuracy: 0,
    successCount: 0,
    failureCount: 0,
    averageAccuracy: 0,
    sessionDuration: 0,
  });

  // Fetch locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await getLocations();
        setLocations(data.locations);
        setStats((prev) => ({
          ...prev,
          locationsFound: data.total,
        }));
      } catch (err) {
        console.error('Failed to fetch locations:', err);
      }
    };

    fetchLocations();
  }, []);

  // Timer for elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        timeElapsed: prev.timeElapsed + 1,
        sessionDuration: prev.sessionDuration + 1,
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const calculateAverageAccuracy = (accuracies: number[]) => {
    if (accuracies.length === 0) return 0;
    const sum = accuracies.reduce((a, b) => a + b, 0);
    return Math.round(sum / accuracies.length);
  };

  const handleLocateMe = () => {
    // Show location form first
    setShowLocationForm(true);
  };

  const handleLocationFormSubmit = async (data: {
    country: string;
    state: string;
    description?: string;
  }) => {
    setShowLocationForm(false);
    setPendingLocationData(data);
    setIsLocating(true);
    setUserState('locating');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const roundedAccuracy = Math.round(accuracy);

          try {
            const result = await fetch(
              `${process.env.NEXT_PUBLIC_BE_URL}/api/locations`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  latitude,
                  longitude,
                  accuracy: roundedAccuracy,
                  timestamp: new Date().toISOString(),
                  country: data.country,
                  state: data.state,
                  description: data.description || 'User location',
                }),
              }
            );

            if (result.ok) {
              const newLocation = await result.json();
              setLocations((prev) => [newLocation, ...prev]);

              // Update accuracy history
              const newAccuracyHistory = [roundedAccuracy, ...accuracyHistory];
              setAccuracyHistory(newAccuracyHistory);

              const newAverageAccuracy = calculateAverageAccuracy(newAccuracyHistory);

              setStats((prev) => ({
                ...prev,
                locationsFound: prev.locationsFound + 1,
                accuracy: roundedAccuracy,
                averageAccuracy: newAverageAccuracy,
                successCount: prev.successCount + 1,
              }));

              setUserState('located');
              toast.success(`Location saved in ${data.state}, ${data.country}!`);

              // Reset to idle after 2 seconds
              setTimeout(() => {
                setUserState('idle');
              }, 2000);
            } else {
              throw new Error('Failed to save location');
            }
          } catch (err) {
            console.error('Error:', err);
            setStats((prev) => ({
              ...prev,
              failureCount: prev.failureCount + 1,
            }));
            setUserState('error');
            toast.error('Error saving location');

            // Reset to idle after 2 seconds
            setTimeout(() => {
              setUserState('idle');
            }, 2000);
          }

          setIsLocating(false);
          setPendingLocationData(null);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setStats((prev) => ({
            ...prev,
            failureCount: prev.failureCount + 1,
          }));
          setUserState('error');
          toast.error('Failed to get location');

          // Reset to idle after 2 seconds
          setTimeout(() => {
            setUserState('idle');
          }, 2000);

          setIsLocating(false);
          setPendingLocationData(null);
        }
      );
    }
  };

  return (
    <main className="h-[100dvh] w-full overflow-hidden flex">
      {/* Left side - Map */}
      <div className="flex-1 h-full">
        <MapViewWrapper locations={locations} />
      </div>

      {/* Right side - Controls */}
      <div className="w-96 h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-l border-white/10 overflow-y-auto">
        <LocationTracker
          isLocating={isLocating}
          userState={userState}
          stats={stats}
          locations={locations}
          onLocateMe={handleLocateMe}
        />
      </div>

      {/* Location Form Modal */}
      {showLocationForm && (
        <LocationForm
          onSubmit={handleLocationFormSubmit}
          onCancel={() => setShowLocationForm(false)}
          isLoading={isLocating}
        />
      )}
    </main>
  );
}
