import { createFileRoute, Outlet, Link, useLocation } from '@tanstack/react-router';
import { LayoutDashboard, FileSpreadsheet, Settings, LogOut, ShieldCheck, User } from 'lucide-react';

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
});

function AdminLayout() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-900 text-slate-100 flex overflow-hidden">
      
      {/* Admin Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0">
        
        {/* Header/Logo */}
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="bg-teal-500/20 p-2 rounded-xl border border-teal-500/30">
              <ShieldCheck className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                SI AMAN AI
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                Portal Admin
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive('/admin') && location.pathname === '/admin'
                  ? 'bg-teal-600 text-white font-semibold shadow-lg shadow-teal-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard Analitik</span>
            </Link>

            <Link
              to="/admin/reports"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive('/admin/reports')
                  ? 'bg-teal-600 text-white font-semibold shadow-lg shadow-teal-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span>Laporan Warga</span>
            </Link>

            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            >
              <Settings className="w-5 h-5" />
              <span>Pengaturan Wilayah</span>
            </Link>
          </nav>
        </div>

        {/* Footer/Logout */}
        <div className="p-4 border-t border-slate-800">
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-slate-800 hover:bg-red-950/30 hover:border-red-900/50 hover:text-red-400 transition-all text-slate-400 text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>Kembali ke Portal</span>
          </Link>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-8 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-slate-200">
            {location.pathname === '/admin' && 'Dashboard Analitik Spasial'}
            {location.pathname.startsWith('/admin/reports') && 'Manajemen Laporan Kerawanan'}
          </h2>

          <div className="flex items-center gap-4">
            {/* Admin User Badge */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
              <div className="bg-teal-500/20 p-1 rounded-full">
                <User className="w-4 h-4 text-teal-400" />
              </div>
              <span className="text-xs font-semibold text-slate-300">Admin Utama - Mejayan</span>
            </div>
          </div>
        </header>

        {/* Dynamic Content Panel */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-900/50">
          <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
}
