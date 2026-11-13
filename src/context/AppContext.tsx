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

export type AppTab = 'beranda' | 'room' | 'coin_gratis' | 'leaderboard' | 'border' | 'profil' | 'owner_panel';

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
    };
  }, [tgUser, initialIsOwner]);

  const [isLoading, setIsLoading] = useState<boolean>(isTelegramAuthenticated);
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialUser);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [userOwnedBorders, setUserOwnedBorders] = useState<string[]>(
    initialIsOwner ? ALL_BORDERS.map((b) => b.id) : ['pemula']
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
  const [coinHistory, setCoinHistory] = useState<CoinHistoryItem[]>([]);
  const [dailyMissions, setDailyMissions] = useState<DailyMission[]>([]);
  const [rouletteSpunToday, setRouletteSpunToday] = useState<boolean>(false);
  const [rouletteWinners, setRouletteWinners] = useState<RouletteWinner[]>([]);
  const [giftQueue, setGiftQueue] = useState<GiftEventPayload[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [feedLikes, setFeedLikes] = useState<FeedLike[]>([]);
  const [feedComments, setFeedComments] = useState<FeedComment[]>([]);

  // Global modals
  const [activeBroadcastPopup, setActiveBroadcastPopup] = useState<Broadcast | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferRecipient, setTransferRecipient] = useState<UserProfile | null>(null);

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

  const allUsersMapRef = useRef<Record<string, UserProfile>>({});
  useEffect(() => {
    const map: Record<string, UserProfile> = {};
    allUsers.forEach((u) => {
      map[u.user_id] = u;
    });
    allUsersMapRef.current = map;
  }, [allUsers]);

  // Auto-leave room when user closes Mini App / browser tab so empty rooms delete immediately
  useEffect(() => {
    const handleLeaveOnExit = () => {
      const rId = currentRoomIdRef.current;
      const uid = currentUser.user_id;
      if (rId && uid && typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon(`/api/rooms/${rId}/leave`, JSON.stringify({ user_id: uid }));
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

  // Sync authenticated Telegram user with server + open WebSocket connection
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
        if (!res.ok) throw new Error('Sync failed');
        const data = await res.json();
        if (cancelled) return;

        hasSynced = true;
        const syncedProfile: UserProfile = data.profile;
        if (isOwnerUsername(syncedProfile?.username)) {
          syncedProfile.coin = 999999999;
        }
        setCurrentUser(syncedProfile);
        setAllUsers(data.allUsers || []);
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
        setDailyMissions(data.missions || []);
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
        if (!cancelled && attempt < 5) {
          retryTimer = window.setTimeout(() => syncFromServer(attempt + 1), 1500);
        } else if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    const connectWs = () => {
      if (cancelled) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws?.send(JSON.stringify({ type: 'IDENTIFY', userId: uid }));
        if (!hasSynced) {
          syncFromServer(0);
        }
      };

      ws.onmessage = (event) => {
        try {
          const { type, payload } = JSON.parse(event.data);
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
                setCurrentUser(updated);
                if (payload.ownedBorders) {
                  setUserOwnedBorders(payload.ownedBorders);
                }
              }
              break;
            }

            case 'ROOM_CREATED': {
              const room: Room = payload.room;
              setRooms((prev) => (prev.some((r) => r.id === room.id) ? prev : [room, ...prev]));
              break;
            }

            case 'ROOM_UPDATED': {
              const room: Room = payload.room;
              setRooms((prev) =>
                prev.some((r) => r.id === room.id)
                  ? prev.map((r) => (r.id === room.id ? room : r))
                  : [room, ...prev]
              );
              break;
            }

            case 'ROOM_ENDED': {
              const endedId: string = payload.roomId;
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

            case 'CHAT_ADDED': {
              const { roomId, message } = payload as { roomId: string; message: ChatMessage };
              setChatsMap((prev) => {
                const existingList = prev[roomId] || [];
                // Strict deduplication by unique message ID
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
              const { toUserId, fromUsername, amount, recipientHistory } = payload as {
                toUserId: string;
                fromNama: string;
                fromUsername: string;
                amount: number;
                note: string;
                recipientHistory: CoinHistoryItem[];
              };
              if (toUserId === uid) {
                setCoinHistory(recipientHistory || []);
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
              const { toUserId, fromUsername, giftNama, amount, hostHistory } = payload as {
                toUserId: string;
                fromUsername: string;
                giftNama: string;
                amount: number;
                hostHistory: CoinHistoryItem[];
              };
              if (toUserId === uid) {
                setCoinHistory(hostHistory || []);
                sounds.playTing();
                triggerHaptic('success');
                setToast(`🎁 Lu dapet hadiah ${giftNama} (+${amount} Coin) dari @${fromUsername}!`);
              }
              break;
            }

            case 'POLL_UPDATED': {
              const { roomId, poll } = payload as { roomId: string; poll: Poll };
              setPolls((prev) => ({ ...prev, [roomId]: poll }));
              break;
            }

            case 'QUIZ_UPDATED': {
              const { roomId, quiz } = payload as { roomId: string; quiz: Quiz };
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
              setPosts((prev) =>
                prev.map((p) => (p.id === postId ? { ...p, likes_count } : p))
              );
              setFeedLikes((prev) => [
                ...postLikes,
                ...prev.filter((l) => l.post_id !== postId),
              ]);
              break;
            }

            case 'COMMENT_ADDED': {
              const { postId, comment, comments_count } = payload as {
                postId: string;
                comment: FeedComment;
                comments_count: number;
              };
              setFeedComments((prev) =>
                prev.some((c) => c.id === comment.id) ? prev : [...prev, comment]
              );
              setPosts((prev) =>
                prev.map((p) => (p.id === postId ? { ...p, comments_count } : p))
              );
              break;
            }

            case 'COMMENT_UPDATED': {
              const { comment } = payload as { comment: FeedComment };
              if (!comment) break;
              setFeedComments((prev) =>
                prev.map((c) => (c.id === comment.id ? comment : c))
              );
              break;
            }

            case 'COMMENT_DELETED': {
              const { postId, commentId, comments_count } = payload as {
                postId: string;
                commentId: string;
                comments_count: number;
              };
              setFeedComments((prev) =>
                prev.filter((c) => c.id !== commentId && c.parent_id !== commentId)
              );
              setPosts((prev) =>
                prev.map((p) => (p.id === postId ? { ...p, comments_count } : p))
              );
              break;
            }
          }
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        if (!cancelled) {
          reconnectTimer = window.setTimeout(() => {
            syncFromServer();
            connectWs();
          }, 2500);
        }
      };
    };

    syncFromServer();
    connectWs();

    return () => {
      cancelled = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (retryTimer) window.clearTimeout(retryTimer);
      ws?.close();
    };
  }, [tgUser, setToast]);

  // Helper to call server API
  const api = useCallback(async (url: string, options?: RequestInit) => {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Terjadi kesalahan pada server.');
    }
    return data;
  }, []);

  // ROOM ACTIONS
  const joinRoom = useCallback(async (roomId: string, inputCode?: string) => {
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
      const msg = e instanceof Error ? e.message : 'Gagal masuk room!';
      return { success: false, message: msg };
    }
  }, [api, currentUser.user_id]);

  const joinRoomByCode = useCallback(async (inputCode: string) => {
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
      const msg = e instanceof Error ? e.message : `Room dengan code "${cleanCode}" ga tersedia!`;
      return { success: false, message: msg };
    }
  }, [api, currentUser.user_id, setToast]);

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
      } catch {
        // ignore
      }
    }
  }, [api, currentRoomId, currentUser.user_id]);

  const endRoom = useCallback(async (roomId: string) => {
    try {
      await api(`/api/rooms/${roomId}/end`, {
        method: 'POST',
        body: JSON.stringify({ user_id: currentUser.user_id }),
      });
      setCurrentRoomId(null);
      setToast('Room udah ditutup!');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Gagal nutup room!');
    }
  }, [api, currentUser.user_id, setToast]);

  const createRoom = useCallback(async (payload: {
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
      const msg = e instanceof Error ? e.message : 'Gagal bikin room!';
      setToast(msg);
      return { success: false, message: msg };
    }
  }, [api, currentUser.user_id, setToast]);

  // Send Chat Message (Strictly NO manual duplicate push - waits for WS/server dedupe by unique ID)
  const sendChatMessage = useCallback(async (pesan: string, replyTo?: ChatMessage['reply_to']) => {
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
      // Add idempotently in case WS hasn't delivered it yet; WS handler also checks id
      setChatsMap((prev) => {
        const list = prev[currentRoom.id] || [];
        if (list.some((m) => m.id === data.message.id)) return prev;
        return { ...prev, [currentRoom.id]: [...list, data.message] };
      });
      triggerHaptic('light');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Gagal kirim chat!');
    } finally {
      setIsSendingChat(false);
    }
  }, [api, currentRoom, currentUser.user_id, isSendingChat, setToast]);

  const reactToChat = useCallback(async (chatId: string, emoji: string) => {
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
      setToast(e instanceof Error ? e.message : 'Gagal react chat!');
    }
  }, [api, currentRoom, currentUser.user_id, setToast]);

  const markChatsRead = useCallback(async (chatIds: string[]) => {
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

    // Optimistic local mark so useEffect doesn't re-trigger in a loop
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
    } catch {
      // ignore silent read errors
    }
  }, [api, currentRoom, currentUser.border_saat_ini, currentUser.foto, currentUser.nama, currentUser.user_id, currentUser.username]);

  const deleteChatMessage = useCallback(async (chatId: string) => {
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
      setToast(e instanceof Error ? e.message : 'Gagal hapus chat!');
    }
  }, [api, currentRoom, currentUser.user_id, setToast]);

  const sendGift = useCallback(async (giftId: string) => {
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
      const msg = e instanceof Error ? e.message : 'Gagal kirim gift!';
      setToast(msg);
      return { success: false, message: msg };
    }
  }, [api, currentRoom, currentUser.user_id, enqueueGiftEvent, setToast]);

  const createPoll = useCallback(async (pertanyaan: string, pilihanText: string[]) => {
    if (!currentRoom) return;
    try {
      const data = await api(`/api/rooms/${currentRoom.id}/polls`, {
        method: 'POST',
        body: JSON.stringify({ pertanyaan, pilihanText }),
      });
      setPolls((prev) => ({ ...prev, [currentRoom.id]: data.poll }));
      setToast('Poll berhasil dibuat!');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Gagal buat poll!');
    }
  }, [api, currentRoom, setToast]);

  const votePoll = useCallback(async (optionId: string) => {
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
      setToast(e instanceof Error ? e.message : 'Gagal vote!');
    }
  }, [api, currentRoom, currentUser.user_id, setToast]);

  const createQuiz = useCallback(async (pertanyaan: string, pilihan: string[], jawabanBenar: string) => {
    if (!currentRoom) return;
    try {
      const data = await api(`/api/rooms/${currentRoom.id}/quizzes`, {
        method: 'POST',
        body: JSON.stringify({ pertanyaan, pilihan, jawabanBenar }),
      });
      setQuizzes((prev) => ({ ...prev, [currentRoom.id]: data.quiz }));
      setToast('Quiz berhasil dimulai!');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Gagal buat quiz!');
    }
  }, [api, currentRoom, setToast]);

  const answerQuiz = useCallback(async (jawaban: string) => {
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
      setToast(e instanceof Error ? e.message : 'Gagal jawab quiz!');
    }
  }, [api, currentRoom, currentUser.user_id, isOwner, setToast]);

  const changeRoomCode = useCallback(async (roomId: string, newCode: string) => {
    try {
      const data = await api(`/api/rooms/${roomId}/code`, {
        method: 'POST',
        body: JSON.stringify({ user_id: currentUser.user_id, newCode }),
      });
      setRooms((prev) => prev.map((r) => (r.id === roomId ? data.room : r)));
      setToast(`Code Room diganti jadi: ${data.room.code_room}`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Gagal ganti code!');
    }
  }, [api, currentUser.user_id, setToast]);

  const changeRoomVideo = useCallback(async (roomId: string, newVideoUrl: string) => {
    try {
      const data = await api(`/api/rooms/${roomId}/video`, {
        method: 'POST',
        body: JSON.stringify({ user_id: currentUser.user_id, video_url: newVideoUrl }),
      });
      setRooms((prev) => prev.map((r) => (r.id === roomId ? data.room : r)));
      setToast('Video YouTube room berhasil diganti!');
      return { success: true, message: 'Berhasil!' };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Link harus link YouTube';
      setToast(msg);
      return { success: false, message: msg };
    }
  }, [api, currentUser.user_id, setToast]);

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
      const msg = e instanceof Error ? e.message : 'Gagal check-in!';
      return { success: false, message: msg, coinsEarned: 0 };
    }
  }, [api, currentUser.user_id, isOwner, setToast]);

  const claimMission = useCallback(async (missionId: string) => {
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
      setToast(e instanceof Error ? e.message : 'Gagal klaim misi!');
    }
  }, [api, currentUser.user_id, setToast]);

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
      const msg = e instanceof Error ? e.message : 'Gagal puter roulette!';
      setToast(msg);
      return { success: false, rewardText: msg, coinGain: 0, isZonk: true, sliceIndex: 1 };
    }
  }, [api, currentUser.user_id, setToast]);

  const transferCoin = useCallback(async (toUserId: string, amount: number, note?: string) => {
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
      const msg = e instanceof Error ? e.message : 'Gagal transfer Coin!';
      return { success: false, message: msg };
    }
  }, [api, currentUser.user_id, setToast]);

  const claimGiveaway = useCallback(async (giveawayId: string) => {
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
      const msg = e instanceof Error ? e.message : 'Gagal claim bagi-bagi!';
      setToast(msg);
      return { success: false, message: msg, amount: 0 };
    }
  }, [api, currentUser.user_id, setToast]);

  const buyFlashSale = useCallback(async (flashSaleId: string) => {
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
      const msg = e instanceof Error ? e.message : 'Gagal beli Flash Sale!';
      setToast(msg);
      return { success: false, message: msg };
    }
  }, [api, currentUser.user_id, setToast]);

  const buyShopBorder = useCallback(async (borderId: string) => {
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
      const msg = e instanceof Error ? e.message : 'Gagal beli border!';
      setToast(msg);
      return { success: false, message: msg };
    }
  }, [api, currentUser.user_id, setToast]);

  const redeemCode = useCallback(async (inputCode: string) => {
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
      const msg = e instanceof Error ? e.message : 'Kode gagal diclaim!';
      return { success: false, message: msg };
    }
  }, [api, currentUser.user_id, setToast]);

  const updateBorderDecorations = useCallback(async (decorations: UserProfile['decorations'], customText?: string) => {
    try {
      const data = await api(`/api/users/${currentUser.user_id}/decorations`, {
        method: 'POST',
        body: JSON.stringify({ decorations, customText }),
      });
      setCurrentUser(data.profile);
      if (data.coinHistory) setCoinHistory(data.coinHistory);
      sounds.playTing();
      triggerHaptic('success');
      setToast(isOwner ? 'Hiasan border lu diupdate (Gratis Owner)!' : `Hiasan border diterapkan! (-${data.cost} Coin)`);
      return { success: true, message: 'Hiasan berhasil diterapkan!', cost: data.cost };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal pasang hiasan!';
      setToast(msg);
      return { success: false, message: msg, cost: 0 };
    }
  }, [api, currentUser.user_id, isOwner, setToast]);

  const equipBorder = useCallback(async (borderId: string) => {
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
      setToast(e instanceof Error ? e.message : 'Gagal ganti border!');
    }
  }, [api, currentUser.user_id, setToast]);

  const voteBorder = useCallback(async (targetUserId: string) => {
    try {
      const data = await api(`/api/users/${targetUserId}/vote-border`, { method: 'POST' });
      setAllUsers((prev) => prev.map((u) => (u.user_id === targetUserId ? data.user : u)));
      sounds.playTing();
      triggerHaptic('success');
      setToast('Vote lu berhasil masuk!');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Gagal vote border!');
    }
  }, [api, setToast]);

  // FEED KOMUNITAS ACTIONS (Supabase Realtime + Backend Sync, ZERO COIN!)
  const createPost = useCallback(async (imageUrl: string, caption: string, tag: string) => {
    try {
      if (currentUser.is_banned) {
        const msg = 'Akun lu lagi kena banned, nggak bisa posting.';
        setToast(msg);
        return { success: false, message: msg };
      }
      const cleanCaption = filterKataKasar(caption.trim());
      if (isSupabaseConfigured && supabase) {
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
        const { error } = await supabase.from('posts').insert({
          id: newId,
          user_id: currentUser.user_id,
          nama: currentUser.nama,
          username: currentUser.username,
          foto_profil: currentUser.foto,
          border: currentUser.border_saat_ini,
          custom_text: currentUser.custom_text,
          image_url: imageUrl,
          caption: cleanCaption,
          tag,
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
            image_url: imageUrl,
            caption: cleanCaption,
            tag,
          }),
        }).catch(() => null);
      } else {
        const data = await api('/api/posts', {
          method: 'POST',
          body: JSON.stringify({
            user_id: currentUser.user_id,
            image_url: imageUrl,
            caption: cleanCaption,
            tag,
          }),
        });
        if (data.post) {
          setPosts((prev) => (prev.some((p) => p.id === data.post.id) ? prev : [data.post, ...prev]));
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
  }, [api, currentUser, isOwner, posts, setToast, syncFeedFromSupabase]);

  const deletePost = useCallback(async (postId: string) => {
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
  }, [api, currentUser.user_id, setToast]);

  const toggleLikePost = useCallback(async (postId: string) => {
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
        const data = await api(`/api/posts/${postId}/like`, {
          method: 'POST',
          body: JSON.stringify({ user_id: currentUser.user_id }),
        });
        if (data.postLikes) {
          setPosts((prev) =>
            prev.map((p) => (p.id === postId ? { ...p, likes_count: data.likes_count } : p))
          );
          setFeedLikes((prev) => [
            ...data.postLikes,
            ...prev.filter((l) => l.post_id !== postId),
          ]);
        }
      }
      triggerHaptic('light');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Gagal like postingan!');
    }
  }, [api, currentUser, feedLikes, setToast, syncFeedFromSupabase]);

  const addPostComment = useCallback(async (
    postId: string,
    isi: string,
    parentId: string | null = null,
    replyToNama: string | null = null
  ) => {
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
      }
      triggerHaptic('light');
      return { success: true, message: 'Komentar terkirim!' };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal kirim komentar!';
      setToast(msg);
      return { success: false, message: msg };
    }
  }, [api, currentUser, setToast, syncFeedFromSupabase]);

  const deletePostComment = useCallback(async (commentId: string) => {
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
      }
      setToast('Komentar dihapus!');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Gagal hapus komentar!');
    }
  }, [api, currentUser.user_id, setToast, syncFeedFromSupabase]);

  const toggleLikeComment = useCallback(async (commentId: string) => {
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
        const data = await api(`/api/comments/${commentId}/like`, {
          method: 'POST',
          body: JSON.stringify({ user_id: currentUser.user_id }),
        });
        if (data.comment) {
          setFeedComments((prev) =>
            prev.map((c) => (c.id === commentId ? data.comment : c))
          );
        }
      }
      triggerHaptic('light');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Gagal like komentar!');
    }
  }, [api, currentUser.user_id, feedComments, setToast, syncFeedFromSupabase]);

  const reportPost = useCallback(async (postId: string) => {
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
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Gagal report postingan!');
    }
  }, [api, currentUser.user_id, posts, setToast, syncFeedFromSupabase]);

  const togglePinPost = useCallback(async (postId: string) => {
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
        const data = await api(`/api/owner/posts/${postId}/pin`, {
          method: 'POST',
          body: JSON.stringify({ actor_id: currentUser.user_id }),
        });
        if (data.post) {
          setPosts((prev) => prev.map((p) => (p.id === postId ? data.post : p)));
        }
        setToast(data.post?.is_pinned ? '📌 Postingan disematkan!' : 'Pin dilepas.');
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Gagal pin postingan!');
    }
  }, [api, currentUser.user_id, isOwner, posts, setToast, syncFeedFromSupabase]);

  const toggleBanUser = useCallback(async (targetUserId: string) => {
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
      setToast(e instanceof Error ? e.message : 'Gagal update status ban!');
    }
  }, [api, currentUser.user_id, setToast]);

  // OWNER PANEL ACTIONS (@istamina ONLY)
  const createBroadcast = useCallback(async (
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
      setToast(e instanceof Error ? e.message : 'Gagal bikin broadcast!');
    }
  }, [api, currentUser.user_id, setToast]);

  const toggleBroadcastPublish = useCallback(async (id: string, isPublished: boolean) => {
    try {
      const data = await api(`/api/owner/broadcasts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ actor_id: currentUser.user_id, is_published: isPublished }),
      });
      setBroadcasts(data.broadcasts);
      setToast(isPublished ? 'Broadcast dipublish ke Beranda!' : 'Broadcast dinonaktifkan.');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Gagal update broadcast!');
    }
  }, [api, currentUser.user_id, setToast]);

  const deleteBroadcast = useCallback(async (id: string) => {
    try {
      const data = await api(`/api/owner/broadcasts/${id}?actor_id=${encodeURIComponent(currentUser.user_id)}`, {
        method: 'DELETE',
        body: JSON.stringify({ actor_id: currentUser.user_id }),
      });
      setBroadcasts(data.broadcasts);
      setToast('Broadcast dihapus!');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Gagal hapus broadcast!');
    }
  }, [api, currentUser.user_id, setToast]);

  const createGiveaway = useCallback(async (perOrang: number, jumlahOrang: number, mulaiPada: string, selesaiPada: string) => {
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
      const msg = e instanceof Error ? e.message : 'Gagal bikin bagi-bagi!';
      setToast(msg);
      return { success: false, message: msg };
    }
  }, [api, currentUser.user_id, setToast]);

  const deleteGiveaway = useCallback(async (id: string) => {
    try {
      const data = await api(`/api/owner/giveaways/${id}?actor_id=${encodeURIComponent(currentUser.user_id)}`, {
        method: 'DELETE',
        body: JSON.stringify({ actor_id: currentUser.user_id }),
      });
      setGiveaways(data.giveaways);
      setToast('Bagi-bagi dihapus!');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Gagal hapus bagi-bagi!');
    }
  }, [api, currentUser.user_id, setToast]);

  const createFlashSale = useCallback(async (
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
      const msg = e instanceof Error ? e.message : 'Gagal bikin Flash Sale!';
      setToast(msg);
      return { success: false, message: msg };
    }
  }, [api, currentUser.user_id, setToast]);

  const deleteFlashSale = useCallback(async (id: string) => {
    try {
      const data = await api(`/api/owner/flashsales/${id}?actor_id=${encodeURIComponent(currentUser.user_id)}`, {
        method: 'DELETE',
        body: JSON.stringify({ actor_id: currentUser.user_id }),
      });
      setFlashSales(data.flashSales);
      setToast('Flash Sale dihapus!');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Gagal hapus Flash Sale!');
    }
  }, [api, currentUser.user_id, setToast]);

  const createRedeemCode = useCallback(async (
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
      const msg = e instanceof Error ? e.message : 'Gagal bikin kode redeem!';
      setToast(msg);
      return { success: false, message: msg };
    }
  }, [api, currentUser.user_id, setToast]);

  const toggleRedeemPublish = useCallback(async (id: string, isPublished: boolean) => {
    try {
      const data = await api(`/api/owner/redeem-codes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ actor_id: currentUser.user_id, is_published: isPublished }),
      });
      setRedeemCodes(data.redeemCodes);
      setToast(isPublished ? 'Kode Redeem dipublish!' : 'Kode Redeem dinonaktifkan.');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Gagal update kode redeem!');
    }
  }, [api, currentUser.user_id, setToast]);

  const deleteRedeemCode = useCallback(async (id: string) => {
    try {
      const data = await api(`/api/owner/redeem-codes/${id}?actor_id=${encodeURIComponent(currentUser.user_id)}`, {
        method: 'DELETE',
        body: JSON.stringify({ actor_id: currentUser.user_id }),
      });
      setRedeemCodes(data.redeemCodes);
      setToast('Kode Redeem dihapus!');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Gagal hapus kode redeem!');
    }
  }, [api, currentUser.user_id, setToast]);

  const ownerGiveCoinToUser = useCallback(async (userId: string, amount: number) => {
    try {
      const data = await api('/api/owner/give-coin', {
        method: 'POST',
        body: JSON.stringify({ actor_id: currentUser.user_id, targetUserId: userId, amount }),
      });
      setAllUsers((prev) => prev.map((u) => (u.user_id === userId ? data.user : u)));
      setToast(`Berhasil kasih +${amount} Coin ke ${data.user.nama}!`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Gagal kasih Coin!');
    }
  }, [api, currentUser.user_id, setToast]);

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
