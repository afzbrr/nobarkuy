import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from '../components/UserAvatar';
import { ChatMessage } from '../types';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
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
  Crown,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  CheckCheck,
  Check,
  Film,
  Upload,
  AlertTriangle,
  Video,
  FileVideo,
  ExternalLink,
} from 'lucide-react';
import { isYouTubeUrl, getYouTubeId, PRESET_MOVIES, PresetMovie } from '../lib/videoHelper';

export const RoomView: React.FC = () => {
  const {
    currentRoom,
    rooms,
    joinRoom,
    leaveRoom,
    chats,
    sendChatMessage,
    sendFreeGift,
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

  // If no room is active, show room selector
  if (!currentRoom) {
    return (
      <div className="py-12 px-4 text-center select-none max-w-sm mx-auto">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#141414] border border-[#2B2B2B] flex items-center justify-center text-stone-400 mb-4">
          <Play className="w-8 h-8 text-[#D4AF37] fill-[#D4AF37]" />
        </div>
        <h3 className="font-heading font-bold text-lg text-white mb-2">
          Pilih Room Nobar Dulu!
        </h3>
        <p className="text-xs text-stone-400 mb-6 leading-relaxed">
          Pilih salah satu room yang lagi live buat nonton bareng temen-temen lu.
        </p>

        <div className="space-y-2.5">
          {rooms.slice(0, 3).map((r) => (
            <button
              key={r.id}
              onClick={() => joinRoom(r.id)}
              className="w-full p-3 rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#383838] flex items-center justify-between text-left transition-colors"
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="text-[10px] text-[#D4AF37] font-semibold">{r.genre}</div>
                <div className="text-xs font-bold text-white truncate">{r.judul}</div>
                <div className="text-[10px] text-stone-500">Host: {r.host_nama}</div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-300 font-semibold shrink-0">
                <span>Masuk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const isHost = currentRoom.host_id === currentUser.user_id;

  // Video State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCompletedWatch, setIsCompletedWatch] = useState(false);
  const [videoHasError, setVideoHasError] = useState(false);

  // Change film modal state
  const [isChangeFilmOpen, setIsChangeFilmOpen] = useState(false);
  const [changeFilmTab, setChangeFilmTab] = useState<'katalog' | 'youtube' | 'upload' | 'url'>('katalog');
  const [customYoutubeUrl, setCustomYoutubeUrl] = useState('');
  const [customDirectUrl, setCustomDirectUrl] = useState('');

  // Check if current room video is YouTube format
  const isYoutube = isYouTubeUrl(currentRoom.video_url);
  const youtubeId = isYoutube ? getYouTubeId(currentRoom.video_url) : null;

  // Reset video error and playback state when video url changes
  useEffect(() => {
    setVideoHasError(false);
    setIsPlaying(false);
  }, [currentRoom.video_url]);

  // Room UI controls
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isReactionsOn, setIsReactionsOn] = useState(false); // DEFAULT OFF per prompt
  const [isGiftDrawerOpen, setIsGiftDrawerOpen] = useState(false);
  const [isViewersOpen, setIsViewersOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [selectedChatForReadInfo, setSelectedChatForReadInfo] = useState<ChatMessage | null>(null);

  // Active floating reactions pool
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; emoji: string }[]>([]);

  // Create Poll Form State
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOpt1, setPollOpt1] = useState('');
  const [pollOpt2, setPollOpt2] = useState('');
  const [pollOpt3, setPollOpt3] = useState('');

  // Create Quiz Form State
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizChoices, setQuizChoices] = useState(['', '', '']);
  const [quizAnswer, setQuizAnswer] = useState('');

  // Auto scroll chats
  const chatScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chats]);

  // Video playback listeners
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration || 1;
    const cur = videoRef.current.currentTime || 0;
    setProgress((cur / dur) * 100);

    // Watch completion (+10 Coin reward for watching till end)
    if (cur / dur >= 0.98 && !isCompletedWatch) {
      setIsCompletedWatch(true);
      setToast('🎉 Mantap! Nonton sampe selesai dapet +10 Coin!');
    }
  };

  // Add subtle floating emoji on right side
  const triggerFloatingEmoji = (emoji: string) => {
    if (!isReactionsOn) return;
    const id = `${Date.now()}-${Math.random()}`;
    setFloatingEmojis((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 2500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput('');
  };

  // Gifts (ALL 100% FREE)
  const freeGifts = [
    { name: '🌹 Mawar', desc: 'Ungkapan keren' },
    { name: '🍿 Popcorn', desc: 'Camilan nobar' },
    { name: '🔥 Api', desc: 'Seru abis!' },
    { name: '💎 Berlian', desc: 'Mewah matte' },
    { name: '👑 Mahkota', desc: 'Sultan nobar' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-md mx-auto select-none relative overflow-hidden">
      {/* 1. TOP HEADER ROOM */}
      <div className="p-3 bg-[#111] border-b border-[#222] flex items-center justify-between gap-2 shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#222] text-[#D4AF37] border border-[#333]">
              {currentRoom.genre}
            </span>
            {currentRoom.is_private && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Code: {currentRoom.code_room}
              </span>
            )}
            <span className="text-[10px] text-stone-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {currentRoom.penonton_count}
            </span>
          </div>
          <h2 className="font-heading font-bold text-xs text-white truncate mt-0.5">
            {currentRoom.judul}
          </h2>
        </div>

        {/* Action Toggles: Mode Fokus, Ganti Film, Viewers & Leave */}
        <div className="flex items-center gap-1.5 shrink-0">
          {(isHost || isOwner) && (
            <button
              onClick={() => setIsChangeFilmOpen(true)}
              className="px-2 py-1 rounded-lg bg-[#1F1C12] border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/20 text-[10px] font-semibold flex items-center gap-1 transition-colors"
              title="Ganti Film Room"
            >
              <Film className="w-3 h-3 text-[#D4AF37]" />
              <span>Ganti Film</span>
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
            className="px-2.5 py-1 rounded-lg bg-[#222] hover:bg-rose-500/20 text-stone-400 hover:text-rose-300 border border-[#2E2E2E] text-[10px] font-semibold transition-colors"
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Code Room Bar (For Private Rooms) */}
      {currentRoom.is_private && (
        <div className="px-3 py-1.5 bg-[#171717] border-b border-[#242424] flex items-center justify-between text-[11px] text-stone-300">
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
                setToast(`Code Room "${currentRoom.code_room}" disalin! Bagikan ke temen lu.`);
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

      {/* 2. VIDEO PLAYER CONTAINER (BIG AT TOP) */}
      <div className={`relative bg-black shrink-0 transition-all ${isFocusMode ? 'flex-1' : 'h-52'}`}>
        {isYoutube && youtubeId ? (
          /* YouTube Embed Mode - Never turns black! */
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&enablejsapi=1&rel=0&playsinline=1`}
              title={currentRoom.judul}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
            {/* YouTube Indicator Badge */}
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm border border-stone-800 text-[9px] font-semibold text-rose-400 flex items-center gap-1.5 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>YouTube Mode</span>
            </div>
          </div>
        ) : videoHasError ? (
          /* Fallback when video link cannot be decoded or is blocked by browser */
          <div className="w-full h-full bg-[#121212] flex flex-col items-center justify-center p-4 text-center select-none relative overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#D4AF37] mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="font-heading font-bold text-xs text-white mb-1">
              Film Ga Bisa Diputar Dari Link Ini
            </h4>
            <p className="text-[10px] text-stone-400 max-w-xs mb-3 leading-relaxed">
              Format video ga didukung browser atau diblokir. Pilih film dari katalog rekomendasi atau upload file video lu sendiri.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <button
                onClick={() => {
                  changeRoomVideo(currentRoom.id, PRESET_MOVIES[0].video_url);
                  setVideoHasError(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#222] hover:bg-[#2A2A2A] text-stone-200 border border-[#333] text-[10px] font-semibold transition-colors"
              >
                👻 Horror
              </button>
              <button
                onClick={() => {
                  changeRoomVideo(currentRoom.id, PRESET_MOVIES[1].video_url);
                  setVideoHasError(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#222] hover:bg-[#2A2A2A] text-stone-200 border border-[#333] text-[10px] font-semibold transition-colors"
              >
                ⚡ Anime
              </button>
              {(isHost || isOwner) && (
                <button
                  onClick={() => setIsChangeFilmOpen(true)}
                  className="px-3 py-1 rounded-lg bg-white hover:bg-stone-200 text-black text-[10px] font-heading font-bold flex items-center gap-1 transition-transform active:scale-95"
                >
                  <Film className="w-3 h-3 text-black" />
                  <span>Ganti Film</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Standard HTML5 / Local Video Mode */
          <div className="relative w-full h-full group">
            <video
              ref={videoRef}
              src={currentRoom.video_url}
              className="w-full h-full object-contain"
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={() => setVideoHasError(true)}
              onEnded={() => {
                setIsPlaying(false);
                setToast('🎉 Film selesai! Nonton full dapet +10 Coin.');
              }}
            />

            {/* Big Center Play Overlay Button if Paused */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all shadow-xl z-10"
                title="Putar Video"
              >
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </button>
            )}

            {/* Video Overlays Controls */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Progress Bar */}
              <div className="w-full bg-stone-700/50 h-1 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-[#D4AF37] h-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-white text-xs">
                <div className="flex items-center gap-3">
                  <button onClick={togglePlay} className="p-1 hover:text-[#D4AF37]">
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                  </button>
                  <button onClick={toggleMute} className="p-1 hover:text-[#D4AF37]">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="text-[10px] text-stone-300 font-medium">
                    {isHost ? 'Host Controls' : 'Live Sync'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {(isHost || isOwner) && (
                    <button
                      onClick={() => setIsChangeFilmOpen(true)}
                      className="px-2 py-0.5 rounded bg-[#1C1C1C] hover:bg-[#262626] text-stone-300 text-[10px] flex items-center gap-1 border border-[#333]"
                    >
                      <Film className="w-2.5 h-2.5 text-[#D4AF37]" />
                      <span>Ganti</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        if (!document.fullscreenElement) {
                          videoRef.current.requestFullscreen?.().catch(() => {});
                        } else {
                          document.exitFullscreen?.().catch(() => {});
                        }
                      }
                    }}
                    className="p-1 hover:text-[#D4AF37]"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subtle Right Edge Floating Reactions Container (DEFAULT OFF, NEVER CENTER) */}
        {isReactionsOn && (
          <div className="absolute right-2 bottom-3 top-3 w-8 pointer-events-none flex flex-col justify-end items-center overflow-hidden">
            {floatingEmojis.map((item) => (
              <span
                key={item.id}
                className="text-base animate-float-subtle transition-all duration-1000 transform opacity-90 my-0.5 select-none"
              >
                {item.emoji}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. ACTIVE POLL / QUIZ CARD (IF RUNNING) */}
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
            <span className="text-[9px] text-[#D4AF37] font-semibold">+10 Coin & +10 Poin</span>
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

      {/* 4. CHAT SECTION (WA BUBBLE STYLE) */}
      {!isFocusMode && (
        <div
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#0D0D0D] no-scrollbar"
        >
          {chats.map((msg) => {
            const isMe = msg.user_id === currentUser.user_id;

            // System or Sawer announcement message
            if (msg.is_system || msg.is_gift) {
              return (
                <div key={msg.id} className="flex justify-center my-1">
                  <div className="px-3 py-1 rounded-full bg-[#181818] border border-[#262626] text-[10px] text-stone-300 font-medium flex items-center gap-1 shadow-sm">
                    {msg.is_gift ? <Sparkles className="w-3 h-3 text-[#D4AF37]" /> : null}
                    <span>{msg.pesan}</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar with equipped border */}
                <UserAvatar
                  foto={msg.foto}
                  nama={msg.nama}
                  borderId={msg.border}
                  customText={msg.custom_text}
                  showCustomText={false}
                  size="xs"
                />

                {/* Bubble Chat */}
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 text-xs relative ${
                    msg.is_owner
                      ? 'bg-gradient-to-r from-[#2B230B] to-[#1F1905] border border-[#D4AF37]/50 text-white'
                      : isMe
                      ? 'bg-[#222] border border-[#333] text-stone-100'
                      : 'bg-[#151515] border border-[#242424] text-stone-200'
                  }`}
                >
                  {/* Sender Name + Badges */}
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

                  {/* Message Text */}
                  <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.pesan}</p>

                  {/* Timestamp & Read Receipts */}
                  <div className="flex items-center justify-end gap-1.5 mt-1 select-none">
                    <span className="text-[8px] text-stone-500">
                      {new Date(msg.created_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {/* Button to see who read this message */}
                    <button
                      type="button"
                      onClick={() => setSelectedChatForReadInfo(msg)}
                      className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-white/10 text-[9px] font-medium transition-colors"
                      title="Lihat siapa aja yang udah baca"
                    >
                      <CheckCheck
                        className={`w-3 h-3 ${
                          msg.read_by && msg.read_by.length > 1 ? 'text-[#D4AF37]' : 'text-stone-400'
                        }`}
                      />
                      <span className={msg.read_by && msg.read_by.length > 1 ? 'text-[#D4AF37]' : 'text-stone-400'}>
                        {msg.read_by?.length || 1}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. BOTTOM CHAT INPUT BAR & TOOLBAR */}
      {!isFocusMode && (
        <div className="p-2.5 bg-[#121212] border-t border-[#1F1F1F] shrink-0 space-y-2">
          {/* Reaction & Gift Toolbar */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              {/* Reaksi Melayang Toggle (DEFAULT OFF) */}
              <button
                onClick={() => {
                  const nextState = !isReactionsOn;
                  setIsReactionsOn(nextState);
                  setToast(nextState ? 'Reaksi Melayang: ON (kecil di pinggir)' : 'Reaksi Melayang: OFF');
                }}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold border flex items-center gap-1 transition-colors ${
                  isReactionsOn
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]'
                    : 'bg-[#1C1C1C] border-[#2A2A2A] text-stone-400'
                }`}
              >
                <Smile className="w-3 h-3" />
                <span>Reaksi: {isReactionsOn ? 'ON' : 'OFF'}</span>
              </button>

              {/* Quick Emojis if reactions ON */}
              {isReactionsOn && (
                <div className="flex items-center gap-1">
                  {['🔥', '👏', '😱', '😂', '❤️'].map((em) => (
                    <button
                      key={em}
                      onClick={() => triggerFloatingEmoji(em)}
                      className="w-6 h-6 rounded-lg bg-[#181818] hover:bg-[#222] text-xs flex items-center justify-center transition-transform active:scale-90"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Host Poll / Quiz Creator Shortcut */}
              {isHost && (
                <>
                  <button
                    onClick={() => setIsCreatePollOpen(true)}
                    className="p-1.5 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] text-stone-300 hover:text-white text-[10px] flex items-center gap-1"
                    title="Buat Poll"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                  </button>
                  <button
                    onClick={() => setIsCreateQuizOpen(true)}
                    className="p-1.5 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] text-stone-300 hover:text-white text-[10px] flex items-center gap-1"
                    title="Buat Quiz"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
                  </button>
                </>
              )}

              {/* Gift Button (100% GRATIS) */}
              <button
                onClick={() => setIsGiftDrawerOpen(!isGiftDrawerOpen)}
                className="px-3 py-1 rounded-xl bg-[#1F1B12] hover:bg-[#2B2313] border border-[#D4AF37]/40 text-[#D4AF37] font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>🎁 Gift Gratis</span>
              </button>
            </div>
          </div>

          {/* Chat Form */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ketik chat bareng temen lu..."
              className="flex-1 bg-[#1A1A1A] border border-[#262626] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="w-9 h-9 rounded-xl bg-white hover:bg-stone-200 disabled:opacity-30 disabled:hover:bg-white text-black flex items-center justify-center shrink-0 transition-transform active:scale-95"
            >
              <Send className="w-4 h-4 text-black" />
            </button>
          </form>
        </div>
      )}

      {/* 6. GIFT DRAWER (ALL 100% FREE) */}
      {isGiftDrawerOpen && (
        <div className="absolute bottom-16 inset-x-2 bg-[#141414] border border-[#2A2A2A] rounded-2xl p-3 shadow-2xl z-30 animate-fade-in">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#222]">
            <span className="font-heading font-bold text-xs text-white">Sawer Gift (100% GRATIS)</span>
            <span className="text-[10px] text-stone-400">Ga pake coin atau koin asli</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {freeGifts.map((gift) => (
              <button
                key={gift.name}
                onClick={() => {
                  sendFreeGift(gift.name);
                  setIsGiftDrawerOpen(false);
                }}
                className="p-2 rounded-xl bg-[#1A1A1A] hover:bg-[#242424] border border-[#262626] flex flex-col items-center justify-center transition-transform active:scale-95"
              >
                <span className="text-xl mb-1">{gift.name.split(' ')[0]}</span>
                <span className="text-[9px] font-semibold text-stone-300 leading-none">
                  {gift.name.split(' ')[1]}
                </span>
                <span className="text-[8px] text-emerald-400 mt-1">GRATIS</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 7. VIEWERS LIST MODAL */}
      {isViewersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl bg-[#141414] border border-[#262626] p-4 shadow-2xl flex flex-col max-h-[75vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#222]">
              <h4 className="font-heading font-bold text-xs text-white">
                Penonton Nobar ({currentRoom.penonton_count})
              </h4>
              <button
                onClick={() => setIsViewersOpen(false)}
                className="text-stone-400 hover:text-white text-xs"
              >
                Tutup
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2 space-y-2 no-scrollbar">
              {allUsers.slice(0, 8).map((u) => (
                <div
                  key={u.user_id}
                  className="p-2 rounded-xl bg-[#181818] border border-[#222] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      foto={u.foto}
                      nama={u.nama}
                      borderId={u.border_saat_ini}
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

      {/* 8. CREATE POLL MODAL (HOST ONLY) */}
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

      {/* 9. CREATE QUIZ MODAL (HOST ONLY) */}
      {isCreateQuizOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl bg-[#141414] border border-[#2A2A2A] p-4 shadow-2xl text-xs">
            <h4 className="font-heading font-bold text-sm text-white mb-2">Buat Quiz Nobar</h4>
            <p className="text-[10px] text-stone-400 mb-2">
              Penonton yang jawab bener dapet +10 Coin & +10 Poin.
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

      {/* 10. READ RECEIPTS MODAL: SIAPA AJA YANG UDAH BACA CHAT */}
      {selectedChatForReadInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl bg-[#141414] border border-[#2B2B2B] p-4 shadow-2xl flex flex-col max-h-[75vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#222]">
              <div className="flex items-center gap-1.5">
                <CheckCheck className="w-4 h-4 text-[#D4AF37]" />
                <h4 className="font-heading font-bold text-xs text-white">
                  Dibaca oleh ({selectedChatForReadInfo.read_by?.length || 1} penonton)
                </h4>
              </div>
              <button
                onClick={() => setSelectedChatForReadInfo(null)}
                className="text-stone-400 hover:text-white text-xs font-semibold"
              >
                Tutup
              </button>
            </div>

            {/* Snippet pesan */}
            <div className="py-2 px-3 bg-[#1A1A1A] rounded-xl my-2.5 border border-[#262626] text-xs text-stone-200 italic line-clamp-2">
              &quot;{selectedChatForReadInfo.pesan}&quot;
            </div>

            {/* List penonton yang sudah membaca */}
            <div className="flex-1 overflow-y-auto py-1 space-y-2 no-scrollbar">
              {(!selectedChatForReadInfo.read_by || selectedChatForReadInfo.read_by.length === 0) ? (
                <div className="text-center py-4 text-xs text-stone-500">
                  Belum ada pembaca lain.
                </div>
              ) : (
                selectedChatForReadInfo.read_by.map((reader) => (
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
                      <div className="truncate">
                        <span className="text-xs font-semibold text-white block truncate">
                          {reader.nama}
                        </span>
                        <span className="text-[10px] text-stone-400">@{reader.username}</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-[#D4AF37] font-medium shrink-0">
                      {new Date(reader.read_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* 11. GANTI FILM MODAL (HOST / OWNER) */}
      {isChangeFilmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#141414] border border-[#2B2B2B] p-4 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#222]">
              <div className="flex items-center gap-1.5">
                <Film className="w-4 h-4 text-[#D4AF37]" />
                <h4 className="font-heading font-bold text-sm text-white">
                  Ganti Film Room Nobar
                </h4>
              </div>
              <button
                onClick={() => setIsChangeFilmOpen(false)}
                className="text-stone-400 hover:text-white text-xs font-semibold"
              >
                Tutup
              </button>
            </div>

            <p className="text-[11px] text-stone-400 mt-2 mb-3">
              Pilih film seru dari katalog nobar, putar link YouTube, atau upload file video dari HP lu.
            </p>

            {/* Source Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#1A1A1A] border border-[#262626] mb-3 text-[10px] font-semibold">
              <button
                onClick={() => setChangeFilmTab('katalog')}
                className={`py-1.5 rounded-lg transition-colors ${
                  changeFilmTab === 'katalog' ? 'bg-[#D4AF37] text-black font-bold' : 'text-stone-400 hover:text-white'
                }`}
              >
                🎬 Katalog
              </button>
              <button
                onClick={() => setChangeFilmTab('youtube')}
                className={`py-1.5 rounded-lg transition-colors ${
                  changeFilmTab === 'youtube' ? 'bg-rose-600 text-white font-bold' : 'text-stone-400 hover:text-white'
                }`}
              >
                🔴 YouTube
              </button>
              <button
                onClick={() => setChangeFilmTab('upload')}
                className={`py-1.5 rounded-lg transition-colors ${
                  changeFilmTab === 'upload' ? 'bg-white text-black font-bold' : 'text-stone-400 hover:text-white'
                }`}
              >
                📁 Upload
              </button>
              <button
                onClick={() => setChangeFilmTab('url')}
                className={`py-1.5 rounded-lg transition-colors ${
                  changeFilmTab === 'url' ? 'bg-[#2A2A2A] text-white font-bold' : 'text-stone-400 hover:text-white'
                }`}
              >
                🔗 Direct
              </button>
            </div>

            {/* Tab 1: Katalog Preset Movies */}
            {changeFilmTab === 'katalog' && (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar max-h-72">
                {PRESET_MOVIES.map((movie) => (
                  <div
                    key={movie.id}
                    className="p-2.5 rounded-xl bg-[#181818] border border-[#242424] hover:border-[#383838] flex items-center justify-between gap-2 transition-all"
                  >
                    <img
                      src={movie.poster}
                      alt={movie.judul}
                      className="w-12 h-14 object-cover rounded-lg shrink-0 border border-stone-800"
                    />
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-semibold text-[#D4AF37] px-1 py-0.2 rounded bg-[#D4AF37]/10">
                          {movie.genre}
                        </span>
                        <span className="text-[9px] text-stone-400">{movie.durasi}</span>
                      </div>
                      <h5 className="font-heading font-bold text-xs text-white truncate mt-0.5">
                        {movie.judul}
                      </h5>
                      <p className="text-[10px] text-stone-400 line-clamp-1">{movie.deskripsi}</p>
                    </div>
                    <button
                      onClick={() => {
                        changeRoomVideo(currentRoom.id, movie.video_url);
                        setVideoHasError(false);
                        setIsChangeFilmOpen(false);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-200 text-black text-[10px] font-heading font-bold shrink-0 transition-transform active:scale-95"
                    >
                      Putar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: YouTube URL Input */}
            {changeFilmTab === 'youtube' && (
              <div className="space-y-3 py-1">
                <div>
                  <label className="text-[11px] font-medium text-stone-300 block mb-1">
                    Link Video / Live YouTube
                  </label>
                  <input
                    type="url"
                    value={customYoutubeUrl}
                    onChange={(e) => setCustomYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... atau youtu.be/..."
                    className="w-full bg-[#1A1A1A] border border-[#2B2B2B] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                {customYoutubeUrl && isYouTubeUrl(customYoutubeUrl) && (
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Link YouTube valid! Video bakal langsung di-embed tanpa layar hitam.</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={!isYouTubeUrl(customYoutubeUrl)}
                  onClick={() => {
                    if (!isYouTubeUrl(customYoutubeUrl)) {
                      setToast('Masukin link YouTube yang bener ya bro!');
                      return;
                    }
                    changeRoomVideo(currentRoom.id, customYoutubeUrl.trim());
                    setVideoHasError(false);
                    setIsChangeFilmOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-heading font-bold transition-colors"
                >
                  Putar Dari YouTube
                </button>
              </div>
            )}

            {/* Tab 3: Upload Local Video File */}
            {changeFilmTab === 'upload' && (
              <div className="space-y-3 py-2 text-center">
                <div className="border-2 border-dashed border-[#333] hover:border-[#D4AF37] rounded-2xl p-6 transition-colors bg-[#171717]">
                  <FileVideo className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
                  <h5 className="font-heading font-bold text-xs text-white mb-1">
                    Pilih File Video Dari Perangkat
                  </h5>
                  <p className="text-[10px] text-stone-400 mb-3 max-w-xs mx-auto">
                    Pilih file MP4, WebM, atau MKV dari galeri HP atau laptop lu. Langsung diputar tanpa nunggu upload!
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-stone-200 text-black text-xs font-heading font-bold cursor-pointer transition-transform active:scale-95">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih File Video</span>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const localUrl = URL.createObjectURL(file);
                          changeRoomVideo(currentRoom.id, localUrl);
                          setVideoHasError(false);
                          setIsChangeFilmOpen(false);
                          setToast(`File "${file.name}" berhasil dimuat!`);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Tab 4: Direct MP4 / WebM URL */}
            {changeFilmTab === 'url' && (
              <div className="space-y-3 py-1">
                <div>
                  <label className="text-[11px] font-medium text-stone-300 block mb-1">
                    Link Direct Video (.mp4 / .webm)
                  </label>
                  <input
                    type="url"
                    value={customDirectUrl}
                    onChange={(e) => setCustomDirectUrl(e.target.value)}
                    placeholder="https://example.com/movie.mp4"
                    className="w-full bg-[#1A1A1A] border border-[#2B2B2B] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <button
                  type="button"
                  disabled={!customDirectUrl.trim()}
                  onClick={() => {
                    if (!customDirectUrl.trim()) return;
                    changeRoomVideo(currentRoom.id, customDirectUrl.trim());
                    setVideoHasError(false);
                    setIsChangeFilmOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-stone-200 disabled:opacity-40 text-black text-xs font-heading font-bold transition-colors"
                >
                  Terapkan Link Video
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
