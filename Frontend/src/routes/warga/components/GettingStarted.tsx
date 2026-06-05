interface GettingStartedProps {
  onStart: () => void;
}

export function GettingStarted({ onStart }: GettingStartedProps) {
  return (
    <div className="flex-1 bg-slate-100 flex justify-center items-center min-h-screen">
      {/* Mobile-first constraints frame */}
      <div className="w-full max-w-md min-h-screen bg-white border-x border-slate-200 flex flex-col overflow-hidden">
        {/* Full width top image asset */}
        <div className="w-full">
          <img
            src="/img/getting-started.png"
            alt="Getting Started"
            className="w-full object-cover aspect-4/3 sm:aspect-auto"
          />
        </div>

        {/* Text & Button content section */}
        <div className="flex-1 bg-white px-8 py-8 flex flex-col justify-between text-center">
          <div className="my-auto space-y-4">
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              Langkah Pertama menuju perjalanan aman dan nyaman
            </h2>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Si Aman AI memetakan keamanan Madiun secara real-time dari laporan
              Anda. Temukan rute teraman, bukan sekadar tercepat, dengan
              kekuatan AI dan komunitas
            </p>
          </div>

          <div className="mt-8 mb-4">
            <button
              onClick={onStart}
              className="w-full inline-flex justify-center items-center py-3.5 bg-[#114B5F] hover:bg-[#0d3b4b] text-white font-bold text-xs rounded-lg transition-colors tracking-wide"
            >
              Mulai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
