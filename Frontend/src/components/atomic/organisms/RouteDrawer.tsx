import {
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  Compass,
  X,
} from "lucide-react";
import { Button } from "../atoms/Button";

interface Route {
  name: string;
  distanceKm: number;
  durationMinutes: number;
  hazardCount: number;
  aiRecommendation: string;
  safetyLevel?: "safe" | "warning" | "danger";
}

interface RouteDrawerProps {
  routes?: Route[];
  selectedRouteIndex: number;
  onSelectRouteIndex: (idx: number) => void;
  onClear: () => void;
  onNavigateStart?: () => void;
}

export function RouteDrawer({
  routes,
  selectedRouteIndex,
  onSelectRouteIndex,
  onClear,
  onNavigateStart,
}: RouteDrawerProps) {
  if (!routes || routes.length === 0) return null;

  const activeRoute = routes[selectedRouteIndex] || routes[0];

  const safetyMeta = {
    safe: {
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      label: "Jalur Aman",
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
    },
    warning: {
      color: "text-amber-600 bg-amber-50 border-amber-100",
      label: "Jalur Alternatif",
      icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    },
    danger: {
      color: "text-red-650 bg-red-50 border-red-100",
      label: "Jalur Rawan / Bahaya",
      icon: <AlertCircle className="w-4 h-4 text-red-650" />,
    },
  };

  const currentSafety = activeRoute.safetyLevel || "safe";
  const meta = safetyMeta[currentSafety] || safetyMeta.safe;

  return (
    <div className="absolute bottom-4 left-4 right-4 z-1000 bg-white/95 backdrop-blur-md border border-slate-100 p-5 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black border ${meta.color} tracking-wider`}
          >
            {meta.icon}
            <span>{meta.label}</span>
          </span>
          <h4 className="font-black text-slate-800 text-sm mt-1.5 leading-tight">
            {activeRoute.name}
          </h4>
        </div>
        <button
          onClick={onClear}
          className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 w-7 h-7 rounded-full flex items-center justify-center transition-colors shadow-sm"
          title="Tutup Navigasi"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Selectable Route Cards/Tabs */}
      <div className="flex gap-2">
        {routes.map((route, idx) => {
          const isSelected = idx === selectedRouteIndex;
          const safety = route.safetyLevel || "safe";
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectRouteIndex(idx)}
              className={`flex-1 p-3.5 rounded-2xl border text-left transition-all ${
                isSelected
                  ? "bg-slate-900 border-slate-900 text-white shadow-md scale-[1.01]"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100/80 text-slate-700"
              }`}
            >
              <div className="flex justify-between items-center">
                <span
                  className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${
                    isSelected
                      ? "bg-white/10 text-white"
                      : safety === "safe"
                        ? "bg-emerald-100/70 text-emerald-800"
                        : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {route.name}
                </span>
                <span className="text-[10px] font-bold">
                  {route.durationMinutes} Min
                </span>
              </div>
              <div className="mt-2.5 flex justify-between items-baseline">
                <span
                  className={`text-xs font-black ${isSelected ? "text-white" : "text-slate-800"}`}
                >
                  {route.distanceKm} Km
                </span>
                <span
                  className={`text-[9px] font-extrabold ${
                    isSelected
                      ? "text-slate-300"
                      : route.hazardCount > 0
                        ? "text-red-500"
                        : "text-emerald-600"
                  }`}
                >
                  {route.hazardCount > 0
                    ? `${route.hazardCount} Aduan`
                    : "Aman"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Stats Grid for Selected Route */}
      <div className="grid grid-cols-3 gap-2.5 py-2 px-3 bg-slate-50 border border-slate-100/50 rounded-2xl text-center">
        <div>
          <span className="text-[9px] text-slate-400 block font-bold">
            Jarak Tempuh
          </span>
          <span className="text-xs font-black text-slate-800">
            {activeRoute.distanceKm} Km
          </span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 block font-bold">
            Estimasi Waktu
          </span>
          <span className="text-xs font-black text-slate-800">
            {activeRoute.durationMinutes} Menit
          </span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 block font-bold">
            Titik Kerawanan
          </span>
          <span
            className={`text-xs font-black ${activeRoute.hazardCount > 0 ? "text-red-650" : "text-emerald-500"}`}
          >
            {activeRoute.hazardCount} Aduan
          </span>
        </div>
      </div>

      {/* Action Button */}
      <Button
        variant={currentSafety === "danger" ? "danger" : "primary"}
        className="w-full text-xs font-black py-2.5 rounded-2xl flex items-center justify-center gap-1.5"
        onClick={
          onNavigateStart || (() => alert("Navigasi GPS Madiun dimulai!"))
        }
      >
        <span>Mulai</span>
      </Button>
    </div>
  );
}
