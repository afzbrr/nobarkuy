import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../UserAvatar';
import { ALL_BORDERS } from '../../data/borders';
import { X, ShoppingBag, Sparkles, Check } from 'lucide-react';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userOwnedBorders, buyShopBorder, equipBorder, isOwner } = useApp();

  if (!isOpen) return null;

  const shopBorders = ALL_BORDERS.filter((b) => b.kategori === 'toko');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-md rounded-2xl bg-[#141414] border border-[#262626] p-5 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
            <div>
              <h3 className="font-heading font-bold text-base text-white">Toko Border Eksklusif</h3>
              <p className="text-[10px] text-stone-400">Koleksi border 3D keren siap pakai!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1E1E1E] text-stone-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Coin Header */}
        <div className="mt-3 px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#262626] flex items-center justify-between text-xs">
          <span className="text-stone-400">Coin Lu Sekarang:</span>
          <div className="flex items-center gap-1 font-heading font-bold text-white">
            <span>🪙</span>
            <span>{isOwner ? '∞ Infinity' : currentUser.coin.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* List of Shop Borders */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
          {shopBorders.map((border) => {
            const isOwned = isOwner || userOwnedBorders.includes(border.id);
            const isEquipped = currentUser.border_saat_ini === border.id;

            return (
              <div
                key={border.id}
                className="p-3.5 rounded-xl bg-[#181818] border border-[#242424] hover:border-[#333] flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar
                    foto={currentUser.foto}
                    nama={currentUser.nama}
                    borderId={border.id}
                    size="lg"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading font-bold text-sm text-white">
                        {border.nama}
                      </span>
                      {border.cornerSticker && (
                        <span className="text-xs text-[#D4AF37]">{border.cornerSticker}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-400 leading-tight mt-0.5 max-w-[190px]">
                      {border.deskripsi}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="font-heading font-bold text-xs text-[#D4AF37]">
                        {isOwner ? '👑 GRATIS (Owner)' : `🪙 ${border.hargaCoin?.toLocaleString('id-ID')} Coin`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buy / Equip Button */}
                <div className="shrink-0">
                  {isEquipped ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#222] text-stone-400 text-xs font-semibold">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Dipakai
                    </span>
                  ) : isOwned ? (
                    <button
                      onClick={() => equipBorder(border.id)}
                      className="px-3.5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#c5a030] text-black text-xs font-heading font-bold flex items-center gap-1 transition-transform active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5 text-black" />
                      Pakai
                    </button>
                  ) : (
                    <button
                      onClick={() => buyShopBorder(border.id)}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-200 text-black text-xs font-heading font-bold flex items-center gap-1.5 transition-transform active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-black" />
                      Beli
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-stone-500 text-center mt-3">
          Border yang lu beli bakal langsung masuk ke Koleksi dan bisa dihias pake Coin.
        </p>
      </div>
    </div>
  );
};
