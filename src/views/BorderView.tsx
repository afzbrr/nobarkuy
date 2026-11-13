import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from '../components/UserAvatar';
import { ALL_BORDERS, DECORATION_OPTIONS } from '../data/borders';
import { BorderDecorations } from '../types';
import { ShopModal } from '../components/modals/ShopModal';
import { Sparkles, Lock, Check, Palette, Type, Wand2, ShoppingBag } from 'lucide-react';

export const BorderView: React.FC = () => {
  const {
    currentUser,
    userOwnedBorders,
    equipBorder,
    updateBorderDecorations,
    isOwner,
  } = useApp();

  const [subTab, setSubTab] = useState<'koleksi' | 'hias'>('koleksi');
  const [borderCategory, setBorderCategory] = useState<'all' | 'nonton' | 'toko' | 'prestasi' | 'hari_besar'>('all');
  const [selectedBorderId, setSelectedBorderId] = useState<string>(currentUser.border_saat_ini || 'pemula');
  const [isShopOpen, setIsShopOpen] = useState(false);

  const [draftCustomText, setDraftCustomText] = useState(currentUser.custom_text || '');
  const [draftDecorations, setDraftDecorations] = useState<BorderDecorations>({
    bingkai: currentUser.decorations?.bingkai || 'tipis',
    efek: currentUser.decorations?.efek || [],
    warna: currentUser.decorations?.warna || 'default',
    sticker: currentUser.decorations?.sticker || [],
    animasi: currentUser.decorations?.animasi || 'none',
  });

  // Sync local preview/draft whenever server user border or decorations change
  useEffect(() => {
    setSelectedBorderId(currentUser.border_saat_ini || 'pemula');
    setDraftCustomText(currentUser.custom_text || '');
    setDraftDecorations({
      bingkai: currentUser.decorations?.bingkai || 'tipis',
      efek: currentUser.decorations?.efek || [],
      warna: currentUser.decorations?.warna || 'default',
      sticker: currentUser.decorations?.sticker || [],
      animasi: currentUser.decorations?.animasi || 'none',
    });
  }, [currentUser.border_saat_ini, currentUser.custom_text, currentUser.decorations]);

  const isPemula = currentUser.border_saat_ini === 'pemula';
  const previewBorderDef = ALL_BORDERS.find((b) => b.id === selectedBorderId) || ALL_BORDERS[0];
  const isSelectedUnlocked = isOwner || userOwnedBorders.includes(selectedBorderId);
  const isSelectedEquipped = currentUser.border_saat_ini === selectedBorderId;

  const calculateCost = () => {
    if (isOwner) return 0;
    let cost = 0;
    if (draftDecorations.bingkai !== 'tipis') {
      const b = DECORATION_OPTIONS.bingkai.find((i) => i.id === draftDecorations.bingkai);
      cost += b?.harga || 150;
    }
    if (draftDecorations.warna && draftDecorations.warna !== 'default') cost += 100;
    if (draftDecorations.animasi !== 'none') {
      const a = DECORATION_OPTIONS.animasi.find((i) => i.id === draftDecorations.animasi);
      cost += a?.harga || 100;
    }
    draftDecorations.efek.forEach((e) => {
      if (e !== 'none') {
        const ef = DECORATION_OPTIONS.efek.find((i) => i.id === e);
        cost += ef?.harga || 100;
      }
    });
    draftDecorations.sticker.forEach((s) => {
      if (s !== 'none') cost += 100;
    });
    if (draftCustomText.trim().toUpperCase() !== (currentUser.custom_text || '').toUpperCase()) {
      cost += 100;
    }
    return cost;
  };

  const currentCost = calculateCost();

  const handleApplyDecorations = () => {
    updateBorderDecorations(draftDecorations, draftCustomText.trim().toUpperCase());
  };

  const toggleEffect = (effectId: string) => {
    if (effectId === 'none') {
      setDraftDecorations((prev) => ({ ...prev, efek: [] }));
      return;
    }
    setDraftDecorations((prev) => {
      const exists = prev.efek.includes(effectId);
      if (exists) {
        return { ...prev, efek: prev.efek.filter((e) => e !== effectId) };
      }
      if (prev.efek.length >= 2) {
        return { ...prev, efek: [prev.efek[1], effectId] };
      }
      return { ...prev, efek: [...prev.efek, effectId] };
    });
  };

  const toggleSticker = (stickerId: string) => {
    if (stickerId === 'none') {
      setDraftDecorations((prev) => ({ ...prev, sticker: [] }));
      return;
    }
    setDraftDecorations((prev) => {
      const exists = prev.sticker.includes(stickerId);
      if (exists) return { ...prev, sticker: [] };
      return { ...prev, sticker: [stickerId] };
    });
  };

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* 1. PREVIEW BORDER LIVE (Menampilkan border yang sedang dipilih!) */}
      <div className="rounded-2xl bg-gradient-to-b from-[#181818] to-[#121212] border border-[#2B2B2B] p-5 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-3">
          PREVIEW BORDER LIVE
        </span>

        <div className="py-2">
          <UserAvatar
            foto={currentUser.foto}
            nama={currentUser.nama}
            borderId={selectedBorderId}
            customText={isSelectedEquipped ? draftCustomText.trim().toUpperCase() : currentUser.custom_text}
            showCustomText={true}
            decorations={isSelectedEquipped ? draftDecorations : undefined}
            size="2xl"
          />
        </div>

        <div className="mt-3 text-center">
          <div className="font-heading font-bold text-sm text-white">
            {previewBorderDef.nama}
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5 max-w-xs">
            {previewBorderDef.deskripsi}
          </p>
          {!isSelectedUnlocked && (
            <p className="text-[10px] text-[#D4AF37] mt-1 font-medium">
              Syarat buka: {previewBorderDef.syarat}
            </p>
          )}
        </div>

        {/* Action Button for Selected Border */}
        <div className="mt-3.5 w-full">
          {isSelectedEquipped ? (
            <div className="w-full py-2.5 rounded-xl bg-[#1E1E1E] border border-[#D4AF37]/40 text-[#D4AF37] font-heading font-bold text-xs flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>Sedang Dipakai</span>
            </div>
          ) : isSelectedUnlocked ? (
            <button
              onClick={() => equipBorder(selectedBorderId)}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-stone-200 text-black font-heading font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-transform active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>Pakai Border Ini</span>
            </button>
          ) : previewBorderDef.kategori === 'toko' ? (
            <button
              onClick={() => setIsShopOpen(true)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black font-heading font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-transform active:scale-[0.98]"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-black" />
              <span>Beli di Toko ({previewBorderDef.hargaCoin?.toLocaleString('id-ID')} Coin)</span>
            </button>
          ) : (
            <div className="w-full py-2.5 rounded-xl bg-[#1A1A1A] border border-[#262626] text-stone-500 font-heading font-bold text-xs flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Terkunci ({previewBorderDef.syarat})</span>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-[#222] w-full flex items-center justify-between text-xs text-stone-400">
          <span>Total Hiasan Border:</span>
          <span className="font-heading font-bold text-white">
            🪙 {currentUser.total_hiasan_coin.toLocaleString('id-ID')} Coin
          </span>
        </div>
      </div>

      {/* 2. SUB-TAB SWITCHER */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-[#141414] rounded-2xl border border-[#222]">
        <button
          onClick={() => setSubTab('koleksi')}
          className={`py-2 rounded-xl text-xs font-heading font-bold transition-all ${
            subTab === 'koleksi'
              ? 'bg-[#1E1E1E] text-white shadow'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          🏆 Koleksi Border Lu
        </button>
        <button
          onClick={() => setSubTab('hias')}
          className={`py-2 rounded-xl text-xs font-heading font-bold transition-all ${
            subTab === 'hias'
              ? 'bg-[#1E1E1E] text-white shadow'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          🎨 Hias Border Lu
        </button>
      </div>

      {/* 3. KOLEKSI BORDER LU PANEL */}
      {subTab === 'koleksi' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-stone-400">
              {isOwner ? 'Owner bebas pakai semua border 3D!' : 'Tap border buat preview & pakai.'}
            </span>
            <button
              onClick={() => setIsShopOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#1F1C12] border border-[#D4AF37]/40 text-[#D4AF37] text-[11px] font-heading font-bold flex items-center gap-1 hover:bg-[#D4AF37]/20 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Toko Border</span>
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'toko', label: 'Toko 3D' },
              { id: 'nonton', label: 'Nonton' },
              { id: 'prestasi', label: 'Prestasi' },
              { id: 'hari_besar', label: 'Hari Besar' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setBorderCategory(cat.id as typeof borderCategory)}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-heading font-bold shrink-0 border transition-colors ${
                  borderCategory === cat.id
                    ? 'bg-white text-black border-white'
                    : 'bg-[#141414] text-stone-400 border-[#262626] hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {ALL_BORDERS.filter((b) => borderCategory === 'all' || b.kategori === borderCategory).map((border) => {
              const isUnlocked = isOwner || userOwnedBorders.includes(border.id);
              const isEquipped = currentUser.border_saat_ini === border.id;
              const isSelected = selectedBorderId === border.id;

              return (
                <div
                  key={border.id}
                  onClick={() => setSelectedBorderId(border.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedBorderId(border.id);
                  }}
                  className={`p-3 rounded-2xl border flex flex-col items-center text-center relative transition-all cursor-pointer ${
                    isSelected
                      ? 'border-white bg-[#202020] shadow-lg'
                      : isEquipped
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                      : isUnlocked
                      ? 'border-[#262626] bg-[#141414] hover:border-[#383838]'
                      : 'border-[#1C1C1C] bg-[#111] opacity-60'
                  }`}
                >
                  {isEquipped ? (
                    <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-[#D4AF37] text-black text-[8px] font-bold">
                      Dipakai
                    </span>
                  ) : !isUnlocked ? (
                    <span className="absolute top-1.5 right-1.5 text-stone-500">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  ) : null}

                  <div className="my-2">
                    <UserAvatar
                      foto={currentUser.foto}
                      nama={currentUser.nama}
                      borderId={border.id}
                      size="sm"
                    />
                  </div>

                  <span className="font-heading font-bold text-[10.5px] text-white truncate max-w-full mt-1">
                    {border.nama}
                  </span>

                  {isUnlocked && !isEquipped ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBorderId(border.id);
                        equipBorder(border.id);
                      }}
                      className="mt-1.5 w-full py-1 rounded-lg bg-white hover:bg-stone-200 text-black font-heading font-bold text-[9.5px] transition-transform active:scale-95"
                    >
                      Pakai
                    </button>
                  ) : (
                    <span className="text-[9px] text-stone-400 line-clamp-2 mt-1 leading-tight">
                      {isEquipped ? 'Aktif sekarang' : border.syarat}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. HIAS BORDER PANEL */}
      {subTab === 'hias' && (
        <div className="space-y-4">
          {isPemula && !isOwner && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-amber-300 text-xs">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Border Pemula ga bisa dihias!</strong>
                <span className="text-[11px] text-amber-400/90 leading-tight block mt-0.5">
                  Nonton 3x di Room Nobar buat buka Border Semangat Nobar biar tombol hias kebuka!
                </span>
              </div>
            </div>
          )}

          {isOwner && (
            <div className="p-2.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Halo Owner Faiz! Semua hiasan border GRATIS buat lu.</span>
            </div>
          )}

          <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-heading font-bold text-white">
                <Type className="w-4 h-4 text-[#D4AF37]" />
                <span>Custom Text di Border</span>
              </div>
              <span className="text-[11px] text-[#D4AF37] font-semibold">
                {isOwner ? 'GRATIS' : '100 Coin'}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mb-3">
              Tulis text bebas di bawah foto profil lu.
            </p>
            <input
              type="text"
              maxLength={15}
              disabled={isPemula && !isOwner}
              value={draftCustomText}
              onChange={(e) => setDraftCustomText(e.target.value.toUpperCase())}
              placeholder="CONTOH: SULTAN NOBAR"
              className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-xs font-heading font-bold uppercase tracking-wider text-white focus:outline-none focus:border-[#D4AF37] disabled:opacity-40"
            />
          </div>

          <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-heading font-bold text-white">
                <Wand2 className="w-4 h-4 text-[#D4AF37]" />
                <span>Bingkai Border</span>
              </div>
              <span className="text-[11px] text-stone-400">Pilih 1 bingkai</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DECORATION_OPTIONS.bingkai.map((b) => (
                <button
                  key={b.id}
                  disabled={isPemula && !isOwner}
                  onClick={() => setDraftDecorations((prev) => ({ ...prev, bingkai: b.id }))}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-colors disabled:opacity-40 ${
                    draftDecorations.bingkai === b.id
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white font-bold'
                      : 'border-[#262626] bg-[#181818] text-stone-300 hover:bg-[#222]'
                  }`}
                >
                  <div className="truncate">{b.nama}</div>
                  <div className="text-[10px] text-[#D4AF37] mt-0.5">
                    {b.harga === 0 ? 'Gratis' : isOwner ? 'GRATIS' : `${b.harga} Coin`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-heading font-bold text-white">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span>Efek Border (Max 2 Efek)</span>
              </div>
              <span className="text-[10px] text-stone-400">100 - 200 Coin</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DECORATION_OPTIONS.efek.map((ef) => {
                const isSelected =
                  (ef.id === 'none' && draftDecorations.efek.length === 0) ||
                  draftDecorations.efek.includes(ef.id);

                return (
                  <button
                    key={ef.id}
                    disabled={isPemula && !isOwner}
                    onClick={() => toggleEffect(ef.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-colors disabled:opacity-40 ${
                      isSelected
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white font-bold'
                        : 'border-[#262626] bg-[#181818] text-stone-300 hover:bg-[#222]'
                    }`}
                  >
                    <div className="truncate">{ef.nama}</div>
                    <div className="text-[10px] text-[#D4AF37] mt-0.5">
                      {ef.harga === 0 ? 'None' : isOwner ? 'GRATIS' : `${ef.harga} Coin`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-heading font-bold text-white">
                <Palette className="w-4 h-4 text-[#D4AF37]" />
                <span>Warna Border</span>
              </div>
              <span className="text-[11px] text-[#D4AF37] font-semibold">
                {isOwner ? 'GRATIS' : '100 Coin (Bawaan Gratis)'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {DECORATION_OPTIONS.warna.map((w) => (
                <button
                  key={w.id}
                  disabled={isPemula && !isOwner}
                  onClick={() => setDraftDecorations((prev) => ({ ...prev, warna: w.id }))}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-colors disabled:opacity-40 ${
                    draftDecorations.warna === w.id
                      ? 'border-white bg-[#222]'
                      : 'border-[#262626] bg-[#181818] hover:bg-[#202020]'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-stone-600 shrink-0"
                    style={{
                      background: w.hex || 'conic-gradient(#F97316, #3B82F6, #10B981, #D4AF37)',
                    }}
                  />
                  <span className="text-[10px] text-stone-300 truncate max-w-[55px]">
                    {w.nama}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-heading font-bold text-white">
                Sticker Pojok Kanan Bawah
              </span>
              <span className="text-[11px] text-[#D4AF37] font-semibold">
                {isOwner ? 'GRATIS' : '100 Coin'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DECORATION_OPTIONS.sticker.map((st) => (
                <button
                  key={st.id}
                  disabled={isPemula && !isOwner}
                  onClick={() => toggleSticker(st.id)}
                  className={`p-2.5 rounded-xl border text-center text-xs transition-colors disabled:opacity-40 ${
                    draftDecorations.sticker.includes(st.id) ||
                    (st.id === 'none' && draftDecorations.sticker.length === 0)
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white font-bold'
                      : 'border-[#262626] bg-[#181818] text-stone-300 hover:bg-[#222]'
                  }`}
                >
                  <span className="text-sm block mb-1 text-[#D4AF37]">
                    {st.symbol || '—'}
                  </span>
                  <span className="text-[10px] block truncate">{st.nama}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-heading font-bold text-white">Animasi Halus</span>
              <span className="text-[10px] text-stone-400">100 - 150 Coin</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DECORATION_OPTIONS.animasi.map((an) => (
                <button
                  key={an.id}
                  disabled={isPemula && !isOwner}
                  onClick={() => setDraftDecorations((prev) => ({ ...prev, animasi: an.id }))}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-colors disabled:opacity-40 ${
                    draftDecorations.animasi === an.id
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white font-bold'
                      : 'border-[#262626] bg-[#181818] text-stone-300 hover:bg-[#222]'
                  }`}
                >
                  <div className="truncate">{an.nama}</div>
                  <div className="text-[10px] text-[#D4AF37] mt-0.5">
                    {an.harga === 0 ? 'Gratis' : isOwner ? 'GRATIS' : `${an.harga} Coin`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="sticky bottom-20 p-3 rounded-2xl bg-[#181818]/95 backdrop-blur-md border border-[#2A2A2A] flex items-center justify-between gap-3 shadow-2xl">
            <div>
              <span className="text-[10px] text-stone-400 block">Total Biaya Hiasan:</span>
              <span className="font-heading font-black text-sm text-[#D4AF37]">
                {isOwner ? 'GRATIS (Owner)' : `🪙 ${currentCost} Coin`}
              </span>
            </div>

            <button
              disabled={isPemula && !isOwner}
              onClick={handleApplyDecorations}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-stone-200 disabled:opacity-40 disabled:hover:bg-white text-black font-heading font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-black" />
              Beli &amp; Pakai
            </button>
          </div>
        </div>
      )}

      <ShopModal isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
    </div>
  );
};
