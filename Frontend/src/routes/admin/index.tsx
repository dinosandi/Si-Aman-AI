import { createFileRoute, Link } from '@tanstack/react-router';
import { ShieldCheck, AlertTriangle, Activity, ShieldAlert, TrendingUp, Map } from 'lucide-react';
import { useReports } from '../../use-cases/hooks/useReports';

export const Route = createFileRoute('/admin/')({
  component: AdminDashboardHome,
});

function AdminDashboardHome() {
  const { data: reports } = useReports();

  const totalReportsCount = reports?.length || 18;
  const verifiedCount = reports?.filter(r => r.status === 'verified').length || 12;
  const pendingCount = reports?.filter(r => r.status === 'pending').length || 4;

  // Mock safety indices for Madiun districts
  const districtsSafety = [
    { name: 'Mejayan (Pusat Pemerintahan)', index: 92, level: 'safe', reports: 2 },
    { name: 'Saradan (Kawasan Hutan/Rawan Begal)', index: 68, level: 'warning', reports: 7 },
    { name: 'Dagangan (Lereng Wilis/Rawan Longsor)', index: 74, level: 'warning', reports: 4 },
    { name: 'Geger (Lintas Selatan)', index: 88, level: 'safe', reports: 1 },
    { name: 'Pilangkenceng', index: 81, level: 'safe', reports: 3 },
    { name: 'Kare (Pegunungan)', index: 70, level: 'warning', reports: 5 },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner Message */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">Selamat Datang di Pemetaan Keamanan Madiun</h3>
          <p className="text-xs text-slate-400 mt-1">Status sistem berjalan normal. Pemantauan AI di 15 kecamatan aktif.</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/reports"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition-all"
          >
            Tinjau Laporan Warga
          </Link>
        </div>
      </div>

      {/* Analytics Counter Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-semibold">Total Aduan Masuk</span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-3xl font-extrabold text-white">{totalReportsCount}</span>
            <span className="text-[10px] text-teal-400 font-bold block mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +15% dari minggu lalu
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-semibold">Telah Terverifikasi</span>
            <ShieldCheck className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <span className="text-3xl font-extrabold text-white">{verifiedCount}</span>
            <span className="text-[10px] text-slate-500 font-bold block mt-1">
              Dipublikasikan pada rute warga
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-semibold">Menunggu Verifikasi</span>
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <span className="text-3xl font-extrabold text-white">{pendingCount}</span>
            <span className="text-[10px] text-amber-400 font-bold block mt-1">
              Butuh tindakan segera
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-semibold">SOS Aktif Hari Ini</span>
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
          </div>
          <div>
            <span className="text-3xl font-extrabold text-red-500">0</span>
            <span className="text-[10px] text-emerald-400 font-bold block mt-1">
              Kondisi kondusif (Aman)
            </span>
          </div>
        </div>
      </div>

      {/* Main Panel Content (Grid Split) */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Map View & Vulnerability zones */}
        <div className="lg:col-span-2 bg-slate-955 p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-white text-sm">Visualisasi GIS & Titik Kerawanan</h4>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Map className="w-4 h-4 text-teal-400" />
              <span>GIS Layer: Heatmap Kriminalitas & Hambatan</span>
            </div>
          </div>

          {/* Interactive GIS mock */}
          <div className="h-80 bg-slate-900 rounded-xl relative border border-slate-800 overflow-hidden flex flex-col justify-center items-center">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] bg-[size:16px_16px]" />
            
            {/* Render Mock Vulnerability circles in Saradan / Dagangan */}
            <div className="absolute top-1/4 left-1/3 w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 animate-pulse flex items-center justify-center text-[10px] text-red-400 font-bold font-mono">
              Saradan
            </div>
            <div className="absolute bottom-1/3 right-1/4 w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 animate-pulse flex items-center justify-center text-[10px] text-amber-400 font-bold font-mono">
              Dagangan
            </div>
            <div className="absolute top-1/2 left-2/3 w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[8px] text-emerald-400 font-mono">
              Mejayan
            </div>

            <div className="z-10 bg-slate-950/80 border border-slate-800 p-3 rounded-lg text-center text-xs space-y-1">
              <p className="font-bold text-slate-200">GIS Engine: Leaflet/OSM Offline Cache Active</p>
              <p className="text-[10px] text-slate-500">Madiun Spatial Center • Mapbox Vector V8</p>
            </div>
          </div>
        </div>

        {/* Right 1 Column: District Index Ratings */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <h4 className="font-bold text-white text-sm">Indeks Keamanan Wilayah</h4>
            <p className="text-[10px] text-slate-400">Peringkat kecerdasan keamanan per-wilayah dihitung AI.</p>
          </div>

          <div className="space-y-3.5">
            {districtsSafety.map((dist, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">{dist.name}</span>
                  <span className={`font-bold ${
                    dist.level === 'safe' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {dist.index} / 100
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${dist.index}%` }}
                    className={`h-full rounded-full ${
                      dist.level === 'safe' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                </div>
                
                <div className="flex justify-between text-[9px] text-slate-500">
                  <span>{dist.reports} Laporan Tercatat</span>
                  <span>{dist.level === 'safe' ? 'Kondusif' : 'Perlu Patroli'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
