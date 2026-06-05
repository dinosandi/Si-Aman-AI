interface BadgeProps {
  content?: string | number;
  variant?: "danger" | "success" | "warning" | "info" | "neutral";
  className?: string;
}

export function Badge({
  content,
  variant = "danger",
  className = "",
}: BadgeProps) {
  const variantClasses = {
    danger: "bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]",
    success: "bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    warning: "bg-amber-500 text-white shadow-[0_0_8px_rgba(245,158,11,0.5)]",
    info: "bg-blue-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.5)]",
    neutral: "bg-slate-400 text-white",
  };

  const isDot = content === undefined || content === "";

  if (isDot) {
    return (
      <span
        className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-red-500 border border-white animate-pulse ${className}`}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full text-[9px] font-black leading-none border border-white shrink-0 ${
        typeof content === "number" && content < 10
          ? "w-4.5 h-4.5"
          : "px-1.5 py-0.5 min-w-4.5 min-h-4.5"
      } ${variantClasses[variant]} ${className}`}
    >
      {content}
    </span>
  );
}
