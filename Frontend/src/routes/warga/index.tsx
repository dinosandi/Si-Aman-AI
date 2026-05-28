import { createFileRoute } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { useState } from 'react';
import { useSafetyRoutes } from '../../use-cases/hooks/useSafetyRoutes';
import type { RouteRequestInput } from '../../domain/entities/route';
import { Navigation, MapPin, Compass, Award, AlertTriangle, ArrowRight } from 'lucide-react';

export const Route = createFileRoute('/warga/')({
  component: WargaDashboard,
});

const routeSearchSchema = z.object({
  startAddress: z.string().min(3, 'Lokasi awal minimal 3 karakter'),
  destinationAddress: z.string().min(3, 'Lokasi tujuan minimal 3 karakter'),
});

function WargaDashboard() {
  const [routeParams, setRouteParams] = useState<RouteRequestInput | null>(null);

  // TanStack Form setup with Zod validation
  const form = useForm({
    defaultValues: {
      startAddress: '',
      destinationAddress: '',
    },
    onSubmit: async () => {
      // Simulate Geocoding coordinate matching for Madiun coordinates
      // In a real application, we would call a geocoder service.
      const mockParams: RouteRequestInput = {
        startLat: -7.6167 + (Math.random() - 0.5) * 0.05,
        startLng: 111.6500 + (Math.random() - 0.5) * 0.05,
        endLat: -7.6250 + (Math.random() - 0.5) * 0.05,
        endLng: 111.6600 + (Math.random() - 0.5) * 0.05,
      };
      setRouteParams(mockParams);
    },
  });

  const { data: routes, isLoading, error } = useSafetyRoutes(routeParams);

  return (
    <div className="flex flex-col flex-1 p-4 space-y-4">
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
                  placeholder="Lokasi Tujuan (misal: Pusat Caruban)"
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
                disabled={!canSubmit || isSubmitting}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/10 hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Menganalisis Rute...' : 'Analisis Rute Aman'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </form.Subscribe>
        </form>
      </div>

      {/* Map Simulation Panel */}
      <div className="relative h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl overflow-hidden shadow-inner flex flex-col justify-center items-center text-slate-500 border border-slate-200 dark:border-slate-700">
        {/* Mock Map Canvas */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:20px_20px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-slate-100 dark:bg-slate-900" />
        
        {routeParams ? (
          <div className="z-10 text-center space-y-2 p-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-bold shadow-lg animate-pulse">
              <Compass className="w-3.5 h-3.5" />
              <span>Peta Aktif: Rute Madiun</span>
            </div>
            <div className="w-48 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 rounded-full mx-auto" />
            <p className="text-[11px] text-slate-400 font-medium">GPS: Lat {routeParams.startLat.toFixed(4)}, Lng {routeParams.startLng.toFixed(4)}</p>
          </div>
        ) : (
          <div className="z-10 text-center space-y-2">
            <div className="bg-slate-300 dark:bg-slate-700 p-3 rounded-full inline-block">
              <Navigation className="w-6 h-6 text-slate-500 dark:text-slate-400 rotate-45" />
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Masukkan Lokasi untuk Membuka Navigasi AI</p>
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
