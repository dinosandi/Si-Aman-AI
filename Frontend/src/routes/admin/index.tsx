import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  AlertTriangle,
  Activity,
  ShieldAlert,
  TrendingUp,
  Map,
  Maximize2,
  Minimize2,
  Phone,
  PhoneOutgoing,
  Home,
  MapPin,
} from "lucide-react";
import {
  useReports,
  useVerifyReport,
  useRejectReport,
  useResolveReport,
  useDeleteReport,
} from "../../use-cases/hooks/useReports";
import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Toast } from "../../components/atomic/atoms/Toast";
import type { Report } from "../../domain/entities/report";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { sosHubService } from "../../infrastructure/services/sosHubService";
import { useQuery } from "@tanstack/react-query";
import { httpClient } from "../../infrastructure/api/httpClient";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardHome,
});

interface ActiveSosUser {
  userId: string;
  alertId?: string;
  name: string;
  latitude: number;
  longitude: number;
  updatedAt: number;
  address?: string;
  phoneNumber?: string;
  emergencyPhoneNumber?: string;
}

function AdminDashboardHome() {
  const { data: reports } = useReports();
  const [activeSosUsers, setActiveSosUsers] = useState<
    Record<string, ActiveSosUser>
  >({});

  const { data: initialActiveSos, refetch: refetchActiveSos } = useQuery({
    queryKey: ["active-sos-alerts"],
    queryFn: async () => {
      const response = await httpClient.get<any, any>("/emergency/active");
      if (response && response.success && response.data) {
        return response.data;
      }
      return [];
    },
    staleTime: 5000,
  });

  useEffect(() => {
    if (initialActiveSos) {
      const next: Record<string, ActiveSosUser> = {};
      initialActiveSos.forEach((alert: any) => {
        const userId = alert.userId || alert.UserId || "anonymous";
        const name =
          alert.userName || alert.name || alert.reporterName || "Warga Si-Aman";
        const lat = alert.latitude || alert.lat;
        const lng = alert.longitude || alert.lng || alert.lon;
        const alertId = alert.alertId || alert.AlertId;

        if (lat && lng) {
          next[userId] = {
            userId,
            alertId,
            name,
            latitude: lat,
            longitude: lng,
            updatedAt: Date.now(),
            address: alert.address || alert.Address || "-",
            phoneNumber: alert.phoneNumber || alert.PhoneNumber || "-",
            emergencyPhoneNumber: alert.emergencyPhoneNumber || alert.EmergencyPhoneNumber || "-",
          };
        }
      });
      setActiveSosUsers(next);
    }
  }, [initialActiveSos]);

  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Report | null>(null);
  const [selectedSosUser, setSelectedSosUser] = useState<ActiveSosUser | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const verifyMutation = useVerifyReport();
  const rejectMutation = useRejectReport();
  const resolveMutation = useResolveReport();
  const deleteMutation = useDeleteReport();

  const handleVerify = async (id: string) => {
    try {
      await verifyMutation.mutateAsync(id);
      setToast({ message: "Laporan berhasil diverifikasi.", type: "success" });
      setSelectedIncident(null);
    } catch (err: any) {
      setToast({
        message: err.message || "Gagal memverifikasi laporan.",
        type: "error",
      });
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveMutation.mutateAsync(id);
      setToast({ message: "Laporan berhasil diselesaikan.", type: "success" });
      setSelectedIncident(null);
    } catch (err: any) {
      setToast({
        message: err.message || "Gagal menyelesaikan kejadian.",
        type: "error",
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectMutation.mutateAsync(id);
      setToast({ message: "Laporan berhasil ditolak.", type: "success" });
      setSelectedIncident(null);
    } catch (err: any) {
      setToast({
        message: err.message || "Gagal menolak laporan.",
        type: "error",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        "Apakah Anda yakin ingin menghapus laporan ini secara permanen dari basis data?",
      )
    ) {
      try {
        await deleteMutation.mutateAsync(id);
        setToast({ message: "Laporan berhasil dihapus.", type: "success" });
        setSelectedIncident(null);
      } catch (err: any) {
        setToast({
          message: err.message || "Gagal menghapus laporan.",
          type: "error",
        });
      }
    }
  };

  const totalReportsCount = reports?.length || 0;
  const verifiedCount =
    reports?.filter((r) => r.status === "verified").length || 0;
  const pendingCount =
    reports?.filter((r) => r.status === "pending").length || 0;
  const activeSosCount = Object.keys(activeSosUsers).length;

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const reportMarkersRef = useRef<L.Marker[]>([]);
  const sosMarkersRef = useRef<Record<string, L.Marker>>({});

  // 1. SOS WebSocket Connection & Event Handlers
  useEffect(() => {
    sosHubService.startConnection().catch((err) => {
      console.error("Gagal koneksi ke SOS Hub di Admin:", err);
    });

    const unsubscribe = sosHubService.onSosReceived(({ method, data }) => {
      console.log(`Admin menerima event ${method}:`, data);

      if (method === "SosResolved") {
        const targetAlertId = data.alertId || data.AlertId;
        if (targetAlertId) {
          setActiveSosUsers((prev) => {
            const next = { ...prev };
            let changed = false;
            for (const [key, val] of Object.entries(next)) {
              if (val.alertId === targetAlertId) {
                delete next[key];
                changed = true;
              }
            }
            return changed ? next : prev;
          });
        }
        refetchActiveSos();
        return;
      }

      const userId = data.userId || data.UserId || "anonymous";
      const name =
        data.userName || data.name || data.reporterName || "Warga Si-Aman";
      const lat = data.latitude || data.lat;
      const lng = data.longitude || data.lng || data.lon;
      const alertId = data.alertId || data.AlertId;

      if (lat && lng) {
        setActiveSosUsers((prev) => ({
          ...prev,
          [userId]: {
            userId,
            alertId,
            name,
            latitude: lat,
            longitude: lng,
            updatedAt: Date.now(),
            address: data.address || data.Address || prev[userId]?.address || "-",
            phoneNumber: data.phoneNumber || data.PhoneNumber || prev[userId]?.phoneNumber || "-",
            emergencyPhoneNumber: data.emergencyPhoneNumber || data.EmergencyPhoneNumber || prev[userId]?.emergencyPhoneNumber || "-",
          },
        }));
      }
      refetchActiveSos();
    });

    // Cleanup stale SOS users after 2 minutes
    const interval = setInterval(() => {
      setActiveSosUsers((prev) => {
        const now = Date.now();
        const next = { ...prev };
        let changed = false;
        for (const [key, val] of Object.entries(next)) {
          if (now - val.updatedAt > 120000) {
            delete next[key];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
      sosHubService.stopConnection().catch(() => {});
    };
  }, [refetchActiveSos]);

  // 1b. Invalidate map size on fullscreen toggle
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 100);
    }
  }, [isMapFullscreen]);

  const handleToggleFullscreen = () => {
    const mapElement = mapRef.current?.parentElement;
    if (!mapElement) return;

    if (!document.fullscreenElement) {
      mapElement
        .requestFullscreen()
        .then(() => {
          setIsMapFullscreen(true);
        })
        .catch((err) => {
          console.error("Gagal masuk mode layar penuh:", err);
        });
    } else {
      document
        .exitFullscreen()
        .then(() => {
          setIsMapFullscreen(false);
        })
        .catch((err) => {
          console.error("Gagal keluar mode layar penuh:", err);
        });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsMapFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
    }).setView([-7.6167, 111.65], 13); // Mejayan center

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 3. Render Incident markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean up old report markers
    reportMarkersRef.current.forEach((marker) => map.removeLayer(marker));
    reportMarkersRef.current = [];

    if (!reports) return;

    const getCategoryConfig = (category: string, status: string) => {
      let colorClass = "bg-teal-500";
      let borderClass = "border-teal-200 font-bold";
      let emoji = "🚨";
      let label = "Kerawanan";

      if (status === "pending") {
        colorClass = "bg-amber-500";
        borderClass = "border-amber-250 animate-pulse";
      } else if (status === "resolved") {
        colorClass = "bg-slate-500";
        borderClass = "border-slate-300";
      } else if (status === "rejected") {
        colorClass = "bg-slate-300";
        borderClass = "border-slate-200";
      }

      switch (category) {
        case "accident":
          emoji = "💥";
          label = "Kecelakaan";
          break;
        case "crime":
          emoji = "🚨";
          label = "Kriminalitas";
          break;
        case "hazard":
          emoji = "⚠️";
          label = "Bahaya Jalan";
          break;
        case "natural_disaster":
          emoji = "🌋";
          label = "Bencana Alam";
          break;
        case "road_block":
          emoji = "🚧";
          label = "Jalan Ditutup";
          break;
      }

      return { emoji, label, colorClass, borderClass };
    };

    reports.forEach((incident) => {
      const config = getCategoryConfig(incident.category, incident.status);
      const icon = L.divIcon({
        className: "custom-activity-marker",
        html: `
          <div class="flex flex-col items-center select-none cursor-pointer">
            <div class="bg-white/95 backdrop-blur-sm border ${config.borderClass} px-2.5 py-1.5 rounded-2xl shadow-lg flex items-center gap-2 relative">
              <div class="w-6 h-6 rounded-full ${config.colorClass} flex items-center justify-center text-white text-[10px] font-black shrink-0">${config.emoji}</div>
              <div class="flex flex-col">
                <span class="${config.colorClass} text-white text-[7px] font-black px-1.5 py-0.5 rounded-full w-max leading-none mb-0.5">${config.label} (${incident.status === "pending" ? "Pending" : "Verified"})</span>
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

      reportMarkersRef.current.push(marker);
    });
  }, [reports]);

  // 4. Render SOS markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove SOS markers that are no longer active
    for (const [userId, marker] of Object.entries(sosMarkersRef.current)) {
      if (!activeSosUsers[userId]) {
        map.removeLayer(marker);
        delete sosMarkersRef.current[userId];
      }
    }

    const sosIcon = L.divIcon({
      className: "custom-sos-marker",
      html: `
        <div class="relative flex items-center justify-center w-12 h-12 select-none cursor-pointer">
          <div class="absolute w-12 h-12 bg-red-500/35 rounded-full animate-ping" style="animation-duration: 1.5s;"></div>
          <div class="absolute w-8 h-8 bg-red-500/50 rounded-full animate-pulse"></div>
          <div class="relative w-5 h-5 bg-red-600 border-2 border-white rounded-full flex items-center justify-center shadow-lg text-[9px] font-bold text-white">SOS</div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    // Add or update active SOS markers
    for (const user of Object.values(activeSosUsers)) {
      const position = [user.latitude, user.longitude] as [number, number];

      if (sosMarkersRef.current[user.userId]) {
        // Update existing marker position
        sosMarkersRef.current[user.userId].setLatLng(position);
        setSelectedSosUser((curr) => {
          if (curr && curr.userId === user.userId) {
            return user;
          }
          return curr;
        });
      } else {
        // Create new marker
        const marker = L.marker(position, { icon: sosIcon }).addTo(map);
        marker.on("click", () => {
          setSelectedSosUser(user);
        });

        sosMarkersRef.current[user.userId] = marker;

        // Auto center map on first SOS trigger
        map.setView(position, 15);
      }
    }
  }, [activeSosUsers]);

  return (
    <div className="space-y-6">
      {/* Top Banner Message */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">
            Selamat Datang di Pemetaan Keamanan Madiun
          </h3>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/reports"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Tinjau Laporan Warga
          </Link>
        </div>
      </div>

      {/* Analytics Counter Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-bold">
              Total Aduan Masuk
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">
              {totalReportsCount}
            </span>
            <span className="text-[10px] text-teal-600 font-bold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +15% dari minggu lalu
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-bold">
              Telah Terverifikasi
            </span>
            <ShieldCheck className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">
              {verifiedCount}
            </span>
            <span className="text-[10px] text-slate-400 font-bold block mt-1">
              Dipublikasikan pada rute warga
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-bold">
              Menunggu Verifikasi
            </span>
            <Activity className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">
              {pendingCount}
            </span>
            <span className="text-[10px] text-amber-600 font-bold block mt-1">
              Butuh tindakan segera
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-bold">
              SOS Aktif Saat Ini
            </span>
            <ShieldAlert
              className={`w-5 h-5 ${activeSosCount > 0 ? "text-red-600 animate-bounce" : "text-slate-400"}`}
            />
          </div>
          <div>
            <span
              className={`text-3xl font-black ${activeSosCount > 0 ? "text-red-600 animate-pulse" : "text-slate-700"}`}
            >
              {activeSosCount}
            </span>
            <span
              className={`text-[10px] font-bold block mt-1 ${activeSosCount > 0 ? "text-red-500" : "text-emerald-600"}`}
            >
              {activeSosCount > 0
                ? "⚠️ Ada Panggilan Darurat!"
                : "Kondisi kondusif"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Panel Content (Grid Split) */}
      <div className="grid lg:grid-cols-3 gap-6 items-stretch">
        {/* Left 2 Columns: Map View & Vulnerability zones */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
              Visualisasi GIS & Titik Kerawanan
            </h4>
          </div>

          {/* Interactive GIS Leaflet Map */}
          <div
            className={`relative rounded-xl border border-slate-200 overflow-hidden shadow-inner z-0 ${
              isMapFullscreen
                ? "w-full h-full bg-slate-900"
                : "flex-1 min-h-[500px] h-full lg:min-h-0"
            }`}
          >
            <div ref={mapRef} className="w-full h-full" />

            {/* Floating Fullscreen Toggle Button */}
            <button
              onClick={handleToggleFullscreen}
              title={isMapFullscreen ? "Tutup Layar Penuh" : "Layar Penuh"}
              className="absolute top-4 right-4 z-[1000] p-2.5 bg-white hover:bg-slate-50 border border-slate-250 text-slate-700 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
            >
              {isMapFullscreen ? (
                <Minimize2 className="w-4.5 h-4.5" />
              ) : (
                <Maximize2 className="w-4.5 h-4.5" />
              )}
            </button>
          </div>
        </div>

        {/* Right 1 Column: District Index Ratings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          {/* Type Analytics Section */}
          <div className="space-y-4">
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Analitik Jenis Kerawanan
              </h4>
              <p className="text-[10px] text-slate-400">
                Statistik penyebaran jenis bahaya dari aduan masuk.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] text-rose-700 font-bold">
                  Kecelakaan
                </span>
                <span className="text-xl font-black text-rose-800 mt-1">
                  {reports?.filter((r) => r.category === "accident").length ||
                    0}
                </span>
              </div>

              <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] text-red-700 font-bold">
                  Kriminalitas
                </span>
                <span className="text-xl font-black text-red-800 mt-1">
                  {reports?.filter((r) => r.category === "crime").length || 0}
                </span>
              </div>

              <div className="p-3 bg-orange-50 border border-orange-100 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] text-orange-700 font-bold">
                  Bencana Alam
                </span>
                <span className="text-xl font-black text-orange-800 mt-1">
                  {reports?.filter((r) => r.category === "natural_disaster")
                    .length || 0}
                </span>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] text-amber-700 font-bold">
                  Jalan Rusak
                </span>
                <span className="text-xl font-black text-amber-850 mt-1">
                  {reports?.filter(
                    (r) =>
                      r.category === "hazard" || r.category === "road_block",
                  ).length || 0}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between col-span-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-600 font-bold">
                    Lainnya / Other
                  </span>
                  <span className="text-lg font-black text-slate-700">
                    {reports?.filter((r) => r.category === "other").length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Incident Modal */}
      {selectedIncident &&
        createPortal(
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setSelectedIncident(null)}
          >
            <div
              className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-fade-in-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                <div>
                  <span className="text-[10px] bg-teal-50 border border-teal-200 text-teal-700 px-2.5 py-1 rounded-full font-black uppercase tracking-wide">
                    {selectedIncident.category === "accident"
                      ? "💥 Kecelakaan"
                      : selectedIncident.category === "crime"
                        ? "🚨 Kriminalitas"
                        : selectedIncident.category === "hazard"
                          ? "⚠️ Bahaya Jalan"
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
                    className="w-full h-48 rounded-2xl overflow-hidden bg-slate-50 border border-slate-150 flex items-center justify-center cursor-zoom-in group relative"
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
                    Deskripsi Laporan
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    {selectedIncident.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                      Lokasi Wilayah
                    </span>
                    <span className="text-xs text-slate-700 font-bold block">
                      Kec. {selectedIncident.location.district || "Madiun"}
                    </span>
                  </div>

                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                      Status Laporan
                    </span>
                    <span className="text-xs text-slate-700 font-bold block capitalize">
                      {selectedIncident.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                    Koordinat GPS
                  </span>
                  <span className="text-xs text-slate-700 font-bold block font-mono">
                    {selectedIncident.location.latitude.toFixed(6)},{" "}
                    {selectedIncident.location.longitude.toFixed(6)}
                  </span>
                </div>

                {selectedIncident.reporterName && (
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                      Pelapor
                    </span>
                    <span className="text-xs text-slate-700 font-bold block">
                      {selectedIncident.reporterName}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-100/50">
                  <span>Dilaporkan Pada:</span>
                  <span>
                    {new Date(selectedIncident.createdAt).toLocaleString(
                      "id-ID",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </span>
                </div>
              </div>

              {/* Modal Action Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center">
                <button
                  onClick={() => handleDelete(selectedIncident.id)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-250 text-rose-700 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Hapus
                </button>

                <div className="flex gap-2">
                  {selectedIncident.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleReject(selectedIncident.id)}
                        className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-250 text-amber-700 rounded-xl text-xs font-bold transition-all"
                      >
                        Tolak
                      </button>
                      <button
                        onClick={() => handleVerify(selectedIncident.id)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        Verifikasi
                      </button>
                    </>
                  )}
                  {selectedIncident.status === "verified" && (
                    <button
                      onClick={() => handleResolve(selectedIncident.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      Selesaikan
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedIncident(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-350 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Fullscreen Image Lightbox */}
      {zoomedImage &&
        createPortal(
          <div
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setZoomedImage(null)}
          >
            <div
              className="relative max-w-4xl max-h-[85vh] bg-white p-2 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={zoomedImage}
                alt="Zoomed Report"
                className="max-w-full max-h-[80vh] object-contain rounded-xl"
              />
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black text-white px-3 py-1.5 rounded-full font-bold transition-colors"
              >
                Tutup ✕
              </button>
            </div>
          </div>,
          document.body,
        )}

      {/* Detailed SOS Modal */}
      {selectedSosUser &&
        createPortal(
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setSelectedSosUser(null)}
          >
            <div
              className="w-full max-w-sm bg-slate-50 rounded-[32px] border border-slate-100 shadow-2xl overflow-hidden p-6 relative animate-fade-in-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedSosUser(null)}
                className="absolute top-4 right-4 text-slate-700 hover:text-slate-950 transition-colors font-extrabold text-xl p-1"
              >
                ✕
              </button>

              {/* Title */}
              <div className="text-center mt-2 mb-6">
                <h4 className="text-base font-black text-slate-800 tracking-tight">
                  Data diri pengguna darurat
                </h4>
              </div>

              {/* Body Details */}
              <div className="space-y-3.5 text-xs text-slate-850 px-2 font-medium">
                <div>
                  <span className="font-bold text-slate-900">Nama:</span>{" "}
                  {selectedSosUser.name}
                </div>
                <div>
                  <span className="font-bold text-slate-900">Alamat:</span>{" "}
                  {selectedSosUser.address || "-"}
                </div>
                <div>
                  <span className="font-bold text-slate-900">No Hp:</span>{" "}
                  {selectedSosUser.phoneNumber || "-"}
                </div>
                <div>
                  <span className="font-bold text-slate-900">No Darurat:</span>{" "}
                  {selectedSosUser.emergencyPhoneNumber || "-"}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-around items-center mt-8 pt-4 border-t border-slate-200/60">
                {/* No Pengguna */}
                <button
                  onClick={() => {
                    if (selectedSosUser.phoneNumber && selectedSosUser.phoneNumber !== "-") {
                      window.open(`tel:${selectedSosUser.phoneNumber}`);
                    } else {
                      setToast({ message: "No HP pengguna tidak tersedia.", type: "error" });
                    }
                  }}
                  className="flex flex-col items-center gap-1.5 group focus:outline-none"
                >
                  <div className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all">
                    <Phone className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-800 transition-colors">
                    No Pengguna
                  </span>
                </button>

                {/* No Darurat */}
                <button
                  onClick={() => {
                    if (selectedSosUser.emergencyPhoneNumber && selectedSosUser.emergencyPhoneNumber !== "-") {
                      window.open(`tel:${selectedSosUser.emergencyPhoneNumber}`);
                    } else {
                      setToast({ message: "No Kontak Darurat tidak tersedia.", type: "error" });
                    }
                  }}
                  className="flex flex-col items-center gap-1.5 group focus:outline-none"
                >
                  <div className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all">
                    <PhoneOutgoing className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-800 transition-colors">
                    No Darurat
                  </span>
                </button>

                {/* Alamat Rumah */}
                <button
                  onClick={() => {
                    if (selectedSosUser.address && selectedSosUser.address !== "-") {
                      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedSosUser.address)}`);
                    } else {
                      setToast({ message: "Alamat pengguna tidak tersedia.", type: "error" });
                    }
                  }}
                  className="flex flex-col items-center gap-1.5 group focus:outline-none"
                >
                  <div className="w-12 h-12 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all">
                    <Home className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-800 transition-colors">
                    Alamat Rumah
                  </span>
                </button>

                {/* Lokasi Terakhir */}
                <button
                  onClick={() => {
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.setView([selectedSosUser.latitude, selectedSosUser.longitude], 17);
                      setSelectedSosUser(null);
                    }
                  }}
                  className="flex flex-col items-center gap-1.5 group focus:outline-none"
                >
                  <div className="w-12 h-12 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-800 transition-colors">
                    Lokasi Terakhir
                  </span>
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
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
