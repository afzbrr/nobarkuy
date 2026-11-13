const BAD_WORDS = [
  'anjing',
  'anjir',
  'anjay',
  'babi',
  'bangsat',
  'bajingan',
  'kontol',
  'memek',
  'ngentot',
  'entot',
  'jancok',
  'jancuk',
  'goblok',
  'tolol',
  'bego',
  'idiot',
  'tai',
  'taek',
  'bangke',
  'keparat',
  'brengsek',
  'perek',
  'lonte',
  'pelacur',
  'jalang',
  'asu',
  'jembut',
  'titit',
  'peler',
  'pepek',
  'pantek',
  'pukimak',
  'fuck',
  'fucking',
  'shit',
  'bitch',
  'asshole',
  'dick',
  'pussy',
  'whore',
  'slut',
  'bastard',
  'cunt',
];

const BAD_WORDS_REGEX = new RegExp(`\\b(${BAD_WORDS.join('|')})\\b`, 'gi');

export function filterKataKasar(text: string): string {
  if (!text) return '';
  return text.replace(BAD_WORDS_REGEX, '***');
}

export function formatRelativeTime(isoDate: string): string {
  if (!isoDate) return 'Baru aja';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000));
  if (diffSec < 60) return 'Baru aja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return new Date(isoDate).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Resize image proportionally ONLY if larger than 1280px,
 * preserving 100% of the original aspect ratio (NO crop, NO stretch, NO zoom).
 */
export function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Cuma boleh upload foto/gambar ya, bukan video!'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal baca file foto!'));
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const img = new Image();
      img.onerror = () => reject(new Error('Format foto ga kebaca!'));
      img.onload = () => {
        const maxDim = 1280;
        let targetW = img.naturalWidth || img.width;
        let targetH = img.naturalHeight || img.height;

        if (targetW > maxDim || targetH > maxDim) {
          const scale = maxDim / Math.max(targetW, targetH);
          targetW = Math.round(targetW * scale);
          targetH = Math.round(targetH * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const compressed = canvas.toDataURL('image/jpeg', 0.84);
        resolve(compressed);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
