import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  UserProfile,
  Room,
  ChatMessage,
  CoinTransfer,
  CoinGiveaway,
  FlashSale,
  Poll,
  Quiz,
  RedeemCode,
  Broadcast,
  DailyMission,
  CoinHistoryItem,
} from '../types';
import {
  getTelegramUser,
  isOwnerUser,
  triggerHaptic,
  SIMULATED_USERS,
  setDevUserSimulation,
} from '../lib/telegram';
import { ALL_BORDERS, DECORATION_OPTIONS } from '../data/borders';
import { sounds } from '../lib/sound';
import { broadcastLocalEvent, subscribeToEvents } from '../lib/supabaseClient';

const STORAGE_KEY_PROFILES = 'nobarkuy_profiles_db';
const STORAGE_KEY_ROOMS = 'nobarkuy_rooms_db';
const STORAGE_KEY_CHATS = 'nobarkuy_chats_db';
const STORAGE_KEY_TRANSFERS = 'nobarkuy_transfers_db';
const STORAGE_KEY_GIVEAWAYS = 'nobarkuy_giveaways_db';
const STORAGE_KEY_FLASHSALES = 'nobarkuy_flashsales_db';
const STORAGE_KEY_REDEEMS = 'nobarkuy_redeems_db';
const STORAGE_KEY_BROADCASTS = 'nobarkuy_broadcasts_db';
const STORAGE_KEY_POLLS = 'nobarkuy_polls_db';
const STORAGE_KEY_QUIZZES = 'nobarkuy_quizzes_db';
const STORAGE_KEY_HISTORY = 'nobarkuy_history_db';
const STORAGE_KEY_USER_BORDERS = 'nobarkuy_user_borders_db';

// Initial Mock Seed Data
const INITIAL_USERS: UserProfile[] = [
  {
    user_id: '6189849073',
    nama: 'Faiz',
    username: 'istamina',
    foto: SIMULATED_USERS.FAIZ_OWNER.photo_url,
    coin: Infinity,
    poin: 9999,
    border_saat_ini: 'faiz-ganteng',
    custom_text: 'FAIZ GANTENG',
    total_hiasan_coin: 99999,
    checkin_streak: 65,
    checkin_terakhir: new Date().toISOString().split('T')[0],
    checkin_hari_ke: 7,
    kode_referral: 'FAIZKUY',
    direferensikan_oleh: null,
    total_nonton: 88,
    streak_nonton: 45,
    terakhir_nonton: new Date().toISOString().split('T')[0],
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    decorations: {
      bingkai: 'tebal-emas',
      efek: ['bintang', 'kembang-api'],
      warna: 'emas-matte',
      sticker: ['titik-emas'],
      animasi: 'muter',
    },
    votes_count: 342,
  },
  {
    user_id: '198471239',
    nama: 'Bimo Prakoso',
    username: 'bimo12',
    foto: SIMULATED_USERS.BIMO.photo_url,
    coin: 2850,
    poin: 450,
    border_saat_ini: 'naga',
    custom_text: 'RAJA NOBAR',
    total_hiasan_coin: 2200,
    checkin_streak: 6,
    checkin_terakhir: null,
    checkin_hari_ke: 6,
    kode_referral: 'BIMO123',
    direferensikan_oleh: 'FAIZKUY',
    total_nonton: 28,
    streak_nonton: 6,
    terakhir_nonton: new Date().toISOString().split('T')[0],
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    decorations: {
      bingkai: 'api',
      efek: ['confetti'],
      warna: 'merah',
      sticker: ['bintang-emas'],
      animasi: 'goyang',
    },
    votes_count: 189,
  },
  {
    user_id: '284719283',
    nama: 'Ayu Alodia',
    username: 'ayualodia',
    foto: SIMULATED_USERS.AYU.photo_url,
    coin: 1950,
    poin: 380,
    border_saat_ini: 'galaxy',
    custom_text: 'AYU CANTIK',
    total_hiasan_coin: 1850,
    checkin_streak: 5,
    checkin_terakhir: null,
    checkin_hari_ke: 5,
    kode_referral: 'AYU777',
    direferensikan_oleh: 'BIMO123',
    total_nonton: 22,
    streak_nonton: 5,
    terakhir_nonton: new Date().toISOString().split('T')[0],
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    decorations: {
      bingkai: 'berlian',
      efek: ['bintang'],
      warna: 'pink',
      sticker: ['titik-emas'],
      animasi: 'kedip',
    },
    votes_count: 245,
  },
  {
    user_id: '372819284',
    nama: 'Dimas Aditya',
    username: 'dimas_adit',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    coin: 1400,
    poin: 210,
    border_saat_ini: 'semangat-nobar',
    custom_text: 'GASKEUN',
    total_hiasan_coin: 650,
    checkin_streak: 4,
    checkin_terakhir: null,
    checkin_hari_ke: 4,
    kode_referral: 'DIMAS88',
    direferensikan_oleh: null,
    total_nonton: 15,
    streak_nonton: 4,
    terakhir_nonton: new Date().toISOString().split('T')[0],
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    decorations: {
      bingkai: 'hitam-emas',
      efek: ['gelembung'],
      warna: 'biru',
      sticker: [],
      animasi: 'none',
    },
    votes_count: 98,
  },
  {
    user_id: '491827461',
    nama: 'Rian Santoso',
    username: 'riansantoso',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    coin: 980,
    poin: 180,
    border_saat_ini: 'rajin-nobar',
    custom_text: 'SULTAN NOBAR',
    total_hiasan_coin: 450,
    checkin_streak: 3,
    checkin_terakhir: null,
    checkin_hari_ke: 3,
    kode_referral: 'RIAN99',
    direferensikan_oleh: null,
    total_nonton: 12,
    streak_nonton: 3,
    terakhir_nonton: new Date().toISOString().split('T')[0],
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    decorations: {
      bingkai: 'tipis',
      efek: [],
      warna: 'emas-matte',
      sticker: [],
      animasi: 'none',
    },
    votes_count: 76,
  },
];

const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-1',
    judul: 'Nobar Horror Malam Jumat: Pengabdi Setan!',
    host_id: '284719283',
    host_nama: 'Ayu Alodia',
    host_username: 'ayualodia',
    host_foto: SIMULATED_USERS.AYU.photo_url,
    host_border: 'galaxy',
    host_custom_text: 'AYU CANTIK',
    genre: 'Horror',
    is_private: false,
    code_room: '882910',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    status: 'live',
    penonton_count: 38,
    chats_count: 142,
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: 'room-2',
    judul: 'Anime Jujutsu Kaisen Season Terbaru Eps 1-5 Marathon!',
    host_id: '198471239',
    host_nama: 'Bimo Prakoso',
    host_username: 'bimo12',
    host_foto: SIMULATED_USERS.BIMO.photo_url,
    host_border: 'naga',
    host_custom_text: 'RAJA NOBAR',
    genre: 'Anime',
    is_private: false,
    code_room: '491204',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    status: 'live',
    penonton_count: 54,
    chats_count: 289,
    created_at: new Date(Date.now() - 90 * 60000).toISOString(),
  },
  {
    id: 'room-3',
    judul: 'Room Khusus Tongkrongan [PRIVATE]',
    host_id: '6189849073',
    host_nama: 'Faiz',
    host_username: 'istamina',
    host_foto: SIMULATED_USERS.FAIZ_OWNER.photo_url,
    host_border: 'faiz-ganteng',
    host_custom_text: 'FAIZ GANTENG',
    genre: 'Action',
    is_private: true,
    code_room: '123456',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    status: 'live',
    penonton_count: 12,
    chats_count: 67,
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
  },
];

