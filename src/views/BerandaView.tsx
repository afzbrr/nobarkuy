import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from '../components/UserAvatar';
import { GenreType, Room, CoinGiveaway, FlashSale, DailyMission } from '../types';
import { RedeemModal } from '../components/modals/RedeemModal';
import { ShopModal } from '../components/modals/ShopModal';
import {
  Gift,
  Zap,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Ticket,
  ShoppingBag,
  Users,
  Copy,
  Plus,
  Play,
  Lock,
  MessageSquare,
  Sparkles,
  Check,
  ChevronRight,
  Radio,
  Film,
  Upload,
  FileVideo,
} from 'lucide-react';
import { isYouTubeUrl, PRESET_MOVIES, PresetMovie } from '../lib/videoHelper';

export const BerandaView: React.FC = () => {
  const {
    currentUser,
    isOwner,
    broadcasts,
    giveaways,
    flashSales,
    rooms,
    joinRoom,
    joinRoomByCode,
    createRoom,
    checkInToday,
    dailyMissions,
    claimMission,
    spinRoulette,
    claimGiveaway,
    buyFlashSale,
    setToast,
  } = useApp();

  // Modals state
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);

  // Private room prompt
  const [privateRoomPrompt, setPrivateRoomPrompt] = useState<Room | null>(null);
  const [privateCodeInput, setPrivateCodeInput] = useState('');
  const [privateCodeError, setPrivateCodeError] = useState<string | null>(null);

  // Filter genre & access type (All, Public, Private)
  const [selectedGenre, setSelectedGenre] = useState<string>('Semua');
  const [roomTypeFilter, setRoomTypeFilter] = useState<'all' | 'public' | 'private'>('all');

  // Roulette local state
  const [isSpinning, setIsSpinning] = useState(false);
  const [rouletteRotation, setRouletteRotation] = useState(0);
  const [rouletteResult, setRouletteResult] = useState<{ text: string; gain: number; isZonk: boolean } | null>(null);
  const [hasFreeSpunToday, setHasFreeSpunToday] = useState(false);

  // Create room form
  const [newRoomJudul, setNewRoomJudul] = useState('');
  const [newRoomGenre, setNewRoomGenre] = useState<GenreType>('Horror');
  const [newRoomIsPrivate, setNewRoomIsPrivate] = useState(false);
  const [newRoomVideoUrl, setNewRoomVideoUrl] = useState(PRESET_MOVIES[0].video_url);
  const [createRoomSourceTab, setCreateRoomSourceTab] = useState<'katalog' | 'youtube' | 'upload' | 'url'>('katalog');
  const [selectedPresetMovie, setSelectedPresetMovie] = useState<PresetMovie>(PRESET_MOVIES[0]);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Time & Evening warning (past 20:00 check)
  const currentHour = new Date().getHours();
  const isEvening = currentHour >= 20;
  const isCheckedInToday = currentUser.checkin_terakhir === new Date().toISOString().split('T')[0];

  // Active Broadcast Banner
  const bannerBroadcast = broadcasts.find((b) => b.jenis === 'banner');

  // Active Giveaway & Flash Sale
  const activeGiveaway = giveaways[0];
  const activeFlashSale = flashSales[0];

  // Giveaway Countdown formatted
  const [gwTimeLeft, setGwTimeLeft] = useState({ minutes: 0, seconds: 0, isStarted: false });
  const [fsTimeLeft, setFsTimeLeft] = useState({ minutes: 0, seconds: 0, isStarted: false });

  useEffect(() => {
    const updateCountdowns = () => {
      const now = Date.now();
      if (activeGiveaway) {
        const diff = new Date(activeGiveaway.mulai_pada).getTime() - now;
        if (diff <= 0) {
          setGwTimeLeft({ minutes: 0, seconds: 0, isStarted: true });
        } else {
          setGwTimeLeft({
            minutes: Math.floor(diff / 60000),
            seconds: Math.floor((diff % 60000) / 1000),
            isStarted: false,
          });
        }
      }

      if (activeFlashSale) {
        const diff = new Date(activeFlashSale.mulai_pada).getTime() - now;
        if (diff <= 0) {
          setFsTimeLeft({ minutes: 0, seconds: 0, isStarted: true });
        } else {
          setFsTimeLeft({
            minutes: Math.floor(diff / 60000),
            seconds: Math.floor((diff % 60000) / 1000),
            isStarted: false,
          });
        }
      }
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [activeGiveaway, activeFlashSale]);

  // Handle Roulette Spin
  const handleSpinRoulette = () => {
    if (isSpinning) return;
    if (hasFreeSpunToday && !isOwner && currentUser.coin < 50) {
      setToast('Coin lu kurang! Butuh 50 Coin buat putaran tambahan.');
      return;
    }

    setIsSpinning(true);
    setRouletteResult(null);

    // Spin animation with 5 rounds + random degree
    const randomAdd = 1800 + Math.floor(Math.random() * 360);
    const nextRot = rouletteRotation + randomAdd;
    setRouletteRotation(nextRot);

    setTimeout(() => {
      setIsSpinning(false);
      setHasFreeSpunToday(true);
      const res = spinRoulette();
      setRouletteResult({ text: res.result, gain: res.coinGain, isZonk: res.isZonk });
    }, 3000);
  };

  // Handle Join Private Room with 6 Digit Code
  const handleJoinPrivateSubmit = () => {
    setPrivateCodeError(null);
    const code = privateCodeInput.trim();
    if (!code) {
      setPrivateCodeError('Masukin 6 digit Code Room dulu bro!');
      return;
    }
    // If specific room prompt was selected with valid id
    if (privateRoomPrompt?.id) {
      const res = joinRoom(privateRoomPrompt.id, code);
      if (!res.success) {
        setPrivateCodeError(res.message);
      } else {
        setPrivateRoomPrompt(null);
        setPrivateCodeInput('');
      }
    } else {
      // Find room by code directly
      const res = joinRoomByCode(code);
      if (!res.success) {
        setPrivateCodeError(res.message);
      } else {
        setPrivateRoomPrompt(null);
        setPrivateCodeInput('');
      }
    }
  };

  // Handle Create Room Submit
  const handleCreateRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomJudul.trim()) {
      setToast('Judul room wajib diisi!');
      return;
    }

    let finalVideoUrl = newRoomVideoUrl.trim();
    if (createRoomSourceTab === 'katalog') {
      finalVideoUrl = selectedPresetMovie.video_url;
    } else if (createRoomSourceTab === 'youtube') {
      if (!isYouTubeUrl(finalVideoUrl)) {
        setToast('Link YouTube belum valid bro!');
        return;
      }
    }

    if (!finalVideoUrl) {
      finalVideoUrl = PRESET_MOVIES[0].video_url;
    }

    createRoom({
      judul: newRoomJudul.trim(),
      genre: newRoomGenre,
      is_private: newRoomIsPrivate,
      video_url: finalVideoUrl,
    });
    setIsCreateRoomOpen(false);
    setNewRoomJudul('');
    setNewRoomVideoUrl(PRESET_MOVIES[0].video_url);
    setSelectedPresetMovie(PRESET_MOVIES[0]);
    setUploadedFileName('');
  };

  // Filter rooms by Genre AND Access Type (All / Public / Private)
  const genresList = ['Semua', 'Horror', 'Drakor', 'Anime', 'Komedi', 'Action', 'Galau', 'Lainnya'];
  const finalFilteredRooms = rooms.filter((r: Room) => {
    const matchesGenre = selectedGenre === 'Semua' || r.genre === selectedGenre;
    const matchesType =
      roomTypeFilter === 'all' ||
      (roomTypeFilter === 'public' && !r.is_private) ||
      (roomTypeFilter === 'private' && r.is_private);
    return matchesGenre && matchesType;
  });

  // Checkin calendar 7 days representation
  const checkinDays = [
    { day: 1, label: 'Hari 1', coin: 0 },
    { day: 2, label: 'Hari 2', coin: 0 },
    { day: 3, label: 'Hari 3', coin: 0 },
    { day: 4, label: 'Hari 4', coin: 0 },
    { day: 5, label: 'Hari 5', coin: 0 },
    { day: 6, label: 'Hari 6', coin: 0 },
    { day: 7, label: 'Hari 7', coin: 10 },
  ];

  const currentStreakDay = currentUser.checkin_hari_ke;

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* 1. TOP BROADCAST BANNER (If Active) */}
      {bannerBroadcast && (
        <div className="rounded-2xl bg-gradient-to-r from-[#171717] to-[#1F1C12] border border-[#D4AF37]/35 p-3.5 flex items-start gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
            <Radio className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
                👑 Broadcast Faiz
              </span>
            </div>
            <p className="text-xs text-stone-200 mt-0.5 font-medium leading-relaxed">
              {bannerBroadcast.pesan}
            </p>
          </div>
        </div>
      )}

      {/* 2. BAGI-BAGI COIN GRATIS BANNER WITH COUNTDOWN */}
      {activeGiveaway && (
        <div className="rounded-2xl bg-[#141408] border border-[#D4AF37]/40 p-4 relative overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
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

            {/* Status / Countdown */}
            <div className="text-right">
              {activeGiveaway.status === 'upcoming' && !gwTimeLeft.isStarted ? (
                <div>
                  <span className="text-[10px] text-stone-400 block">Mulai dalam:</span>
                  <span className="font-heading font-black text-sm text-white tracking-wider">
                    {String(gwTimeLeft.minutes).padStart(2, '0')}:{String(gwTimeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
              ) : activeGiveaway.status === 'active' || gwTimeLeft.isStarted ? (
                <div>
                  <span className="text-[10px] text-emerald-400 block font-semibold">UDAH MULAI!</span>
                  <span className="font-heading font-bold text-xs text-stone-300">
                    Sisa: {activeGiveaway.jumlah_orang - activeGiveaway.claims.length}/{activeGiveaway.jumlah_orang}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] text-stone-500 font-medium">Bagi-bagi Selesai</span>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-3 pt-3 border-t border-[#262615] flex items-center justify-between gap-3">
            <div className="text-[11px] text-stone-400">
              Total: <strong className="text-white">{activeGiveaway.total_coin.toLocaleString('id-ID')} Coin</strong>
            </div>

            {activeGiveaway.status === 'upcoming' && !gwTimeLeft.isStarted ? (
              <button
                disabled
                className="px-4 py-2 rounded-xl bg-[#222] text-stone-500 text-xs font-semibold cursor-not-allowed"
              >
                Ingetin Gue
              </button>
            ) : activeGiveaway.claims.some((c) => c.user_id === currentUser.user_id) ? (
              <span className="px-3.5 py-1.5 rounded-xl bg-[#222] text-stone-400 text-xs font-semibold inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Udah Lu Ambil
              </span>
            ) : (
              <button
                onClick={() => claimGiveaway(activeGiveaway.id)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-stone-200 text-black text-xs font-heading font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-transform animate-float-subtle"
              >
                <Sparkles className="w-3.5 h-3.5 text-black" />
                AMBIL COIN!
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. FLASH SALE BORDER BANNER */}
      {activeFlashSale && (
        <div className="rounded-2xl bg-gradient-to-r from-[#170E0E] to-[#1F1212] border border-[#DC2626]/35 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#DC2626]/15 border border-[#DC2626]/30 flex items-center justify-center text-[#DC2626]">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-bold text-sm text-white">
                    FLASH SALE BORDER {activeFlashSale.border_nama}
                  </span>
                </div>
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

            {/* Countdown / Stok */}
            <div className="text-right">
              {activeFlashSale.status === 'upcoming' && !fsTimeLeft.isStarted ? (
                <div>
                  <span className="text-[10px] text-stone-400 block">Mulai dalam:</span>
                  <span className="font-heading font-black text-sm text-white tracking-wider">
                    {String(fsTimeLeft.minutes).padStart(2, '0')}:{String(fsTimeLeft.seconds).padStart(2, '0')}
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
            <span className="text-[11px] text-stone-400">
              Stok: <strong className="text-white">{activeFlashSale.stok} doang</strong>
            </span>
            <button
              onClick={() => buyFlashSale(activeFlashSale.id)}
              disabled={activeFlashSale.status === 'upcoming' && !fsTimeLeft.isStarted}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition-transform active:scale-95 ${
                activeFlashSale.status === 'upcoming' && !fsTimeLeft.isStarted
                  ? 'bg-[#222] text-stone-500 cursor-not-allowed'
                  : 'bg-white hover:bg-stone-200 text-black shadow-md'
              }`}
            >
              ⚡ BELI SEKARANG - {activeFlashSale.harga_flash} Coin!
            </button>
          </div>
        </div>
      )}

      {/* 4. CHECK-IN HARIAN (MANUAL CLICK, DAY 1-6 = 0 COIN, DAY 7 = 10 COIN) */}
      <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#D4AF37]" />
            <h4 className="font-heading font-bold text-sm text-white">Check-in Harian</h4>
          </div>
          <span className="text-[11px] text-stone-400">
            Streak: <strong className="text-white">{currentUser.checkin_streak} hari</strong>
          </span>
        </div>

        {/* Evening Warning (After 20:00) */}
        {isEvening && !isCheckedInToday && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-amber-400 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Lu belum Check-in hari ini! Pencet Check-in sekarang biar streak lu ga reset! Tinggal{' '}
              {7 - ((currentUser.checkin_hari_ke % 7) || 7)} hari lagi dapet 10 Coin!
            </span>
          </div>
        )}

        {/* 7-Box Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 mt-3">
          {checkinDays.map((item) => {
            const isCompleted = item.day < currentStreakDay || (item.day === currentStreakDay && isCheckedInToday);
            const isTodayBox = item.day === currentStreakDay && !isCheckedInToday;
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
                <span className="text-[9px] font-bold leading-tight">
                  {item.coin > 0 ? '+10 Coin' : '0 Coin'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Manual Check-In Button */}
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
              <>
                <span>✅ CHECK-IN HARI INI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 5. MISI HARIAN (6 MISSIONS + 20 BONUS) */}
      <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <span className="text-base">🎯</span>
            <h4 className="font-heading font-bold text-sm text-white">Misi Harian Hari Ini</h4>
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
                  {isDone ? (
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
          Kalo semua misi selesai dapet Bonus +20 Coin + Badge &quot;MISI SELESAI&quot; 1 hari.
        </p>
      </div>

      {/* 6. ROULETTE COIN (5 SECTORS: 10, 20, 30, 50, ZONK) */}
      <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <span className="text-base">🎡</span>
            <h4 className="font-heading font-bold text-sm text-white">Roulette Coin</h4>
          </div>
          <span className="text-[10px] text-stone-400">
            {hasFreeSpunToday ? '50 Coin / putaran' : 'Gratis 1x hari ini'}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center py-4">
          {/* Wheel Visual */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* Top Indicator Arrow */}
            <div className="absolute -top-2 z-20 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-[#D4AF37]" />

            {/* Rotating Wheel Disc */}
            <div
              className="w-40 h-40 rounded-full border-4 border-[#2A2A2A] overflow-hidden transition-transform duration-[3000ms] cubic-bezier(0.15, 0.9, 0.2, 1) shadow-xl flex items-center justify-center relative bg-[#1A1A1A]"
              style={{ transform: `rotate(${rouletteRotation}deg)` }}
            >
              {/* Matte 5 Sectors */}
              <div className="absolute inset-0 bg-[conic-gradient(#1E1E1E_0deg_72deg,#262626_72deg_144deg,#1F1F1F_144deg_216deg,#2A2415_216deg_288deg,#2B1818_288deg_360deg)]" />

              <div className="relative z-10 w-12 h-12 rounded-full bg-[#111] border-2 border-[#D4AF37] flex items-center justify-center shadow-lg">
                <span className="font-heading font-black text-xs text-[#D4AF37]">NK</span>
              </div>
            </div>
          </div>

          {/* Outcome Result Card */}
          {rouletteResult && (
            <div
              className={`mt-2 p-2.5 rounded-xl text-center text-xs font-semibold ${
                rouletteResult.isZonk
                  ? 'bg-stone-900 border border-stone-800 text-stone-400'
                  : 'bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]'
              }`}
            >
              {rouletteResult.isZonk
                ? 'Yah, Zonk! Coba lagi besok ya.'
                : `🎉 Mantap! Lu dapet +${rouletteResult.gain} Coin!`}
            </div>
          )}

          {/* Spin Button */}
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
                : hasFreeSpunToday
                ? 'Puter Lagi (50 Coin)'
                : 'Puter Roda Gratis!'}
            </span>
          </button>
        </div>

        {/* Ticker 50 Coin Winners */}
        <div className="pt-2 border-t border-[#222] text-[10px] text-stone-500 flex items-center justify-between">
          <span>Pemenang 50 Coin hari ini:</span>
          <span className="text-stone-300 font-medium">Bimo, Sari, Faiz</span>
        </div>
      </div>

      {/* 7. QUICK ACTION BAR: REDEEM, TOKO, REFERRAL */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => setIsRedeemOpen(true)}
          className="p-3.5 rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#D4AF37]/40 flex items-center gap-3 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-[#1E1E1E] text-[#D4AF37] flex items-center justify-center">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <div className="font-heading font-bold text-xs text-white">Redeem Kode</div>
            <div className="text-[10px] text-stone-400">Klaim koin & border</div>
          </div>
        </button>

        <button
          onClick={() => setIsShopOpen(true)}
          className="p-3.5 rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#D4AF37]/40 flex items-center gap-3 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-[#1E1E1E] text-[#D4AF37] flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="font-heading font-bold text-xs text-white">Toko Border</div>
            <div className="text-[10px] text-stone-400">Border langka sultan</div>
          </div>
        </button>
      </div>

      {/* 8. UNDANG TEMEN (REFERRAL CODE - NO LINK) */}
      <div className="rounded-2xl bg-[#141414] border border-[#262626] p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1E1E1E] text-stone-300 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="font-heading font-bold text-xs text-white">Undang Temen Nobar</div>
            <div className="text-[10px] text-stone-400">Dua-duanya dapet +50 Coin pas nonton!</div>
          </div>
        </div>

        <button
          onClick={() => {
            navigator.clipboard.writeText(currentUser.kode_referral);
            setToast(`Kode Referral "${currentUser.kode_referral}" berhasil disalin!`);
          }}
          className="px-3 py-1.5 rounded-xl bg-[#222] hover:bg-[#2A2A2A] border border-[#333] text-xs font-mono font-bold text-[#D4AF37] flex items-center gap-1.5 transition-colors"
        >
          <span>{currentUser.kode_referral}</span>
          <Copy className="w-3 h-3 text-stone-400" />
        </button>
      </div>

      {/* 9. LIST ROOM YANG LAGI LIVE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-heading font-bold text-base text-white">Room Nobar Live</h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setPrivateRoomPrompt({
                  id: '',
                  judul: 'Masuk Pake Code 6 Digit',
                  host_id: '',
                  host_nama: '',
                  host_username: '',
                  host_foto: '',
                  host_border: 'pemula',
                  genre: 'Lainnya',
                  is_private: true,
                  code_room: '',
                  video_url: '',
                  status: 'live',
                  penonton_count: 0,
                  chats_count: 0,
                  created_at: '',
                });
                setPrivateCodeInput('123456');
                setPrivateCodeError(null);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-[#1C1C1C] hover:bg-[#262626] border border-[#2E2E2E] text-stone-300 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Ketik Code</span>
            </button>

            <button
              onClick={() => setIsCreateRoomOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-200 text-black text-xs font-heading font-bold flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-black" />
              Buat Room
            </button>
          </div>
        </div>

        {/* Access Type Filter: Semua vs Publik vs Private */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#141414] rounded-xl border border-[#242424] text-xs">
          <button
            onClick={() => setRoomTypeFilter('all')}
            className={`py-1.5 rounded-lg text-center font-semibold transition-all ${
              roomTypeFilter === 'all'
                ? 'bg-[#222] text-white shadow'
                : 'text-stone-400 hover:text-stone-300'
            }`}
          >
            Semua ({rooms.length})
          </button>
          <button
            onClick={() => setRoomTypeFilter('public')}
            className={`py-1.5 rounded-lg text-center font-semibold transition-all ${
              roomTypeFilter === 'public'
                ? 'bg-[#222] text-white shadow'
                : 'text-stone-400 hover:text-stone-300'
            }`}
          >
            🌐 Publik ({rooms.filter((r: Room) => !r.is_private).length})
          </button>
          <button
            onClick={() => setRoomTypeFilter('private')}
            className={`py-1.5 rounded-lg text-center font-semibold transition-all ${
              roomTypeFilter === 'private'
                ? 'bg-[#222] text-[#D4AF37] shadow'
                : 'text-stone-400 hover:text-stone-300'
            }`}
          >
            🔒 Private ({rooms.filter((r: Room) => r.is_private).length})
          </button>
        </div>

        {/* Genre Pill Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {genresList.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3 py-1 rounded-xl text-xs font-medium shrink-0 transition-colors ${
                selectedGenre === g
                  ? 'bg-white text-black font-semibold'
                  : 'bg-[#181818] border border-[#262626] text-stone-400 hover:text-stone-200'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Room Cards List */}
        <div className="space-y-3">
          {finalFilteredRooms.length === 0 ? (
            <div className="text-center py-10 text-xs text-stone-500 bg-[#141414] rounded-2xl border border-[#222]">
              Belum ada room di kategori ini. Yuk buat room baru!
            </div>
          ) : (
            finalFilteredRooms.map((room: Room) => {
              const isHost = room.host_id === currentUser.user_id;
              const canBypassCode = isHost || isOwner;

              return (
                <div
                  key={room.id}
                  className="rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#383838] p-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-[#222] text-[#D4AF37] text-[10px] font-semibold border border-[#333]">
                          {room.genre}
                        </span>
                        {room.is_private ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-[#D4AF37] text-[10px] font-semibold border border-[#D4AF37]/30 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            Private {canBypassCode ? `(Code: ${room.code_room})` : ''}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 text-[10px] font-semibold border border-sky-500/20">
                            🌐 Publik
                          </span>
                        )}
                      </div>
                      <h4 className="font-heading font-bold text-sm text-white line-clamp-1">
                        {room.judul}
                      </h4>
                    </div>

                    <div className="shrink-0 flex items-center gap-3 text-xs text-stone-400">
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-stone-400" />
                        <span>{room.penonton_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
                        <span>{room.chats_count}</span>
                      </div>
                    </div>
                  </div>

                  {/* Host info & Enter action */}
                  <div className="mt-3 pt-3 border-t border-[#222] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatar
                        foto={room.host_foto}
                        nama={room.host_nama}
                        borderId={room.host_border}
                        size="xs"
                      />
                      <div className="truncate">
                        <span className="text-[11px] font-semibold text-stone-300 block truncate">
                          Host: {room.host_nama}
                        </span>
                        <span className="text-[9px] text-stone-500">@{room.host_username}</span>
                      </div>
                    </div>

                    {room.is_private && !canBypassCode ? (
                      <button
                        onClick={() => {
                          setPrivateRoomPrompt(room);
                          setPrivateCodeInput(room.code_room === '123456' ? '123456' : '');
                          setPrivateCodeError(null);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#242424] hover:bg-[#303030] text-[#D4AF37] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Lock className="w-3 h-3 text-[#D4AF37]" />
                        <span>Ketik Code</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => joinRoom(room.id, room.code_room)}
                        className="px-4 py-1.5 rounded-xl bg-white hover:bg-stone-200 text-black text-xs font-heading font-bold flex items-center gap-1.5 transition-transform active:scale-95"
                      >
                        <Play className="w-3 h-3 text-black fill-black" />
                        <span>Masuk</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Private Room Code Input Modal */}
      {privateRoomPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl bg-[#141414] border border-[#2B2B2B] p-5 shadow-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-[#D4AF37]" />
              <h4 className="font-heading font-bold text-sm text-white">
                Masukin Code Room Private
              </h4>
            </div>
            <p className="text-[11px] text-stone-400 mb-3">
              Room private butuh 6 digit angka dari Host. Ga pake link invite!
            </p>
            <input
              type="text"
              maxLength={6}
              value={privateCodeInput}
              onChange={(e) => setPrivateCodeInput(e.target.value.replace(/\D/g, ''))}
              placeholder="Contoh: 123456"
              className="w-full bg-[#1A1A1A] border border-[#2B2B2B] rounded-xl px-3 py-2.5 text-center font-heading font-bold text-lg text-[#D4AF37] tracking-widest focus:outline-none focus:border-[#D4AF37]"
            />

            {/* Quick Demo Code Pill */}
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => setPrivateCodeInput('123456')}
                className="text-[10px] text-stone-400 hover:text-[#D4AF37] underline"
              >
                Pake Code Demo Aktif: 123456
              </button>
            </div>

            {privateCodeError && (
              <p className="text-rose-400 text-[11px] mt-2 text-center">{privateCodeError}</p>
            )}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                type="button"
                onClick={() => setPrivateRoomPrompt(null)}
                className="py-2 rounded-xl bg-[#222] text-stone-400 text-xs font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleJoinPrivateSubmit}
                className="py-2 rounded-xl bg-white text-black text-xs font-heading font-bold"
              >
                Masuk Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {isCreateRoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#141414] border border-[#2B2B2B] p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h4 className="font-heading font-bold text-base text-white mb-1">Buat Room Nobar Baru</h4>
            <p className="text-[11px] text-stone-400 mb-4">
              Ajak temen-temen lu nobar bareng dan seru-seruan di chat.
            </p>
            <form onSubmit={handleCreateRoomSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-medium text-stone-300 block mb-1">
                  Pilih Sumber Film / Video Nobar
                </label>
                {/* 4 Source Tabs */}
                <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#1A1A1A] border border-[#262626] mb-2 text-[10px] font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateRoomSourceTab('katalog');
                      setNewRoomVideoUrl(selectedPresetMovie.video_url);
                      if (!newRoomJudul) setNewRoomJudul(selectedPresetMovie.judul);
                    }}
                    className={`py-1.5 rounded-lg transition-colors ${
                      createRoomSourceTab === 'katalog'
                        ? 'bg-[#D4AF37] text-black font-bold'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    🎬 Katalog
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateRoomSourceTab('youtube')}
                    className={`py-1.5 rounded-lg transition-colors ${
                      createRoomSourceTab === 'youtube'
                        ? 'bg-rose-600 text-white font-bold'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    🔴 YouTube
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateRoomSourceTab('upload')}
                    className={`py-1.5 rounded-lg transition-colors ${
                      createRoomSourceTab === 'upload'
                        ? 'bg-white text-black font-bold'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    📁 Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateRoomSourceTab('url')}
                    className={`py-1.5 rounded-lg transition-colors ${
                      createRoomSourceTab === 'url'
                        ? 'bg-[#2A2A2A] text-white font-bold'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    🔗 Direct
                  </button>
                </div>

                {/* Tab 1: Katalog Preset Movies */}
                {createRoomSourceTab === 'katalog' && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar border border-[#222] rounded-xl p-1 bg-[#101010]">
                    {PRESET_MOVIES.map((movie) => {
                      const isSelected = selectedPresetMovie.id === movie.id;
                      return (
                        <div
                          key={movie.id}
                          onClick={() => {
                            setSelectedPresetMovie(movie);
                            setNewRoomVideoUrl(movie.video_url);
                            setNewRoomGenre(movie.genre as GenreType);
                            setNewRoomJudul(`Nobar ${movie.judul}`);
                          }}
                          className={`p-2 rounded-xl flex items-center gap-2.5 cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-[#1C1808] border-[#D4AF37]/80'
                              : 'bg-[#161616] border-[#222] hover:border-[#333]'
                          }`}
                        >
                          <img
                            src={movie.poster}
                            alt={movie.judul}
                            className="w-10 h-12 object-cover rounded-md shrink-0 border border-stone-800"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-semibold text-[#D4AF37]">
                                {movie.genre}
                              </span>
                              <span className="text-[9px] text-stone-500">• {movie.durasi}</span>
                            </div>
                            <h5 className="font-heading font-bold text-xs text-white truncate">
                              {movie.judul}
                            </h5>
                            <p className="text-[10px] text-stone-400 line-clamp-1">{movie.deskripsi}</p>
                          </div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tab 2: YouTube URL Input */}
                {createRoomSourceTab === 'youtube' && (
                  <div className="space-y-2 p-2.5 rounded-xl bg-[#101010] border border-[#222]">
                    <p className="text-[10px] text-stone-400">
                      Tempel link YouTube apa aja (trailer, musik video, podcast, clip).
                    </p>
                    <input
                      type="url"
                      value={newRoomVideoUrl}
                      onChange={(e) => setNewRoomVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... atau youtu.be/..."
                      className="w-full bg-[#1A1A1A] border border-[#2B2B2B] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500 text-xs"
                    />
                    {isYouTubeUrl(newRoomVideoUrl) && (
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] flex items-center gap-1.5">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Link YouTube valid! Player embed siap muter.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Upload Local Video File */}
                {createRoomSourceTab === 'upload' && (
                  <div className="p-3 text-center rounded-xl bg-[#101010] border border-dashed border-[#333]">
                    <FileVideo className="w-6 h-6 text-[#D4AF37] mx-auto mb-1.5" />
                    <p className="text-[10px] text-stone-400 mb-2">
                      Pilih file MP4/WebM dari HP/laptop lu. Ga perlu nunggu upload server!
                    </p>
                    {uploadedFileName && (
                      <div className="mb-2 px-2 py-1 rounded-md bg-[#1C1C1C] border border-[#2E2E2E] text-[10px] text-[#D4AF37] truncate font-medium">
                        🎬 File: {uploadedFileName}
                      </div>
                    )}
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-200 text-black text-[11px] font-heading font-bold cursor-pointer">
                      <Upload className="w-3 h-3" />
                      <span>{uploadedFileName ? 'Ganti File Video' : 'Pilih File Video'}</span>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const localUrl = URL.createObjectURL(file);
                            setNewRoomVideoUrl(localUrl);
                            setUploadedFileName(file.name);
                            if (!newRoomJudul) {
                              setNewRoomJudul(`Nobar ${file.name.replace(/\.[^/.]+$/, '')}`);
                            }
                            setToast(`File "${file.name}" siap diputar!`);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}

                {/* Tab 4: Direct URL */}
                {createRoomSourceTab === 'url' && (
                  <div className="p-2.5 rounded-xl bg-[#101010] border border-[#222]">
                    <input
                      type="url"
                      value={newRoomVideoUrl}
                      onChange={(e) => setNewRoomVideoUrl(e.target.value)}
                      placeholder="https://...mp4"
                      className="w-full bg-[#1A1A1A] border border-[#2B2B2B] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37] text-xs"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-medium text-stone-300 block mb-1">
                  Judul Room Nobar
                </label>
                <input
                  type="text"
                  required
                  value={newRoomJudul}
                  onChange={(e) => setNewRoomJudul(e.target.value)}
                  placeholder="Contoh: Nobar Horror Malam Jumat!"
                  className="w-full bg-[#1A1A1A] border border-[#2B2B2B] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-stone-300 block mb-1">
                  Pilih Genre Film
                </label>
                <select
                  value={newRoomGenre}
                  onChange={(e) => setNewRoomGenre(e.target.value as GenreType)}
                  className="w-full bg-[#1A1A1A] border border-[#2B2B2B] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="Horror">Horror</option>
                  <option value="Drakor">Drakor</option>
                  <option value="Anime">Anime</option>
                  <option value="Komedi">Komedi</option>
                  <option value="Action">Action</option>
                  <option value="Galau">Galau</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-stone-300 block mb-1">
                  Tipe Akses Room
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRoomIsPrivate(false)}
                    className={`py-2 rounded-xl border text-xs font-semibold ${
                      !newRoomIsPrivate
                        ? 'bg-white text-black border-white'
                        : 'bg-[#181818] text-stone-400 border-[#262626]'
                    }`}
                  >
                    🌐 Publik (Bebas Masuk)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoomIsPrivate(true)}
                    className={`py-2 rounded-xl border text-xs font-semibold ${
                      newRoomIsPrivate
                        ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                        : 'bg-[#181818] text-stone-400 border-[#262626]'
                    }`}
                  >
                    🔒 Private (Code 6 Digit)
                  </button>
                </div>
                {newRoomIsPrivate ? (
                  <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[10px] text-[#D4AF37] leading-relaxed">
                    🔒 Room Private 100% GRATIS! Pas room dibuat, lu bakal dapet <strong>Code Room 6 digit</strong> buat dibagikan ke temen tongkrongan lu.
                  </div>
                ) : (
                  <p className="text-[10px] text-stone-400 mt-1">
                    🌐 Siapa aja bisa join langsung tanpa perlu masukin code.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateRoomOpen(false)}
                  className="py-2.5 rounded-xl bg-[#222] text-stone-400 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-white text-black text-xs font-heading font-bold hover:bg-stone-200 transition-transform active:scale-95"
                >
                  Gas Buat Room!
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-modals */}
      <RedeemModal isOpen={isRedeemOpen} onClose={() => setIsRedeemOpen(false)} />
      <ShopModal isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
    </div>
  );
};
