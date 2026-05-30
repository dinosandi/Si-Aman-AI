import {
  createFileRoute,
  Outlet,
  Link,
  useLocation,
} from "@tanstack/react-router";
import {
  Home,
  ShieldAlert,
  FileText,
  Wifi,
  WifiOff,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSyncOfflineReports } from "../use-cases/hooks/useReports";
import { LoginView } from "./warga/components/LoginView";
import { RegisterView } from "./warga/components/RegisterView";
import { CompleteGoogleDataView } from "./warga/components/CompleteGoogleDataView";

export const Route = createFileRoute("/warga")({
  component: WargaLayout,
});

function WargaLayout() {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const syncOfflineReports = useSyncOfflineReports();

  // Local Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("warga_authenticated") === "true";
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (isAuthenticated) syncOfflineReports.mutate();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (navigator.onLine && isAuthenticated) {
      syncOfflineReports.mutate();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem("warga_authenticated");
    localStorage.removeItem("warga_current_user");
    setIsAuthenticated(false);
  };

  const isActive = (path: string) => {
    if (path === "/warga" && location.pathname === "/warga") return true;
    if (path !== "/warga" && location.pathname.startsWith(path)) return true;
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

  const isDashboard = location.pathname === "/warga" || location.pathname === "/warga/";

  return (
    <div className="flex-1 bg-slate-100 flex justify-center items-center min-h-screen">
      {/* Mobile Frame Container: Constraints to a mobile resolution on desktop for true Mobile-First UX */}
      <div className="w-full max-w-md h-screen max-h-screen bg-white relative flex flex-col border-x border-slate-200 overflow-hidden">
        {/* Citizen Top Bar */}
        {!isDashboard && (
          <header className="sticky top-0 z-50 bg-[#114B5F] text-white px-4 py-3 flex justify-between items-center border-b border-[#0d3b4b]">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wide">
                SI AMAN Warga
              </span>
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
        )}

        {/* Sync Status Banner */}
        {syncOfflineReports.isPending && !isDashboard && (
          <div className="bg-emerald-50 text-emerald-800 text-[10px] text-center py-1 px-4 border-b border-emerald-100 font-bold">
            Mensinkronisasikan laporan offline...
          </div>
        )}

        {/* Content Area */}
        <div className={`flex-1 flex flex-col relative w-full ${isDashboard ? "h-full overflow-hidden" : "pb-20 overflow-y-auto bg-slate-50"}`}>
          <Outlet />
        </div>

        {/* Citizen Bottom Navigation Bar */}
        {!isDashboard && (
          <nav className="absolute bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 py-2 px-4 flex justify-around items-center">
            <Link
              to="/warga"
              className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors ${
                isActive("/warga") && location.pathname === "/warga"
                  ? "text-[#114B5F] font-extrabold"
                  : "text-slate-400 hover:text-slate-600"
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
                isActive("/warga/report-safety")
                  ? "text-[#114B5F] font-extrabold"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="text-[9px]">Lapor Rawat</span>
            </Link>
          </nav>
        )}
      </div>
    </div>
  );
}

// Subcomponent: Citizen Login & Registration Forms
function WargaAuthForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [view, setView] = useState<
    "login" | "register" | "complete_google_data"
  >("login");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Geolocation loading state
  const [gpsLoading, setGpsLoading] = useState(false);

  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register states
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmergencyPhone, setRegEmergencyPhone] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regLatLong, setRegLatLong] = useState("");

  // Handle mock login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const storedUsers = localStorage.getItem("warga_users");
    const users = storedUsers
      ? JSON.parse(storedUsers)
      : [
          {
            email: "warga@siaman.id",
            password: "password123",
            name: "Warga Madiun",
          },
        ];

    const user = users.find(
      (u: any) =>
        u.email.toLowerCase() === email.toLowerCase().trim() &&
        u.password === password,
    );

    if (user) {
      localStorage.setItem("warga_authenticated", "true");
      localStorage.setItem("warga_current_user", JSON.stringify(user));
      onLoginSuccess();
    } else {
      setErrorMsg(
        "Email atau kata sandi salah. (Gunakan: warga@siaman.id / password123)",
      );
    }
  };

  // Handle direct Google Login
  const handleGoogleLogin = () => {
    localStorage.setItem("warga_authenticated", "true");
    localStorage.setItem(
      "warga_current_user",
      JSON.stringify({
        email: "google.user@gmail.com",
        name: "Google Warga Madiun",
        phone: "081234567890",
        emergencyPhone: "081234567899",
        address: "Madiun Kota",
        latLong: "-7.616700, 111.650000",
      }),
    );
    onLoginSuccess();
  };

  // Trigger Google onboarding view for Register
  const handleGoogleRegister = () => {
    setRegEmail("google.user@gmail.com");
    setRegName("Google Warga Madiun");
    setView("complete_google_data");
  };

  // Handle automatic geolocation for Lat, Long
  const handleAcquireGPS = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      alert("Fitur GPS tidak didukung oleh browser Anda.");
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
        console.warn("Geolocation failed, providing mock coords", err);
        setRegLatLong("-7.616700, 111.650000");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true },
    );
  };

  // Handle mock registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (view === "complete_google_data") {
      if (!regPassword || !regConfirmPassword) {
        setErrorMsg("Harap lengkapi kolom kata sandi wajib.");
        return;
      }
    } else {
      if (!regName || !regEmail || !regPassword || !regConfirmPassword) {
        setErrorMsg("Harap lengkapi kolom nama, email, dan sandi wajib.");
        return;
      }
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg("Kata sandi dan konfirmasi kata sandi tidak cocok.");
      return;
    }

    const storedUsers = localStorage.getItem("warga_users");
    const users = storedUsers
      ? JSON.parse(storedUsers)
      : [
          {
            email: "warga@siaman.id",
            password: "password123",
            name: "Warga Madiun",
          },
        ];

    // If it's standard registration, make sure email doesn't exist
    if (view !== "complete_google_data") {
      const userExists = users.some(
        (u: any) => u.email.toLowerCase() === regEmail.toLowerCase().trim(),
      );

      if (userExists) {
        setErrorMsg("Email sudah terdaftar di sistem.");
        return;
      }
    }

    const newUser = {
      name: regName || "Google Warga Madiun",
      email: regEmail.trim() || "google.user@gmail.com",
      password: regPassword,
      phone: regPhone,
      emergencyPhone: regEmergencyPhone,
      address: regAddress,
      latLong: regLatLong,
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem("warga_users", JSON.stringify(updatedUsers));
    localStorage.setItem("warga_authenticated", "true");
    localStorage.setItem("warga_current_user", JSON.stringify(newUser));
    onLoginSuccess();
  };

  if (view === "login") {
    return (
      <LoginView
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        errorMsg={errorMsg}
        onSubmit={handleLogin}
        onGoogleLogin={handleGoogleLogin}
        onSwitchToRegister={() => {
          setView("register");
          setErrorMsg(null);
        }}
      />
    );
  }

  if (view === "register") {
    return (
      <RegisterView
        regName={regName}
        setRegName={setRegName}
        regEmail={regEmail}
        setRegEmail={setRegEmail}
        regPassword={regPassword}
        setRegPassword={setRegPassword}
        regConfirmPassword={regConfirmPassword}
        setRegConfirmPassword={setRegConfirmPassword}
        regPhone={regPhone}
        setRegPhone={setRegPhone}
        regEmergencyPhone={regEmergencyPhone}
        setRegEmergencyPhone={setRegEmergencyPhone}
        regAddress={regAddress}
        setRegAddress={setRegAddress}
        regLatLong={regLatLong}
        setRegLatLong={setRegLatLong}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        showConfirmPassword={showConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        gpsLoading={gpsLoading}
        errorMsg={errorMsg}
        onSubmit={handleRegister}
        onAcquireGPS={handleAcquireGPS}
        onGoogleRegister={handleGoogleRegister}
        onSwitchToLogin={() => {
          setView("login");
          setErrorMsg(null);
        }}
      />
    );
  }

  return (
    <CompleteGoogleDataView
      regPassword={regPassword}
      setRegPassword={setRegPassword}
      regConfirmPassword={regConfirmPassword}
      setRegConfirmPassword={setRegConfirmPassword}
      regPhone={regPhone}
      setRegPhone={setRegPhone}
      regEmergencyPhone={regEmergencyPhone}
      setRegEmergencyPhone={setRegEmergencyPhone}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      showConfirmPassword={showConfirmPassword}
      setShowConfirmPassword={setShowConfirmPassword}
      errorMsg={errorMsg}
      onSubmit={handleRegister}
    />
  );
}
