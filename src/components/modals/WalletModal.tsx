import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, ArrowUpRight, ArrowDownLeft, HelpCircle, Send } from 'lucide-react';

export const WalletModal: React.FC = () => {
  const {
    isWalletModalOpen,
    setIsWalletModalOpen,
    currentUser,
    isOwner,
    coinHistory,
    setIsTransferModalOpen,
  } = useApp();

  if (!isWalletModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-[#141414] border border-[#262626] p-5 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🪙</span>
            <h3 className="font-heading font-bold text-base text-white">Dompet Coin Lu</h3>
          </div>
          <button
            onClick={() => setIsWalletModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-[#1E1E1E] text-stone-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Balance Card */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-b from-[#1C1C1C] to-[#161616] border border-[#2B2B2B]">
          <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">
            Total Saldo Coin
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-heading font-black text-2xl text-white">
              {isOwner ? '∞ Infinity' : currentUser.coin.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-[#D4AF37] font-semibold">🪙 Coin</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            {isOwner
              ? 'Akun Owner Faiz: Coin unlimited, ga bakal pernah berkurang.'
              : 'Coin lu cuma dipake buat belanja & hias border foto profil.'}
          </p>

          <button
            onClick={() => {
              setIsWalletModalOpen(false);
              setIsTransferModalOpen(true);
            }}
            className="mt-3 w-full py-2.5 px-3 rounded-xl bg-[#262626] hover:bg-[#333] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
            Transfer Coin ke Temen
          </button>
        </div>

        {/* Cara Dapetin Coin Info */}
        <div className="mt-3 p-3 rounded-xl bg-[#1A1A1A] border border-[#242424] text-xs">
          <div className="flex items-center gap-1.5 text-stone-200 font-semibold mb-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Cara Dapetin Coin Gratis:</span>
          </div>
          <ul className="text-[11px] text-stone-400 space-y-1 pl-1">
            <li>• Pertama kali buka app: <strong className="text-stone-200">+1000 Coin</strong></li>
            <li>• Nonton film sampe abis: <strong className="text-stone-200">+10 Coin</strong></li>
            <li>• Menang Quiz di Room: <strong className="text-stone-200">+10 Coin</strong></li>
            <li>• Check-in 7 hari berturut-turut: <strong className="text-stone-200">+10 Coin</strong></li>
            <li>• Selesaiin semua Misi Harian: <strong className="text-stone-200">+20 Coin</strong></li>
            <li>• Puter Roda Roulette Harian: <strong className="text-stone-200">10-50 Coin</strong></li>
            <li>• Ambil Bagi-bagi Coin dari Faiz: <strong className="text-stone-200">100 Coin</strong></li>
            <li>• Undang temen pake kode referral: <strong className="text-stone-200">+50 Coin</strong></li>
          </ul>
        </div>

        {/* Riwayat Coin */}
        <div className="mt-4 flex-1 overflow-hidden flex flex-col">
          <span className="text-xs font-semibold text-stone-300 mb-2">Riwayat Transaksi</span>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
            {coinHistory.length === 0 ? (
              <div className="text-center py-6 text-xs text-stone-500">Belum ada riwayat transaksi.</div>
            ) : (
              coinHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg bg-[#181818] border border-[#222] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        item.jenis === 'tambah'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {item.jenis === 'tambah' ? (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-stone-200 text-[11px] leading-tight">
                        {item.keterangan}
                      </div>
                      <div className="text-[9px] text-stone-500 mt-0.5">
                        {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`font-heading font-bold text-xs shrink-0 ${
                      item.jenis === 'tambah' ? 'text-emerald-400' : 'text-stone-300'
                    }`}
                  >
                    {item.jenis === 'tambah' ? '+' : '-'}{item.jumlah}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
