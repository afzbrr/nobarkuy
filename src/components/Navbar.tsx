import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from './UserAvatar';
import { Sparkles, Shield, ChevronDown, Smartphone, Coins } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    isOwner,
    setIsWalletModalOpen,
    setActiveTab,
    activeTab,
    switchDevUser,
  } = useApp();

  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#1E1E1E] px-4 py-3 select-none">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('beranda')}
            className="flex items-center gap-2 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#141414] border border-[#262626] flex items-center justify-center text-[#D4AF37] group-hover:border-[#D4AF37]/50 transition-colors">
              <span className="font-heading font-black text-sm tracking-tighter">NK</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-bold text-base tracking-tight text-white">
                  NOBAR KUY
                </span>
                {isOwner && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                    OWNER
                  </span>
                )}
              </div>
              <p className="text-[10px] text-stone-400 font-normal leading-none">
                Nobar & Hias Border
              </p>
            </div>
          </button>
        </div>

        {/* Right Actions: Dev Switcher & Coin Balance */}
        <div className="flex items-center gap-2">
          {/* Dev Account Switcher (Convenient for preview testing) */}
          <div className="relative">
            <button
              onClick={() => setIsDevMenuOpen(!isDevMenuOpen)}
              title="Ganti Akun Simulasi Telegram"
              className="px-2 py-1.5 rounded-lg bg-[#141414] border border-[#262626] text-stone-300 hover:text-white flex items-center gap-1 text-[11px] font-medium transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5 text-stone-400" />
              <span className="hidden sm:inline max-w-[65px] truncate">{currentUser.nama.split(' ')[0]}</span>
              <ChevronDown className="w-3 h-3 text-stone-500" />
            </button>

            {isDevMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#141414] border border-[#262626] shadow-2xl p-2 z-50 text-xs">
                <div className="px-2 py-1 text-[10px] uppercase font-bold text-stone-400 border-b border-[#222]">
                  Simulasi Akun Telegram
                </div>
                <button
                  onClick={() => {
                    switchDevUser('FAIZ');
                    setIsDevMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between hover:bg-[#1E1E1E] transition-colors ${
                    currentUser.user_id === '6189849073' ? 'bg-[#1E1E1E] text-[#D4AF37] font-semibold' : 'text-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">👑</span>
                    <div>
                      <div>Faiz (Owner)</div>
                      <div className="text-[10px] text-stone-400 font-normal">Coin: ∞ • @istamina</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    switchDevUser('BIMO');
                    setIsDevMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between hover:bg-[#1E1E1E] transition-colors ${
                    currentUser.user_id === '198471239' ? 'bg-[#1E1E1E] text-white font-semibold' : 'text-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">👤</span>
                    <div>
                      <div>Bimo Prakoso</div>
                      <div className="text-[10px] text-stone-400 font-normal">Regular • @bimo12</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    switchDevUser('AYU');
                    setIsDevMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between hover:bg-[#1E1E1E] transition-colors ${
                    currentUser.user_id === '284719283' ? 'bg-[#1E1E1E] text-white font-semibold' : 'text-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🌸</span>
                    <div>
                      <div>Ayu Alodia</div>
                      <div className="text-[10px] text-stone-400 font-normal">Host • @ayualodia</div>
                    </div>
                  </div>
                </button>
                <div className="border-t border-[#222] my-1 pt-1">
                  <button
                    onClick={() => {
                      switchDevUser('NONE');
                      setIsDevMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 text-[11px]"
                  >
                    Simulasi Browser Biasa (Non-Telegram)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Coin Wallet Button */}
          <button
            onClick={() => setIsWalletModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141414] border border-[#262626] hover:border-[#D4AF37]/40 transition-colors"
          >
            <span className="text-sm leading-none">🪙</span>
            <span className="font-heading font-bold text-xs tracking-tight text-white">
              {isOwner ? '∞ Infinity' : currentUser.coin.toLocaleString('id-ID')}
            </span>
          </button>

          {/* User Avatar thumbnail -> opens profile */}
          <button
            onClick={() => setActiveTab('profil')}
            className="focus:outline-none"
            title="Buka Profil Lu"
          >
            <UserAvatar
              foto={currentUser.foto}
              nama={currentUser.nama}
              borderId={currentUser.border_saat_ini}
              decorations={currentUser.decorations}
              size="sm"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
