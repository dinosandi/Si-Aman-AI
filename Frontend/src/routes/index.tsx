import { createFileRoute, Link } from '@tanstack/react-router';
import { Shield, Navigation, Database, Eye } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 bg-gradient-to-tr from-slate-900 via-slate-800 to-emerald-950 text-white selection:bg-emerald-500">
      {/* Background Graphic Accents */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.3)_0,transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-4xl z-10 text-center space-y-8 animate-fade-in-up">
        {/* Logo and Tagline */}
        <div className="flex flex-col items-center space-y-3">
          <div className="bg-emerald-500/20 p-4 rounded-3xl border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <Shield className="w-16 h-16 text-emerald-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-white bg-clip-text text-transparent">
            SI AMAN AI
          </h1>
          <p className="text-emerald-300 font-medium tracking-widest text-xs sm:text-sm uppercase">
            Kabupaten Madiun Safety Mapping System
          </p>
          <p className="text-slate-300 max-w-xl text-sm sm:text-base leading-relaxed">
            Platform berbasis AI untuk pemetaan kerawanan, rekomendasi rute teraman bagi warga, dan pusat koordinasi tindakan preventif kedaruratan.
          </p>
        </div>

        {/* Dual Layout Selection Panels */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* Card 1: Citizen Mobile Portal */}
          <div className="group relative bg-slate-900/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-emerald-500/5">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/20">
                  Mobile-First PWA
                </span>
                <Navigation className="w-8 h-8 text-emerald-400 group-hover:animate-bounce" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                Portal Warga
              </h2>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                Pemantauan rute teraman dengan navigasi AI, tombol darurat SOS instant, serta crowdsourcing laporan kerawanan wilayah secara real-time.
              </p>
              <ul className="text-xs text-slate-400 text-left space-y-2 mt-4 max-w-xs mx-auto">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Rute Aman Spasial AI
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Kirim Laporan Kejadian & Foto
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Tombol SOS & Lokasi GPS
                </li>
              </ul>
            </div>
            <div className="mt-8">
              <Link
                to="/warga"
                className="w-full inline-flex justify-center items-center py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30 transition-all group-hover:scale-[1.02]"
              >
                Masuk Portal Warga
              </Link>
            </div>
          </div>

          {/* Card 2: Admin Dashboard */}
          <div className="group relative bg-slate-900/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 hover:border-teal-500/50 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-teal-500/5">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="bg-teal-500/10 text-teal-400 text-xs font-semibold px-3 py-1 rounded-full border border-teal-500/20">
                  Desktop Dashboard
                </span>
                <Database className="w-8 h-8 text-teal-400 group-hover:rotate-12 transition-transform" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100 group-hover:text-teal-400 transition-colors">
                Portal Admin & Pemkab
              </h2>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                Dashboard analitik spasial kerawanan wilayah, penanganan laporan dari warga, manajemen tindakan preventif dinas terkait, dan manajemen rute.
              </p>
              <ul className="text-xs text-slate-400 text-left space-y-2 mt-4 max-w-xs mx-auto">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  Visualisasi GIS Spasial
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  Verifikasi & Tanggapi Laporan
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  Manajemen Tindakan & Petugas
                </li>
              </ul>
            </div>
            <div className="mt-8">
              <Link
                to="/admin"
                className="w-full inline-flex justify-center items-center py-3 px-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 hover:shadow-teal-500/30 transition-all group-hover:scale-[1.02]"
              >
                Masuk Portal Admin
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-500 mt-12 flex justify-center items-center gap-2">
          <Eye className="w-4 h-4" />
          <span>© 2026 Pemkab Madiun - Badan Penanggulangan Keamanan Wilayah</span>
        </div>
      </div>
    </div>
  );
}
