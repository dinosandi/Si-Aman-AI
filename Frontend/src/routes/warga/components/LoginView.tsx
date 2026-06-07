import React from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

interface LoginViewProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  errorMsg: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleLogin: () => void;
  onSwitchToRegister: () => void;
}

export function LoginView({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  errorMsg,
  onSubmit,
  onGoogleLogin,
  onSwitchToRegister,
}: LoginViewProps) {
  return (
    <div className="flex-1 flex flex-col justify-between h-full py-2 overflow-y-auto">
      <div className="space-y-5 my-auto">
        <div className="space-y-4">
          <div className="flex justify-center">
            <img
              src="/img/icon.png"
              alt="SI AMAN Logo"
              className="w-24 h-24 object-contain"
            />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Masuk
            </h2>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-68.75 mx-auto">
              Jika ingin masuk kedalam sistem kami bisa masukkan E-mail dan
              password yang telah di daftarkan.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl text-center font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3.5">
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
              type={showPassword ? "text" : "password"}
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
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Lupa password */}
          <div className="text-right">
            <button
              type="button"
              onClick={() =>
                alert("Fitur pemulihan kata sandi sedang dalam pengembangan.")
              }
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
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-4 text-[9px] font-bold bg-slate-100 text-slate-400 py-1 px-2.5 rounded-md uppercase">
              Metode Lain
            </span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={onGoogleLogin}
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
      </div>

      {/* Switch to Register */}
      <div className="text-center pt-5 mt-auto">
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-xs text-slate-500 font-medium"
        >
          Tidak Memiliki Akun?{" "}
          <strong className="text-[#114B5F] hover:underline">Daftar</strong>
        </button>
      </div>
    </div>
  );
}
