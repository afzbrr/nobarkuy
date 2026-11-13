import {
  UserProfile,
  Room,
  ChatMessage,
  DailyMission,
  CoinHistoryItem,
  GenreType,
  Poll,
  Quiz,
  Broadcast,
  CoinGiveaway,
  FlashSale,
  RedeemCode,
  RouletteWinner,
} from '../types';
import { getWeekKey, getTodayKey, buildWeeklyMissions } from './missions';
import { ALL_BORDERS, DECORATION_OPTIONS } from '../data/borders';
import { GIFT_CATALOG } from '../data/gifts';
import { isOwnerUsername } from './telegram';
import { isYouTubeUrl } from './videoHelper';

export class BackendUnavailableError extends Error {
  constructor(message = 'Backend API tidak tersedia') {
    super(message);
    this.name = 'BackendUnavailableError';
  }
}

interface WeeklyStoredCounters {
  weekKey: string;
  watchedRoomIds: string[];
  chats: number;
  gifts: number;
  votes: number;
  transfers: number;
  claims: Record<string, boolean>;
}

const SNAPSHOT_PREFIX = 'nobarkuy_user_v2_';
const MISSION_PREFIX = 'nobarkuy_missions_v2_';
const ROULETTE_PREFIX = 'nobarkuy_roulette_v2_';

export interface PersistedUserData {
  profile: UserProfile;
  ownedBorders: string[];
  coinHistory: CoinHistoryItem[];
}

export function loadPersistedUser(fallback: UserProfile): PersistedUserData {
  if (!fallback.user_id || typeof window === 'undefined') {
    return {
      profile: fallback,
      ownedBorders: isOwnerUsername(fallback.username) ? ALL_BORDERS.map((b) => b.id) : ['pemula'],
      coinHistory: [],
    };
  }
  try {
    const raw = window.localStorage.getItem(`${SNAPSHOT_PREFIX}${fallback.user_id}`);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedUserData;
      const isOwner = isOwnerUsername(fallback.username);
      const mergedProfile: UserProfile = {
        ...fallback,
        ...parsed.profile,
        // Always lock Telegram real name, username, and photo_url when available
        nama: fallback.nama || parsed.profile?.nama || 'User',
        username: fallback.username || parsed.profile?.username || `user_${fallback.user_id}`,
        foto: fallback.foto || parsed.profile?.foto || '',
        coin: isOwner ? 999999999 : parsed.profile?.coin ?? fallback.coin,
      };
      const owned = isOwner
        ? ALL_BORDERS.map((b) => b.id)
        : Array.from(new Set(['pemula', ...(parsed.ownedBorders || [])]));
      return {
        profile: mergedProfile,
        ownedBorders: owned,
        coinHistory: Array.isArray(parsed.coinHistory) ? parsed.coinHistory : [],
      };
    }
  } catch {
    // ignore storage errors
  }
  return {
    profile: fallback,
    ownedBorders: isOwnerUsername(fallback.username) ? ALL_BORDERS.map((b) => b.id) : ['pemula'],
    coinHistory: [],
  };
}

export function savePersistedUser(profile: UserProfile, ownedBorders: string[], coinHistory: CoinHistoryItem[]) {
  if (!profile.user_id || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      `${SNAPSHOT_PREFIX}${profile.user_id}`,
      JSON.stringify({
        profile,
        ownedBorders,
        coinHistory: coinHistory.slice(0, 60),
      })
    );
  } catch {
    // ignore quota errors
  }
}

