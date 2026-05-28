import { createFileRoute, Outlet, Link, useLocation } from '@tanstack/react-router';
import { Home, ShieldAlert, FileText, Wifi, WifiOff, LogOut, Shield, User, Lock, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSyncOfflineReports } from '../use-cases/hooks/useReports';

export const Route = createFileRoute('/warga')({
  component: WargaLayout,
});

function WargaLayout() {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const syncOfflineReports = useSyncOfflineReports();

  // Local Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('warga_authenticated') === 'true';
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (isAuthenticated) syncOfflineReports.mutate();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine && isAuthenticated) {
      syncOfflineReports.mutate();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('warga_authenticated');
    localStorage.removeItem('warga_current_user');
    setIsAuthenticated(false);
  };

  const isActive = (path: string) => {
    if (path === '/warga' && location.pathname === '/warga') return true;
    if (path !== '/warga' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // If not logged in, render the Auth Page inside the mobile frame
  if (!isAuthenticated) {
    return (
      <div className="flex-1 bg-slate-100 flex justify-center items-center min-h-screen p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 flex flex-col space-y-6">
          
          {/* Logo Branding */}
          <div className="text-center space-y-2">
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl border border-emerald-100 inline-block">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">SI AMAN Portal Warga</h2>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Masuk atau daftar untuk memantau rute teraman dan mengirimkan laporan kerawanan wilayah Kabupaten Madiun.
            </p>
          </div>

          <WargaAuthForm onLoginSuccess={() => setIsAuthenticated(true)} />

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
    <div className="flex-1 bg-slate-100 flex justify-center items-center min-h-screen">
      {/* Mobile Frame Container: Constraints to a mobile resolution on desktop for true Mobile-First UX */}
      <div className="w-full max-w-md min-h-screen bg-white relative flex flex-col border-x border-slate-200">
        
        {/* Citizen Top Bar */}
        <header className="sticky top-0 z-50 bg-emerald-600 text-white px-4 py-3 flex justify-between items-center border-b border-emerald-700">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-wide">SI AMAN Warga</span>
            <span className="bg-emerald-500 text-[8px] uppercase font-extrabold px-1.5 py-0.5 rounded border border-emerald-400">
              PWA
            </span>
          </div>

          {/* Connection Indicator & Logout */}
          <div className="flex items-center gap-2.5">
            {isOnline ? (
              <div className="flex items-center gap-0.5 text-emerald-100 text-[10px] bg-emerald-700/50 px-2 py-0.5 rounded-full">
                <Wifi className="w-3 h-3" />
                <span>Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-0.5 text-amber-100 text-[10px] bg-amber-600/70 px-2 py-0.5 rounded-full">
                <WifiOff className="w-3 h-3" />
                <span>Offline</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1 bg-emerald-700 hover:bg-emerald-800 rounded transition-colors text-white"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Sync Status Banner */}
        {syncOfflineReports.isPending && (
          <div className="bg-emerald-50 text-emerald-800 text-[10px] text-center py-1 px-4 border-b border-emerald-100 font-bold">
            Mensinkronisasikan laporan offline...
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col pb-20 overflow-y-auto bg-slate-50">
          <Outlet />
        </div>

        {/* Citizen Bottom Navigation Bar */}
        <nav className="absolute bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 py-2 px-4 flex justify-around items-center">
          <Link
            to="/warga"
            className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors ${
              isActive('/warga') && location.pathname === '/warga'
                ? 'text-emerald-600 font-extrabold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-[9px]">Rute & Peta</span>
          </Link>

          {/* Centered Large SOS Button */}
          <Link
            to="/warga/sos"
            className="flex flex-col items-center gap-0.5 -translate-y-4"
          >
            <div className="w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center border-4 border-white transition-transform active:scale-95">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[9px] text-red-600 font-bold -mt-2">
              DARURAT
            </span>
          </Link>

          <Link
            to="/warga/report-safety"
            className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors ${
              isActive('/warga/report-safety')
                ? 'text-emerald-600 font-extrabold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-[9px]">Lapor Rawat</span>
          </Link>
        </nav>

      </div>
    </div>
  );
}

// Subcomponent: Citizen Login & Registration Forms
function WargaAuthForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Handle mock login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const storedUsers = localStorage.getItem('warga_users');
    const users = storedUsers
      ? JSON.parse(storedUsers)
      : [{ username: 'warga', password: 'password123', name: 'Warga Madiun' }];

    const user = users.find(
      (u: any) => u.username.toLowerCase() === loginUsername.toLowerCase().trim() && u.password === loginPassword
    );

    if (user) {
      localStorage.setItem('warga_authenticated', 'true');
      localStorage.setItem('warga_current_user', JSON.stringify(user));
      onLoginSuccess();
    } else {
      setErrorMsg('Username atau password salah. (Gunakan: warga / password123)');
    }
  };

  // Handle mock registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!regUsername || !regPassword || !regName) {
      setErrorMsg('Harap lengkapi semua kolom yang wajib diisi.');
      return;
    }

    const storedUsers = localStorage.getItem('warga_users');
    const users = storedUsers ? JSON.parse(storedUsers) : [{ username: 'warga', password: 'password123', name: 'Warga Madiun' }];

    const userExists = users.some(
      (u: any) => u.username.toLowerCase() === regUsername.toLowerCase().trim()
    );

    if (userExists) {
      setErrorMsg('Username sudah terdaftar.');
      return;
    }

    const newUser = {
      username: regUsername.trim(),
      password: regPassword,
      name: regName,
      phone: regPhone,
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem('warga_users', JSON.stringify(updatedUsers));
    localStorage.setItem('warga_authenticated', 'true');
    localStorage.setItem('warga_current_user', JSON.stringify(newUser));
    onLoginSuccess();
  };

  return (
    <div className="space-y-4">
      {/* Tabs Selector */}
      <div className="flex border border-slate-200 rounded-xl overflow-hidden p-0.5 bg-slate-50">
        <button
          type="button"
          onClick={() => {
            setActiveTab('login');
            setErrorMsg(null);
          }}
          className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'login'
              ? 'bg-white text-emerald-600 border border-slate-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Masuk
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('register');
            setErrorMsg(null);
          }}
          className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'register'
              ? 'bg-white text-emerald-600 border border-slate-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Daftar Akun
        </button>
      </div>

      {errorMsg && (
        <div className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl text-center font-bold">
          {errorMsg}
        </div>
      )}

      {/* Login Form */}
      {activeTab === 'login' ? (
        <form onSubmit={handleLogin} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Username Anda (misal: warga)"
                className="w-full text-xs py-2.5 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
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
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password Anda (misal: password123)"
                className="w-full text-xs py-2.5 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Masuk Portal
          </button>
        </form>
      ) : (
        /* Register Form */
        <form onSubmit={handleRegister} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">Nama Lengkap</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Nama Lengkap Anda"
                className="w-full text-xs py-2.5 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">No. Handphone (Opsional)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="No. Handphone Aktif"
                className="w-full text-xs py-2.5 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">Username Baru</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="Buat Username"
                className="w-full text-xs py-2.5 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">Password Baru</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Buat Password Minimal 6 Karakter"
                className="w-full text-xs py-2.5 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Daftar & Masuk
          </button>
        </form>
      )}
    </div>
  );
}
