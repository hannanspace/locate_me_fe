"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import { Location } from "@/lib/api";

const humanIcon = L.divIcon({
  html: '<div class="text-2xl leading-none">🧍</div>',
  className: "human-marker-icon",
  iconSize: [24, 24],
  iconAnchor: [12, 20],
  popupAnchor: [0, -20],
});

const MALAYSIA_CENTER: [number, number] = [3.0, 110.0];
const DEFAULT_ZOOM = 5;

export default function MapView({ locations = [] }: { locations: Location[] }) {
  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={MALAYSIA_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Display all saved locations */}
        {locations.map((location, idx) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
            icon={humanIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Location {idx + 1}</p>
                <p>Lat: {location.latitude.toFixed(4)}</p>
                <p>Lng: {location.longitude.toFixed(4)}</p>
                {location.accuracy && <p>Accuracy: {location.accuracy}m</p>}
                {location.description && <p className="mt-1">{location.description}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

    </div>
  );
}