const INITIAL_CHATS: Record<string, ChatMessage[]> = {
  'room-1': [
    {
      id: 'c-1',
      room_id: 'room-1',
      user_id: '284719283',
      nama: 'Ayu Alodia',
      username: 'ayualodia',
      foto: SIMULATED_USERS.AYU.photo_url,
      border: 'galaxy',
      custom_text: 'AYU CANTIK',
      pesan: 'Selamat datang gais! Siapin selimut lu ya, ini serem abis!',
      is_host: true,
      read_by: [
        {
          user_id: '198471239',
          nama: 'Bimo Prakoso',
          username: 'bimo12',
          foto: SIMULATED_USERS.BIMO.photo_url,
          border: 'naga',
          read_at: new Date(Date.now() - 19 * 60000).toISOString(),
        },
        {
          user_id: '6189849073',
          nama: 'Faiz',
          username: 'istamina',
          foto: SIMULATED_USERS.FAIZ_OWNER.photo_url,
          border: 'faiz-ganteng',
          read_at: new Date(Date.now() - 18 * 60000).toISOString(),
        },
        {
          user_id: '372819284',
          nama: 'Dimas Aditya',
          username: 'dimas_adit',
          foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
          border: 'semangat-nobar',
          read_at: new Date(Date.now() - 17 * 60000).toISOString(),
        },
      ],
      created_at: new Date(Date.now() - 20 * 60000).toISOString(),
    },
    {
      id: 'c-2',
      room_id: 'room-1',
      user_id: '198471239',
      nama: 'Bimo Prakoso',
      username: 'bimo12',
      foto: SIMULATED_USERS.BIMO.photo_url,
      border: 'naga',
      custom_text: 'RAJA NOBAR',
      pesan: 'Bimo nyawer 🍿 Popcorn ke Host Ayu!',
      is_gift: true,
      gift_nama: '🍿 Popcorn',
      read_by: [
        {
          user_id: '284719283',
          nama: 'Ayu Alodia',
          username: 'ayualodia',
          foto: SIMULATED_USERS.AYU.photo_url,
          border: 'galaxy',
          read_at: new Date(Date.now() - 14 * 60000).toISOString(),
        },
        {
          user_id: '6189849073',
          nama: 'Faiz',
          username: 'istamina',
          foto: SIMULATED_USERS.FAIZ_OWNER.photo_url,
          border: 'faiz-ganteng',
          read_at: new Date(Date.now() - 13 * 60000).toISOString(),
        },
      ],
      created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: 'c-3',
      room_id: 'room-1',
      user_id: '6189849073',
      nama: 'Faiz',
      username: 'istamina',
      foto: SIMULATED_USERS.FAIZ_OWNER.photo_url,
      border: 'faiz-ganteng',
      custom_text: 'FAIZ GANTENG',
      pesan: 'Rame banget nih room lu! Gas nonton sampe abis biar dapet koin!',
      is_owner: true,
      read_by: [
        {
          user_id: '284719283',
          nama: 'Ayu Alodia',
          username: 'ayualodia',
          foto: SIMULATED_USERS.AYU.photo_url,
          border: 'galaxy',
          read_at: new Date(Date.now() - 4 * 60000).toISOString(),
        },
        {
          user_id: '198471239',
          nama: 'Bimo Prakoso',
          username: 'bimo12',
          foto: SIMULATED_USERS.BIMO.photo_url,
          border: 'naga',
          read_at: new Date(Date.now() - 3 * 60000).toISOString(),
        },
        {
          user_id: '372819284',
          nama: 'Dimas Aditya',
          username: 'dimas_adit',
          foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
          border: 'semangat-nobar',
          read_at: new Date(Date.now() - 2 * 60000).toISOString(),
        },
      ],
      created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    },
  ],
};

interface AppContextValue {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  isOwner: boolean;
  activeTab: 'beranda' | 'room' | 'leaderboard' | 'border' | 'profil' | 'owner_panel';
  setActiveTab: (tab: 'beranda' | 'room' | 'leaderboard' | 'border' | 'profil' | 'owner_panel') => void;
  currentRoom: Room | null;
  setCurrentRoom: (room: Room | null) => void;
  rooms: Room[];
  chats: ChatMessage[];
  giveaways: CoinGiveaway[];
  flashSales: FlashSale[];
  activePoll: Poll | null;
  activeQuiz: Quiz | null;
  broadcasts: Broadcast[];
  dailyMissions: DailyMission[];
  coinHistory: CoinHistoryItem[];
  userOwnedBorders: string[];

  // Actions
  joinRoom: (roomId: string, inputCode?: string) => { success: boolean; message: string };
  joinRoomByCode: (code: string) => { success: boolean; message: string; room?: Room };
  markRoomChatsAsRead: (roomId: string) => void;
  leaveRoom: () => void;
  createRoom: (room: { judul: string; genre: Room['genre']; is_private: boolean; video_url?: string }) => Room;
  sendChatMessage: (text: string) => void;
  sendFreeGift: (giftName: string) => void;
  createPoll: (pertanyaan: string, pilihanText: string[]) => void;
  votePoll: (optionId: string) => void;
  createQuiz: (pertanyaan: string, pilihan: string[], jawabanBenar: string) => void;
  answerQuiz: (jawaban: string) => void;
  changeRoomCode: (roomId: string, newCode: string) => void;
  changeRoomVideo: (roomId: string, newVideoUrl: string) => void;

  // Economy & Border Actions
  checkInToday: () => { success: boolean; message: string; coinsEarned: number };
  claimMission: (missionId: string) => void;
  spinRoulette: () => { result: string; coinGain: number; isZonk: boolean; freeSpin: boolean };
  transferCoin: (toUserId: string, amount: number, note?: string) => { success: boolean; message: string };
  claimGiveaway: (giveawayId: string) => { success: boolean; message: string; amount: number };
  buyFlashSale: (flashSaleId: string) => { success: boolean; message: string };
  buyShopBorder: (borderId: string) => { success: boolean; message: string };
  redeemCode: (code: string) => { success: boolean; message: string };
  updateBorderDecorations: (decorations: UserProfile['decorations'], customText?: string) => { success: boolean; message: string; cost: number };
  equipBorder: (borderId: string) => void;
  voteBorder: (userId: string) => void;

  // Owner Actions (Faiz only)
  createGiveaway: (perOrang: number, jumlahOrang: number, delayMinutes: number) => void;
  createFlashSale: (borderId: string, hargaFlash: number, stok: number, delayMinutes: number) => void;
  createRedeemCode: (code: string, hadiahType: 'coin' | 'border', amountOrBorder: string | number, maxPeople: number) => void;
  createBroadcast: (jenis: Broadcast['jenis'], judul: string, pesan: string, target: Broadcast['target']) => void;
  ownerGiveCoinToUser: (targetUserId: string, amount: number) => void;

  // UI Popups & Toasts
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
  isNonTelegramWarningOpen: boolean;
  setIsNonTelegramWarningOpen: (open: boolean) => void;

