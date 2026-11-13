import 'dotenv/config';
import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), '.nobarkuy_db.json');

interface BorderDecorations {
  bingkai: string;
  efek: string[];
  warna: string;
  sticker: string[];
  animasi: string;
}

interface UserProfile {
  user_id: string;
  nama: string;
  username: string;
  foto: string;
  coin: number;
  poin: number;
  border_saat_ini: string;
  custom_text: string;
  total_hiasan_coin: number;
  checkin_terakhir: string | null;
  checkin_hari_ke: number;
  checkin_total: number;
  total_nonton: number;
  terakhir_nonton: string | null;
  created_at: string;
  decorations: BorderDecorations;
  votes_count: number;
  is_banned?: boolean;
}

interface Room {
  id: string;
  judul: string;
  host_id: string;
  host_nama: string;
  host_username: string;
  host_foto: string;
  host_border: string;
  host_custom_text?: string;
  genre: string;
  is_private: boolean;
  code_room: string;
  video_url: string;
  max_viewers: number;
  viewers: string[];
  status: 'live' | 'selesai';
  penonton_count: number;
  chats_count: number;
  created_at: string;
}

interface ChatReadReceipt {
  user_id: string;
  nama: string;
  username: string;
  foto: string;
  border: string;
  read_at: string;
}

interface ChatReactionUser {
  user_id: string;
  nama: string;
}

interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  nama: string;
  username: string;
  foto: string;
  border: string;
  custom_text?: string;
  decorations?: BorderDecorations;
  pesan: string;
  reply_to?: {
    id: string;
    user_id: string;
    nama: string;
    pesan: string;
  };
  reactions?: Record<string, ChatReactionUser[]>;
  read_by?: ChatReadReceipt[];
  is_gift?: boolean;
  gift_id?: string;
  gift_nama?: string;
  gift_harga?: number;
  is_host?: boolean;
  is_owner?: boolean;
  is_system?: boolean;
  is_broadcast?: boolean;
  created_at: string;
}

interface CoinGiveaway {
  id: string;
  dibuat_oleh: string;
  per_orang: number;
  jumlah_orang: number;
  total_coin: number;
  mulai_pada: string;
  selesai_pada: string;
  status: 'upcoming' | 'active' | 'ended';
  is_active: boolean;
  created_at: string;
  claims: {
    user_id: string;
    nama: string;
    username: string;
    jumlah: number;
    created_at: string;
  }[];
}

interface FlashSale {
  id: string;
  border_nama: string;
  border_id: string;
  harga_normal: number;
  harga_flash: number;
  stok: number;
  sisa_stok: number;
  mulai_pada: string;
  selesai_pada: string;
  status: 'upcoming' | 'active' | 'ended';
  is_active: boolean;
  created_at: string;
  claims: {
    user_id: string;
    nama: string;
    username?: string;
    created_at: string;
  }[];
}

interface RedeemCode {
  id: string;
  kode: string;
  hadiah_type: 'coin' | 'border';
  hadiah_coin?: number;
  hadiah_border?: string;
  max_orang: number;
  dipakai_count: number;
  mulai_pada: string;
  selesai_pada: string;
  is_published: boolean;
  claimed_by: string[];
  claims?: {
    user_id: string;
    nama: string;
    username: string;
    reward_text: string;
    created_at: string;
  }[];
  created_at: string;
}

interface RouletteWinner {
  id: string;
  user_id: string;
  nama: string;
  username: string;
  foto: string;
  border: string;
  jumlah: number;
  created_at: string;
}

interface Broadcast {
  id: string;
  dibuat_oleh: string;
  jenis: 'popup' | 'banner' | 'chat' | 'notif';
  judul: string;
  pesan: string;
  target: 'all' | 'online' | 'in_room' | 'top_10' | 'not_checked_in';
  is_published: boolean;
  created_at: string;
  aktif_sampai: string;
}

interface Poll {
  id: string;
  room_id: string;
  pertanyaan: string;
  pilihan: { id: string; text: string; votes: number; voters: string[] }[];
  berakhir_pada: string;
  status: 'active' | 'ended';
  created_at: string;
}

interface Quiz {
  id: string;
  room_id: string;
  pertanyaan: string;
  pilihan: string[];
  jawaban_benar: string;
  status: 'active' | 'ended';
  created_at: string;
  answers: { user_id: string; jawaban: string; benar: boolean }[];
}

interface CoinHistoryItem {
  id: string;
  jenis: 'tambah' | 'kurang';
  jumlah: number;
  keterangan: string;
  created_at: string;
}

interface FeedPost {
  id: string;
  user_id: string;
  nama: string;
  username: string;
  foto_profil: string;
  border: string;
  custom_text?: string;
  image_url: string;
  caption: string;
  tag: string;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  reports_count: number;
  reported_by: string[];
  is_hidden: boolean;
  created_at: string;
}

interface FeedLike {
  id: string;
  post_id: string;
  user_id: string;
  nama: string;
  username: string;
  foto_profil: string;
  border: string;
  created_at: string;
}

interface FeedComment {
  id: string;
  post_id: string;
  user_id: string;
  nama: string;
  username: string;
  foto_profil: string;
  border: string;
  isi: string;
  parent_id?: string | null;
  reply_to_nama?: string | null;
  likes_count: number;
  liked_by: string[];
  created_at: string;
}

interface DatabaseSchema {
  users: Record<string, UserProfile>;
  userBorders: Record<string, string[]>;
  rooms: Room[];
  chats: Record<string, ChatMessage[]>;
  broadcasts: Broadcast[];
  giveaways: CoinGiveaway[];
  flashSales: FlashSale[];
  redeemCodes: RedeemCode[];
  rouletteWinners: RouletteWinner[];
  polls: Record<string, Poll>;
  quizzes: Record<string, Quiz>;
  coinHistory: Record<string, CoinHistoryItem[]>;
  watchedRooms: Record<string, string[]>;
  missionClaims: Record<string, boolean>;
  rouletteSpins: Record<string, boolean>;
  userChatCounts: Record<string, number>;
  userGiftCounts: Record<string, number>;
  userPollVoteCounts: Record<string, number>;
  userTransferCounts: Record<string, number>;
  posts: FeedPost[];
  feedLikes: FeedLike[];
  feedComments: FeedComment[];
}

const VALID_BORDER_IDS = [
  'pemula',
  'semangat-nobar',
  'indonesia-garuda',
  'rajin-nobar',
  'setia-nobar',
  'aurora-3d',
  'legenda-nobar',
  'kristal-es',
  'rajin-checkin',
  'misi-selesai',
  'pinky-cute',
  'ungu-kuromi',
  'biru-cyber',
  'galaxy',
  'api-phoenix',
  'naga',
  'luar-angkasa',
  'sultan',
  'lebaran',
  'tahun-baru',
  'natal',
  'halloween',
  'valentine',
  'kemerdekaan',
  'faiz-ganteng',
];

const BORDER_PRICES: Record<string, { nama: string; harga: number }> = {
  'pinky-cute': { nama: 'PINKY CANDY', harga: 500 },
  'ungu-kuromi': { nama: 'UNGU KAWAII', harga: 550 },
  'biru-cyber': { nama: 'CYBER BLUE 3D', harga: 650 },
  galaxy: { nama: 'GALAXY', harga: 800 },
  'api-phoenix': { nama: 'API PHOENIX 3D', harga: 900 },
  naga: { nama: 'NAGA', harga: 1000 },
  'luar-angkasa': { nama: 'LUAR ANGKASA 3D', harga: 1200 },
  sultan: { nama: 'SULTAN', harga: 1500 },
};

const GIFT_CATALOG: Record<string, { id: string; nama: string; emoji: string; harga: number }> = {
  bunga: { id: 'bunga', nama: 'Bunga', emoji: '💐', harga: 50 },
  boneka: { id: 'boneka', nama: 'Boneka', emoji: '🧸', harga: 50 },
  'kotak-hadiah': { id: 'kotak-hadiah', nama: 'Kotak Hadiah', emoji: '🎁', harga: 50 },
  'nasi-goreng': { id: 'nasi-goreng', nama: 'Nasi Goreng', emoji: '🍛', harga: 50 },
  kentang: { id: 'kentang', nama: 'Kentang', emoji: '🍟', harga: 50 },
  burger: { id: 'burger', nama: 'Burger', emoji: '🍔', harga: 50 },
  'jus-orange': { id: 'jus-orange', nama: 'Jus Orange', emoji: '🍊', harga: 50 },
  'kacamata-hitam': { id: 'kacamata-hitam', nama: 'Kacamata Hitam', emoji: '🕶️', harga: 50 },
  coklat: { id: 'coklat', nama: 'Coklat', emoji: '🍫', harga: 100 },
  kucing: { id: 'kucing', nama: 'Kucing', emoji: '🐱', harga: 100 },
  kambing: { id: 'kambing', nama: 'Kambing', emoji: '🐐', harga: 100 },
  'kacamata-love': { id: 'kacamata-love', nama: 'Kacamata Love', emoji: '🩷', harga: 100 },
  singa: { id: 'singa', nama: 'Singa', emoji: '🦁', harga: 200 },
  paus: { id: 'paus', nama: 'Paus', emoji: '🐳', harga: 200 },
  cincin: { id: 'cincin', nama: 'Cincin', emoji: '💍', harga: 200 },
};

const BINGKAI_PRICES: Record<string, number> = {
  tipis: 0,
  'tebal-emas': 150,
  berlian: 200,
  'hitam-emas': 200,
  api: 250,
  pelangi: 300,
};

const EFEK_PRICES: Record<string, number> = {
  none: 0,
  bintang: 100,
  salju: 100,
  confetti: 100,
  gelembung: 100,
  hati: 120,
  petir: 150,
  'kembang-api': 200,
};

const ANIMASI_PRICES: Record<string, number> = {
  none: 0,
  goyang: 100,
  kedip: 100,
  muter: 150,
};

function isOwnerUsername(username?: string | null): boolean {
  if (!username) return false;
  return username.replace(/^@/, '').trim().toLowerCase() === 'istamina';
}

function isValidYouTubeUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!/(?:youtube\.com|youtu\.be)/i.test(trimmed)) return false;
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ];
  return patterns.some((r) => r.test(trimmed));
}

function createEmptyDb(): DatabaseSchema {
  return {
    users: {},
    userBorders: {},
    rooms: [],
    chats: {},
    broadcasts: [],
    giveaways: [],
    flashSales: [],
    redeemCodes: [],
    rouletteWinners: [],
    polls: {},
    quizzes: {},
    coinHistory: {},
    watchedRooms: {},
    missionClaims: {},
    rouletteSpins: {},
    userChatCounts: {},
    userGiftCounts: {},
    userPollVoteCounts: {},
    userTransferCounts: {},
    posts: [],
    feedLikes: [],
    feedComments: [],
  };
}

