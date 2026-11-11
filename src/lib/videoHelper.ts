export interface PresetMovie {
  id: string;
  judul: string;
  genre: string;
  durasi: string;
  deskripsi: string;
  video_url: string;
  poster: string;
}

export const PRESET_MOVIES: PresetMovie[] = [
  {
    id: 'film-horror',
    judul: 'Pengabdi Setan: Malam Jumat Keramat',
    genre: 'Horror',
    durasi: '1j 47m',
    deskripsi: 'Misteri teror rumah tua di pinggir hutan dengan jumpscare seram.',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    poster: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'film-anime',
    judul: 'Jujutsu Kaisen: Kutukan Abadi',
    genre: 'Anime',
    durasi: '1j 35m',
    deskripsi: 'Pertarungan sengit para penyihir jujutsu di distrik Shibuya.',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'film-action',
    judul: 'The Raid: Pertarungan Gedung Maut',
    genre: 'Action',
    durasi: '1j 52m',
    deskripsi: 'Aksi laga tanpa henti pasukan khusus menyerbu sarang mafia.',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'film-drakor',
    judul: 'Queen of Tears: Cinta Konglomerat',
    genre: 'Drakor',
    durasi: '1j 10m',
    deskripsi: 'Kisah drama romantis penuh intrik keluarga chaebol Korea.',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    poster: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'film-komedi',
    judul: 'Agak Laen: Rumah Hantu Kocak',
    genre: 'Komedi',
    durasi: '1j 40m',
    deskripsi: 'Empat sekawan penjaga rumah hantu pasar malam yang bikin ngakak.',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    poster: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=600&q=80',
  },
];

/**
 * Extract YouTube ID from various YouTube URL formats
 */
export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // youtube.com/watch?v=...
  const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) {
    return watchMatch[1];
  }

  // Already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Check if the url is a YouTube link
 */
export function isYouTubeUrl(url: string): boolean {
  return getYouTubeId(url) !== null;
}
