import React from "react";
import { Compass, Plus, Settings } from "lucide-react";

interface BottomNavProps {
  onRecenter: () => void;
  onPlusClick: () => void;
  onSettingsClick: () => void;
}

export function BottomNav({
  onRecenter,
  onPlusClick,
  onSettingsClick,
}: BottomNavProps) {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-1000 bg-white border border-slate-200 rounded-xl py-1.5 px-6 flex justify-between items-center shadow-sm">
      {/* Left: Compass / Recenter */}
      <button
        type="button"
        onClick={onRecenter}
        className="flex flex-col items-center justify-center text-[#114B5F] hover:text-[#0e3b4b] active:scale-95 transition-transform py-1"
        title="Recenter Map"
      >
        <Compass className="w-5 h-5" />
        <span className="w-3.5 h-0.5 bg-[#114B5F] rounded-full mt-1"></span>
      </button>

      {/* Center: Floating Circle Plus Action Button */}
      <button
        type="button"
        onClick={onPlusClick}
        className="w-12 h-12 bg-[#114B5F] hover:bg-[#0e3b4b] text-white rounded-full flex items-center justify-center -translate-y-5 border-4 border-white shadow-md active:scale-95 transition-transform shrink-0"
        title="Lapor Kerawanan Baru"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Right: Settings cog */}
      <button
        type="button"
        onClick={onSettingsClick}
        className="text-slate-400 hover:text-slate-600 active:scale-95 transition-transform py-2"
        title="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>
    </div>
  );
}
