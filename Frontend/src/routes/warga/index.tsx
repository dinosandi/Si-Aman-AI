import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useSafetyRoutes } from "../../use-cases/hooks/useSafetyRoutes";
import type { RouteRequestInput } from "../../domain/entities/route";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SearchHeader } from "./components/SearchHeader";
import { RouteDrawer } from "./components/RouteDrawer";
import { BottomNav } from "./components/BottomNav";

// Fix Leaflet marker icons in Vite
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIconRetina from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

export const Route = createFileRoute("/warga/")({
  component: WargaDashboard,
});

// Nominatim Geocoding function
const geocodeAddress = async (
  query: string,
): Promise<[number, number] | null> => {
  try {
    const fullQuery = `${query}, Kabupaten Madiun, Jawa Timur, Indonesia`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&limit=1`,
      {
        headers: {
          "Accept-Language": "id",
        },
      },
    );
    const data = await response.json();
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      return [lat, lon];
    }
  } catch (err) {
    console.error("Nominatim Geocoding Error:", err);
  }
  return null;
};

function WargaDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [routeParams, setRouteParams] = useState<RouteRequestInput | null>(
    null,
  );
  const [geocodingLoading, setGeocodingLoading] = useState(false);

  // Map refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
    }).setView([-7.6167, 111.65], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Setup green dot GPS marker matching wireframe design
    const greenDotIcon = L.divIcon({
      className: "custom-gps-dot",
      html: `
        <div class="relative flex items-center justify-center w-6 h-6">
          <div class="absolute w-6 h-6 bg-emerald-500/35 rounded-full animate-ping" style="animation-duration: 2s;"></div>
          <div class="relative w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker([-7.6167, 111.65], { icon: greenDotIcon })
      .addTo(map)
      .bindPopup("Lokasi Anda Saat Ini")
      .openPopup();

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Fetch safety routes recommendation
  const { data: routes } = useSafetyRoutes(routeParams);

  // Update map on route or coordinate changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean up previous layers
    if (polylineRef.current) map.removeLayer(polylineRef.current);
    if (startMarkerRef.current) map.removeLayer(startMarkerRef.current);
    if (endMarkerRef.current) map.removeLayer(endMarkerRef.current);

    if (routeParams) {
      // Add start marker
      startMarkerRef.current = L.marker([
        routeParams.startLat,
        routeParams.startLng,
      ])
        .addTo(map)
        .bindPopup("Titik Mulai");

      // Add end marker
      endMarkerRef.current = L.marker([routeParams.endLat, routeParams.endLng])
        .addTo(map)
        .bindPopup("Tujuan")
        .openPopup();

      // Adjust map view
      const bounds = L.latLngBounds(
        [routeParams.startLat, routeParams.startLng],
        [routeParams.endLat, routeParams.endLng],
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    if (routes && routes.length > 0) {
      const selectedRoute = routes[0]; // Display safest route as primary
      const latLngs = selectedRoute.geometry.coordinates.map(
        ([lng, lat]) => [lat, lng] as [number, number],
      );

      let color = "#10b981"; // emerald-500
      if (selectedRoute.safetyLevel === "warning") color = "#f59e0b"; // amber-500
      if (selectedRoute.safetyLevel === "danger") color = "#ef4444"; // red-500

      polylineRef.current = L.polyline(latLngs, {
        color,
        weight: 6,
        opacity: 0.85,
        lineJoin: "round",
      }).addTo(map);

      map.fitBounds(polylineRef.current.getBounds(), { padding: [50, 50] });
    }
  }, [routeParams, routes]);

  // Handle Search Submission
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setGeocodingLoading(true);
    const destCoords = await geocodeAddress(searchQuery);
    if (destCoords) {
      setRouteParams({
        startLat: -7.6167, // User's green dot position
        startLng: 111.65,
        endLat: destCoords[0],
        endLng: destCoords[1],
      });
    } else {
      alert(
        'Lokasi tidak ditemukan di Madiun. Coba tulis lebih spesifik (misal: "Caruban" atau "Mejayan").',
      );
    }
    setGeocodingLoading(false);
  };

  // Recenter GPS
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([-7.6167, 111.65], 14, { animate: true });
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* Full-screen Map Container */}
      <div ref={mapRef} className="w-full h-full z-0 absolute inset-0" />

      {/* Floating Header: Search & Notification Bell */}
      <SearchHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSubmit={handleSearchSubmit}
        onNotificationClick={() =>
          alert("Anda memiliki 5 pemberitahuan keamanan baru di sekitar Madiun.")
        }
      />

      {/* Geocoding Loading Indicator Overlay */}
      {geocodingLoading && (
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm z-1000 flex flex-col justify-center items-center text-white space-y-2">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold">Menganalisis lokasi...</span>
        </div>
      )}

      {/* Route Details Sliding Drawer overlay */}
      {!geocodingLoading && (
        <RouteDrawer
          routes={routes}
          onClear={() => {
            setRouteParams(null);
            setSearchQuery("");
          }}
        />
      )}

      {/* Floating Bottom Navigation Bar (Refined & Compact) */}
      <BottomNav
        onRecenter={handleRecenter}
        onPlusClick={() => navigate({ to: "/warga/report-safety" })}
        onSettingsClick={() =>
          alert("Menu pengaturan peta sedang dalam pengembangan.")
        }
      />
    </div>
  );
}
