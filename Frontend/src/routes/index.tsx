import { createFileRoute, Link } from '@tanstack/react-router';
import { Shield } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: GettingStartedPage,
});

function GettingStartedPage() {
  return (
    <div className="flex-1 bg-slate-100 flex justify-center items-center min-h-screen">
      {/* Mobile-first constraints frame */}
      <div className="w-full max-w-md min-h-screen bg-white border-x border-slate-200 flex flex-col justify-between p-6">
        
        {/* Top Branding Section */}
        <div className="flex items-center gap-2.5 justify-center mt-4">
          <img 
            src="/img/icon.png" 
            alt="SI AMAN AI Logo" 
            className="w-9 h-9 object-contain"
          />
          <div>
            <span className="font-black text-slate-800 text-sm block tracking-tight">SI AMAN AI</span>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block -mt-1">
              Kab. Madiun
            </span>
          </div>
        </div>

        {/* Center Illustration and Onboarding Text */}
        <div className="flex flex-col items-center text-center space-y-6 my-auto py-8">
          <img 
            src="/img/getting-started.png" 
            alt="Safety Navigator Illustration" 
            className="w-72 max-w-full h-auto object-contain"
          />
          
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              Panduan Navigasi & Rute Perjalanan Teraman Anda
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto font-medium">
              Analisis rute cerdas menggunakan AI untuk menghindari area kriminal, banjir, kecelakaan, dan rintangan jalan di seluruh Kabupaten Madiun.
            </p>
          </div>
        </div>

        {/* Bottom Action Section */}
        <div className="space-y-4 mb-4">
          <Link
            to="/warga"
            className="w-full inline-flex justify-center items-center py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-colors"
          >
            Mulai
          </Link>
          
          <div className="text-center">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
              Badan Penanggulangan Keamanan Wilayah & Pemkab Madiun
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
