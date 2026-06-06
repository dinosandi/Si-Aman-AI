import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useSafetyRoutes } from "../../use-cases/hooks/useSafetyRoutes";
import { useReports } from "../../use-cases/hooks/useReports";
import { locationHubService } from "../../infrastructure/services/locationHubService";
import type { RouteRequestInput } from "../../domain/entities/route";
import type { Report } from "../../domain/entities/report";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SearchHeader } from "../../components/atomic/organisms/SearchHeader";
import { RouteDrawer } from "../../components/atomic/organisms/RouteDrawer";
import { Compass, Settings2 } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [routeParams, setRouteParams] = useState<RouteRequestInput | null>(
    null,
  );
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Report | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Real coordinates state (starts at Mejayan center)
  const [currentCoord, setCurrentCoord] = useState<{
    lat: number;
    lng: number;
  }>({
    lat: -7.6167,
    lng: 111.65,
  });

  const handleStartNavigation = () => {
    setIsNavigating(true);
    window.dispatchEvent(
      new CustomEvent("navigation-change", { detail: { active: true } }),
    );
  };

  const handleStopNavigation = () => {
    setIsNavigating(false);
    setRouteParams(null);
    setSearchQuery("");
    window.dispatchEvent(
      new CustomEvent("navigation-change", { detail: { active: false } }),
    );
  };

  useEffect(() => {
    return () => {
      window.dispatchEvent(
        new CustomEvent("navigation-change", { detail: { active: false } }),
      );
    };
  }, []);

  interface SuggestionItem {
    id: string;
    name: string;
    address: string;
    lat: number;
    lon: number;
  }

  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);

  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const fullQuery = `${searchQuery}, Kabupaten Madiun, Jawa Timur, Indonesia`;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&limit=5`,
          {
            headers: {
              "Accept-Language": "id",
            },
          },
        );
        const data = await response.json();
        if (data && data.length > 0) {
          const items: SuggestionItem[] = data.map((item: any) => {
            const parts = item.display_name.split(",");
            const name = parts[0] || searchQuery;
            const address = parts.slice(1).join(",").trim();
            return {
              id: item.place_id.toString(),
              name,
              address,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
            };
          });
          setSuggestions(items);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Nominatim Autocomplete Error:", err);
      }
    }, 450); // 450ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = (item: SuggestionItem) => {
    setSearchQuery(item.name);
    setSuggestions([]);
    setRouteParams({
      startLat: currentCoord.lat,
      startLng: currentCoord.lng,
      endLat: item.lat,
      endLng: item.lon,
    });
  };

  // Map refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.FeatureGroup | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);
  const gpsMarkerRef = useRef<L.Marker | null>(null);
  const incidentMarkersRef = useRef<L.Marker[]>([]);

  // Fetch nearby incidents
  const { data: incidentReports } = useReports(
    currentCoord.lat,
    currentCoord.lng,
    50000,
  );

  // Real-time tracking and location hub connection
  useEffect(() => {
    let watchId: number | null = null;
    let isMounted = true;

    const startTracking = async () => {
      try {
        await locationHubService.startConnection();
        console.log("LocationHub connected successfully!");

        if (navigator.geolocation) {
          watchId = navigator.geolocation.watchPosition(
            (pos) => {
              if (!isMounted) return;
              const { latitude, longitude } = pos.coords;
              setCurrentCoord({ lat: latitude, lng: longitude });

              // Send location updates to the SignalR LocationHub in the background
              locationHubService
                .updateLocation({
                  latitude,
                  longitude,
                })
                .catch((err) => {
                  console.error(
                    "Gagal mengirim update lokasi ke SignalR:",
                    err,
                  );
                });
            },
            (err) => {
              console.warn("Geolocation watch failed:", err);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
          );
        }
      } catch (err) {
        console.error("Gagal start connection ke LocationHub:", err);
      }
    };

    startTracking();

    return () => {
      isMounted = false;
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      locationHubService.stopConnection();
    };
  }, []);

  // Synchronize GPS marker when coordinates change
  useEffect(() => {
    if (mapInstanceRef.current && gpsMarkerRef.current) {
      gpsMarkerRef.current.setLatLng([currentCoord.lat, currentCoord.lng]);
    }
  }, [currentCoord]);

  // Synchronize dynamic incident markers on the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old markers
    incidentMarkersRef.current.forEach((marker) => map.removeLayer(marker));
    incidentMarkersRef.current = [];

    if (!incidentReports) return;

    const getCategoryConfig = (category: string) => {
      switch (category) {
        case "accident":
          return {
            emoji: "💥",
            label: "Kecelakaan",
            colorClass: "bg-rose-500",
            borderClass: "border-rose-100",
          };
        case "crime":
          return {
            emoji: "🚨",
            label: "Kriminalitas",
            colorClass: "bg-red-500",
            borderClass: "border-red-100",
          };
        case "natural_disaster":
          return {
            emoji: "🌋",
            label: "Bencana Alam",
            colorClass: "bg-orange-500",
            borderClass: "border-orange-100",
          };
        case "hazard":
        case "road_block":
          return {
            emoji: "🚧",
            label: "Bahaya Jalan",
            colorClass: "bg-amber-500",
            borderClass: "border-amber-100",
          };
        default:
          return {
            emoji: "❓",
            label: "Lainnya",
            colorClass: "bg-slate-500",
            borderClass: "border-slate-100",
          };
      }
    };

    incidentReports.forEach((incident) => {
      const config = getCategoryConfig(incident.category);
      const icon = L.divIcon({
        className: "custom-activity-marker",
        html: `
          <div class="flex flex-col items-center select-none cursor-pointer">
            <div class="bg-white/95 backdrop-blur-sm border ${config.borderClass} px-2.5 py-1.5 rounded-2xl shadow-lg flex items-center gap-2 relative">
              <div class="w-6 h-6 rounded-full ${config.colorClass} flex items-center justify-center text-white text-[10px] font-black shrink-0">${config.emoji}</div>
              <div class="flex flex-col">
                <span class="${config.colorClass} text-white text-[7px] font-black px-1.5 py-0.5 rounded-full w-max leading-none mb-0.5">${config.label}</span>
                <span class="text-[9px] font-black text-slate-800 leading-tight truncate max-w-[80px]">${incident.title}</span>
              </div>
            </div>
            <div class="w-2 h-2 bg-white border-r border-b ${config.borderClass} rotate-45 -translate-y-1"></div>
          </div>
        `,
        iconSize: [120, 50],
        iconAnchor: [60, 50],
      });

      const marker = L.marker(
        [incident.location.latitude, incident.location.longitude],
        { icon },
      ).addTo(map);

      marker.on("click", () => {
        setSelectedIncident(incident);
      });

      incidentMarkersRef.current.push(marker);
    });
  }, [incidentReports]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
    }).setView([currentCoord.lat, currentCoord.lng], 13);

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

    const userMarker = L.marker([currentCoord.lat, currentCoord.lng], {
      icon: greenDotIcon,
    })
      .addTo(map)
      .bindPopup("Lokasi Anda Saat Ini")
      .openPopup();

    gpsMarkerRef.current = userMarker;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      gpsMarkerRef.current = null;
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

      // Map dynamic backend reports to hazards list for segment styling
      const hazards = (incidentReports || []).map((incident) => {
        let color = "#64748b"; // default other
        if (incident.category === "crime") color = "#ef4444";
        else if (incident.category === "accident") color = "#f43f5e";
        else if (incident.category === "hazard") color = "#f59e0b";
        else if (incident.category === "natural_disaster") color = "#f97316";

        return {
          lat: incident.location.latitude,
          lng: incident.location.longitude,
          color,
          name: incident.title,
        };
      });

      const group = L.featureGroup();

      for (let i = 0; i < latLngs.length - 1; i++) {
        const pt1 = latLngs[i];
        const pt2 = latLngs[i + 1];

        // Midpoint of the segment
        const midLat = (pt1[0] + pt2[0]) / 2;
        const midLng = (pt1[1] + pt2[1]) / 2;

        let segmentColor = "#10b981"; // default safe emerald green
        let minDistance = 999999;

        // Check proximity to any of the hazard coordinates
        for (const hz of hazards) {
          const distance = Math.sqrt(
            Math.pow(midLat - hz.lat, 2) + Math.pow(midLng - hz.lng, 2),
          );
          // 0.004 degrees is approx 450 meters
          if (distance < 0.004 && distance < minDistance) {
            minDistance = distance;
            segmentColor = hz.color;
          }
        }

        L.polyline([pt1, pt2], {
          color: segmentColor,
          weight: 7,
          opacity: 0.95,
          lineJoin: "round",
        }).addTo(group);
      }

      group.addTo(map);
      polylineRef.current = group;

      map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
  }, [routeParams, routes, incidentReports]);

  // Handle Search Submission
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setGeocodingLoading(true);
    const destCoords = await geocodeAddress(searchQuery);
    if (destCoords) {
      setRouteParams({
        startLat: currentCoord.lat, // User's green dot position
        startLng: currentCoord.lng,
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
      mapInstanceRef.current.setView([currentCoord.lat, currentCoord.lng], 14, {
        animate: true,
      });
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* Full-screen Map Container */}
      <div ref={mapRef} className="w-full h-full z-0 absolute inset-0" />

      {/* Floating Header: Search, Notification Bell, and Suggestions */}
      {!isNavigating && (
        <div className="absolute top-4 left-4 right-4 z-[1001] flex flex-col gap-1.5 pointer-events-auto">
          <SearchHeader
            className="relative flex items-center gap-3 w-full"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSubmit={handleSearchSubmit}
            onNotificationClick={() =>
              alert(
                "Anda memiliki 5 pemberitahuan keamanan baru di sekitar Madiun.",
              )
            }
          />
          {suggestions.length > 0 && (
            <div className="bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.12)] max-h-48 overflow-y-auto w-full z-[1010] flex flex-col divide-y divide-slate-100/50 p-1.5 animate-fade-in pointer-events-auto">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 active:bg-slate-100 transition-colors text-xs font-bold text-slate-700 flex flex-col gap-0.5 rounded-xl pointer-events-auto"
                >
                  <span className="text-slate-800 font-extrabold">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold truncate">
                    {item.address}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Geocoding Loading Indicator Overlay */}
      {geocodingLoading && (
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm z-1000 flex flex-col justify-center items-center text-white space-y-2">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold">Menganalisis lokasi...</span>
        </div>
      )}

      {/* Floating Map Controls */}
      <div
        className={`absolute ${isNavigating ? "bottom-44" : routeParams ? "bottom-[19rem]" : "bottom-4"} right-4 z-1000 flex flex-col gap-2.5 items-center`}
      >
        {isNavigating && (
          <button
            type="button"
            onClick={() => {
              alert(
                "🚨 TANDA DARURAT DIKIRIM! Lokasi Anda dibagikan ke warga sekitar dan Polsek terdekat.",
              );
            }}
            className="relative w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all shrink-0 group mb-1.5"
            title="Panggil Darurat (SOS)"
          >
            <div
              className="absolute inset-0 rounded-full bg-red-500/40 animate-ping"
              style={{ animationDuration: "1.5s" }}
            />
            <span className="text-xl relative z-10 select-none">🚨</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleRecenter}
          className="w-10 h-10 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl flex items-center justify-center shadow-lg text-slate-700 active:scale-90 hover:bg-slate-50 transition-all"
          title="Fokus Lokasi Saya"
        >
          <Compass className="w-5 h-5 text-emerald-500 animate-pulse" />
        </button>
      </div>

      {/* Route Details Sliding Drawer overlay */}
      {!geocodingLoading && !isNavigating && (
        <RouteDrawer
          routes={routes}
          onClear={() => {
            setRouteParams(null);
            setSearchQuery("");
          }}
          onNavigateStart={handleStartNavigation}
        />
      )}

      {/* Active Navigation HUD Overlay */}
      {isNavigating && (
        <div className="absolute inset-x-0 bottom-0 z-1000 bg-white border-t border-slate-200 p-5 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] space-y-4 animate-fade-in-up flex flex-col pointer-events-auto">
          {/* Navigation HUD Stats */}
          <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-pulse font-bold">
                🧭
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">
                  Navigasi Aktif
                </span>
                <span className="text-sm font-black text-slate-800">
                  Menuju Lokasi Tujuan
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-emerald-600 block">
                18 Menit • 6.5 Km
              </span>
              <span className="text-[9px] text-slate-400 font-bold">
                Rute Aman Terkomputerisasi
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex gap-3">
            {/* Stop Navigation Button */}
            <button
              type="button"
              onClick={handleStopNavigation}
              className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl active:scale-95 transition-all text-sm"
            >
              Selesai Navigasi
            </button>
          </div>
        </div>
      )}

      {/* Selected Incident Custom Modal */}
      {selectedIncident && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[1050] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in-up border border-slate-100 flex flex-col pointer-events-auto">
            {/* Header */}
            <div className="p-5 pb-4 border-b border-slate-100 flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  {selectedIncident.category === "accident"
                    ? "💥 Kecelakaan"
                    : selectedIncident.category === "crime"
                      ? "🚨 Kriminal"
                      : selectedIncident.category === "natural_disaster"
                        ? "🌋 Bencana Alam"
                        : "🚧 Jalan Rusak"}
                </span>
                <h4 className="text-sm font-black text-slate-800 mt-2.5 leading-tight">
                  {selectedIncident.title}
                </h4>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center text-slate-500 font-extrabold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
              {selectedIncident.imageUrl && (
                <div
                  onClick={() => setZoomedImage(selectedIncident.imageUrl)}
                  className="w-full h-44 rounded-2xl overflow-hidden bg-slate-50 border border-slate-150 flex items-center justify-center cursor-zoom-in group relative"
                >
                  <img
                    src={selectedIncident.imageUrl}
                    alt={selectedIncident.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-[10px] font-black bg-slate-900/60 px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm">
                      🔍 Klik untuk Perbesar
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                  Detail Laporan
                </span>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  {selectedIncident.description}
                </p>
              </div>

              {selectedIncident.location.address && (
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                    Lokasi Detail
                  </span>
                  <span className="text-xs text-slate-700 font-bold block">
                    {selectedIncident.location.address}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-100/50">
                <span>
                  {new Date(selectedIncident.createdAt).toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </span>
              </div>
            </div>

            {/* Modal Action Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Fullscreen Image Lightbox */}
      {zoomedImage && (
        <div
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-[2000] flex flex-col justify-center items-center p-4 pointer-events-auto"
          onClick={() => setZoomedImage(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center text-white font-extrabold text-lg shadow-lg"
          >
            ✕
          </button>

          <div className="max-w-full max-h-[80vh] rounded-2xl overflow-hidden flex items-center justify-center">
            <img
              src={zoomedImage}
              alt="Zoomed Incident"
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/10"
            />
          </div>

          <span className="text-white/60 text-xs font-bold mt-4 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
            Klik di mana saja untuk menutup
          </span>
        </div>
      )}
    </div>
  );
}
