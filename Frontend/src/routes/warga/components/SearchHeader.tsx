import React from "react";
import { Search, Bell } from "lucide-react";

interface SearchHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onNotificationClick: () => void;
}

export function SearchHeader({
  searchQuery,
  setSearchQuery,
  onSubmit,
  onNotificationClick,
}: SearchHeaderProps) {
  return (
    <div className="absolute top-4 left-4 right-4 z-1000 flex items-center gap-3">
      {/* Search Input Box */}
      <form
        onSubmit={onSubmit}
        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex items-center gap-2 shadow-sm"
      >
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari Lokasi Tujuan"
          className="w-full text-xs text-slate-700 bg-transparent outline-none placeholder-slate-400"
        />
      </form>

      {/* Bell Button with badge 5 */}
      <button
        type="button"
        onClick={onNotificationClick}
        className="relative w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 active:scale-95 transition-transform shrink-0"
      >
        <Bell className="w-4.5 h-4.5" />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
          5
        </span>
      </button>
    </div>
  );
}
