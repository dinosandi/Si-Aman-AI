import { createFileRoute, Link } from '@tanstack/react-router';
import { Shield, Navigation, Database, Eye, ShieldAlert, FileText, CheckCircle } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-slate-50 text-slate-800 selection:bg-emerald-500 selection:text-white min-h-screen">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-2 rounded-lg text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-slate-900">SI AMAN AI</span>
              <span className="text-[10px] text-slate-400 font-bold tracking-wider block -mt-1 uppercase">Madiun</span>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              to="/warga"
              className="text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Portal Warga
            </Link>
            <Link
              to="/admin"
              className="text-xs font-bold text-slate-600 hover:text-teal-600 transition-colors"
            >
              Portal Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold tracking-wider uppercase px-3 py-1 rounded-full border border-emerald-200">
            Sistem Pemetaan Keamanan & Rute Aman Kabupaten Madiun
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Navigasi Pintar, Pemetaan Kerawanan, & Tanggap Darurat AI
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Platform mitigasi keamanan wilayah Kabupaten Madiun yang membantu warga menemukan rute perjalanan teraman berbasis analisis kerawanan AI, pelaporan cepat masyarakat, serta koordinasi terpadu antar dinas.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
            <Link
              to="/warga"
              className="inline-flex justify-center items-center py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Masuk Portal Warga (PWA)
            </Link>
            <Link
              to="/admin"
              className="inline-flex justify-center items-center py-2.5 px-6 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors"
            >
              <Database className="w-4 h-4 mr-2" />
              Masuk Portal Admin
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grids */}
      <section className="py-16 px-4 max-w-6xl mx-auto w-full">
        <h2 className="text-xl font-extrabold text-slate-900 text-center mb-10 tracking-tight">
          Layanan & Fitur Utama SI AMAN AI
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 text-emerald-600 inline-block mb-4">
                <Navigation className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Rute Aman Spasial AI</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Menganalisis rute perjalanan dengan OpenStreetMap untuk menyarankan jalur paling aman, menghindari titik rawan banjir, jalan berlubang, kecelakaan, dan minim penerangan.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Didukung Leaflet & Nominatim</span>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 text-emerald-600 inline-block mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Pelaporan & Kompresi Foto</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Warga dapat melaporkan kejadian kerawanan di wilayah Madiun secara langsung. Dilengkapi dengan kompresi gambar otomatis client-side untuk hemat kuota dan support offline.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Offline Sync + IndexedDB</span>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="bg-red-50 p-2.5 rounded-xl border border-red-100 text-red-600 inline-block mb-4">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Panic Button SOS Instan</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Tombol darurat sekali tekan yang memancarkan koordinat lokasi GPS presisi warga ke kepolisian terdekat dan BPBD Madiun untuk penanganan situasi kritis cepat.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-[10px] font-bold text-red-600 uppercase">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Respon SOS & GPS Akurat</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>Badan Penanggulangan Keamanan Wilayah & Pemkab Madiun</span>
          </div>
          <span>© 2026 SI AMAN AI. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
