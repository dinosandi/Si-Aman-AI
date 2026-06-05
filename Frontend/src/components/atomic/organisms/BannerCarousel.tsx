import { ChevronRight, ShieldCheck, Map, BellRing } from "lucide-react";

interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  gradient: string;
  icon: React.ReactNode;
  btnText: string;
  onClick: () => void;
}

interface BannerCarouselProps {
  onBannerClick: (id: string) => void;
}

export function BannerCarousel({ onBannerClick }: BannerCarouselProps) {
  const banners: BannerItem[] = [
    {
      id: "ai_route",
      title: "Rute Aman AI",
      subtitle: "Hindari begal & jalan gelap secara otomatis.",
      badge: "FITUR AI",
      gradient: "from-cyan-400 to-blue-500 shadow-[0_6px_20px_rgba(56,189,248,0.25)]",
      icon: <Map className="w-8 h-8 text-white/20 absolute -right-2 -bottom-2 transform rotate-12" />,
      btnText: "Mulai Rute",
      onClick: () => onBannerClick("ai_route"),
    },
    {
      id: "ronda_madiun",
      title: "Patroli Bersama",
      subtitle: "Daftar jadwal ronda malam di lingkungan Anda.",
      badge: "Ronda Warga",
      gradient: "from-emerald-400 to-teal-500 shadow-[0_6px_20px_rgba(52,211,153,0.25)]",
      icon: <ShieldCheck className="w-8 h-8 text-white/20 absolute -right-2 -bottom-2 transform rotate-12" />,
      btnText: "Gabung Patroli",
      onClick: () => onBannerClick("ronda_madiun"),
    },
    {
      id: "broadcast_news",
      title: "Peringatan Siaga",
      subtitle: "Kabar darurat terkini dari BPBD Madiun.",
      badge: "INFO PENTING",
      gradient: "from-amber-400 to-orange-500 shadow-[0_6px_20px_rgba(251,191,36,0.25)]",
      icon: <BellRing className="w-8 h-8 text-white/20 absolute -right-2 -bottom-2 transform rotate-12" />,
      btnText: "Cek Siaga",
      onClick: () => onBannerClick("broadcast_news"),
    },
  ];

  return (
    <div className="w-full overflow-x-auto scrollbar-none flex gap-3 px-4 py-2 select-none snap-x snap-mandatory">
      {banners.map((item) => (
        <div
          key={item.id}
          className={`relative min-w-[245px] w-[245px] h-32 rounded-3xl p-4 flex flex-col justify-between text-white bg-gradient-to-br ${item.gradient} snap-start shrink-0 cursor-pointer overflow-hidden border border-white/10`}
          onClick={item.onClick}
        >
          {/* Decorative background icon */}
          {item.icon}

          <div className="space-y-1">
            <span className="bg-white/25 text-[8px] uppercase font-black px-2 py-0.5 rounded-full inline-block backdrop-blur-sm tracking-wider">
              {item.badge}
            </span>
            <h4 className="text-sm font-black tracking-tight leading-tight mt-1">
              {item.title}
            </h4>
            <p className="text-[9px] text-white/85 leading-snug font-bold max-w-[85%]">
              {item.subtitle}
            </p>
          </div>

          <div className="flex justify-between items-center mt-2">
            <button
              type="button"
              className="bg-slate-900/90 text-white rounded-full px-3.5 py-1.5 text-[9px] font-black tracking-wider flex items-center gap-1 shadow-md hover:bg-slate-800 transition-colors"
            >
              <span>{item.btnText}</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