function loadWeeklyCounters(userId: string): WeeklyStoredCounters {
  const weekKey = getWeekKey();
  const empty: WeeklyStoredCounters = {
    weekKey,
    watchedRoomIds: [],
    chats: 0,
    gifts: 0,
    votes: 0,
    transfers: 0,
    claims: {},
  };
  if (!userId || typeof window === 'undefined') return empty;
  try {
    const raw = window.localStorage.getItem(`${MISSION_PREFIX}${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as WeeklyStoredCounters;
      if (parsed.weekKey === weekKey) {
        return { ...empty, ...parsed };
      }
    }
  } catch {
    // ignore
  }
  return empty;
}

function saveWeeklyCounters(userId: string, data: WeeklyStoredCounters) {
  if (!userId || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${MISSION_PREFIX}${userId}`, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function getLocalWeeklyMissions(userId: string): DailyMission[] {
  const c = loadWeeklyCounters(userId);
  return buildWeeklyMissions({
    watched: c.watchedRoomIds.length,
    chats: c.chats,
    gifts: c.gifts,
    votes: c.votes,
    transfers: c.transfers,
    claims: c.claims,
  });
}

export function updateLocalWeeklyProgress(
  userId: string,
  action: 'watch' | 'chat' | 'gift' | 'vote' | 'transfer',
  roomId?: string
): DailyMission[] {
  const c = loadWeeklyCounters(userId);
  if (action === 'watch' && roomId) {
    if (!c.watchedRoomIds.includes(roomId)) {
      c.watchedRoomIds.push(roomId);
    }
  } else if (action === 'chat') {
    c.chats += 1;
  } else if (action === 'gift') {
    c.gifts += 1;
  } else if (action === 'vote') {
    c.votes += 1;
  } else if (action === 'transfer') {
    c.transfers += 1;
  }
  saveWeeklyCounters(userId, c);
  return buildWeeklyMissions({
    watched: c.watchedRoomIds.length,
    chats: c.chats,
    gifts: c.gifts,
    votes: c.votes,
    transfers: c.transfers,
    claims: c.claims,
  });
}

export function claimLocalWeeklyMission(
  user: UserProfile,
  ownedBorders: string[],
  coinHistory: CoinHistoryItem[],
  missionId: string
): {
  profile: UserProfile;
  ownedBorders: string[];
  coinHistory: CoinHistoryItem[];
  missions: DailyMission[];
} {
  const c = loadWeeklyCounters(user.user_id);
  const currentList = buildWeeklyMissions({
    watched: c.watchedRoomIds.length,
    chats: c.chats,
    gifts: c.gifts,
    votes: c.votes,
    transfers: c.transfers,
    claims: c.claims,
  });
  const target = currentList.find((m) => m.id === missionId);
  if (!target) throw new Error('Misi ga ketemu!');
  if (c.claims[missionId]) throw new Error('Misi ini udah lu klaim minggu ini!');
  if (target.current < target.target) throw new Error('Misi ini belum kelar!');

  c.claims[missionId] = true;
  saveWeeklyCounters(user.user_id, c);

  const isOwner = isOwnerUsername(user.username);
  const nextCoin = isOwner ? 999999999 : user.coin + target.hadiahCoin;
  const nextProfile: UserProfile = { ...user, coin: nextCoin };
  const nextHistory = isOwner
    ? coinHistory
    : [
        {
          id: `ch-${Date.now()}`,
          jenis: 'tambah' as const,
          jumlah: target.hadiahCoin,
          keterangan: `Misi Selesai: ${target.judul}`,
          created_at: new Date().toISOString(),
        },
        ...coinHistory,
      ].slice(0, 60);

  const updatedMissions = buildWeeklyMissions({
    watched: c.watchedRoomIds.length,
    chats: c.chats,
    gifts: c.gifts,
    votes: c.votes,
    transfers: c.transfers,
    claims: c.claims,
  });
  const allDone = updatedMissions.every((m) => m.klaim);
  const nextOwned = allDone
    ? Array.from(new Set([...ownedBorders, 'misi-selesai']))
    : ownedBorders;

  savePersistedUser(nextProfile, nextOwned, nextHistory);
  return {
    profile: nextProfile,
    ownedBorders: nextOwned,
    coinHistory: nextHistory,
    missions: updatedMissions,
  };
}

export function unlockLocalBordersForStats(profile: UserProfile, owned: string[]): string[] {
  const next = new Set(owned);
  if (profile.total_nonton >= 3) next.add('semangat-nobar');
  if (profile.total_nonton >= 5) next.add('indonesia-garuda');
  if (profile.total_nonton >= 7) next.add('rajin-nobar');
  if (profile.total_nonton >= 14) next.add('setia-nobar');
  if (profile.total_nonton >= 20) next.add('aurora-3d');
  if (profile.total_nonton >= 30) next.add('legenda-nobar');
  if (profile.checkin_total >= 3) next.add('kristal-es');
  if (profile.checkin_total >= 7) next.add('rajin-checkin');
  return Array.from(next);
}

export function createLocalRoomObject(
  user: UserProfile,
  payload: { judul: string; genre: GenreType; is_private: boolean; video_url: string; max_viewers: number },
  existingRooms: Room[]
): Room {
  if (!payload.judul?.trim()) throw new Error('Judul room wajib diisi!');
  if (!isYouTubeUrl(payload.video_url || '')) throw new Error('Link harus link YouTube');
  const maxV = Number(payload.max_viewers);
  if (isNaN(maxV) || maxV < 1 || maxV > 10) throw new Error('Maximal 10 orang (minimal 1 orang)');

  let code = '';
  for (let i = 0; i < 10; i++) {
    const candidate = Math.floor(100000 + Math.random() * 900000).toString();
    if (!existingRooms.some((r) => r.code_room === candidate && r.status === 'live')) {
      code = candidate;
      break;
    }
  }
  if (!code) code = Math.floor(100000 + Math.random() * 900000).toString();

  return {
    id: `room-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    judul: payload.judul.trim(),
    host_id: user.user_id,
    host_nama: user.nama,
    host_username: user.username,
    host_foto: user.foto,
    host_border: user.border_saat_ini,
    host_custom_text: user.custom_text,
    genre: payload.genre || 'Horror',
    is_private: Boolean(payload.is_private),
    code_room: code,
    video_url: payload.video_url.trim(),
    max_viewers: maxV,
    viewers: [user.user_id],
    status: 'live',
    penonton_count: 1,
    chats_count: 0,
    created_at: new Date().toISOString(),
  };
}

export function hasSpunRouletteTodayLocal(userId: string): boolean {
  if (!userId || typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(`${ROULETTE_PREFIX}${userId}_${getTodayKey()}`) === '1';
  } catch {
    return false;
  }
}

export function markSpunRouletteTodayLocal(userId: string) {
  if (!userId || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${ROULETTE_PREFIX}${userId}_${getTodayKey()}`, '1');
  } catch {
    // ignore
  }
}

export function computeDecorationCost(
  user: UserProfile,
  decorations: UserProfile['decorations'],
  customText?: string
): number {
  if (isOwnerUsername(user.username)) return 0;
  let cost = 0;
  if (decorations?.bingkai && decorations.bingkai !== 'tipis') {
    const found = DECORATION_OPTIONS.bingkai.find((b) => b.id === decorations.bingkai);
    cost += found?.harga ?? 150;
  }
  if (decorations?.warna && decorations.warna !== 'default') cost += 100;
  if (decorations?.animasi && decorations.animasi !== 'none') {
    const found = DECORATION_OPTIONS.animasi.find((a) => a.id === decorations.animasi);
    cost += found?.harga ?? 100;
  }
  (decorations?.efek || []).forEach((ef) => {
    if (ef !== 'none') {
      const found = DECORATION_OPTIONS.efek.find((e) => e.id === ef);
      cost += found?.harga ?? 100;
    }
  });
  if (decorations?.sticker && decorations.sticker.length > 0 && decorations.sticker[0] !== 'none') {
    cost += 100;
  }
  if (customText !== undefined && customText.trim().toUpperCase() !== (user.custom_text || '').toUpperCase()) {
    cost += 100;
  }
  return cost;
}

export function getBorderPrice(borderId: string): number | undefined {
  return ALL_BORDERS.find((b) => b.id === borderId)?.hargaCoin;
}

export function getGiftDefinition(giftId: string) {
  return GIFT_CATALOG.find((g) => g.id === giftId);
}

export type FallbackHubState = {
  rooms: Room[];
  chats: Record<string, ChatMessage[]>;
  polls: Record<string, Poll>;
  quizzes: Record<string, Quiz>;
  broadcasts: Broadcast[];
  giveaways: CoinGiveaway[];
  flashSales: FlashSale[];
  redeemCodes: RedeemCode[];
  rouletteWinners: RouletteWinner[];
};
