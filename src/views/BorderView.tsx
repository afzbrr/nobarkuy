import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from '../components/UserAvatar';
import { ALL_BORDERS, DECORATION_OPTIONS } from '../data/borders';
import { BorderDecorations } from '../types';
import { Sparkles, Lock, Check, Palette, Type, Wand2, Shield, AlertCircle } from 'lucide-react';

export const BorderView: React.FC = () => {
  const {
    currentUser,
    userOwnedBorders,
    equipBorder,
    updateBorderDecorations,
    isOwner,
  } = useApp();

  // Active sub-tab: 'koleksi' or 'hias'
  const [subTab, setSubTab] = useState<'koleksi' | 'hias'>('hias');

  // Live draft state for customization preview
  const [draftCustomText, setDraftCustomText] = useState(currentUser.custom_text || '');
  const [draftDecorations, setDraftDecorations] = useState<BorderDecorations>({
    bingkai: currentUser.decorations?.bingkai || 'tipis',
    efek: currentUser.decorations?.efek || [],
    warna: currentUser.decorations?.warna || 'abu',
    sticker: currentUser.decorations?.sticker || [],
    animasi: currentUser.decorations?.animasi || 'none',
  });

  const isPemula = currentUser.border_saat_ini === 'pemula';
  const currentBorderDef = ALL_BORDERS.find((b) => b.id === currentUser.border_saat_ini) || ALL_BORDERS[0];

  // Calculate live preview cost
  const calculateCost = () => {
    if (isOwner) return 0;
    let cost = 0;
    if (draftDecorations.bingkai !== 'tipis') {
      const b = DECORATION_OPTIONS.bingkai.find((i) => i.id === draftDecorations.bingkai);
      cost += b?.harga || 150;
    }
    if (draftDecorations.warna !== 'abu') cost += 100;
    if (draftDecorations.animasi !== 'none') {
      const a = DECORATION_OPTIONS.animasi.find((i) => i.id === draftDecorations.animasi);
      cost += a?.harga || 100;
    }
    draftDecorations.efek.forEach((e) => {
      const ef = DECORATION_OPTIONS.efek.find((i) => i.id === e);
      cost += ef?.harga || 100;
    });
    draftDecorations.sticker.forEach(() => {
      cost += 100;
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
      // Max 2 effects per prompt rules
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
      if (exists) {
        return { ...prev, sticker: [] };
      }
      return { ...prev, sticker: [stickerId] };
    });
  };

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* 1. LIVE PREVIEW CARD */}
      <div className="rounded-2xl bg-gradient-to-b from-[#181818] to-[#121212] border border-[#2B2B2B] p-5 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-3">
          PREVIEW BORDER LIVE
        </span>

        {/* Big Avatar with live reactive decorations */}
        <div className="py-2">
          <UserAvatar
            foto={currentUser.foto}
            nama={currentUser.nama}
            borderId={currentUser.border_saat_ini}
            customText={draftCustomText.trim().toUpperCase()}
            showCustomText={true}
            decorations={draftDecorations}
            size="2xl"
          />
        </div>

        <div className="mt-3 text-center">
          <div className="font-heading font-bold text-sm text-white">
            {currentBorderDef.nama}
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5 max-w-xs">
            {currentBorderDef.deskripsi}
          </p>
        </div>

        {/* Total Spent Stat */}
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
          onClick={() => setSubTab('hias')}
          className={`py-2 rounded-xl text-xs font-heading font-bold transition-all ${
            subTab === 'hias'
              ? 'bg-[#1E1E1E] text-white shadow'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          🎨 Hias Border Lu
        </button>
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
      </div>

      {/* 3. HIAS BORDER PANEL */}
      {subTab === 'hias' && (
        <div className="space-y-4">
          {/* Border Pemula Lock Notice */}
          {isPemula && !isOwner && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-amber-300 text-xs">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Border Pemula ga bisa dihias!</strong>
                <span className="text-[11px] text-amber-400/90 leading-tight block mt-0.5">
                  Nonton 3 hari buat dapet Border Semangat Nobar biar tombol hias kebuka!
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

          {/* 1. Custom Text di Border */}
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
              Tulis text bebas di bawah foto profil lu (Space Grotesk Bold uppercase, tracking rapat).
            </p>
            <input
              type="text"
              maxLength={15}
              disabled={isPemula && !isOwner}
              value={draftCustomText}
              onChange={(e) => setDraftCustomText(e.target.value.toUpperCase())}
              placeholder="CONTOH: FAIZ GANTENG / RAJA NOBAR"
              className="w-full bg-[#1A1A1A] border border-[#282828] rounded-xl px-3 py-2 text-xs font-heading font-bold uppercase tracking-wider text-white focus:outline-none focus:border-[#D4AF37] disabled:opacity-40"
            />
          </div>

          {/* 2. Bingkai Border */}
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

          {/* 3. Efek Border */}
          <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-heading font-bold text-white">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span>Efek Border (Halus, Max 2 Efek)</span>
              </div>
              <span className="text-[10px] text-stone-400">100 - 200 Coin</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DECORATION_OPTIONS.efek.map((ef) => {
                const isSelected = draftDecorations.efek.includes(ef.id);

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

          {/* 4. Warna Border */}
          <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-heading font-bold text-white">
                <Palette className="w-4 h-4 text-[#D4AF37]" />
                <span>Warna Matte Border</span>
              </div>
              <span className="text-[11px] text-[#D4AF37] font-semibold">
                {isOwner ? 'GRATIS' : '100 Coin'}
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
                    style={{ backgroundColor: w.hex }}
                  />
                  <span className="text-[10px] text-stone-300 truncate max-w-[55px]">
                    {w.nama}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Sticker di Border */}
          <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-heading font-bold text-white">
                Sticker Pojok Kanan Bawah (Kecil 12px)
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
                    (draftDecorations.sticker.includes(st.id) || (st.id === 'none' && draftDecorations.sticker.length === 0))
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

          {/* 6. Animasi Border */}
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

          {/* Sticky Bottom Apply Button */}
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
              Beli & Pakai
            </button>
          </div>
        </div>
      )}

      {/* 4. KOLEKSI BORDER LU PANEL (3 COLUMNS GRID) */}
      {subTab === 'koleksi' && (
        <div className="space-y-3">
          <div className="text-xs text-stone-400 px-1">
            Klik border yang udah lu punya buat ganti border aktif lu.
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {ALL_BORDERS.map((border) => {
              const isUnlocked = userOwnedBorders.includes(border.id);
              const isEquipped = currentUser.border_saat_ini === border.id;

              return (
                <button
                  key={border.id}
                  disabled={!isUnlocked}
                  onClick={() => equipBorder(border.id)}
                  className={`p-3 rounded-2xl border flex flex-col items-center text-center relative transition-all ${
                    isEquipped
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                      : isUnlocked
                      ? 'border-[#262626] bg-[#141414] hover:border-[#383838]'
                      : 'border-[#1C1C1C] bg-[#111] opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* Status Indicator */}
                  {isEquipped ? (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#D4AF37] text-black flex items-center justify-center text-[9px] font-bold">
                      ✓
                    </span>
                  ) : !isUnlocked ? (
                    <span className="absolute top-1.5 right-1.5 text-stone-600">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  ) : null}

                  <div className="my-1">
                    <UserAvatar
                      foto={currentUser.foto}
                      nama={currentUser.nama}
                      borderId={border.id}
                      size="sm"
                    />
                  </div>

                  <span className="font-heading font-bold text-[11px] text-white truncate max-w-full mt-1">
                    {border.nama}
                  </span>

                  <span className="text-[9px] text-stone-400 line-clamp-2 mt-0.5 leading-tight">
                    {isUnlocked ? (isEquipped ? 'Dipakai' : 'Milik Lu') : border.syarat}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
