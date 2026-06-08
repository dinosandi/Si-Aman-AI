import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "floating" | "dark";
  size?: "sm" | "md" | "lg" | "icon";
  children: React.ReactNode;
  className?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const baseStyle =
    "inline-flex items-center justify-center font-bold transition-all duration-200 active:scale-95 focus:outline-none disabled:opacity-50 disabled:pointer-events-none select-none";

  const variants = {
    primary:
      "bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-[0_4px_12px_rgba(16,185,129,0.2)] border border-emerald-400/20",
    secondary:
      "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl shadow-sm",
    danger:
      "bg-red-500 hover:bg-red-600 text-white rounded-2xl shadow-[0_4px_12px_rgba(239,68,68,0.2)] border border-red-400/20",
    ghost: "text-slate-500 hover:bg-slate-100/50 hover:text-slate-700 rounded-xl",
    dark: "bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-lg border border-slate-800",
    floating:
      "bg-white text-slate-700 rounded-full shadow-lg border border-slate-100 hover:bg-slate-50",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-5 py-2.5 text-xs",
    lg: "px-6 py-3 text-sm",
    icon: "p-2.5 rounded-full shrink-0",
  };

  return (
    <button
      type={type}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
