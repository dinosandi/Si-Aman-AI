import { Home } from "lucide-react";
import { TabItem } from "../molecules/TabItem";
import { Avatar } from "../atoms/Avatar";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";

interface BottomNavProps {
  onPlusClick?: () => void;
  unreadMessagesCount?: number;
}

export function BottomNav({
  onPlusClick,
}: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const isTabActive = (path: string) => {
    if (path === "/warga" && (currentPath === "/warga" || currentPath === "/warga/")) {
      return true;
    }
    return currentPath === path;
  };

  const handlePlusClick = () => {
    if (onPlusClick) {
      onPlusClick();
    } else {
      // Default to navigating to report safety
      navigate({ to: "/warga/report-safety" });
    }
  };

  // Retrieve user name for avatar seed
  const storedUser = localStorage.getItem("warga_current_user");
  const userName = storedUser ? JSON.parse(storedUser).name : "Warga Madiun";

  return (
    <div className="w-full bg-white border-t border-slate-150 py-1.5 px-6 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.02)] shrink-0 z-50">
      {/* 1. Beranda */}
      <TabItem
        to="/warga"
        icon={<Home className="w-5.5 h-5.5" />}
        activeIcon={<Home className="w-5.5 h-5.5 text-[#114B5F]" />}
        label="Beranda"
        isActive={isTabActive("/warga")}
      />

      {/* 2. Central Plus button (TikTok Style Rounded Square) */}
      <div className="flex items-center justify-center py-2 shrink-0">
        <button
          type="button"
          onClick={handlePlusClick}
          className="relative w-12 h-7.5 bg-slate-950 text-white rounded-lg flex items-center justify-center transition-all duration-200 active:scale-90 pointer-events-auto shrink-0 group"
          title="Lapor Kerawanan"
        >
          {/* Theme-consistent colored accents */}
          <div className="absolute inset-0 bg-[#114B5F] rounded-lg -translate-x-1 transition-transform -z-10"></div>
          <div className="absolute inset-0 bg-emerald-400 rounded-lg translate-x-1 transition-transform -z-10"></div>
          
          {/* Main button cover */}
          <div className="absolute inset-0 bg-slate-950 rounded-lg flex items-center justify-center border border-slate-900">
            <span className="text-base font-black leading-none text-white select-none">+</span>
          </div>
        </button>
      </div>

      {/* 3. Profil */}
      <Link
        to="/warga/profile"
        className={`flex flex-col items-center justify-center gap-1 py-1 px-3.5 relative transition-all duration-200 ${
          isTabActive("/warga/profile") ? "scale-105" : "hover:scale-102"
        }`}
      >
        <Avatar
          size="xs"
          alt={userName}
          ringColor={isTabActive("/warga/profile") ? "border-[#114B5F]" : "border-white"}
          className="shadow-sm"
        />
        <span
          className={`text-[9px] font-extrabold tracking-wider ${
            isTabActive("/warga/profile") ? "text-[#114B5F]" : "text-slate-400"
          }`}
        >
          Profil
        </span>
      </Link>
    </div>
  );
}
