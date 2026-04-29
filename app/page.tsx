'use client';

import { useState, useEffect } from 'react';
import MapViewWrapper from '@/components/MapViewWrapper';
import LocationTracker from '@/components/LocationTracker';
import { getLocations, Location } from '@/lib/api';
import { toast } from 'sonner';

export default function Home() {
  const [isLocating, setIsLocating] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [stats, setStats] = useState({
    locationsFound: 0,
    distanceTraveled: 0,
    timeElapsed: 0,
    accuracy: 0,
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
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLocateMe = async () => {
    setIsLocating(true);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          try {
            const result = await fetch(
              `${process.env.NEXT_PUBLIC_BE_URL}/api/locations`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  latitude,
                  longitude,
                  accuracy: Math.round(accuracy),
                  timestamp: new Date().toISOString(),
                  description: 'Current location',
                }),
              }
            );

            if (result.ok) {
              const newLocation = await result.json();
              setLocations((prev) => [newLocation, ...prev]);
              setStats((prev) => ({
                ...prev,
                locationsFound: prev.locationsFound + 1,
                accuracy: Math.round(accuracy),
              }));
              toast.success('Location saved successfully!');
            } else {
              toast.error('Failed to save location');
            }
          } catch (err) {
            toast.error('Error saving location');
          }

          setIsLocating(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Failed to get location');
          setIsLocating(false);
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
          stats={stats}
          onLocateMe={handleLocateMe}
        />
      </div>
    </main>
  );
}
