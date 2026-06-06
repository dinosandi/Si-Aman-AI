import { createFileRoute, Outlet, Link, useLocation } from '@tanstack/react-router';
import { LayoutDashboard, FileSpreadsheet, LogOut, ShieldCheck, User, Lock } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
});

function AdminLayout() {
  const location = useLocation();

  // Local Authentication State for Admin
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('admin_authenticated') === 'true';
  });

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
  };

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // If not logged in, render the Admin Auth Page
  if (!isAuthenticated) {
    return (
      <div className="flex-1 bg-slate-100 flex justify-center items-center min-h-screen p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 p-6 flex flex-col space-y-6">
          
          {/* Logo Branding */}
          <div className="text-center space-y-2">
            <div className="bg-teal-50 text-teal-600 p-3 rounded-2xl border border-teal-100 inline-block">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">SI AMAN Admin</h2>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Portal Verifikasi Keamanan, Penanganan Laporan Warga, dan Manajemen Peta Kabupaten Madiun.
            </p>
          </div>

          <AdminAuthForm onLoginSuccess={() => setIsAuthenticated(true)} />

          <div className="text-center">
            <Link
              to="/"
              className="text-[10px] text-slate-400 hover:text-slate-600 underline font-bold"
            >
              Kembali ke Landing Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-slate-50 text-slate-800 flex overflow-hidden">
      
      {/* Admin Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
        
        {/* Header/Logo */}
        <div>
          <div className="p-6 border-b border-slate-200 flex items-center gap-3">
            <div className="bg-teal-50 text-teal-600 p-2 rounded-xl border border-teal-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-slate-900">
                SI AMAN AI
              </h1>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold -mt-0.5">
                Portal Admin
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-bold ${
                isActive('/admin') && location.pathname === '/admin'
                  ? 'bg-teal-50 text-teal-700 border border-teal-150'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              <span>Dashboard Analitik</span>
            </Link>

            <Link
              to="/admin/reports"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-bold ${
                isActive('/admin/reports')
                  ? 'bg-teal-50 text-teal-700 border border-teal-150'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className="w-4.5 h-4.5" />
              <span>Laporan Warga</span>
            </Link>
          </nav>
        </div>

        {/* Footer/Logout */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors text-slate-500 text-xs font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex justify-between items-center shrink-0">
          <h2 className="text-base font-extrabold text-slate-900">
            {location.pathname === '/admin' && 'Dashboard Analitik Spasial'}
            {location.pathname.startsWith('/admin/reports') && 'Manajemen Laporan Kerawanan'}
          </h2>

          <div className="flex items-center gap-4">
            {/* Admin User Badge */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
              <div className="bg-teal-100 p-1 rounded-full text-teal-600">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-slate-600">Admin Utama - Mejayan</span>
            </div>
          </div>
        </header>

        {/* Dynamic Content Panel */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
}

// Subcomponent: Admin Login Form
function AdminAuthForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(() => {
    const flash = localStorage.getItem('auth_flash_message');
    if (flash) {
      localStorage.removeItem('auth_flash_message');
      return flash;
    }
    return null;
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Default admin mock credentials
    if (username.toLowerCase().trim() === 'admin' && password === 'admin123') {
      localStorage.setItem('admin_authenticated', 'true');
      onLoginSuccess();
    } else {
      setErrorMsg('Username atau password admin salah. (Gunakan: admin / admin123)');
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {errorMsg && (
        <div className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl text-center font-bold">
          {errorMsg}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-500 block">Username Admin</label>
        <div className="relative">
          <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username (misal: admin)"
            className="w-full text-xs py-2.5 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-500 block">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (misal: admin123)"
            className="w-full text-xs py-2.5 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full mt-2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors"
      >
        Masuk Dashboard
      </button>
    </form>
  );
}
