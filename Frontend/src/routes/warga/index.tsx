import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useSafetyRoutes } from "../../use-cases/hooks/useSafetyRoutes";
import { useReports, useVoteIncident } from "../../use-cases/hooks/useReports";
import { locationHubService } from "../../infrastructure/services/locationHubService";
import { sosHubService } from "../../infrastructure/services/sosHubService";
import { useAuth } from "../../use-cases/hooks/useAuth";
import type { RouteRequestInput } from "../../domain/entities/route";
import type { Report } from "../../domain/entities/report";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SearchHeader } from "../../components/atomic/organisms/SearchHeader";
import { RouteDrawer } from "../../components/atomic/organisms/RouteDrawer";
import { Toast } from "../../components/atomic/atoms/Toast";
import {
  Compass,
  Settings2,
  Eye,
  EyeOff,
  Lock,
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";

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

const calculateBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
};

const getDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

function WargaDashboard() {
  const auth = useAuth();
  const [heading, setHeading] = useState<number>(0);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [votedIncidentIds, setVotedIncidentIds] = useState<
    Record<string, boolean>
  >({});
  const voteMutation = useVoteIncident();

  useEffect(() => {
    const message = localStorage.getItem("warga_toast_message");
    const type = localStorage.getItem("warga_toast_type") as
      | "success"
      | "error"
      | null;
    if (message) {
      setToast({ message, type: type || "success" });
      localStorage.removeItem("warga_toast_message");
      localStorage.removeItem("warga_toast_type");
    }
  }, []);

  // SOS States
  const [isSosActive, setIsSosActive] = useState<boolean>(() => {
    return localStorage.getItem("nav_is_sos_active") === "true";
  });
  const [showSosActivationPopup, setShowSosActivationPopup] = useState(false);
  const [showSosDeactivationPopup, setShowSosDeactivationPopup] =
    useState(false);
  const [sosPassword, setSosPassword] = useState("");
  const [showSosPassword, setShowSosPassword] = useState(false);
  const [sosError, setSosError] = useState<string | null>(null);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  const isSosActiveRef = useRef(isSosActive);
  useEffect(() => {
    isSosActiveRef.current = isSosActive;
  }, [isSosActive]);

  const handleSosClick = async () => {
    if (!isSosActive) {
      try {
        await sosHubService.startConnection();

        let lat = currentCoord.lat;
        let lng = currentCoord.lng;
        if (navigator.geolocation) {
          try {
            const pos = await new Promise<GeolocationPosition>(
              (resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  enableHighAccuracy: true,
                  timeout: 5000,
                });
              },
            );
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
          } catch (e) {
            console.warn(
              "Gagal mendapatkan lokasi GPS akurat untuk SOS, menggunakan koordinat peta:",
              e,
            );
          }
        }

        const alertId = await sosHubService.triggerSos(lat, lng);
        localStorage.setItem("nav_active_sos_alert_id", alertId);

        setIsSosActive(true);
        setShowSosActivationPopup(true);
      } catch (err) {
        console.error("Gagal koneksi atau trigger SOS Hub:", err);
        setIsSosActive(true);
        setShowSosActivationPopup(true);
      }
    } else {
      setSosPassword("");
      setSosError(null);
      setShowSosPassword(false);
      setShowSosDeactivationPopup(true);
    }
  };

  const handleVerifySosPassword = async () => {
    setSosError(null);
    setIsVerifyingPassword(true);
    try {
      const currentUser =
        auth.user ||
        JSON.parse(localStorage.getItem("warga_current_user") || "{}");
      const emailToVerify = currentUser.email || "warga@siaman.id";

      await auth.login({
        email: emailToVerify,
        password: sosPassword,
      });

      const alertId = localStorage.getItem("nav_active_sos_alert_id");
      if (alertId) {
        try {
          await sosHubService.resolveSos(alertId);
        } catch (e) {
          console.error("Gagal resolve SOS di server:", e);
        }
      }

      setIsSosActive(false);
      setShowSosDeactivationPopup(false);
      localStorage.removeItem("nav_is_sos_active");
      localStorage.removeItem("nav_active_sos_alert_id");
      await sosHubService.stopConnection();
    } catch (err: any) {
      setSosError("Kata sandi salah. Silakan coba lagi.");
    } finally {
      setIsVerifyingPassword(false);
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [routeParams, setRouteParams] = useState<RouteRequestInput | null>(
    () => {
      const saved = localStorage.getItem("nav_route_params");
      return saved ? JSON.parse(saved) : null;
    },
  );
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(() => {
    return localStorage.getItem("nav_is_navigating") === "true";
  });
  const [selectedIncident, setSelectedIncident] = useState<Report | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(() => {
    const saved = localStorage.getItem("nav_selected_route_index");
    return saved ? parseInt(saved, 10) : 0;
  });

  // Reset selected route index when route parameters change
  useEffect(() => {
    if (!localStorage.getItem("nav_route_params")) {
      setSelectedRouteIndex(0);
    }
  }, [routeParams]);

  // Persist navigation states to localStorage
  useEffect(() => {
    if (routeParams) {
      localStorage.setItem("nav_route_params", JSON.stringify(routeParams));
    } else {
      localStorage.removeItem("nav_route_params");
    }
  }, [routeParams]);

  useEffect(() => {
    localStorage.setItem("nav_is_navigating", String(isNavigating));
    window.dispatchEvent(
      new CustomEvent("navigation-change", {
        detail: { active: isNavigating },
      }),
    );
  }, [isNavigating]);

  useEffect(() => {
    localStorage.setItem(
      "nav_selected_route_index",
      String(selectedRouteIndex),
    );
  }, [selectedRouteIndex]);

  useEffect(() => {
    localStorage.setItem("nav_is_sos_active", String(isSosActive));
  }, [isSosActive]);

  useEffect(() => {
    if (isSosActive) {
      sosHubService.startConnection().catch((err) => {
        console.error(
          "Gagal melakukan auto-koneksi ulang ke SOS Hub saat refresh:",
          err,
        );
      });

      const unsubscribe = sosHubService.onSosReceived(({ method, data }) => {
        if (method === "SosResolved") {
          const storedAlertId = localStorage.getItem("nav_active_sos_alert_id");
          if (!data || data.alertId === storedAlertId) {
            setIsSosActive(false);
            localStorage.removeItem("nav_is_sos_active");
            localStorage.removeItem("nav_active_sos_alert_id");
            sosHubService.stopConnection().catch((err) => console.error(err));
            setToast({
              message: "Bantuan darurat SOS Anda telah selesai.",
              type: "success",
            });
          }
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [isSosActive]);

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
    setIsSosActive(false);
    setRouteParams(null);
    setSearchQuery("");
    localStorage.removeItem("nav_route_params");
    localStorage.removeItem("nav_is_navigating");
    localStorage.removeItem("nav_selected_route_index");
    localStorage.removeItem("nav_is_sos_active");
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
  const { data: rawIncidentReports } = useReports(
    currentCoord.lat,
    currentCoord.lng,
    50000,
  );

  const incidentReports = useMemo(() => {
    return rawIncidentReports
      ? rawIncidentReports.filter((r) => r.status === "verified")
      : [];
  }, [rawIncidentReports]);

  const votableIncidents = useMemo(() => {
    if (!rawIncidentReports) return [];

    const currentUser =
      auth.user ||
      JSON.parse(localStorage.getItem("warga_current_user") || "{}");
    const currentUserId = currentUser.userId || currentUser.id;

    return rawIncidentReports.filter((r) => {
      // Show unverified/pending incidents
      if (r.status !== "pending") return false;
      // Already voted in this session
      if (votedIncidentIds[r.id]) return false;
      // Already voted in database
      if (r.votedUserIds && currentUserId && r.votedUserIds.includes(currentUserId)) return false;
      // Distance is within 2km (2000 meters)
      const dist = getDistanceMeters(
        currentCoord.lat,
        currentCoord.lng,
        r.location.latitude,
        r.location.longitude,
      );
      return dist <= 2000;
    });
  }, [rawIncidentReports, currentCoord, votedIncidentIds, auth.user]);

  const handleVote = async (incidentId: string, type: number) => {
    try {
      await voteMutation.mutateAsync({ id: incidentId, type });
      setToast({
        message: "Terima kasih! Penilaian Anda berhasil disimpan.",
        type: "success",
      });
      setVotedIncidentIds((prev) => ({ ...prev, [incidentId]: true }));
    } catch (err: any) {
      setToast({
        message: err.message || "Gagal mengirimkan vote.",
        type: "error",
      });
    }
  };

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
              setCurrentCoord((prev) => {
                if (prev.lat !== latitude || prev.lng !== longitude) {
                  const newHeading = calculateBearing(
                    prev.lat,
                    prev.lng,
                    latitude,
                    longitude,
                  );
                  if (
                    Math.abs(latitude - prev.lat) > 0.00001 ||
                    Math.abs(longitude - prev.lng) > 0.00001
                  ) {
                    setHeading(newHeading);
                  }
                }
                return { lat: latitude, lng: longitude };
              });

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

              // Send to SOS Hub if SOS is active
              if (isSosActiveRef.current) {
                sosHubService
                  .updateSosLocation({
                    latitude,
                    longitude,
                  })
                  .catch((err) => {
                    console.error(
                      "Gagal mengirim update lokasi ke SOS Hub:",
                      err,
                    );
                  });
              }
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
      sosHubService.stopConnection();
    };
  }, []);

  // Synchronize GPS marker when coordinates, heading, or navigation state changes
  useEffect(() => {
    if (mapInstanceRef.current && gpsMarkerRef.current) {
      gpsMarkerRef.current.setLatLng([currentCoord.lat, currentCoord.lng]);

      const newIcon = L.divIcon({
        className: "custom-gps-dot",
        html: isNavigating
          ? `
            <div class="relative flex items-center justify-center w-8 h-8" style="transform: rotate(${heading}deg); transition: transform 0.25s ease-out-in;">
              <div class="absolute w-8 h-8 bg-emerald-500/30 rounded-full animate-ping" style="animation-duration: 2.5s;"></div>
              <svg class="w-6 h-6 text-emerald-500 drop-shadow-[0_2px_5px_rgba(16,185,129,0.5)]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
              </svg>
            </div>
          `
          : `
            <div class="relative flex items-center justify-center w-6 h-6">
              <div class="absolute w-6 h-6 bg-emerald-500/35 rounded-full animate-ping" style="animation-duration: 2s;"></div>
              <div class="relative w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            </div>
          `,
        iconSize: isNavigating ? [32, 32] : [24, 24],
        iconAnchor: isNavigating ? [16, 16] : [12, 12],
      });
      gpsMarkerRef.current.setIcon(newIcon);
    }
  }, [currentCoord, isNavigating, heading]);

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
      const group = L.featureGroup();

      routes.forEach((route, idx) => {
        const isSelected = idx === selectedRouteIndex;
        const latLngs = route.geometry.coordinates.map(
          ([lng, lat]) => [lat, lng] as [number, number],
        );

        if (isSelected) {
          // Map dynamic backend reports to hazards list for segment styling
          const hazards = (incidentReports || []).map((incident) => {
            let color = "#64748b"; // default other
            if (incident.category === "crime") color = "#ef4444";
            else if (incident.category === "accident") color = "#f43f5e";
            else if (incident.category === "hazard") color = "#f59e0b";
            else if (incident.category === "natural_disaster")
              color = "#f97316";

            return {
              lat: incident.location.latitude,
              lng: incident.location.longitude,
              color,
              name: incident.title,
            };
          });

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
        } else {
          // Draw unselected route in "hijau keputihan" (light pale/whitish green)
          L.polyline(latLngs, {
            color: "#a7f3d0", // Whitish green
            weight: 6,
            opacity: 0.6,
            lineJoin: "round",
          }).addTo(group);
        }
      });

      group.addTo(map);
      polylineRef.current = group;

      // Fit bounds to active route
      const activeRoute = routes[selectedRouteIndex] || routes[0];
      const activeLatLngs = activeRoute.geometry.coordinates.map(
        ([lng, lat]) => [lat, lng] as [number, number],
      );
      const bounds = L.latLngBounds(activeLatLngs);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routeParams, routes, incidentReports, selectedRouteIndex]);

  // Check if user is off-route and auto-recalculate
  useEffect(() => {
    if (!isNavigating || !routeParams || !routes || routes.length === 0) return;

    const activeRoute = routes[selectedRouteIndex] || routes[0];
    const coords = activeRoute.geometry.coordinates; // [[lng, lat], ...]
    if (coords.length === 0) return;

    // Find the minimum distance (in degrees) to any coordinate along the route
    let minDistance = 999999;
    for (let i = 0; i < coords.length; i++) {
      const [lng, lat] = coords[i];
      const dist = Math.sqrt(
        Math.pow(currentCoord.lat - lat, 2) +
          Math.pow(currentCoord.lng - lng, 2),
      );
      if (dist < minDistance) {
        minDistance = dist;
      }
    }

    // 0.0008 degrees is approximately 90 meters
    if (minDistance > 0.0008) {
      console.warn("User is off-route. Auto-recalculating safety route...");
      setRouteParams({
        startLat: currentCoord.lat,
        startLng: currentCoord.lng,
        endLat: routeParams.endLat,
        endLng: routeParams.endLng,
      });
    }
  }, [currentCoord, isNavigating, routeParams, routes, selectedRouteIndex]);

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

  // Helper to calculate remaining route distance in km along the polyline path
  const calculateRemainingRouteDistance = (
    userLat: number,
    userLng: number,
    coords: [number, number][],
  ) => {
    if (coords.length === 0) return 0;

    let minDistance = 999999;
    let closestIdx = 0;
    for (let i = 0; i < coords.length; i++) {
      const [lng, lat] = coords[i];
      const dist = Math.sqrt(
        Math.pow(userLat - lat, 2) + Math.pow(userLng - lng, 2),
      );
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = i;
      }
    }

    const distBetween = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number,
    ) => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    let totalKm = distBetween(
      userLat,
      userLng,
      coords[closestIdx][1],
      coords[closestIdx][0],
    );

    for (let i = closestIdx; i < coords.length - 1; i++) {
      totalKm += distBetween(
        coords[i][1],
        coords[i][0],
        coords[i + 1][1],
        coords[i + 1][0],
      );
    }

    return totalKm;
  };

  const activeRoute =
    routes && routes[selectedRouteIndex] ? routes[selectedRouteIndex] : null;
  let displayDistance = activeRoute ? activeRoute.distanceKm : 0;
  let displayDuration = activeRoute ? activeRoute.durationMinutes : 0;

  if (activeRoute && routeParams) {
    const remainingKm = calculateRemainingRouteDistance(
      currentCoord.lat,
      currentCoord.lng,
      activeRoute.geometry.coordinates,
    );
    displayDistance = parseFloat(
      Math.min(remainingKm, activeRoute.distanceKm).toFixed(1),
    );
    const speedRatio = activeRoute.durationMinutes / activeRoute.distanceKm;
    displayDuration = Math.max(1, Math.ceil(displayDistance * speedRatio));
  }

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
            unreadNotifications={votableIncidents.length}
            onNotificationClick={() => setShowNotificationModal(true)}
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
            onClick={handleSosClick}
            className={`relative w-12 h-12 ${
              isSosActive
                ? "bg-red-500 animate-pulse"
                : "bg-red-600 hover:bg-red-700"
            } text-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all shrink-0 group mb-1.5`}
            title={
              isSosActive ? "Matikan Bantuan SOS" : "Panggil Darurat (SOS)"
            }
          >
            <div
              className={`absolute inset-0 rounded-full ${
                isSosActive ? "bg-red-500/60" : "bg-red-500/40"
              } animate-ping`}
              style={{ animationDuration: isSosActive ? "1.2s" : "1.8s" }}
            />
            {isSosActive ? (
              <div className="w-3.5 h-3.5 bg-white rounded-sm relative z-10 animate-pulse" />
            ) : (
              <span className="text-xl relative z-10 select-none">🚨</span>
            )}
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
          selectedRouteIndex={selectedRouteIndex}
          onSelectRouteIndex={setSelectedRouteIndex}
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
                  Menuju Lokasi
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-emerald-600 block">
                {displayDuration} Menit • {displayDistance} Km
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
              Selesai
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
      {zoomedImage &&
        createPortal(
          <div
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[10000] flex flex-col justify-center items-center p-4 pointer-events-auto"
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
          </div>,
          document.body,
        )}

      {/* SOS Activation Alert Modal */}
      {showSosActivationPopup && (
        <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm z-[2000] flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-4 pointer-events-auto animate-fade-in-up">
            <div className="p-3 bg-red-50 rounded-full text-red-500">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h4 className="font-black text-red-650 text-xs tracking-wide">
              Peringatan
            </h4>
            <p className="text-[10px] font-bold text-slate-500 leading-relaxed max-w-[240px]">
              Kami dan pihak berwajib akan memantau anda melalui lokasi dari
              perangkat anda secara realtime, selama mode bantuan terus aktif.
              Demi kenyamanan dan keamanan anda saat berkendara.
            </p>
            <button
              type="button"
              onClick={() => setShowSosActivationPopup(false)}
              className="w-full bg-[#0f4c5c] hover:bg-[#0c3e4c] text-white font-extrabold py-3 rounded-2xl active:scale-95 transition-all text-[11px] shadow-md mt-2"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* SOS Deactivation Password Modal */}
      {showSosDeactivationPopup && (
        <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm z-[2000] flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-4 pointer-events-auto animate-fade-in-up">
            <div className="p-3 bg-red-50 rounded-full text-red-500">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h4 className="font-black text-red-650 text-xs tracking-wide">
              Peringatan
            </h4>
            <p className="text-[10px] font-bold text-slate-500 leading-relaxed max-w-[255px]">
              Masukkan kata sandi anda untuk mematikan mode bantuan ini, dan
              data berkendara anda selama mode bantuan aktif akan terhapus
              otomatis oleh sistem ketika anda mematikan mode ini.
            </p>

            {/* Password Input field */}
            <div className="w-full relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <input
                type={showSosPassword ? "text" : "password"}
                placeholder="Kata Sandi"
                value={sosPassword}
                onChange={(e) => setSosPassword(e.target.value)}
                className="w-full pl-9 pr-9 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-slate-350 focus:bg-white animate-none"
              />
              <button
                type="button"
                onClick={() => setShowSosPassword(!showSosPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650"
              >
                {showSosPassword ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {sosError && (
              <p className="text-[9px] text-red-600 font-extrabold bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100 w-full text-center animate-none">
                {sosError}
              </p>
            )}

            <button
              type="button"
              disabled={isVerifyingPassword || !sosPassword}
              onClick={handleVerifySosPassword}
              className="w-full bg-[#0f4c5c] hover:bg-[#0c3e4c] disabled:opacity-50 text-white font-extrabold py-3 rounded-2xl active:scale-95 transition-all text-[11px] shadow-md mt-2 flex justify-center items-center gap-1.5"
            >
              {isVerifyingPassword ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>Matikan</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Notification Modal for Incident Voting */}
      {showNotificationModal &&
        createPortal(
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowNotificationModal(false)}
          >
            <div
              className="w-full max-w-md bg-white rounded-[32px] border border-slate-100 shadow-2xl overflow-hidden p-6 relative flex flex-col max-h-[85vh] animate-fade-in-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowNotificationModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-750 transition-colors font-extrabold text-lg p-1"
              >
                ✕
              </button>

              {/* Header */}
              <div className="mb-4">
                <h3 className="text-base font-black text-slate-800 tracking-tight">
                  Pemberitahuan Keamanan
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">
                  Bantu warga menilai kebenaran laporan kejadian di sekitar
                  Anda.
                </p>
              </div>

              {/* Incidents List Container */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {votableIncidents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-300">
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-xs font-bold text-slate-650">
                      Tidak ada laporan baru
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                      Semua laporan di sekitar Anda telah selesai dinilai atau
                      tidak ada kejadian baru.
                    </p>
                  </div>
                ) : (
                  votableIncidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 space-y-3.5 relative overflow-hidden shadow-sm hover:shadow transition-all"
                    >
                      {/* Badge Category */}
                      <div className="flex items-center justify-between">
                        <span className="bg-rose-50 text-rose-650 border border-rose-100/60 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider">
                          {incident.category}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold">
                          {new Date(incident.createdAt).toLocaleDateString(
                            "id-ID",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>

                      {/* Incident Image */}
                      {incident.imageUrl && (
                        <div
                          className="w-full h-32 rounded-xl overflow-hidden bg-slate-100 relative cursor-zoom-in"
                          onClick={() => setZoomedImage(incident.imageUrl)}
                        >
                          <img
                            src={incident.imageUrl}
                            alt={incident.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}

                      {/* Description & Location */}
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-extrabold text-slate-800 leading-tight">
                          {incident.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                          {incident.description}
                        </p>
                        {incident.location?.address && (
                          <p className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                            📍 {incident.location.address}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons: Fakta / Hoax */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleVote(incident.id, 0)} // Fakta
                          className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-extrabold text-[10px] py-2 px-3 rounded-xl transition-all shadow-sm focus:outline-none"
                        >
                          👍 Fakta
                        </button>
                        <button
                          onClick={() => handleVote(incident.id, 1)} // Hoax
                          className="flex items-center justify-center gap-1.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-extrabold text-[10px] py-2 px-3 rounded-xl transition-all shadow-sm focus:outline-none"
                        >
                          👎 Hoax
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Floating Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
