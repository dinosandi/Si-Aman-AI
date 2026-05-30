import React from "react";
import { User, Mail, Lock, Eye, EyeOff, Phone, MapPin } from "lucide-react";

interface RegisterViewProps {
  regName: string;
  setRegName: (val: string) => void;
  regEmail: string;
  setRegEmail: (val: string) => void;
  regPassword: string;
  setRegPassword: (val: string) => void;
  regConfirmPassword: string;
  setRegConfirmPassword: (val: string) => void;
  regPhone: string;
  setRegPhone: (val: string) => void;
  regEmergencyPhone: string;
  setRegEmergencyPhone: (val: string) => void;
  regAddress: string;
  setRegAddress: (val: string) => void;
  regLatLong: string;
  setRegLatLong: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (val: boolean) => void;
  gpsLoading: boolean;
  errorMsg: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onAcquireGPS: () => void;
  onGoogleRegister: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterView({
  regName,
  setRegName,
  regEmail,
  setRegEmail,
  regPassword,
  setRegPassword,
  regConfirmPassword,
  setRegConfirmPassword,
  regPhone,
  setRegPhone,
  regEmergencyPhone,
  setRegEmergencyPhone,
  regAddress,
  setRegAddress,
  regLatLong,
  setRegLatLong,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  gpsLoading,
  errorMsg,
  onSubmit,
  onAcquireGPS,
  onGoogleRegister,
  onSwitchToLogin,
}: RegisterViewProps) {
  return (
    <div className="flex-1 flex flex-col justify-between h-full py-2 overflow-y-auto">
      <div className="space-y-5 my-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3.5">
            <img
              src="/img/icon.png"
              alt="SI AMAN AI Logo"
              className="w-16 h-16 object-contain"
            />
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Daftar
            </h2>
          </div>
          <div className="text-center">
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-70 mx-auto">
              Silahkan daftarkan akun anda untuk menikmati fasilitas dengan
              mengisi beberapa formulir yang kami sediakan
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl text-center font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
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
              type={showPassword ? "text" : "password"}
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
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Konfirmasi Kata Sandi */}
          <div className="relative flex items-center">
            <Lock className="absolute left-4 w-4 h-4 text-slate-500" />
            <input
              type={showConfirmPassword ? "text" : "password"}
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
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
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

          {/* Lat, Long with automatic GPS fetch button */}
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
              onClick={onAcquireGPS}
              className="absolute right-2 px-2.5 py-1 bg-[#114B5F] hover:bg-[#0e3b4b] text-white text-[9px] font-bold rounded-lg transition-colors"
            >
              {gpsLoading ? "Melacak..." : "Ambil GPS"}
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
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-4 text-[9px] font-bold bg-slate-100 text-slate-400 py-1 px-2.5 rounded-md uppercase">
              Daftar Metode Lain
            </span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          {/* Google Sign-up */}
          <button
            type="button"
            onClick={onGoogleRegister}
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
      </div>

      {/* Switch to Login */}
      <div className="text-center pt-5 mt-auto">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-xs text-slate-500 font-medium"
        >
          Sudah Memiliki Akun?{" "}
          <strong className="text-[#114B5F] hover:underline">Masuk</strong>
        </button>
      </div>
    </div>
  );
}
