import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, CheckCircle2, RotateCw, Trophy, ChevronRight, X } from 'lucide-react';

export const CoinGratisView: React.FC = () => {
  const {
    currentUser,
    isOwner,
    checkInToday,
    dailyMissions,
    claimMission,
    spinRoulette,
    rouletteSpunToday,
    rouletteWinners,
    setToast,
  } = useApp();

  const [isSpinning, setIsSpinning] = useState(false);
  const [rouletteRotation, setRouletteRotation] = useState(0);
  const [rouletteResult, setRouletteResult] = useState<{ text: string; gain: number; isZonk: boolean } | null>(null);
  const [isWinnersModalOpen, setIsWinnersModalOpen] = useState(false);

  const isCheckedInToday = currentUser.checkin_terakhir === new Date().toISOString().split('T')[0];

  const checkinDays = [
    { day: 1, label: 'Hari 1', coin: 10 },
    { day: 2, label: 'Hari 2', coin: 10 },
    { day: 3, label: 'Hari 3', coin: 10 },
    { day: 4, label: 'Hari 4', coin: 10 },
    { day: 5, label: 'Hari 5', coin: 10 },
    { day: 6, label: 'Hari 6', coin: 10 },
    { day: 7, label: 'Hari 7', coin: 20 },
  ];

  const handleSpinRoulette = async () => {
    if (isSpinning) return;
    if (rouletteSpunToday && !isOwner && currentUser.coin < 10) {
      setToast('Coin lu kurang! Butuh 10 Coin buat putaran tambahan.');
      return;
    }

    setIsSpinning(true);
    setRouletteResult(null);

    const nextRot = rouletteRotation + 1800 + Math.floor(Math.random() * 360);
    setRouletteRotation(nextRot);

    const res = await spinRoulette();
    window.setTimeout(() => {
      setIsSpinning(false);
      if (res.success) {
        setRouletteResult({ text: res.rewardText, gain: res.coinGain, isZonk: res.isZonk });
      }
    }, 2600);
  };

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* 1. CHECK-IN HARIAN (TANPA STREAK / TANPA HUKUMAN) */}
      <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#D4AF37]" />
            <h4 className="font-heading font-bold text-sm text-white">Check-in Harian</h4>
          </div>
          <span className="text-[11px] text-stone-400">
            Total: <strong className="text-white">{currentUser.checkin_total || 0} hari</strong>
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 mt-3">
          {checkinDays.map((item) => {
            const isCompleted =
              item.day < currentUser.checkin_hari_ke ||
              (item.day === currentUser.checkin_hari_ke && isCheckedInToday);
            const isTodayBox = item.day === currentUser.checkin_hari_ke && !isCheckedInToday;
            const isSpecialDay7 = item.day === 7;

            let boxStyle = 'bg-[#181818] border-[#222] text-stone-500';
            if (isCompleted) {
              boxStyle = 'bg-[#15803D]/20 border-[#15803D]/40 text-emerald-400';
            } else if (isTodayBox) {
              boxStyle = 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37] animate-subtle-pulse';
            } else if (isSpecialDay7) {
              boxStyle = 'bg-[#222] border-[#D4AF37]/40 text-[#D4AF37]';
            }

            return (
              <div
                key={item.day}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${boxStyle}`}
              >
                <span className="text-[9px] font-medium uppercase tracking-tight block">
                  {item.label}
                </span>
                <span className="my-1 text-xs">
                  {isCompleted ? '✅' : isSpecialDay7 ? '🎁' : isTodayBox ? '🔲' : '•'}
                </span>
                <span className="text-[9px] font-bold leading-tight">+{item.coin}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <button
            onClick={() => checkInToday()}
            disabled={isCheckedInToday}
            className={`w-full py-3 rounded-xl font-heading font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              isCheckedInToday
                ? 'bg-[#1E1E1E] text-stone-500 cursor-not-allowed border border-[#2A2A2A]'
                : 'bg-white hover:bg-stone-200 text-black shadow-lg active:scale-[0.98]'
            }`}
          >
            {isCheckedInToday ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Udah Check-in Hari Ini! (Balik lagi besok)</span>
              </>
            ) : (
              <span>✅ CHECK-IN HARI INI</span>
            )}
          </button>
        </div>
      </div>

      {/* 2. MISI MINGGUAN (5 MISI, RESET PER MINGGU) */}
      <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#222]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">🎯</span>
              <h4 className="font-heading font-bold text-sm text-white">Misi Mingguan</h4>
            </div>
            <p className="text-[10px] text-stone-400 mt-0.5 pl-6">Reset otomatis tiap minggu (Senin)</p>
          </div>
          <span className="text-[11px] text-stone-400">
            Progress:{' '}
            <strong className="text-[#D4AF37]">
              {dailyMissions.filter((m) => m.current >= m.target).length}/{dailyMissions.length}
            </strong>
          </span>
        </div>

        <div className="space-y-2 mt-3">
          {dailyMissions.map((misi) => {
            const isDone = misi.current >= misi.target;

            return (
              <div
                key={misi.id}
                className="p-2.5 rounded-xl bg-[#181818] border border-[#222] flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-medium text-stone-200 leading-tight">{misi.judul}</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    Hadiah: <strong className="text-[#D4AF37]">+{misi.hadiahCoin} Coin</strong>
                  </div>
                </div>

                <div className="shrink-0">
                  {misi.klaim ? (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold">
                      Diklaim ✓
                    </span>
                  ) : isDone ? (
                    <button
                      onClick={() => claimMission(misi.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#c5a030] text-black text-[11px] font-heading font-bold transition-transform active:scale-95"
                    >
                      Klaim
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-[#222] text-stone-500 text-[10px] font-semibold">
                      {misi.current}/{misi.target}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-stone-400 text-center mt-3">
          Selesaiin semua misi buat kebuka Border &quot;MISI SELESAI&quot;!
        </p>
      </div>

      {/* 3. ROULETTE COIN */}
      <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <span className="text-base">🎡</span>
            <h4 className="font-heading font-bold text-sm text-white">Roulette Coin</h4>
          </div>
          <span className="text-[10px] text-stone-400">
            {rouletteSpunToday ? (isOwner ? 'Gratis Owner' : '10 Coin / putaran') : 'Gratis 1x hari ini'}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <div className="absolute -top-2 z-20 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-[#D4AF37]" />

            <div
              className="w-40 h-40 rounded-full border-4 border-[#2A2A2A] overflow-hidden transition-transform duration-[2600ms] ease-out shadow-xl flex items-center justify-center relative bg-[#1A1A1A]"
              style={{ transform: `rotate(${rouletteRotation}deg)` }}
            >
              <div className="absolute inset-0 bg-[conic-gradient(#1E1E1E_0deg_45deg,#262626_45deg_90deg,#1F1F1F_90deg_135deg,#2A2415_135deg_180deg,#2B1818_180deg_225deg,#1E1E1E_225deg_270deg,#252525_270deg_315deg,#2A2415_315deg_360deg)]" />

              <div className="relative z-10 w-12 h-12 rounded-full bg-[#111] border-2 border-[#D4AF37] flex items-center justify-center shadow-lg">
                <span className="font-heading font-black text-xs text-[#D4AF37]">NK</span>
              </div>
            </div>
          </div>

          {rouletteResult && (
            <div
              className={`mt-2 p-2.5 rounded-xl text-center text-xs font-semibold ${
                rouletteResult.isZonk
                  ? 'bg-stone-900 border border-stone-800 text-stone-400'
                  : 'bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]'
              }`}
            >
              {rouletteResult.isZonk
                ? 'Yah, Zonk! Coba lagi ya.'
                : `🎉 Mantap! Lu dapet +${rouletteResult.gain} Coin!`}
            </div>
          )}

          <button
            onClick={handleSpinRoulette}
            disabled={isSpinning}
            className={`mt-4 w-full py-3 rounded-xl font-heading font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-[0.98] ${
              isSpinning
                ? 'bg-[#222] text-stone-500 cursor-not-allowed'
                : 'bg-white hover:bg-stone-200 text-black shadow-lg'
            }`}
          >
            <RotateCw className={`w-4 h-4 text-black ${isSpinning ? 'animate-spin' : ''}`} />
            <span>
              {isSpinning
                ? 'Roda lagi muter...'
                : rouletteSpunToday
                ? isOwner
                  ? 'Puter Lagi (Gratis Owner)'
                  : 'Puter Lagi (10 Coin)'
                : 'Puter Roda Gratis!'}
            </span>
          </button>

          {/* Compact Roulette Winners Strip */}
          <button
            type="button"
            onClick={() => setIsWinnersModalOpen(true)}
            className="mt-3 w-full px-2.5 py-1.5 rounded-lg bg-[#1A1A1A] hover:bg-[#222] border border-[#282828] flex items-center justify-between gap-2 text-[10px] text-stone-300 transition-colors"
          >
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <Trophy className="w-3 h-3 text-[#D4AF37] shrink-0" />
              <span className="truncate">
                {rouletteWinners.length === 0
                  ? 'Belum ada yang dapet Roulette'
                  : `Yang dapet (${rouletteWinners.length}): ${rouletteWinners
                      .slice(0, 2)
                      .map((w) => `@${w.username} +${w.jumlah}`)
                      .join(', ')}${rouletteWinners.length > 2 ? ` +${rouletteWinners.length - 2}` : ''}`}
              </span>
            </div>
            <ChevronRight className="w-3 h-3 text-stone-500 shrink-0" />
          </button>
        </div>
      </div>

      {/* COMPACT ROULETTE WINNERS MODAL */}
      {isWinnersModalOpen && (
        <div
          onClick={() => setIsWinnersModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-2xl bg-[#141414] border border-[#2B2B2B] p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[#222]">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-[#D4AF37]" />
                <h4 className="font-heading font-bold text-xs text-white">
                  Pemenang Roulette ({rouletteWinners.length})
                </h4>
              </div>
              <button
                onClick={() => setIsWinnersModalOpen(false)}
                className="p-1 rounded-lg bg-[#1E1E1E] text-stone-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {rouletteWinners.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500">
                Belum ada yang menang Roulette.
              </div>
            ) : (
              <div className="mt-2.5 max-h-60 overflow-y-auto space-y-1.5 no-scrollbar">
                {rouletteWinners.map((w) => (
                  <div
                    key={w.id}
                    className="px-2.5 py-2 rounded-xl bg-[#191919] border border-[#242424] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-white text-[11px] truncate">{w.nama}</div>
                      <div className="text-[9.5px] text-stone-400 truncate">@{w.username}</div>
                    </div>
                    <span className="text-[10px] font-bold text-[#D4AF37] shrink-0">
                      +{w.jumlah} Coin
                    </span>
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