const SERVER_BAD_WORDS = [
  'anjing', 'anjir', 'anjay', 'babi', 'bangsat', 'bajingan', 'kontol',
  'memek', 'ngentot', 'entot', 'jancok', 'jancuk', 'goblok', 'tolol',
  'bego', 'idiot', 'tai', 'taek', 'bangke', 'keparat', 'brengsek',
  'perek', 'lonte', 'pelacur', 'jalang', 'asu', 'jembut', 'titit',
  'peler', 'pepek', 'pantek', 'pukimak', 'fuck', 'fucking', 'shit',
  'bitch', 'asshole', 'dick', 'pussy', 'whore', 'slut', 'bastard', 'cunt',
];
const SERVER_BAD_WORDS_REGEX = new RegExp(`\\b(${SERVER_BAD_WORDS.join('|')})\\b`, 'gi');

function filterKataKasarServer(text: string): string {
  return String(text || '').replace(SERVER_BAD_WORDS_REGEX, '***');
}

function loadDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      const base = createEmptyDb();
      const db: DatabaseSchema = { ...base, ...parsed };

      // Migrate any legacy 'raja-quiz' border to 'pemula'
      Object.values(db.users).forEach((u) => {
        if (u.border_saat_ini === 'raja-quiz') {
          u.border_saat_ini = 'pemula';
        }
      });
      Object.keys(db.userBorders).forEach((uid) => {
        db.userBorders[uid] = (db.userBorders[uid] || []).filter((b) => b !== 'raja-quiz');
      });

      return db;
    }
  } catch (e) {
    console.warn('Could not load DB file, starting clean:', e);
  }
  return createEmptyDb();
}

const db: DatabaseSchema = loadDb();
let saveTimer: NodeJS.Timeout | null = null;

function persistDb() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist DB:', e);
    }
  }, 150);
}

// Connected WebSocket clients tracked with user_id
interface ClientMeta {
  ws: WebSocket;
  userId?: string;
}
const wsClients = new Set<ClientMeta>();

function broadcastEvent(type: string, payload: unknown) {
  const msg = JSON.stringify({ type, payload });
  for (const client of wsClients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(msg);
    }
  }
}

function getOnlineUserCount(): number {
  const uniqueIds = new Set<string>();
  for (const client of wsClients) {
    if (client.ws.readyState === WebSocket.OPEN && client.userId) {
      uniqueIds.add(client.userId);
    }
  }
  return uniqueIds.size;
}

