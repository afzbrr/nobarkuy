import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from '../components/UserAvatar';
import { ALL_BORDERS } from '../data/borders';
import { UserProfile } from '../types';
import { Trophy, Flame, Palette, Calendar, Heart, Send, Sparkles, Crown } from 'lucide-react';

export const LeaderboardView: React.FC = () => {
  const {
    allUsers,
    voteBorder,
    setIsTransferModalOpen,
    setTransferRecipient,
  } = useApp();

  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<'sultan' | 'nobar' | 'border' | 'checkin'>('sultan');
  const [previewUser, setPreviewUser] = useState<UserProfile | null>(null);

  // STRICT REQUIREMENT: Faiz (user_id = '6189849073') NEVER enters leaderboards!
  const filteredUsers = allUsers.filter((u) => u.user_id !== '6189849073');

  // Faiz owner profile for the top showcase
  const ownerFaiz = allUsers.find((u) => u.user_id === '6189849073') || {
    user_id: '6189849073',
    nama: 'Faiz',
    username: 'istamina',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    border_saat_ini: 'faiz-ganteng',
    custom_text: 'FAIZ GANTENG',
  };

  // Sorting for Tab 1: Sultan Coin
  const sultanRankings = [...filteredUsers].sort((a, b) => b.coin - a.coin);

  // Sorting for Tab 2: Rajin Nobar (Streak first, then total)
  const nobarRankings = [...filteredUsers].sort((a, b) => {
    if (b.streak_nonton !== a.streak_nonton) return b.streak_nonton - a.streak_nonton;
    return b.total_nonton - a.total_nonton;
  });

  // Sorting for Tab 3: Border Terkeren (Total coin spent on decoration)
  const borderRankings = [...filteredUsers].sort((a, b) => b.total_hiasan_coin - a.total_hiasan_coin);

  // Sorting for Tab 4: Top Check-in
  const checkinRankings = [...filteredUsers].sort((a, b) => b.checkin_streak - a.checkin_streak);

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* 1. SHOWCASE OWNER (MANDATORY ON TOP OF ALL LEADERBOARDS) */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1A1608] to-[#251F0A] border border-[#D4AF37]/50 p-4 shadow-[0_0_20px_rgba(212,175,55,0.15)] relative overflow-hidden">
        <div className="flex items-center gap-3.5">
          <UserAvatar
            foto={ownerFaiz.foto}
            nama={ownerFaiz.nama}
            borderId="faiz-ganteng"
            customText="FAIZ GANTENG"
            showCustomText={true}
            size="lg"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#D4AF37] text-black uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-2.5 h-2.5 fill-black" />
                SHOWCASE OWNER
              </span>
            </div>
            <h4 className="font-heading font-bold text-base text-white truncate">
              Faiz <span className="text-xs text-[#D4AF37] font-normal">@{ownerFaiz.username}</span>
            </h4>
            <p className="text-[11px] text-stone-300 mt-0.5">
              Border: <strong className="text-[#D4AF37]">FAIZ GANTENG</strong> (Emas matte 3px + shimmer emas)
            </p>
            <div className="text-[10px] text-stone-400 mt-1 italic">
              *Faiz tidak masuk ke leaderboard kompetisi user.
            </div>
          </div>
        </div>
      </div>

      {/* 2. TAB SWITCHER (4 TABS) */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-[#141414] rounded-2xl border border-[#222]">
        <button
          onClick={() => setActiveLeaderboardTab('sultan')}
          className={`py-2 px-1 rounded-xl text-center transition-all ${
            activeLeaderboardTab === 'sultan'
              ? 'bg-[#1E1E1E] text-white font-bold shadow'
              : 'text-stone-400 hover:text-stone-300'
          }`}
        >
          <span className="text-sm block mb-0.5">🪙</span>
          <span className="text-[10px] leading-tight block truncate">Sultan</span>
        </button>

        <button
          onClick={() => setActiveLeaderboardTab('nobar')}
          className={`py-2 px-1 rounded-xl text-center transition-all ${
            activeLeaderboardTab === 'nobar'
              ? 'bg-[#1E1E1E] text-white font-bold shadow'
              : 'text-stone-400 hover:text-stone-300'
          }`}
        >
          <span className="text-sm block mb-0.5">🔥</span>
          <span className="text-[10px] leading-tight block truncate">Rajin Nobar</span>
        </button>

        <button
          onClick={() => setActiveLeaderboardTab('border')}
          className={`py-2 px-1 rounded-xl text-center transition-all ${
            activeLeaderboardTab === 'border'
              ? 'bg-[#1E1E1E] text-white font-bold shadow'
              : 'text-stone-400 hover:text-stone-300'
          }`}
        >
          <span className="text-sm block mb-0.5">🎨</span>
          <span className="text-[10px] leading-tight block truncate">Border Keren</span>
        </button>

        <button
          onClick={() => setActiveLeaderboardTab('checkin')}
          className={`py-2 px-1 rounded-xl text-center transition-all ${
            activeLeaderboardTab === 'checkin'
              ? 'bg-[#1E1E1E] text-white font-bold shadow'
              : 'text-stone-400 hover:text-stone-300'
          }`}
        >
          <span className="text-sm block mb-0.5">📅</span>
          <span className="text-[10px] leading-tight block truncate">Check-in</span>
        </button>
      </div>

      {/* 3. LEADERBOARD LIST CONTAINER */}
      <div className="space-y-2.5">
        {/* TAB 1: SULTAN COIN */}
        {activeLeaderboardTab === 'sultan' &&
          sultanRankings.map((user, idx) => {
            const rank = idx + 1;
            const isTop1 = rank === 1;

            return (
              <div
                key={user.user_id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                  isTop1
                    ? 'bg-gradient-to-r from-[#1A180E] to-[#141414] border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                    : 'bg-[#141414] border-[#242424]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-heading font-black text-lg w-6 text-center ${
                      isTop1 ? 'text-[#D4AF37]' : rank <= 3 ? 'text-white' : 'text-stone-500'
                    }`}
                  >
                    #{rank}
                  </span>

                  <UserAvatar
                    foto={user.foto}
                    nama={user.nama}
                    borderId={user.border_saat_ini}
                    decorations={user.decorations}
                    size="md"
                  />

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading font-bold text-xs text-white truncate max-w-[120px]">
                        {user.nama}
                      </span>
                      {isTop1 && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#D4AF37] text-black">
                          👑 SULTAN
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-stone-400">@{user.username}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-heading font-bold text-xs text-white block">
                      🪙 {user.coin.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[9px] text-stone-500">Coin</span>
                  </div>

                  <button
                    onClick={() => {
                      setTransferRecipient(user);
                      setIsTransferModalOpen(true);
                    }}
                    title="Kirim Coin ke user ini"
                    className="p-2 rounded-xl bg-[#222] hover:bg-[#2C2C2C] text-[#D4AF37] transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

        {/* TAB 2: RAJIN NOBAR */}
        {activeLeaderboardTab === 'nobar' &&
          nobarRankings.map((user, idx) => {
            const rank = idx + 1;
            const isTop1 = rank === 1;

            return (
              <div
                key={user.user_id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  isTop1
                    ? 'bg-gradient-to-r from-[#1C120A] to-[#141414] border-[#EA580C]/50'
                    : 'bg-[#141414] border-[#242424]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-heading font-black text-lg w-6 text-center ${
                      isTop1 ? 'text-[#EA580C]' : 'text-stone-400'
                    }`}
                  >
                    #{rank}
                  </span>

                  <UserAvatar
                    foto={user.foto}
                    nama={user.nama}
                    borderId={user.border_saat_ini}
                    decorations={user.decorations}
                    size="md"
                  />

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading font-bold text-xs text-white">
                        {user.nama}
                      </span>
                      {isTop1 && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#EA580C] text-white">
                          RAJA NOBAR
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5">
                      Streak <strong className="text-stone-200">{user.streak_nonton} hari</strong> • Total {user.total_nonton}x
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-[#D4AF37] font-semibold block">
                    {ALL_BORDERS.find((b) => b.id === user.border_saat_ini)?.nama}
                  </span>
                </div>
              </div>
            );
          })}

        {/* TAB 3: BORDER TERKEREN (BIG AVATAR + CUSTOM TEXT + VOTE) */}
        {activeLeaderboardTab === 'border' &&
          borderRankings.map((user, idx) => {
            const rank = idx + 1;
            const isTop1 = rank === 1;

            return (
              <div
                key={user.user_id}
                className={`p-4 rounded-2xl border flex flex-col gap-3 ${
                  isTop1
                    ? 'bg-gradient-to-b from-[#1C170B] to-[#141414] border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                    : 'bg-[#141414] border-[#242424]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`font-heading font-black text-xl ${
                        isTop1 ? 'text-[#D4AF37]' : 'text-stone-500'
                      }`}
                    >
                      #{rank}
                    </span>

                    {/* BIG AVATAR AS REQUESTED */}
                    <UserAvatar
                      foto={user.foto}
                      nama={user.nama}
                      borderId={user.border_saat_ini}
                      customText={user.custom_text}
                      showCustomText={true}
                      decorations={user.decorations}
                      size="xl"
                    />

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-heading font-bold text-sm text-white">
                          {user.nama}
                        </span>
                        {isTop1 && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#D4AF37] text-black">
                            TOP 1
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-400">@{user.username}</div>
                      <div className="text-[11px] text-[#D4AF37] font-medium mt-1">
                        Total Hiasan: {user.total_hiasan_coin.toLocaleString('id-ID')} Coin
                      </div>
                    </div>
                  </div>

                  {/* Vote Button & Count */}
                  <div className="flex flex-col items-end gap-1.5">
                    <button
                      onClick={() => voteBorder(user.user_id)}
                      className="px-3 py-1.5 rounded-xl bg-[#222] hover:bg-rose-500/20 text-rose-400 border border-[#333] hover:border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-transform active:scale-95"
                    >
                      <Heart className="w-3.5 h-3.5 fill-rose-400" />
                      <span>{user.votes_count}</span>
                    </button>
                    <button
                      onClick={() => setPreviewUser(user)}
                      className="text-[10px] text-stone-400 hover:text-white underline"
                    >
                      Lihat Border
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

        {/* TAB 4: CHECK-IN HARIAN */}
        {activeLeaderboardTab === 'checkin' &&
          checkinRankings.map((user, idx) => {
            const rank = idx + 1;
            const isTop1 = rank === 1;

            return (
              <div
                key={user.user_id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  isTop1
                    ? 'bg-gradient-to-r from-[#0E1C12] to-[#141414] border-[#15803D]/50'
                    : 'bg-[#141414] border-[#242424]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-heading font-black text-lg w-6 text-center ${
                      isTop1 ? 'text-[#15803D]' : 'text-stone-400'
                    }`}
                  >
                    #{rank}
                  </span>

                  <UserAvatar
                    foto={user.foto}
                    nama={user.nama}
                    borderId={user.border_saat_ini}
                    decorations={user.decorations}
                    size="md"
                  />

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading font-bold text-xs text-white">
                        {user.nama}
                      </span>
                      {isTop1 && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#15803D] text-white">
                          RAJA CHECK-IN
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5">
                      Streak <strong className="text-stone-200">{user.checkin_streak} hari</strong>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-heading font-bold text-xs text-emerald-400">
                    Hari ke-{user.checkin_hari_ke}
                  </span>
                </div>
              </div>
            );
          })}
      </div>

      {/* Full Border Preview Modal */}
      {previewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-xs rounded-2xl bg-[#141414] border border-[#2B2B2B] p-6 text-center shadow-2xl">
            <h4 className="font-heading font-bold text-sm text-white mb-1">
              Preview Border {previewUser.nama}
            </h4>
            <p className="text-[10px] text-stone-400 mb-6">
              Total Coin Dihabiskan: {previewUser.total_hiasan_coin.toLocaleString('id-ID')} Coin
            </p>

            <div className="py-4 flex justify-center">
              <UserAvatar
                foto={previewUser.foto}
                nama={previewUser.nama}
                borderId={previewUser.border_saat_ini}
                customText={previewUser.custom_text}
                showCustomText={true}
                decorations={previewUser.decorations}
                size="2xl"
              />
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setPreviewUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#222] text-stone-300 text-xs font-semibold"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  voteBorder(previewUser.user_id);
                  setPreviewUser(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-white text-black text-xs font-heading font-bold flex items-center justify-center gap-1.5"
              >
                <Heart className="w-3.5 h-3.5 fill-black" />
                Vote Border
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
