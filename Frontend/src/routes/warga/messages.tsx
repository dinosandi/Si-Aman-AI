import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageSquare, Bell, Check, AlertTriangle, AlertOctagon } from "lucide-react";
import { Avatar } from "../../components/atomic/atoms/Avatar";

export const Route = createFileRoute("/warga/messages")({
  component: WargaMessages,
});

interface SafetyMessage {
  id: string;
  sender: string;
  senderAvatarSeed: string;
  type: "warning" | "danger" | "info";
  title: string;
  body: string;
  time: string;
  isRead: boolean;
}

function WargaMessages() {
  const [messages, setMessages] = useState<SafetyMessage[]>([
    {
      id: "msg-1",
      sender: "Polsek Mejayan",
      senderAvatarSeed: "police",
      type: "danger",
      title: "Laporan Begal di Jalan Ring Road",
      body: "Waspada saat melintas di Ring Road Mejayan arah Saradan malam ini. Dilaporkan ada tindakan kriminal begal bermotor pada pukul 23:00. Gunakan rute alternatif utama.",
      time: "10 Menit Lalu",
      isRead: false,
    },
    {
      id: "msg-2",
      sender: "BPBD Kab. Madiun",
      senderAvatarSeed: "disaster",
      type: "warning",
      title: "Pohon Tumbang Jalur Kare",
      body: "Sebuah pohon jati tumbang menghalangi sebagian jalan raya Kare-Dungus akibat hujan deras. Evakuasi sedang berlangsung, harap kurangi kecepatan melintas.",
      time: "1 Jam Lalu",
      isRead: false,
    },
    {
      id: "msg-3",
      sender: "Sistem Keamanan AI",
      senderAvatarSeed: "ai",
      type: "info",
      title: "Analisis Rute Aman Selesai",
      body: "Sistem kecerdasan buatan telah memperbarui rute teraman wilayah Caruban. Beberapa jalan rusak dihindari dan dialihkan ke rute dengan lampu penerangan jalan aktif.",
      time: "3 Jam Lalu",
      isRead: true,
    },
    {
      id: "msg-4",
      sender: "Polres Madiun Kota",
      senderAvatarSeed: "polres",
      type: "info",
      title: "Sosialisasi Ronda Malam",
      body: "Imbauan untuk meningkatkan siskamling di perumahan area Wungu demi mencegah kejahatan malam hari menjelang libur akhir pekan.",
      time: "Kemarin",
      isRead: true,
    },
  ]);

  const handleMarkAllRead = () => {
    setMessages(messages.map((m) => ({ ...m, isRead: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "danger":
        return <AlertOctagon className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };



  return (
    <div className="flex flex-col flex-1 p-5 space-y-4 bg-slate-50 min-h-screen pb-24">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="bg-emerald-50 p-2.5 rounded-2xl border border-emerald-100 shadow-sm">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-sm leading-tight">
              Pesan & Siaga
            </h3>
            <p className="text-[10px] text-slate-400 font-bold">
              Informasi kerawanan & darurat dari otoritas.
            </p>
          </div>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="text-[10px] text-[#114B5F] bg-[#114B5F]/5 border border-[#114B5F]/10 px-3 py-1.5 rounded-xl font-black flex items-center gap-1 active:scale-95 transition-all"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Tandai Semua Dibaca</span>
        </button>
      </div>

      {/* Message List */}
      <div className="space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-4 rounded-3xl border transition-all duration-200 ${
              msg.isRead ? "bg-white border-slate-150" : "bg-white border-slate-200 ring-2 ring-emerald-500/5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Left: Avatar with type overlay */}
              <div className="relative shrink-0">
                <Avatar
                  size="sm"
                  alt={msg.sender}
                  ringColor={msg.isRead ? "border-slate-200" : "border-emerald-400"}
                />
                <span className={`absolute -bottom-1 -right-1 p-0.5 rounded-full border border-white ${
                  msg.type === "danger" ? "bg-red-100" : msg.type === "warning" ? "bg-amber-100" : "bg-blue-100"
                }`}>
                  {getIcon(msg.type)}
                </span>
              </div>

              {/* Middle/Right content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex justify-between items-baseline gap-2">
                  <h4 className="text-xs font-black text-slate-800 truncate">
                    {msg.sender}
                  </h4>
                  <span className="text-[8px] text-slate-400 font-bold shrink-0">
                    {msg.time}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {!msg.isRead && (
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  )}
                  <h5 className={`text-xs font-black ${msg.isRead ? "text-slate-700" : "text-slate-900"}`}>
                    {msg.title}
                  </h5>
                </div>

                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  {msg.body}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
