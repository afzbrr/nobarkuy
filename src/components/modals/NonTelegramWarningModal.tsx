import React from 'react';
import { Smartphone, ExternalLink } from 'lucide-react';

export const NonTelegramWarningModal: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#09070F] flex items-center justify-center p-5 select-none">
      <div className="w-full max-w-sm rounded-2xl bg-[#141414] border border-[#2B2B2B] p-6 text-center shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
          <Smartphone className="w-8 h-8" />
        </div>

        <h1 className="font-display font-extrabold text-xl uppercase tracking-wide nobar-title-shine mb-1">
          NOBAR KUY
        </h1>
        <p className="text-[11px] text-stone-400 mb-4">Nobar &amp; Hias Border</p>

        <p className="text-xs text-stone-300 leading-relaxed mb-6">
          Buka aplikasi NOBAR KUY langsung dari Telegram biar akun, foto profil, border, dan koin lu otomatis nyambung.
        </p>

        <a
          href="https://t.me/NOBARKUYBot"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 rounded-xl bg-[#2AABEE] hover:bg-[#229ED9] text-white font-heading font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-lg shadow-sky-500/20"
        >
          <ExternalLink className="w-4 h-4" />
          Masuk dengan Telegram
        </a>
      </div>
    </div>
  );
};
