import React from 'react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from './UserAvatar';
import { Play, Crown } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    isOwner,
    setIsWalletModalOpen,
    setActiveTab,
  } = useApp();

  return (
    <header className="sticky top-0 z-40 select-none bg-gradient-to-r from-[#09070F] via-[#130C24] to-[#0B0914] backdrop-blur-md">
      <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between gap-2.5">
        {/* Left: 3D Popcorn+Play+Crown Logo & Animated NOBAR KUY Typography */}
        <button
          onClick={() => setActiveTab('beranda')}
          className="flex items-center gap-2.5 text-left group min-w-0"
        >
          {/* 3D Popcorn + Play + Crown App Icon */}
          <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
            {/* Soft outer pulse aura */}
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-tr from-[#FF6B00] via-[#FF2D55] to-[#7C3AED] opacity-65 blur-[5px] animate-subtle-pulse" />
            {/* Spinning subtle corner sparkle */}
            <span className="absolute -top-1 -right-1 z-20 text-[9px] text-amber-300 animate-spin-medium pointer-events-none">
              ✦
            </span>
            {/* Main 3D Rounded Icon */}
            <div
              className="relative z-10 w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B00] via-[#FF2D55] to-[#7C3AED] p-[1.5px] shadow-[0_6px_16px_rgba(255,45,85,0.4)] transition-transform duration-200 group-active:scale-95"
            >
              <div className="w-full h-full rounded-[10px] bg-gradient-to-b from-white/20 via-transparent to-black/30 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Inner top highlight */}
                <div className="absolute top-0 inset-x-1 h-2 rounded-full bg-white/30 blur-[1px]" />
                {/* Crown + Popcorn + Play composition */}
                <Crown className="w-2.5 h-2.5 text-[#FDE047] fill-[#FDE047] -mb-0.5 drop-shadow" />
                <div className="flex items-center gap-0.5">
                  <span className="text-[11px] leading-none drop-shadow">🍿</span>
                  <Play className="w-2.5 h-2.5 text-white fill-white drop-shadow" />
                </div>
              </div>
            </div>
          </div>

          {/* Animated Title + Sparkles + Light Dust + Underline + Subtitle */}
          <div className="min-w-0 relative">
            <div className="relative inline-flex items-center gap-1.5 pr-3">
              {/* Twinkling Sparkles around text */}
              <span className="absolute -top-1 -left-1 text-[8px] text-amber-300 animate-sparkle pointer-events-none">
                ✦
              </span>
              <span
                className="absolute -top-0.5 right-0 text-[8px] text-orange-300 animate-sparkle pointer-events-none"
                style={{ animationDelay: '0.6s' }}
              >
                ✦
              </span>
              <span
                className="w-1 h-1 rounded-full bg-amber-200/80 absolute bottom-0.5 right-1.5 animate-dust pointer-events-none"
              />
              <span
                className="w-0.5 h-0.5 rounded-full bg-violet-300/80 absolute top-0 left-1/2 animate-dust pointer-events-none"
                style={{ animationDelay: '1.1s' }}
              />

              <span className="font-display font-extrabold text-[17px] uppercase tracking-wider leading-none nobar-title-shine">
                NOBAR KUY
              </span>
            </div>

            {/* Thin glowing underline */}
            <div className="h-[1.5px] w-24 mt-1 rounded-full bg-gradient-to-r from-[#FF6B00] via-[#FF2D55] to-[#7C3AED] opacity-85 shadow-[0_0_6px_rgba(255,107,0,0.6)]" />

            <p className="text-[9.5px] text-stone-300/85 font-medium tracking-wide leading-none mt-1 truncate">
              Nobar &amp; Hias Border
            </p>
          </div>
        </button>

        {/* Right Actions: OWNER badge (@istamina ONLY) + Glassmorphism Coin Pill + Profile Avatar */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isOwner && (
            <span className="px-2 py-0.5 rounded-md text-[9.5px] font-heading font-extrabold uppercase tracking-wider bg-gradient-to-r from-[#FDE047] via-[#D4AF37] to-[#EA580C] text-black shadow-[0_0_10px_rgba(212,175,55,0.45)]">
              OWNER
            </span>
          )}

          {/* Glassmorphism Coin Balance Pill */}
          <button
            onClick={() => setIsWalletModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.12] backdrop-blur-md border border-white/15 hover:border-[#D4AF37]/50 transition-all active:scale-95 shadow-inner"
            title="Dompet Coin Lu"
          >
            <span className="text-xs leading-none">🪙</span>
            <span className="font-heading font-bold text-[11px] tracking-tight text-white">
              {isOwner ? '∞ Infinity' : currentUser.coin.toLocaleString('id-ID')}
            </span>
          </button>

          {/* Right Circular Avatar -> Opens Profil */}
          <button
            onClick={() => setActiveTab('profil')}
            className="focus:outline-none transition-transform active:scale-95"
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

      {/* Bottom Thin Gradient Neon Border */}
      <div className="h-[1px] w-full bg-gradient-to-r from-[#FF6B00]/50 via-[#FF2D55]/60 to-[#7C3AED]/55 shadow-[0_0_8px_rgba(124,58,237,0.45)]" />
    </header>
  );
};
