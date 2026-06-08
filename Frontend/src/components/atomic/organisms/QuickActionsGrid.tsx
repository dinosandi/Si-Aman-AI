import { Users, Phone, AlertTriangle, Moon } from "lucide-react";

interface ActionItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  onClick: () => void;
}

interface QuickActionsGridProps {
  onActionClick: (id: string) => void;
}

export function QuickActionsGrid({ onActionClick }: QuickActionsGridProps) {
  const actions: ActionItem[] = [
    {
      id: "ronda",
      title: "Ronda Warga",
      description: "Patroli Aktif",
      icon: <Users className="w-5 h-5" />,
      bgColor: "bg-emerald-50 hover:bg-emerald-100/80 border-emerald-100/50",
      iconColor: "text-emerald-500",
      onClick: () => onActionClick("ronda"),
    },
    {
      id: "risk_zones",
      title: "Zona Rawan",
      description: "Peta Bahaya",
      icon: <AlertTriangle className="w-5 h-5" />,
      bgColor: "bg-amber-50 hover:bg-amber-100/80 border-amber-100/50",
      iconColor: "text-amber-500",
      onClick: () => onActionClick("risk_zones"),
    },
    {
      id: "night_mode",
      title: "Jalur Gelap",
      description: "Minim Lampu",
      icon: <Moon className="w-5 h-5" />,
      bgColor: "bg-indigo-50 hover:bg-indigo-100/80 border-indigo-100/50",
      iconColor: "text-indigo-500",
      onClick: () => onActionClick("night_mode"),
    },
    {
      id: "hotlines",
      title: "Hotline Darurat",
      description: "Kontak Cepat",
      icon: <Phone className="w-5 h-5" />,
      bgColor: "bg-red-50 hover:bg-red-100/80 border-red-100/50",
      iconColor: "text-red-500",
      onClick: () => onActionClick("hotlines"),
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5 px-4 py-3 bg-white border border-slate-100 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] mx-4 mt-2">
      {actions.map((act) => (
        <button
          key={act.id}
          onClick={act.onClick}
          className="flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 active:scale-95 text-center group"
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center border ${act.bgColor} transition-transform duration-200 group-hover:-translate-y-0.5 shadow-sm mb-1.5`}
          >
            <div className={act.iconColor}>{act.icon}</div>
          </div>
          <span className="text-[10px] font-black text-slate-800 tracking-tight block">
            {act.title}
          </span>
          <span className="text-[8px] text-slate-400 font-bold block mt-0.5 leading-none">
            {act.description}
          </span>
        </button>
      ))}
    </div>
  );
}
