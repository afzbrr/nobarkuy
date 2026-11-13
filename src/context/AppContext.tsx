import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  UserProfile,
  Room,
  ChatMessage,
  CoinGiveaway,
  FlashSale,
  Poll,
  Quiz,
  RedeemCode,
  Broadcast,
  DailyMission,
  CoinHistoryItem,
  GenreType,
  RouletteWinner,
  GiftEventPayload,
  FeedPost,
  FeedLike,
  FeedComment,
} from '../types';
import { getTelegramUser, isOwnerUsername, triggerHaptic } from '../lib/telegram';
import { ALL_BORDERS } from '../data/borders';
import { sounds } from '../lib/sound';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { fetchFeedFromSupabase, subscribeFeedSupabaseRealtime } from '../lib/feedSupabase';
import { filterKataKasar } from '../lib/feedHelpers';
import { onlineHub, HubPresencePayload } from '../lib/supabaseHub';
import { getTodayKey } from '../lib/missions';
import { isYouTubeUrl } from '../lib/videoHelper';
import {
  BackendUnavailableError,
  loadPersistedUser,
  savePersistedUser,
  getLocalWeeklyMissions,
  updateLocalWeeklyProgress,
  claimLocalWeeklyMission,
  unlockLocalBordersForStats,
  createLocalRoomObject,
  hasSpunRouletteTodayLocal,
  markSpunRouletteTodayLocal,
  computeDecorationCost,
  getBorderPrice,
  getGiftDefinition,
} from '../lib/onlineFallbackStore';

export type AppTab = 'beranda' | 'room' | 'coin_gratis' | 'leaderboard' | 'border' | 'profil' | 'owner_panel';

export interface VideoSyncEvent {
  roomId: string;
  currentTime: number;
  isPlaying: boolean;
  senderId: string;
  updatedAt: number;
}

interface AppContextValue {
  isTelegramAuthenticated: boolean;
  isLoading: boolean;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  isOwner: boolean;
  onlineCount: number;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  currentRoom: Room | null;
  setCurrentRoom: (room: Room | null) => void;
  rooms: Room[];
  chats: ChatMessage[];
  isSendingChat: boolean;
  giveaways: CoinGiveaway[];
  flashSales: FlashSale[];
  redeemCodes: RedeemCode[];
  activePoll: Poll | null;
  activeQuiz: Quiz | null;
  broadcasts: Broadcast[];
  dailyMissions: DailyMission[];
  coinHistory: CoinHistoryItem[];
  userOwnedBorders: string[];
  rouletteSpunToday: boolean;
  rouletteWinners: RouletteWinner[];
  posts: FeedPost[];
  feedLikes: FeedLike[];
  feedComments: FeedComment[];
  videoSyncEvent: VideoSyncEvent | null;
  syncRoomVideo: (roomId: string, currentTime: number, isPlaying: boolean) => void;

  // Room & Chat actions
  joinRoom: (roomId: string, inputCode?: string) => Promise<{ success: boolean; message: string }>;
  joinRoomByCode: (inputCode: string) => Promise<{ success: boolean; message: string; room?: Room }>;
  leaveRoom: () => Promise<void>;
  endRoom: (roomId: string) => Promise<void>;
  createRoom: (data: { judul: string; genre: GenreType; is_private: boolean; video_url: string; max_viewers: number }) => Promise<{ success: boolean; message: string; room?: Room }>;
  sendChatMessage: (pesan: string, replyTo?: ChatMessage['reply_to']) => Promise<void>;
  reactToChat: (chatId: string, emoji: string) => Promise<void>;
  markChatsRead: (chatIds: string[]) => Promise<void>;
  deleteChatMessage: (chatId: string) => Promise<void>;
  sendGift: (giftId: string) => Promise<{ success: boolean; message: string }>;
  giftQueue: GiftEventPayload[];
  dismissGiftEvent: (eventId: string) => void;
  createPoll: (pertanyaan: string, pilihan: string[]) => Promise<void>;
  votePoll: (optionId: string) => Promise<void>;
  createQuiz: (pertanyaan: string, pilihan: string[], jawabanBenar: string) => Promise<void>;
  answerQuiz: (jawaban: string) => Promise<void>;
  changeRoomCode: (roomId: string, newCode: string) => Promise<void>;
  changeRoomVideo: (roomId: string, newVideoUrl: string) => Promise<{ success: boolean; message: string }>;

  // Economy & Features
  checkInToday: () => Promise<{ success: boolean; message: string; coinsEarned: number }>;
  claimMission: (missionId: string) => Promise<void>;
  spinRoulette: () => Promise<{ success: boolean; rewardText: string; coinGain: number; isZonk: boolean; sliceIndex: number }>;
  transferCoin: (toUserId: string, amount: number, note?: string) => Promise<{ success: boolean; message: string }>;
  claimGiveaway: (giveawayId: string) => Promise<{ success: boolean; message: string; amount: number }>;
  buyFlashSale: (flashSaleId: string) => Promise<{ success: boolean; message: string }>;
  buyShopBorder: (borderId: string) => Promise<{ success: boolean; message: string }>;
  redeemCode: (code: string) => Promise<{ success: boolean; message: string }>;
  updateBorderDecorations: (decorations: UserProfile['decorations'], customText?: string) => Promise<{ success: boolean; message: string; cost: number }>;
  equipBorder: (borderId: string) => Promise<void>;
  voteBorder: (targetUserId: string) => Promise<void>;

  // Feed Komunitas (Supabase Realtime + Backend Sync, ZERO coin!)
  createPost: (imageUrl: string, caption: string, tag: string) => Promise<{ success: boolean; message: string }>;
  deletePost: (postId: string) => Promise<{ success: boolean; message: string }>;
  toggleLikePost: (postId: string) => Promise<void>;
  addPostComment: (postId: string, isi: string, parentId?: string | null, replyToNama?: string | null) => Promise<{ success: boolean; message: string }>;
  deletePostComment: (commentId: string) => Promise<void>;
  toggleLikeComment: (commentId: string) => Promise<void>;
  reportPost: (postId: string) => Promise<void>;
  togglePinPost: (postId: string) => Promise<void>;
  toggleBanUser: (targetUserId: string) => Promise<void>;

  // Owner Panel Actions (@istamina ONLY)
  createBroadcast: (jenis: Broadcast['jenis'], judul: string, pesan: string, target: Broadcast['target'], isPublished?: boolean, aktifSampai?: string) => Promise<void>;
  toggleBroadcastPublish: (id: string, isPublished: boolean) => Promise<void>;
  deleteBroadcast: (id: string) => Promise<void>;
  createGiveaway: (perOrang: number, jumlahOrang: number, mulaiPada: string, selesaiPada: string) => Promise<{ success: boolean; message: string }>;
  deleteGiveaway: (id: string) => Promise<void>;
  createFlashSale: (borderId: string, hargaNormal: number, hargaFlash: number, stok: number, mulaiPada: string, selesaiPada: string) => Promise<{ success: boolean; message: string }>;
  deleteFlashSale: (id: string) => Promise<void>;
  createRedeemCode: (kode: string, hadiahType: 'coin' | 'border', value: string | number, maxOrang: number, mulaiPada: string, selesaiPada: string, isPublished?: boolean) => Promise<{ success: boolean; message: string }>;
  toggleRedeemPublish: (id: string, isPublished: boolean) => Promise<void>;
  deleteRedeemCode: (id: string) => Promise<void>;
  ownerGiveCoinToUser: (userId: string, amount: number) => Promise<void>;

  // Global UI states
  activeBroadcastPopup: Broadcast | null;
  dismissBroadcastPopup: () => void;
  toastMessage: string | null;
  setToast: (msg: string | null) => void;
  isWalletModalOpen: boolean;
  setIsWalletModalOpen: (open: boolean) => void;
  isTransferModalOpen: boolean;
  setIsTransferModalOpen: (open: boolean) => void;
  transferRecipient: UserProfile | null;
  setTransferRecipient: (user: UserProfile | null) => void;
}

