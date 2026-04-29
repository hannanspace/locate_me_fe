'use client';

import { MapPin, Compass, Clock, Target, CheckCircle, XCircle, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StateCounters from './StateCounters';
import { Location } from '@/lib/api';

type UserState = 'idle' | 'locating' | 'located' | 'error';

interface LocationTrackerProps {
  isLocating: boolean;
  userState: UserState;
  stats: {
    locationsFound: number;
    distanceTraveled: number;
    timeElapsed: number;
    accuracy: number;
    successCount: number;
    failureCount: number;
    averageAccuracy: number;
    sessionDuration: number;
  };
  locations: Location[];
  onLocateMe: () => void;
}

export default function LocationTracker({
  isLocating,
  userState,
  stats,
  locations,
  onLocateMe,
}: LocationTrackerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getStateColor = (state: UserState) => {
    switch (state) {
      case 'locating':
        return 'text-yellow-400';
      case 'located':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-blue-400';
    }
  };

  const getStateLabel = (state: UserState) => {
    switch (state) {
      case 'locating':
        return 'Acquiring...';
      case 'located':
        return 'Located ✓';
      case 'error':
        return 'Error';
      default:
        return 'Ready';
    }
  };

  const successRate =
    stats.successCount + stats.failureCount > 0
      ? Math.round(
          (stats.successCount / (stats.successCount + stats.failureCount)) * 100
        )
      : 0;

  const StatItem = ({
    icon: Icon,
    label,
    value,
    unit,
    highlight,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number | string;
    unit?: string;
    highlight?: boolean;
  }) => (
    <div
      className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-300 ${
        highlight
          ? 'bg-blue-500/20 border border-blue-400/30'
          : 'bg-white/10 border border-white/20 hover:bg-white/20'
      }`}
    >
      <div className={`p-2 rounded-lg ${highlight ? 'bg-blue-500/30' : 'bg-blue-500/20'}`}>
        <Icon className={`w-5 h-5 ${highlight ? 'text-blue-300' : 'text-blue-200'}`} />
      </div>
      <div className="flex-1">
        <p className={`text-xs ${highlight ? 'text-blue-300' : 'text-blue-200'}`}>{label}</p>
        <p className="text-lg font-bold text-white">
          {value}
          {unit && <span className="text-xs text-blue-300 ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );

  const CompactStat = ({
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
    <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/10">
      <Icon className="w-4 h-4 text-blue-300 mb-1" />
      <p className="text-xs text-blue-200">{label}</p>
      <p className="text-sm font-bold text-white">
        {value}
        {unit && <span className="text-xs text-blue-300">{unit}</span>}
      </p>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-5 gap-5 overflow-y-auto">
      {/* Header with State */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Compass
            className={`w-6 h-6 ${getStateColor(userState)}`}
            style={{
              animationDuration: '8s',
              animation: userState === 'locating' ? 'spin 1s linear infinite' : 'spin 8s linear infinite',
            }}
          />
          <h1 className="text-2xl font-bold text-white">Locate Me</h1>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-blue-200">Track your position</p>
          <span className={`text-xs font-semibold ${getStateColor(userState)}`}>
            {getStateLabel(userState)}
          </span>
        </div>
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

      {/* Primary Stats */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide">Primary</p>
        <div className="space-y-2">
          <StatItem
            icon={MapPin}
            label="Locations Found"
            value={stats.locationsFound}
            highlight={stats.locationsFound > 0}
          />
          <StatItem
            icon={Target}
            label="Current Accuracy"
            value={stats.accuracy || '-'}
            unit="m"
          />
          <StatItem
            icon={Clock}
            label="Time Elapsed"
            value={formatTime(stats.timeElapsed)}
          />
        </div>
      </div>

      {/* Session Stats */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide">Session</p>
        <div className="grid grid-cols-2 gap-2">
          <CompactStat
            icon={CheckCircle}
            label="Success"
            value={stats.successCount}
          />
          <CompactStat
            icon={XCircle}
            label="Failed"
            value={stats.failureCount}
          />
          <CompactStat
            icon={Target}
            label="Avg Accuracy"
            value={stats.averageAccuracy || '-'}
            unit="m"
          />
          <CompactStat
            icon={Activity}
            label="Success Rate"
            value={`${successRate}%`}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>

      {/* State Counters */}
      <div className="flex-1 overflow-y-auto">
        <StateCounters locations={locations} />
      </div>

      {/* Status Footer */}
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-blue-200">
          <div
            className={`w-2 h-2 rounded-full transition-colors ${
              userState === 'locating'
                ? 'bg-yellow-400 animate-pulse'
                : userState === 'located'
                ? 'bg-green-400'
                : userState === 'error'
                ? 'bg-red-400'
                : 'bg-blue-400'
            }`}
          ></div>
          <span>{getStateLabel(userState)}</span>
        </div>
        <p className="text-xs text-blue-300">
          {stats.locationsFound > 0
            ? `${stats.locationsFound} location${stats.locationsFound !== 1 ? 's' : ''} recorded • ${formatTime(stats.sessionDuration)} session`
            : 'Press button to start tracking'}
        </p>
      </div>
    </div>
  );
}
