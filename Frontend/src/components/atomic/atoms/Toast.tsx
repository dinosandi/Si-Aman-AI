import React, { useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  onClose,
  duration = 4000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration, message, type]);

  return (
    <div className="fixed top-4 left-4 right-4 z-[9999] pointer-events-none animate-fade-in-up">
      <div
        className={`p-4 rounded-2xl shadow-xl border flex items-center gap-3 max-w-sm mx-auto backdrop-blur-md pointer-events-auto ${
          type === "success"
            ? "bg-emerald-500/90 border-emerald-400 text-white"
            : "bg-rose-500/90 border-rose-400 text-white"
        }`}
      >
        {type === "success" ? (
          <CheckCircle className="w-5 h-5 shrink-0 text-white" />
        ) : (
          <XCircle className="w-5 h-5 shrink-0 text-white" />
        )}
        <span className="text-[11px] font-black leading-snug">
          {message}
        </span>
      </div>
    </div>
  );
};
