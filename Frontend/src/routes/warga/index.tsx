import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { useSafetyRoutes } from '../../use-cases/hooks/useSafetyRoutes';
import type { RouteRequestInput } from '../../domain/entities/route';
import { Compass, Award, AlertTriangle, Search, Bell, Plus, Settings, MapPin, Navigation } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons in Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

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

export const Route = createFileRoute('/warga/')({
  component: WargaDashboard,
});

// Nominatim Geocoding function
const geocodeAddress = async (query: string): Promise<[number, number] | null> => {
  try {
    const fullQuery = `${query}, Kabupaten Madiun, Jawa Timur, Indonesia`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&limit=1`,
      {
        headers: {
          'Accept-Language': 'id',
        },
      }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      return [lat, lon];
    }
  } catch (err) {
    console.error('Nominatim Geocoding Error:', err);
  }
  return null;
};

function WargaDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [routeParams, setRouteParams] = useState<RouteRequestInput | null>(null);
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
    }).setView([-7.6167, 111.6500], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Setup green dot GPS marker matching wireframe design
    const greenDotIcon = L.divIcon({
      className: 'custom-gps-dot',
      html: `
        <div class="relative flex items-center justify-center w-6 h-6">
          <div class="absolute w-6 h-6 bg-emerald-500/35 rounded-full animate-ping" style="animation-duration: 2s;"></div>
          <div class="relative w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker([-7.6167, 111.6500], { icon: greenDotIcon })
      .addTo(map)
      .bindPopup('Lokasi Anda Saat Ini')
      .openPopup();

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Fetch safety routes recommendation
  const { data: routes, isLoading, error } = useSafetyRoutes(routeParams);

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
      startMarkerRef.current = L.marker([routeParams.startLat, routeParams.startLng])
        .addTo(map)
        .bindPopup('Titik Mulai');

      // Add end marker
      endMarkerRef.current = L.marker([routeParams.endLat, routeParams.endLng])
        .addTo(map)
        .bindPopup('Tujuan')
        .openPopup();

      // Adjust map view
      const bounds = L.latLngBounds(
        [routeParams.startLat, routeParams.startLng],
        [routeParams.endLat, routeParams.endLng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    if (routes && routes.length > 0) {
      const selectedRoute = routes[0]; // Display safest route as primary
      const latLngs = selectedRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);

      let color = '#10b981'; // emerald-500
      if (selectedRoute.safetyLevel === 'warning') color = '#f59e0b'; // amber-500
      if (selectedRoute.safetyLevel === 'danger') color = '#ef4444'; // red-500

      polylineRef.current = L.polyline(latLngs, {
        color,
        weight: 6,
        opacity: 0.85,
        lineJoin: 'round',
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
        startLng: 111.6500,
        endLat: destCoords[0],
        endLng: destCoords[1],
      });
    } else {
      alert('Lokasi tidak ditemukan di Madiun. Coba tulis lebih spesifik (misal: "Caruban" atau "Mejayan").');
    }
    setGeocodingLoading(false);
  };

  // Recenter GPS
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([-7.6167, 111.6500], 14, { animate: true });
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      
      {/* Full-screen Map Container */}
      <div ref={mapRef} className="w-full h-full z-0 absolute inset-0" />

      {/* Floating Header: Search & Notification Bell */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center gap-3">
        {/* Search Input Box */}
        <form onSubmit={handleSearchSubmit} className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex items-center gap-2 shadow-sm">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Lokasi Tujuan"
            className="w-full text-xs text-slate-700 bg-transparent outline-none placeholder-slate-400"
          />
        </form>

        {/* Bell Button with badge 5 */}
        <button
          type="button"
          onClick={() => alert('Anda memiliki 5 pemberitahuan keamanan baru di sekitar Madiun.')}
          className="relative w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 active:scale-95 transition-transform shrink-0"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
            5
          </span>
        </button>
      </div>

      {/* Geocoding Loading Indicator Overlay */}
      {geocodingLoading && (
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm z-[1000] flex flex-col justify-center items-center text-white space-y-2">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold">Menganalisis lokasi...</span>
        </div>
      )}

      {/* Route Details Sliding Drawer overlay */}
      {routes && routes.length > 0 && !geocodingLoading && (
        <div className="absolute bottom-24 left-4 right-4 z-[1000] bg-white border border-slate-200 p-4 rounded-2xl shadow-lg space-y-3 animate-fade-in-up">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] uppercase font-extrabold text-[#114B5F] tracking-wider block">
                Rute Rekomendasi Teratas
              </span>
              <h4 className="font-extrabold text-slate-800 text-sm">{routes[0].name}</h4>
            </div>
            <button
              onClick={() => {
                setRouteParams(null);
                setSearchQuery('');
              }}
              className="text-slate-400 hover:text-slate-600 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-lg border border-slate-200"
            >
              Clear
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 py-1.5 px-3 bg-slate-50 rounded-xl text-center border border-slate-100">
            <div>
              <span className="text-[9px] text-slate-400 block font-medium">Jarak</span>
              <span className="text-xs font-extrabold text-slate-800">{routes[0].distanceKm} Km</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block font-medium">Waktu</span>
              <span className="text-xs font-extrabold text-slate-800">{routes[0].durationMinutes} Min</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block font-medium">Laporan Aktif</span>
              <span className="text-xs font-extrabold text-red-600">{routes[0].hazardCount} Aduan</span>
            </div>
          </div>

          {/* AI Safety Recommendation */}
          <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-100 text-[11px] leading-relaxed text-[#114B5F] font-semibold">
            <span className="font-bold text-teal-800 block mb-0.5">💡 Rekomendasi AI:</span>
            {routes[0].aiRecommendation}
          </div>
        </div>
      )}

      {/* Floating Bottom Navigation Bar */}
      <div className="absolute bottom-6 left-4 right-4 z-[1000] bg-white border border-slate-200 rounded-2xl py-3.5 px-6 flex justify-between items-center shadow-md">
        
        {/* Left: Compass / Recenter */}
        <button
          type="button"
          onClick={handleRecenter}
          className="text-[#114B5F] hover:text-[#0e3b4b] active:scale-95 transition-transform"
          title="Recenter Map"
        >
          <Compass className="w-5.5 h-5.5" />
        </button>

        {/* Center: Floating Circle Plus Action Button */}
        <button
          type="button"
          onClick={() => navigate({ to: '/warga/report-safety' })}
          className="w-14 h-14 bg-[#114B5F] hover:bg-[#0e3b4b] text-white rounded-full flex items-center justify-center -translate-y-7 border-4 border-white shadow-lg active:scale-95 transition-transform shrink-0"
          title="Lapor Kerawanan Baru"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Right: Settings cog */}
        <button
          type="button"
          onClick={() => alert('Menu pengaturan peta sedang dalam pengembangan.')}
          className="text-slate-400 hover:text-slate-600 active:scale-95 transition-transform"
          title="Settings"
        >
          <Settings className="w-5.5 h-5.5" />
        </button>
      </div>

    </div>
  );
}