function addCoinHistory(userId: string, jenis: 'tambah' | 'kurang', jumlah: number, keterangan: string) {
  if (!db.coinHistory[userId]) db.coinHistory[userId] = [];
  db.coinHistory[userId].unshift({
    id: `ch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    jenis,
    jumlah,
    keterangan,
    created_at: new Date().toISOString(),
  });
  db.coinHistory[userId] = db.coinHistory[userId].slice(0, 60);
}

function checkAndUnlockNontonBorders(userId: string) {
  const user = db.users[userId];
  if (!user) return;
  const owned = new Set(db.userBorders[userId] || ['pemula']);
  if (user.total_nonton >= 3) owned.add('semangat-nobar');
  if (user.total_nonton >= 5) owned.add('indonesia-garuda');
  if (user.total_nonton >= 7) owned.add('rajin-nobar');
  if (user.total_nonton >= 14) owned.add('setia-nobar');
  if (user.total_nonton >= 20) owned.add('aurora-3d');
  if (user.total_nonton >= 30) owned.add('legenda-nobar');
  if (user.checkin_total >= 3) owned.add('kristal-es');
  if (user.checkin_total >= 7) owned.add('rajin-checkin');
  db.userBorders[userId] = Array.from(owned);
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function buildUserMissions(userId: string) {
  const today = getTodayKey();
  const watchedToday = (db.watchedRooms[userId] || []).length;
  const chatCount = db.userChatCounts[`${userId}_${today}`] || 0;
  const giftCount = db.userGiftCounts[`${userId}_${today}`] || 0;
  const voteCount = db.userPollVoteCounts[`${userId}_${today}`] || 0;
  const transferCount = db.userTransferCounts[`${userId}_${today}`] || 0;

  return [
    {
      id: 'm-1',
      judul: 'Nonton di Room Nobar 1x',
      hadiahCoin: 10,
      target: 1,
      current: Math.min(1, watchedToday),
      klaim: Boolean(db.missionClaims[`${userId}_${today}_m-1`]),
    },
    {
      id: 'm-2',
      judul: 'Chat 5x di Room Nobar',
      hadiahCoin: 10,
      target: 5,
      current: Math.min(5, chatCount),
      klaim: Boolean(db.missionClaims[`${userId}_${today}_m-2`]),
    },
    {
      id: 'm-3',
      judul: 'Kasih Gift 1x di Room',
      hadiahCoin: 10,
      target: 1,
      current: Math.min(1, giftCount),
      klaim: Boolean(db.missionClaims[`${userId}_${today}_m-3`]),
    },
    {
      id: 'm-4',
      judul: 'Vote Poll 1x di Room',
      hadiahCoin: 5,
      target: 1,
      current: Math.min(1, voteCount),
      klaim: Boolean(db.missionClaims[`${userId}_${today}_m-4`]),
    },
    {
      id: 'm-5',
      judul: 'Transfer Coin ke temen 1x',
      hadiahCoin: 5,
      target: 1,
      current: Math.min(1, transferCount),
      klaim: Boolean(db.missionClaims[`${userId}_${today}_m-5`]),
    },
  ];
}

async function sendTelegramBroadcastNotification(judul: string, pesan: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.includes('1234567890')) return;
  const userIds = Object.keys(db.users);
  for (const uid of userIds) {
    if (!/^\d+$/.test(uid)) continue;
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: uid,
          text: `📢 *${judul}*\n\n${pesan}`,
          parse_mode: 'Markdown',
        }),
      });
    } catch {
      // Ignore individual delivery errors
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(express.text({ type: 'text/plain', limit: '1mb' }));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });
  const disconnectTimers = new Map<string, NodeJS.Timeout>();

  function deleteRoomCompletely(roomId: string) {
    const existed = db.rooms.some((r) => r.id === roomId);
    db.rooms = db.rooms.filter((r) => r.id !== roomId);
    delete db.chats[roomId];
    delete db.polls[roomId];
    delete db.quizzes[roomId];
    if (existed) {
      persistDb();
      broadcastEvent('ROOM_ENDED', { roomId });
    }
  }

  function purgeExpiredBroadcasts(): boolean {
    const now = Date.now();
    const beforeLen = db.broadcasts.length;
    db.broadcasts = db.broadcasts.filter((b) => {
      if (!b.aktif_sampai) return true;
      const exp = new Date(b.aktif_sampai).getTime();
      return isNaN(exp) || exp > now;
    });
    if (db.broadcasts.length !== beforeLen) {
      persistDb();
      broadcastEvent('BROADCASTS_UPDATED', { broadcasts: db.broadcasts });
      return true;
    }
    return false;
  }

  // Clean up expired broadcasts every 5 seconds
  setInterval(() => {
    purgeExpiredBroadcasts();
  }, 5000);

  function hasActiveSocket(userId: string): boolean {
    for (const c of wsClients) {
      if (c.ws.readyState === WebSocket.OPEN && c.userId === userId) {
        return true;
      }
    }
    return false;
  }

  wss.on('connection', (ws) => {
    const meta: ClientMeta = { ws };
    wsClients.add(meta);

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'IDENTIFY' && msg.userId) {
          const uid = String(msg.userId);
          meta.userId = uid;
          const pending = disconnectTimers.get(uid);
          if (pending) {
            clearTimeout(pending);
            disconnectTimers.delete(uid);
          }
          broadcastEvent('ONLINE_COUNT', { count: getOnlineUserCount() });
        }
      } catch {
        // ignore invalid frames
      }
    });

    ws.on('close', () => {
      wsClients.delete(meta);
      broadcastEvent('ONLINE_COUNT', { count: getOnlineUserCount() });

      const uid = meta.userId;
      if (uid && !hasActiveSocket(uid)) {
        const existing = disconnectTimers.get(uid);
        if (existing) clearTimeout(existing);
        const timer = setTimeout(() => {
          disconnectTimers.delete(uid);
          if (hasActiveSocket(uid)) return;
          const affectedRooms = db.rooms.filter((r) => r.viewers.includes(uid));
          affectedRooms.forEach((room) => {
            room.viewers = room.viewers.filter((id) => id !== uid);
            room.penonton_count = room.viewers.length;
            if (room.viewers.length === 0) {
              deleteRoomCompletely(room.id);
            } else {
              persistDb();
              broadcastEvent('ROOM_UPDATED', { room });
            }
          });
        }, 15000);
        disconnectTimers.set(uid, timer);
      }
    });
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    purgeExpiredBroadcasts();
    res.json({ ok: true, rooms: db.rooms.length, online: getOnlineUserCount() });
  });

  // 1. Auth & Initial Snapshot Sync
  app.post('/api/auth/sync', (req, res) => {
    const { user_id, nama, username, foto } = req.body || {};
    if (!user_id) {
      return res.status(400).json({ error: 'Telegram user_id wajib ada!' });
    }
    const uid = String(user_id);
    const cleanUsername = (username || `user_${uid}`).replace(/^@/, '');
    const isOwner = isOwnerUsername(cleanUsername);

    let profile = db.users[uid];
    if (!profile) {
      profile = {
        user_id: uid,
        nama: nama || cleanUsername,
        username: cleanUsername,
        foto: foto || '',
        coin: isOwner ? 999999999 : 1000,
        poin: 0,
        border_saat_ini: isOwner ? 'faiz-ganteng' : 'pemula',
        custom_text: isOwner ? 'FAIZ GANTENG' : '',
        total_hiasan_coin: 0,
        checkin_terakhir: null,
        checkin_hari_ke: 1,
        checkin_total: 0,
        total_nonton: 0,
        terakhir_nonton: null,
        created_at: new Date().toISOString(),
        decorations: {
          bingkai: 'tipis',
          efek: [],
          warna: 'default',
          sticker: [],
          animasi: 'none',
        },
        votes_count: 0,
      };
      db.users[uid] = profile;
      if (!isOwner) {
        addCoinHistory(uid, 'tambah', 1000, 'Bonus gabung pertama kali NOBAR KUY');
      }
    } else {
      // Sync latest Telegram profile fields (locked to real Telegram account)
      profile.nama = nama || profile.nama;
      profile.username = cleanUsername;
      if (foto) profile.foto = foto;
      if (profile.border_saat_ini === 'raja-quiz') {
        profile.border_saat_ini = 'pemula';
      }
      if (!profile.decorations) {
        profile.decorations = { bingkai: 'tipis', efek: [], warna: 'default', sticker: [], animasi: 'none' };
      }
    }

    if (isOwner) {
      profile.coin = 999999999;
      if (!profile.border_saat_ini || profile.border_saat_ini === 'pemula') {
        profile.border_saat_ini = 'faiz-ganteng';
      }
      db.userBorders[uid] = [...VALID_BORDER_IDS];
    } else if (!db.userBorders[uid] || db.userBorders[uid].length === 0) {
      db.userBorders[uid] = ['pemula'];
    }
    checkAndUnlockNontonBorders(uid);
    purgeExpiredBroadcasts();

    persistDb();
    broadcastEvent('USER_UPDATED', { user: profile });

    const today = getTodayKey();
    res.json({
      profile,
      allUsers: Object.values(db.users),
      ownedBorders: db.userBorders[uid],
      rooms: db.rooms.filter((r) => r.status === 'live' && r.viewers.length > 0),
      chats: db.chats,
      broadcasts: db.broadcasts,
      giveaways: db.giveaways,
      flashSales: db.flashSales,
      redeemCodes: db.redeemCodes,
      rouletteWinners: db.rouletteWinners || [],
      polls: db.polls,
      quizzes: db.quizzes,
      coinHistory: db.coinHistory[uid] || [],
      missions: buildUserMissions(uid),
      rouletteSpunToday: Boolean(db.rouletteSpins[`${uid}_${today}`]),
      onlineCount: Math.max(1, getOnlineUserCount()),
      posts: db.posts || [],
      feedLikes: db.feedLikes || [],
      feedComments: db.feedComments || [],
    });
  });

  // 2. Create Room (YouTube ONLY, max_viewers 1-10)
  app.post('/api/rooms', (req, res) => {
    const { user_id, judul, genre, is_private, video_url, max_viewers } = req.body || {};
    const user = db.users[String(user_id)];
    if (!user) return res.status(401).json({ error: 'User belum terautentikasi!' });

    if (!judul || !String(judul).trim()) {
      return res.status(400).json({ error: 'Judul room wajib diisi!' });
    }
    if (!isValidYouTubeUrl(String(video_url || ''))) {
      return res.status(400).json({ error: 'Link harus link YouTube' });
    }
    const maxV = Number(max_viewers);
    if (isNaN(maxV) || maxV < 1 || maxV > 10) {
      return res.status(400).json({ error: 'Maximal 10 orang (minimal 1 orang)' });
    }

    // Generate unique 6-digit code
    let code = '';
    for (let i = 0; i < 10; i++) {
      const candidate = Math.floor(100000 + Math.random() * 900000).toString();
      if (!db.rooms.some((r) => r.code_room === candidate && r.status === 'live')) {
        code = candidate;
        break;
      }
    }
    if (!code) code = Math.floor(100000 + Math.random() * 900000).toString();

    const newRoom: Room = {
      id: `room-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      judul: String(judul).trim(),
      host_id: user.user_id,
      host_nama: user.nama,
      host_username: user.username,
      host_foto: user.foto,
      host_border: user.border_saat_ini,
      host_custom_text: user.custom_text,
      genre: genre || 'Horror',
      is_private: Boolean(is_private),
      code_room: code,
      video_url: String(video_url).trim(),
      max_viewers: maxV,
      viewers: [user.user_id],
      status: 'live',
      penonton_count: 1,
      chats_count: 0,
      created_at: new Date().toISOString(),
    };

    db.rooms.unshift(newRoom);
    db.chats[newRoom.id] = [];

    // Track permanent total_nonton
    if (!db.watchedRooms[user.user_id]) db.watchedRooms[user.user_id] = [];
    if (!db.watchedRooms[user.user_id].includes(newRoom.id)) {
      db.watchedRooms[user.user_id].push(newRoom.id);
      user.total_nonton += 1;
      user.terakhir_nonton = new Date().toISOString();
      checkAndUnlockNontonBorders(user.user_id);
    }

    persistDb();
    broadcastEvent('ROOM_CREATED', { room: newRoom });
    broadcastEvent('USER_UPDATED', { user, ownedBorders: db.userBorders[user.user_id] });

    res.json({ room: newRoom, profile: user, ownedBorders: db.userBorders[user.user_id], missions: buildUserMissions(user.user_id) });
  });

  // 3. Join Room (by room_id OR 6-digit code_room) - works across different phones!
  app.post('/api/rooms/join', (req, res) => {
    const { user_id, room_id, code_room } = req.body || {};
    const user = db.users[String(user_id)];
    if (!user) return res.status(401).json({ error: 'User belum login!' });

    let room: Room | undefined;
    if (code_room) {
      const cleanCode = String(code_room).trim();
      room = db.rooms.find((r) => r.status === 'live' && r.code_room === cleanCode);
      if (!room) {
        return res.status(404).json({ error: `Room dengan code "${cleanCode}" ga tersedia!` });
      }
    } else if (room_id) {
      room = db.rooms.find((r) => r.status === 'live' && r.id === String(room_id));
      if (!room) {
        return res.status(404).json({ error: 'Room udah ga aktif atau ga ketemu!' });
      }
      if (room.is_private && room.host_id !== user.user_id) {
        return res.status(403).json({ error: 'Room ini private, masukin 6 digit code room dulu!' });
      }
    } else {
      return res.status(400).json({ error: 'Pilih room atau masukin code room!' });
    }

    const alreadyIn = room.viewers.includes(user.user_id);
    if (!alreadyIn && room.viewers.length >= room.max_viewers) {
      return res.status(400).json({ error: 'Room Penuh!' });
    }

    if (!alreadyIn) {
      room.viewers.push(user.user_id);
      room.penonton_count = room.viewers.length;
    }

    // Track permanent total_nonton (never resets!)
    if (!db.watchedRooms[user.user_id]) db.watchedRooms[user.user_id] = [];
    if (!db.watchedRooms[user.user_id].includes(room.id)) {
      db.watchedRooms[user.user_id].push(room.id);
      user.total_nonton += 1;
      user.terakhir_nonton = new Date().toISOString();
      checkAndUnlockNontonBorders(user.user_id);
    }

    persistDb();
    broadcastEvent('ROOM_UPDATED', { room });
    broadcastEvent('USER_UPDATED', { user, ownedBorders: db.userBorders[user.user_id] });

    res.json({
      room,
      chats: db.chats[room.id] || [],
      poll: db.polls[room.id] || null,
      quiz: db.quizzes[room.id] || null,
      profile: user,
      ownedBorders: db.userBorders[user.user_id],
      missions: buildUserMissions(user.user_id),
    });
  });

  // 4. Leave Room (Auto-deletes room immediately if 0 viewers left!)
  app.post('/api/rooms/:roomId/leave', (req, res) => {
    const { roomId } = req.params;
    let bodyObj: Record<string, unknown> = {};
    if (typeof req.body === 'string') {
      try {
        bodyObj = JSON.parse(req.body);
      } catch {
        bodyObj = {};
      }
    } else if (req.body && typeof req.body === 'object') {
      bodyObj = req.body;
    }
    const user_id = bodyObj.user_id;
    const room = db.rooms.find((r) => r.id === roomId);
    if (room && user_id) {
      room.viewers = room.viewers.filter((id) => id !== String(user_id));
      room.penonton_count = room.viewers.length;
      if (room.viewers.length === 0) {
        deleteRoomCompletely(room.id);
      } else {
        persistDb();
        broadcastEvent('ROOM_UPDATED', { room });
      }
    }
    res.json({ ok: true });
  });

  // 5. End / Delete Room (Selesai Nobar - Host clicks -> room immediately deleted!)
  app.post('/api/rooms/:roomId/end', (req, res) => {
    const { roomId } = req.params;
    const { user_id } = req.body || {};
    const user = db.users[String(user_id)];
    const room = db.rooms.find((r) => r.id === roomId);
    if (!room) return res.status(404).json({ error: 'Room ga ketemu!' });
    if (room.host_id !== String(user_id) && !isOwnerUsername(user?.username)) {
      return res.status(403).json({ error: 'Cuma Host yang bisa selesain nobar!' });
    }
    deleteRoomCompletely(roomId);
    res.json({ ok: true });
  });

  // 6. Change Room Code
  app.post('/api/rooms/:roomId/code', (req, res) => {
    const { roomId } = req.params;
    const { user_id, newCode } = req.body || {};
    const user = db.users[String(user_id)];
    const room = db.rooms.find((r) => r.id === roomId);
    if (!room) return res.status(404).json({ error: 'Room ga ketemu!' });
    if (room.host_id !== String(user_id) && !isOwnerUsername(user?.username)) {
      return res.status(403).json({ error: 'Akses ditolak!' });
    }
    room.code_room = String(newCode || Math.floor(100000 + Math.random() * 900000));
    persistDb();
    broadcastEvent('ROOM_UPDATED', { room });
    res.json({ room });
  });

  // 7. Change Room Video (YouTube URL only)
  app.post('/api/rooms/:roomId/video', (req, res) => {
    const { roomId } = req.params;
    const { user_id, video_url } = req.body || {};
    const user = db.users[String(user_id)];
    const room = db.rooms.find((r) => r.id === roomId);
    if (!room) return res.status(404).json({ error: 'Room ga ketemu!' });
    if (room.host_id !== String(user_id) && !isOwnerUsername(user?.username)) {
      return res.status(403).json({ error: 'Cuma Host atau Owner yang bisa ganti video!' });
    }
    if (!isValidYouTubeUrl(String(video_url || ''))) {
      return res.status(400).json({ error: 'Link harus link YouTube' });
    }
    room.video_url = String(video_url).trim();
    persistDb();
    broadcastEvent('ROOM_UPDATED', { room });
    res.json({ room });
  });

  // 8. Send Chat / Gift (Idempotent + Reply + Initial Read Receipt)
  app.post('/api/rooms/:roomId/chats', (req, res) => {
    const { roomId } = req.params;
    const { id, user_id, pesan, is_gift, gift_nama, reply_to } = req.body || {};
    const user = db.users[String(user_id)];
    const room = db.rooms.find((r) => r.id === roomId);
    if (!user || !room) return res.status(404).json({ error: 'Room atau user ga ketemu!' });
    if (!pesan || !String(pesan).trim()) return res.status(400).json({ error: 'Pesan kosong!' });

    if (!db.chats[roomId]) db.chats[roomId] = [];

    const msgId = id ? String(id) : `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const existing = db.chats[roomId].find((c) => c.id === msgId);
    if (existing) {
      return res.json({ message: existing });
    }

    const nowISO = new Date().toISOString();
    const newMsg: ChatMessage = {
      id: msgId,
      room_id: roomId,
      user_id: user.user_id,
      nama: user.nama,
      username: user.username,
      foto: user.foto,
      border: user.border_saat_ini,
      custom_text: user.custom_text,
      decorations: user.decorations,
      pesan: String(pesan).trim(),
      reply_to: reply_to && reply_to.id ? reply_to : undefined,
      reactions: {},
      read_by: [
        {
          user_id: user.user_id,
          nama: user.nama,
          username: user.username,
          foto: user.foto,
          border: user.border_saat_ini,
          read_at: nowISO,
        },
      ],
      is_gift: Boolean(is_gift),
      gift_nama: gift_nama || undefined,
      is_host: room.host_id === user.user_id,
      is_owner: isOwnerUsername(user.username),
      created_at: nowISO,
    };

    db.chats[roomId].push(newMsg);
    room.chats_count += 1;

    const today = getTodayKey();
    if (is_gift) {
      db.userGiftCounts[`${user.user_id}_${today}`] = (db.userGiftCounts[`${user.user_id}_${today}`] || 0) + 1;
    } else {
      db.userChatCounts[`${user.user_id}_${today}`] = (db.userChatCounts[`${user.user_id}_${today}`] || 0) + 1;
    }

    persistDb();
    broadcastEvent('CHAT_ADDED', { roomId, message: newMsg });
    res.json({ message: newMsg, missions: buildUserMissions(user.user_id) });
  });

  // 8a-paid. Send Paid 3D Gift to Host (Deducts sender Coin unless Owner @istamina, credits Host)
  app.post('/api/rooms/:roomId/gifts', (req, res) => {
    const { roomId } = req.params;
    const { id, user_id, gift_id } = req.body || {};
    const sender = db.users[String(user_id)];
    const room = db.rooms.find((r) => r.id === roomId && r.status === 'live');
    const giftDef = GIFT_CATALOG[String(gift_id || '')];

    if (!sender || !room) {
      return res.status(404).json({ error: 'Room atau user ga ketemu!' });
    }
    if (!giftDef) {
      return res.status(404).json({ error: 'Hadiah ga tersedia!' });
    }

    if (!db.chats[roomId]) db.chats[roomId] = [];
    const msgId = id ? String(id) : `gift-${sender.user_id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const existing = db.chats[roomId].find((c) => c.id === msgId);
    if (existing) {
      return res.json({
        message: existing,
        profile: sender,
        coinHistory: db.coinHistory[sender.user_id] || [],
        missions: buildUserMissions(sender.user_id),
      });
    }

    const senderIsOwner = isOwnerUsername(sender.username);
    if (!senderIsOwner && sender.coin < giftDef.harga) {
      return res.status(400).json({ error: `Coin lu kurang! Butuh ${giftDef.harga} Coin.` });
    }

    if (!senderIsOwner) {
      sender.coin -= giftDef.harga;
      addCoinHistory(sender.user_id, 'kurang', giftDef.harga, `Kirim Gift ${giftDef.nama} ke ${room.host_nama}`);
    } else {
      sender.coin = 999999999;
    }

    const host = db.users[room.host_id];
    const shouldCreditHost = Boolean(host && host.user_id !== sender.user_id);
    if (shouldCreditHost && host) {
      if (!isOwnerUsername(host.username)) {
        host.coin += giftDef.harga;
        addCoinHistory(host.user_id, 'tambah', giftDef.harga, `Dapet Gift ${giftDef.nama} dari @${sender.username}`);
      } else {
        host.coin = 999999999;
      }
    }

    const nowISO = new Date().toISOString();
    const displayGiftName = `${giftDef.emoji} ${giftDef.nama}`;
    const msgText =
      giftDef.harga >= 200
        ? `${sender.nama} ngirim ${displayGiftName} (${giftDef.harga} Coin) ke Host ${room.host_nama}! Sultan parah!`
        : `${sender.nama} ngirim ${displayGiftName} (${giftDef.harga} Coin) ke Host ${room.host_nama}!`;

    const newMsg: ChatMessage = {
      id: msgId,
      room_id: roomId,
      user_id: sender.user_id,
      nama: sender.nama,
      username: sender.username,
      foto: sender.foto,
      border: sender.border_saat_ini,
      custom_text: sender.custom_text,
      decorations: sender.decorations,
      pesan: msgText,
      reactions: {},
      read_by: [
        {
          user_id: sender.user_id,
          nama: sender.nama,
          username: sender.username,
          foto: sender.foto,
          border: sender.border_saat_ini,
          read_at: nowISO,
        },
      ],
      is_gift: true,
      gift_id: giftDef.id,
      gift_nama: giftDef.nama,
      gift_harga: giftDef.harga,
      is_host: room.host_id === sender.user_id,
      is_owner: senderIsOwner,
      created_at: nowISO,
    };

    const giftEvent = {
      id: msgId,
      room_id: roomId,
      gift_id: giftDef.id,
      gift_nama: giftDef.nama,
      gift_emoji: giftDef.emoji,
      gift_harga: giftDef.harga,
      sender_id: sender.user_id,
      sender_nama: sender.nama,
      sender_username: sender.username,
      sender_foto: sender.foto,
      sender_border: sender.border_saat_ini,
      host_id: room.host_id,
      host_nama: room.host_nama,
      created_at: nowISO,
    };

    db.chats[roomId].push(newMsg);
    room.chats_count += 1;

    const today = getTodayKey();
    db.userGiftCounts[`${sender.user_id}_${today}`] = (db.userGiftCounts[`${sender.user_id}_${today}`] || 0) + 1;

    persistDb();
    broadcastEvent('CHAT_ADDED', { roomId, message: newMsg });
    broadcastEvent('GIFT_SENT', { giftEvent });
    broadcastEvent('USER_UPDATED', { user: sender });
    if (shouldCreditHost && host) {
      broadcastEvent('USER_UPDATED', { user: host });
      broadcastEvent('GIFT_RECEIVED', {
        toUserId: host.user_id,
        fromUsername: sender.username,
        giftNama: giftDef.nama,
        amount: giftDef.harga,
        hostHistory: db.coinHistory[host.user_id] || [],
      });
    }

    res.json({
      message: newMsg,
      giftEvent,
      profile: sender,
      coinHistory: db.coinHistory[sender.user_id] || [],
      missions: buildUserMissions(sender.user_id),
    });
  });

  // 8b. React to Chat Message (Toggle Emoji Reaction)
  app.post('/api/rooms/:roomId/chats/:chatId/react', (req, res) => {
    const { roomId, chatId } = req.params;
    const { user_id, emoji } = req.body || {};
    const user = db.users[String(user_id)];
    const list = db.chats[roomId];
    if (!user || !list) return res.status(404).json({ error: 'Chat ga ketemu!' });
    const msg = list.find((c) => c.id === chatId);
    if (!msg) return res.status(404).json({ error: 'Pesan ga ketemu!' });
    if (!emoji) return res.status(400).json({ error: 'Emoji kosong!' });

    if (!msg.reactions) msg.reactions = {};
    const currentReactors = msg.reactions[emoji] || [];
    const alreadyReacted = currentReactors.some((r) => r.user_id === user.user_id);

    if (alreadyReacted) {
      msg.reactions[emoji] = currentReactors.filter((r) => r.user_id !== user.user_id);
      if (msg.reactions[emoji].length === 0) {
        delete msg.reactions[emoji];
      }
    } else {
      msg.reactions[emoji] = [...currentReactors, { user_id: user.user_id, nama: user.nama }];
    }

    persistDb();
    broadcastEvent('CHAT_UPDATED', { roomId, message: msg });
    res.json({ message: msg });
  });

  // 8c. Mark Chats as Read (Telegram-style Read Receipts)
  app.post('/api/rooms/:roomId/chats/read', (req, res) => {
    const { roomId } = req.params;
    const { user_id, chatIds } = req.body || {};
    const user = db.users[String(user_id)];
    const list = db.chats[roomId];
    if (!user || !list) return res.json({ ok: true, updatedIds: [] });

    const idsToCheck: string[] = Array.isArray(chatIds) ? chatIds : [];
    const nowISO = new Date().toISOString();
    const receipt: ChatReadReceipt = {
      user_id: user.user_id,
      nama: user.nama,
      username: user.username,
      foto: user.foto,
      border: user.border_saat_ini,
      read_at: nowISO,
    };

    const updatedIds: string[] = [];
    for (const msg of list) {
      if (idsToCheck.length > 0 && !idsToCheck.includes(msg.id)) continue;
      if (!msg.read_by) msg.read_by = [];
      if (!msg.read_by.some((r) => r.user_id === user.user_id)) {
        msg.read_by.push(receipt);
        updatedIds.push(msg.id);
      }
    }

    if (updatedIds.length > 0) {
      persistDb();
      broadcastEvent('CHATS_READ', { roomId, reader: receipt, chatIds: updatedIds });
    }
    res.json({ ok: true, updatedIds });
  });

  // 9. Delete Chat (Self, Host, or Owner @istamina)
  app.delete('/api/rooms/:roomId/chats/:chatId', (req, res) => {
    const { roomId, chatId } = req.params;
    const user_id = String(req.body?.user_id || req.query.user_id || '');
    const user = db.users[user_id];
    const room = db.rooms.find((r) => r.id === roomId);
    if (!room || !db.chats[roomId]) return res.status(404).json({ error: 'Chat ga ketemu!' });

    const target = db.chats[roomId].find((c) => c.id === chatId);
    if (!target) return res.status(404).json({ error: 'Chat udah dihapus!' });

    const canDelete =
      target.user_id === user_id ||
      room.host_id === user_id ||
      isOwnerUsername(user?.username);

    if (!canDelete) {
      return res.status(403).json({ error: 'Lu ga punya izin hapus chat ini!' });
    }

    db.chats[roomId] = db.chats[roomId].filter((c) => c.id !== chatId);
    persistDb();
    broadcastEvent('CHAT_DELETED', { roomId, chatId });
    res.json({ ok: true });
  });

  // 10. Polls & Quizzes
  app.post('/api/rooms/:roomId/polls', (req, res) => {
    const { roomId } = req.params;
    const { pertanyaan, pilihanText } = req.body || {};
    const newPoll: Poll = {
      id: `poll-${Date.now()}`,
      room_id: roomId,
      pertanyaan,
      pilihan: (pilihanText || []).map((t: string, idx: number) => ({
        id: `opt-${idx}-${Date.now()}`,
        text: t,
        votes: 0,
        voters: [],
      })),
      berakhir_pada: new Date(Date.now() + 5 * 60000).toISOString(),
      status: 'active',
      created_at: new Date().toISOString(),
    };
    db.polls[roomId] = newPoll;
    persistDb();
    broadcastEvent('POLL_UPDATED', { roomId, poll: newPoll });
    res.json({ poll: newPoll });
  });

  app.post('/api/rooms/:roomId/polls/vote', (req, res) => {
    const { roomId } = req.params;
    const { user_id, optionId } = req.body || {};
    const poll = db.polls[roomId];
    if (!poll || poll.status !== 'active') return res.status(400).json({ error: 'Poll udah selesai!' });
    if (poll.pilihan.some((p) => p.voters.includes(String(user_id)))) {
      return res.status(400).json({ error: 'Lu udah vote di poll ini!' });
    }
    poll.pilihan = poll.pilihan.map((p) =>
      p.id === optionId ? { ...p, votes: p.votes + 1, voters: [...p.voters, String(user_id)] } : p
    );
    const today = getTodayKey();
    db.userPollVoteCounts[`${user_id}_${today}`] = (db.userPollVoteCounts[`${user_id}_${today}`] || 0) + 1;
    persistDb();
    broadcastEvent('POLL_UPDATED', { roomId, poll });
    res.json({ poll, missions: buildUserMissions(String(user_id)) });
  });

  app.post('/api/rooms/:roomId/quizzes', (req, res) => {
    const { roomId } = req.params;
    const { pertanyaan, pilihan, jawabanBenar } = req.body || {};
    const newQuiz: Quiz = {
      id: `quiz-${Date.now()}`,
      room_id: roomId,
      pertanyaan,
      pilihan,
      jawaban_benar: jawabanBenar,
      status: 'active',
      created_at: new Date().toISOString(),
      answers: [],
    };
    db.quizzes[roomId] = newQuiz;
    persistDb();
    broadcastEvent('QUIZ_UPDATED', { roomId, quiz: newQuiz });
    res.json({ quiz: newQuiz });
  });

  app.post('/api/rooms/:roomId/quizzes/answer', (req, res) => {
    const { roomId } = req.params;
    const { user_id, jawaban } = req.body || {};
    const user = db.users[String(user_id)];
    const quiz = db.quizzes[roomId];
    if (!user || !quiz || quiz.status !== 'active') return res.status(400).json({ error: 'Quiz ga aktif!' });
    if (quiz.answers.some((a) => a.user_id === user.user_id)) {
      return res.status(400).json({ error: 'Lu udah jawab quiz ini!' });
    }

    const benar = jawaban === quiz.jawaban_benar;
    quiz.answers.push({ user_id: user.user_id, jawaban, benar });
    const isOwner = isOwnerUsername(user.username);

    if (benar) {
      user.poin += 10;
      if (!isOwner) {
        user.coin += 10;
        addCoinHistory(user.user_id, 'tambah', 10, 'Jawaban Quiz Benar');
      }
    }
    persistDb();
    broadcastEvent('QUIZ_UPDATED', { roomId, quiz });
    broadcastEvent('USER_UPDATED', { user });
    res.json({
      quiz,
      benar,
      profile: user,
      coinHistory: db.coinHistory[user.user_id] || [],
    });
  });

  // 11. Equip Border (Persists across refresh & updates rooms/leaderboard/header!)
  app.post('/api/users/:userId/border', (req, res) => {
    const { userId } = req.params;
    const { borderId } = req.body || {};
    const user = db.users[userId];
    if (!user) return res.status(404).json({ error: 'User ga ketemu!' });
    if (borderId === 'raja-quiz' || !VALID_BORDER_IDS.includes(borderId)) {
      return res.status(400).json({ error: 'Border ga valid!' });
    }
    const isOwner = isOwnerUsername(user.username);
    const owned = db.userBorders[userId] || ['pemula'];
    if (!isOwner && !owned.includes(borderId)) {
      return res.status(403).json({ error: 'Border ini belum kebuka buat lu!' });
    }

    user.border_saat_ini = borderId;
    // Reset custom solid color override so the selected border's unique gradient/glow renders cleanly!
    if (user.decorations) {
      user.decorations.warna = 'default';
    }
    // Also update any active rooms hosted by this user
    db.rooms.forEach((r) => {
      if (r.host_id === userId) {
        r.host_border = borderId;
      }
    });

    persistDb();
    broadcastEvent('USER_UPDATED', { user, ownedBorders: db.userBorders[userId] });
    db.rooms.filter((r) => r.host_id === userId).forEach((room) => broadcastEvent('ROOM_UPDATED', { room }));

    res.json({ profile: user });
  });

  // 12. Update Border Decorations (Owner Coin NEVER decreases!)
  app.post('/api/users/:userId/decorations', (req, res) => {
    const { userId } = req.params;
    const { decorations, customText } = req.body || {};
    const user = db.users[userId];
    if (!user) return res.status(404).json({ error: 'User ga ketemu!' });

    const isOwner = isOwnerUsername(user.username);
    if (user.border_saat_ini === 'pemula' && !isOwner) {
      return res.status(400).json({ error: 'Border Pemula ga bisa dihias. Nonton 3x dulu buat buka!' });
    }

    let cost = 0;
    if (!isOwner) {
      if (decorations?.bingkai && decorations.bingkai !== 'tipis') {
        cost += BINGKAI_PRICES[decorations.bingkai] || 150;
      }
      if (decorations?.warna && decorations.warna !== 'default') {
        cost += 100;
      }
      if (decorations?.animasi && decorations.animasi !== 'none') {
        cost += ANIMASI_PRICES[decorations.animasi] || 100;
      }
      (decorations?.efek || []).forEach((ef: string) => {
        if (ef !== 'none') cost += EFEK_PRICES[ef] || 100;
      });
      if (decorations?.sticker && decorations.sticker.length > 0 && decorations.sticker[0] !== 'none') {
        cost += 100;
      }
      if (customText !== undefined && customText.trim().toUpperCase() !== (user.custom_text || '').toUpperCase()) {
        cost += 100;
      }

      if (user.coin < cost) {
        return res.status(400).json({ error: `Coin lu kurang! Butuh ${cost} Coin.` });
      }
      user.coin -= cost;
      user.total_hiasan_coin += cost;
      if (cost > 0) {
        addCoinHistory(userId, 'kurang', cost, 'Hias & Custom Text Border');
      }
    }

    user.decorations = decorations;
    if (customText !== undefined) {
      user.custom_text = customText.trim().toUpperCase().slice(0, 15);
    }

    db.rooms.forEach((r) => {
      if (r.host_id === userId) {
        r.host_custom_text = user.custom_text;
      }
    });

    persistDb();
    broadcastEvent('USER_UPDATED', { user });
    res.json({ profile: user, cost, coinHistory: db.coinHistory[userId] || [] });
  });

  // 13. Buy Border from Shop (Owner Coin NEVER decreases!)
  app.post('/api/users/:userId/shop/buy', (req, res) => {
    const { userId } = req.params;
    const { borderId } = req.body || {};
    const user = db.users[userId];
    const borderInfo = BORDER_PRICES[borderId];
    if (!user || !borderInfo) return res.status(404).json({ error: 'Border ga ketemu!' });

    const isOwner = isOwnerUsername(user.username);
    const owned = db.userBorders[userId] || ['pemula'];
    if (owned.includes(borderId) && !isOwner) {
      return res.status(400).json({ error: 'Border ini udah lu punya!' });
    }

    if (!isOwner) {
      if (user.coin < borderInfo.harga) {
        return res.status(400).json({ error: `Coin lu kurang! Butuh ${borderInfo.harga} Coin.` });
      }
      user.coin -= borderInfo.harga;
      user.total_hiasan_coin += borderInfo.harga;
      addCoinHistory(userId, 'kurang', borderInfo.harga, `Beli Border ${borderInfo.nama}`);
    }

    db.userBorders[userId] = Array.from(new Set([...owned, borderId]));
    user.border_saat_ini = borderId;
    if (user.decorations) user.decorations.warna = 'default';

    persistDb();
    broadcastEvent('USER_UPDATED', { user, ownedBorders: db.userBorders[userId] });
    res.json({
      profile: user,
      ownedBorders: db.userBorders[userId],
      coinHistory: db.coinHistory[userId] || [],
    });
  });

  // 14. Daily Check-in (NO streak, NO punishment!)
  app.post('/api/users/:userId/checkin', (req, res) => {
    const { userId } = req.params;
    const user = db.users[userId];
    if (!user) return res.status(404).json({ error: 'User ga ketemu!' });

    const today = getTodayKey();
    if (user.checkin_terakhir === today) {
      return res.status(400).json({ error: 'Lu udah check-in hari ini! Besok lagi ya.' });
    }

    const nextDay = (user.checkin_hari_ke % 7) + 1;
    const coinsEarned = nextDay === 7 ? 20 : 10;
    const isOwner = isOwnerUsername(user.username);

    user.checkin_terakhir = today;
    user.checkin_hari_ke = nextDay;
    user.checkin_total = (user.checkin_total || 0) + 1;

    if (!isOwner) {
      user.coin += coinsEarned;
      addCoinHistory(userId, 'tambah', coinsEarned, `Check-in Harian (+${coinsEarned} Coin)`);
    }
    checkAndUnlockNontonBorders(userId);

    persistDb();
    broadcastEvent('USER_UPDATED', { user, ownedBorders: db.userBorders[userId] });
    res.json({
      profile: user,
      ownedBorders: db.userBorders[userId],
      coinsEarned,
      coinHistory: db.coinHistory[userId] || [],
    });
  });

  // 15. Claim Daily Mission
  app.post('/api/users/:userId/missions/claim', (req, res) => {
    const { userId } = req.params;
    const { missionId } = req.body || {};
    const user = db.users[userId];
    if (!user) return res.status(404).json({ error: 'User ga ketemu!' });

    const today = getTodayKey();
    const key = `${userId}_${today}_${missionId}`;
    if (db.missionClaims[key]) {
      return res.status(400).json({ error: 'Misi ini udah lu klaim hari ini!' });
    }

    const missions = buildUserMissions(userId);
    const target = missions.find((m) => m.id === missionId);
    if (!target) return res.status(404).json({ error: 'Misi ga ketemu!' });
    if (target.current < target.target) {
      return res.status(400).json({ error: 'Misi ini belum kelar!' });
    }

    db.missionClaims[key] = true;
    const isOwner = isOwnerUsername(user.username);
    if (!isOwner) {
      user.coin += target.hadiahCoin;
      addCoinHistory(userId, 'tambah', target.hadiahCoin, `Misi Selesai: ${target.judul}`);
    }

    const updatedMissions = buildUserMissions(userId);
    const allDone = updatedMissions.every((m) => m.klaim);
    if (allDone) {
      db.userBorders[userId] = Array.from(new Set([...(db.userBorders[userId] || ['pemula']), 'misi-selesai']));
    }

    persistDb();
    broadcastEvent('USER_UPDATED', { user, ownedBorders: db.userBorders[userId] });
    res.json({
      profile: user,
      missions: updatedMissions,
      ownedBorders: db.userBorders[userId],
      coinHistory: db.coinHistory[userId] || [],
    });
  });

  // 16. Spin Roulette (First spin daily free, extra 10 Coin - Owner coin NEVER decreases!)
  app.post('/api/users/:userId/roulette/spin', (req, res) => {
    const { userId } = req.params;
    const user = db.users[userId];
    if (!user) return res.status(404).json({ error: 'User ga ketemu!' });

    const today = getTodayKey();
    const spinKey = `${userId}_${today}`;
    const isFree = !db.rouletteSpins[spinKey];
    const isOwner = isOwnerUsername(user.username);

    if (!isFree && !isOwner && user.coin < 10) {
      return res.status(400).json({ error: 'Coin lu kurang! Butuh 10 Coin buat spin lagi.' });
    }

    if (!isFree && !isOwner) {
      user.coin -= 10;
      addCoinHistory(userId, 'kurang', 10, 'Puter Roda Roulette');
    }
    db.rouletteSpins[spinKey] = true;

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

    if (slice.val > 0 && !isOwner) {
      user.coin += slice.val;
      addCoinHistory(userId, 'tambah', slice.val, `Roulette Harian: ${slice.label}`);
    }

    if (slice.val > 0) {
      if (!db.rouletteWinners) db.rouletteWinners = [];
      db.rouletteWinners.unshift({
        id: `rw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        user_id: user.user_id,
        nama: user.nama,
        username: user.username,
        foto: user.foto,
        border: user.border_saat_ini,
        jumlah: slice.val,
        created_at: new Date().toISOString(),
      });
      db.rouletteWinners = db.rouletteWinners.slice(0, 30);
      broadcastEvent('ROULETTE_WINNERS_UPDATED', { rouletteWinners: db.rouletteWinners });
    }

    persistDb();
    broadcastEvent('USER_UPDATED', { user });
    res.json({
      profile: user,
      rewardText: slice.label,
      coinGain: slice.val,
      isZonk: slice.val === 0,
      sliceIndex: pickedIdx,
      coinHistory: db.coinHistory[userId] || [],
      rouletteWinners: db.rouletteWinners || [],
    });
  });

  // 17. Transfer Coin (Owner coin NEVER decreases!)
  app.post('/api/transfer', (req, res) => {
    const { fromUserId, toUserId, amount, note } = req.body || {};
    const sender = db.users[String(fromUserId)];
    const recipient = db.users[String(toUserId)];
    const amt = Number(amount);

    if (!sender || !recipient) return res.status(404).json({ error: 'Pengguna ga ketemu!' });
    if (isNaN(amt) || amt < 10) return res.status(400).json({ error: 'Minimal transfer 10 Coin!' });

    const isOwner = isOwnerUsername(sender.username);
    if (!isOwner && amt > 1000) return res.status(400).json({ error: 'Maksimal 1000 Coin per hari!' });
    if (!isOwner && sender.coin < amt) return res.status(400).json({ error: 'Coin lu kurang!' });

    if (!isOwner) {
      sender.coin -= amt;
      addCoinHistory(sender.user_id, 'kurang', amt, `Transfer ke @${recipient.username}${note ? ` (${note})` : ''}`);
    }
    if (!isOwnerUsername(recipient.username)) {
      recipient.coin += amt;
      addCoinHistory(recipient.user_id, 'tambah', amt, `Transfer dari @${sender.username}${note ? ` (${note})` : ''}`);
    }

    const today = getTodayKey();
    db.userTransferCounts[`${sender.user_id}_${today}`] = (db.userTransferCounts[`${sender.user_id}_${today}`] || 0) + 1;

    persistDb();
    broadcastEvent('USER_UPDATED', { user: sender });
    broadcastEvent('USER_UPDATED', { user: recipient });
    broadcastEvent('TRANSFER_RECEIVED', {
      toUserId: recipient.user_id,
      fromNama: sender.nama,
      fromUsername: sender.username,
      amount: amt,
      note: note || '',
      recipientHistory: db.coinHistory[recipient.user_id] || [],
    });

    res.json({
      profile: sender,
      coinHistory: db.coinHistory[sender.user_id] || [],
      missions: buildUserMissions(sender.user_id),
    });
  });

  // 18. Vote Border on Leaderboard
  app.post('/api/users/:targetUserId/vote-border', (req, res) => {
    const { targetUserId } = req.params;
    const target = db.users[targetUserId];
    if (!target) return res.status(404).json({ error: 'User ga ketemu!' });
    target.votes_count += 1;
    persistDb();
    broadcastEvent('USER_UPDATED', { user: target });
    res.json({ user: target });
  });

  // 19. OWNER PANEL ENDPOINTS (@istamina ONLY!)
  function assertOwner(req: express.Request, res: express.Response): UserProfile | null {
    const actorId = String(req.body?.actor_id || req.query.actor_id || '');
    const actor = db.users[actorId];
    if (!actor || !isOwnerUsername(actor.username)) {
      res.status(403).json({ error: 'Akses ditolak! Khusus Owner @istamina.' });
      return null;
    }
    return actor;
  }

  // Broadcasts (with configurable expiry time -> auto-deletes when time is up)
  app.post('/api/owner/broadcasts', async (req, res) => {
    const actor = assertOwner(req, res);
    if (!actor) return;
    const { jenis, judul, pesan, target, is_published, aktif_sampai, durasi_menit } = req.body || {};
    if (!judul?.trim() || !pesan?.trim()) {
      return res.status(400).json({ error: 'Judul dan isi broadcast wajib diisi!' });
    }

    let expiresAtMs = Date.now() + 60 * 60000;
    if (aktif_sampai) {
      const parsed = new Date(aktif_sampai).getTime();
      if (isNaN(parsed) || parsed <= Date.now()) {
        return res.status(400).json({ error: 'Waktu selesai broadcast harus di masa depan!' });
      }
      expiresAtMs = parsed;
    } else if (durasi_menit && Number(durasi_menit) > 0) {
      expiresAtMs = Date.now() + Number(durasi_menit) * 60000;
    }

    const newBc: Broadcast = {
      id: `bc-${Date.now()}`,
      dibuat_oleh: actor.user_id,
      jenis: jenis || 'banner',
      judul: judul.trim(),
      pesan: pesan.trim(),
      target: target || 'all',
      is_published: is_published !== false,
      created_at: new Date().toISOString(),
      aktif_sampai: new Date(expiresAtMs).toISOString(),
    };
    db.broadcasts.unshift(newBc);
    persistDb();
    broadcastEvent('BROADCASTS_UPDATED', { broadcasts: db.broadcasts, latest: newBc.is_published ? newBc : null });
    if (newBc.is_published && newBc.jenis === 'notif') {
      sendTelegramBroadcastNotification(newBc.judul, newBc.pesan);
    }
    res.json({ broadcast: newBc, broadcasts: db.broadcasts });
  });

  app.patch('/api/owner/broadcasts/:id', (req, res) => {
    const actor = assertOwner(req, res);
    if (!actor) return;
    const bc = db.broadcasts.find((b) => b.id === req.params.id);
    if (!bc) return res.status(404).json({ error: 'Broadcast ga ketemu!' });
    bc.is_published = Boolean(req.body?.is_published);
    persistDb();
    broadcastEvent('BROADCASTS_UPDATED', { broadcasts: db.broadcasts, latest: bc.is_published ? bc : null });
    res.json({ broadcasts: db.broadcasts });
  });

  app.delete('/api/owner/broadcasts/:id', (req, res) => {
    const actor = assertOwner(req, res);
    if (!actor) return;
    db.broadcasts = db.broadcasts.filter((b) => b.id !== req.params.id);
    persistDb();
    broadcastEvent('BROADCASTS_UPDATED', { broadcasts: db.broadcasts });
    res.json({ broadcasts: db.broadcasts });
  });

  // Giveaways (Bagi-bagi Coin with Start & End Time)
  app.post('/api/owner/giveaways', (req, res) => {
    const actor = assertOwner(req, res);
    if (!actor) return;
    const { per_orang, jumlah_orang, mulai_pada, selesai_pada } = req.body || {};
    const perOrg = Number(per_orang);
    const jmlOrg = Number(jumlah_orang);
    if (!perOrg || perOrg <= 0 || !jmlOrg || jmlOrg <= 0) {
      return res.status(400).json({ error: 'Jumlah coin dan kuota harus lebih dari 0!' });
    }
    const startISO = mulai_pada ? new Date(mulai_pada).toISOString() : new Date().toISOString();
    const endISO = selesai_pada
      ? new Date(selesai_pada).toISOString()
      : new Date(new Date(startISO).getTime() + 60 * 60000).toISOString();

    if (new Date(endISO).getTime() <= new Date(startISO).getTime()) {
      return res.status(400).json({ error: 'Jam selesai harus lebih lambat dari jam mulai!' });
    }

    const now = Date.now();
    const newGw: CoinGiveaway = {
      id: `gw-${Date.now()}`,
      dibuat_oleh: actor.user_id,
      per_orang: perOrg,
      jumlah_orang: jmlOrg,
      total_coin: perOrg * jmlOrg,
      mulai_pada: startISO,
      selesai_pada: endISO,
      status: now >= new Date(startISO).getTime() ? 'active' : 'upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
      claims: [],
    };
    db.giveaways.unshift(newGw);
    persistDb();
    broadcastEvent('GIVEAWAYS_UPDATED', { giveaways: db.giveaways });
    res.json({ giveaway: newGw, giveaways: db.giveaways });
  });

  app.delete('/api/owner/giveaways/:id', (req, res) => {
    const actor = assertOwner(req, res);
    if (!actor) return;
    db.giveaways = db.giveaways.filter((g) => g.id !== req.params.id);
    persistDb();
    broadcastEvent('GIVEAWAYS_UPDATED', { giveaways: db.giveaways });
    res.json({ giveaways: db.giveaways });
  });

  // Claim Giveaway (1x per user, checks start/end time & quota)
  app.post('/api/giveaways/:id/claim', (req, res) => {
    const { user_id } = req.body || {};
    const user = db.users[String(user_id)];
    const gw = db.giveaways.find((g) => g.id === req.params.id);
    if (!user || !gw || !gw.is_active) return res.status(404).json({ error: 'Bagi-bagi udah ga aktif!' });

    const now = Date.now();
    if (now < new Date(gw.mulai_pada).getTime()) {
      return res.status(400).json({ error: 'Bagi-bagi belum mulai! Tunggu countdown beres.' });
    }
    if (now >= new Date(gw.selesai_pada).getTime()) {
      gw.status = 'ended';
      persistDb();
      broadcastEvent('GIVEAWAYS_UPDATED', { giveaways: db.giveaways });
      return res.status(400).json({ error: 'Waktu bagi-bagi udah abis!' });
    }
    if (gw.claims.length >= gw.jumlah_orang) {
      gw.status = 'ended';
      persistDb();
      broadcastEvent('GIVEAWAYS_UPDATED', { giveaways: db.giveaways });
      return res.status(400).json({ error: 'Kuota bagi-bagi udah habis!' });
    }
    if (gw.claims.some((c) => c.user_id === user.user_id)) {
      return res.status(400).json({ error: 'Lu udah claim bagi-bagi ini!' });
    }

    gw.claims.push({
      user_id: user.user_id,
      nama: user.nama,
      username: user.username,
      jumlah: gw.per_orang,
      created_at: new Date().toISOString(),
    });
    if (gw.claims.length >= gw.jumlah_orang) {
      gw.status = 'ended';
    } else {
      gw.status = 'active';
    }

    const isOwner = isOwnerUsername(user.username);
    if (!isOwner) {
      user.coin += gw.per_orang;
      addCoinHistory(user.user_id, 'tambah', gw.per_orang, 'Claim Bagi-bagi Coin dari Faiz');
    }

    persistDb();
    broadcastEvent('GIVEAWAYS_UPDATED', { giveaways: db.giveaways });
    broadcastEvent('USER_UPDATED', { user });
    res.json({
      profile: user,
      giveaways: db.giveaways,
      amount: gw.per_orang,
      coinHistory: db.coinHistory[user.user_id] || [],
    });
  });

  // Flash Sales (Start & End Time, stok, border)
  app.post('/api/owner/flashsales', (req, res) => {
    const actor = assertOwner(req, res);
    if (!actor) return;
    const { border_id, border_nama, harga_normal, harga_flash, stok, mulai_pada, selesai_pada } = req.body || {};
    if (!border_id || border_id === 'raja-quiz') {
      return res.status(400).json({ error: 'Border ga valid!' });
    }
    const startISO = mulai_pada ? new Date(mulai_pada).toISOString() : new Date().toISOString();
    const endISO = selesai_pada
      ? new Date(selesai_pada).toISOString()
      : new Date(new Date(startISO).getTime() + 60 * 60000).toISOString();

    if (new Date(endISO).getTime() <= new Date(startISO).getTime()) {
      return res.status(400).json({ error: 'Jam selesai harus lebih lambat dari jam mulai!' });
    }

    const now = Date.now();
    const stokNum = Math.max(1, Number(stok || 5));
    const newFs: FlashSale = {
      id: `fs-${Date.now()}`,
      border_id,
      border_nama: border_nama || border_id.toUpperCase(),
      harga_normal: Number(harga_normal || 1000),
      harga_flash: Math.max(0, Number(harga_flash ?? 100)),
      stok: stokNum,
      sisa_stok: stokNum,
      mulai_pada: startISO,
      selesai_pada: endISO,
      status: now >= new Date(startISO).getTime() ? 'active' : 'upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
      claims: [],
    };
    db.flashSales.unshift(newFs);
    persistDb();
    broadcastEvent('FLASHSALES_UPDATED', { flashSales: db.flashSales });
    res.json({ flashSale: newFs, flashSales: db.flashSales });
  });

  app.delete('/api/owner/flashsales/:id', (req, res) => {
    const actor = assertOwner(req, res);
    if (!actor) return;
    db.flashSales = db.flashSales.filter((f) => f.id !== req.params.id);
    persistDb();
    broadcastEvent('FLASHSALES_UPDATED', { flashSales: db.flashSales });
    res.json({ flashSales: db.flashSales });
  });

  // Buy Flash Sale (Owner Coin NEVER decreases!)
  app.post('/api/flashsales/:id/buy', (req, res) => {
    const { user_id } = req.body || {};
    const user = db.users[String(user_id)];
    const fsItem = db.flashSales.find((f) => f.id === req.params.id);
    if (!user || !fsItem || !fsItem.is_active) return res.status(404).json({ error: 'Flash Sale udah ga aktif!' });

    const now = Date.now();
    if (now < new Date(fsItem.mulai_pada).getTime()) {
      return res.status(400).json({ error: 'Flash Sale belum mulai! Tunggu countdown beres.' });
    }
    if (now >= new Date(fsItem.selesai_pada).getTime()) {
      fsItem.status = 'ended';
      persistDb();
      broadcastEvent('FLASHSALES_UPDATED', { flashSales: db.flashSales });
      return res.status(400).json({ error: 'Waktu Flash Sale udah lewat!' });
    }
    if (fsItem.sisa_stok <= 0) {
      fsItem.status = 'ended';
      persistDb();
      broadcastEvent('FLASHSALES_UPDATED', { flashSales: db.flashSales });
      return res.status(400).json({ error: 'Stok Flash Sale udah habis!' });
    }
    if (fsItem.claims.some((c) => c.user_id === user.user_id)) {
      return res.status(400).json({ error: 'Lu udah beli dari Flash Sale ini!' });
    }

    const isOwner = isOwnerUsername(user.username);
    if (!isOwner && user.coin < fsItem.harga_flash) {
      return res.status(400).json({ error: `Coin lu kurang! Butuh ${fsItem.harga_flash} Coin.` });
    }

    fsItem.sisa_stok -= 1;
    fsItem.claims.push({
      user_id: user.user_id,
      nama: user.nama,
      username: user.username,
      created_at: new Date().toISOString(),
    });
    if (fsItem.sisa_stok <= 0) fsItem.status = 'ended';

    db.userBorders[user.user_id] = Array.from(new Set([...(db.userBorders[user.user_id] || ['pemula']), fsItem.border_id]));
    if (!isOwner) {
      user.coin -= fsItem.harga_flash;
      user.total_hiasan_coin += fsItem.harga_flash;
      addCoinHistory(user.user_id, 'kurang', fsItem.harga_flash, `Flash Sale Border ${fsItem.border_nama}`);
    }
    user.border_saat_ini = fsItem.border_id;
    if (user.decorations) user.decorations.warna = 'default';

    persistDb();
    broadcastEvent('FLASHSALES_UPDATED', { flashSales: db.flashSales });
    broadcastEvent('USER_UPDATED', { user, ownedBorders: db.userBorders[user.user_id] });
    res.json({
      profile: user,
      ownedBorders: db.userBorders[user.user_id],
      flashSales: db.flashSales,
      coinHistory: db.coinHistory[user.user_id] || [],
    });
  });

  // Redeem Codes (Create / Publish / Delete / Claim 1x per user)
  app.post('/api/owner/redeem-codes', (req, res) => {
    const actor = assertOwner(req, res);
    if (!actor) return;
    const { kode, hadiah_type, hadiah_coin, hadiah_border, max_orang, mulai_pada, selesai_pada, is_published } = req.body || {};
    const cleanKode = String(kode || '').trim().toUpperCase();
    if (!cleanKode) return res.status(400).json({ error: 'Kode wajib diisi!' });
    if (db.redeemCodes.some((r) => r.kode === cleanKode)) {
      return res.status(400).json({ error: `Kode "${cleanKode}" udah ada!` });
    }

    const startISO = mulai_pada ? new Date(mulai_pada).toISOString() : new Date().toISOString();
    const endISO = selesai_pada
      ? new Date(selesai_pada).toISOString()
      : new Date(new Date(startISO).getTime() + 24 * 60 * 60000).toISOString();

    if (new Date(endISO).getTime() <= new Date(startISO).getTime()) {
      return res.status(400).json({ error: 'Jam selesai harus lebih lambat dari jam mulai!' });
    }

    const newRedeem: RedeemCode = {
      id: `rd-${Date.now()}`,
      kode: cleanKode,
      hadiah_type: hadiah_type === 'border' ? 'border' : 'coin',
      hadiah_coin: hadiah_type === 'border' ? undefined : Number(hadiah_coin || 100),
      hadiah_border: hadiah_type === 'border' ? String(hadiah_border || 'naga') : undefined,
      max_orang: Math.max(1, Number(max_orang || 50)),
      dipakai_count: 0,
      mulai_pada: startISO,
      selesai_pada: endISO,
      is_published: is_published !== false,
      claimed_by: [],
      claims: [],
      created_at: new Date().toISOString(),
    };

    db.redeemCodes.unshift(newRedeem);
    persistDb();
    broadcastEvent('REDEEM_CODES_UPDATED', { redeemCodes: db.redeemCodes });
    res.json({ redeemCode: newRedeem, redeemCodes: db.redeemCodes });
  });

  app.patch('/api/owner/redeem-codes/:id', (req, res) => {
    const actor = assertOwner(req, res);
    if (!actor) return;
    const rc = db.redeemCodes.find((r) => r.id === req.params.id);
    if (!rc) return res.status(404).json({ error: 'Kode ga ketemu!' });
    rc.is_published = Boolean(req.body?.is_published);
    persistDb();
    broadcastEvent('REDEEM_CODES_UPDATED', { redeemCodes: db.redeemCodes });
    res.json({ redeemCodes: db.redeemCodes });
  });

  app.delete('/api/owner/redeem-codes/:id', (req, res) => {
    const actor = assertOwner(req, res);
    if (!actor) return;
    db.redeemCodes = db.redeemCodes.filter((r) => r.id !== req.params.id);
    persistDb();
    broadcastEvent('REDEEM_CODES_UPDATED', { redeemCodes: db.redeemCodes });
    res.json({ redeemCodes: db.redeemCodes });
  });

  app.post('/api/redeem-codes/claim', (req, res) => {
    const { user_id, kode } = req.body || {};
    const user = db.users[String(user_id)];
    const cleanKode = String(kode || '').trim().toUpperCase();
    if (!user) return res.status(401).json({ error: 'User belum login!' });
    if (!cleanKode) return res.status(400).json({ error: 'Masukin kodenya dulu bro!' });

    const rc = db.redeemCodes.find((r) => r.kode === cleanKode && r.is_published);
    if (!rc) return res.status(404).json({ error: 'Kode salah / belum dipublish / udah dihapus!' });

    const now = Date.now();
    if (now < new Date(rc.mulai_pada).getTime()) {
      return res.status(400).json({ error: 'Kode redeem ini belum masuk jam mulai!' });
    }
    if (now >= new Date(rc.selesai_pada).getTime()) {
      return res.status(400).json({ error: 'Waktu kode redeem ini udah lewat!' });
    }
    if (rc.dipakai_count >= rc.max_orang) {
      return res.status(400).json({ error: 'Kuota kode redeem udah habis!' });
    }
    if (rc.claimed_by.includes(user.user_id)) {
      return res.status(400).json({ error: 'Lu udah pernah claim kode ini!' });
    }

    rc.dipakai_count += 1;
    rc.claimed_by.push(user.user_id);

    const isOwner = isOwnerUsername(user.username);
    let rewardText = '';
    if (rc.hadiah_type === 'coin' && rc.hadiah_coin) {
      if (!isOwner) {
        user.coin += rc.hadiah_coin;
        addCoinHistory(user.user_id, 'tambah', rc.hadiah_coin, `Redeem Kode: ${rc.kode}`);
      }
      rewardText = `🎉 Kode Berhasil! Lu dapet ${rc.hadiah_coin} Coin!`;
    } else if (rc.hadiah_type === 'border' && rc.hadiah_border) {
      db.userBorders[user.user_id] = Array.from(new Set([...(db.userBorders[user.user_id] || ['pemula']), rc.hadiah_border]));
      rewardText = `🎉 Lu dapet Border ${rc.hadiah_border.toUpperCase()} Gratis!`;
    }

    if (!rc.claims) rc.claims = [];
    rc.claims.unshift({
      user_id: user.user_id,
      nama: user.nama,
      username: user.username,
      reward_text: rc.hadiah_type === 'coin' ? `+${rc.hadiah_coin} Coin` : `Border ${rc.hadiah_border?.toUpperCase()}`,
      created_at: new Date().toISOString(),
    });

    persistDb();
    broadcastEvent('REDEEM_CODES_UPDATED', { redeemCodes: db.redeemCodes });
    broadcastEvent('USER_UPDATED', { user, ownedBorders: db.userBorders[user.user_id] });

    res.json({
      message: rewardText,
      profile: user,
      ownedBorders: db.userBorders[user.user_id],
      redeemCodes: db.redeemCodes,
      coinHistory: db.coinHistory[user.user_id] || [],
    });
  });

  // Owner Give Coin directly to user (Owner coin NEVER decreases!)
  app.post('/api/owner/give-coin', (req, res) => {
    const actor = assertOwner(req, res);
    if (!actor) return;
    const { targetUserId, amount } = req.body || {};
    const target = db.users[String(targetUserId)];
    const amt = Number(amount || 0);
    if (!target || amt <= 0) return res.status(400).json({ error: 'Data ga valid!' });
    if (!isOwnerUsername(target.username)) {
      target.coin += amt;
      addCoinHistory(target.user_id, 'tambah', amt, 'Hadiah langsung dari Owner Faiz');
    }
    persistDb();
    broadcastEvent('USER_UPDATED', { user: target });
    res.json({ user: target });
  });

  // 20. FEED KOMUNITAS ENDPOINTS (ZERO COIN FROM POST / LIKE / COMMENT)
  app.get('/api/posts', (_req, res) => {
    res.json({
      posts: db.posts || [],
      likes: db.feedLikes || [],
      comments: db.feedComments || [],
    });
  });

  app.post('/api/posts', (req, res) => {
    const { user_id, image_url, caption, tag } = req.body || {};
    const user = db.users[String(user_id)];
    if (!user) return res.status(401).json({ error: 'User belum login!' });
    if (user.is_banned) return res.status(403).json({ error: 'Akun lu lagi di-banned Owner!' });

    const imgStr = String(image_url || '').trim();
    if (!imgStr || imgStr.startsWith('data:video/')) {
      return res.status(400).json({ error: 'Wajib upload foto (bukan video)!' });
    }

    const today = getTodayKey();
    const todayCount = (db.posts || []).filter(
      (p) => p.user_id === user.user_id && p.created_at.startsWith(today)
    ).length;
    if (!isOwnerUsername(user.username) && todayCount >= 3) {
      return res.status(400).json({ error: 'Maksimal 3 post per hari udah tercapai! Besok lagi ya.' });
    }

    const cleanCaption = filterKataKasarServer(String(caption || '').trim());
    const newPost: FeedPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      user_id: user.user_id,
      nama: user.nama,
      username: user.username,
      foto_profil: user.foto,
      border: user.border_saat_ini,
      custom_text: user.custom_text,
      image_url: imgStr,
      caption: cleanCaption,
      tag: String(tag || 'Nobar').trim() || 'Nobar',
      likes_count: 0,
      comments_count: 0,
      is_pinned: false,
      reports_count: 0,
      reported_by: [],
      is_hidden: false,
      created_at: new Date().toISOString(),
    };

    if (!db.posts) db.posts = [];
    db.posts.unshift(newPost);
    persistDb();
    broadcastEvent('POST_CREATED', { post: newPost });
    res.json({ post: newPost });
  });

  app.delete('/api/posts/:postId', (req, res) => {
    const { postId } = req.params;
    const actorId = String(req.body?.user_id || req.query.user_id || '');
    const actor = db.users[actorId];
    const post = (db.posts || []).find((p) => p.id === postId);
    if (!post) return res.status(404).json({ error: 'Postingan ga ketemu!' });
    if (post.user_id !== actorId && !isOwnerUsername(actor?.username)) {
      return res.status(403).json({ error: 'Lu ga berhak hapus postingan ini!' });
    }

    db.posts = (db.posts || []).filter((p) => p.id !== postId);
    db.feedLikes = (db.feedLikes || []).filter((l) => l.post_id !== postId);
    db.feedComments = (db.feedComments || []).filter((c) => c.post_id !== postId);
    persistDb();
    broadcastEvent('POST_DELETED', { postId });
    res.json({ ok: true });
  });

  app.post('/api/posts/:postId/like', (req, res) => {
    const { postId } = req.params;
    const { user_id } = req.body || {};
    const user = db.users[String(user_id)];
    const post = (db.posts || []).find((p) => p.id === postId);
    if (!user || !post) return res.status(404).json({ error: 'Postingan atau user ga ketemu!' });
    if (user.is_banned) return res.status(403).json({ error: 'Akun lu lagi di-banned Owner!' });

    if (!db.feedLikes) db.feedLikes = [];
    const existingIdx = db.feedLikes.findIndex((l) => l.post_id === postId && l.user_id === user.user_id);
    let liked = false;
    if (existingIdx >= 0) {
      db.feedLikes.splice(existingIdx, 1);
      liked = false;
    } else {
      const newLike: FeedLike = {
        id: `like-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        post_id: postId,
        user_id: user.user_id,
        nama: user.nama,
        username: user.username,
        foto_profil: user.foto,
        border: user.border_saat_ini,
        created_at: new Date().toISOString(),
      };
      db.feedLikes.unshift(newLike);
      liked = true;
    }

    const postLikes = db.feedLikes.filter((l) => l.post_id === postId);
    post.likes_count = postLikes.length;
    persistDb();
    broadcastEvent('LIKE_UPDATED', { postId, likes_count: post.likes_count, postLikes });
    res.json({ liked, likes_count: post.likes_count, postLikes });
  });

  app.post('/api/posts/:postId/comments', (req, res) => {
    const { postId } = req.params;
    const { user_id, isi, parent_id, reply_to_nama } = req.body || {};
    const user = db.users[String(user_id)];
    const post = (db.posts || []).find((p) => p.id === postId);
    if (!user || !post) return res.status(404).json({ error: 'Postingan atau user ga ketemu!' });
    if (user.is_banned) return res.status(403).json({ error: 'Akun lu lagi di-banned Owner!' });

    const cleanIsi = filterKataKasarServer(String(isi || '').trim());
    if (!cleanIsi) return res.status(400).json({ error: 'Komentar gaboleh kosong!' });

    const newComment: FeedComment = {
      id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      post_id: postId,
      user_id: user.user_id,
      nama: user.nama,
      username: user.username,
      foto_profil: user.foto,
      border: user.border_saat_ini,
      isi: cleanIsi,
      parent_id: parent_id || null,
      reply_to_nama: reply_to_nama || null,
      likes_count: 0,
      liked_by: [],
      created_at: new Date().toISOString(),
    };

    if (!db.feedComments) db.feedComments = [];
    db.feedComments.push(newComment);
    post.comments_count = db.feedComments.filter((c) => c.post_id === postId).length;
    persistDb();
    broadcastEvent('COMMENT_ADDED', { postId, comment: newComment, comments_count: post.comments_count });
    res.json({ comment: newComment, comments_count: post.comments_count });
  });

  app.delete('/api/comments/:commentId', (req, res) => {
    const { commentId } = req.params;
    const actorId = String(req.body?.user_id || req.query.user_id || '');
    const actor = db.users[actorId];
    const comment = (db.feedComments || []).find((c) => c.id === commentId);
    if (!comment) return res.status(404).json({ error: 'Komentar ga ketemu!' });
    const post = (db.posts || []).find((p) => p.id === comment.post_id);
    const canDelete =
      comment.user_id === actorId ||
      post?.user_id === actorId ||
      isOwnerUsername(actor?.username);
    if (!canDelete) return res.status(403).json({ error: 'Lu ga berhak hapus komentar ini!' });

    const postId = comment.post_id;
    db.feedComments = (db.feedComments || []).filter(
      (c) => c.id !== commentId && c.parent_id !== commentId
    );
    const newCount = db.feedComments.filter((c) => c.post_id === postId).length;
    if (post) post.comments_count = newCount;
    persistDb();
    broadcastEvent('COMMENT_DELETED', { postId, commentId, comments_count: newCount });
    res.json({ ok: true, postId, comments_count: newCount });
  });

  app.post('/api/comments/:commentId/like', (req, res) => {
    const { commentId } = req.params;
    const { user_id } = req.body || {};
    const user = db.users[String(user_id)];
    const comment = (db.feedComments || []).find((c) => c.id === commentId);
    if (!user || !comment) return res.status(404).json({ error: 'Komentar atau user ga ketemu!' });
    if (user.is_banned) return res.status(403).json({ error: 'Akun lu lagi di-banned Owner!' });

    if (!Array.isArray(comment.liked_by)) comment.liked_by = [];
    if (comment.liked_by.includes(user.user_id)) {
      comment.liked_by = comment.liked_by.filter((id) => id !== user.user_id);
    } else {
      comment.liked_by.push(user.user_id);
    }
    comment.likes_count = comment.liked_by.length;
    persistDb();
    broadcastEvent('COMMENT_UPDATED', { comment });
    res.json({ comment });
  });

  app.post('/api/posts/:postId/report', (req, res) => {
    const { postId } = req.params;
    const { user_id } = req.body || {};
    const user = db.users[String(user_id)];
    const post = (db.posts || []).find((p) => p.id === postId);
    if (!user || !post) return res.status(404).json({ error: 'Postingan ga ketemu!' });

    if (!Array.isArray(post.reported_by)) post.reported_by = [];
    if (post.reported_by.includes(user.user_id)) {
      return res.status(400).json({ error: 'Lu udah pernah report postingan ini!' });
    }
    post.reported_by.push(user.user_id);
    post.reports_count = post.reported_by.length;
    if (post.reports_count >= 3) {
      post.is_hidden = true;
    }
    persistDb();
    broadcastEvent('POST_UPDATED', { post });
    res.json({ post });
  });

  app.post('/api/owner/posts/:postId/pin', (req, res) => {
    const actor = assertOwner(req, res);
    if (!actor) return;
    const post = (db.posts || []).find((p) => p.id === req.params.postId);
    if (!post) return res.status(404).json({ error: 'Postingan ga ketemu!' });
    post.is_pinned = !post.is_pinned;
    persistDb();
    broadcastEvent('POST_UPDATED', { post });
    res.json({ post });
  });

  app.post('/api/owner/users/:targetUserId/ban', (req, res) => {
    const actor = assertOwner(req, res);
    if (!actor) return;
    const target = db.users[req.params.targetUserId];
    if (!target) return res.status(404).json({ error: 'User ga ketemu!' });
    if (isOwnerUsername(target.username)) {
      return res.status(400).json({ error: 'Gabisa ban Owner!' });
    }
    target.is_banned = !Boolean(target.is_banned);
    persistDb();
    broadcastEvent('USER_UPDATED', { user: target });
    res.json({ user: target });
  });

  // Vite middleware in dev OR static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`NOBAR KUY server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