  // Dev switcher
  switchDevUser: (mode: 'FAIZ' | 'BIMO' | 'AYU' | 'NONE') => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read / seed profiles
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PROFILES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_USERS;
  });

  // Current active user
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const tgUser = getTelegramUser();
    return tgUser ? String(tgUser.id) : '6189849073';
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'beranda' | 'room' | 'leaderboard' | 'border' | 'profil' | 'owner_panel'>('beranda');

  // Rooms
  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ROOMS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_ROOMS;
  });

  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

  // Chats
  const [chatsMap, setChatsMap] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CHATS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_CHATS;
  });

  // Giveaways
  const [giveaways, setGiveaways] = useState<CoinGiveaway[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_GIVEAWAYS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Default active/upcoming giveaway from Faiz
    return [
      {
        id: 'gw-1',
        dibuat_oleh: '6189849073',
        per_orang: 100,
        jumlah_orang: 50,
        total_coin: 5000,
        mulai_pada: new Date(Date.now() + 4 * 60000 + 59000).toISOString(),
        status: 'upcoming',
        created_at: new Date().toISOString(),
        claims: [],
      },
    ];
  });

  // Flash Sales
  const [flashSales, setFlashSales] = useState<FlashSale[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FLASHSALES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'fs-1',
        border_nama: 'NAGA',
        border_id: 'naga',
        harga_normal: 1000,
        harga_flash: 100,
        stok: 5,
        sisa_stok: 5,
        mulai_pada: new Date(Date.now() + 9 * 60000 + 59000).toISOString(),
        status: 'upcoming',
        created_at: new Date().toISOString(),
        claims: [],
      },
    ];
  });

  // Redeem codes
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_REDEEMS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'rd-1',
        kode: 'FAIZGANTENG',
        hadiah_type: 'coin',
        hadiah_coin: 100,
        max_orang: 100,
        dipakai_count: 14,
        berlaku_sampai: new Date(Date.now() + 30 * 86400000).toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: 'rd-2',
        kode: 'NOBARKUY',
        hadiah_type: 'coin',
        hadiah_coin: 100,
        max_orang: 50,
        dipakai_count: 8,
        berlaku_sampai: new Date(Date.now() + 15 * 86400000).toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: 'rd-3',
        kode: 'NAGAGRATIS',
        hadiah_type: 'border',
        hadiah_border: 'naga',
        max_orang: 20,
        dipakai_count: 4,
        berlaku_sampai: new Date(Date.now() + 7 * 86400000).toISOString(),
        created_at: new Date().toISOString(),
      },
    ];
  });

  // Polls
  const [polls, setPolls] = useState<Record<string, Poll>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_POLLS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      'room-1': {
        id: 'poll-1',
        room_id: 'room-1',
        pertanyaan: 'Habis ini mau nobar apa gais?',
        pilihan: [
          { id: 'opt-1', text: 'Film Horror Lanjutan', votes: 14, voters: [] },
          { id: 'opt-2', text: 'Drakor Romantis', votes: 9, voters: [] },
          { id: 'opt-3', text: 'Anime Komedi', votes: 12, voters: [] },
        ],
        berakhir_pada: new Date(Date.now() + 10 * 60000).toISOString(),
        status: 'active',
        created_at: new Date().toISOString(),
      },
    };
  });

  // Quizzes
  const [quizzes, setQuizzes] = useState<Record<string, Quiz>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_QUIZZES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      'room-1': {
        id: 'quiz-1',
        room_id: 'room-1',
        pertanyaan: 'Siapa nama karakter ibu di Pengabdi Setan?',
        pilihan: ['Mawarni', 'Ayu', 'Rini', 'Sari'],
        jawaban_benar: 'Mawarni',
        status: 'active',
        created_at: new Date().toISOString(),
        answers: [],
      },
    };
  });

  // Broadcasts
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BROADCASTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'bc-1',
        dibuat_oleh: '6189849073',
        jenis: 'banner',
        judul: 'PENGUMUMAN NOBAR',
        pesan: 'Malam ini ada Bagi-bagi Coin 100 Coin x 50 Orang & Flash Sale Border Naga!',
        target: 'all',
        created_at: new Date().toISOString(),
        aktif_sampai: new Date(Date.now() + 86400000).toISOString(),
      },
    ];
  });

  // User Owned Borders (persisted per user)
  const [userBordersMap, setUserBordersMap] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER_BORDERS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      '6189849073': ALL_BORDERS.map((b) => b.id), // Owner has all
      '198471239': ['pemula', 'semangat-nobar', 'rajin-nobar', 'naga'],
      '284719283': ['pemula', 'semangat-nobar', 'galaxy'],
    };
  });

  // Coin History
  const [coinHistory, setCoinHistory] = useState<CoinHistoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'h-1',
        jenis: 'tambah',
        jumlah: 1000,
        keterangan: 'Bonus gabung pertama di NOBAR KUY',
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
  });

  // UI state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferRecipient, setTransferRecipient] = useState<UserProfile | null>(null);
  const [isNonTelegramWarningOpen, setIsNonTelegramWarningOpen] = useState(false);
  const [activeBroadcastPopup, setActiveBroadcastPopup] = useState<Broadcast | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
  }, [profiles]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(rooms));
  }, [rooms]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(chatsMap));
  }, [chatsMap]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GIVEAWAYS, JSON.stringify(giveaways));
  }, [giveaways]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FLASHSALES, JSON.stringify(flashSales));
  }, [flashSales]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_REDEEMS, JSON.stringify(redeemCodes));
  }, [redeemCodes]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_POLLS, JSON.stringify(polls));
  }, [polls]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_QUIZZES, JSON.stringify(quizzes));
  }, [quizzes]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BROADCASTS, JSON.stringify(broadcasts));
  }, [broadcasts]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USER_BORDERS, JSON.stringify(userBordersMap));
  }, [userBordersMap]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(coinHistory));
  }, [coinHistory]);

  // Real-time synchronization bus listener
  useEffect(() => {
    const unsubscribe = subscribeToEvents((type, payload) => {
      if (type === 'GIVEAWAY_UPDATE') {
        setGiveaways((prev) => {
          const updated = payload as CoinGiveaway;
          return prev.map((g) => (g.id === updated.id ? updated : g));
        });
      } else if (type === 'FLASHSALE_UPDATE') {
        setFlashSales((prev) => {
          const updated = payload as FlashSale;
          return prev.map((f) => (f.id === updated.id ? updated : f));
        });
      } else if (type === 'CHAT_MESSAGE') {
        const msg = payload as ChatMessage;
        setChatsMap((prev) => ({
          ...prev,
          [msg.room_id]: [...(prev[msg.room_id] || []), msg],
        }));
      } else if (type === 'BROADCAST_NEW') {
        const bc = payload as Broadcast;
        setBroadcasts((prev) => [bc, ...prev]);
        if (bc.jenis === 'popup') {
          setActiveBroadcastPopup(bc);
        }
      }
    });
    return unsubscribe;
  }, []);

  // Sync / Auto Login from Telegram
  useEffect(() => {
    const tgUser = getTelegramUser();
    if (!tgUser) {
      setIsNonTelegramWarningOpen(true);
      return;
    }

    setIsNonTelegramWarningOpen(false);
    const userIdStr = String(tgUser.id);
    const fullName = `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim() || 'User Nobar';
    const usernameClean = tgUser.username ? `@${tgUser.username}` : `@user${userIdStr.slice(-4)}`;
    const photoClean = tgUser.photo_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${userIdStr}`;

    setProfiles((prev) => {
      const existing = prev.find((p) => p.user_id === userIdStr);
      if (existing) {
        // Update live Telegram data (name, username, photo)
        return prev.map((p) =>
          p.user_id === userIdStr
            ? {
                ...p,
                nama: fullName,
                username: usernameClean.replace('@', ''),
                foto: photoClean,
              }
            : p
        );
      } else {
        // Brand new user auto signup
        const isOwner = userIdStr === '6189849073';
        const newUser: UserProfile = {
          user_id: userIdStr,
          nama: fullName,
          username: usernameClean.replace('@', ''),
          foto: photoClean,
          coin: isOwner ? Infinity : 1000,
          poin: 0,
          border_saat_ini: isOwner ? 'faiz-ganteng' : 'pemula',
          custom_text: isOwner ? 'FAIZ GANTENG' : '',
          total_hiasan_coin: 0,
          checkin_streak: 0,
          checkin_terakhir: null,
          checkin_hari_ke: 1,
          kode_referral: (tgUser.username || `USER${userIdStr.slice(-4)}`).toUpperCase() + '123',
          direferensikan_oleh: null,
          total_nonton: 0,
          streak_nonton: 0,
          terakhir_nonton: null,
          created_at: new Date().toISOString(),
          decorations: {
            bingkai: 'tipis',
            efek: [],
            warna: 'abu',
            sticker: [],
            animasi: 'none',
          },
          votes_count: 0,
        };
        setUserBordersMap((bMap) => ({
          ...bMap,
          [userIdStr]: isOwner ? ALL_BORDERS.map((b) => b.id) : ['pemula'],
        }));
        setToastMessage(`Selamat datang di NOBAR KUY! Nih 1000 Coin buat lu.`);
        return [...prev, newUser];
      }
    });

    setCurrentUserId(userIdStr);
  }, []);

  // Listen to dev simulation changes
  useEffect(() => {
    const handleSimChange = () => {
      const tgUser = getTelegramUser();
      if (!tgUser) {
        setIsNonTelegramWarningOpen(true);
      } else {
        setIsNonTelegramWarningOpen(false);
        setCurrentUserId(String(tgUser.id));
      }
    };
    window.addEventListener('telegram_user_changed', handleSimChange);
    return () => window.removeEventListener('telegram_user_changed', handleSimChange);
  }, []);

  const currentUser = useMemo(() => {
    const found = profiles.find((p) => p.user_id === currentUserId);
    if (found) return found;
    return profiles[0] || INITIAL_USERS[0];
  }, [profiles, currentUserId]);

  const isOwner = useMemo(() => isOwnerUser(currentUser.user_id), [currentUser.user_id]);

  const userOwnedBorders = useMemo(() => {
    if (isOwner) return ALL_BORDERS.map((b) => b.id);
    return userBordersMap[currentUser.user_id] || ['pemula'];
  }, [isOwner, userBordersMap, currentUser.user_id]);

  const setToast = useCallback((msg: string | null) => {
    setToastMessage(msg);
    if (msg) {
      setTimeout(() => setToastMessage(null), 3000);
    }
  }, []);

  // Giveaways & Flash Sales automatic countdown tick
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setGiveaways((prev) =>
        prev.map((g) => {
          if (g.status === 'upcoming' && new Date(g.mulai_pada).getTime() <= now) {
            return { ...g, status: 'active' };
          }
          if (g.status === 'active' && g.claims.length >= g.jumlah_orang) {
            return { ...g, status: 'ended' };
          }
          return g;
        })
      );

      setFlashSales((prev) =>
        prev.map((f) => {
          if (f.status === 'upcoming' && new Date(f.mulai_pada).getTime() <= now) {
            return { ...f, status: 'active' };
          }
          if (f.status === 'active' && f.sisa_stok <= 0) {
            return { ...f, status: 'ended' };
          }
          return f;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Daily missions state
  const dailyMissions: DailyMission[] = useMemo(() => {
    return [
      {
        id: 'm-1',
        judul: 'Nonton 1x sampe selesai',
        hadiahCoin: 10,
        target: 1,
        current: currentUser.total_nonton > 0 ? 1 : 0,
        klaim: false,
      },
      {
        id: 'm-2',
        judul: 'Chat 5x di Room Nobar',
        hadiahCoin: 10,
        target: 5,
        current: Math.min(5, (chatsMap[currentRoom?.id || 'room-1'] || []).filter((c) => c.user_id === currentUser.user_id).length + 2),
        klaim: false,
      },
      {
        id: 'm-3',
        judul: 'Kasih Gift 1x (Gratis)',
        hadiahCoin: 10,
        target: 1,
        current: 1,
        klaim: true,
      },
      {
        id: 'm-4',
        judul: 'Vote Poll 1x di Room',
        hadiahCoin: 5,
        target: 1,
        current: 1,
        klaim: true,
      },
      {
        id: 'm-5',
        judul: 'Transfer Coin ke temen 1x',
        hadiahCoin: 5,
        target: 1,
        current: 0,
        klaim: false,
      },
      {
        id: 'm-6',
        judul: 'Ikut Bagi-bagi Coin 1x',
        hadiahCoin: 5,
        target: 1,
        current: 1,
        klaim: false,
      },
    ];
  }, [currentUser, currentRoom, chatsMap]);

  // Check-In Action
  const checkInToday = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    if (currentUser.checkin_terakhir === today) {
      return { success: false, message: 'Lu udah check-in hari ini! Besok lagi ya.', coinsEarned: 0 };
    }

    // Determine current day sequence
    let newStreak = currentUser.checkin_streak + 1;
    let newDay = (currentUser.checkin_hari_ke % 7) + 1;

    // Check if streak was broken (last checkin more than 1 day ago)
    if (currentUser.checkin_terakhir) {
      const lastDate = new Date(currentUser.checkin_terakhir).getTime();
      const diffDays = Math.round((new Date(today).getTime() - lastDate) / (1000 * 3600 * 24));
      if (diffDays > 1) {
        newStreak = 1;
        newDay = 1;
      }
    }

    const isDay7 = newDay === 7;
    const coinsEarned = isDay7 ? 10 : 0; // Strict: Day 1-6 = 0 Coin, Day 7 = 10 Coin

    setProfiles((prev) =>
      prev.map((p) => {
        if (p.user_id === currentUser.user_id) {
          return {
            ...p,
            checkin_streak: newStreak,
            checkin_hari_ke: newDay,
            checkin_terakhir: today,
            coin: isOwner ? Infinity : p.coin + coinsEarned,
          };
        }
        return p;
      })
    );

    sounds.playTing();
    triggerHaptic('success');

    if (coinsEarned > 0) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#D4AF37', '#FFFFFF', '#EA580C'],
      });
      setCoinHistory((h) => [
        {
          id: `cin-${Date.now()}`,
          jenis: 'tambah',
          jumlah: 10,
          keterangan: 'Hadiah Check-in Hari ke-7',
          created_at: new Date().toISOString(),
        },
        ...h,
      ]);
      setToast('🎉 7 Hari Check-in Berturut-turut! Lu dapet 10 Coin!');
      return { success: true, message: '🎉 7 Hari Check-in Berturut-turut! Lu dapet 10 Coin!', coinsEarned };
    } else {
      const remaining = 7 - newDay;
      const msg = `Check-in hari ke-${newDay} berhasil! Tinggal ${remaining} hari lagi dapet 10 Coin!`;
      setToast(msg);
      return { success: true, message: msg, coinsEarned: 0 };
    }
  }, [currentUser, isOwner, setToast]);

  // Roulette Spin Action
  const spinRoulette = useCallback(() => {
    // 5 outcomes: 10 Coin (40%), 20 Coin (30%), 30 Coin (20%), 50 Coin (8%), Zonk (2%)
    const rand = Math.random() * 100;
    let result = '10 Coin';
    let coinGain = 10;
    let isZonk = false;

    if (rand < 40) {
      result = '10 Coin';
      coinGain = 10;
    } else if (rand < 70) {
      result = '20 Coin';
      coinGain = 20;
    } else if (rand < 90) {
      result = '30 Coin';
      coinGain = 30;
    } else if (rand < 98) {
      result = '50 Coin';
      coinGain = 50;
    } else {
      result = 'ZONK';
      coinGain = 0;
      isZonk = true;
    }

    if (!isZonk && !isOwner) {
      setProfiles((prev) =>
        prev.map((p) => (p.user_id === currentUser.user_id ? { ...p, coin: p.coin + coinGain } : p))
      );
      setCoinHistory((h) => [
        {
          id: `rou-${Date.now()}`,
          jenis: 'tambah',
          jumlah: coinGain,
          keterangan: `Menang Roulette ${result}`,
          created_at: new Date().toISOString(),
        },
        ...h,
      ]);
    }

    if (coinGain >= 50) {
      confetti({
        particleCount: 60,
        spread: 70,
        colors: ['#D4AF37', '#FFFFFF'],
      });
      sounds.playWin();
    } else if (!isZonk) {
      sounds.playTing();
    }

    triggerHaptic(isZonk ? 'warning' : 'success');
    return { result, coinGain, isZonk, freeSpin: true };
  }, [currentUser, isOwner]);

  // Claim Mission
  const claimMission = useCallback((missionId: string) => {
    const mission = dailyMissions.find((m) => m.id === missionId);
    if (!mission) return;

    if (!isOwner) {
      setProfiles((prev) =>
        prev.map((p) => (p.user_id === currentUser.user_id ? { ...p, coin: p.coin + mission.hadiahCoin } : p))
      );
      setCoinHistory((h) => [
        {
          id: `mis-${Date.now()}`,
          jenis: 'tambah',
          jumlah: mission.hadiahCoin,
          keterangan: `Klaim Misi: ${mission.judul}`,
          created_at: new Date().toISOString(),
        },
        ...h,
      ]);
    }
    sounds.playTing();
    setToast(`+${mission.hadiahCoin} Coin dari misi! Gas terus.`);
  }, [dailyMissions, currentUser.user_id, isOwner, setToast]);

  // Transfer Coin
  const transferCoin = useCallback((toUserId: string, amount: number, note?: string) => {
    if (toUserId === currentUser.user_id) {
      return { success: false, message: 'Lu ga bisa transfer ke diri sendiri bro!' };
    }
    if (amount < 10) {
      return { success: false, message: 'Minimal transfer 10 Coin ya!' };
    }
    if (!isOwner && amount > 1000) {
      return { success: false, message: 'Maksimal transfer 1000 Coin per hari!' };
    }
    if (!isOwner && currentUser.coin < amount) {
      return { success: false, message: 'Coin lu kurang!' };
    }

    const recipient = profiles.find((p) => p.user_id === toUserId);
    if (!recipient) {
      return { success: false, message: 'Penerima ga ketemu!' };
    }

    // Deduct sender, add recipient
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.user_id === currentUser.user_id) {
          return { ...p, coin: isOwner ? Infinity : p.coin - amount };
        }
        if (p.user_id === toUserId) {
          return { ...p, coin: isOwnerUser(toUserId) ? Infinity : p.coin + amount };
        }
        return p;
      })
    );

    // Record history
    setCoinHistory((h) => [
      {
        id: `tr-${Date.now()}`,
        jenis: 'kurang',
        jumlah: amount,
        keterangan: `Transfer ke ${recipient.nama} (${recipient.username})`,
        created_at: new Date().toISOString(),
      },
      ...h,
    ]);

    // Send announcement to current room if live
    if (currentRoom) {
      const transferMsg: ChatMessage = {
        id: `tc-${Date.now()}`,
        room_id: currentRoom.id,
        user_id: currentUser.user_id,
        nama: currentUser.nama,
        username: currentUser.username,
        foto: currentUser.foto,
        border: currentUser.border_saat_ini,
        custom_text: currentUser.custom_text,
        pesan: `🎉 ${currentUser.nama} ngirim ${amount} Coin ke ${recipient.nama}! ${note ? `(${note})` : ''}`,
        is_system: true,
        created_at: new Date().toISOString(),
      };
      setChatsMap((prev) => ({
        ...prev,
        [currentRoom.id]: [...(prev[currentRoom.id] || []), transferMsg],
      }));
      broadcastLocalEvent('CHAT_MESSAGE', transferMsg);
    }

    sounds.playTing();
    triggerHaptic('success');
    setToast(`Berhasil transfer ${amount} Coin ke ${recipient.nama}!`);
    return { success: true, message: `Berhasil kirim ${amount} Coin!` };
  }, [currentUser, isOwner, profiles, currentRoom, setToast]);

  // Claim Giveaway
  const claimGiveaway = useCallback((giveawayId: string) => {
    const gw = giveaways.find((g) => g.id === giveawayId);
    if (!gw) return { success: false, message: 'Bagi-bagi ga ketemu!', amount: 0 };

    if (gw.status === 'upcoming') {
      return { success: false, message: 'Bagi-bagi belum dimulai!', amount: 0 };
    }
    if (gw.status === 'ended' || gw.claims.length >= gw.jumlah_orang) {
      return { success: false, message: 'Yah, kehabisan! Lu telat dikit.', amount: 0 };
    }
    if (gw.claims.some((c) => c.user_id === currentUser.user_id)) {
      return { success: false, message: 'Lu udah ambil bagian lu dari bagi-bagi ini!', amount: 0 };
    }

    const newClaim = {
      user_id: currentUser.user_id,
      nama: currentUser.nama,
      username: currentUser.username,
      jumlah: gw.per_orang,
      created_at: new Date().toISOString(),
    };

    const updatedGw: CoinGiveaway = {
      ...gw,
      claims: [...gw.claims, newClaim],
      status: gw.claims.length + 1 >= gw.jumlah_orang ? 'ended' : 'active',
    };

    setGiveaways((prev) => prev.map((g) => (g.id === giveawayId ? updatedGw : g)));
    broadcastLocalEvent('GIVEAWAY_UPDATE', updatedGw);

    if (!isOwner) {
      setProfiles((prev) =>
        prev.map((p) => (p.user_id === currentUser.user_id ? { ...p, coin: p.coin + gw.per_orang } : p))
      );
      setCoinHistory((h) => [
        {
          id: `gw-${Date.now()}`,
          jenis: 'tambah',
          jumlah: gw.per_orang,
          keterangan: 'Klaim Bagi-bagi Coin Gratis dari Faiz',
          created_at: new Date().toISOString(),
        },
        ...h,
      ]);
    }

    sounds.playTing();
    confetti({
      particleCount: 45,
      spread: 55,
      colors: ['#D4AF37', '#F5F5F4'],
    });
    triggerHaptic('success');
    setToast(`🎉 Lu dapet ${gw.per_orang} Coin Gratis dari Faiz!`);
    return { success: true, message: `🎉 Lu dapet ${gw.per_orang} Coin Gratis dari Faiz!`, amount: gw.per_orang };
  }, [giveaways, currentUser, isOwner, setToast]);

  // Buy Flash Sale
  const buyFlashSale = useCallback((flashSaleId: string) => {
    const fs = flashSales.find((f) => f.id === flashSaleId);
    if (!fs) return { success: false, message: 'Flash sale ga ketemu!' };
    if (fs.status !== 'active' || fs.sisa_stok <= 0) {
      return { success: false, message: 'Flash Sale udah abis!' };
    }
    if (!isOwner && currentUser.coin < fs.harga_flash) {
      return { success: false, message: `Coin lu kurang! Coin lu ${currentUser.coin}, butuh ${fs.harga_flash}. Nonton dulu buat dapetin Coin!` };
    }

    const updatedFs: FlashSale = {
      ...fs,
      sisa_stok: fs.sisa_stok - 1,
      status: fs.sisa_stok - 1 <= 0 ? 'ended' : 'active',
      claims: [...fs.claims, { user_id: currentUser.user_id, nama: currentUser.nama, created_at: new Date().toISOString() }],
    };

    setFlashSales((prev) => prev.map((f) => (f.id === flashSaleId ? updatedFs : f)));
    broadcastLocalEvent('FLASHSALE_UPDATE', updatedFs);

    // Add to user owned borders
    setUserBordersMap((bMap) => ({
      ...bMap,
      [currentUser.user_id]: Array.from(new Set([...(bMap[currentUser.user_id] || ['pemula']), fs.border_id])),
    }));

    if (!isOwner) {
      setProfiles((prev) =>
        prev.map((p) =>
          p.user_id === currentUser.user_id
            ? { ...p, coin: p.coin - fs.harga_flash, border_saat_ini: fs.border_id }
            : p
        )
      );
      setCoinHistory((h) => [
        {
          id: `fs-${Date.now()}`,
          jenis: 'kurang',
          jumlah: fs.harga_flash,
          keterangan: `Beli Flash Sale Border ${fs.border_nama}`,
          created_at: new Date().toISOString(),
        },
        ...h,
      ]);
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.user_id === currentUser.user_id ? { ...p, border_saat_ini: fs.border_id } : p))
      );
    }

    confetti({
      particleCount: 50,
      spread: 60,
      colors: ['#D4AF37', '#EA580C'],
    });
    sounds.playWin();
    triggerHaptic('success');
    const hemat = fs.harga_normal - fs.harga_flash;
    const msg = `🎉 Lu dapet Border ${fs.border_nama} cuma ${fs.harga_flash} Coin! Hemat ${hemat} Coin!`;
    setToast(msg);
    return { success: true, message: msg };
  }, [flashSales, currentUser, isOwner, setToast]);

  // Buy Shop Border
  const buyShopBorder = useCallback((borderId: string) => {
    const borderDef = ALL_BORDERS.find((b) => b.id === borderId);
    if (!borderDef || !borderDef.hargaCoin) {
      return { success: false, message: 'Border ga valid!' };
    }
    const currentOwned = userBordersMap[currentUser.user_id] || ['pemula'];
    if (currentOwned.includes(borderId)) {
      return { success: false, message: 'Lu udah punya border ini bro!' };
    }
    if (!isOwner && currentUser.coin < borderDef.hargaCoin) {
      return { success: false, message: `Coin lu kurang! Butuh ${borderDef.hargaCoin} Coin.` };
    }

    setUserBordersMap((bMap) => ({
      ...bMap,
      [currentUser.user_id]: [...(bMap[currentUser.user_id] || ['pemula']), borderId],
    }));

    if (!isOwner) {
      setProfiles((prev) =>
        prev.map((p) =>
          p.user_id === currentUser.user_id
            ? { ...p, coin: p.coin - borderDef.hargaCoin!, border_saat_ini: borderId }
            : p
        )
      );
      setCoinHistory((h) => [
        {
          id: `shp-${Date.now()}`,
          jenis: 'kurang',
          jumlah: borderDef.hargaCoin!,
          keterangan: `Beli Toko Border ${borderDef.nama}`,
          created_at: new Date().toISOString(),
        },
        ...h,
      ]);
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.user_id === currentUser.user_id ? { ...p, border_saat_ini: borderId } : p))
      );
    }

    sounds.playWin();
    confetti({ particleCount: 40, colors: ['#D4AF37', '#1E3A8A'] });
    setToast(`Border ${borderDef.nama} berhasil dibeli dan dipake!`);
    return { success: true, message: 'Border kebeli!' };
  }, [currentUser, isOwner, userBordersMap, setToast]);

  // Redeem Code
  const redeemCode = useCallback((inputCode: string) => {
    const codeClean = inputCode.trim().toUpperCase();
    const found = redeemCodes.find((r) => r.kode.toUpperCase() === codeClean);
    if (!found) {
      return { success: false, message: 'Kode salah / udah abis / udah pernah lu redeem!' };
    }
    if (found.dipakai_count >= found.max_orang) {
      return { success: false, message: 'Kode ini udah abis kuotanya bro!' };
    }

    setRedeemCodes((prev) =>
      prev.map((r) => (r.id === found.id ? { ...r, dipakai_count: r.dipakai_count + 1 } : r))
    );

    if (found.hadiah_type === 'coin' && found.hadiah_coin) {
      if (!isOwner) {
        setProfiles((prev) =>
          prev.map((p) => (p.user_id === currentUser.user_id ? { ...p, coin: p.coin + found.hadiah_coin! } : p))
        );
        setCoinHistory((h) => [
          {
            id: `rdm-${Date.now()}`,
            jenis: 'tambah',
            jumlah: found.hadiah_coin!,
            keterangan: `Redeem Kode: ${found.kode}`,
            created_at: new Date().toISOString(),
          },
          ...h,
        ]);
      }
      sounds.playTing();
      confetti({ particleCount: 50, colors: ['#D4AF37'] });
      setToast(`🎉 Kode Berhasil! Lu dapet ${found.hadiah_coin} Coin!`);
      return { success: true, message: `🎉 Kode Berhasil! Lu dapet ${found.hadiah_coin} Coin!` };
    } else if (found.hadiah_type === 'border' && found.hadiah_border) {
      setUserBordersMap((bMap) => ({
        ...bMap,
        [currentUser.user_id]: Array.from(new Set([...(bMap[currentUser.user_id] || ['pemula']), found.hadiah_border!])),
      }));
      sounds.playWin();
      setToast(`🎉 Lu dapet Border ${found.hadiah_border.toUpperCase()} Gratis!`);
      return { success: true, message: `🎉 Lu dapet Border ${found.hadiah_border.toUpperCase()} Gratis!` };
    }

    return { success: false, message: 'Kode ga valid!' };
  }, [redeemCodes, currentUser, isOwner, setToast]);

  // Equip Border
  const equipBorder = useCallback((borderId: string) => {
    setProfiles((prev) =>
      prev.map((p) => (p.user_id === currentUser.user_id ? { ...p, border_saat_ini: borderId } : p))
    );
    triggerHaptic('light');
    setToast('Border lu udah diganti!');
  }, [currentUser.user_id, setToast]);

  // Vote Border in Leaderboard
  const voteBorder = useCallback((targetUserId: string) => {
    setProfiles((prev) =>
      prev.map((p) => (p.user_id === targetUserId ? { ...p, votes_count: p.votes_count + 1 } : p))
    );
    sounds.playTing();
    triggerHaptic('success');
    setToast('Vote lu berhasil masuk!');
  }, [setToast]);

  // Update Border Decorations
  const updateBorderDecorations = useCallback((decorations: UserProfile['decorations'], customText?: string) => {
    // If border is 'pemula', decoration is locked
    if (currentUser.border_saat_ini === 'pemula') {
      return { success: false, message: 'Border Pemula ga bisa dihias. Nonton 3 hari buat buka!', cost: 0 };
    }

    let cost = 0;
    // Calculate cost based on prices (all items >= 100 Coin)
    if (decorations.bingkai !== 'tipis') {
      const opt = DECORATION_OPTIONS.bingkai.find((b) => b.id === decorations.bingkai);
      cost += opt?.harga || 150;
    }
    if (decorations.warna !== 'abu') {
      cost += 100;
    }
    if (decorations.animasi !== 'none') {
      const opt = DECORATION_OPTIONS.animasi.find((a) => a.id === decorations.animasi);
      cost += opt?.harga || 100;
    }
    decorations.efek.forEach((e) => {
      if (e !== 'none') {
        const opt = DECORATION_OPTIONS.efek.find((item) => item.id === e);
        cost += opt?.harga || 100;
      }
    });
    decorations.sticker.forEach((s) => {
      if (s !== 'none') cost += 100;
    });
    if (customText && customText !== currentUser.custom_text) {
      cost += 100;
    }

    // Faiz is completely FREE
    if (isOwner) {
      cost = 0;
    }

    if (!isOwner && currentUser.coin < cost) {
      return { success: false, message: `Coin lu kurang! Butuh ${cost} Coin. Nonton dulu buat dapet Coin!`, cost };
    }

    // Filter profanity / inappropriate words
    const cleanText = (customText || currentUser.custom_text).trim().toUpperCase();

    setProfiles((prev) =>
      prev.map((p) => {
        if (p.user_id === currentUser.user_id) {
          return {
            ...p,
            coin: isOwner ? Infinity : p.coin - cost,
            total_hiasan_coin: p.total_hiasan_coin + cost,
            decorations,
            custom_text: cleanText,
          };
        }
        return p;
      })
    );

    if (cost > 0) {
      setCoinHistory((h) => [
        {
          id: `dec-${Date.now()}`,
          jenis: 'kurang',
          jumlah: cost,
          keterangan: 'Hias & Pasang Efek Border',
          created_at: new Date().toISOString(),
        },
        ...h,
      ]);
    }

    sounds.playTing();
    triggerHaptic('success');
    setToast('Gas, border lu udah kece abis!');
    return { success: true, message: 'Border berhasil dihias!', cost };
  }, [currentUser, isOwner, setToast]);

  // Mark all chats in a room as read by current user
  const markRoomChatsAsRead = useCallback((roomId: string) => {
    setChatsMap((prev) => {
      const list = prev[roomId];
      if (!list || list.length === 0) return prev;
      let hasChange = false;
      const updated = list.map((msg) => {
        const alreadyRead = msg.read_by?.some((r) => r.user_id === currentUser.user_id);
        if (alreadyRead) return msg;
        hasChange = true;
        const myEntry = {
          user_id: currentUser.user_id,
          nama: currentUser.nama,
          username: currentUser.username,
          foto: currentUser.foto,
          border: currentUser.border_saat_ini,
          read_at: new Date().toISOString(),
        };
        return {
          ...msg,
          read_by: [...(msg.read_by || []), myEntry],
        };
      });
      if (!hasChange) return prev;
      return { ...prev, [roomId]: updated };
    });
  }, [currentUser]);

  // Join Room by Room ID
  const joinRoom = useCallback((roomId: string, inputCode?: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return { success: false, message: 'Room ga ketemu!' };

    if (room.is_private) {
      const isHost = room.host_id === currentUser.user_id;
      if (!isHost && (!inputCode || inputCode.trim() !== room.code_room)) {
        return { success: false, message: 'Code Room salah bro! Masukin 6 digit yang bener.' };
      }
    }

    setCurrentRoom(room);
    setActiveTab('room');
    markRoomChatsAsRead(room.id);
    return { success: true, message: 'Berhasil masuk room!' };
  }, [rooms, currentUser.user_id, markRoomChatsAsRead]);

  // Join Room by 6-digit Code (for Private / any room)
  const joinRoomByCode = useCallback((inputCode: string) => {
    const cleanCode = inputCode.trim();
    if (!cleanCode) {
      return { success: false, message: 'Masukin 6 digit Code Room dulu bro!' };
    }
    const found = rooms.find((r) => r.code_room === cleanCode);
    if (!found) {
      return { success: false, message: `Room dengan code "${cleanCode}" ga ketemu!` };
    }
    setCurrentRoom(found);
    setActiveTab('room');
    markRoomChatsAsRead(found.id);
    setToast(`Berhasil masuk ke room "${found.judul}"!`);
    return { success: true, message: 'Berhasil masuk room!', room: found };
  }, [rooms, markRoomChatsAsRead, setToast]);

  const leaveRoom = useCallback(() => {
    setCurrentRoom(null);
    setActiveTab('beranda');
  }, []);

  // Create Room
  const createRoom = useCallback((data: { judul: string; genre: Room['genre']; is_private: boolean; video_url?: string }) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      judul: data.judul,
      host_id: currentUser.user_id,
      host_nama: currentUser.nama,
      host_username: currentUser.username,
      host_foto: currentUser.foto,
      host_border: currentUser.border_saat_ini,
      host_custom_text: currentUser.custom_text,
      genre: data.genre,
      is_private: data.is_private,
      code_room: code,
      video_url: data.video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      status: 'live',
      penonton_count: 1,
      chats_count: 0,
      created_at: new Date().toISOString(),
    };

    setRooms((prev) => [newRoom, ...prev]);
    setCurrentRoom(newRoom);
    setActiveTab('room');
    setToast(data.is_private ? `Room Private dibuat! Code Room lu: ${code}` : `Room "${newRoom.judul}" udah dibuat!`);
    return newRoom;
  }, [currentUser, setToast]);

  // Send Chat Message with Read Receipts
  const sendChatMessage = useCallback((pesan: string) => {
    if (!currentRoom || !pesan.trim()) return;
    const newMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      room_id: currentRoom.id,
      user_id: currentUser.user_id,
      nama: currentUser.nama,
      username: currentUser.username,
      foto: currentUser.foto,
      border: currentUser.border_saat_ini,
      custom_text: currentUser.custom_text,
      pesan: pesan.trim(),
      is_host: currentRoom.host_id === currentUser.user_id,
      is_owner: isOwner,
      read_by: [
        {
          user_id: currentUser.user_id,
          nama: currentUser.nama,
          username: currentUser.username,
          foto: currentUser.foto,
          border: currentUser.border_saat_ini,
          read_at: new Date().toISOString(),
        },
      ],
      created_at: new Date().toISOString(),
    };

    const roomId = currentRoom.id;
    setChatsMap((prev) => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), newMsg],
    }));

    broadcastLocalEvent('CHAT_MESSAGE', newMsg);
    triggerHaptic('light');

    // Simulate other viewers in room reading the chat within 1.2s
    setTimeout(() => {
      setChatsMap((prev) => {
        const roomList = prev[roomId];
        if (!roomList) return prev;
        const target = roomList.find((m) => m.id === newMsg.id);
        if (!target) return prev;

        const otherViewers = profiles
          .filter((u: UserProfile) => u.user_id !== currentUser.user_id)
          .slice(0, 2)
          .map((u: UserProfile) => ({
            user_id: u.user_id,
            nama: u.nama,
            username: u.username,
            foto: u.foto,
            border: u.border_saat_ini,
            read_at: new Date().toISOString(),
          }));

        const withReaders: ChatMessage = {
          ...target,
          read_by: [...(target.read_by || []), ...otherViewers],
        };

        return {
          ...prev,
          [roomId]: roomList.map((m) => (m.id === newMsg.id ? withReaders : m)),
        };
      });
    }, 1200);
  }, [currentRoom, currentUser, isOwner, profiles]);

  // Send Free Gift
  const sendFreeGift = useCallback((giftName: string) => {
    if (!currentRoom) return;
    const isBig = giftName.includes('Mahkota');

    const giftMsg: ChatMessage = {
      id: `gift-${Date.now()}`,
      room_id: currentRoom.id,
      user_id: currentUser.user_id,
      nama: currentUser.nama,
      username: currentUser.username,
      foto: currentUser.foto,
      border: currentUser.border_saat_ini,
      custom_text: currentUser.custom_text,
      pesan: isBig
        ? `${currentUser.nama} nyawer ${giftName} ke Host ${currentRoom.host_nama}! Gila!`
        : `${currentUser.nama} nyawer ${giftName} ke Host ${currentRoom.host_nama}!`,
      is_gift: true,
      gift_nama: giftName,
      created_at: new Date().toISOString(),
    };

    setChatsMap((prev) => ({
      ...prev,
      [currentRoom.id]: [...(prev[currentRoom.id] || []), giftMsg],
    }));

    broadcastLocalEvent('CHAT_MESSAGE', giftMsg);
    sounds.playTing();
    triggerHaptic('success');
  }, [currentRoom, currentUser]);

  // Polls & Quizzes
  const createPoll = useCallback((pertanyaan: string, pilihanText: string[]) => {
    if (!currentRoom) return;
    const newPoll: Poll = {
      id: `poll-${Date.now()}`,
      room_id: currentRoom.id,
      pertanyaan,
      pilihan: pilihanText.map((t, idx) => ({ id: `opt-${idx}`, text: t, votes: 0, voters: [] })),
      berakhir_pada: new Date(Date.now() + 5 * 60000).toISOString(),
      status: 'active',
      created_at: new Date().toISOString(),
    };
    setPolls((prev) => ({ ...prev, [currentRoom.id]: newPoll }));
    setToast('Poll berhasil dibuat!');
  }, [currentRoom, setToast]);

  const votePoll = useCallback((optionId: string) => {
    if (!currentRoom) return;
    const poll = polls[currentRoom.id];
    if (!poll || poll.status !== 'active') return;

    // Check if already voted
    const alreadyVoted = poll.pilihan.some((p) => p.voters.includes(currentUser.user_id));
    if (alreadyVoted) {
      setToast('Lu udah vote di poll ini!');
      return;
    }

    const updatedPoll: Poll = {
      ...poll,
      pilihan: poll.pilihan.map((p) =>
        p.id === optionId ? { ...p, votes: p.votes + 1, voters: [...p.voters, currentUser.user_id] } : p
      ),
    };
    setPolls((prev) => ({ ...prev, [currentRoom.id]: updatedPoll }));
    sounds.playTing();
    setToast('Vote lu udah diitung!');
  }, [currentRoom, polls, currentUser.user_id, setToast]);

  const createQuiz = useCallback((pertanyaan: string, pilihan: string[], jawabanBenar: string) => {
    if (!currentRoom) return;
    const newQuiz: Quiz = {
      id: `quiz-${Date.now()}`,
      room_id: currentRoom.id,
      pertanyaan,
      pilihan,
      jawaban_benar: jawabanBenar,
      status: 'active',
      created_at: new Date().toISOString(),
      answers: [],
    };
    setQuizzes((prev) => ({ ...prev, [currentRoom.id]: newQuiz }));
    setToast('Quiz berhasil dimulai!');
  }, [currentRoom, setToast]);

  const answerQuiz = useCallback((jawaban: string) => {
    if (!currentRoom) return;
    const quiz = quizzes[currentRoom.id];
    if (!quiz || quiz.status !== 'active') return;

    const answered = quiz.answers.some((a) => a.user_id === currentUser.user_id);
    if (answered) {
      setToast('Lu udah jawab quiz ini!');
      return;
    }

    const benar = jawaban === quiz.jawaban_benar;
    const updatedQuiz: Quiz = {
      ...quiz,
      answers: [...quiz.answers, { user_id: currentUser.user_id, jawaban, benar }],
    };
    setQuizzes((prev) => ({ ...prev, [currentRoom.id]: updatedQuiz }));

    if (benar) {
      sounds.playWin();
      confetti({ particleCount: 35, colors: ['#D4AF37', '#15803D'] });
      if (!isOwner) {
        setProfiles((prev) =>
          prev.map((p) => (p.user_id === currentUser.user_id ? { ...p, coin: p.coin + 10, poin: p.poin + 10 } : p))
        );
        setCoinHistory((h) => [
          {
            id: `q-${Date.now()}`,
            jenis: 'tambah',
            jumlah: 10,
            keterangan: 'Jawaban Quiz Benar',
            created_at: new Date().toISOString(),
          },
          ...h,
        ]);
      }
      setToast('🎉 Jawaban lu bener! Dapet +10 Coin & +10 Poin!');
    } else {
      triggerHaptic('warning');
      setToast('Jawaban lu salah! Tetep semangat.');
    }
  }, [currentRoom, quizzes, currentUser.user_id, isOwner, setToast]);

  const changeRoomCode = useCallback((roomId: string, newCode: string) => {
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, code_room: newCode } : r)));
    if (currentRoom?.id === roomId) {
      setCurrentRoom((r) => (r ? { ...r, code_room: newCode } : null));
    }
    setToast(`Code Room diganti jadi: ${newCode}`);
  }, [currentRoom?.id, setToast]);

  const changeRoomVideo = useCallback((roomId: string, newVideoUrl: string) => {
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, video_url: newVideoUrl } : r)));
    if (currentRoom?.id === roomId) {
      setCurrentRoom((r) => (r ? { ...r, video_url: newVideoUrl } : null));
    }
    setToast('Film / Video room berhasil diganti!');
  }, [currentRoom?.id, setToast]);

  // Owner Actions
  const createGiveaway = useCallback((perOrang: number, jumlahOrang: number, delayMinutes: number) => {
    const startTime = new Date(Date.now() + delayMinutes * 60000).toISOString();
    const newGw: CoinGiveaway = {
      id: `gw-${Date.now()}`,
      dibuat_oleh: '6189849073',
      per_orang: perOrang,
      jumlah_orang: jumlahOrang,
      total_coin: perOrang * jumlahOrang,
      mulai_pada: startTime,
      status: delayMinutes <= 0 ? 'active' : 'upcoming',
      created_at: new Date().toISOString(),
      claims: [],
    };
    setGiveaways((prev) => [newGw, ...prev]);
    broadcastLocalEvent('GIVEAWAY_UPDATE', newGw);
    setToast(`Bagi-bagi ${perOrang} Coin x ${jumlahOrang} orang dibuat!`);
  }, [setToast]);

  const createFlashSale = useCallback((borderId: string, hargaFlash: number, stok: number, delayMinutes: number) => {
    const borderDef = ALL_BORDERS.find((b) => b.id === borderId);
    const borderNama = borderDef ? borderDef.nama : borderId.toUpperCase();
    const hargaNormal = borderDef?.hargaCoin || 1000;
    const startTime = new Date(Date.now() + delayMinutes * 60000).toISOString();

    const newFs: FlashSale = {
      id: `fs-${Date.now()}`,
      border_nama: borderNama,
      border_id: borderId,
      harga_normal: hargaNormal,
      harga_flash: hargaFlash,
      stok,
      sisa_stok: stok,
      mulai_pada: startTime,
      status: delayMinutes <= 0 ? 'active' : 'upcoming',
      created_at: new Date().toISOString(),
      claims: [],
    };
    setFlashSales((prev) => [newFs, ...prev]);
    broadcastLocalEvent('FLASHSALE_UPDATE', newFs);
    setToast(`Flash Sale Border ${borderNama} dibuat!`);
  }, [setToast]);

  const createRedeemCode = useCallback((code: string, hadiahType: 'coin' | 'border', amountOrBorder: string | number, maxPeople: number) => {
    const newCode: RedeemCode = {
      id: `rd-${Date.now()}`,
      kode: code.toUpperCase().trim(),
      hadiah_type: hadiahType,
      hadiah_coin: hadiahType === 'coin' ? Number(amountOrBorder) : undefined,
      hadiah_border: hadiahType === 'border' ? String(amountOrBorder) : undefined,
      max_orang: maxPeople,
      dipakai_count: 0,
      berlaku_sampai: new Date(Date.now() + 30 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
    };
    setRedeemCodes((prev) => [newCode, ...prev]);
    setToast(`Kode Redeem ${newCode.kode} berhasil dibuat!`);
  }, [setToast]);

  const createBroadcast = useCallback((jenis: Broadcast['jenis'], judul: string, pesan: string, target: Broadcast['target']) => {
    const newBc: Broadcast = {
      id: `bc-${Date.now()}`,
      dibuat_oleh: '6189849073',
      jenis,
      judul,
      pesan,
      target,
      created_at: new Date().toISOString(),
      aktif_sampai: new Date(Date.now() + 24 * 3600000).toISOString(),
    };
    setBroadcasts((prev) => [newBc, ...prev]);
    broadcastLocalEvent('BROADCAST_NEW', newBc);

    if (jenis === 'popup') {
      setActiveBroadcastPopup(newBc);
    } else if (jenis === 'chat') {
      // Broadcast chat into all active rooms
      rooms.forEach((r) => {
        const ownerMsg: ChatMessage = {
          id: `owner-bc-${Date.now()}-${r.id}`,
          room_id: r.id,
          user_id: '6189849073',
          nama: 'Faiz',
          username: 'istamina',
          foto: SIMULATED_USERS.FAIZ_OWNER.photo_url,
          border: 'faiz-ganteng',
          custom_text: 'FAIZ GANTENG',
          pesan: `👑 OWNER Faiz: ${pesan}`,
          is_owner: true,
          is_broadcast: true,
          created_at: new Date().toISOString(),
        };
        setChatsMap((prev) => ({
          ...prev,
          [r.id]: [...(prev[r.id] || []), ownerMsg],
        }));
      });
    }

    setToast(`Broadcast ${jenis.toUpperCase()} berhasil dikirim!`);
  }, [rooms, setToast]);

  const ownerGiveCoinToUser = useCallback((targetUserId: string, amount: number) => {
    setProfiles((prev) =>
      prev.map((p) => (p.user_id === targetUserId ? { ...p, coin: p.coin + amount } : p))
    );
    setToast(`Berhasil kasih +${amount} Coin ke user!`);
  }, [setToast]);

  const dismissBroadcastPopup = useCallback(() => {
    setActiveBroadcastPopup(null);
  }, []);

  const switchDevUser = useCallback((mode: 'FAIZ' | 'BIMO' | 'AYU' | 'NONE') => {
    setDevUserSimulation(mode);
  }, []);

  const activePoll = useMemo(() => {
    if (!currentRoom) return null;
    return polls[currentRoom.id] || null;
  }, [currentRoom, polls]);

  const activeQuiz = useMemo(() => {
    if (!currentRoom) return null;
    return quizzes[currentRoom.id] || null;
  }, [currentRoom, quizzes]);

  const chats = useMemo(() => {
    if (!currentRoom) return [];
    return chatsMap[currentRoom.id] || [];
  }, [currentRoom, chatsMap]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        allUsers: profiles,
        isOwner,
        activeTab,
        setActiveTab,
        currentRoom,
        setCurrentRoom,
        rooms,
        chats,
        giveaways,
        flashSales,
        activePoll,
        activeQuiz,
        broadcasts,
        dailyMissions,
        coinHistory,
        userOwnedBorders,

        joinRoom,
        joinRoomByCode,
        markRoomChatsAsRead,
        leaveRoom,
        createRoom,
        sendChatMessage,
        sendFreeGift,
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

        createGiveaway,
        createFlashSale,
        createRedeemCode,
        createBroadcast,
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
        isNonTelegramWarningOpen,
        setIsNonTelegramWarningOpen,

        switchDevUser,
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
