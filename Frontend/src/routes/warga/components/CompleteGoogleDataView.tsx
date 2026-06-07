import React from "react";
import { Lock, Eye, EyeOff, Phone } from "lucide-react";

interface CompleteGoogleDataViewProps {
  regPassword: string;
  setRegPassword: (val: string) => void;
  regConfirmPassword: string;
  setRegConfirmPassword: (val: string) => void;
  regPhone: string;
  setRegPhone: (val: string) => void;
  regEmergencyPhone: string;
  setRegEmergencyPhone: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (val: boolean) => void;
  errorMsg: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

export function CompleteGoogleDataView({
  regPassword,
  setRegPassword,
  regConfirmPassword,
  setRegConfirmPassword,
  regPhone,
  setRegPhone,
  regEmergencyPhone,
  setRegEmergencyPhone,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  errorMsg,
  onSubmit,
}: CompleteGoogleDataViewProps) {
  return (
    <div className="flex-1 flex flex-col justify-between h-full py-2 overflow-y-auto">
      <div className="space-y-5 my-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3.5">
            <img
              src="/img/icon.png"
              alt="SI AMAN Logo"
              className="w-16 h-16 object-contain"
            />
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Daftar
            </h2>
          </div>
          <div className="text-center">
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-70 mx-auto">
              Silahkan lengkapi akun anda untuk menikmati fasilitas dengan
              mengisi beberapa formulir yang kami sediakan
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl text-center font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Kata Sandi */}
          <div className="relative flex items-center">
            <Lock className="absolute left-4 w-4 h-4 text-slate-500" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              placeholder="Kata Sandi"
              className="w-full text-xs py-3 pl-11 pr-11 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#114B5F]"
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
              className="w-full text-xs py-3 pl-11 pr-11 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#114B5F]"
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
              className="w-full text-xs py-3 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#114B5F]"
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
              className="w-full text-xs py-3 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#114B5F]"
            />
          </div>

          {/* Kirim Button */}
          <button
            type="submit"
            className="w-full py-3.5 bg-[#114B5F] hover:bg-[#0e3b4b] text-white font-bold text-xs rounded-xl transition-colors tracking-wide"
          >
            Kirim
          </button>
        </form>
      </div>
    </div>
  );
}
