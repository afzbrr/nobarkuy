import React from 'react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from '../components/UserAvatar';
import {
  Coins,
  Trophy,
  Calendar,
  Film,
  Sparkles,
  Send,
  History,
  Palette,
  Shield,
  Copy,
  Info,
  ChevronRight,
} from 'lucide-react';

export const ProfilView: React.FC = () => {
  const {
    currentUser,
    isOwner,
    setIsWalletModalOpen,
    setIsTransferModalOpen,
    setActiveTab,
    setToast,
  } = useApp();

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* 1. PROFILE HEADER CARD (LOCKED TELEGRAM DATA) */}
      <div className="rounded-2xl bg-gradient-to-b from-[#181818] to-[#121212] border border-[#262626] p-6 text-center shadow-xl relative overflow-hidden">
        {/* Owner Badge */}
        {isOwner && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[10px] font-bold text-[#D4AF37] tracking-wider uppercase flex items-center gap-1">
            <span>👑</span>
            <span>OWNER</span>
          </div>
        )}

        {/* Circular Avatar + Border */}
        <div className="py-2 flex justify-center">
          <UserAvatar
            foto={currentUser.foto}
            nama={currentUser.nama}
            borderId={currentUser.border_saat_ini}
            customText={currentUser.custom_text}
            showCustomText={true}
            decorations={currentUser.decorations}
            size="2xl"
          />
        </div>

        {/* Telegram Name & Username (LOCKED, CANNOT BE EDITED MANUAL) */}
        <h3 className="font-heading font-black text-xl text-white mt-2">
          {currentUser.nama}
        </h3>
        <p className="text-xs text-[#D4AF37] font-medium">@{currentUser.username}</p>

        {/* Small Notice */}
        <div className="mt-3 p-2 rounded-xl bg-[#1A1A1A] border border-[#242424] flex items-center justify-center gap-1.5 text-[10px] text-stone-400">
          <Info className="w-3 h-3 text-stone-500 shrink-0" />
          <span>Data diambil dari akun Telegram lu, ganti di Telegram kalo mau ganti.</span>
        </div>

        {/* Owner Specific Banner */}
        {isOwner && (
          <div className="mt-3 p-2.5 rounded-xl bg-[#201A09] border border-[#D4AF37]/35 text-xs text-[#D4AF37] space-y-0.5 text-center">
            <div className="font-bold">🪙 Coin: ∞ Infinity (Owner)</div>
            <div className="text-[10px] text-stone-300">Tidak masuk Leaderboard (Owner)</div>
          </div>
        )}
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Coin Balance Card */}
        <button
          onClick={() => setIsWalletModalOpen(true)}
          className="p-3.5 rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#D4AF37]/40 flex flex-col items-start transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-xl bg-[#1E1E1E] flex items-center justify-center text-sm mb-2">
            🪙
          </div>
          <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">
            Saldo Coin
          </span>
          <span className="font-heading font-black text-lg text-white mt-0.5">
            {isOwner ? '∞ Infinity' : currentUser.coin.toLocaleString('id-ID')}
          </span>
          <span className="text-[9px] text-[#D4AF37] mt-1">Buka Dompet Lu →</span>
        </button>

        {/* Poin Leaderboard Card */}
        <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#262626] flex flex-col items-start">
          <div className="w-8 h-8 rounded-xl bg-[#1E1E1E] flex items-center justify-center text-sm mb-2 text-violet-400">
            <Trophy className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">
            Poin Leaderboard
          </span>
          <span className="font-heading font-black text-lg text-white mt-0.5">
            {currentUser.poin.toLocaleString('id-ID')} Poin
          </span>
          <span className="text-[9px] text-stone-500 mt-1">Dapet dari Quiz & Nobar</span>
        </div>

        {/* Check-in Streak */}
        <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#262626] flex flex-col items-start">
          <div className="w-8 h-8 rounded-xl bg-[#1E1E1E] flex items-center justify-center text-emerald-400 mb-2">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">
            Streak Check-in
          </span>
          <span className="font-heading font-black text-lg text-white mt-0.5">
            {currentUser.checkin_streak} Hari
          </span>
          <span className="text-[9px] text-stone-500 mt-1">Hari ke-{currentUser.checkin_hari_ke}</span>
        </div>

        {/* Total Nonton */}
        <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#262626] flex flex-col items-start">
          <div className="w-8 h-8 rounded-xl bg-[#1E1E1E] flex items-center justify-center text-sky-400 mb-2">
            <Film className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">
            Total Nobar
          </span>
          <span className="font-heading font-black text-lg text-white mt-0.5">
            {currentUser.total_nonton}x Nonton
          </span>
          <span className="text-[9px] text-stone-500 mt-1">Streak {currentUser.streak_nonton} hari</span>
        </div>
      </div>

      {/* 3. TOTAL HIASAN BORDER CARD */}
      <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E1E1E] text-[#D4AF37] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="font-heading font-bold text-xs text-white">Total Hiasan Border</div>
            <div className="text-[10px] text-stone-400">Total Coin yang udah lu belanjain buat border</div>
          </div>
        </div>
        <span className="font-heading font-black text-sm text-[#D4AF37]">
          {currentUser.total_hiasan_coin.toLocaleString('id-ID')} Coin
        </span>
      </div>

      {/* 4. ACTIONS MENU */}
      <div className="rounded-2xl bg-[#141414] border border-[#262626] divide-y divide-[#1F1F1F] overflow-hidden">
        {/* Owner Panel button (FAIZ ONLY) */}
        {isOwner && (
          <button
            onClick={() => setActiveTab('owner_panel')}
            className="w-full p-4 flex items-center justify-between hover:bg-[#1A1A1A] transition-colors text-left bg-gradient-to-r from-[#201A09] to-transparent"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="font-heading font-bold text-xs text-[#D4AF37]">
                  👑 Panel Owner Faiz
                </div>
                <div className="text-[10px] text-stone-400">
                  Bagi-bagi Coin, Flash Sale, Kode Redeem, Broadcast & Statistik
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
          </button>
        )}

        {/* Transfer Coin Shortcut */}
        <button
          onClick={() => setIsTransferModalOpen(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-[#1A1A1A] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#1E1E1E] text-stone-300 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <div className="font-heading font-bold text-xs text-white">Transfer Coin ke Temen</div>
              <div className="text-[10px] text-stone-400">Min 10, max 1000 Coin/hari (Fee 0 Coin)</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-500" />
        </button>

        {/* Riwayat Coin */}
        <button
          onClick={() => setIsWalletModalOpen(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-[#1A1A1A] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#1E1E1E] text-stone-300 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="font-heading font-bold text-xs text-white">Riwayat Transaksi Coin</div>
              <div className="text-[10px] text-stone-400">Cek pemasukan & pengeluaran Coin lu</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-500" />
        </button>

        {/* Koleksi Border Shortcut */}
        <button
          onClick={() => setActiveTab('border')}
          className="w-full p-4 flex items-center justify-between hover:bg-[#1A1A1A] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#1E1E1E] text-[#D4AF37] flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <div className="font-heading font-bold text-xs text-white">Hias & Koleksi Border Lu</div>
              <div className="text-[10px] text-stone-400">Ganti bingkai, warna, animasi & custom text</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-500" />
        </button>
      </div>

      {/* 5. KODE REFERRAL CARD */}
      <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-stone-400 block uppercase font-medium">
            Kode Referral Lu (Bukan Link):
          </span>
          <span className="font-heading font-black text-base text-[#D4AF37] tracking-wider">
            {currentUser.kode_referral}
          </span>
        </div>

        <button
          onClick={() => {
            navigator.clipboard.writeText(currentUser.kode_referral);
            setToast(`Kode Referral "${currentUser.kode_referral}" disalin!`);
          }}
          className="px-3.5 py-2 rounded-xl bg-[#222] hover:bg-[#2A2A2A] border border-[#333] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
        >
          <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />
          Salin Kode
        </button>
      </div>
    </div>
  );
};
