import React from "react";
import { Search } from "lucide-react";
import { Input } from "../atoms/Input";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit?: (e: React.FormEvent) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Cari Lokasi Tujuan",
  className = "",
}: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    if (onSubmit) {
      onSubmit(e);
    } else {
      e.preventDefault();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex-1 ${className}`}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        leftIcon={<Search className="w-4 h-4" />}
        containerClassName="bg-white/95 backdrop-blur-md border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-2xl"
      />
    </form>
  );
}
