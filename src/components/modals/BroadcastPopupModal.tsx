import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Megaphone, CheckCircle } from 'lucide-react';

export const BroadcastPopupModal: React.FC = () => {
  const { activeBroadcastPopup, dismissBroadcastPopup, setActiveTab } = useApp();
  const [countdown, setCountdown] = useState<number>(3);

  useEffect(() => {
    if (!activeBroadcastPopup) {
      setCountdown(3);
      return;
    }

    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeBroadcastPopup]);

  if (!activeBroadcastPopup) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-sm rounded-2xl bg-[#141414] border border-[#D4AF37]/40 p-6 shadow-[0_0_30px_rgba(212,175,55,0.15)] text-center relative overflow-hidden">
        {/* Shimmer accent */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Icon */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-4">
          <Megaphone className="w-7 h-7" />
        </div>

        {/* Badge */}
        <div className="inline-block px-2.5 py-1 rounded-full bg-[#222] border border-[#333] text-[10px] font-semibold text-[#D4AF37] tracking-wider uppercase mb-2">
          PENGUMUMAN RESMI OWNER FAIZ
        </div>

        {/* Title */}
        <h3 className="font-heading font-bold text-lg text-white mb-2 leading-snug">
          {activeBroadcastPopup.judul}
        </h3>

        {/* Message */}
        <p className="text-stone-300 text-sm leading-relaxed mb-6 whitespace-pre-wrap">
          {activeBroadcastPopup.pesan}
        </p>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            disabled={countdown > 0}
            onClick={() => {
              dismissBroadcastPopup();
              setActiveTab('beranda');
            }}
            className={`w-full py-3 rounded-xl font-heading font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              countdown > 0
                ? 'bg-[#222] text-stone-500 cursor-not-allowed'
                : 'bg-white hover:bg-stone-200 text-black shadow-lg'
            }`}
          >
            {countdown > 0 ? (
              <span>Tunggu {countdown} detik...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-black" />
                <span>Oke, Gue Paham!</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