const EMPTY_USER: UserProfile = {
  user_id: '',
  nama: '',
  username: '',
  foto: '',
  coin: 0,
  poin: 0,
  border_saat_ini: 'pemula',
  custom_text: '',
  total_hiasan_coin: 0,
  checkin_terakhir: null,
  checkin_hari_ke: 1,
  checkin_total: 0,
  total_nonton: 0,
  terakhir_nonton: null,
  created_at: '',
  decorations: {
    bingkai: 'tipis',
    efek: [],
    warna: 'default',
    sticker: [],
    animasi: 'none',
  },
  votes_count: 0,
};

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tgUser = useMemo(() => getTelegramUser(), []);
  const isTelegramAuthenticated = Boolean(tgUser && tgUser.id);
  const initialIsOwner = isOwnerUsername(tgUser?.username);

  const initialUser = useMemo<UserProfile>(() => {
    if (!tgUser) return EMPTY_USER;
    const uid = String(tgUser.id);
    const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ').trim();
    const uname = (tgUser.username || `user_${uid}`).replace(/^@/, '');
    return {
      ...EMPTY_USER,
      user_id: uid,
      nama: fullName || uname || `User ${uid}`,
      username: uname,
      foto: tgUser.photo_url || '',
      coin: initialIsOwner ? 999999999 : 1000,
      border_saat_ini: initialIsOwner ? 'faiz-ganteng' : 'pemula',
      custom_text: initialIsOwner ? 'FAIZ GANTENG' : '',
      created_at: new Date().toISOString(),
    };
  }, [tgUser, initialIsOwner]);

  const persistedInitial = useMemo(() => {
    if (!tgUser) {
      return {
        profile: EMPTY_USER,
        ownedBorders: ['pemula'],
        coinHistory: [] as CoinHistoryItem[],
      };
    }
    return loadPersistedUser(initialUser);
  }, [tgUser, initialUser]);

  const [isLoading, setIsLoading] = useState<boolean>(isTelegramAuthenticated);
  const [currentUser, setCurrentUser] = useState<UserProfile>(persistedInitial.profile);
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() =>
    tgUser ? [persistedInitial.profile] : []
  );
  const [userOwnedBorders, setUserOwnedBorders] = useState<string[]>(
    initialIsOwner ? ALL_BORDERS.map((b) => b.id) : persistedInitial.ownedBorders
  );
  const [onlineCount, setOnlineCount] = useState<number>(1);

  const [activeTab, setActiveTab] = useState<AppTab>('beranda');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [chatsMap, setChatsMap] = useState<Record<string, ChatMessage[]>>({});
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);

  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [giveaways, setGiveaways] = useState<CoinGiveaway[]>([]);
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>([]);
  const [polls, setPolls] = useState<Record<string, Poll>>({});
  const [quizzes, setQuizzes] = useState<Record<string, Quiz>>({});
  const [coinHistory, setCoinHistory] = useState<CoinHistoryItem[]>(persistedInitial.coinHistory);
  const [dailyMissions, setDailyMissions] = useState<DailyMission[]>(() =>
    tgUser ? getLocalWeeklyMissions(String(tgUser.id)) : []
  );
  const [rouletteSpunToday, setRouletteSpunToday] = useState<boolean>(() =>
    tgUser ? hasSpunRouletteTodayLocal(String(tgUser.id)) : false
  );
  const [rouletteWinners, setRouletteWinners] = useState<RouletteWinner[]>([]);
  const [giftQueue, setGiftQueue] = useState<GiftEventPayload[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [feedLikes, setFeedLikes] = useState<FeedLike[]>([]);
  const [feedComments, setFeedComments] = useState<FeedComment[]>([]);
  const [videoSyncEvent, setVideoSyncEvent] = useState<VideoSyncEvent | null>(null);

  // Global modals
  const [activeBroadcastPopup, setActiveBroadcastPopup] = useState<Broadcast | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferRecipient, setTransferRecipient] = useState<UserProfile | null>(null);

  const backendAvailableRef = useRef<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const currentUserRef = useRef<UserProfile>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const toastTimerRef = useRef<number | null>(null);
  const setToast = useCallback((msg: string | null) => {
    setToastMessage(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    if (msg) {
      toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 3500);
    }
  }, []);

  const isOwner = useMemo(
    () => isOwnerUsername(currentUser.username) || isOwnerUsername(tgUser?.username),
    [currentUser.username, tgUser?.username]
  );
  const effectiveUserOwnedBorders = useMemo(
    () => (isOwner ? ALL_BORDERS.map((b) => b.id) : userOwnedBorders),
    [isOwner, userOwnedBorders]
  );
  const currentRoom = useMemo(
    () => rooms.find((r) => r.id === currentRoomId) || null,
    [rooms, currentRoomId]
  );

  const currentRoomIdRef = useRef<string | null>(null);
  useEffect(() => {
    currentRoomIdRef.current = currentRoomId;
  }, [currentRoomId]);

  const roomsRef = useRef<Room[]>(rooms);
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  const allUsersMapRef = useRef<Record<string, UserProfile>>({});
  useEffect(() => {
    const map: Record<string, UserProfile> = {};
    allUsers.forEach((u) => {
      map[u.user_id] = u;
    });
    if (currentUser.user_id) {
      map[currentUser.user_id] = currentUser;
    }
    allUsersMapRef.current = map;
  }, [allUsers, currentUser]);

  // Persist user snapshot locally for offline / static deploy resilience
  useEffect(() => {
    if (currentUser.user_id && !backendAvailableRef.current) {
      savePersistedUser(currentUser, effectiveUserOwnedBorders, coinHistory);
    }
  }, [currentUser, effectiveUserOwnedBorders, coinHistory]);

  // Keep user inside allUsers at all times with latest profile/photo
  useEffect(() => {
    if (!currentUser.user_id) return;
    setAllUsers((prev) => {
      const exists = prev.some((u) => u.user_id === currentUser.user_id);
      if (!exists) return [currentUser, ...prev];
      return prev.map((u) => (u.user_id === currentUser.user_id ? currentUser : u));
    });
  }, [currentUser]);

  // Auto-leave room when user closes Mini App / browser tab so empty rooms delete immediately
  useEffect(() => {
    const handleLeaveOnExit = () => {
      const rId = currentRoomIdRef.current;
      const uid = currentUser.user_id;
      if (!rId || !uid) return;
      if (backendAvailableRef.current && typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon(`/api/rooms/${rId}/leave`, JSON.stringify({ user_id: uid }));
      } else {
        const room = roomsRef.current.find((r) => r.id === rId);
        if (room) {
          const nextViewers = room.viewers.filter((id) => id !== uid);
          if (nextViewers.length === 0) {
            onlineHub.emit('ROOM_ENDED', { roomId: rId });
          } else {
            onlineHub.emit('ROOM_UPDATED', {
              room: { ...room, viewers: nextViewers, penonton_count: nextViewers.length },
            });
          }
        }
      }
    };
    window.addEventListener('pagehide', handleLeaveOnExit);
    window.addEventListener('beforeunload', handleLeaveOnExit);
    return () => {
      window.removeEventListener('pagehide', handleLeaveOnExit);
      window.removeEventListener('beforeunload', handleLeaveOnExit);
    };
  }, [currentUser.user_id]);

  // Supabase Realtime Subscription for posts, comments, likes (when Supabase is configured)
  const syncFeedFromSupabase = useCallback(async () => {
    const sbData = await fetchFeedFromSupabase(allUsersMapRef.current);
    if (sbData) {
      setPosts(sbData.posts);
      setFeedLikes(sbData.likes);
      setFeedComments(sbData.comments);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    syncFeedFromSupabase();
    const unsub = subscribeFeedSupabaseRealtime({
      onRefreshNeeded: () => {
        syncFeedFromSupabase();
      },
    });
    return () => {
      unsub();
    };
  }, [syncFeedFromSupabase]);

  const seenGiftIdsRef = useRef<Set<string>>(new Set());
  const enqueueGiftEvent = useCallback((giftEvent: GiftEventPayload) => {
    if (!giftEvent?.id) return;
    if (seenGiftIdsRef.current.has(giftEvent.id)) return;
    seenGiftIdsRef.current.add(giftEvent.id);
    setGiftQueue((prev) => [...prev, giftEvent]);
  }, []);

  const dismissGiftEvent = useCallback((eventId: string) => {
    setGiftQueue((prev) => prev.filter((g) => g.id !== eventId));
  }, []);

  const setCurrentRoom = useCallback((room: Room | null) => {
    setCurrentRoomId(room ? room.id : null);
  }, []);

  // Unified realtime event handler for both WebSocket (Express) and Supabase Realtime Hub
  const handleRealtimeEvent = useCallback(
    (type: string, payload: Record<string, any>) => {
      const uid = currentUserRef.current.user_id || (tgUser?.id ? String(tgUser.id) : '');
      switch (type) {
        case 'ONLINE_COUNT':
          setOnlineCount(Math.max(1, payload.count || 1));
          break;

        case 'USER_UPDATED': {
          const updated: UserProfile = payload.user;
          if (!updated) break;
          setAllUsers((prev) => {
            const exists = prev.some((u) => u.user_id === updated.user_id);
            return exists
              ? prev.map((u) => (u.user_id === updated.user_id ? updated : u))
              : [...prev, updated];
          });
          if (updated.user_id === uid) {
            setCurrentUser((prev) => ({
              ...updated,
              foto: updated.foto || prev.foto || tgUser?.photo_url || '',
            }));
            if (payload.ownedBorders) {
              setUserOwnedBorders(payload.ownedBorders);
            }
          }
          break;
        }

        case 'ROOM_CREATED': {
          const room: Room = payload.room;
          if (!room) break;
          setRooms((prev) => (prev.some((r) => r.id === room.id) ? prev : [room, ...prev]));
          break;
        }

        case 'ROOM_UPDATED': {
          const room: Room = payload.room;
          if (!room) break;
          setRooms((prev) =>
            prev.some((r) => r.id === room.id)
              ? prev.map((r) => (r.id === room.id ? room : r))
              : [room, ...prev]
          );
          break;
        }

        case 'ROOM_ENDED': {
          const endedId: string = payload.roomId;
          if (!endedId) break;
          setRooms((prev) => prev.filter((r) => r.id !== endedId));
          setCurrentRoomId((cur) => {
            if (cur === endedId) {
              setToast('Room nobar udah ditutup sama Host.');
              setActiveTab('room');
              return null;
            }
            return cur;
          });
          break;
        }

        case 'VIDEO_SYNC': {
          const ev = payload as VideoSyncEvent;
          if (!ev?.roomId || ev.senderId === uid) break;
          setVideoSyncEvent(ev);
          break;
        }

        case 'CHAT_ADDED': {
          const { roomId, message } = payload as { roomId: string; message: ChatMessage };
          if (!roomId || !message) break;
          setChatsMap((prev) => {
            const existingList = prev[roomId] || [];
            if (existingList.some((m) => m.id === message.id)) {
              return prev;
            }
            return {
              ...prev,
              [roomId]: [...existingList, message],
            };
          });
          break;
        }

        case 'CHAT_DELETED': {
          const { roomId, chatId } = payload as { roomId: string; chatId: string };
          setChatsMap((prev) => {
            const existingList = prev[roomId];
            if (!existingList) return prev;
            return {
              ...prev,
              [roomId]: existingList.filter((m) => m.id !== chatId),
            };
          });
          break;
        }

        case 'CHAT_UPDATED': {
          const { roomId, message } = payload as { roomId: string; message: ChatMessage };
          if (!roomId || !message) break;
          setChatsMap((prev) => {
            const existingList = prev[roomId];
            if (!existingList) return prev;
            return {
              ...prev,
              [roomId]: existingList.map((m) => (m.id === message.id ? message : m)),
            };
          });
          break;
        }

        case 'CHATS_READ': {
          const { roomId, reader, chatIds } = payload as {
            roomId: string;
            reader: NonNullable<ChatMessage['read_by']>[number];
            chatIds: string[];
          };
          if (!roomId || !reader || !Array.isArray(chatIds)) break;
          setChatsMap((prev) => {
            const existingList = prev[roomId];
            if (!existingList) return prev;
            return {
              ...prev,
              [roomId]: existingList.map((m) => {
                if (!chatIds.includes(m.id)) return m;
                const readBy = m.read_by || [];
                if (readBy.some((r) => r.user_id === reader.user_id)) return m;
                return { ...m, read_by: [...readBy, reader] };
              }),
            };
          });
          break;
        }

        case 'ROULETTE_WINNERS_UPDATED':
          setRouletteWinners(payload.rouletteWinners || []);
          break;

        case 'TRANSFER_RECEIVED': {
          const { toUserId, fromUsername, amount, note, recipientHistory, txId } = payload as {
            toUserId: string;
            fromNama: string;
            fromUsername: string;
            amount: number;
            note: string;
            recipientHistory?: CoinHistoryItem[];
            txId?: string;
          };
          if (toUserId === uid) {
            if (recipientHistory && recipientHistory.length > 0) {
              setCoinHistory(recipientHistory);
            } else if (!backendAvailableRef.current) {
              const histId = txId || `tx-in-${Date.now()}`;
              setCurrentUser((prev) => ({
                ...prev,
                coin: isOwnerUsername(prev.username) ? 999999999 : prev.coin + amount,
              }));
              setCoinHistory((prev) => {
                if (prev.some((h) => h.id === histId)) return prev;
                return [
                  {
                    id: histId,
                    jenis: 'tambah' as const,
                    jumlah: amount,
                    keterangan: `Transfer dari @${fromUsername}${note ? `: ${note}` : ''}`,
                    created_at: new Date().toISOString(),
                  },
                  ...prev,
                ].slice(0, 60);
              });
            }
            sounds.playTing();
            triggerHaptic('success');
            setToast(`🪙 Lu dapet transfer +${amount} Coin dari @${fromUsername}!`);
          }
          break;
        }

        case 'GIFT_SENT': {
          const { giftEvent } = payload as { giftEvent: GiftEventPayload };
          if (giftEvent && currentRoomIdRef.current === giftEvent.room_id) {
            enqueueGiftEvent(giftEvent);
            sounds.playTing();
          }
          break;
        }

        case 'GIFT_RECEIVED': {
          const { toUserId, fromUsername, giftNama, amount, hostHistory, giftId } = payload as {
            toUserId: string;
            fromUsername: string;
            giftNama: string;
            amount: number;
            hostHistory?: CoinHistoryItem[];
            giftId?: string;
          };
          if (toUserId === uid) {
            if (hostHistory && hostHistory.length > 0) {
              setCoinHistory(hostHistory);
            } else if (!backendAvailableRef.current) {
              const histId = giftId || `gift-in-${Date.now()}`;
              setCurrentUser((prev) => ({
                ...prev,
                coin: isOwnerUsername(prev.username) ? 999999999 : prev.coin + amount,
              }));
              setCoinHistory((prev) => {
                if (prev.some((h) => h.id === histId)) return prev;
                return [
                  {
                    id: histId,
                    jenis: 'tambah' as const,
                    jumlah: amount,
                    keterangan: `Dapet Gift ${giftNama} dari @${fromUsername}`,
                    created_at: new Date().toISOString(),
                  },
                  ...prev,
                ].slice(0, 60);
              });
            }
            sounds.playTing();
            triggerHaptic('success');
            setToast(`🎁 Lu dapet hadiah ${giftNama} (+${amount} Coin) dari @${fromUsername}!`);
          }
          break;
        }

        case 'POLL_UPDATED': {
          const { roomId, poll } = payload as { roomId: string; poll: Poll };
          if (!roomId || !poll) break;
          setPolls((prev) => ({ ...prev, [roomId]: poll }));
          break;
        }

        case 'QUIZ_UPDATED': {
          const { roomId, quiz } = payload as { roomId: string; quiz: Quiz };
          if (!roomId || !quiz) break;
          setQuizzes((prev) => ({ ...prev, [roomId]: quiz }));
          break;
        }

        case 'BROADCASTS_UPDATED': {
          setBroadcasts(payload.broadcasts || []);
          if (payload.latest && payload.latest.is_published && payload.latest.jenis === 'popup') {
            setActiveBroadcastPopup(payload.latest);
          }
          break;
        }

        case 'GIVEAWAYS_UPDATED':
          setGiveaways(payload.giveaways || []);
          break;

        case 'FLASHSALES_UPDATED':
          setFlashSales(payload.flashSales || []);
          break;

        case 'REDEEM_CODES_UPDATED':
          setRedeemCodes(payload.redeemCodes || []);
          break;

        case 'POST_CREATED': {
          const post: FeedPost = payload.post;
          if (!post) break;
          setPosts((prev) => (prev.some((p) => p.id === post.id) ? prev : [post, ...prev]));
          break;
        }

        case 'POST_UPDATED': {
          const post: FeedPost = payload.post;
          if (!post) break;
          setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
          break;
        }

        case 'POST_DELETED': {
          const deletedPostId: string = payload.postId;
          setPosts((prev) => prev.filter((p) => p.id !== deletedPostId));
          setFeedLikes((prev) => prev.filter((l) => l.post_id !== deletedPostId));
          setFeedComments((prev) => prev.filter((c) => c.post_id !== deletedPostId));
          break;
        }

        case 'LIKE_UPDATED': {
          const { postId, likes_count, postLikes } = payload as {
            postId: string;
            likes_count: number;
            postLikes: FeedLike[];
          };
          setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes_count } : p)));
          setFeedLikes((prev) => [...(postLikes || []), ...prev.filter((l) => l.post_id !== postId)]);
          break;
        }

        case 'COMMENT_ADDED': {
          const { postId, comment, comments_count } = payload as {
            postId: string;
            comment: FeedComment;
            comments_count: number;
          };
          if (!comment) break;
          setFeedComments((prev) => (prev.some((c) => c.id === comment.id) ? prev : [...prev, comment]));
          setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments_count } : p)));
          break;
        }

        case 'COMMENT_UPDATED': {
          const { comment } = payload as { comment: FeedComment };
          if (!comment) break;
          setFeedComments((prev) => prev.map((c) => (c.id === comment.id ? comment : c)));
          break;
        }

        case 'COMMENT_DELETED': {
          const { postId, commentId, comments_count } = payload as {
            postId: string;
            commentId: string;
            comments_count: number;
          };
          setFeedComments((prev) => prev.filter((c) => c.id !== commentId && c.parent_id !== commentId));
          setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments_count } : p)));
          break;
        }
      }
    },
    [enqueueGiftEvent, setToast, tgUser]
  );

  // Sync authenticated Telegram user with server + open WS + Supabase OnlineHub
  useEffect(() => {
    if (!tgUser) {
      setIsLoading(false);
      return;
    }

    const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ').trim();
    const uid = String(tgUser.id);
    let cancelled = false;
    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let retryTimer: number | null = null;
    let hasSynced = false;

    // Start Supabase Realtime + local BroadcastChannel hub immediately so multi-phone rooms work anywhere
    onlineHub.start({
      onEvent: (type, payload) => {
        if (!cancelled) {
          handleRealtimeEvent(type, payload);
        }
      },
      onPresenceSync: (presences, hubOnlineCount) => {
        if (cancelled) return;
        const me = currentUserRef.current;

        // Always merge online Telegram users into allUsers
        setAllUsers((prev) => {
          const map = new Map<string, UserProfile>();
          prev.forEach((u) => map.set(u.user_id, u));
          presences.forEach((p) => {
            if (p.user?.user_id) {
              const existing = map.get(p.user.user_id);
              map.set(p.user.user_id, {
                ...(existing || {}),
                ...p.user,
                foto: p.user.foto || existing?.foto || '',
              });
            }
          });
          if (me.user_id) {
            map.set(me.user_id, me);
          }
          return Array.from(map.values());
        });

        // When Express server is absent (e.g., Vercel static hosting), merge shared rooms & hub state
        if (!backendAvailableRef.current) {
          setOnlineCount(Math.max(1, hubOnlineCount));

          const roomMap = new Map<string, Room>();
          presences.forEach((p) => {
            (p.rooms || []).forEach((r) => {
              if (r && r.status === 'live' && (r.viewers || []).length > 0) {
                const prevR = roomMap.get(r.id);
                if (!prevR || (r.viewers?.length || 0) >= (prevR.viewers?.length || 0)) {
                  roomMap.set(r.id, r);
                }
              }
            });
          });
          if (roomMap.size > 0) {
            setRooms((prev) => {
              const merged = new Map<string, Room>();
              prev.forEach((r) => {
                if (r.status === 'live' && r.viewers?.includes(me.user_id)) {
                  merged.set(r.id, r);
                }
              });
              roomMap.forEach((r, id) => {
                const existing = merged.get(id);
                if (!existing || (r.viewers?.length || 0) >= (existing.viewers?.length || 0)) {
                  merged.set(id, r);
                }
              });
              return Array.from(merged.values()).sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );
            });
          }

          // Merge chats, polls, quizzes from peers
          setChatsMap((prev) => {
            const next = { ...prev };
            presences.forEach((p) => {
              Object.entries(p.chats || {}).forEach(([rId, msgs]) => {
                const existing = next[rId] || [];
                const msgMap = new Map<string, ChatMessage>();
                existing.forEach((m) => msgMap.set(m.id, m));
                (msgs || []).forEach((m) => {
                  if (!msgMap.has(m.id)) msgMap.set(m.id, m);
                });
                next[rId] = Array.from(msgMap.values()).sort(
                  (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
              });
            });
            return next;
          });

          setPolls((prev) => {
            const next = { ...prev };
            presences.forEach((p) => {
              Object.entries(p.polls || {}).forEach(([rId, poll]) => {
                if (poll && !next[rId]) next[rId] = poll;
              });
            });
            return next;
          });

          setQuizzes((prev) => {
            const next = { ...prev };
            presences.forEach((p) => {
              Object.entries(p.quizzes || {}).forEach(([rId, quiz]) => {
                if (quiz && !next[rId]) next[rId] = quiz;
              });
            });
            return next;
          });

          // Merge owner broadcasts, giveaways, flashSales, redeemCodes, rouletteWinners from presences
          const sortedPresences = [...presences].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          const latestBroadcastSrc = sortedPresences.find((p) => (p.broadcasts || []).length > 0);
          if (latestBroadcastSrc) {
            setBroadcasts((prev) => (prev.length > 0 ? prev : latestBroadcastSrc.broadcasts));
          }
          const latestGiveawaySrc = sortedPresences.find((p) => (p.giveaways || []).length > 0);
          if (latestGiveawaySrc) {
            setGiveaways((prev) => (prev.length > 0 ? prev : latestGiveawaySrc.giveaways));
          }
          const latestFlashSrc = sortedPresences.find((p) => (p.flashSales || []).length > 0);
          if (latestFlashSrc) {
            setFlashSales((prev) => (prev.length > 0 ? prev : latestFlashSrc.flashSales));
          }
          const latestRedeemSrc = sortedPresences.find((p) => (p.redeemCodes || []).length > 0);
          if (latestRedeemSrc) {
            setRedeemCodes((prev) => (prev.length > 0 ? prev : latestRedeemSrc.redeemCodes));
          }
          const latestRwSrc = sortedPresences.find((p) => (p.rouletteWinners || []).length > 0);
          if (latestRwSrc) {
            setRouletteWinners((prev) => (prev.length > 0 ? prev : latestRwSrc.rouletteWinners));
          }
        }
      },
    });

    const syncFromServer = async (attempt = 0) => {
      try {
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: uid,
            nama: fullName || tgUser.username || `User ${uid}`,
            username: tgUser.username || `user_${uid}`,
            foto: tgUser.photo_url || '',
          }),
        });
        const raw = await res.text();
        let data: any = null;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch {
          data = null;
        }
        if (!res.ok || !data || !data.profile) {
          backendAvailableRef.current = false;
          if (!cancelled) setIsLoading(false);
          return;
        }
        if (cancelled) return;

        backendAvailableRef.current = true;
        hasSynced = true;
        const syncedProfile: UserProfile = {
          ...data.profile,
          foto: data.profile?.foto || tgUser.photo_url || '',
        };
        if (isOwnerUsername(syncedProfile?.username)) {
          syncedProfile.coin = 999999999;
        }
        setCurrentUser(syncedProfile);
        setAllUsers(
          (data.allUsers || [syncedProfile]).map((u: UserProfile) =>
            u.user_id === uid ? syncedProfile : u
          )
        );
        setUserOwnedBorders(
          isOwnerUsername(syncedProfile?.username)
            ? ALL_BORDERS.map((b) => b.id)
            : data.ownedBorders || ['pemula']
        );
        setRooms(data.rooms || []);
        setChatsMap(data.chats || {});
        setBroadcasts(data.broadcasts || []);
        setGiveaways(data.giveaways || []);
        setFlashSales(data.flashSales || []);
        setRedeemCodes(data.redeemCodes || []);
        setPolls(data.polls || {});
        setQuizzes(data.quizzes || {});
        setCoinHistory(data.coinHistory || []);
        setDailyMissions(
          Array.isArray(data.missions) && data.missions.length > 0
            ? data.missions
            : getLocalWeeklyMissions(uid)
        );
        setRouletteSpunToday(Boolean(data.rouletteSpunToday));
        setRouletteWinners(data.rouletteWinners || []);
        setOnlineCount(data.onlineCount || 1);
        if (!isSupabaseConfigured) {
          setPosts(data.posts || []);
          setFeedLikes(data.feedLikes || []);
          setFeedComments(data.feedComments || []);
        } else {
          syncFeedFromSupabase();
        }
        setIsLoading(false);
      } catch (e) {
        console.error('Server sync error:', e);
        if (!cancelled && attempt < 1) {
          retryTimer = window.setTimeout(() => syncFromServer(attempt + 1), 800);
        } else if (!cancelled) {
          backendAvailableRef.current = false;
          setIsLoading(false);
        }
      }
    };

    const connectWs = () => {
      if (cancelled) return;
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          backendAvailableRef.current = true;
          ws?.send(JSON.stringify({ type: 'IDENTIFY', userId: uid }));
          if (!hasSynced) {
            syncFromServer(0);
          }
        };

        ws.onmessage = (event) => {
          try {
            const { type, payload } = JSON.parse(event.data);
            handleRealtimeEvent(type, payload || {});
          } catch {
            // ignore malformed frames
          }
        };

        ws.onclose = () => {
          if (wsRef.current === ws) wsRef.current = null;
          if (!cancelled && backendAvailableRef.current) {
            reconnectTimer = window.setTimeout(() => {
              syncFromServer(1);
              connectWs();
            }, 3000);
          }
        };
      } catch {
        // Ignore WS connection failures on static hosting
      }
    };

    syncFromServer();
    connectWs();

    return () => {
      cancelled = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (retryTimer) window.clearTimeout(retryTimer);
      ws?.close();
      if (wsRef.current === ws) wsRef.current = null;
      onlineHub.stop();
    };
  }, [tgUser, handleRealtimeEvent, syncFeedFromSupabase]);

  // Broadcast live presence state so new joining users across phones see active rooms & events
  useEffect(() => {
    if (!currentUser.user_id) return;
    const payload: HubPresencePayload = {
      user: currentUser,
      rooms: rooms.filter((r) => r.status === 'live'),
      chats: chatsMap,
      polls,
      quizzes,
      broadcasts,
      giveaways,
      flashSales,
      redeemCodes,
      rouletteWinners,
      updatedAt: Date.now(),
    };
    onlineHub.trackState(payload);
  }, [
    currentUser,
    rooms,
    chatsMap,
    polls,
    quizzes,
    broadcasts,
    giveaways,
    flashSales,
    redeemCodes,
    rouletteWinners,
  ]);

  // Safe API helper that throws BackendUnavailableError on non-JSON (static Vercel 404/HTML)
  const api = useCallback(async (url: string, options?: RequestInit) => {
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
        ...options,
      });
    } catch {
      backendAvailableRef.current = false;
      throw new BackendUnavailableError();
    }

    const raw = await res.text();
    let data: any = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      backendAvailableRef.current = false;
      throw new BackendUnavailableError();
    }

    if (!data && (res.status === 404 || res.status === 502 || res.status === 503)) {
      backendAvailableRef.current = false;
      throw new BackendUnavailableError();
    }

    if (!res.ok) {
      throw new Error(data?.error || 'Terjadi kesalahan pada server.');
    }
    backendAvailableRef.current = true;
    return data;
  }, []);

  // Video Sync Helper (works via WS + Supabase Realtime Hub across phones)
  const syncRoomVideo = useCallback(
    (roomId: string, currentTime: number, isPlaying: boolean) => {
      if (!currentUser.user_id || !roomId) return;
      const payload: VideoSyncEvent = {
        roomId,
        currentTime: Math.max(0, Number(currentTime) || 0),
        isPlaying: Boolean(isPlaying),
        senderId: currentUser.user_id,
        updatedAt: Date.now(),
      };
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'VIDEO_SYNC', payload }));
      }
      onlineHub.emit('VIDEO_SYNC', payload as unknown as Record<string, unknown>);
    },
    [currentUser.user_id]
  );

  // Local Join Room helper (used for fallback static hosting)
  const applyLocalJoinRoom = useCallback(
    (targetRoom: Room) => {
      const uid = currentUser.user_id;
      if (targetRoom.status !== 'live') {
        return { success: false, message: 'Room udah ditutup!' };
      }
      const alreadyIn = targetRoom.viewers.includes(uid);
      const maxV = targetRoom.max_viewers || 10;
      if (!alreadyIn && targetRoom.viewers.length >= maxV) {
        return { success: false, message: 'Room udah penuh!' };
      }
      const updatedRoom: Room = alreadyIn
        ? targetRoom
        : {
            ...targetRoom,
            viewers: [...targetRoom.viewers, uid],
            penonton_count: targetRoom.viewers.length + 1,
          };

      const today = getTodayKey();
      const isNewWatch = currentUser.terakhir_nonton !== today;
      const nextUser: UserProfile = {
        ...currentUser,
        total_nonton: isNewWatch ? currentUser.total_nonton + 1 : Math.max(1, currentUser.total_nonton),
        terakhir_nonton: today,
        poin: currentUser.poin + (alreadyIn ? 0 : 10),
      };
      const nextBorders = isOwner
        ? ALL_BORDERS.map((b) => b.id)
        : unlockLocalBordersForStats(nextUser, userOwnedBorders);
      const nextMissions = updateLocalWeeklyProgress(uid, 'watch', updatedRoom.id);

      setRooms((prev) =>
        prev.some((r) => r.id === updatedRoom.id)
          ? prev.map((r) => (r.id === updatedRoom.id ? updatedRoom : r))
          : [updatedRoom, ...prev]
      );
      setCurrentUser(nextUser);
      setUserOwnedBorders(nextBorders);
      setDailyMissions(nextMissions);
      setCurrentRoomId(updatedRoom.id);
      setActiveTab('room');

      onlineHub.emit('ROOM_UPDATED', { room: updatedRoom });
      onlineHub.emit('USER_UPDATED', { user: nextUser, ownedBorders: nextBorders });
      return { success: true, message: 'Berhasil masuk room!', room: updatedRoom };
    },
    [currentUser, isOwner, userOwnedBorders]
  );

  // ROOM ACTIONS
  const joinRoom = useCallback(
    async (roomId: string, inputCode?: string) => {
      try {
        const data = await api('/api/rooms/join', {
          method: 'POST',
          body: JSON.stringify({
            user_id: currentUser.user_id,
            room_id: inputCode ? undefined : roomId,
            code_room: inputCode || undefined,
          }),
        });
        setRooms((prev) =>
          prev.some((r) => r.id === data.room.id)
            ? prev.map((r) => (r.id === data.room.id ? data.room : r))
            : [data.room, ...prev]
        );
        setChatsMap((prev) => ({ ...prev, [data.room.id]: data.chats || [] }));
        if (data.poll) setPolls((prev) => ({ ...prev, [data.room.id]: data.poll }));
        if (data.quiz) setQuizzes((prev) => ({ ...prev, [data.room.id]: data.quiz }));
        if (data.profile) setCurrentUser(data.profile);
        if (data.ownedBorders) setUserOwnedBorders(data.ownedBorders);
        if (data.missions) setDailyMissions(data.missions);

        setCurrentRoomId(data.room.id);
        setActiveTab('room');
        return { success: true, message: 'Berhasil masuk room!' };
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const target = inputCode
            ? rooms.find((r) => r.code_room === inputCode.trim() && r.status === 'live')
            : rooms.find((r) => r.id === roomId && r.status === 'live');
          if (!target) {
            return { success: false, message: 'Room ga ketemu atau udah ditutup!' };
          }
          if (target.is_private && inputCode && target.code_room !== inputCode.trim()) {
            return { success: false, message: 'Code Room salah!' };
          }
          return applyLocalJoinRoom(target);
        }
        const msg = e instanceof Error ? e.message : 'Gagal masuk room!';
        return { success: false, message: msg };
      }
    },
    [api, applyLocalJoinRoom, currentUser.user_id, rooms]
  );

  const joinRoomByCode = useCallback(
    async (inputCode: string) => {
      const cleanCode = inputCode.trim();
      if (!cleanCode) {
        return { success: false, message: 'Masukin 6 digit Code Room dulu bro!' };
      }
      try {
        const data = await api('/api/rooms/join', {
          method: 'POST',
          body: JSON.stringify({
            user_id: currentUser.user_id,
            code_room: cleanCode,
          }),
        });
        setRooms((prev) =>
          prev.some((r) => r.id === data.room.id)
            ? prev.map((r) => (r.id === data.room.id ? data.room : r))
            : [data.room, ...prev]
        );
        setChatsMap((prev) => ({ ...prev, [data.room.id]: data.chats || [] }));
        if (data.poll) setPolls((prev) => ({ ...prev, [data.room.id]: data.poll }));
        if (data.quiz) setQuizzes((prev) => ({ ...prev, [data.room.id]: data.quiz }));
        if (data.profile) setCurrentUser(data.profile);
        if (data.ownedBorders) setUserOwnedBorders(data.ownedBorders);
        if (data.missions) setDailyMissions(data.missions);

        setCurrentRoomId(data.room.id);
        setActiveTab('room');
        setToast(`Berhasil masuk ke room "${data.room.judul}"!`);
        return { success: true, message: 'Berhasil masuk room!', room: data.room };
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const target = rooms.find((r) => r.code_room === cleanCode && r.status === 'live');
          if (!target) {
            return { success: false, message: `Room dengan code "${cleanCode}" ga tersedia!` };
          }
          const res = applyLocalJoinRoom(target);
          if (res.success && res.room) {
            setToast(`Berhasil masuk ke room "${res.room.judul}"!`);
          }
          return res;
        }
        const msg = e instanceof Error ? e.message : `Room dengan code "${cleanCode}" ga tersedia!`;
        return { success: false, message: msg };
      }
    },
    [api, applyLocalJoinRoom, currentUser.user_id, rooms, setToast]
  );

  const leaveRoom = useCallback(async () => {
    const rId = currentRoomId;
    setCurrentRoomId(null);
    setActiveTab('room');
    if (rId && currentUser.user_id) {
      try {
        await api(`/api/rooms/${rId}/leave`, {
          method: 'POST',
          body: JSON.stringify({ user_id: currentUser.user_id }),
        });
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const target = rooms.find((r) => r.id === rId);
          if (target) {
            const nextViewers = target.viewers.filter((id) => id !== currentUser.user_id);
            if (nextViewers.length === 0) {
              setRooms((prev) => prev.filter((r) => r.id !== rId));
              onlineHub.emit('ROOM_ENDED', { roomId: rId });
            } else {
              const updatedRoom: Room = {
                ...target,
                viewers: nextViewers,
                penonton_count: nextViewers.length,
              };
              setRooms((prev) => prev.map((r) => (r.id === rId ? updatedRoom : r)));
              onlineHub.emit('ROOM_UPDATED', { room: updatedRoom });
            }
          }
        }
      }
    }
  }, [api, currentRoomId, currentUser.user_id, rooms]);

  const endRoom = useCallback(
    async (roomId: string) => {
      try {
        await api(`/api/rooms/${roomId}/end`, {
          method: 'POST',
          body: JSON.stringify({ user_id: currentUser.user_id }),
        });
        setCurrentRoomId(null);
        setToast('Room udah ditutup!');
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          setRooms((prev) => prev.filter((r) => r.id !== roomId));
          setCurrentRoomId(null);
          setActiveTab('room');
          onlineHub.emit('ROOM_ENDED', { roomId });
          setToast('Room udah ditutup!');
          return;
        }
        setToast(e instanceof Error ? e.message : 'Gagal nutup room!');
      }
    },
    [api, currentUser.user_id, setToast]
  );

  const createRoom = useCallback(
    async (payload: {
      judul: string;
      genre: GenreType;
      is_private: boolean;
      video_url: string;
      max_viewers: number;
    }) => {
      try {
        const data = await api('/api/rooms', {
          method: 'POST',
          body: JSON.stringify({ user_id: currentUser.user_id, ...payload }),
        });
        setRooms((prev) => (prev.some((r) => r.id === data.room.id) ? prev : [data.room, ...prev]));
        setChatsMap((prev) => ({ ...prev, [data.room.id]: [] }));
        if (data.profile) setCurrentUser(data.profile);
        if (data.ownedBorders) setUserOwnedBorders(data.ownedBorders);
        if (data.missions) setDailyMissions(data.missions);

        setCurrentRoomId(data.room.id);
        setActiveTab('room');
        setToast(
          payload.is_private
            ? `Room Private dibuat! Code Room lu: ${data.room.code_room}`
            : `Room "${data.room.judul}" udah dibuat!`
        );
        return { success: true, message: 'Room dibuat!', room: data.room };
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          try {
            const newRoom = createLocalRoomObject(currentUser, payload, rooms);
            const today = getTodayKey();
            const isNewWatch = currentUser.terakhir_nonton !== today;
            const nextUser: UserProfile = {
              ...currentUser,
              total_nonton: isNewWatch ? currentUser.total_nonton + 1 : Math.max(1, currentUser.total_nonton),
              terakhir_nonton: today,
              poin: currentUser.poin + 10,
            };
            const nextBorders = isOwner
              ? ALL_BORDERS.map((b) => b.id)
              : unlockLocalBordersForStats(nextUser, userOwnedBorders);
            const nextMissions = updateLocalWeeklyProgress(currentUser.user_id, 'watch', newRoom.id);

            setRooms((prev) => [newRoom, ...prev]);
            setChatsMap((prev) => ({ ...prev, [newRoom.id]: [] }));
            setCurrentUser(nextUser);
            setUserOwnedBorders(nextBorders);
            setDailyMissions(nextMissions);
            setCurrentRoomId(newRoom.id);
            setActiveTab('room');

            onlineHub.emit('ROOM_CREATED', { room: newRoom });
            onlineHub.emit('USER_UPDATED', { user: nextUser, ownedBorders: nextBorders });
            setToast(
              payload.is_private
                ? `Room Private dibuat! Code Room lu: ${newRoom.code_room}`
                : `Room "${newRoom.judul}" udah dibuat!`
            );
            return { success: true, message: 'Room dibuat!', room: newRoom };
          } catch (localErr) {
            const msg = localErr instanceof Error ? localErr.message : 'Gagal bikin room!';
            setToast(msg);
            return { success: false, message: msg };
          }
        }
        const msg = e instanceof Error ? e.message : 'Gagal bikin room!';
        setToast(msg);
        return { success: false, message: msg };
      }
    },
    [api, currentUser, isOwner, rooms, setToast, userOwnedBorders]
  );

  // Send Chat Message
  const sendChatMessage = useCallback(
    async (pesan: string, replyTo?: ChatMessage['reply_to']) => {
      if (!currentRoom || !pesan.trim() || isSendingChat) return;
      setIsSendingChat(true);
      const uniqueId = `chat-${currentUser.user_id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      try {
        const data = await api(`/api/rooms/${currentRoom.id}/chats`, {
          method: 'POST',
          body: JSON.stringify({
            id: uniqueId,
            user_id: currentUser.user_id,
            pesan: pesan.trim(),
            reply_to: replyTo,
          }),
        });
        if (data.missions) setDailyMissions(data.missions);
        setChatsMap((prev) => {
          const list = prev[currentRoom.id] || [];
          if (list.some((m) => m.id === data.message.id)) return prev;
          return { ...prev, [currentRoom.id]: [...list, data.message] };
        });
        triggerHaptic('light');
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const nowISO = new Date().toISOString();
          const newMsg: ChatMessage = {
            id: uniqueId,
            room_id: currentRoom.id,
            user_id: currentUser.user_id,
            nama: currentUser.nama,
            username: currentUser.username,
            foto: currentUser.foto,
            border: currentUser.border_saat_ini,
            custom_text: currentUser.custom_text,
            decorations: currentUser.decorations,
            pesan: pesan.trim(),
            reply_to: replyTo,
            reactions: {},
            read_by: [
              {
                user_id: currentUser.user_id,
                nama: currentUser.nama,
                username: currentUser.username,
                foto: currentUser.foto,
                border: currentUser.border_saat_ini,
                read_at: nowISO,
              },
            ],
            is_host: currentRoom.host_id === currentUser.user_id,
            is_owner: isOwner,
            created_at: nowISO,
          };
          const updatedRoom: Room = { ...currentRoom, chats_count: (currentRoom.chats_count || 0) + 1 };
          setChatsMap((prev) => {
            const list = prev[currentRoom.id] || [];
            if (list.some((m) => m.id === newMsg.id)) return prev;
            return { ...prev, [currentRoom.id]: [...list, newMsg] };
          });
          setRooms((prev) => prev.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)));
          setDailyMissions(updateLocalWeeklyProgress(currentUser.user_id, 'chat'));
          onlineHub.emit('CHAT_ADDED', { roomId: currentRoom.id, message: newMsg });
          onlineHub.emit('ROOM_UPDATED', { room: updatedRoom });
          triggerHaptic('light');
        } else {
          setToast(e instanceof Error ? e.message : 'Gagal kirim chat!');
        }
      } finally {
        setIsSendingChat(false);
      }
    },
    [api, currentRoom, currentUser, isOwner, isSendingChat, setToast]
  );

  const reactToChat = useCallback(
    async (chatId: string, emoji: string) => {
      if (!currentRoom || !currentUser.user_id) return;
      try {
        const data = await api(`/api/rooms/${currentRoom.id}/chats/${chatId}/react`, {
          method: 'POST',
          body: JSON.stringify({ user_id: currentUser.user_id, emoji }),
        });
        setChatsMap((prev) => ({
          ...prev,
          [currentRoom.id]: (prev[currentRoom.id] || []).map((m) => (m.id === chatId ? data.message : m)),
        }));
        triggerHaptic('light');
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const list = chatsMap[currentRoom.id] || [];
          const target = list.find((m) => m.id === chatId);
          if (!target) return;
          const reactions = { ...(target.reactions || {}) };
          const curUsers = reactions[emoji] || [];
          const already = curUsers.some((u) => u.user_id === currentUser.user_id);
          reactions[emoji] = already
            ? curUsers.filter((u) => u.user_id !== currentUser.user_id)
            : [...curUsers, { user_id: currentUser.user_id, nama: currentUser.nama }];
          const updatedMsg: ChatMessage = { ...target, reactions };
          setChatsMap((prev) => ({
            ...prev,
            [currentRoom.id]: (prev[currentRoom.id] || []).map((m) => (m.id === chatId ? updatedMsg : m)),
          }));
          onlineHub.emit('CHAT_UPDATED', { roomId: currentRoom.id, message: updatedMsg });
          triggerHaptic('light');
          return;
        }
        setToast(e instanceof Error ? e.message : 'Gagal react chat!');
      }
    },
    [api, chatsMap, currentRoom, currentUser.nama, currentUser.user_id, setToast]
  );

  const markChatsRead = useCallback(
    async (chatIds: string[]) => {
      if (!currentRoom || !currentUser.user_id || chatIds.length === 0) return;
      const nowISO = new Date().toISOString();
      const myReceipt = {
        user_id: currentUser.user_id,
        nama: currentUser.nama,
        username: currentUser.username,
        foto: currentUser.foto,
        border: currentUser.border_saat_ini,
        read_at: nowISO,
      };

      setChatsMap((prev) => {
        const list = prev[currentRoom.id];
        if (!list) return prev;
        return {
          ...prev,
          [currentRoom.id]: list.map((m) => {
            if (!chatIds.includes(m.id)) return m;
            const readBy = m.read_by || [];
            if (readBy.some((r) => r.user_id === currentUser.user_id)) return m;
            return { ...m, read_by: [...readBy, myReceipt] };
          }),
        };
      });

      try {
        await api(`/api/rooms/${currentRoom.id}/chats/read`, {
          method: 'POST',
          body: JSON.stringify({ user_id: currentUser.user_id, chatIds }),
        });
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          onlineHub.emit('CHATS_READ', { roomId: currentRoom.id, reader: myReceipt, chatIds });
        }
      }
    },
    [api, currentRoom, currentUser.border_saat_ini, currentUser.foto, currentUser.nama, currentUser.user_id, currentUser.username]
  );

  const deleteChatMessage = useCallback(
    async (chatId: string) => {
      if (!currentRoom) return;
      try {
        await api(`/api/rooms/${currentRoom.id}/chats/${chatId}?user_id=${encodeURIComponent(currentUser.user_id)}`, {
          method: 'DELETE',
          body: JSON.stringify({ user_id: currentUser.user_id }),
        });
        setChatsMap((prev) => ({
          ...prev,
          [currentRoom.id]: (prev[currentRoom.id] || []).filter((m) => m.id !== chatId),
        }));
        setToast('Chat berhasil dihapus!');
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          setChatsMap((prev) => ({
            ...prev,
            [currentRoom.id]: (prev[currentRoom.id] || []).filter((m) => m.id !== chatId),
          }));
          onlineHub.emit('CHAT_DELETED', { roomId: currentRoom.id, chatId });
          setToast('Chat berhasil dihapus!');
          return;
        }
        setToast(e instanceof Error ? e.message : 'Gagal hapus chat!');
      }
    },
    [api, currentRoom, currentUser.user_id, setToast]
  );

  const sendGift = useCallback(
    async (giftId: string) => {
      if (!currentRoom) return { success: false, message: 'Masuk room dulu bro!' };
      const uniqueId = `gift-${currentUser.user_id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      try {
        const data = await api(`/api/rooms/${currentRoom.id}/gifts`, {
          method: 'POST',
          body: JSON.stringify({
            id: uniqueId,
            user_id: currentUser.user_id,
            gift_id: giftId,
          }),
        });
        if (data.profile) setCurrentUser(data.profile);
        if (data.coinHistory) setCoinHistory(data.coinHistory);
        if (data.missions) setDailyMissions(data.missions);
        if (data.message) {
          setChatsMap((prev) => {
            const list = prev[currentRoom.id] || [];
            if (list.some((m) => m.id === data.message.id)) return prev;
            return { ...prev, [currentRoom.id]: [...list, data.message] };
          });
        }
        if (data.giftEvent) {
          enqueueGiftEvent(data.giftEvent);
        }
        sounds.playTing();
        triggerHaptic('success');
        return { success: true, message: 'Gift terkirim!' };
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const giftDef = getGiftDefinition(giftId);
          if (!giftDef) {
            return { success: false, message: 'Hadiah ga tersedia!' };
          }
          if (!isOwner && currentUser.coin < giftDef.harga) {
            const msg = `Coin lu kurang! Butuh ${giftDef.harga} Coin.`;
            setToast(msg);
            return { success: false, message: msg };
          }
          const nowISO = new Date().toISOString();
          const nextCoin = isOwner ? 999999999 : currentUser.coin - giftDef.harga;
          const nextUser: UserProfile = { ...currentUser, coin: nextCoin };
          const nextHistory = isOwner
            ? coinHistory
            : [
                {
                  id: `ch-${Date.now()}`,
                  jenis: 'kurang' as const,
                  jumlah: giftDef.harga,
                  keterangan: `Kirim Gift ${giftDef.nama} ke ${currentRoom.host_nama}`,
                  created_at: nowISO,
                },
                ...coinHistory,
              ].slice(0, 60);

          const msgText =
            giftDef.harga >= 200
              ? `${currentUser.nama} ngirim ${giftDef.emoji} ${giftDef.nama} (${giftDef.harga} Coin) ke Host ${currentRoom.host_nama}! Sultan parah!`
              : `${currentUser.nama} ngirim ${giftDef.emoji} ${giftDef.nama} (${giftDef.harga} Coin) ke Host ${currentRoom.host_nama}!`;

          const giftMsg: ChatMessage = {
            id: uniqueId,
            room_id: currentRoom.id,
            user_id: currentUser.user_id,
            nama: currentUser.nama,
            username: currentUser.username,
            foto: currentUser.foto,
            border: currentUser.border_saat_ini,
            custom_text: currentUser.custom_text,
            decorations: currentUser.decorations,
            pesan: msgText,
            reactions: {},
            read_by: [
              {
                user_id: currentUser.user_id,
                nama: currentUser.nama,
                username: currentUser.username,
                foto: currentUser.foto,
                border: currentUser.border_saat_ini,
                read_at: nowISO,
              },
            ],
            is_gift: true,
            gift_id: giftDef.id,
            gift_nama: giftDef.nama,
            gift_harga: giftDef.harga,
            is_host: currentRoom.host_id === currentUser.user_id,
            is_owner: isOwner,
            created_at: nowISO,
          };

          const giftEvent: GiftEventPayload = {
            id: uniqueId,
            room_id: currentRoom.id,
            gift_id: giftDef.id,
            gift_nama: giftDef.nama,
            gift_emoji: giftDef.emoji,
            gift_harga: giftDef.harga,
            sender_id: currentUser.user_id,
            sender_nama: currentUser.nama,
            sender_username: currentUser.username,
            sender_foto: currentUser.foto,
            sender_border: currentUser.border_saat_ini,
            host_id: currentRoom.host_id,
            host_nama: currentRoom.host_nama,
            created_at: nowISO,
          };

          setCurrentUser(nextUser);
          setCoinHistory(nextHistory);
          setDailyMissions(updateLocalWeeklyProgress(currentUser.user_id, 'gift'));
          setChatsMap((prev) => {
            const list = prev[currentRoom.id] || [];
            if (list.some((m) => m.id === giftMsg.id)) return prev;
            return { ...prev, [currentRoom.id]: [...list, giftMsg] };
          });
          enqueueGiftEvent(giftEvent);

          onlineHub.emit('CHAT_ADDED', { roomId: currentRoom.id, message: giftMsg });
          onlineHub.emit('GIFT_SENT', { giftEvent });
          onlineHub.emit('USER_UPDATED', { user: nextUser });
          if (currentRoom.host_id !== currentUser.user_id) {
            onlineHub.emit('GIFT_RECEIVED', {
              giftId: uniqueId,
              toUserId: currentRoom.host_id,
              fromUsername: currentUser.username,
              giftNama: `${giftDef.emoji} ${giftDef.nama}`,
              amount: giftDef.harga,
            });
          }

          sounds.playTing();
          triggerHaptic('success');
          return { success: true, message: 'Gift terkirim!' };
        }
        const msg = e instanceof Error ? e.message : 'Gagal kirim gift!';
        setToast(msg);
        return { success: false, message: msg };
      }
    },
    [api, coinHistory, currentRoom, currentUser, enqueueGiftEvent, isOwner, setToast]
  );

  const createPoll = useCallback(
    async (pertanyaan: string, pilihanText: string[]) => {
      if (!currentRoom) return;
      try {
        const data = await api(`/api/rooms/${currentRoom.id}/polls`, {
          method: 'POST',
          body: JSON.stringify({ pertanyaan, pilihanText }),
        });
        setPolls((prev) => ({ ...prev, [currentRoom.id]: data.poll }));
        setToast('Poll berhasil dibuat!');
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const poll: Poll = {
            id: `poll-${Date.now()}`,
            room_id: currentRoom.id,
            pertanyaan,
            pilihan: pilihanText.map((text, idx) => ({
              id: `opt-${idx}-${Date.now()}`,
              text,
              votes: 0,
              voters: [],
            })),
            berakhir_pada: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            status: 'active',
            created_at: new Date().toISOString(),
          };
          setPolls((prev) => ({ ...prev, [currentRoom.id]: poll }));
          onlineHub.emit('POLL_UPDATED', { roomId: currentRoom.id, poll });
          setToast('Poll berhasil dibuat!');
          return;
        }
        setToast(e instanceof Error ? e.message : 'Gagal buat poll!');
      }
    },
    [api, currentRoom, setToast]
  );

  const votePoll = useCallback(
    async (optionId: string) => {
      if (!currentRoom) return;
      try {
        const data = await api(`/api/rooms/${currentRoom.id}/polls/vote`, {
          method: 'POST',
          body: JSON.stringify({ user_id: currentUser.user_id, optionId }),
        });
        setPolls((prev) => ({ ...prev, [currentRoom.id]: data.poll }));
        if (data.missions) setDailyMissions(data.missions);
        sounds.playTing();
        setToast('Vote lu udah diitung!');
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const poll = polls[currentRoom.id];
          if (!poll) return;
          const updatedPoll: Poll = {
            ...poll,
            pilihan: poll.pilihan.map((opt) => {
              const filteredVoters = opt.voters.filter((v) => v !== currentUser.user_id);
              if (opt.id === optionId) {
                const voters = [...filteredVoters, currentUser.user_id];
                return { ...opt, voters, votes: voters.length };
              }
              return { ...opt, voters: filteredVoters, votes: filteredVoters.length };
            }),
          };
          setPolls((prev) => ({ ...prev, [currentRoom.id]: updatedPoll }));
          setDailyMissions(updateLocalWeeklyProgress(currentUser.user_id, 'vote'));
          onlineHub.emit('POLL_UPDATED', { roomId: currentRoom.id, poll: updatedPoll });
          sounds.playTing();
          setToast('Vote lu udah diitung!');
          return;
        }
        setToast(e instanceof Error ? e.message : 'Gagal vote!');
      }
    },
    [api, currentRoom, currentUser.user_id, polls, setToast]
  );

  const createQuiz = useCallback(
    async (pertanyaan: string, pilihan: string[], jawabanBenar: string) => {
      if (!currentRoom) return;
      try {
        const data = await api(`/api/rooms/${currentRoom.id}/quizzes`, {
          method: 'POST',
          body: JSON.stringify({ pertanyaan, pilihan, jawabanBenar }),
        });
        setQuizzes((prev) => ({ ...prev, [currentRoom.id]: data.quiz }));
        setToast('Quiz berhasil dimulai!');
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const quiz: Quiz = {
            id: `quiz-${Date.now()}`,
            room_id: currentRoom.id,
            pertanyaan,
            pilihan,
            jawaban_benar: jawabanBenar,
            answers: [],
            status: 'active',
            created_at: new Date().toISOString(),
          };
          setQuizzes((prev) => ({ ...prev, [currentRoom.id]: quiz }));
          onlineHub.emit('QUIZ_UPDATED', { roomId: currentRoom.id, quiz });
          setToast('Quiz berhasil dimulai!');
          return;
        }
        setToast(e instanceof Error ? e.message : 'Gagal buat quiz!');
      }
    },
    [api, currentRoom, setToast]
  );

  const answerQuiz = useCallback(
    async (jawaban: string) => {
      if (!currentRoom) return;
      try {
        const data = await api(`/api/rooms/${currentRoom.id}/quizzes/answer`, {
          method: 'POST',
          body: JSON.stringify({ user_id: currentUser.user_id, jawaban }),
        });
        setQuizzes((prev) => ({ ...prev, [currentRoom.id]: data.quiz }));
        if (data.profile) setCurrentUser(data.profile);
        if (data.coinHistory) setCoinHistory(data.coinHistory);
        if (data.benar) {
          sounds.playWin();
          confetti({ particleCount: 35, colors: ['#D4AF37', '#15803D'] });
          setToast(isOwner ? '🎉 Jawaban lu bener! +10 Poin!' : '🎉 Jawaban lu bener! Dapet +10 Coin & +10 Poin!');
        } else {
          triggerHaptic('warning');
          setToast('Jawaban lu salah! Tetep semangat.');
        }
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const quiz = quizzes[currentRoom.id];
          if (!quiz) return;
          if (quiz.answers.some((a) => a.user_id === currentUser.user_id)) {
            setToast('Lu udah jawab quiz ini!');
            return;
          }
          const benar = jawaban.trim().toLowerCase() === quiz.jawaban_benar.trim().toLowerCase();
          const updatedQuiz: Quiz = {
            ...quiz,
            answers: [
              ...quiz.answers,
              {
                user_id: currentUser.user_id,
                jawaban,
                benar,
              },
            ],
          };
          setQuizzes((prev) => ({ ...prev, [currentRoom.id]: updatedQuiz }));
          onlineHub.emit('QUIZ_UPDATED', { roomId: currentRoom.id, quiz: updatedQuiz });

          if (benar) {
            const nextUser: UserProfile = {
              ...currentUser,
              coin: isOwner ? 999999999 : currentUser.coin + 10,
              poin: currentUser.poin + 10,
            };
            setCurrentUser(nextUser);
            if (!isOwner) {
              setCoinHistory((prev) =>
                [
                  {
                    id: `ch-${Date.now()}`,
                    jenis: 'tambah' as const,
                    jumlah: 10,
                    keterangan: `Jawaban Benar Quiz: ${quiz.pertanyaan}`,
                    created_at: new Date().toISOString(),
                  },
                  ...prev,
                ].slice(0, 60)
              );
            }
            onlineHub.emit('USER_UPDATED', { user: nextUser });
            sounds.playWin();
            confetti({ particleCount: 35, colors: ['#D4AF37', '#15803D'] });
            setToast(isOwner ? '🎉 Jawaban lu bener! +10 Poin!' : '🎉 Jawaban lu bener! Dapet +10 Coin & +10 Poin!');
          } else {
            triggerHaptic('warning');
            setToast('Jawaban lu salah! Tetep semangat.');
          }
          return;
        }
        setToast(e instanceof Error ? e.message : 'Gagal jawab quiz!');
      }
    },
    [api, currentRoom, currentUser, isOwner, quizzes, setToast]
  );

  const changeRoomCode = useCallback(
    async (roomId: string, newCode: string) => {
      try {
        const data = await api(`/api/rooms/${roomId}/code`, {
          method: 'POST',
          body: JSON.stringify({ user_id: currentUser.user_id, newCode }),
        });
        setRooms((prev) => prev.map((r) => (r.id === roomId ? data.room : r)));
        setToast(`Code Room diganti jadi: ${data.room.code_room}`);
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const code = String(newCode || Math.floor(100000 + Math.random() * 900000));
          const target = rooms.find((r) => r.id === roomId);
          if (!target) return;
          const updatedRoom: Room = { ...target, code_room: code };
          setRooms((prev) => prev.map((r) => (r.id === roomId ? updatedRoom : r)));
          onlineHub.emit('ROOM_UPDATED', { room: updatedRoom });
          setToast(`Code Room diganti jadi: ${code}`);
          return;
        }
        setToast(e instanceof Error ? e.message : 'Gagal ganti code!');
      }
    },
    [api, currentUser.user_id, rooms, setToast]
  );

  const changeRoomVideo = useCallback(
    async (roomId: string, newVideoUrl: string) => {
      try {
        const data = await api(`/api/rooms/${roomId}/video`, {
          method: 'POST',
          body: JSON.stringify({ user_id: currentUser.user_id, video_url: newVideoUrl }),
        });
        setRooms((prev) => prev.map((r) => (r.id === roomId ? data.room : r)));
        setToast('Video YouTube room berhasil diganti!');
        return { success: true, message: 'Berhasil!' };
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          if (!isYouTubeUrl(newVideoUrl.trim())) {
            return { success: false, message: 'Link harus link YouTube' };
          }
          const target = rooms.find((r) => r.id === roomId);
          if (!target) return { success: false, message: 'Room ga ketemu!' };
          const updatedRoom: Room = { ...target, video_url: newVideoUrl.trim() };
          setRooms((prev) => prev.map((r) => (r.id === roomId ? updatedRoom : r)));
          onlineHub.emit('ROOM_UPDATED', { room: updatedRoom });
          setToast('Video YouTube room berhasil diganti!');
          return { success: true, message: 'Berhasil!' };
        }
        const msg = e instanceof Error ? e.message : 'Link harus link YouTube';
        setToast(msg);
        return { success: false, message: msg };
      }
    },
    [api, currentUser.user_id, rooms, setToast]
  );

  // ECONOMY & REWARDS
  const checkInToday = useCallback(async () => {
    try {
      const data = await api(`/api/users/${currentUser.user_id}/checkin`, { method: 'POST' });
      setCurrentUser(data.profile);
      if (data.ownedBorders) setUserOwnedBorders(data.ownedBorders);
      if (data.coinHistory) setCoinHistory(data.coinHistory);
      sounds.playTing();
      triggerHaptic('success');
      confetti({ particleCount: 30, spread: 50, colors: ['#D4AF37', '#F5F5F4'] });
      const msg = isOwner
        ? 'Check-in berhasil! Coin lu tetap ∞ Infinity.'
        : `Berhasil Check-in! Dapet +${data.coinsEarned} Coin!`;
      setToast(msg);
      return { success: true, message: msg, coinsEarned: data.coinsEarned };
    } catch (e) {
      if (e instanceof BackendUnavailableError) {
        const today = getTodayKey();
        if (currentUser.checkin_terakhir === today) {
          const msg = 'Lu udah check-in hari ini! Balik lagi besok ya.';
          setToast(msg);
          return { success: false, message: msg, coinsEarned: 0 };
        }
        const dayInCycle = ((currentUser.checkin_total || 0) % 7) + 1;
        const coinsEarned = dayInCycle === 7 ? 20 : 10;
        const nextTotal = (currentUser.checkin_total || 0) + 1;
        const nextDayKe = (nextTotal % 7) + 1;
        const nextUser: UserProfile = {
          ...currentUser,
          coin: isOwner ? 999999999 : currentUser.coin + coinsEarned,
          checkin_terakhir: today,
          checkin_total: nextTotal,
          checkin_hari_ke: nextDayKe,
        };
        const nextBorders = isOwner
          ? ALL_BORDERS.map((b) => b.id)
          : unlockLocalBordersForStats(nextUser, userOwnedBorders);
        const nextHistory = isOwner
          ? coinHistory
          : [
              {
                id: `ch-${Date.now()}`,
                jenis: 'tambah' as const,
                jumlah: coinsEarned,
                keterangan: `Check-in Harian (Hari ke-${dayInCycle})`,
                created_at: new Date().toISOString(),
              },
              ...coinHistory,
            ].slice(0, 60);

        setCurrentUser(nextUser);
        setUserOwnedBorders(nextBorders);
        setCoinHistory(nextHistory);
        savePersistedUser(nextUser, nextBorders, nextHistory);
        onlineHub.emit('USER_UPDATED', { user: nextUser, ownedBorders: nextBorders });

        sounds.playTing();
        triggerHaptic('success');
        confetti({ particleCount: 30, spread: 50, colors: ['#D4AF37', '#F5F5F4'] });
        const msg = isOwner
          ? 'Check-in berhasil! Coin lu tetap ∞ Infinity.'
          : `Berhasil Check-in! Dapet +${coinsEarned} Coin!`;
        setToast(msg);
        return { success: true, message: msg, coinsEarned };
      }
      const msg = e instanceof Error ? e.message : 'Gagal check-in!';
      return { success: false, message: msg, coinsEarned: 0 };
    }
  }, [api, coinHistory, currentUser, isOwner, setToast, userOwnedBorders]);

  const claimMission = useCallback(
    async (missionId: string) => {
      try {
        const data = await api(`/api/users/${currentUser.user_id}/missions/claim`, {
          method: 'POST',
          body: JSON.stringify({ missionId }),
        });
        setCurrentUser(data.profile);
        setDailyMissions(data.missions);
        if (data.ownedBorders) setUserOwnedBorders(data.ownedBorders);
        if (data.coinHistory) setCoinHistory(data.coinHistory);
        sounds.playTing();
        triggerHaptic('success');
        setToast('Hadiah misi berhasil diklaim!');
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          try {
            const res = claimLocalWeeklyMission(
              currentUser,
              effectiveUserOwnedBorders,
              coinHistory,
              missionId
            );
            setCurrentUser(res.profile);
            setUserOwnedBorders(res.ownedBorders);
            setCoinHistory(res.coinHistory);
            setDailyMissions(res.missions);
            onlineHub.emit('USER_UPDATED', { user: res.profile, ownedBorders: res.ownedBorders });
            sounds.playTing();
            triggerHaptic('success');
            setToast('Hadiah misi berhasil diklaim!');
          } catch (localErr) {
            setToast(localErr instanceof Error ? localErr.message : 'Gagal klaim misi!');
          }
          return;
        }
        setToast(e instanceof Error ? e.message : 'Gagal klaim misi!');
      }
    },
    [api, coinHistory, currentUser, effectiveUserOwnedBorders, setToast]
  );

  const spinRoulette = useCallback(async () => {
    try {
      const data = await api(`/api/users/${currentUser.user_id}/roulette/spin`, { method: 'POST' });
      setCurrentUser(data.profile);
      setRouletteSpunToday(true);
      if (data.coinHistory) setCoinHistory(data.coinHistory);
      if (data.rouletteWinners) setRouletteWinners(data.rouletteWinners);
      if (!data.isZonk) {
        sounds.playTing();
        confetti({ particleCount: 35, spread: 60, colors: ['#D4AF37', '#FFFFFF'] });
      }
      return {
        success: true,
        rewardText: data.rewardText,
        coinGain: data.coinGain,
        isZonk: data.isZonk,
        sliceIndex: data.sliceIndex,
      };
    } catch (e) {
      if (e instanceof BackendUnavailableError) {
        const isFree = !rouletteSpunToday;
        if (!isFree && !isOwner && currentUser.coin < 10) {
          const msg = 'Coin lu kurang! Butuh 10 Coin buat spin lagi.';
          setToast(msg);
          return { success: false, rewardText: msg, coinGain: 0, isZonk: true, sliceIndex: 1 };
        }
        const slices = [
          { label: '10 Coin', val: 10 },
          { label: 'ZONK', val: 0 },
          { label: '25 Coin', val: 25 },
          { label: '15 Coin', val: 15 },
          { label: '50 Coin', val: 50 },
          { label: 'ZONK', val: 0 },
          { label: '20 Coin', val: 20 },
          { label: '5 Coin', val: 5 },
        ];
        const pickedIdx = Math.floor(Math.random() * slices.length);
        const slice = slices[pickedIdx];

        let nextCoin = currentUser.coin;
        const addedHistory: CoinHistoryItem[] = [];
        if (!isFree && !isOwner) {
          nextCoin -= 10;
          addedHistory.push({
            id: `ch-spin-${Date.now()}`,
            jenis: 'kurang',
            jumlah: 10,
            keterangan: 'Puter Roda Roulette',
            created_at: new Date().toISOString(),
          });
        }
        if (slice.val > 0 && !isOwner) {
          nextCoin += slice.val;
          addedHistory.unshift({
            id: `ch-win-${Date.now()}`,
            jenis: 'tambah',
            jumlah: slice.val,
            keterangan: `Roulette Harian: ${slice.label}`,
            created_at: new Date().toISOString(),
          });
        }
        const nextUser: UserProfile = {
          ...currentUser,
          coin: isOwner ? 999999999 : nextCoin,
        };
        const nextHistory = isOwner ? coinHistory : [...addedHistory, ...coinHistory].slice(0, 60);
        markSpunRouletteTodayLocal(currentUser.user_id);
        setRouletteSpunToday(true);
        setCurrentUser(nextUser);
        setCoinHistory(nextHistory);

        if (slice.val > 0) {
          const winEntry: RouletteWinner = {
            id: `rw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            user_id: currentUser.user_id,
            nama: currentUser.nama,
            username: currentUser.username,
            foto: currentUser.foto,
            border: currentUser.border_saat_ini,
            jumlah: slice.val,
            created_at: new Date().toISOString(),
          };
          const nextWinners = [winEntry, ...rouletteWinners].slice(0, 30);
          setRouletteWinners(nextWinners);
          onlineHub.emit('ROULETTE_WINNERS_UPDATED', { rouletteWinners: nextWinners });
          sounds.playTing();
          confetti({ particleCount: 35, spread: 60, colors: ['#D4AF37', '#FFFFFF'] });
        }
        onlineHub.emit('USER_UPDATED', { user: nextUser });
        return {
          success: true,
          rewardText: slice.label,
          coinGain: slice.val,
          isZonk: slice.val === 0,
          sliceIndex: pickedIdx,
        };
      }
      const msg = e instanceof Error ? e.message : 'Gagal puter roulette!';
      setToast(msg);
      return { success: false, rewardText: msg, coinGain: 0, isZonk: true, sliceIndex: 1 };
    }
  }, [api, coinHistory, currentUser, isOwner, rouletteSpunToday, rouletteWinners, setToast]);

  const transferCoin = useCallback(
    async (toUserId: string, amount: number, note?: string) => {
      try {
        const data = await api('/api/transfer', {
          method: 'POST',
          body: JSON.stringify({
            fromUserId: currentUser.user_id,
            toUserId,
            amount,
            note,
          }),
        });
        setCurrentUser(data.profile);
        if (data.coinHistory) setCoinHistory(data.coinHistory);
        if (data.missions) setDailyMissions(data.missions);
        sounds.playTing();
        triggerHaptic('success');
        setToast(`Berhasil transfer ${amount} Coin!`);
        return { success: true, message: `Berhasil kirim ${amount} Coin!` };
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const amt = Math.floor(Number(amount));
          if (!amt || amt <= 0) return { success: false, message: 'Nominal Coin tidak valid!' };
          if (toUserId === currentUser.user_id) return { success: false, message: 'Ga bisa transfer ke diri sendiri!' };
          if (!isOwner && currentUser.coin < amt) return { success: false, message: 'Saldo Coin lu kurang!' };

          const target = allUsers.find((u) => u.user_id === toUserId);
          const nextUser: UserProfile = {
            ...currentUser,
            coin: isOwner ? 999999999 : currentUser.coin - amt,
          };
          const txId = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const nextHistory = isOwner
            ? coinHistory
            : [
                {
                  id: txId,
                  jenis: 'kurang' as const,
                  jumlah: amt,
                  keterangan: `Transfer ke @${target?.username || toUserId}${note ? `: ${note}` : ''}`,
                  created_at: new Date().toISOString(),
                },
                ...coinHistory,
              ].slice(0, 60);

          setCurrentUser(nextUser);
          setCoinHistory(nextHistory);
          setDailyMissions(updateLocalWeeklyProgress(currentUser.user_id, 'transfer'));
          onlineHub.emit('USER_UPDATED', { user: nextUser });
          onlineHub.emit('TRANSFER_RECEIVED', {
            txId,
            toUserId,
            fromNama: currentUser.nama,
            fromUsername: currentUser.username,
            amount: amt,
            note: note || '',
          });
          sounds.playTing();
          triggerHaptic('success');
          setToast(`Berhasil transfer ${amt} Coin!`);
          return { success: true, message: `Berhasil kirim ${amt} Coin!` };
        }
        const msg = e instanceof Error ? e.message : 'Gagal transfer Coin!';
        return { success: false, message: msg };
      }
    },
    [allUsers, api, coinHistory, currentUser, isOwner, setToast]
  );

  const claimGiveaway = useCallback(
    async (giveawayId: string) => {
      try {
        const data = await api(`/api/giveaways/${giveawayId}/claim`, {
          method: 'POST',
          body: JSON.stringify({ user_id: currentUser.user_id }),
        });
        setCurrentUser(data.profile);
        setGiveaways(data.giveaways);
        if (data.coinHistory) setCoinHistory(data.coinHistory);
        sounds.playTing();
        confetti({ particleCount: 45, spread: 55, colors: ['#D4AF37', '#F5F5F4'] });
        triggerHaptic('success');
        const msg = `🎉 Lu dapet ${data.amount} Coin Gratis dari Faiz!`;
        setToast(msg);
        return { success: true, message: msg, amount: data.amount };
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const gw = giveaways.find((g) => g.id === giveawayId);
          if (!gw) return { success: false, message: 'Bagi-bagi ga ketemu!', amount: 0 };
          if (gw.claims.some((c) => c.user_id === currentUser.user_id)) {
            const msg = 'Lu udah klaim bagi-bagi ini!';
            setToast(msg);
            return { success: false, message: msg, amount: 0 };
          }
          if (gw.claims.length >= gw.jumlah_orang) {
            const msg = 'Kuota bagi-bagi udah abis!';
            setToast(msg);
            return { success: false, message: msg, amount: 0 };
          }
          const updatedClaims = [
            ...gw.claims,
            {
              user_id: currentUser.user_id,
              nama: currentUser.nama,
              username: currentUser.username,
              jumlah: gw.per_orang,
              created_at: new Date().toISOString(),
            },
          ];
          const updatedGw: CoinGiveaway = {
            ...gw,
            claims: updatedClaims,
            status: updatedClaims.length >= gw.jumlah_orang ? 'ended' : gw.status,
            is_active: updatedClaims.length < gw.jumlah_orang,
          };
          const nextGiveaways = giveaways.map((g) => (g.id === giveawayId ? updatedGw : g));
          const nextUser: UserProfile = {
            ...currentUser,
            coin: isOwner ? 999999999 : currentUser.coin + gw.per_orang,
          };
          const nextHistory = isOwner
            ? coinHistory
            : [
                {
                  id: `ch-${Date.now()}`,
                  jenis: 'tambah' as const,
                  jumlah: gw.per_orang,
                  keterangan: 'Klaim Bagi-bagi Coin Faiz',
                  created_at: new Date().toISOString(),
                },
                ...coinHistory,
              ].slice(0, 60);

          setGiveaways(nextGiveaways);
          setCurrentUser(nextUser);
          setCoinHistory(nextHistory);
          onlineHub.emit('GIVEAWAYS_UPDATED', { giveaways: nextGiveaways });
          onlineHub.emit('USER_UPDATED', { user: nextUser });
          sounds.playTing();
          confetti({ particleCount: 45, spread: 55, colors: ['#D4AF37', '#F5F5F4'] });
          triggerHaptic('success');
          const msg = `🎉 Lu dapet ${gw.per_orang} Coin Gratis dari Faiz!`;
          setToast(msg);
          return { success: true, message: msg, amount: gw.per_orang };
        }
        const msg = e instanceof Error ? e.message : 'Gagal claim bagi-bagi!';
        setToast(msg);
        return { success: false, message: msg, amount: 0 };
      }
    },
    [api, coinHistory, currentUser, giveaways, isOwner, setToast]
  );

  const buyFlashSale = useCallback(
    async (flashSaleId: string) => {
      try {
        const data = await api(`/api/flashsales/${flashSaleId}/buy`, {
          method: 'POST',
          body: JSON.stringify({ user_id: currentUser.user_id }),
        });
        setCurrentUser(data.profile);
        setUserOwnedBorders(data.ownedBorders);
        setFlashSales(data.flashSales);
        if (data.coinHistory) setCoinHistory(data.coinHistory);
        sounds.playWin();
        confetti({ particleCount: 55, spread: 70, colors: ['#D4AF37', '#DC2626'] });
        triggerHaptic('success');
        setToast('🔥 Flash Sale berhasil! Border langsung aktif di profil lu!');
        return { success: true, message: 'Berhasil beli Flash Sale!' };
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const fsItem = flashSales.find((f) => f.id === flashSaleId);
          if (!fsItem) return { success: false, message: 'Flash Sale ga ketemu!' };
          if (fsItem.sisa_stok <= 0) return { success: false, message: 'Stok Flash Sale abis!' };
          if (!isOwner && currentUser.coin < fsItem.harga_flash) {
            return { success: false, message: `Coin lu kurang! Butuh ${fsItem.harga_flash} Coin.` };
          }
          const updatedFs: FlashSale = {
            ...fsItem,
            sisa_stok: fsItem.sisa_stok - 1,
            status: fsItem.sisa_stok - 1 <= 0 ? 'ended' : fsItem.status,
            is_active: fsItem.sisa_stok - 1 > 0,
            claims: [
              ...fsItem.claims,
              {
                user_id: currentUser.user_id,
                nama: currentUser.nama,
                username: currentUser.username,
                created_at: new Date().toISOString(),
              },
            ],
          };
          const nextFs = flashSales.map((f) => (f.id === flashSaleId ? updatedFs : f));
          const nextOwned = Array.from(new Set([...effectiveUserOwnedBorders, fsItem.border_id]));
          const nextUser: UserProfile = {
            ...currentUser,
            coin: isOwner ? 999999999 : currentUser.coin - fsItem.harga_flash,
            border_saat_ini: fsItem.border_id,
          };
          const nextHistory = isOwner
            ? coinHistory
            : [
                {
                  id: `ch-${Date.now()}`,
                  jenis: 'kurang' as const,
                  jumlah: fsItem.harga_flash,
                  keterangan: `Flash Sale Border ${fsItem.border_nama}`,
                  created_at: new Date().toISOString(),
                },
                ...coinHistory,
              ].slice(0, 60);

          setFlashSales(nextFs);
          setCurrentUser(nextUser);
          setUserOwnedBorders(nextOwned);
          setCoinHistory(nextHistory);
          onlineHub.emit('FLASHSALES_UPDATED', { flashSales: nextFs });
          onlineHub.emit('USER_UPDATED', { user: nextUser, ownedBorders: nextOwned });
          sounds.playWin();
          confetti({ particleCount: 55, spread: 70, colors: ['#D4AF37', '#DC2626'] });
          triggerHaptic('success');
          setToast('🔥 Flash Sale berhasil! Border langsung aktif di profil lu!');
          return { success: true, message: 'Berhasil beli Flash Sale!' };
        }
        const msg = e instanceof Error ? e.message : 'Gagal beli Flash Sale!';
        setToast(msg);
        return { success: false, message: msg };
      }
    },
    [api, coinHistory, currentUser, effectiveUserOwnedBorders, flashSales, isOwner, setToast]
  );

  const buyShopBorder = useCallback(
    async (borderId: string) => {
      try {
        const data = await api(`/api/users/${currentUser.user_id}/shop/buy`, {
          method: 'POST',
          body: JSON.stringify({ borderId }),
        });
        setCurrentUser(data.profile);
        setUserOwnedBorders(data.ownedBorders);
        if (data.coinHistory) setCoinHistory(data.coinHistory);
        sounds.playWin();
        confetti({ particleCount: 40, colors: ['#D4AF37', '#1E3A8A'] });
        setToast('Border berhasil dibeli dan langsung dipake!');
        return { success: true, message: 'Border kebeli!' };
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const price = getBorderPrice(borderId);
          if (price === undefined) {
            return { success: false, message: 'Border ini ga dijual di shop!' };
          }
          if (!isOwner && effectiveUserOwnedBorders.includes(borderId)) {
            return { success: false, message: 'Lu udah punya border ini!' };
          }
          if (!isOwner && currentUser.coin < price) {
            const msg = `Coin lu kurang! Butuh ${price} Coin.`;
            setToast(msg);
            return { success: false, message: msg };
          }
          const nextOwned = Array.from(new Set([...effectiveUserOwnedBorders, borderId]));
          const nextUser: UserProfile = {
            ...currentUser,
            coin: isOwner ? 999999999 : currentUser.coin - price,
            border_saat_ini: borderId,
          };
          const borderName = ALL_BORDERS.find((b) => b.id === borderId)?.nama || borderId;
          const nextHistory = isOwner
            ? coinHistory
            : [
                {
                  id: `ch-${Date.now()}`,
                  jenis: 'kurang' as const,
                  jumlah: price,
                  keterangan: `Beli Border ${borderName}`,
                  created_at: new Date().toISOString(),
                },
                ...coinHistory,
              ].slice(0, 60);

          setCurrentUser(nextUser);
          setUserOwnedBorders(nextOwned);
          setCoinHistory(nextHistory);
          onlineHub.emit('USER_UPDATED', { user: nextUser, ownedBorders: nextOwned });
          sounds.playWin();
          confetti({ particleCount: 40, colors: ['#D4AF37', '#1E3A8A'] });
          setToast('Border berhasil dibeli dan langsung dipake!');
          return { success: true, message: 'Border kebeli!' };
        }
        const msg = e instanceof Error ? e.message : 'Gagal beli border!';
        setToast(msg);
        return { success: false, message: msg };
      }
    },
    [api, coinHistory, currentUser, effectiveUserOwnedBorders, isOwner, setToast]
  );

  const redeemCode = useCallback(
    async (inputCode: string) => {
      try {
        const data = await api('/api/redeem-codes/claim', {
          method: 'POST',
          body: JSON.stringify({ user_id: currentUser.user_id, kode: inputCode }),
        });
        setCurrentUser(data.profile);
        if (data.ownedBorders) setUserOwnedBorders(data.ownedBorders);
        if (data.redeemCodes) setRedeemCodes(data.redeemCodes);
        if (data.coinHistory) setCoinHistory(data.coinHistory);
        sounds.playTing();
        confetti({ particleCount: 50, colors: ['#D4AF37'] });
        setToast(data.message);
        return { success: true, message: data.message };
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const clean = inputCode.trim().toUpperCase();
          const codeObj = redeemCodes.find((r) => r.kode.toUpperCase() === clean);
          if (!codeObj) return { success: false, message: 'Kode Redeem ga valid!' };
          if (codeObj.claimed_by.includes(currentUser.user_id)) {
            return { success: false, message: 'Lu udah pernah klaim kode ini!' };
          }
          if (codeObj.dipakai_count >= codeObj.max_orang) {
            return { success: false, message: 'Kuota kode redeem udah abis!' };
          }
          const rewardLabel =
            codeObj.hadiah_type === 'coin'
              ? `+${codeObj.hadiah_coin || 50} Coin`
              : `Border ${codeObj.hadiah_border || 'pemula'}`;
          const updatedCode: RedeemCode = {
            ...codeObj,
            dipakai_count: codeObj.dipakai_count + 1,
            claimed_by: [...codeObj.claimed_by, currentUser.user_id],
            claims: [
              ...(codeObj.claims || []),
              {
                user_id: currentUser.user_id,
                nama: currentUser.nama,
                username: currentUser.username,
                reward_text: rewardLabel,
                created_at: new Date().toISOString(),
              },
            ],
          };
          const nextCodes = redeemCodes.map((r) => (r.id === codeObj.id ? updatedCode : r));
          let nextUser = { ...currentUser };
          let nextOwned = [...effectiveUserOwnedBorders];
          let nextHistory = [...coinHistory];
          let rewardMsg = '';

          if (codeObj.hadiah_type === 'coin') {
            const gain = codeObj.hadiah_coin || 50;
            nextUser.coin = isOwner ? 999999999 : nextUser.coin + gain;
            if (!isOwner) {
              nextHistory = [
                {
                  id: `ch-${Date.now()}`,
                  jenis: 'tambah' as const,
                  jumlah: gain,
                  keterangan: `Redeem Kode: ${codeObj.kode}`,
                  created_at: new Date().toISOString(),
                },
                ...nextHistory,
              ].slice(0, 60);
            }
            rewardMsg = `🎉 Berhasil! Lu dapet +${gain} Coin dari kode ${codeObj.kode}!`;
          } else {
            const borderId = codeObj.hadiah_border || 'pemula';
            nextOwned = Array.from(new Set([...nextOwned, borderId]));
            nextUser.border_saat_ini = borderId;
            rewardMsg = `🎉 Berhasil! Border eksklusif langsung aktif dari kode ${codeObj.kode}!`;
          }

          setRedeemCodes(nextCodes);
          setCurrentUser(nextUser);
          setUserOwnedBorders(nextOwned);
          setCoinHistory(nextHistory);
          onlineHub.emit('REDEEM_CODES_UPDATED', { redeemCodes: nextCodes });
          onlineHub.emit('USER_UPDATED', { user: nextUser, ownedBorders: nextOwned });
          sounds.playTing();
          confetti({ particleCount: 50, colors: ['#D4AF37'] });
          setToast(rewardMsg);
          return { success: true, message: rewardMsg };
        }
        const msg = e instanceof Error ? e.message : 'Kode gagal diclaim!';
        return { success: false, message: msg };
      }
    },
    [api, coinHistory, currentUser, effectiveUserOwnedBorders, isOwner, redeemCodes, setToast]
  );

  const updateBorderDecorations = useCallback(
    async (decorations: UserProfile['decorations'], customText?: string) => {
      try {
        const data = await api(`/api/users/${currentUser.user_id}/decorations`, {
          method: 'POST',
          body: JSON.stringify({ decorations, customText }),
        });
        setCurrentUser(data.profile);
        if (data.coinHistory) setCoinHistory(data.coinHistory);
        sounds.playTing();
        triggerHaptic('success');
        setToast(
          isOwner
            ? 'Hiasan border lu diupdate (Gratis Owner)!'
            : `Hiasan border diterapkan! (-${data.cost} Coin)`
        );
        return { success: true, message: 'Hiasan berhasil diterapkan!', cost: data.cost };
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const cost = computeDecorationCost(currentUser, decorations, customText);
          if (!isOwner && currentUser.coin < cost) {
            const msg = `Coin lu kurang! Butuh ${cost} Coin buat hiasan ini.`;
            setToast(msg);
            return { success: false, message: msg, cost: 0 };
          }
          const nextCoin = isOwner ? 999999999 : currentUser.coin - cost;
          const nextUser: UserProfile = {
            ...currentUser,
            coin: nextCoin,
            decorations,
            custom_text: customText !== undefined ? customText.trim() : currentUser.custom_text,
            total_hiasan_coin: currentUser.total_hiasan_coin + (isOwner ? 0 : cost),
          };
          const nextHistory =
            isOwner || cost === 0
              ? coinHistory
              : [
                  {
                    id: `ch-${Date.now()}`,
                    jenis: 'kurang' as const,
                    jumlah: cost,
                    keterangan: 'Hias Border Profil',
                    created_at: new Date().toISOString(),
                  },
                  ...coinHistory,
                ].slice(0, 60);

          setCurrentUser(nextUser);
          setCoinHistory(nextHistory);
          onlineHub.emit('USER_UPDATED', { user: nextUser });
          sounds.playTing();
          triggerHaptic('success');
          setToast(
            isOwner
              ? 'Hiasan border lu diupdate (Gratis Owner)!'
              : `Hiasan border diterapkan! (-${cost} Coin)`
          );
          return { success: true, message: 'Hiasan berhasil diterapkan!', cost };
        }
        const msg = e instanceof Error ? e.message : 'Gagal pasang hiasan!';
        setToast(msg);
        return { success: false, message: msg, cost: 0 };
      }
    },
    [api, coinHistory, currentUser, isOwner, setToast]
  );

  const equipBorder = useCallback(
    async (borderId: string) => {
      try {
        const data = await api(`/api/users/${currentUser.user_id}/border`, {
          method: 'POST',
          body: JSON.stringify({ borderId }),
        });
        setCurrentUser(data.profile);
        triggerHaptic('light');
        const borderName = ALL_BORDERS.find((b) => b.id === borderId)?.nama || borderId;
        setToast(`Border diganti ke ${borderName}!`);
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          if (!isOwner && !effectiveUserOwnedBorders.includes(borderId)) {
            setToast('Border ini belum kebuka!');
            return;
          }
          const nextUser: UserProfile = { ...currentUser, border_saat_ini: borderId };
          setCurrentUser(nextUser);
          onlineHub.emit('USER_UPDATED', { user: nextUser });
          triggerHaptic('light');
          const borderName = ALL_BORDERS.find((b) => b.id === borderId)?.nama || borderId;
          setToast(`Border diganti ke ${borderName}!`);
          return;
        }
        setToast(e instanceof Error ? e.message : 'Gagal ganti border!');
      }
    },
    [api, currentUser, effectiveUserOwnedBorders, isOwner, setToast]
  );

  const voteBorder = useCallback(
    async (targetUserId: string) => {
      try {
        const data = await api(`/api/users/${targetUserId}/vote-border`, { method: 'POST' });
        setAllUsers((prev) => prev.map((u) => (u.user_id === targetUserId ? data.user : u)));
        sounds.playTing();
        triggerHaptic('success');
        setToast('Vote lu berhasil masuk!');
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const target = allUsers.find((u) => u.user_id === targetUserId);
          if (!target) return;
          const updatedTarget: UserProfile = {
            ...target,
            votes_count: (target.votes_count || 0) + 1,
          };
          setAllUsers((prev) => prev.map((u) => (u.user_id === targetUserId ? updatedTarget : u)));
          onlineHub.emit('USER_UPDATED', { user: updatedTarget });
          sounds.playTing();
          triggerHaptic('success');
          setToast('Vote lu berhasil masuk!');
          return;
        }
        setToast(e instanceof Error ? e.message : 'Gagal vote border!');
      }
    },
    [allUsers, api, setToast]
  );

  // FEED KOMUNITAS ACTIONS (Supabase Realtime + Backend Sync, ZERO COIN!)
  const createPost = useCallback(
    async (imageUrl: string, caption: string, tag: string) => {
      try {
        if (currentUser.is_banned) {
          const msg = 'Akun lu lagi kena banned, nggak bisa posting.';
          setToast(msg);
          return { success: false, message: msg };
        }
        const imgStr = (imageUrl || '').trim();
        const cleanCaption = filterKataKasar((caption || '').trim());
        if (!imgStr && !cleanCaption) {
          const msg = 'Tulis caption atau pilih foto dulu buat diposting!';
          setToast(msg);
          return { success: false, message: msg };
        }
        if (imgStr.startsWith('data:video/') || /\.(mp4|mov|webm|mkv)(\?|$)/i.test(imgStr)) {
          const msg = 'Feed cuma support foto atau teks aja, ga boleh video!';
          setToast(msg);
          return { success: false, message: msg };
        }

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayCount = posts.filter(
          (p) => p.user_id === currentUser.user_id && new Date(p.created_at).getTime() >= startOfToday.getTime()
        ).length;
        if (!isOwner && todayCount >= 3) {
          const msg = 'Maksimal 3 postingan per hari bro! Besok lagi ya.';
          setToast(msg);
          return { success: false, message: msg };
        }

        const newId = `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const cleanTag = (tag || '').replace(/^#/, '').trim();

        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase.from('posts').insert({
            id: newId,
            user_id: currentUser.user_id,
            nama: currentUser.nama,
            username: currentUser.username,
            foto_profil: currentUser.foto,
            border: currentUser.border_saat_ini,
            custom_text: currentUser.custom_text,
            image_url: imgStr,
            caption: cleanCaption,
            tag: cleanTag,
            likes_count: 0,
            comments_count: 0,
            is_pinned: false,
            reports_count: 0,
            reported_by: [],
            is_hidden: false,
          });
          if (!error) {
            await syncFeedFromSupabase();
          }
          await api('/api/posts', {
            method: 'POST',
            body: JSON.stringify({
              user_id: currentUser.user_id,
              image_url: imgStr,
              caption: cleanCaption,
              tag: cleanTag,
            }),
          }).catch(() => null);
        } else {
          try {
            const data = await api('/api/posts', {
              method: 'POST',
              body: JSON.stringify({
                user_id: currentUser.user_id,
                image_url: imgStr,
                caption: cleanCaption,
                tag: cleanTag,
              }),
            });
            if (data.post) {
              setPosts((prev) => (prev.some((p) => p.id === data.post.id) ? prev : [data.post, ...prev]));
            }
          } catch (err) {
            if (err instanceof BackendUnavailableError) {
              const localPost: FeedPost = {
                id: newId,
                user_id: currentUser.user_id,
                nama: currentUser.nama,
                username: currentUser.username,
                foto_profil: currentUser.foto,
                border: currentUser.border_saat_ini,
                custom_text: currentUser.custom_text,
                image_url: imgStr,
                caption: cleanCaption,
                tag: cleanTag,
                likes_count: 0,
                comments_count: 0,
                is_pinned: false,
                reports_count: 0,
                reported_by: [],
                is_hidden: false,
                created_at: new Date().toISOString(),
              };
              setPosts((prev) => [localPost, ...prev]);
              onlineHub.emit('POST_CREATED', { post: localPost });
            } else {
              throw err;
            }
          }
        }
        sounds.playTing();
        triggerHaptic('success');
        setToast('Postingan berhasil diterbitkan!');
        return { success: true, message: 'Berhasil posting!' };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Gagal bikin postingan!';
        setToast(msg);
        return { success: false, message: msg };
      }
    },
    [api, currentUser, isOwner, posts, setToast, syncFeedFromSupabase]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      try {
        if (isSupabaseConfigured && supabase) {
          await supabase.from('likes').delete().eq('post_id', postId);
          await supabase.from('comments').delete().eq('post_id', postId);
          await supabase.from('posts').delete().eq('id', postId);
          await api(`/api/posts/${postId}?user_id=${encodeURIComponent(currentUser.user_id)}`, {
            method: 'DELETE',
            body: JSON.stringify({ user_id: currentUser.user_id }),
          }).catch(() => null);
        } else {
          await api(`/api/posts/${postId}?user_id=${encodeURIComponent(currentUser.user_id)}`, {
            method: 'DELETE',
            body: JSON.stringify({ user_id: currentUser.user_id }),
          }).catch((err) => {
            if (!(err instanceof BackendUnavailableError)) throw err;
            onlineHub.emit('POST_DELETED', { postId });
          });
        }
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setFeedLikes((prev) => prev.filter((l) => l.post_id !== postId));
        setFeedComments((prev) => prev.filter((c) => c.post_id !== postId));
        setToast('Postingan berhasil dihapus!');
        return { success: true, message: 'Terhapus!' };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Gagal hapus postingan!';
        setToast(msg);
        return { success: false, message: msg };
      }
    },
    [api, currentUser.user_id, setToast]
  );

  const toggleLikePost = useCallback(
    async (postId: string) => {
      try {
        if (isSupabaseConfigured && supabase) {
          const existing = feedLikes.find((l) => l.post_id === postId && l.user_id === currentUser.user_id);
          if (existing) {
            await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUser.user_id);
          } else {
            await supabase.from('likes').insert({
              id: `like-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              post_id: postId,
              user_id: currentUser.user_id,
              nama: currentUser.nama,
              username: currentUser.username,
              foto_profil: currentUser.foto,
              border: currentUser.border_saat_ini,
            });
          }
          await syncFeedFromSupabase();
          await api(`/api/posts/${postId}/like`, {
            method: 'POST',
            body: JSON.stringify({ user_id: currentUser.user_id }),
          }).catch(() => null);
        } else {
          try {
            const data = await api(`/api/posts/${postId}/like`, {
              method: 'POST',
              body: JSON.stringify({ user_id: currentUser.user_id }),
            });
            if (data.postLikes) {
              setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes_count: data.likes_count } : p)));
              setFeedLikes((prev) => [...data.postLikes, ...prev.filter((l) => l.post_id !== postId)]);
            }
          } catch (err) {
            if (!(err instanceof BackendUnavailableError)) throw err;
            const existing = feedLikes.find((l) => l.post_id === postId && l.user_id === currentUser.user_id);
            const postLikes = existing
              ? feedLikes.filter((l) => l.post_id === postId && l.user_id !== currentUser.user_id)
              : [
                  {
                    id: `like-${Date.now()}`,
                    post_id: postId,
                    user_id: currentUser.user_id,
                    nama: currentUser.nama,
                    username: currentUser.username,
                    foto_profil: currentUser.foto,
                    border: currentUser.border_saat_ini,
                    created_at: new Date().toISOString(),
                  },
                  ...feedLikes.filter((l) => l.post_id === postId),
                ];
            setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes_count: postLikes.length } : p)));
            setFeedLikes((prev) => [...postLikes, ...prev.filter((l) => l.post_id !== postId)]);
            onlineHub.emit('LIKE_UPDATED', { postId, likes_count: postLikes.length, postLikes });
          }
        }
        triggerHaptic('light');
      } catch (e) {
        setToast(e instanceof Error ? e.message : 'Gagal like postingan!');
      }
    },
    [api, currentUser, feedLikes, setToast, syncFeedFromSupabase]
  );

  const addPostComment = useCallback(
    async (postId: string, isi: string, parentId: string | null = null, replyToNama: string | null = null) => {
      const cleanIsi = filterKataKasar(isi.trim());
      if (!cleanIsi) return { success: false, message: 'Komentar gaboleh kosong!' };
      if (currentUser.is_banned) {
        const msg = 'Akun lu lagi kena banned, nggak bisa komen.';
        setToast(msg);
        return { success: false, message: msg };
      }
      try {
        if (isSupabaseConfigured && supabase) {
          await supabase.from('comments').insert({
            id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            post_id: postId,
            user_id: currentUser.user_id,
            nama: currentUser.nama,
            username: currentUser.username,
            foto_profil: currentUser.foto,
            border: currentUser.border_saat_ini,
            isi: cleanIsi,
            parent_id: parentId,
            reply_to_nama: replyToNama,
            likes_count: 0,
            liked_by: [],
          });
          await syncFeedFromSupabase();
          await api(`/api/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify({
              user_id: currentUser.user_id,
              isi: cleanIsi,
              parent_id: parentId,
              reply_to_nama: replyToNama,
            }),
          }).catch(() => null);
        } else {
          try {
            const data = await api(`/api/posts/${postId}/comments`, {
              method: 'POST',
              body: JSON.stringify({
                user_id: currentUser.user_id,
                isi: cleanIsi,
                parent_id: parentId,
                reply_to_nama: replyToNama,
              }),
            });
            if (data.comment) {
              setFeedComments((prev) =>
                prev.some((c) => c.id === data.comment.id) ? prev : [...prev, data.comment]
              );
              setPosts((prev) =>
                prev.map((p) => (p.id === postId ? { ...p, comments_count: data.comments_count } : p))
              );
            }
          } catch (err) {
            if (!(err instanceof BackendUnavailableError)) throw err;
            const cmt: FeedComment = {
              id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              post_id: postId,
              user_id: currentUser.user_id,
              nama: currentUser.nama,
              username: currentUser.username,
              foto_profil: currentUser.foto,
              border: currentUser.border_saat_ini,
              isi: cleanIsi,
              parent_id: parentId,
              reply_to_nama: replyToNama,
              likes_count: 0,
              liked_by: [],
              created_at: new Date().toISOString(),
            };
            const nextCount = feedComments.filter((c) => c.post_id === postId).length + 1;
            setFeedComments((prev) => [...prev, cmt]);
            setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments_count: nextCount } : p)));
            onlineHub.emit('COMMENT_ADDED', { postId, comment: cmt, comments_count: nextCount });
          }
        }
        triggerHaptic('light');
        return { success: true, message: 'Komentar terkirim!' };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Gagal kirim komentar!';
        setToast(msg);
        return { success: false, message: msg };
      }
    },
    [api, currentUser, feedComments, setToast, syncFeedFromSupabase]
  );

  const deletePostComment = useCallback(
    async (commentId: string) => {
      try {
        if (isSupabaseConfigured && supabase) {
          await supabase.from('comments').delete().eq('parent_id', commentId);
          await supabase.from('comments').delete().eq('id', commentId);
          await syncFeedFromSupabase();
          await api(`/api/comments/${commentId}?user_id=${encodeURIComponent(currentUser.user_id)}`, {
            method: 'DELETE',
            body: JSON.stringify({ user_id: currentUser.user_id }),
          }).catch(() => null);
        } else {
          try {
            const data = await api(`/api/comments/${commentId}?user_id=${encodeURIComponent(currentUser.user_id)}`, {
              method: 'DELETE',
              body: JSON.stringify({ user_id: currentUser.user_id }),
            });
            setFeedComments((prev) => prev.filter((c) => c.id !== commentId && c.parent_id !== commentId));
            if (data.postId) {
              setPosts((prev) =>
                prev.map((p) => (p.id === data.postId ? { ...p, comments_count: data.comments_count } : p))
              );
            }
          } catch (err) {
            if (!(err instanceof BackendUnavailableError)) throw err;
            const target = feedComments.find((c) => c.id === commentId);
            const remaining = feedComments.filter((c) => c.id !== commentId && c.parent_id !== commentId);
            setFeedComments(remaining);
            if (target) {
              const count = remaining.filter((c) => c.post_id === target.post_id).length;
              setPosts((prev) => prev.map((p) => (p.id === target.post_id ? { ...p, comments_count: count } : p)));
              onlineHub.emit('COMMENT_DELETED', { postId: target.post_id, commentId, comments_count: count });
            }
          }
        }
        setToast('Komentar dihapus!');
      } catch (e) {
        setToast(e instanceof Error ? e.message : 'Gagal hapus komentar!');
      }
    },
    [api, currentUser.user_id, feedComments, setToast, syncFeedFromSupabase]
  );

  const toggleLikeComment = useCallback(
    async (commentId: string) => {
      try {
        const target = feedComments.find((c) => c.id === commentId);
        if (isSupabaseConfigured && supabase && target) {
          const currentLiked = target.liked_by || [];
          const nextLiked = currentLiked.includes(currentUser.user_id)
            ? currentLiked.filter((id) => id !== currentUser.user_id)
            : [...currentLiked, currentUser.user_id];
          await supabase
            .from('comments')
            .update({ liked_by: nextLiked, likes_count: nextLiked.length })
            .eq('id', commentId);
          await syncFeedFromSupabase();
          await api(`/api/comments/${commentId}/like`, {
            method: 'POST',
            body: JSON.stringify({ user_id: currentUser.user_id }),
          }).catch(() => null);
        } else {
          try {
            const data = await api(`/api/comments/${commentId}/like`, {
              method: 'POST',
              body: JSON.stringify({ user_id: currentUser.user_id }),
            });
            if (data.comment) {
              setFeedComments((prev) => prev.map((c) => (c.id === commentId ? data.comment : c)));
            }
          } catch (err) {
            if (!(err instanceof BackendUnavailableError) || !target) throw err;
            const currentLiked = target.liked_by || [];
            const nextLiked = currentLiked.includes(currentUser.user_id)
              ? currentLiked.filter((id) => id !== currentUser.user_id)
              : [...currentLiked, currentUser.user_id];
            const updatedCmt = { ...target, liked_by: nextLiked, likes_count: nextLiked.length };
            setFeedComments((prev) => prev.map((c) => (c.id === commentId ? updatedCmt : c)));
            onlineHub.emit('COMMENT_UPDATED', { comment: updatedCmt });
          }
        }
        triggerHaptic('light');
      } catch (e) {
        setToast(e instanceof Error ? e.message : 'Gagal like komentar!');
      }
    },
    [api, currentUser.user_id, feedComments, setToast, syncFeedFromSupabase]
  );

  const reportPost = useCallback(
    async (postId: string) => {
      try {
        const target = posts.find((p) => p.id === postId);
        if (isSupabaseConfigured && supabase && target) {
          const reportedBy = target.reported_by || [];
          if (reportedBy.includes(currentUser.user_id)) {
            setToast('Lu udah report postingan ini sebelumnya.');
            return;
          }
          const nextReportedBy = [...reportedBy, currentUser.user_id];
          const nextHidden = nextReportedBy.length >= 3;
          await supabase
            .from('posts')
            .update({
              reported_by: nextReportedBy,
              reports_count: nextReportedBy.length,
              is_hidden: nextHidden,
            })
            .eq('id', postId);
          await syncFeedFromSupabase();
          await api(`/api/posts/${postId}/report`, {
            method: 'POST',
            body: JSON.stringify({ user_id: currentUser.user_id }),
          }).catch(() => null);
          setToast(
            nextHidden
              ? 'Postingan otomatis disembunyikan karena udah 3x report.'
              : 'Laporan dikirim! Terima kasih udah bantu jaga komunitas.'
          );
        } else {
          try {
            const data = await api(`/api/posts/${postId}/report`, {
              method: 'POST',
              body: JSON.stringify({ user_id: currentUser.user_id }),
            });
            if (data.post) {
              setPosts((prev) => prev.map((p) => (p.id === postId ? data.post : p)));
            }
            setToast(
              data.post?.is_hidden
                ? 'Postingan otomatis disembunyikan karena udah 3x report.'
                : 'Laporan dikirim! Terima kasih udah bantu jaga komunitas.'
            );
          } catch (err) {
            if (!(err instanceof BackendUnavailableError) || !target) throw err;
            const reportedBy = target.reported_by || [];
            if (reportedBy.includes(currentUser.user_id)) {
              setToast('Lu udah report postingan ini sebelumnya.');
              return;
            }
            const nextReportedBy = [...reportedBy, currentUser.user_id];
            const nextHidden = nextReportedBy.length >= 3;
            const updatedPost = {
              ...target,
              reported_by: nextReportedBy,
              reports_count: nextReportedBy.length,
              is_hidden: nextHidden,
            };
            setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
            onlineHub.emit('POST_UPDATED', { post: updatedPost });
            setToast(
              nextHidden
                ? 'Postingan otomatis disembunyikan karena udah 3x report.'
                : 'Laporan dikirim! Terima kasih udah bantu jaga komunitas.'
            );
          }
        }
      } catch (e) {
        setToast(e instanceof Error ? e.message : 'Gagal report postingan!');
      }
    },
    [api, currentUser.user_id, posts, setToast, syncFeedFromSupabase]
  );

  const togglePinPost = useCallback(
    async (postId: string) => {
      try {
        if (!isOwner) {
          setToast('Khusus Owner @istamina!');
          return;
        }
        const target = posts.find((p) => p.id === postId);
        if (isSupabaseConfigured && supabase && target) {
          const nextPinned = !target.is_pinned;
          await supabase.from('posts').update({ is_pinned: nextPinned }).eq('id', postId);
          await syncFeedFromSupabase();
          await api(`/api/owner/posts/${postId}/pin`, {
            method: 'POST',
            body: JSON.stringify({ actor_id: currentUser.user_id }),
          }).catch(() => null);
          setToast(nextPinned ? '📌 Postingan disematkan!' : 'Pin dilepas.');
        } else {
          try {
            const data = await api(`/api/owner/posts/${postId}/pin`, {
              method: 'POST',
              body: JSON.stringify({ actor_id: currentUser.user_id }),
            });
            if (data.post) {
              setPosts((prev) => prev.map((p) => (p.id === postId ? data.post : p)));
            }
            setToast(data.post?.is_pinned ? '📌 Postingan disematkan!' : 'Pin dilepas.');
          } catch (err) {
            if (!(err instanceof BackendUnavailableError) || !target) throw err;
            const updatedPost = { ...target, is_pinned: !target.is_pinned };
            setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
            onlineHub.emit('POST_UPDATED', { post: updatedPost });
            setToast(updatedPost.is_pinned ? '📌 Postingan disematkan!' : 'Pin dilepas.');
          }
        }
      } catch (e) {
        setToast(e instanceof Error ? e.message : 'Gagal pin postingan!');
      }
    },
    [api, currentUser.user_id, isOwner, posts, setToast, syncFeedFromSupabase]
  );

  const toggleBanUser = useCallback(
    async (targetUserId: string) => {
      try {
        const data = await api(`/api/owner/users/${targetUserId}/ban`, {
          method: 'POST',
          body: JSON.stringify({ actor_id: currentUser.user_id }),
        });
        if (data.user) {
          setAllUsers((prev) => prev.map((u) => (u.user_id === targetUserId ? data.user : u)));
          setToast(
            data.user.is_banned
              ? `🚫 @${data.user.username} berhasil di-banned!`
              : `✅ Banned @${data.user.username} udah dicabut.`
          );
        }
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const target = allUsers.find((u) => u.user_id === targetUserId);
          if (!target) return;
          const updatedUser = { ...target, is_banned: !target.is_banned };
          setAllUsers((prev) => prev.map((u) => (u.user_id === targetUserId ? updatedUser : u)));
          onlineHub.emit('USER_UPDATED', { user: updatedUser });
          setToast(
            updatedUser.is_banned
              ? `🚫 @${updatedUser.username} berhasil di-banned!`
              : `✅ Banned @${updatedUser.username} udah dicabut.`
          );
          return;
        }
        setToast(e instanceof Error ? e.message : 'Gagal update status ban!');
      }
    },
    [allUsers, api, currentUser.user_id, setToast]
  );

  // OWNER PANEL ACTIONS (@istamina ONLY)
  const createBroadcast = useCallback(
    async (
      jenis: Broadcast['jenis'],
      judul: string,
      pesan: string,
      target: Broadcast['target'],
      isPublished = true,
      aktifSampai?: string
    ) => {
      try {
        const data = await api('/api/owner/broadcasts', {
          method: 'POST',
          body: JSON.stringify({
            actor_id: currentUser.user_id,
            jenis,
            judul,
            pesan,
            target,
            is_published: isPublished,
            aktif_sampai: aktifSampai,
          }),
        });
        setBroadcasts(data.broadcasts);
        setToast(isPublished ? '📢 Broadcast berhasil dipublish!' : 'Broadcast disimpan sebagai draft.');
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const bc: Broadcast = {
            id: `bc-${Date.now()}`,
            dibuat_oleh: currentUser.nama || 'Faiz',
            jenis,
            judul,
            pesan,
            target,
            is_published: isPublished,
            aktif_sampai: aktifSampai || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
          };
          const next = [bc, ...broadcasts];
          setBroadcasts(next);
          onlineHub.emit('BROADCASTS_UPDATED', { broadcasts: next, latest: isPublished ? bc : null });
          setToast(isPublished ? '📢 Broadcast berhasil dipublish!' : 'Broadcast disimpan sebagai draft.');
          return;
        }
        setToast(e instanceof Error ? e.message : 'Gagal bikin broadcast!');
      }
    },
    [api, broadcasts, currentUser.user_id, setToast]
  );

  const toggleBroadcastPublish = useCallback(
    async (id: string, isPublished: boolean) => {
      try {
        const data = await api(`/api/owner/broadcasts/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ actor_id: currentUser.user_id, is_published: isPublished }),
        });
        setBroadcasts(data.broadcasts);
        setToast(isPublished ? 'Broadcast dipublish ke Beranda!' : 'Broadcast dinonaktifkan.');
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const next = broadcasts.map((b) => (b.id === id ? { ...b, is_published: isPublished } : b));
          setBroadcasts(next);
          onlineHub.emit('BROADCASTS_UPDATED', { broadcasts: next });
          setToast(isPublished ? 'Broadcast dipublish ke Beranda!' : 'Broadcast dinonaktifkan.');
          return;
        }
        setToast(e instanceof Error ? e.message : 'Gagal update broadcast!');
      }
    },
    [api, broadcasts, currentUser.user_id, setToast]
  );

  const deleteBroadcast = useCallback(
    async (id: string) => {
      try {
        const data = await api(`/api/owner/broadcasts/${id}?actor_id=${encodeURIComponent(currentUser.user_id)}`, {
          method: 'DELETE',
          body: JSON.stringify({ actor_id: currentUser.user_id }),
        });
        setBroadcasts(data.broadcasts);
        setToast('Broadcast dihapus!');
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const next = broadcasts.filter((b) => b.id !== id);
          setBroadcasts(next);
          onlineHub.emit('BROADCASTS_UPDATED', { broadcasts: next });
          setToast('Broadcast dihapus!');
          return;
        }
        setToast(e instanceof Error ? e.message : 'Gagal hapus broadcast!');
      }
    },
    [api, broadcasts, currentUser.user_id, setToast]
  );

  const createGiveaway = useCallback(
    async (perOrang: number, jumlahOrang: number, mulaiPada: string, selesaiPada: string) => {
      try {
        const data = await api('/api/owner/giveaways', {
          method: 'POST',
          body: JSON.stringify({
            actor_id: currentUser.user_id,
            per_orang: perOrang,
            jumlah_orang: jumlahOrang,
            mulai_pada: mulaiPada,
            selesai_pada: selesaiPada,
          }),
        });
        setGiveaways(data.giveaways);
        setToast(`Bagi-bagi ${perOrang} Coin x ${jumlahOrang} orang dibuat!`);
        return { success: true, message: 'Berhasil!' };
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const gw: CoinGiveaway = {
            id: `gw-${Date.now()}`,
            dibuat_oleh: currentUser.nama || 'Faiz',
            per_orang: perOrang,
            jumlah_orang: jumlahOrang,
            total_coin: perOrang * jumlahOrang,
            mulai_pada: mulaiPada,
            selesai_pada: selesaiPada,
            status: 'active',
            is_active: true,
            claims: [],
            created_at: new Date().toISOString(),
          };
          const next = [gw, ...giveaways];
          setGiveaways(next);
          onlineHub.emit('GIVEAWAYS_UPDATED', { giveaways: next });
          setToast(`Bagi-bagi ${perOrang} Coin x ${jumlahOrang} orang dibuat!`);
          return { success: true, message: 'Berhasil!' };
        }
        const msg = e instanceof Error ? e.message : 'Gagal bikin bagi-bagi!';
        setToast(msg);
        return { success: false, message: msg };
      }
    },
    [api, currentUser.user_id, giveaways, setToast]
  );

  const deleteGiveaway = useCallback(
    async (id: string) => {
      try {
        const data = await api(`/api/owner/giveaways/${id}?actor_id=${encodeURIComponent(currentUser.user_id)}`, {
          method: 'DELETE',
          body: JSON.stringify({ actor_id: currentUser.user_id }),
        });
        setGiveaways(data.giveaways);
        setToast('Bagi-bagi dihapus!');
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const next = giveaways.filter((g) => g.id !== id);
          setGiveaways(next);
          onlineHub.emit('GIVEAWAYS_UPDATED', { giveaways: next });
          setToast('Bagi-bagi dihapus!');
          return;
        }
        setToast(e instanceof Error ? e.message : 'Gagal hapus bagi-bagi!');
      }
    },
    [api, currentUser.user_id, giveaways, setToast]
  );

  const createFlashSale = useCallback(
    async (
      borderId: string,
      hargaNormal: number,
      hargaFlash: number,
      stok: number,
      mulaiPada: string,
      selesaiPada: string
    ) => {
      const borderDef = ALL_BORDERS.find((b) => b.id === borderId);
      try {
        const data = await api('/api/owner/flashsales', {
          method: 'POST',
          body: JSON.stringify({
            actor_id: currentUser.user_id,
            border_id: borderId,
            border_nama: borderDef?.nama || borderId.toUpperCase(),
            harga_normal: hargaNormal,
            harga_flash: hargaFlash,
            stok,
            mulai_pada: mulaiPada,
            selesai_pada: selesaiPada,
          }),
        });
        setFlashSales(data.flashSales);
        setToast(`Flash Sale Border ${borderDef?.nama || borderId} dibuat!`);
        return { success: true, message: 'Berhasil!' };
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const fs: FlashSale = {
            id: `fs-${Date.now()}`,
            border_id: borderId,
            border_nama: borderDef?.nama || borderId.toUpperCase(),
            harga_normal: hargaNormal,
            harga_flash: hargaFlash,
            stok,
            sisa_stok: stok,
            mulai_pada: mulaiPada,
            selesai_pada: selesaiPada,
            status: 'active',
            is_active: true,
            claims: [],
            created_at: new Date().toISOString(),
          };
          const next = [fs, ...flashSales];
          setFlashSales(next);
          onlineHub.emit('FLASHSALES_UPDATED', { flashSales: next });
          setToast(`Flash Sale Border ${borderDef?.nama || borderId} dibuat!`);
          return { success: true, message: 'Berhasil!' };
        }
        const msg = e instanceof Error ? e.message : 'Gagal bikin Flash Sale!';
        setToast(msg);
        return { success: false, message: msg };
      }
    },
    [api, currentUser.user_id, flashSales, setToast]
  );

  const deleteFlashSale = useCallback(
    async (id: string) => {
      try {
        const data = await api(`/api/owner/flashsales/${id}?actor_id=${encodeURIComponent(currentUser.user_id)}`, {
          method: 'DELETE',
          body: JSON.stringify({ actor_id: currentUser.user_id }),
        });
        setFlashSales(data.flashSales);
        setToast('Flash Sale dihapus!');
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const next = flashSales.filter((f) => f.id !== id);
          setFlashSales(next);
          onlineHub.emit('FLASHSALES_UPDATED', { flashSales: next });
          setToast('Flash Sale dihapus!');
          return;
        }
        setToast(e instanceof Error ? e.message : 'Gagal hapus Flash Sale!');
      }
    },
    [api, currentUser.user_id, flashSales, setToast]
  );

  const createRedeemCode = useCallback(
    async (
      kode: string,
      hadiahType: 'coin' | 'border',
      value: string | number,
      maxOrang: number,
      mulaiPada: string,
      selesaiPada: string,
      isPublished = true
    ) => {
      try {
        const data = await api('/api/owner/redeem-codes', {
          method: 'POST',
          body: JSON.stringify({
            actor_id: currentUser.user_id,
            kode,
            hadiah_type: hadiahType,
            hadiah_coin: hadiahType === 'coin' ? Number(value) : undefined,
            hadiah_border: hadiahType === 'border' ? String(value) : undefined,
            max_orang: maxOrang,
            mulai_pada: mulaiPada,
            selesai_pada: selesaiPada,
            is_published: isPublished,
          }),
        });
        setRedeemCodes(data.redeemCodes);
        setToast(`Kode Redeem "${kode.toUpperCase()}" berhasil dibuat!`);
        return { success: true, message: 'Berhasil!' };
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const rc: RedeemCode = {
            id: `rc-${Date.now()}`,
            kode: kode.toUpperCase(),
            hadiah_type: hadiahType,
            hadiah_coin: hadiahType === 'coin' ? Number(value) : undefined,
            hadiah_border: hadiahType === 'border' ? String(value) : undefined,
            max_orang: maxOrang,
            dipakai_count: 0,
            mulai_pada: mulaiPada,
            selesai_pada: selesaiPada,
            is_published: isPublished,
            claimed_by: [],
            claims: [],
            created_at: new Date().toISOString(),
          };
          const next = [rc, ...redeemCodes];
          setRedeemCodes(next);
          onlineHub.emit('REDEEM_CODES_UPDATED', { redeemCodes: next });
          setToast(`Kode Redeem "${kode.toUpperCase()}" berhasil dibuat!`);
          return { success: true, message: 'Berhasil!' };
        }
        const msg = e instanceof Error ? e.message : 'Gagal bikin kode redeem!';
        setToast(msg);
        return { success: false, message: msg };
      }
    },
    [api, currentUser.user_id, redeemCodes, setToast]
  );

  const toggleRedeemPublish = useCallback(
    async (id: string, isPublished: boolean) => {
      try {
        const data = await api(`/api/owner/redeem-codes/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ actor_id: currentUser.user_id, is_published: isPublished }),
        });
        setRedeemCodes(data.redeemCodes);
        setToast(isPublished ? 'Kode Redeem dipublish!' : 'Kode Redeem dinonaktifkan.');
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const next = redeemCodes.map((r) => (r.id === id ? { ...r, is_published: isPublished } : r));
          setRedeemCodes(next);
          onlineHub.emit('REDEEM_CODES_UPDATED', { redeemCodes: next });
          setToast(isPublished ? 'Kode Redeem dipublish!' : 'Kode Redeem dinonaktifkan.');
          return;
        }
        setToast(e instanceof Error ? e.message : 'Gagal update kode redeem!');
      }
    },
    [api, currentUser.user_id, redeemCodes, setToast]
  );

  const deleteRedeemCode = useCallback(
    async (id: string) => {
      try {
        const data = await api(`/api/owner/redeem-codes/${id}?actor_id=${encodeURIComponent(currentUser.user_id)}`, {
          method: 'DELETE',
          body: JSON.stringify({ actor_id: currentUser.user_id }),
        });
        setRedeemCodes(data.redeemCodes);
        setToast('Kode Redeem dihapus!');
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const next = redeemCodes.filter((r) => r.id !== id);
          setRedeemCodes(next);
          onlineHub.emit('REDEEM_CODES_UPDATED', { redeemCodes: next });
          setToast('Kode Redeem dihapus!');
          return;
        }
        setToast(e instanceof Error ? e.message : 'Gagal hapus kode redeem!');
      }
    },
    [api, currentUser.user_id, redeemCodes, setToast]
  );

  const ownerGiveCoinToUser = useCallback(
    async (userId: string, amount: number) => {
      try {
        const data = await api('/api/owner/give-coin', {
          method: 'POST',
          body: JSON.stringify({ actor_id: currentUser.user_id, targetUserId: userId, amount }),
        });
        setAllUsers((prev) => prev.map((u) => (u.user_id === userId ? data.user : u)));
        setToast(`Berhasil kasih +${amount} Coin ke ${data.user.nama}!`);
      } catch (e) {
        if (e instanceof BackendUnavailableError) {
          const target = allUsers.find((u) => u.user_id === userId);
          if (!target) return;
          const amt = Number(amount);
          const updatedUser = {
            ...target,
            coin: isOwnerUsername(target.username) ? 999999999 : target.coin + amt,
          };
          setAllUsers((prev) => prev.map((u) => (u.user_id === userId ? updatedUser : u)));
          onlineHub.emit('USER_UPDATED', { user: updatedUser });
          onlineHub.emit('TRANSFER_RECEIVED', {
            txId: `owner-gift-${Date.now()}`,
            toUserId: userId,
            fromNama: currentUser.nama,
            fromUsername: currentUser.username,
            amount: amt,
            note: 'Bonus Coin dari Owner Faiz',
          });
          setToast(`Berhasil kasih +${amt} Coin ke ${target.nama}!`);
          return;
        }
        setToast(e instanceof Error ? e.message : 'Gagal kasih Coin!');
      }
    },
    [allUsers, api, currentUser.nama, currentUser.user_id, currentUser.username, setToast]
  );

  const dismissBroadcastPopup = useCallback(() => {
    setActiveBroadcastPopup(null);
  }, []);

  const activePoll = useMemo(() => (currentRoom ? polls[currentRoom.id] || null : null), [currentRoom, polls]);
  const activeQuiz = useMemo(() => (currentRoom ? quizzes[currentRoom.id] || null : null), [currentRoom, quizzes]);
  const chats = useMemo(() => (currentRoom ? chatsMap[currentRoom.id] || [] : []), [currentRoom, chatsMap]);

  return (
    <AppContext.Provider
      value={{
        isTelegramAuthenticated,
        isLoading,
        currentUser,
        allUsers,
        isOwner,
        onlineCount,
        activeTab,
        setActiveTab,
        currentRoom,
        setCurrentRoom,
        rooms,
        chats,
        isSendingChat,
        giveaways,
        flashSales,
        redeemCodes,
        activePoll,
        activeQuiz,
        broadcasts,
        dailyMissions,
        coinHistory,
        userOwnedBorders: effectiveUserOwnedBorders,
        rouletteSpunToday,
        rouletteWinners,
        posts,
        feedLikes,
        feedComments,
        videoSyncEvent,
        syncRoomVideo,

        joinRoom,
        joinRoomByCode,
        leaveRoom,
        endRoom,
        createRoom,
        sendChatMessage,
        reactToChat,
        markChatsRead,
        deleteChatMessage,
        sendGift,
        giftQueue,
        dismissGiftEvent,
        createPoll,
        votePoll,
        createQuiz,
        answerQuiz,
        changeRoomCode,
        changeRoomVideo,

        checkInToday,
        claimMission,
        spinRoulette,
        transferCoin,
        claimGiveaway,
        buyFlashSale,
        buyShopBorder,
        redeemCode,
        updateBorderDecorations,
        equipBorder,
        voteBorder,

        createPost,
        deletePost,
        toggleLikePost,
        addPostComment,
        deletePostComment,
        toggleLikeComment,
        reportPost,
        togglePinPost,
        toggleBanUser,

        createBroadcast,
        toggleBroadcastPublish,
        deleteBroadcast,
        createGiveaway,
        deleteGiveaway,
        createFlashSale,
        deleteFlashSale,
        createRedeemCode,
        toggleRedeemPublish,
        deleteRedeemCode,
        ownerGiveCoinToUser,

        activeBroadcastPopup,
        dismissBroadcastPopup,
        toastMessage,
        setToast,
        isWalletModalOpen,
        setIsWalletModalOpen,
        isTransferModalOpen,
        setIsTransferModalOpen,
        transferRecipient,
        setTransferRecipient,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
