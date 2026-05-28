import { createFileRoute } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { useState, useEffect, useRef } from 'react';
import { useSafetyRoutes } from '../../use-cases/hooks/useSafetyRoutes';
import type { RouteRequestInput } from '../../domain/entities/route';
import { Navigation, MapPin, Compass, Award, AlertTriangle, ArrowRight } from 'lucide-react';
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

const routeSearchSchema = z.object({
  startAddress: z.string().min(3, 'Lokasi awal minimal 3 karakter'),
  destinationAddress: z.string().min(3, 'Lokasi tujuan minimal 3 karakter'),
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
    }).setView([-7.6167, 111.6500], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

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
        .bindPopup('Titik Mulai')
        .openPopup();

      // Add end marker
      endMarkerRef.current = L.marker([routeParams.endLat, routeParams.endLng])
        .addTo(map)
        .bindPopup('Tujuan');

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

  // TanStack Form setup
  const form = useForm({
    defaultValues: {
      startAddress: '',
      destinationAddress: '',
    },
    onSubmit: async ({ value }) => {
      setGeocodingLoading(true);
      try {
        const startCoord = await geocodeAddress(value.startAddress);
        const endCoord = await geocodeAddress(value.destinationAddress);

        if (startCoord && endCoord) {
          setRouteParams({
            startLat: startCoord[0],
            startLng: startCoord[1],
            endLat: endCoord[0],
            endLng: endCoord[1],
          });
        } else {
          alert('Lokasi asal atau tujuan tidak ditemukan di Madiun. Coba tulis lebih spesifik (misal: "Alun-Alun Madiun" atau "Caruban").');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setGeocodingLoading(false);
      }
    },
  });

  return (
    <div className="flex flex-col flex-1 p-4 space-y-4 animate-fade-in">
      {/* Route Search Form Panel */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Compass className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Cari Rute Aman Anda</h3>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-3"
        >
          {/* Start Location Input */}
          <form.Field
            name="startAddress"
            validators={{
              onChange: routeSearchSchema.shape.startAddress,
            }}
          >
            {(field) => (
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Lokasi Awal (misal: Alun-Alun Madiun)"
                  className="w-full text-xs py-2.5 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
                />
                {field.state.meta.errors && (
                  <span className="text-[10px] text-red-500 mt-1 block px-2">
                    {field.state.meta.errors.join(', ')}
                  </span>
                )}
              </div>
            )}
          </form.Field>

          {/* End Location Input */}
          <form.Field
            name="destinationAddress"
            validators={{
              onChange: routeSearchSchema.shape.destinationAddress,
            }}
          >
            {(field) => (
              <div className="relative">
                <Navigation className="absolute left-3 top-3 w-4 h-4 text-emerald-500 rotate-45" />
                <input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Lokasi Tujuan (misal: Caruban Madiun)"
                  className="w-full text-xs py-2.5 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
                />
                {field.state.meta.errors && (
                  <span className="text-[10px] text-red-500 mt-1 block px-2">
                    {field.state.meta.errors.join(', ')}
                  </span>
                )}
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting || geocodingLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/10 hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting || geocodingLoading ? 'Menganalisis Rute...' : 'Analisis Rute Aman'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </form.Subscribe>
        </form>
      </div>

      {/* Map Display Panel */}
      <div className="relative h-72 bg-slate-200 dark:bg-slate-800 rounded-3xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700 z-10">
        <div ref={mapRef} className="w-full h-full" style={{ minHeight: '100%' }} />
        
        {geocodingLoading && (
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm z-[1000] flex flex-col justify-center items-center text-white space-y-2">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold tracking-wide">Mencari koordinat di Madiun...</span>
          </div>
        )}

        {!routeParams && !geocodingLoading && (
          <div className="absolute inset-0 bg-slate-950/10 pointer-events-none z-[400] flex flex-col justify-center items-center text-slate-500">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold shadow-lg text-slate-700 dark:text-slate-200">
              Isi asal & tujuan untuk memulai navigasi
            </div>
          </div>
        )}
      </div>

      {/* Routing Results & AI Recommendation Panel */}
      {isLoading && (
        <div className="space-y-3">
          <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-2xl border border-red-200 dark:border-red-900 text-xs">
          Gagal mengambil rekomendasi rute: {error.message}
        </div>
      )}

      {routes && routes.map((route) => (
        <div
          key={route.id}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4 animate-fade-in-up"
        >
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Rute Rekomendasi Teratas
              </span>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{route.name}</h4>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              route.safetyLevel === 'safe'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                : route.safetyLevel === 'warning'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
                : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400'
            }`}>
              <Award className="w-3.5 h-3.5" />
              <span>Skor {route.safetyScore}/100</span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-center">
            <div>
              <span className="text-[9px] text-slate-400 block">Jarak</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{route.distanceKm} Km</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">Waktu</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{route.durationMinutes} Menit</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">Laporan Aktif</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{route.hazardCount} Kejadian</span>
            </div>
          </div>

          {/* AI Recommendation Explanation */}
          <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 text-xs">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">💡 Rekomendasi AI SI AMAN:</span>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{route.aiRecommendation}</p>
          </div>

          {/* Safety Factors Details */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Faktor Pendukung:</span>
            <div className="space-y-1.5">
              {route.safetyFactors.map((factor, idx) => (
                <div key={idx} className="flex gap-2 items-start text-xs">
                  {factor.type === 'positive' ? (
                    <Award className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-200 block">{factor.factor}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{factor.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
