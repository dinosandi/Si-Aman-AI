import React from "react";
import { Link } from "@tanstack/react-router";
import { Badge } from "../atoms/Badge";

interface TabItemProps {
  to: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  label: string;
  isActive: boolean;
  badgeContent?: string | number;
  onClick?: () => void;
}

export function TabItem({
  to,
  icon,
  activeIcon,
  label,
  isActive,
  badgeContent,
  onClick,
}: TabItemProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 py-1 px-3.5 relative transition-all duration-200 ${
        isActive
          ? "text-[#114B5F] scale-105"
          : "text-slate-400 hover:text-slate-600 hover:scale-102"
      }`}
    >
      <div className="relative">
        {isActive && activeIcon ? activeIcon : icon}
        {badgeContent !== undefined && (
          <Badge content={badgeContent} className="absolute -top-1.5 -right-2" />
        )}
      </div>
      <span
        className={`text-[9px] font-extrabold tracking-wider ${
          isActive ? "text-[#114B5F]" : "text-slate-400"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
