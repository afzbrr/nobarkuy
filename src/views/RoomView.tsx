import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from '../components/UserAvatar';
import { GenreType, ChatMessage } from '../types';
import {
  Play,
  Eye,
  EyeOff,
  Smile,
  Gift,
  Send,
  HelpCircle,
  BarChart2,
  Users,
  Copy,
  RefreshCw,
  Sparkles,
  Film,
  Plus,
  Lock,
  Trash2,
  MessageSquare,
  AlertCircle,
  Power,
  Reply,
  Check,
  CheckCheck,
  X,
} from 'lucide-react';
import { isYouTubeUrl, getYouTubeId } from '../lib/videoHelper';
import { GIFT_CATALOG, getGiftById } from '../data/gifts';
import { GiftAnimationOverlay, GiftIcon3D } from '../components/GiftAnimationOverlay';

export const RoomView: React.FC = () => {
  const {
    currentRoom,
    rooms,
    joinRoom,
    joinRoomByCode,
    leaveRoom,
    endRoom,
    createRoom,
    chats,
    isSendingChat,
    sendChatMessage,
    reactToChat,
    markChatsRead,
    deleteChatMessage,
    sendGift,
    giftQueue,
    dismissGiftEvent,
    currentUser,
    isOwner,
    activePoll,
    activeQuiz,
    votePoll,
    answerQuiz,
    createPoll,
    createQuiz,
    changeRoomCode,
    changeRoomVideo,
    setIsTransferModalOpen,
    setTransferRecipient,
    allUsers,
    setToast,
  } = useApp();

  // Lobby states (when !currentRoom)
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [privateJoinCode, setPrivateJoinCode] = useState('');
  const [privateJoinError, setPrivateJoinError] = useState<string | null>(null);
  const [isJoiningPrivate, setIsJoiningPrivate] = useState(false);

  // Create Room Form State (Rule 15: YouTube ONLY, NO preset movies, 1-10 viewers)
  const [newRoomJudul, setNewRoomJudul] = useState('');
  const [newRoomGenre, setNewRoomGenre] = useState<GenreType>('Horror');
  const [newRoomVideoUrl, setNewRoomVideoUrl] = useState('');
  const [newRoomMaxViewers, setNewRoomMaxViewers] = useState<number>(5);
  const [newRoomIsPrivate, setNewRoomIsPrivate] = useState(false);
  const [createFormError, setCreateFormError] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // In-Room states
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isReactionsOn, setIsReactionsOn] = useState(false);
  const [isGiftDrawerOpen, setIsGiftDrawerOpen] = useState(false);
  const [isViewersOpen, setIsViewersOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false);
  const [isChangeVideoOpen, setIsChangeVideoOpen] = useState(false);
  const [newVideoInput, setNewVideoInput] = useState('');
  const [newVideoError, setNewVideoError] = useState<string | null>(null);
  const [isSendingGift, setIsSendingGift] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [selectedChatActionId, setSelectedChatActionId] = useState<string | null>(null);

  // Poll / Quiz Form State
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOpt1, setPollOpt1] = useState('');
  const [pollOpt2, setPollOpt2] = useState('');
  const [pollOpt3, setPollOpt3] = useState('');
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizChoices, setQuizChoices] = useState(['', '', '']);
  const [quizAnswer, setQuizAnswer] = useState('');

  const chatScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chats]);

  // Auto-mark visible chats as read (Telegram-style read receipts)
  useEffect(() => {
    if (isFocusMode || !currentRoom || !currentUser.user_id || chats.length === 0) return;
    const unreadIds = chats
      .filter((m) => !(m.read_by || []).some((r) => r.user_id === currentUser.user_id))
      .map((m) => m.id);
    if (unreadIds.length > 0) {
      markChatsRead(unreadIds);
    }
  }, [chats, currentRoom, currentUser.user_id, isFocusMode, markChatsRead]);

  const handleCreateRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFormError(null);

    if (!isYouTubeUrl(newRoomVideoUrl.trim())) {
      setCreateFormError('Link harus link YouTube');
      return;
    }
    if (!newRoomJudul.trim()) {
      setCreateFormError('Judul Room Nobar wajib diisi!');
      return;
    }
    if (newRoomMaxViewers < 1 || newRoomMaxViewers > 10) {
      setCreateFormError('Maximal 10 orang');
      return;
    }

    setIsCreatingRoom(true);
    const res = await createRoom({
      judul: newRoomJudul.trim(),
      genre: newRoomGenre,
      is_private: newRoomIsPrivate,
      video_url: newRoomVideoUrl.trim(),
      max_viewers: newRoomMaxViewers,
    });
    setIsCreatingRoom(false);

    if (!res.success) {
      setCreateFormError(res.message);
      return;
    }

    setIsCreateRoomOpen(false);
    setNewRoomJudul('');
    setNewRoomVideoUrl('');
    setNewRoomMaxViewers(5);
    setNewRoomIsPrivate(false);
  };

  const handleJoinPrivateByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrivateJoinError(null);
    const clean = privateJoinCode.trim();
    if (clean.length !== 6) {
      setPrivateJoinError('Masukin 6 digit angka Code Room!');
      return;
    }
    setIsJoiningPrivate(true);
    const res = await joinRoomByCode(clean);
    setIsJoiningPrivate(false);
    if (!res.success) {
      setPrivateJoinError(res.message);
    } else {
      setPrivateJoinCode('');
    }
  };

  // =========================================================================
  // LOBBY VIEW (WHEN NOT INSIDE A ROOM)
  // =========================================================================
  if (!currentRoom) {
    const publicRooms = rooms.filter((r) => !r.is_private && r.status === 'live');
    const genres: GenreType[] = ['Horror', 'Drakor', 'Anime', 'Komedi', 'Action', 'Galau', 'Lainnya'];

    return (
      <div className="space-y-4 pb-20 select-none">
        {/* 1. PROMINENT "+ Buat Room Nobar" BUTTON AT VERY TOP */}
        <button
          onClick={() => {
            setCreateFormError(null);
            setNewRoomVideoUrl('');
            setNewRoomJudul('');
            setIsCreateRoomOpen(true);
          }}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#FF6B00] via-[#FF2D55] to-[#7C3AED] hover:opacity-95 text-white font-heading font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(255,45,85,0.28)] transition-transform active:scale-[0.98]"
        >
          <Plus className="w-5 h-5 text-white stroke-[2.5]" />
          <span>Buat Room Nobar</span>
        </button>

        {/* 2. QUICK JOIN PRIVATE ROOM BY 6-DIGIT CODE (Beda HP Sync) */}
        <div className="rounded-2xl bg-[#141414] border border-[#262626] p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-white mb-2">
            <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Masuk Room Private (Code 6 Digit)</span>
          </div>
          <form onSubmit={handleJoinPrivateByCode} className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={privateJoinCode}
              onChange={(e) => {
                setPrivateJoinError(null);
                setPrivateJoinCode(e.target.value.replace(/\D/g, ''));
              }}
              placeholder="Ketik 6 digit code..."
              className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs font-mono font-bold tracking-widest text-[#D4AF37] focus:outline-none focus:border-[#D4AF37]"
            />
            <button
              type="submit"
              disabled={isJoiningPrivate}
              className="px-4 py-2 rounded-xl bg-white hover:bg-stone-200 disabled:opacity-40 text-black font-heading font-bold text-xs shrink-0 transition-transform active:scale-95"
            >
              {isJoiningPrivate ? '...' : 'Masuk'}
            </button>
          </form>
          {privateJoinError && (
            <p className="text-[11px] text-rose-400 mt-1.5">{privateJoinError}</p>
          )}
        </div>

        {/* 3. DAFTAR ROOM NOBAR PUBLIK */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-heading font-bold text-sm text-white">
                Daftar Room Nobar Publik
              </h3>
            </div>
            <span className="text-[11px] text-stone-400">{publicRooms.length} Live</span>
          </div>

          {publicRooms.length === 0 ? (
            <div className="rounded-2xl bg-[#141414] border border-[#222] py-12 px-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#1A1A1A] border border-[#282828] flex items-center justify-center text-stone-400 mb-3">
                <Film className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h4 className="font-heading font-bold text-sm text-white">Belum ada room live</h4>
              <p className="text-xs text-stone-400 mt-1 mb-4">Yuk buat room pertama</p>
              <button
                onClick={() => {
                  setCreateFormError(null);
                  setIsCreateRoomOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-white hover:bg-stone-200 text-black font-heading font-bold text-xs inline-flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                Buat Room
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {publicRooms.map((room) => {
                const maxV = room.max_viewers || 10;
                const isFull = room.penonton_count >= maxV && !room.viewers?.includes(currentUser.user_id);

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
                          <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 text-[10px] font-semibold border border-sky-500/20">
                            🌐 Publik
                          </span>
                        </div>
                        <h4 className="font-heading font-bold text-sm text-white line-clamp-1">
                          {room.judul}
                        </h4>
                      </div>

                      <div className="shrink-0 flex items-center gap-3 text-xs text-stone-400">
                        <div className="flex items-center gap-1 font-semibold">
                          <Users className="w-3.5 h-3.5 text-stone-400" />
                          <span>
                            {room.penonton_count}/{maxV}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
                          <span>{room.chats_count}</span>
                        </div>
                      </div>
                    </div>

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

                      {isFull ? (
                        <button
                          disabled
                          className="px-3.5 py-1.5 rounded-xl bg-[#222] text-stone-500 text-xs font-semibold cursor-not-allowed"
                        >
                          Room Penuh
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            const res = await joinRoom(room.id);
                            if (!res.success) setToast(res.message);
                          }}
                          className="px-4 py-1.5 rounded-xl bg-white hover:bg-stone-200 text-black text-xs font-heading font-bold flex items-center gap-1.5 transition-transform active:scale-95"
                        >
                          <Play className="w-3 h-3 text-black fill-black" />
                          <span>Masuk</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. MODAL: BUAT ROOM NOBAR BARU (RULE 15 EXACT SPEC) */}
        {isCreateRoomOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-[#141414] border border-[#2B2B2B] p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h4 className="font-heading font-bold text-base text-white mb-1">
                Buat Room Nobar Baru
              </h4>
              <p className="text-[11px] text-stone-400 mb-4">
                Ajak temen-temen lu nobar bareng dan seru-seruan di chat.
              </p>

              <form onSubmit={handleCreateRoomSubmit} className="space-y-3.5 text-xs">
                {/* 1. YouTube ONLY Label + Single Empty Input */}
                <div>
                  <label className="text-[11px] font-semibold text-rose-400 block mb-1.5">
                    Hanya bisa nobar video youtube
                  </label>
                  <input
                    type="text"
                    value={newRoomVideoUrl}
                    onChange={(e) => {
                      setCreateFormError(null);
                      setNewRoomVideoUrl(e.target.value);
                    }}
                    placeholder="Tempel link YouTube di sini..."
                    className="w-full bg-[#1A1A1A] border border-[#2B2B2B] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* 2. Judul Room Nobar */}
                <div>
                  <label className="text-[11px] font-medium text-stone-300 block mb-1">
                    Judul Room Nobar
                  </label>
                  <input
                    type="text"
                    value={newRoomJudul}
                    onChange={(e) => setNewRoomJudul(e.target.value)}
                    placeholder="Contoh: Nobar Horror Tengah Malam"
                    className="w-full bg-[#1A1A1A] border border-[#2B2B2B] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* 3. Pilih Genre Film */}
                <div>
                  <label className="text-[11px] font-medium text-stone-300 block mb-1">
                    Pilih Genre Film
                  </label>
                  <select
                    value={newRoomGenre}
                    onChange={(e) => setNewRoomGenre(e.target.value as GenreType)}
                    className="w-full bg-[#1A1A1A] border border-[#2B2B2B] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    {genres.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Jumlah Orang (1-10) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-stone-300">
                      Jumlah Orang (Maksimal 10)
                    </label>
                    <span className="text-[10px] text-[#D4AF37] font-bold">
                      {newRoomMaxViewers} Orang
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCreateFormError(null);
                        setNewRoomMaxViewers((v) => Math.max(1, v - 1));
                      }}
                      className="w-10 h-9 rounded-xl bg-[#1E1E1E] border border-[#2B2B2B] text-white font-bold text-base flex items-center justify-center"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={newRoomMaxViewers}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val > 10) {
                          setCreateFormError('Maximal 10 orang');
                        } else {
                          setCreateFormError(null);
                        }
                        setNewRoomMaxViewers(val);
                      }}
                      className="flex-1 bg-[#1A1A1A] border border-[#2B2B2B] rounded-xl px-3 py-2 text-center font-heading font-bold text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newRoomMaxViewers >= 10) {
                          setCreateFormError('Maximal 10 orang');
                          return;
                        }
                        setCreateFormError(null);
                        setNewRoomMaxViewers((v) => Math.min(10, v + 1));
                      }}
                      className="w-10 h-9 rounded-xl bg-[#1E1E1E] border border-[#2B2B2B] text-white font-bold text-base flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">
                    1 = Nonton Sendiri, 2-10 = Nobar Bareng
                  </p>
                </div>

                {/* 5. Tipe Akses Room */}
                <div>
                  <label className="text-[11px] font-medium text-stone-300 block mb-1">
                    Tipe Akses Room
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewRoomIsPrivate(false)}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                        !newRoomIsPrivate
                          ? 'bg-white text-black border-white font-bold'
                          : 'bg-[#181818] text-stone-400 border-[#262626]'
                      }`}
                    >
                      🌐 Publik
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRoomIsPrivate(true)}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                        newRoomIsPrivate
                          ? 'bg-[#D4AF37] text-black border-[#D4AF37] font-bold'
                          : 'bg-[#181818] text-stone-400 border-[#262626]'
                      }`}
                    >
                      🔒 Private 6 Digit
                    </button>
                  </div>
                </div>

                {createFormError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{createFormError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateRoomOpen(false)}
                    className="py-2.5 rounded-xl bg-[#222] text-stone-400 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingRoom}
                    className="py-2.5 rounded-xl bg-white hover:bg-stone-200 disabled:opacity-40 text-black font-heading font-bold"
                  >
                    {isCreatingRoom ? 'Membuat...' : 'Gas Buat Room!'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // ACTIVE ROOM VIEW
  // =========================================================================
  const isHost = currentRoom.host_id === currentUser.user_id;
  const youtubeId = getYouTubeId(currentRoom.video_url);
  const maxV = currentRoom.max_viewers || 10;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingChat) return;
    const text = chatInput.trim();
    const replyPayload = replyingTo
      ? {
          id: replyingTo.id,
          user_id: replyingTo.user_id,
          nama: replyingTo.nama,
          pesan: replyingTo.pesan,
        }
      : undefined;
    setChatInput('');
    setReplyingTo(null);
    await sendChatMessage(text, replyPayload);
  };

  const handleReactionClick = async (emoji: string) => {
    // Reactions send cleanly into chat (NO floating overlay over video!)
    await sendChatMessage(emoji);
  };

  // Active 3D gift animation queued for this room
  const activeGiftEvent = giftQueue.find((g) => g.room_id === currentRoom.id) || null;

  // Real active viewers in this room
  const roomViewersList = (currentRoom.viewers || [])
    .map((uid) => allUsers.find((u) => u.user_id === uid))
    .filter((u): u is NonNullable<typeof u> => Boolean(u));

  const selectedChatAction = selectedChatActionId
    ? chats.find((m) => m.id === selectedChatActionId) || null
    : null;

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-md mx-auto select-none relative overflow-hidden">
      {/* 3D GIFT ANIMATION OVERLAY */}
      <GiftAnimationOverlay giftEvent={activeGiftEvent} onComplete={dismissGiftEvent} />
      {/* 1. TOP HEADER ROOM */}
      <div className="p-2.5 bg-[#111] border-b border-[#222] flex items-center justify-between gap-2 shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#222] text-[#D4AF37] border border-[#333]">
              {currentRoom.genre}
            </span>
            {currentRoom.is_private && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-[#D4AF37] border border-[#D4AF37]/30">
                Code: {currentRoom.code_room}
              </span>
            )}
            <span className="text-[10px] text-stone-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {currentRoom.penonton_count}/{maxV}
            </span>
          </div>
          <h2 className="font-heading font-bold text-xs text-white truncate mt-0.5">
            {currentRoom.judul}
          </h2>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {(isHost || isOwner) && (
            <button
              onClick={() => {
                setNewVideoError(null);
                setNewVideoInput(currentRoom.video_url);
                setIsChangeVideoOpen(true);
              }}
              className="px-2 py-1 rounded-lg bg-[#1F1C12] border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/20 text-[10px] font-semibold flex items-center gap-1 transition-colors"
              title="Ganti Video YouTube"
            >
              <Film className="w-3 h-3" />
              <span>Ganti</span>
            </button>
          )}

          {isHost && (
            <button
              onClick={() => endRoom(currentRoom.id)}
              className="px-2 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 text-[10px] font-heading font-bold flex items-center gap-1 transition-colors"
              title="Selesai Nobar (Hapus Room Otomatis)"
            >
              <Power className="w-3 h-3" />
              <span>Selesai Nobar</span>
            </button>
          )}

          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            title={isFocusMode ? 'Matikan Mode Fokus' : 'Mode Fokus (Video Saja)'}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isFocusMode
                ? 'bg-white text-black border-white'
                : 'bg-[#1C1C1C] border-[#2B2B2B] text-stone-300 hover:text-white'
            }`}
          >
            {isFocusMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsViewersOpen(true)}
            title="List Penonton"
            className="p-1.5 rounded-lg bg-[#1C1C1C] border border-[#2B2B2B] text-stone-300 hover:text-white"
          >
            <Users className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={leaveRoom}
            className="px-2 py-1 rounded-lg bg-[#222] hover:bg-rose-500/20 text-stone-400 hover:text-rose-300 border border-[#2E2E2E] text-[10px] font-semibold transition-colors"
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Private Code Bar */}
      {currentRoom.is_private && (
        <div className="px-3 py-1.5 bg-[#171717] border-b border-[#242424] flex items-center justify-between text-[11px] text-stone-300 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400">Code Room:</span>
            <span className="font-mono font-bold text-[#D4AF37] tracking-wider">
              {currentRoom.code_room}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(currentRoom.code_room);
                setToast(`Code Room "${currentRoom.code_room}" disalin!`);
              }}
              className="text-[#D4AF37] hover:underline flex items-center gap-1 text-[10px] font-semibold"
            >
              <Copy className="w-2.5 h-2.5" />
              Salin
            </button>
            {isHost && (
              <button
                onClick={() => {
                  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
                  changeRoomCode(currentRoom.id, newCode);
                }}
                className="text-stone-400 hover:text-white flex items-center gap-1 text-[10px]"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                Ganti Code
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. CLEAN YOUTUBE VIDEO PLAYER (ZERO LABELS, ZERO FLOATING EMOJIS!) */}
      <div className={`relative bg-black shrink-0 transition-all ${isFocusMode ? 'flex-1' : 'h-52'}`}>
        {youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&enablejsapi=1&rel=0&playsinline=1`}
            title={currentRoom.judul}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
            Link YouTube tidak valid.
          </div>
        )}
      </div>

      {/* 3. ACTIVE POLL / QUIZ CARD */}
      {!isFocusMode && activePoll && activePoll.status === 'active' && (
        <div className="p-3 bg-[#161616] border-b border-[#252525] shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-white">
              <BarChart2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Poll: {activePoll.pertanyaan}</span>
            </div>
            <span className="text-[9px] text-stone-400">Pilih 1 jawaban</span>
          </div>

          <div className="space-y-1.5">
            {activePoll.pilihan.map((opt) => {
              const totalVotes = activePoll.pilihan.reduce((acc, curr) => acc + curr.votes, 0) || 1;
              const percent = Math.round((opt.votes / totalVotes) * 100);
              const hasVotedThis = opt.voters.includes(currentUser.user_id);

              return (
                <button
                  key={opt.id}
                  onClick={() => votePoll(opt.id)}
                  className={`w-full p-2 rounded-xl text-left text-xs relative overflow-hidden transition-all border ${
                    hasVotedThis
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                      : 'border-[#262626] bg-[#1A1A1A] hover:bg-[#222]'
                  }`}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-white/5 rounded-xl transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="font-medium text-stone-200">{opt.text}</span>
                    <span className="font-heading font-bold text-[10px] text-stone-400">
                      {percent}% ({opt.votes})
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!isFocusMode && activeQuiz && activeQuiz.status === 'active' && (
        <div className="p-3 bg-[#161616] border-b border-[#252525] shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-white">
              <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
              <span>Quiz: {activeQuiz.pertanyaan}</span>
            </div>
            <span className="text-[9px] text-[#D4AF37] font-semibold">+10 Coin &amp; +10 Poin</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {activeQuiz.pilihan.map((pilihan, idx) => {
              const myAnswer = activeQuiz.answers.find((a) => a.user_id === currentUser.user_id);
              const isSelected = myAnswer?.jawaban === pilihan;

              return (
                <button
                  key={idx}
                  onClick={() => answerQuiz(pilihan)}
                  className={`p-2 rounded-xl text-xs font-medium border text-left truncate transition-colors ${
                    isSelected
                      ? myAnswer?.benar
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-[#1A1A1A] border-[#282828] text-stone-300 hover:bg-[#222]'
                  }`}
                >
                  {pilihan}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. CHAT SECTION (TELEGRAM-STYLE REPLY, REACT, READ RECEIPTS) */}
      {!isFocusMode && (
        <div
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#0D0D0D] no-scrollbar"
        >
          {chats.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-stone-500">
              Belum ada chat. Mulai ngobrol yuk!
            </div>
          ) : (
            chats.map((msg) => {
              const isMe = msg.user_id === currentUser.user_id;
              const canDelete = isMe || isHost || isOwner;
              const otherReaders = (msg.read_by || []).filter((r) => r.user_id !== msg.user_id);
              const reactionEntries = Object.entries(msg.reactions || {}).filter(
                ([, users]) => users && users.length > 0
              );

              if (msg.is_gift) {
                const giftDef = getGiftById(msg.gift_id);
                const giftAccent = giftDef?.accentColor || '#D4AF37';
                return (
                  <div key={msg.id} className="flex justify-center my-1.5">
                    <div
                      className="px-3 py-1.5 rounded-2xl bg-[#16130D] border text-[11px] text-white font-medium flex items-center gap-2 shadow-md max-w-[92%]"
                      style={{
                        borderColor: `${giftAccent}55`,
                        boxShadow: `0 0 14px ${giftDef?.glowColor || 'rgba(212,175,55,0.18)'}`,
                      }}
                    >
                      {msg.gift_id ? (
                        <GiftIcon3D giftId={msg.gift_id} emoji={giftDef?.emoji} size="xs" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      )}
                      <span className="leading-snug">{msg.pesan}</span>
                      {typeof msg.gift_harga === 'number' && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[9px] font-heading font-bold text-[#FDE047] shrink-0">
                          🪙 {msg.gift_harga}
                        </span>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => deleteChatMessage(msg.id)}
                          className="text-stone-500 hover:text-rose-400 ml-0.5 shrink-0"
                          title="Hapus"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              if (msg.is_system) {
                return (
                  <div key={msg.id} className="flex justify-center my-1">
                    <div className="px-3 py-1 rounded-full bg-[#181818] border border-[#262626] text-[10px] text-stone-300 font-medium flex items-center gap-1.5 shadow-sm">
                      <span>{msg.pesan}</span>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => deleteChatMessage(msg.id)}
                          className="text-stone-500 hover:text-rose-400 ml-1"
                          title="Hapus"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  <UserAvatar
                    foto={msg.foto}
                    nama={msg.nama}
                    borderId={msg.border}
                    decorations={msg.decorations}
                    size="xs"
                  />

                  <div
                    onClick={() => setSelectedChatActionId(msg.id)}
                    className={`max-w-[78%] rounded-2xl px-3 py-2 text-xs relative group cursor-pointer active:scale-[0.99] transition-transform ${
                      msg.is_owner
                        ? 'bg-gradient-to-r from-[#2B230B] to-[#1F1905] border border-[#D4AF37]/50 text-white'
                        : isMe
                        ? 'bg-[#222] border border-[#333] text-stone-100'
                        : 'bg-[#151515] border border-[#242424] text-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-semibold text-[11px] text-stone-300">
                        {msg.nama}
                      </span>
                      {msg.is_owner && (
                        <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-[#D4AF37] text-black">
                          👑 OWNER
                        </span>
                      )}
                      {msg.is_host && !msg.is_owner && (
                        <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-[#333] text-white">
                          HOST
                        </span>
                      )}
                    </div>

                    {/* Quote Reply Block */}
                    {msg.reply_to && (
                      <div className="mb-1.5 pl-2 border-l-2 border-[#D4AF37] bg-black/25 rounded-r-lg py-1 pr-2 text-[10px]">
                        <div className="font-bold text-[#D4AF37] truncate">{msg.reply_to.nama}</div>
                        <div className="text-stone-400 truncate">{msg.reply_to.pesan}</div>
                      </div>
                    )}

                    <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.pesan}</p>

                    {/* Reactions Row */}
                    {reactionEntries.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {reactionEntries.map(([emoji, users]) => {
                          const iReacted = users.some((u) => u.user_id === currentUser.user_id);
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                reactToChat(msg.id, emoji);
                              }}
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 border transition-colors ${
                                iReacted
                                  ? 'bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]'
                                  : 'bg-black/30 border-white/10 text-stone-300 hover:bg-white/10'
                              }`}
                            >
                              <span>{emoji}</span>
                              <span>{users.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Timestamp + Clean Telegram Checkmark (NO number!) + Reply/Delete */}
                    <div className="flex items-center justify-end gap-1.5 mt-1 select-none">
                      <span className="text-[9px] text-stone-500">
                        {new Date(msg.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isMe && (
                        <span title={otherReaders.length > 0 ? 'Udah dibaca (klik chat buat liat)' : 'Terkirim'}>
                          {otherReaders.length > 0 ? (
                            <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-stone-500" />
                          )}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplyingTo(msg);
                        }}
                        className="text-stone-500 hover:text-[#D4AF37] transition-colors ml-0.5"
                        title="Balas chat"
                      >
                        <Reply className="w-3 h-3" />
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChatMessage(msg.id);
                          }}
                          className="text-stone-500 hover:text-rose-400 transition-colors"
                          title="Hapus chat"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 5. BOTTOM CHAT INPUT BAR & TOOLBAR */}
      {!isFocusMode && (
        <div className="p-2.5 bg-[#121212] border-t border-[#1F1F1F] shrink-0 space-y-2">
          <div className="flex items-center justify-between text-xs gap-1">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setIsReactionsOn(!isReactionsOn)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold border flex items-center gap-1 shrink-0 transition-colors ${
                  isReactionsOn
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]'
                    : 'bg-[#1C1C1C] border-[#2A2A2A] text-stone-400'
                }`}
              >
                <Smile className="w-3 h-3" />
                <span>Reaksi: {isReactionsOn ? 'ON' : 'OFF'}</span>
              </button>

              {isReactionsOn && (
                <div className="flex items-center gap-1">
                  {['🔥', '👏', '😱', '😂', '❤️'].map((em) => (
                    <button
                      key={em}
                      onClick={() => handleReactionClick(em)}
                      className="w-6 h-6 rounded-lg bg-[#181818] hover:bg-[#222] text-xs flex items-center justify-center transition-transform active:scale-90"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isHost && (
                <>
                  <button
                    onClick={() => setIsCreatePollOpen(true)}
                    className="p-1.5 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] text-stone-300 hover:text-white"
                    title="Buat Poll"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                  </button>
                  <button
                    onClick={() => setIsCreateQuizOpen(true)}
                    className="p-1.5 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] text-stone-300 hover:text-white"
                    title="Buat Quiz"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
                  </button>
                </>
              )}

              <button
                onClick={() => setIsGiftDrawerOpen(!isGiftDrawerOpen)}
                className="px-2.5 py-1 rounded-xl bg-[#1F1B12] hover:bg-[#2B2313] border border-[#D4AF37]/40 text-[#D4AF37] font-semibold text-[11px] flex items-center gap-1 transition-colors"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Gift</span>
              </button>
            </div>
          </div>

          {replyingTo && (
            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-[#1A1A1A] border-l-2 border-[#D4AF37] text-[11px]">
              <div className="min-w-0 flex-1">
                <div className="font-bold text-[#D4AF37] truncate">
                  Balas {replyingTo.nama}
                </div>
                <div className="text-stone-400 truncate">{replyingTo.pesan}</div>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={replyingTo ? `Balas ${replyingTo.nama}...` : 'Ketik chat bareng temen lu...'}
              className="flex-1 bg-[#1A1A1A] border border-[#262626] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isSendingChat}
              className="w-9 h-9 rounded-xl bg-white hover:bg-stone-200 disabled:opacity-30 text-black flex items-center justify-center shrink-0 transition-transform active:scale-95"
            >
              <Send className="w-4 h-4 text-black" />
            </button>
          </form>
        </div>
      )}

      {/* PAID 3D GIFT DRAWER (15 ITEMS) */}
      {isGiftDrawerOpen && (
        <div className="absolute bottom-20 inset-x-2 bg-[#121212] border border-[#2D2D2D] rounded-2xl p-3 shadow-2xl z-30">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#222]">
            <div>
              <span className="font-heading font-bold text-xs text-white flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Kirim Hadiah 3D ke Host</span>
              </span>
              <span className="text-[10px] text-stone-400">
                Saldo lu:{' '}
                <strong className="text-[#FDE047]">
                  {isOwner ? '∞ Infinity' : `🪙 ${currentUser.coin.toLocaleString('id-ID')} Coin`}
                </strong>
              </span>
            </div>
            <button
              onClick={() => setIsGiftDrawerOpen(false)}
              className="px-2 py-1 rounded-lg bg-[#1C1C1C] text-[10px] text-stone-400 hover:text-white"
            >
              Tutup
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto no-scrollbar grid grid-cols-3 gap-2 pr-0.5">
            {GIFT_CATALOG.map((gift) => {
              const canAfford = isOwner || currentUser.coin >= gift.harga;
              return (
                <button
                  key={gift.id}
                  disabled={!canAfford || isSendingGift}
                  onClick={async () => {
                    if (isSendingGift) return;
                    setIsSendingGift(true);
                    const res = await sendGift(gift.id);
                    setIsSendingGift(false);
                    if (res.success) {
                      setIsGiftDrawerOpen(false);
                    }
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-between gap-1.5 transition-transform active:scale-95 ${
                    canAfford
                      ? 'bg-[#191919] hover:bg-[#232323] border-[#2C2C2C]'
                      : 'bg-[#131313] border-[#202020] opacity-45 cursor-not-allowed'
                  }`}
                  style={
                    gift.tier === 'luxury' && canAfford
                      ? { borderColor: `${gift.accentColor}66` }
                      : undefined
                  }
                >
                  <GiftIcon3D giftId={gift.id} emoji={gift.emoji} size="sm" />
                  <span className="text-[10px] font-heading font-bold text-stone-100 leading-tight text-center line-clamp-1">
                    {gift.nama}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-heading font-extrabold ${
                      gift.harga >= 200
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                        : gift.harga >= 100
                        ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/30'
                        : 'bg-[#D4AF37]/15 text-[#FDE047]'
                    }`}
                  >
                    🪙 {gift.harga}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEWERS LIST MODAL (REAL ROOM VIEWERS) */}
      {isViewersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl bg-[#141414] border border-[#262626] p-4 shadow-2xl flex flex-col max-h-[75vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#222]">
              <h4 className="font-heading font-bold text-xs text-white">
                Penonton Nobar ({currentRoom.penonton_count}/{maxV})
              </h4>
              <button
                onClick={() => setIsViewersOpen(false)}
                className="text-stone-400 hover:text-white text-xs"
              >
                Tutup
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2 space-y-2 no-scrollbar">
              {roomViewersList.map((u) => (
                <div
                  key={u.user_id}
                  className="p-2 rounded-xl bg-[#181818] border border-[#222] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      foto={u.foto}
                      nama={u.nama}
                      borderId={u.border_saat_ini}
                      decorations={u.decorations}
                      size="xs"
                    />
                    <div>
                      <div className="text-xs font-semibold text-white leading-tight">{u.nama}</div>
                      <div className="text-[10px] text-stone-400">@{u.username}</div>
                    </div>
                  </div>

                  {u.user_id !== currentUser.user_id && (
                    <button
                      onClick={() => {
                        setTransferRecipient(u);
                        setIsViewersOpen(false);
                        setIsTransferModalOpen(true);
                      }}
                      className="px-2 py-1 rounded-lg bg-[#222] hover:bg-[#2A2A2A] text-[10px] text-[#D4AF37] font-semibold"
                    >
                      Kirim Coin
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CHANGE VIDEO MODAL (YOUTUBE LINK ONLY) */}
      {isChangeVideoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl bg-[#141414] border border-[#2A2A2A] p-4 shadow-2xl text-xs">
            <h4 className="font-heading font-bold text-sm text-white mb-1">Ganti Video YouTube</h4>
            <p className="text-[11px] text-rose-400 mb-3">Hanya bisa nobar video youtube</p>

            <input
              type="text"
              value={newVideoInput}
              onChange={(e) => {
                setNewVideoError(null);
                setNewVideoInput(e.target.value);
              }}
              placeholder="Tempel link YouTube di sini..."
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-white mb-2"
            />
            {newVideoError && (
              <p className="text-[11px] text-rose-400 mb-2">{newVideoError}</p>
            )}

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => setIsChangeVideoOpen(false)}
                className="py-2 rounded-xl bg-[#222] text-stone-400"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (!isYouTubeUrl(newVideoInput.trim())) {
                    setNewVideoError('Link harus link YouTube');
                    return;
                  }
                  const res = await changeRoomVideo(currentRoom.id, newVideoInput.trim());
                  if (res.success) {
                    setIsChangeVideoOpen(false);
                  } else {
                    setNewVideoError(res.message);
                  }
                }}
                className="py-2 rounded-xl bg-white text-black font-heading font-bold"
              >
                Ganti Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE POLL MODAL */}
      {isCreatePollOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl bg-[#141414] border border-[#2A2A2A] p-4 shadow-2xl text-xs">
            <h4 className="font-heading font-bold text-sm text-white mb-2">Buat Poll Penonton</h4>
            <div className="space-y-2 mb-3">
              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Pertanyaan poll..."
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white"
              />
              <input
                type="text"
                value={pollOpt1}
                onChange={(e) => setPollOpt1(e.target.value)}
                placeholder="Pilihan A..."
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white"
              />
              <input
                type="text"
                value={pollOpt2}
                onChange={(e) => setPollOpt2(e.target.value)}
                placeholder="Pilihan B..."
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white"
              />
              <input
                type="text"
                value={pollOpt3}
                onChange={(e) => setPollOpt3(e.target.value)}
                placeholder="Pilihan C (opsional)..."
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsCreatePollOpen(false)}
                className="py-2 rounded-xl bg-[#222] text-stone-400"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!pollQuestion.trim() || !pollOpt1.trim() || !pollOpt2.trim()) {
                    setToast('Isi minimal pertanyaan dan 2 pilihan!');
                    return;
                  }
                  const opts = [pollOpt1.trim(), pollOpt2.trim()];
                  if (pollOpt3.trim()) opts.push(pollOpt3.trim());
                  createPoll(pollQuestion.trim(), opts);
                  setIsCreatePollOpen(false);
                  setPollQuestion('');
                  setPollOpt1('');
                  setPollOpt2('');
                  setPollOpt3('');
                }}
                className="py-2 rounded-xl bg-white text-black font-heading font-bold"
              >
                Mulai Poll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE QUIZ MODAL */}
      {isCreateQuizOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl bg-[#141414] border border-[#2A2A2A] p-4 shadow-2xl text-xs">
            <h4 className="font-heading font-bold text-sm text-white mb-2">Buat Quiz Nobar</h4>
            <p className="text-[10px] text-stone-400 mb-2">
              Penonton yang jawab bener dapet +10 Coin &amp; +10 Poin.
            </p>
            <div className="space-y-2 mb-3">
              <input
                type="text"
                value={quizQuestion}
                onChange={(e) => setQuizQuestion(e.target.value)}
                placeholder="Pertanyaan quiz..."
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white"
              />
              <input
                type="text"
                value={quizChoices[0]}
                onChange={(e) => setQuizChoices([e.target.value, quizChoices[1], quizChoices[2]])}
                placeholder="Pilihan 1..."
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white"
              />
              <input
                type="text"
                value={quizChoices[1]}
                onChange={(e) => setQuizChoices([quizChoices[0], e.target.value, quizChoices[2]])}
                placeholder="Pilihan 2..."
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white"
              />
              <input
                type="text"
                value={quizChoices[2]}
                onChange={(e) => setQuizChoices([quizChoices[0], quizChoices[1], e.target.value])}
                placeholder="Pilihan 3..."
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white"
              />
              <input
                type="text"
                value={quizAnswer}
                onChange={(e) => setQuizAnswer(e.target.value)}
                placeholder="Jawaban Benar (harus persis sama)..."
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsCreateQuizOpen(false)}
                className="py-2 rounded-xl bg-[#222] text-stone-400"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!quizQuestion.trim() || !quizChoices[0] || !quizChoices[1] || !quizAnswer.trim()) {
                    setToast('Lengkapi pertanyaan, pilihan, dan kunci jawaban!');
                    return;
                  }
                  createQuiz(quizQuestion.trim(), quizChoices.filter(Boolean), quizAnswer.trim());
                  setIsCreateQuizOpen(false);
                  setQuizQuestion('');
                  setQuizChoices(['', '', '']);
                  setQuizAnswer('');
                }}
                className="py-2 rounded-xl bg-white text-black font-heading font-bold"
              >
                Mulai Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TELEGRAM-STYLE CHAT ACTION & READ RECEIPT MODAL */}
      {selectedChatAction && (() => {
        const readers = (selectedChatAction.read_by || []).filter(
          (r) => r.user_id !== selectedChatAction.user_id
        );
        const canDeleteSelected =
          selectedChatAction.user_id === currentUser.user_id || isHost || isOwner;

        return (
          <div
            onClick={() => setSelectedChatActionId(null)}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/80 backdrop-blur-sm"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-[#141414] border border-[#2B2B2B] p-4 shadow-2xl space-y-3"
            >
              <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#222]">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-[#D4AF37]">
                    {selectedChatAction.nama} (@{selectedChatAction.username})
                  </div>
                  <p className="text-xs text-stone-300 mt-0.5 line-clamp-2 break-words">
                    {selectedChatAction.pesan}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedChatActionId(null)}
                  className="p-1 rounded-lg bg-[#1E1E1E] text-stone-400 hover:text-white shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Emoji Reaction Picker */}
              <div>
                <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                  Kasih Reaksi Chat
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {['👍', '❤️', '🔥', '😂', '😱', '👏'].map((em) => {
                    const reacted = (selectedChatAction.reactions?.[em] || []).some(
                      (u) => u.user_id === currentUser.user_id
                    );
                    return (
                      <button
                        key={em}
                        onClick={async () => {
                          await reactToChat(selectedChatAction.id, em);
                          setSelectedChatActionId(null);
                        }}
                        className={`py-2 rounded-xl text-base flex items-center justify-center border transition-transform active:scale-90 ${
                          reacted
                            ? 'bg-[#D4AF37]/20 border-[#D4AF37]'
                            : 'bg-[#1B1B1B] border-[#282828] hover:bg-[#252525]'
                        }`}
                      >
                        {em}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className={`grid gap-2 ${canDeleteSelected ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <button
                  onClick={() => {
                    setReplyingTo(selectedChatAction);
                    setSelectedChatActionId(null);
                  }}
                  className="py-2 rounded-xl bg-white hover:bg-stone-200 text-black font-heading font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Reply className="w-3.5 h-3.5" />
                  <span>Balas Chat</span>
                </button>
                {canDeleteSelected && (
                  <button
                    onClick={async () => {
                      await deleteChatMessage(selectedChatAction.id);
                      setSelectedChatActionId(null);
                    }}
                    className="py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-heading font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>

              {/* Read By List (Telegram style) */}
              <div className="pt-2 border-t border-[#222]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-heading font-bold text-white">
                    <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                    <span>Dibaca Oleh ({readers.length})</span>
                  </div>
                </div>

                {readers.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-[#1A1A1A] text-[11px] text-stone-500 text-center">
                    Belum ada user lain yang baca chat ini.
                  </div>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 no-scrollbar">
                    {readers.map((reader) => (
                      <div
                        key={reader.user_id}
                        className="p-2 rounded-xl bg-[#181818] border border-[#242424] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <UserAvatar
                            foto={reader.foto}
                            nama={reader.nama}
                            borderId={reader.border}
                            size="xs"
                          />
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold text-white truncate">
                              {reader.nama}
                            </div>
                            <div className="text-[9.5px] text-stone-400 truncate">
                              @{reader.username}
                            </div>
                          </div>
                        </div>
                        <span className="text-[9.5px] text-stone-500 shrink-0">
                          {new Date(reader.read_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
