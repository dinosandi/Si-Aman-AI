import { createFileRoute } from "@tanstack/react-router";
import {
  User,
  Phone,
  MapPin,
  ShieldAlert,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Avatar } from "../../components/atomic/atoms/Avatar";
import { Button } from "../../components/atomic/atoms/Button";

export const Route = createFileRoute("/warga/profile")({
  component: WargaProfile,
});

function WargaProfile() {
  // Retrieve current user
  const storedUser = localStorage.getItem("warga_current_user");
  const user = storedUser
    ? JSON.parse(storedUser)
    : {
        name: "Warga Madiun",
        email: "warga@siaman.id",
        phone: "081234567890",
        emergencyPhone: "081234567899",
        address: "Kecamatan Mejayan, Kabupaten Madiun",
        latLong: "-7.616700, 111.650000",
      };

  const handleLogout = () => {
    localStorage.removeItem("warga_authenticated");
    localStorage.removeItem("warga_current_user");
    // Force layout reload to login form
    window.location.href = "/warga";
  };

  return (
    <div className="flex flex-col flex-1 p-5 space-y-4 bg-slate-50 min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="bg-emerald-50 p-2.5 rounded-2xl border border-emerald-100 shadow-sm">
          <User className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-black text-slate-800 text-sm leading-tight">
            Profil Warga
          </h3>
          <p className="text-[10px] text-slate-400 font-bold">Detail akun</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl flex flex-col items-center text-center space-y-3 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <Avatar
          size="lg"
          alt={user.name}
          ringColor="border-emerald-400 border-4"
        />
        <div>
          <h4 className="font-black text-slate-800 text-base">{user.name}</h4>
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full mt-1.5 tracking-wider">
            <ShieldCheck className="w-3 h-3" />
            <span>Terverifikasi</span>
          </span>
        </div>
      </div>

      {/* Details List */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
        <h5 className="text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-100 pb-2">
          Informasi Kontak
        </h5>

        {/* Email */}
        <div className="flex items-start gap-3 text-xs">
          <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-150 text-slate-500">
            <User className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
              Email
            </span>
            <span className="font-black text-slate-800">{user.email}</span>
          </div>
        </div>

        {/* Telepon */}
        <div className="flex items-start gap-3 text-xs">
          <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-150 text-slate-500">
            <Phone className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
              Nomor HP
            </span>
            <span className="font-black text-slate-800">
              {user.phone || "081234567890"}
            </span>
          </div>
        </div>

        {/* Alamat */}
        <div className="flex items-start gap-3 text-xs">
          <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-150 text-slate-500">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
              Alamat Rumah
            </span>
            <span className="font-black text-slate-800 leading-normal block">
              {user.address || "Kabupaten Madiun"}
            </span>
            {user.latLong && (
              <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-150 mt-1 inline-block">
                GPS: {user.latLong}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
