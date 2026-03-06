"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  useMap, 
  useMapEvents 
} from "react-leaflet";
import L from "leaflet";
import { Search } from "lucide-react";

// Fix for default marker icons in Leaflet + Next.js
// https://github.com/PaulLeCam/react-leaflet/issues/453
const icon = L.icon({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapSelectorProps {
  initialPosition?: [number, number];
  onLocationChange: (lat: number, lng: number, address?: string) => void;
  className?: string;
}

// Sub-component to handle map center changes
function RecenterMap({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position);
  }, [position, map]);
  return null;
}

// Sub-component to handle clicks on the map
function MapEvents({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapSelector({ 
  initialPosition = [-38.4161, -63.6167], // Default: centro de Argentina
  onLocationChange,
  className = "h-[400px] w-full rounded-md border overflow-hidden"
}: MapSelectorProps) {
  const [position, setPosition] = useState<[number, number]>(initialPosition);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const handleMarkerDrag = useCallback((e: L.LeafletEvent) => {
    const marker = e.target as L.Marker;
    const { lat, lng } = marker.getLatLng();
    setPosition([lat, lng]);
    onLocationChange(lat, lng);
  }, [onLocationChange]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationChange(lat, lng);
  }, [onLocationChange]);

  const searchAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    // Limpiar error previo
    setSearchError("");
    setIsSearching(true);
    try {
      // Usar Nominatim con countrycodes=ar
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&countrycodes=ar`,
        { headers: { "Accept-Language": "es", "User-Agent": "AuxyCRM/1.0" } }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setPosition([lat, lng]);
        onLocationChange(lat, lng, data[0].display_name || searchQuery);
      } else {
        setSearchError("No se encontró esa dirección en Argentina.");
      }
    } catch (error) {
      console.error("Error searching address:", error);
      setSearchError("Error al buscar la dirección");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative flex flex-col gap-2">
      {/* Search Input Overlay */}
      <div className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Ej: Corrientes 1234, Córdoba"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchAddress()}
            className="w-full px-4 py-2 text-sm border rounded-md pr-10 bg-white"
          />
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
        <button
          type="button"
          onClick={() => searchAddress()}
          disabled={isSearching}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {isSearching ? "Buscando..." : "Buscar"}
        </button>
      </div>

      <div className={className}>
        <MapContainer 
          center={position} 
          zoom={5} 
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker 
            position={position} 
            draggable={true}
            eventHandlers={{ dragend: handleMarkerDrag }}
            icon={icon}
          />
          <RecenterMap position={position} />
          <MapEvents onLocationChange={handleMapClick} />
        </MapContainer>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Puedes buscar una dirección o arrastrar el marcador al punto exacto.
      </p>
      {searchError && (
        <p className="text-xs text-red-500 mt-1">{searchError}</p>
      )}
    </div>
  );
}
