export type GenreType = 'Horror' | 'Drakor' | 'Anime' | 'Komedi' | 'Action' | 'Galau' | 'Lainnya';

export interface BorderDecorations {
  bingkai: string; // 'tipis' | 'tebal-emas' | 'berlian' | 'hitam-emas' | 'api' | 'pelangi'
  efek: string[]; // ['bintang', 'salju', 'confetti', 'gelembung', 'hati', 'petir', 'kembang-api']
  warna: string; // 'default' | 'merah' | 'biru' | 'ungu' | 'pink' | 'hijau' | 'hitam-emas' | 'abu' | 'emas-matte'
  sticker: string[]; // ['titik-emas', 'bintang-emas']
  animasi: string; // 'none' | 'goyang' | 'kedip' | 'muter'
}

export interface UserProfile {
  user_id: string; // Telegram ID
  nama: string;
  username: string;
  foto: string;
  coin: number; // Owner @istamina is Infinity (represented cleanly via isOwner check)
  poin: number;
  border_saat_ini: string; // e.g. "pemula", "semangat-nobar", "naga"
  custom_text: string;
  total_hiasan_coin: number;
  checkin_terakhir: string | null; // YYYY-MM-DD
  checkin_hari_ke: number; // 1-7
  checkin_total: number;
  total_nonton: number; // Cumulative total rooms watched since join, never resets
  terakhir_nonton: string | null;
  created_at: string;
  decorations: BorderDecorations;
  votes_count: number;
}

export interface Room {
  id: string;
  judul: string;
  host_id: string;
  host_nama: string;
  host_username: string;
  host_foto: string;
  host_border: string;
  host_custom_text?: string;
  genre: GenreType;
  is_private: boolean;
  code_room: string; // 6 digit string
  video_url: string; // YouTube link only
  max_viewers: number; // 1 to 10
  viewers: string[]; // array of user_ids currently in room
  status: 'live' | 'selesai';
  penonton_count: number;
  chats_count: number;
  created_at: string;
}

export interface ChatReadReceipt {
  user_id: string;
  nama: string;
  username: string;
  foto: string;
  border: string;
  read_at: string;
}

export interface ChatReactionUser {
  user_id: string;
  nama: string;
}

export interface ChatMessage {
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
  gift_nama?: string;
  is_host?: boolean;
  is_owner?: boolean;
  is_system?: boolean;
  is_broadcast?: boolean;
  created_at: string;
}

export interface CoinGiveaway {
  id: string;
  dibuat_oleh: string;
  per_orang: number;
  jumlah_orang: number;
  total_coin: number;
  mulai_pada: string; // ISO string
  selesai_pada: string; // ISO string
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

export interface FlashSale {
  id: string;
  border_nama: string;
  border_id: string;
  harga_normal: number;
  harga_flash: number;
  stok: number;
  sisa_stok: number;
  mulai_pada: string; // ISO string
  selesai_pada: string; // ISO string
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

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
}

export interface Poll {
  id: string;
  room_id: string;
  pertanyaan: string;
  pilihan: PollOption[];
  berakhir_pada: string;
  status: 'active' | 'ended';
  created_at: string;
}

export interface Quiz {
  id: string;
  room_id: string;
  pertanyaan: string;
  pilihan: string[];
  jawaban_benar: string;
  status: 'active' | 'ended';
  created_at: string;
  answers: {
    user_id: string;
    jawaban: string;
    benar: boolean;
  }[];
}

export interface RedeemCode {
  id: string;
  kode: string;
  hadiah_type: 'coin' | 'border';
  hadiah_coin?: number;
  hadiah_border?: string;
  max_orang: number;
  dipakai_count: number;
  mulai_pada: string; // ISO string
  selesai_pada: string; // ISO string
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

export interface RouletteWinner {
  id: string;
  user_id: string;
  nama: string;
  username: string;
  foto: string;
  border: string;
  jumlah: number;
  created_at: string;
}

export interface Broadcast {
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

export interface BorderDefinition {
  id: string;
  nama: string;
  kategori: 'starter' | 'nonton' | 'hari_besar' | 'toko' | 'owner' | 'prestasi';
  deskripsi: string;
  syarat: string;
  hargaCoin?: number;
  warnaUtama: string;
  borderThickness: string;
  glowColor?: string;
  conicGradient?: string;
  linearGradient?: string;
  animationType?: 'none' | 'pulse' | 'spin' | 'spin-shimmer';
  hasShimmer?: boolean;
  cornerSticker?: string;
  topBadge?: string;
  bisaDihias: boolean;
}

export interface DailyMission {
  id: string;
  judul: string;
  hadiahCoin: number;
  target: number;
  current: number;
  klaim: boolean;
}

export interface CoinHistoryItem {
  id: string;
  jenis: 'tambah' | 'kurang';
  jumlah: number;
  keterangan: string;
  created_at: string;
}
