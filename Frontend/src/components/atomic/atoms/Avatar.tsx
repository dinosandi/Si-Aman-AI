interface AvatarProps {
  src?: string;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg";
  ringColor?: string;
  isActive?: boolean;
  className?: string;
}

export function Avatar({
  src,
  alt = "User Avatar",
  size = "md",
  ringColor = "border-emerald-400",
  isActive = false,
  className = "",
}: AvatarProps) {
  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const ringSizes = {
    xs: "border",
    sm: "border-2",
    md: "border-2",
    lg: "border-3",
  };

  const defaultAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(alt)}`;

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden ${ringSizes[size]} ${ringColor} bg-slate-100 shadow-[0_0_8px_rgba(52,211,153,0.3)] transition-transform duration-200 active:scale-95`}
      >
        <img
          src={src || defaultAvatar}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      {isActive && (
        <span className="absolute bottom-0 right-0 block w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
      )}
    </div>
  );
}
