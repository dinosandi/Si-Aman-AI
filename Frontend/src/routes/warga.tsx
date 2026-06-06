import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { Wifi, WifiOff, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useSyncOfflineReports } from "../use-cases/hooks/useReports";
import { useAuth } from "../use-cases/hooks/useAuth";
import { LoginView } from "./warga/components/LoginView";
import { RegisterView } from "./warga/components/RegisterView";
import { CompleteGoogleDataView } from "./warga/components/CompleteGoogleDataView";
import { BottomNav } from "../components/atomic/organisms/BottomNav";

export const Route = createFileRoute("/warga")({
  component: WargaLayout,
});

function WargaLayout() {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const syncOfflineReports = useSyncOfflineReports();
  const auth = useAuth();

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

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch (err) {
      console.error("Gagal logout backend:", err);
    }
    setIsAuthenticated(false);
  };

  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const handleNavChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsNavigating(!!customEvent.detail?.active);
    };
    window.addEventListener("navigation-change", handleNavChange);
    return () => {
      window.removeEventListener("navigation-change", handleNavChange);
    };
  }, []);

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

  const isDashboard =
    location.pathname === "/warga" || location.pathname === "/warga/";

  return (
    <div className="flex-1 bg-slate-100 flex justify-center items-center min-h-screen">
      {/* Mobile Frame Container: Constraints to a mobile resolution on desktop for true Mobile-First UX */}
      <div className="w-full max-w-md h-screen max-h-screen bg-slate-50 relative flex flex-col border-x border-slate-200 overflow-hidden">
        {/* Citizen Top Bar */}
        {!isDashboard && (
          <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md px-4 py-3 flex justify-between items-center border-b border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-800 text-sm tracking-wide">
                SI AMAN
              </span>
            </div>

            {/* Connection Indicator & Logout */}
            <div className="flex items-center gap-2.5">
              {/* {isOnline ? (
                <div className="flex items-center gap-0.5 text-emerald-700 text-[10px] bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full font-bold">
                  <Wifi className="w-3 h-3" />
                  <span>Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-0.5 text-amber-700 text-[10px] bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full font-bold">
                  <WifiOff className="w-3 h-3" />
                  <span>Offline</span>
                </div>
              )} */}
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-slate-500 hover:text-slate-700 active:scale-95 shadow-sm"
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
        <div
          className={`flex-1 flex flex-col relative w-full ${isDashboard ? "h-full overflow-hidden" : "pb-24 overflow-y-auto bg-slate-50"}`}
        >
          <Outlet />
        </div>

        {!isNavigating && <BottomNav />}
      </div>
    </div>
  );
}

// Subcomponent: Citizen Login & Registration Forms
function WargaAuthForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [view, setView] = useState<
    "login" | "register" | "complete_google_data"
  >("login");
  const [errorMsg, setErrorMsg] = useState<string | null>(() => {
    const flash = localStorage.getItem("auth_flash_message");
    if (flash) {
      localStorage.removeItem("auth_flash_message");
      return flash;
    }
    return null;
  });

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

  const auth = useAuth();

  // Handle real login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      await auth.login({
        email: email.trim(),
        password,
      });
      onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          "Email atau kata sandi salah. (Default: warga@siaman.id / password123)",
      );
    }
  };

  // Handle direct Google Login (via backend register/login mock)
  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    try {
      await auth.register({
        name: "Google Warga Madiun",
        email: "google.user@gmail.com",
        password: "PasswordGoogleMock123!",
        phone: "081234567890",
        emergencyPhone: "081234567899",
        address: "Madiun Kota",
        latitude: -7.6167,
        longitude: 111.65,
      });
      onLoginSuccess();
    } catch (err: any) {
      try {
        await auth.login({
          email: "google.user@gmail.com",
          password: "PasswordGoogleMock123!",
        });
        onLoginSuccess();
      } catch (loginErr: any) {
        setErrorMsg(
          "Gagal melakukan Google Sign In. Silakan mendaftar secara manual.",
        );
      }
    }
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

  // Handle real registration
  const handleRegister = async (e: React.FormEvent) => {
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

    // Split LatLong if present
    let lat: number | undefined;
    let lng: number | undefined;
    if (regLatLong) {
      const parts = regLatLong.split(",");
      if (parts.length === 2) {
        lat = parseFloat(parts[0].trim());
        lng = parseFloat(parts[1].trim());
      }
    }

    try {
      await auth.register({
        name: regName,
        email: regEmail.trim(),
        password: regPassword,
        phone: regPhone || "081234567890",
        emergencyPhone: regEmergencyPhone || "081234567899",
        address: regAddress || "Madiun",
        latitude: lat,
        longitude: lng,
      });
      onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mendaftar. Silakan coba lagi.");
    }
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
