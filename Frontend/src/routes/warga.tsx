import { createFileRoute, Outlet, Link, useLocation } from '@tanstack/react-router';
import { Home, ShieldAlert, FileText, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSyncOfflineReports } from '../use-cases/hooks/useReports';

export const Route = createFileRoute('/warga')({
  component: WargaLayout,
});

function WargaLayout() {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const syncOfflineReports = useSyncOfflineReports();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger sync when going online
      syncOfflineReports.mutate();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check and sync if online
    if (navigator.onLine) {
      syncOfflineReports.mutate();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isActive = (path: string) => {
    if (path === '/warga' && location.pathname === '/warga') return true;
    if (path !== '/warga' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="flex-1 bg-slate-900 flex justify-center items-center">
      {/* Mobile Frame Container: Constraints to a mobile resolution on desktop for true Mobile-First UX */}
      <div className="w-full max-w-md min-h-screen bg-slate-50 dark:bg-slate-950 shadow-2xl relative flex flex-col border-x border-slate-200 dark:border-slate-800">
        
        {/* Citizen Top Bar */}
        <header className="sticky top-0 z-50 bg-emerald-600 dark:bg-emerald-800 text-white px-4 py-3 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-wider">SI AMAN Warga</span>
            <span className="bg-emerald-500 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-emerald-400">
              PWA
            </span>
          </div>

          {/* Connection Indicator */}
          <div className="flex items-center gap-3">
            {isOnline ? (
              <div className="flex items-center gap-1 text-emerald-100 text-xs bg-emerald-700/50 px-2 py-1 rounded-full">
                <Wifi className="w-3.5 h-3.5" />
                <span>Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-amber-100 text-xs bg-amber-600/70 px-2 py-1 rounded-full animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline Mode</span>
              </div>
            )}
          </div>
        </header>

        {/* Sync Status Banner */}
        {syncOfflineReports.isPending && (
          <div className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs text-center py-1.5 px-4 border-b border-emerald-200 dark:border-emerald-800 font-medium">
            Mensinkronisasikan laporan offline...
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col pb-20 overflow-y-auto">
          <Outlet />
        </div>

        {/* Citizen Bottom Navigation Bar */}
        <nav className="absolute bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-2 px-4 shadow-lg flex justify-around items-center">
          <Link
            to="/warga"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              isActive('/warga') && location.pathname === '/warga'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Rute & Peta</span>
          </Link>

          {/* Centered Large SOS Button (Crucial feature, highly accessible) */}
          <Link
            to="/warga/sos"
            className="flex flex-col items-center gap-1 -translate-y-5"
          >
            <div className="w-14 h-14 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-600/40 hover:shadow-red-500/50 transition-all border-4 border-slate-50 dark:border-slate-950 animate-sos-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span className="text-[10px] text-red-600 dark:text-red-400 font-bold -mt-3.5">
              DARURAT
            </span>
          </Link>

          <Link
            to="/warga/report-safety"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              isActive('/warga/report-safety')
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px]">Lapor Rawat</span>
          </Link>
        </nav>

      </div>
    </div>
  );
}
