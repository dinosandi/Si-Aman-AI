import React from "react";
import { Bell } from "lucide-react";
import { SearchBar } from "../molecules/SearchBar";
import { Badge } from "../atoms/Badge";

interface SearchHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onNotificationClick: () => void;
  unreadNotifications?: number;
  className?: string;
}

export function SearchHeader({
  searchQuery,
  setSearchQuery,
  onSubmit,
  onNotificationClick,
  unreadNotifications = 5,
  className = "absolute top-4 left-4 right-4 z-1000",
}: SearchHeaderProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Search Bar Molecule */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onSubmit={onSubmit}
        placeholder="Cari Lokasi Tujuan Dengan Aman"
        className="shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
      />

      {/* Floating Bell Icon Button with Badge */}
      <button
        type="button"
        onClick={onNotificationClick}
        className="relative w-11 h-11 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex items-center justify-center text-slate-650 active:scale-95 transition-all duration-200 hover:bg-slate-50 shrink-0"
        title="Notifikasi Keamanan"
      >
        <Bell className="w-5 h-5 text-slate-700" />
        {unreadNotifications > 0 && (
          <Badge
            content={unreadNotifications}
            className="absolute -top-1 -right-1"
          />
        )}
      </button>
    </div>
  );
}
