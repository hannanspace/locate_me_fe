'use client';

import { MapPin, Compass, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LocationTrackerProps {
  isLocating: boolean;
  stats: {
    locationsFound: number;
    distanceTraveled: number;
    timeElapsed: number;
    accuracy: number;
  };
  onLocateMe: () => void;
}

export default function LocationTracker({
  isLocating,
  stats,
  onLocateMe,
}: LocationTrackerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const StatItem = ({
    icon: Icon,
    label,
    value,
    unit,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number | string;
    unit?: string;
  }) => (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300">
      <div className="p-2 rounded-lg bg-blue-500/20">
        <Icon className="w-6 h-6 text-blue-300" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-blue-200">{label}</p>
        <p className="text-xl font-bold text-white">
          {value}
          {unit && <span className="text-xs text-blue-300 ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Compass className="w-6 h-6 text-blue-400 animate-spin" style={{ animationDuration: '8s' }} />
          <h1 className="text-2xl font-bold text-white">Locate Me</h1>
        </div>
        <p className="text-xs text-blue-200">Find your location</p>
      </div>

      {/* Main Button */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-300"></div>
        <Button
          onClick={onLocateMe}
          disabled={isLocating}
          className="relative w-full h-20 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 disabled:opacity-50"
        >
          <MapPin className="w-6 h-6" />
          <div className="flex flex-col items-start">
            <span>{isLocating ? 'Locating...' : 'Get Location'}</span>
            {isLocating && <span className="text-xs opacity-75 animate-pulse">Acquiring...</span>}
          </div>
        </Button>
      </div>

      {/* Stats */}
      <div className="space-y-2 flex-1">
        <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide">Statistics</p>
        <div className="space-y-2">
          <StatItem
            icon={MapPin}
            label="Locations Found"
            value={stats.locationsFound}
          />
          <StatItem
            icon={Target}
            label="Accuracy"
            value={stats.accuracy}
            unit="m"
          />
          <StatItem
            icon={Clock}
            label="Time Elapsed"
            value={formatTime(stats.timeElapsed)}
          />
          <StatItem
            icon={Compass}
            label="Distance"
            value={stats.distanceTraveled}
            unit="km"
          />
        </div>
      </div>

      {/* Status */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-1 text-sm text-blue-200">
          <div className={`w-2 h-2 rounded-full ${isLocating ? 'bg-blue-400 animate-pulse' : 'bg-green-400'}`}></div>
          <span>{isLocating ? 'Acquiring location...' : 'Ready'}</span>
        </div>
        <p className="text-xs text-blue-300">
          {stats.locationsFound > 0
            ? `${stats.locationsFound} location${stats.locationsFound !== 1 ? 's' : ''} found`
            : 'Press button to start'}
        </p>
      </div>
    </div>
  );
}
