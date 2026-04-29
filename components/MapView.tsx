"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { Location } from "@/lib/api";

const defaultIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.mergeOptions({ icon: defaultIcon });

const MALAYSIA_CENTER: [number, number] = [3.0, 110.0];
const DEFAULT_ZOOM = 5;

function FlyToLocation({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { animate: true, duration: 1.5 });
    }
  }, [map, position]);
  return null;
}

export default function MapView({ locations = [] }: { locations: Location[] }) {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(
    null
  );

  // Fly to first location on mount
  useEffect(() => {
    if (locations.length > 0) {
      const [lat, lng] = [locations[0].latitude, locations[0].longitude];
      setUserPosition([lat, lng]);
    }
  }, [locations]);


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
            icon={defaultIcon}
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

        {/* Current user position */}
        {userPosition && (
          <>
            <Marker position={userPosition} icon={defaultIcon} />
            <FlyToLocation position={userPosition} />
          </>
        )}
      </MapContainer>

    </div>
  );
}
