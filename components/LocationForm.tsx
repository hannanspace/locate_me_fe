'use client';

import { useState, useEffect } from 'react';
import { countries, getStatesByCountry } from '@/lib/countries';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface LocationFormProps {
  onSubmit: (data: {
    country: string;
    state: string;
    description?: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function LocationForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: LocationFormProps) {
  const [selectedCountry, setSelectedCountry] = useState('Malaysia');
  const [selectedState, setSelectedState] = useState('');
  const [description, setDescription] = useState('');
  const [states, setStates] = useState<string[]>([]);

  useEffect(() => {
    const countryStates = getStatesByCountry(selectedCountry);
    setStates(countryStates);
    setSelectedState(countryStates[0] || '');
  }, [selectedCountry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCountry && selectedState) {
      onSubmit({
        country: selectedCountry,
        state: selectedState,
        description: description || undefined,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-white/20 p-6 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Enter Location Details</h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-blue-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Country Select */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-blue-200">
              Country
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {/* State Select */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-blue-200">
              State / Province
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* Description (Optional) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-blue-200">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Office, Home, Meeting..."
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Current Location Info */}
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-200">
              📍 Your GPS location will be captured when you tap "Confirm"
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !selectedCountry || !selectedState}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold"
            >
              {isLoading ? 'Confirming...' : 'Confirm & Locate'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
