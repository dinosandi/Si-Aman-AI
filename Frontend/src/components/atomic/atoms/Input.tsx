import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

export function Input({
  leftIcon,
  rightIcon,
  containerClassName = "",
  className = "",
  type = "text",
  ...props
}: InputProps) {
  return (
    <div
      className={`flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 shadow-sm transition-all focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/10 ${containerClassName}`}
    >
      {leftIcon && <div className="text-slate-400 shrink-0">{leftIcon}</div>}
      <input
        type={type}
        className={`w-full text-xs text-slate-700 bg-transparent outline-none placeholder-slate-400 ${className}`}
        {...props}
      />
      {rightIcon && <div className="text-slate-400 shrink-0">{rightIcon}</div>}
    </div>
  );
}
