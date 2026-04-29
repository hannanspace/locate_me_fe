'use client';

import { Location } from '@/lib/api';
import { MapPin, Users } from 'lucide-react';

interface StateCountersProps {
  locations: Location[];
}

export default function StateCounters({ locations }: StateCountersProps) {
  // Group locations by country and state
  const groupedByCountryState = locations.reduce(
    (acc, location) => {
      const country = location.country || 'Unknown';
      const state = location.state || 'Unknown';

      if (!acc[country]) {
        acc[country] = {};
      }

      if (!acc[country][state]) {
        acc[country][state] = 0;
      }

      acc[country][state]++;
      return acc;
    },
    {} as Record<string, Record<string, number>>
  );

  // Sort countries and states
  const sortedCountries = Object.keys(groupedByCountryState).sort();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wide">
          📍 Locations by State
        </h3>
        <p className="text-xs text-blue-200">
          Total: {locations.length} location{locations.length !== 1 ? 's' : ''}
        </p>
      </div>

      {sortedCountries.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {sortedCountries.map((country) => (
            <div key={country} className="space-y-2">
              {/* Country Header */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/15 border border-blue-400/20">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-300">
                  {country}
                </span>
                <span className="ml-auto text-xs font-bold text-blue-200 bg-blue-500/20 px-2 py-1 rounded">
                  {Object.values(groupedByCountryState[country]).reduce(
                    (a, b) => a + b,
                    0
                  )}{' '}
                  total
                </span>
              </div>

              {/* States under Country */}
              <div className="pl-4 space-y-2">
                {Object.entries(groupedByCountryState[country])
                  .sort(([, a], [, b]) => b - a)
                  .map(([state, count]) => (
                    <div
                      key={`${country}-${state}`}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-blue-300" />
                        <span className="text-xs text-blue-200">{state}</span>
                      </div>
                      <span className="text-sm font-bold text-white bg-purple-500/30 px-3 py-1 rounded-full">
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <MapPin className="w-8 h-8 text-blue-300/30 mx-auto mb-2" />
          <p className="text-sm text-blue-300">
            No locations yet. Punch in to start tracking!
          </p>
        </div>
      )}
    </div>
  );
}
