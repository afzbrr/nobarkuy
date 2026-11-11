import React from 'react';
import { useApp } from '../../context/AppContext';
import { Smartphone, ExternalLink, Play } from 'lucide-react';

export const NonTelegramWarningModal: React.FC = () => {
  const { isNonTelegramWarningOpen, setIsNonTelegramWarningOpen, switchDevUser } = useApp();

  if (!isNonTelegramWarningOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md select-none">
      <div className="w-full max-w-sm rounded-2xl bg-[#141414] border border-[#2B2B2B] p-6 text-center shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
          <Smartphone className="w-8 h-8" />
        </div>

        <h3 className="font-heading font-bold text-lg text-white mb-2">
          Buka dari Telegram Ya!
        </h3>

        <p className="text-xs text-stone-300 leading-relaxed mb-6">
          Buka NOBAR KUY dari Telegram ya, biar langsung nyambung ke akun Telegram lu! Nama, foto profil, dan koin lu bakal otomatis tersinkronisasi.
        </p>

        <div className="space-y-2.5">
          <a
            href="https://t.me/NOBARKUYBot"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl bg-[#2AABEE] hover:bg-[#229ED9] text-white font-heading font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-lg shadow-sky-500/20"
          >
            <ExternalLink className="w-4 h-4" />
            Buka di Telegram (@NOBARKUYBot)
          </a>

          <button
            onClick={() => {
              setIsNonTelegramWarningOpen(false);
              switchDevUser('FAIZ');
            }}
            className="w-full py-2.5 rounded-xl bg-[#1E1E1E] hover:bg-[#262626] text-stone-300 font-medium text-xs flex items-center justify-center gap-2 transition-colors border border-[#333]"
          >
            <Play className="w-3.5 h-3.5 text-[#D4AF37]" />
            Lanjut Mode Pengujian (Preview Dev)
          </button>
        </div>
      </div>
    </div>
  );
};
