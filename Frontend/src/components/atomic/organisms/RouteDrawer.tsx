import { AlertCircle, AlertTriangle, ShieldCheck, Compass, X } from "lucide-react";
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
  onClear: () => void;
  onNavigateStart?: () => void;
}

export function RouteDrawer({
  routes,
  onClear,
  onNavigateStart,
}: RouteDrawerProps) {
  if (!routes || routes.length === 0) return null;
  const primaryRoute = routes[0];

  const safetyMeta = {
    safe: {
      color: "text-emerald-500 bg-emerald-50 border-emerald-100",
      label: "Rute Aman Terkomputerisasi",
      icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
      aiBg: "bg-emerald-50/60 border-emerald-100/50 text-emerald-800",
      aiBadge: "text-emerald-700 bg-emerald-100/70",
    },
    warning: {
      color: "text-amber-500 bg-amber-50 border-amber-100",
      label: "Rute Siaga (Hambatan Ringan)",
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
      aiBg: "bg-amber-50/60 border-amber-100/50 text-amber-800",
      aiBadge: "text-amber-700 bg-amber-100/70",
    },
    danger: {
      color: "text-red-500 bg-red-50 border-red-100",
      label: "Rute Rawan Kejahatan/Hambatan",
      icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      aiBg: "bg-red-50/60 border-red-100/50 text-red-800",
      aiBadge: "text-red-700 bg-red-100/70",
    },
  };

  const currentSafety = primaryRoute.safetyLevel || "safe";
  const meta = safetyMeta[currentSafety];

  return (
    <div className="absolute bottom-4 left-4 right-4 z-1000 bg-white/95 backdrop-blur-md border border-slate-100 p-5 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black border ${meta.color} tracking-wider`}>
            {meta.icon}
            <span>{meta.label}</span>
          </span>
          <h4 className="font-black text-slate-800 text-sm mt-1.5 leading-tight">
            {primaryRoute.name}
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

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5 py-2 px-3 bg-slate-50 border border-slate-100/50 rounded-2xl text-center">
        <div>
          <span className="text-[9px] text-slate-400 block font-bold">
            Jarak Tempuh
          </span>
          <span className="text-xs font-black text-slate-800">
            {primaryRoute.distanceKm} Km
          </span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 block font-bold">
            Estimasi Waktu
          </span>
          <span className="text-xs font-black text-slate-800">
            {primaryRoute.durationMinutes} Menit
          </span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 block font-bold">
            Titik Kerawanan
          </span>
          <span className={`text-xs font-black ${primaryRoute.hazardCount > 0 ? "text-red-650" : "text-emerald-500"}`}>
            {primaryRoute.hazardCount} Aduan
          </span>
        </div>
      </div>

      {/* AI Recommendation Box */}
      <div className={`p-3 rounded-2xl border ${meta.aiBg} text-[11px] leading-relaxed font-bold`}>
        <span className={`inline-block font-black text-[9px] px-1.5 py-0.5 rounded-md mb-1.5 tracking-wider ${meta.aiBadge}`}>
          💡 ANALISIS AI
        </span>
        <p className="text-slate-700">{primaryRoute.aiRecommendation}</p>
      </div>

      {/* Action Button */}
      <Button
        variant={currentSafety === "danger" ? "danger" : "primary"}
        className="w-full text-xs font-black py-2.5 rounded-2xl flex items-center justify-center gap-1.5"
        onClick={onNavigateStart || (() => alert("Navigasi GPS Madiun dimulai!"))}
      >
        <Compass className="w-4 h-4" />
        <span>Mulai Navigasi Rute</span>
      </Button>
    </div>
  );
}
