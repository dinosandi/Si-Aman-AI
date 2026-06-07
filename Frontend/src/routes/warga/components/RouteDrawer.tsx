interface Route {
  name: string;
  distanceKm: number;
  durationMinutes: number;
  hazardCount: number;
  aiRecommendation: string;
}

interface RouteDrawerProps {
  routes?: Route[];
  onClear: () => void;
}

export function RouteDrawer({ routes, onClear }: RouteDrawerProps) {
  if (!routes || routes.length === 0) return null;
  const primaryRoute = routes[0];

  return (
    <div className="absolute bottom-24 left-4 right-4 z-1000 bg-white border border-slate-200 p-4 rounded-2xl shadow-lg space-y-3 animate-fade-in-up">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[9px] uppercase font-extrabold text-[#114B5F] tracking-wider block">
            Rute Rekomendasi Teratas
          </span>
          <h4 className="font-extrabold text-slate-800 text-sm">
            {primaryRoute.name}
          </h4>
        </div>
        <button
          onClick={onClear}
          className="text-slate-400 hover:text-slate-600 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-lg border border-slate-200"
        >
          Clear
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 py-1.5 px-3 bg-slate-50 rounded-xl text-center border border-slate-100">
        <div>
          <span className="text-[9px] text-slate-400 block font-medium">
            Jarak
          </span>
          <span className="text-xs font-extrabold text-slate-800">
            {primaryRoute.distanceKm} Km
          </span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 block font-medium">
            Waktu
          </span>
          <span className="text-xs font-extrabold text-slate-800">
            {primaryRoute.durationMinutes} Min
          </span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 block font-medium">
            Laporan Aktif
          </span>
          <span className="text-xs font-extrabold text-red-600">
            {primaryRoute.hazardCount} Aduan
          </span>
        </div>
      </div>

      {/* AI Safety Recommendation */}
      <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-100 text-[11px] leading-relaxed text-[#114B5F] font-semibold">
        <span className="font-bold text-teal-800 block mb-0.5">
          💡 Rekomendasi AI:
        </span>
        {primaryRoute.aiRecommendation}
      </div>
    </div>
  );
}
