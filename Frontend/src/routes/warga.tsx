import { createFileRoute, Outlet, Link, useLocation } from '@tanstack/react-router';
import { Home, ShieldAlert, FileText, Wifi, WifiOff, LogOut, Mail, Lock, Eye, EyeOff, User, Phone, MapPin } from 'lucide-react';
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

  // If not logged in, render the login/register page inside the mobile frame container
  if (!isAuthenticated) {
    return (
      <div className="flex-1 bg-slate-100 flex justify-center items-center min-h-screen">
        <div className="w-full max-w-md min-h-screen bg-white border-x border-slate-200 p-6 flex flex-col justify-between overflow-hidden">
          
          <WargaAuthForm onLoginSuccess={() => setIsAuthenticated(true)} />
          
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-100 flex justify-center items-center min-h-screen">
      {/* Mobile Frame Container: Constraints to a mobile resolution on desktop for true Mobile-First UX */}
      <div className="w-full max-w-md min-h-screen bg-white relative flex flex-col border-x border-slate-200">
        
        {/* Citizen Top Bar */}
        <header className="sticky top-0 z-50 bg-[#114B5F] text-white px-4 py-3 flex justify-between items-center border-b border-[#0d3b4b]">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-wide">SI AMAN Warga</span>
            <span className="bg-emerald-500/20 text-[8px] uppercase font-extrabold px-1.5 py-0.5 rounded border border-emerald-400/30">
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
              className="p-1 bg-[#0d3b4b] hover:bg-[#092934] rounded transition-colors text-white"
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
                ? 'text-[#114B5F] font-extrabold'
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
                ? 'text-[#114B5F] font-extrabold'
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
  const [view, setView] = useState<'login' | 'register'>('login');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Geolocation loading state
  const [gpsLoading, setGpsLoading] = useState(false);

  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmergencyPhone, setRegEmergencyPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regLatLong, setRegLatLong] = useState('');

  // Handle mock login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const storedUsers = localStorage.getItem('warga_users');
    const users = storedUsers
      ? JSON.parse(storedUsers)
      : [{ email: 'warga@siaman.id', password: 'password123', name: 'Warga Madiun' }];

    const user = users.find(
      (u: any) => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
    );

    if (user) {
      localStorage.setItem('warga_authenticated', 'true');
      localStorage.setItem('warga_current_user', JSON.stringify(user));
      onLoginSuccess();
    } else {
      setErrorMsg('Email atau kata sandi salah. (Gunakan: warga@siaman.id / password123)');
    }
  };

  // Handle automatic geolocation for Lat, Long
  const handleAcquireGPS = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      alert('Fitur GPS tidak didukung oleh browser Anda.');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        setRegLatLong(coords);
        setGpsLoading(false);
      },
      (err) => {
        console.warn('Geolocation failed, providing mock coords', err);
        // Fallback coordination in Madiun
        setRegLatLong('-7.616700, 111.650000');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Handle mock registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!regName || !regEmail || !regPassword || !regConfirmPassword) {
      setErrorMsg('Harap lengkapi kolom nama, email, dan sandi wajib.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Kata sandi dan konfirmasi kata sandi tidak cocok.');
      return;
    }

    const storedUsers = localStorage.getItem('warga_users');
    const users = storedUsers
      ? JSON.parse(storedUsers)
      : [{ email: 'warga@siaman.id', password: 'password123', name: 'Warga Madiun' }];

    const userExists = users.some(
      (u: any) => u.email.toLowerCase() === regEmail.toLowerCase().trim()
    );

    if (userExists) {
      setErrorMsg('Email sudah terdaftar di sistem.');
      return;
    }

    const newUser = {
      name: regName,
      email: regEmail.trim(),
      password: regPassword,
      phone: regPhone,
      emergencyPhone: regEmergencyPhone,
      address: regAddress,
      latLong: regLatLong,
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem('warga_users', JSON.stringify(updatedUsers));
    localStorage.setItem('warga_authenticated', 'true');
    localStorage.setItem('warga_current_user', JSON.stringify(newUser));
    onLoginSuccess();
  };

  return (
    <div className="flex-1 flex flex-col justify-between h-full py-2 overflow-y-auto">
      {/* Upper Section */}
      <div className="space-y-5 my-auto">
        
        {/* Header Logo & Title side-by-side or centered */}
        {view === 'login' ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img 
                src="/img/icon.png" 
                alt="SI AMAN AI Logo" 
                className="w-24 h-24 object-contain"
              />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Masuk</h2>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-[275px] mx-auto">
                Jika ingin masuk kedalam sistem kami bisa masukkan E-mail dan password yang telah di daftarkan.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3.5">
              <img 
                src="/img/icon.png" 
                alt="SI AMAN AI Logo" 
                className="w-16 h-16 object-contain"
              />
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Daftar</h2>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-[280px] mx-auto">
                Silahkan daftarkan akun anda untuk menikmati fasilitas dengan mengisi beberapa formulir yang kami sediakan
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl text-center font-bold">
            {errorMsg}
          </div>
        )}

        {/* Forms layout */}
        {view === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3.5">
            
            {/* E-mail input */}
            <div className="relative flex items-center">
              <Mail className="absolute left-4 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                className="w-full text-xs py-3 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#114B5F]"
              />
            </div>

            {/* Password input */}
            <div className="relative flex items-center">
              <Lock className="absolute left-4 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kata Sandi"
                className="w-full text-xs py-3 pl-11 pr-11 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#114B5F]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Lupa password */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => alert('Fitur pemulihan kata sandi sedang dalam pengembangan.')}
                className="text-[10px] font-bold text-[#114B5F] hover:underline"
              >
                Lupa Password?
              </button>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-[#114B5F] hover:bg-[#0e3b4b] text-white font-bold text-xs rounded-xl transition-colors tracking-wide"
            >
              Masuk
            </button>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-[9px] font-bold bg-slate-100 text-slate-400 py-1 px-2.5 rounded-md uppercase">
                Metode Lain
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Google Sign-in */}
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('warga_authenticated', 'true');
                localStorage.setItem('warga_current_user', JSON.stringify({ email: 'google.user@gmail.com', name: 'Google Warga Madiun' }));
                onLoginSuccess();
              }}
              className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-slate-500 font-bold text-xs transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Masuk dengan Akun Google</span>
            </button>

          </form>
        ) : (
          /* Register Form matching mockup elements */
          <form onSubmit={handleRegister} className="space-y-3">
            
            {/* Nama Lengkap */}
            <div className="relative flex items-center">
              <User className="absolute left-4 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Nama Lengkap"
                className="w-full text-xs py-2.5 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#114B5F]"
              />
            </div>

            {/* Email */}
            <div className="relative flex items-center">
              <Mail className="absolute left-4 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="Email"
                className="w-full text-xs py-2.5 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#114B5F]"
              />
            </div>

            {/* Kata Sandi */}
            <div className="relative flex items-center">
              <Lock className="absolute left-4 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Kata Sandi"
                className="w-full text-xs py-2.5 pl-11 pr-11 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#114B5F]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Konfirmasi Kata Sandi */}
            <div className="relative flex items-center">
              <Lock className="absolute left-4 w-4 h-4 text-slate-500" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                placeholder="Konfirmasi Kata Sandi"
                className="w-full text-xs py-2.5 pl-11 pr-11 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#114B5F]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* No Telepon */}
            <div className="relative flex items-center">
              <Phone className="absolute left-4 w-4 h-4 text-slate-500" />
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="No Telepon"
                className="w-full text-xs py-2.5 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#114B5F]"
              />
            </div>

            {/* Nomor Telepon Darurat */}
            <div className="relative flex items-center">
              <Phone className="absolute left-4 w-4 h-4 text-slate-500" />
              <input
                type="tel"
                value={regEmergencyPhone}
                onChange={(e) => setRegEmergencyPhone(e.target.value)}
                placeholder="Nomor Telepon Darurat"
                className="w-full text-xs py-2.5 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#114B5F]"
              />
            </div>

            {/* Alamat */}
            <div className="relative flex items-center">
              <MapPin className="absolute left-4 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                placeholder="Alamat"
                className="w-full text-xs py-2.5 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#114B5F]"
              />
            </div>

            {/* Lat, Long with automatic GPS fetch button inside input */}
            <div className="relative flex items-center">
              <MapPin className="absolute left-4 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={regLatLong}
                onChange={(e) => setRegLatLong(e.target.value)}
                placeholder="Lat, Long"
                className="w-full text-xs py-2.5 pl-11 pr-24 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#114B5F]"
              />
              <button
                type="button"
                onClick={handleAcquireGPS}
                className="absolute right-2 px-2.5 py-1 bg-[#114B5F] hover:bg-[#0e3b4b] text-white text-[9px] font-bold rounded-lg transition-colors"
              >
                {gpsLoading ? 'Melacak...' : 'Ambil GPS'}
              </button>
            </div>

            {/* Submit Register button */}
            <button
              type="submit"
              className="w-full py-3 bg-[#114B5F] hover:bg-[#0e3b4b] text-white font-bold text-xs rounded-xl transition-colors tracking-wide"
            >
              Daftar
            </button>

            {/* Divider */}
            <div className="relative flex py-1.5 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-[9px] font-bold bg-slate-100 text-slate-400 py-1 px-2.5 rounded-md uppercase">
                Daftar Metode Lain
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Google Sign-up */}
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('warga_authenticated', 'true');
                localStorage.setItem('warga_current_user', JSON.stringify({ email: 'google.user@gmail.com', name: 'Google Warga Madiun' }));
                onLoginSuccess();
              }}
              className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-slate-500 font-bold text-xs transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Daftar dengan Akun Google</span>
            </button>

          </form>
        )}
      </div>

      {/* Bottom Switch Tab Section */}
      <div className="text-center pt-5 mt-auto">
        <button
          type="button"
          onClick={() => {
            setView(view === 'login' ? 'register' : 'login');
            setErrorMsg(null);
          }}
          className="text-xs text-slate-500 font-medium"
        >
          {view === 'login' ? (
            <span>Tidak Memiliki Akun? <strong className="text-[#114B5F] hover:underline">Daftar</strong></span>
          ) : (
            <span>Sudah Memiliki Akun? <strong className="text-[#114B5F] hover:underline">Masuk</strong></span>
          )}
        </button>
      </div>

    </div>
  );
}
