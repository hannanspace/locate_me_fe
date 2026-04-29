"use client";

import dynamic from "next/dynamic";
import { Location } from "@/lib/api";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-slate-100">
      <span className="text-slate-500 text-sm">Loading map...</span>
    </div>
  ),
});

export default function MapViewWrapper({ locations }: { locations: Location[] }) {
  return <MapView locations={locations} />;
}
