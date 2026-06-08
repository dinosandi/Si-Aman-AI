import { createFileRoute } from '@tanstack/react-router';
import { useEmergencySOS } from '../../use-cases/hooks/useEmergencySOS';
import { ShieldAlert, MapPin, CheckCircle2, AlertOctagon } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/warga/sos')({
  component: WargaSOS,
});

function WargaSOS() {
  const { triggerSOS, isLoading, isSuccess, error, currentLocation } = useEmergencySOS();
  const [sosActivated, setSosActivated] = useState(false);

  const handleSOS = async () => {
    try {
      setSosActivated(true);
      await triggerSOS();
      localStorage.setItem("nav_is_sos_active", "true");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col flex-1 p-6 justify-between items-center bg-slate-50 min-h-[calc(100vh-60px)]">
      
      {/* Top Header/Helper */}
      <div className="text-center space-y-2 mt-4">
        <h3 className="text-xl font-extrabold text-red-600 uppercase tracking-wider flex items-center justify-center gap-2">
          <AlertOctagon className="w-6 h-6" />
          <span>Pusat Kedaruratan</span>
        </h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed font-bold">
          Tekan tombol di bawah untuk menyiarkan koordinat lokasi GPS Anda ke Kepolisian dan BPBD Kabupaten Madiun secara instan.
        </p>
      </div>

      {/* Center SOS Panic Button Container */}
      <div className="my-8 flex flex-col items-center justify-center relative">
        {/* Pulsing visual backdrops */}
        {!sosActivated ? (
          <div className="w-52 h-52 rounded-full bg-red-500/10 absolute animate-ping pointer-events-none" />
        ) : (
          <div className="w-52 h-52 rounded-full bg-red-600/20 absolute animate-pulse pointer-events-none" />
        )}

        <button
          onClick={handleSOS}
          disabled={isLoading || isSuccess}
          className={`w-44 h-44 rounded-full border-8 flex flex-col justify-center items-center gap-2 transition-transform active:scale-95 ${
            isSuccess
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : 'bg-red-600 border-red-500 text-white hover:bg-red-500'
          }`}
        >
          <ShieldAlert className={`w-12 h-12 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="text-base font-black tracking-widest uppercase">
            {isLoading ? 'Mengirim...' : isSuccess ? 'TERKIRIM' : 'PANIC BUTTON'}
          </span>
        </button>
      </div>

      {/* SOS Feedback State */}
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isSuccess ? 'bg-emerald-50' : 'bg-red-50'}`}>
            {isSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <MapPin className="w-5 h-5 text-red-600" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              {isSuccess ? 'SOS Berhasil Disiarkan' : 'Status Pengiriman Lokasi'}
            </h4>
            <p className="text-[10px] text-slate-400 font-bold">
              {isSuccess ? 'Bantuan sedang dalam perjalanan.' : 'Belum diaktifkan.'}
            </p>
          </div>
        </div>

        {/* GPS location diagnostics */}
        {currentLocation && (
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[10px] space-y-1 font-mono text-slate-500">
            <div className="flex justify-between">
              <span>Latitude:</span>
              <span className="font-bold text-slate-700">{currentLocation.lat.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span>Longitude:</span>
              <span className="font-bold text-slate-700">{currentLocation.lng.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span>Akurasi GPS:</span>
              <span className="text-emerald-600 font-bold uppercase tracking-wider">~5 meter (Tinggi)</span>
            </div>
          </div>
        )}

        {error && (
          <div className="text-[10px] bg-red-50 border border-red-200 text-red-800 p-2.5 rounded-xl text-center font-bold">
            Error: {error.message}
          </div>
        )}
      </div>

      {/* Emergency Hotline Direct Links */}
      <div className="text-center w-full max-w-sm mt-4">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Telepon Darurat Manual</span>
        <div className="grid grid-cols-2 gap-3">
          <a
            href="tel:110"
            className="py-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors block text-center"
          >
            Polisi (110)
          </a>
          <a
            href="tel:119"
            className="py-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors block text-center"
          >
            Ambulans (119)
          </a>
        </div>
      </div>
    </div>
  );
}
