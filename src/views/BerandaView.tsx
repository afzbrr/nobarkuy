import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Gift, Zap, Ticket, Radio, Sparkles, Check, Clock, ChevronRight, Users, X } from 'lucide-react';

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const BerandaView: React.FC = () => {
  const {
    currentUser,
    allUsers,
    broadcasts,
    giveaways,
    flashSales,
    redeemCodes,
    claimGiveaway,
    buyFlashSale,
    redeemCode,
  } = useApp();

  const [now, setNow] = useState<number>(() => Date.now());
  const [redeemInput, setRedeemInput] = useState('');
  const [redeemFeedback, setRedeemFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [isClaimingRedeem, setIsClaimingRedeem] = useState(false);
  const [claimersModal, setClaimersModal] = useState<{
    title: string;
    subtitle: string;
    items: { key: string; nama: string; username?: string; extra?: string }[];
  } | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // a. Published Broadcast Faiz (Banner / Latest Published)
  const publishedBroadcast = broadcasts.find((b) => b.is_published && b.jenis === 'banner')
    || broadcasts.find((b) => b.is_published);

  // b. Active/Upcoming Bagi-bagi Coin (hilang otomatis jika kuota habis atau waktu selesai lewat)
  const activeGiveaway = giveaways.find((gw) => {
    if (!gw.is_active || gw.status === 'ended') return false;
    const endMs = new Date(gw.selesai_pada).getTime();
    if (now >= endMs) return false;
    if (gw.claims.length >= gw.jumlah_orang) return false;
    return true;
  });

  // c. Active/Upcoming Flash Sale (hilang otomatis jika stok habis atau waktu selesai lewat)
  const activeFlashSale = flashSales.find((fs) => {
    if (!fs.is_active || fs.status === 'ended') return false;
    const endMs = new Date(fs.selesai_pada).getTime();
    if (now >= endMs) return false;
    if (fs.sisa_stok <= 0) return false;
    return true;
  });

  // d. Active/Upcoming Kode Redeem (HANYA muncul jika ada kode aktif & dipublish dari Owner)
  const activeRedeemCode = redeemCodes.find((rc) => {
    if (!rc.is_published) return false;
    const endMs = new Date(rc.selesai_pada).getTime();
    if (now >= endMs) return false;
    if (rc.dipakai_count >= rc.max_orang) return false;
    return true;
  });

  const handleClaimRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemFeedback(null);
    if (!redeemInput.trim()) {
      setRedeemFeedback({ text: 'Ketik kodenya dulu bro!', isError: true });
      return;
    }
    setIsClaimingRedeem(true);
    const res = await redeemCode(redeemInput.trim());
    setIsClaimingRedeem(false);
    setRedeemFeedback({ text: res.message, isError: !res.success });
    if (res.success) {
      setRedeemInput('');
    }
  };

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* a. BROADCAST FAIZ (Selalu tampil di paling atas, kosong => BELUM ADA BROADCAST) */}
      <div className="rounded-2xl bg-gradient-to-r from-[#171717] to-[#1F1C12] border border-[#D4AF37]/35 p-4 flex items-start gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0">
          <Radio className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
            👑 Broadcast Faiz
          </span>
          {publishedBroadcast ? (
            <>
              <h4 className="font-heading font-bold text-sm text-white mt-0.5 leading-snug">
                {publishedBroadcast.judul}
              </h4>
              <p className="text-xs text-stone-300 mt-1 leading-relaxed whitespace-pre-wrap">
                {publishedBroadcast.pesan}
              </p>
            </>
          ) : (
            <p className="text-xs text-stone-400 font-semibold mt-1 tracking-wide">
              BELUM ADA BROADCAST
            </p>
          )}
        </div>
      </div>

      {/* b. BAGI-BAGI COIN (HANYA jika ada event aktif dari Owner) */}
      {activeGiveaway && (() => {
        const startMs = new Date(activeGiveaway.mulai_pada).getTime();
        const endMs = new Date(activeGiveaway.selesai_pada).getTime();
        const isStarted = now >= startMs;
        const alreadyClaimed = activeGiveaway.claims.some((c) => c.user_id === currentUser.user_id);
        const remainingQuota = activeGiveaway.jumlah_orang - activeGiveaway.claims.length;

        return (
          <div className="rounded-2xl bg-[#141408] border border-[#D4AF37]/40 p-4 relative overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-white">
                    BAGI-BAGI COIN GRATIS!
                  </h4>
                  <p className="text-[11px] text-[#D4AF37]">
                    {activeGiveaway.per_orang} Coin x {activeGiveaway.jumlah_orang} Orang
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                {!isStarted ? (
                  <div>
                    <span className="text-[10px] text-stone-400 block">Mulai dalam:</span>
                    <span className="font-heading font-black text-xs text-white tracking-wider">
                      {formatCountdown(startMs - now)}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] text-emerald-400 block font-semibold">UDAH MULAI!</span>
                    <span className="font-heading font-bold text-xs text-stone-300">
                      Sisa: {remainingQuota}/{activeGiveaway.jumlah_orang}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#262615] flex items-center justify-between gap-3">
              <div className="text-[11px] text-stone-400">
                <div>
                  Total: <strong className="text-white">{activeGiveaway.total_coin.toLocaleString('id-ID')} Coin</strong>
                </div>
                {isStarted && (
                  <div className="text-[9.5px] text-stone-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>Berakhir: {formatCountdown(endMs - now)}</span>
                  </div>
                )}
              </div>

              {!isStarted ? (
                <button
                  disabled
                  className="px-4 py-2 rounded-xl bg-[#222] text-stone-500 text-xs font-semibold cursor-not-allowed"
                >
                  Belum Mulai
                </button>
              ) : alreadyClaimed ? (
                <span className="px-3.5 py-1.5 rounded-xl bg-[#222] text-stone-400 text-xs font-semibold inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Udah Lu Ambil
                </span>
              ) : (
                <button
                  onClick={() => claimGiveaway(activeGiveaway.id)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-stone-200 text-black text-xs font-heading font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
                >
                  <Sparkles className="w-3.5 h-3.5 text-black" />
                  AMBIL COIN!
                </button>
              )}
            </div>

            {/* Compact Recipient Strip */}
            <button
              type="button"
              onClick={() =>
                setClaimersModal({
                  title: 'Penerima Bagi-bagi Coin',
                  subtitle: `${activeGiveaway.per_orang} Coin x ${activeGiveaway.jumlah_orang} Orang`,
                  items: [...activeGiveaway.claims].reverse().map((c) => ({
                    key: `${c.user_id}-${c.created_at}`,
                    nama: c.nama,
                    username: c.username,
                    extra: `+${c.jumlah} Coin`,
                  })),
                })
              }
              className="mt-2.5 w-full px-2.5 py-1.5 rounded-lg bg-black/35 hover:bg-black/50 border border-white/5 flex items-center justify-between gap-2 text-[10px] text-stone-300 transition-colors"
            >
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <Users className="w-3 h-3 text-[#D4AF37] shrink-0" />
                <span className="truncate">
                  {activeGiveaway.claims.length === 0
                    ? 'Belum ada yang dapet'
                    : `Yang dapet (${activeGiveaway.claims.length}): ${activeGiveaway.claims
                        .slice(-2)
                        .reverse()
                        .map((c) => (c.username ? `@${c.username}` : c.nama))
                        .join(', ')}${activeGiveaway.claims.length > 2 ? ` +${activeGiveaway.claims.length - 2}` : ''}`}
                </span>
              </div>
              <ChevronRight className="w-3 h-3 text-stone-500 shrink-0" />
            </button>
          </div>
        );
      })()}

      {/* c. FLASH SALE (HANYA jika ada event aktif dari Owner) */}
      {activeFlashSale && (() => {
        const startMs = new Date(activeFlashSale.mulai_pada).getTime();
        const endMs = new Date(activeFlashSale.selesai_pada).getTime();
        const isStarted = now >= startMs;
        const alreadyBought = activeFlashSale.claims.some((c) => c.user_id === currentUser.user_id);

        return (
          <div className="rounded-2xl bg-gradient-to-r from-[#170E0E] to-[#1F1212] border border-[#DC2626]/35 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#DC2626]/15 border border-[#DC2626]/30 flex items-center justify-center text-[#DC2626]">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-heading font-bold text-sm text-white block">
                    FLASH SALE BORDER {activeFlashSale.border_nama}
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-[11px] text-stone-500 line-through">
                      {activeFlashSale.harga_normal} Coin
                    </span>
                    <span className="font-heading font-bold text-xs text-[#DC2626]">
                      {activeFlashSale.harga_flash} Coin doang!
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                {!isStarted ? (
                  <div>
                    <span className="text-[10px] text-stone-400 block">Mulai dalam:</span>
                    <span className="font-heading font-black text-xs text-white tracking-wider">
                      {formatCountdown(startMs - now)}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] text-rose-400 block font-semibold">CEPET BELI!</span>
                    <span className="font-heading font-bold text-xs text-stone-300">
                      Sisa: {activeFlashSale.sisa_stok}/{activeFlashSale.stok}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#2B1B1B] flex items-center justify-between gap-3">
              <div className="text-[11px] text-stone-400">
                <div>
                  Stok: <strong className="text-white">{activeFlashSale.sisa_stok} tersisa</strong>
                </div>
                {isStarted && (
                  <div className="text-[9.5px] text-stone-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>Berakhir: {formatCountdown(endMs - now)}</span>
                  </div>
                )}
              </div>

              {alreadyBought ? (
                <span className="px-3.5 py-1.5 rounded-xl bg-[#222] text-stone-400 text-xs font-semibold inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Udah Lu Beli
                </span>
              ) : (
                <button
                  onClick={() => buyFlashSale(activeFlashSale.id)}
                  disabled={!isStarted}
                  className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition-transform active:scale-95 ${
                    !isStarted
                      ? 'bg-[#222] text-stone-500 cursor-not-allowed'
                      : 'bg-white hover:bg-stone-200 text-black shadow-md'
                  }`}
                >
                  {!isStarted ? 'Belum Mulai' : `⚡ BELI - ${activeFlashSale.harga_flash} Coin`}
                </button>
              )}
            </div>

            {/* Compact Buyer Strip */}
            <button
              type="button"
              onClick={() =>
                setClaimersModal({
                  title: `Pembeli Flash Sale ${activeFlashSale.border_nama}`,
                  subtitle: `${activeFlashSale.claims.length}/${activeFlashSale.stok} terjual`,
                  items: [...activeFlashSale.claims].reverse().map((c) => {
                    const matchedUser = allUsers.find((u) => u.user_id === c.user_id);
                    return {
                      key: `${c.user_id}-${c.created_at}`,
                      nama: c.nama,
                      username: c.username || matchedUser?.username,
                      extra: `${activeFlashSale.harga_flash} Coin`,
                    };
                  }),
                })
              }
              className="mt-2.5 w-full px-2.5 py-1.5 rounded-lg bg-black/35 hover:bg-black/50 border border-white/5 flex items-center justify-between gap-2 text-[10px] text-stone-300 transition-colors"
            >
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <Users className="w-3 h-3 text-[#DC2626] shrink-0" />
                <span className="truncate">
                  {activeFlashSale.claims.length === 0
                    ? 'Belum ada yang beli'
                    : `Yang dapet (${activeFlashSale.claims.length}): ${activeFlashSale.claims
                        .slice(-2)
                        .reverse()
                        .map((c) => {
                          const uname = c.username || allUsers.find((u) => u.user_id === c.user_id)?.username;
                          return uname ? `@${uname}` : c.nama;
                        })
                        .join(', ')}${activeFlashSale.claims.length > 2 ? ` +${activeFlashSale.claims.length - 2}` : ''}`}
                </span>
              </div>
              <ChevronRight className="w-3 h-3 text-stone-500 shrink-0" />
            </button>
          </div>
        );
      })()}

      {/* d. KODE REDEEM (HANYA jika ada kode aktif & published dari Owner) */}
      {activeRedeemCode && (() => {
        const startMs = new Date(activeRedeemCode.mulai_pada).getTime();
        const endMs = new Date(activeRedeemCode.selesai_pada).getTime();
        const isStarted = now >= startMs;
        const alreadyClaimed = activeRedeemCode.claimed_by.includes(currentUser.user_id);

        return (
          <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/35 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-white">KODE REDEEM AKTIF</h4>
                  <p className="text-[11px] text-[#D4AF37]">
                    Hadiah:{' '}
                    {activeRedeemCode.hadiah_type === 'coin'
                      ? `${activeRedeemCode.hadiah_coin} Coin`
                      : `Border ${activeRedeemCode.hadiah_border?.toUpperCase()}`}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                {!isStarted ? (
                  <div>
                    <span className="text-[10px] text-stone-400 block">Mulai dalam:</span>
                    <span className="font-heading font-black text-xs text-white tracking-wider">
                      {formatCountdown(startMs - now)}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] text-emerald-400 block font-semibold">AKTIF</span>
                    <span className="text-[10px] text-stone-400">
                      Kuota: {activeRedeemCode.max_orang - activeRedeemCode.dipakai_count}/{activeRedeemCode.max_orang}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {isStarted && (
              <div className="text-[9.5px] text-stone-500 flex items-center gap-1 mt-2">
                <Clock className="w-2.5 h-2.5" />
                <span>Sisa waktu: {formatCountdown(endMs - now)}</span>
              </div>
            )}

            {alreadyClaimed ? (
              <div className="mt-3 p-2.5 rounded-xl bg-[#1C1C1C] border border-[#262626] text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Lu udah claim kode redeem ini!</span>
              </div>
            ) : (
              <form onSubmit={handleClaimRedeem} className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={redeemInput}
                  onChange={(e) => setRedeemInput(e.target.value.toUpperCase())}
                  placeholder="Masukkan Kode"
                  disabled={!isStarted}
                  className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-xs font-heading font-bold uppercase tracking-wider text-white focus:outline-none focus:border-[#D4AF37] disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={!isStarted || isClaimingRedeem}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-200 disabled:opacity-40 text-black font-heading font-bold text-xs shrink-0 transition-transform active:scale-95"
                >
                  {isClaimingRedeem ? '...' : 'Claim'}
                </button>
              </form>
            )}

            {redeemFeedback && (
              <div
                className={`mt-2.5 p-2 rounded-xl text-[11px] text-center font-medium ${
                  redeemFeedback.isError
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {redeemFeedback.text}
              </div>
            )}

            {/* Compact Redeem Claimers Strip */}
            {(() => {
              const claimList =
                activeRedeemCode.claims && activeRedeemCode.claims.length > 0
                  ? activeRedeemCode.claims
                  : activeRedeemCode.claimed_by.map((uid) => {
                      const u = allUsers.find((usr) => usr.user_id === uid);
                      return {
                        user_id: uid,
                        nama: u?.nama || `User ${uid}`,
                        username: u?.username || '',
                        reward_text:
                          activeRedeemCode.hadiah_type === 'coin'
                            ? `+${activeRedeemCode.hadiah_coin} Coin`
                            : `Border ${activeRedeemCode.hadiah_border?.toUpperCase()}`,
                        created_at: activeRedeemCode.created_at,
                      };
                    });

              return (
                <button
                  type="button"
                  onClick={() =>
                    setClaimersModal({
                      title: 'Yang Udah Claim Kode Redeem',
                      subtitle: `Kuota ${activeRedeemCode.dipakai_count}/${activeRedeemCode.max_orang}`,
                      items: claimList.map((c) => ({
                        key: `${c.user_id}-${c.created_at}`,
                        nama: c.nama,
                        username: c.username,
                        extra: c.reward_text,
                      })),
                    })
                  }
                  className="mt-2.5 w-full px-2.5 py-1.5 rounded-lg bg-black/35 hover:bg-black/50 border border-white/5 flex items-center justify-between gap-2 text-[10px] text-stone-300 transition-colors"
                >
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <Users className="w-3 h-3 text-[#D4AF37] shrink-0" />
                    <span className="truncate">
                      {claimList.length === 0
                        ? 'Belum ada yang claim'
                        : `Yang dapet (${claimList.length}): ${claimList
                            .slice(0, 2)
                            .map((c) => (c.username ? `@${c.username}` : c.nama))
                            .join(', ')}${claimList.length > 2 ? ` +${claimList.length - 2}` : ''}`}
                    </span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-stone-500 shrink-0" />
                </button>
              );
            })()}
          </div>
        );
      })()}

      {/* COMPACT MODAL: LIST USER YANG DAPET */}
      {claimersModal && (
        <div
          onClick={() => setClaimersModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-2xl bg-[#141414] border border-[#2B2B2B] p-4 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#222]">
              <div>
                <h4 className="font-heading font-bold text-xs text-white">{claimersModal.title}</h4>
                <p className="text-[10px] text-stone-400">{claimersModal.subtitle}</p>
              </div>
              <button
                onClick={() => setClaimersModal(null)}
                className="p-1 rounded-lg bg-[#1E1E1E] text-stone-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {claimersModal.items.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500">
                Belum ada user yang dapet.
              </div>
            ) : (
              <div className="mt-2.5 max-h-60 overflow-y-auto space-y-1.5 no-scrollbar">
                {claimersModal.items.map((item, idx) => (
                  <div
                    key={`${item.key}-${idx}`}
                    className="px-2.5 py-2 rounded-xl bg-[#191919] border border-[#242424] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-white text-[11px] truncate">{item.nama}</div>
                      {item.username && (
                        <div className="text-[9.5px] text-stone-400 truncate">@{item.username}</div>
                      )}
                    </div>
                    {item.extra && (
                      <span className="text-[10px] font-bold text-[#D4AF37] shrink-0">
                        {item.extra}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
