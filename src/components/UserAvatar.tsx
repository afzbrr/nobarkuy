import React from 'react';
import { ALL_BORDERS, DECORATION_OPTIONS } from '../data/borders';
import { BorderDecorations } from '../types';

interface UserAvatarProps {
  foto: string;
  nama: string;
  borderId?: string;
  customText?: string;
  decorations?: BorderDecorations;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showCustomText?: boolean;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  foto,
  nama,
  borderId = 'pemula',
  customText,
  decorations,
  size = 'md',
  showCustomText = false,
  className = '',
}) => {
  const borderDef = ALL_BORDERS.find((b) => b.id === borderId) || ALL_BORDERS[0];

  const sizeMap = {
    xs: {
      outer: 'w-7 h-7',
      inner: 'w-[22px] h-[22px]',
      textSize: 'text-[8px]',
      textMargin: '-mt-0.5',
      sticker: 'text-[8px] -bottom-0.5 -right-0.5',
      topBadge: 'text-[9px] -top-1.5',
    },
    sm: {
      outer: 'w-9 h-9',
      inner: 'w-[30px] h-[30px]',
      textSize: 'text-[9px]',
      textMargin: 'mt-0.5',
      sticker: 'text-[9px] bottom-0 right-0',
      topBadge: 'text-[10px] -top-2',
    },
    md: {
      outer: 'w-12 h-12',
      inner: 'w-10 h-10',
      textSize: 'text-[10px]',
      textMargin: 'mt-1',
      sticker: 'text-[10px] bottom-0 right-0',
      topBadge: 'text-xs -top-2.5',
    },
    lg: {
      outer: 'w-16 h-16',
      inner: 'w-[54px] h-[54px]',
      textSize: 'text-[10.5px]',
      textMargin: 'mt-1.5',
      sticker: 'text-[11px] bottom-0.5 right-0.5',
      topBadge: 'text-sm -top-3',
    },
    xl: {
      outer: 'w-20 h-20',
      inner: 'w-[68px] h-[68px]',
      textSize: 'text-[11px]',
      textMargin: 'mt-2',
      sticker: 'text-[12px] bottom-1 right-1',
      topBadge: 'text-base -top-3.5',
    },
    '2xl': {
      outer: 'w-28 h-28',
      inner: 'w-24 h-24',
      textSize: 'text-[12px]',
      textMargin: 'mt-2.5',
      sticker: 'text-[14px] bottom-1.5 right-1.5',
      topBadge: 'text-xl -top-4',
    },
  }[size];

  const bingkaiType = decorations?.bingkai || 'tipis';
  const animOverride = decorations?.animasi || 'none';
  const customColorHex =
    decorations?.warna && decorations.warna !== 'default'
      ? DECORATION_OPTIONS.warna.find((w) => w.id === decorations.warna)?.hex
      : undefined;

  const stickerSymbol =
    decorations?.sticker && decorations.sticker.length > 0 && decorations.sticker[0] !== 'none'
      ? DECORATION_OPTIONS.sticker.find((s) => s.id === decorations.sticker[0])?.symbol
      : borderDef.cornerSticker || '';

  // Determine animation class from explicit decoration override OR border definition
  let animClass = '';
  if (animOverride === 'goyang') {
    animClass = 'animate-float-subtle';
  } else if (animOverride === 'kedip') {
    animClass = 'animate-subtle-pulse';
  } else if (animOverride === 'muter') {
    animClass = 'animate-spin-slow';
  } else if (borderDef.animationType === 'pulse') {
    animClass = 'animate-border-pulse';
  } else if (borderDef.animationType === 'spin' || borderDef.animationType === 'spin-shimmer') {
    animClass = 'animate-spin-slow';
  }

  // Bingkai overrides glow/border thickness cleanly
  let ringShadow = borderDef.glowColor ? `0 0 12px ${borderDef.glowColor}` : undefined;
  if (bingkaiType === 'api') {
    ringShadow = '0 0 14px rgba(234, 88, 12, 0.7)';
  } else if (bingkaiType === 'berlian') {
    ringShadow = '0 0 14px rgba(103, 232, 249, 0.65)';
  } else if (bingkaiType === 'tebal-emas') {
    ringShadow = '0 0 14px rgba(212, 175, 55, 0.65)';
  }

  const hasGradient = !customColorHex && Boolean(borderDef.conicGradient || borderDef.linearGradient);

  const getRingStyle = (): React.CSSProperties => {
    if (customColorHex) {
      return {
        background: customColorHex,
        boxShadow: ringShadow || `0 0 10px ${customColorHex}66`,
      };
    }
    if (borderDef.conicGradient) {
      return {
        background: borderDef.conicGradient,
        boxShadow: ringShadow,
      };
    }
    if (borderDef.linearGradient) {
      return {
        background: borderDef.linearGradient,
        boxShadow: ringShadow,
      };
    }
    return {
      background: borderDef.warnaUtama || '#52525B',
      boxShadow: ringShadow,
    };
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className={`relative ${sizeMap.outer} flex items-center justify-center shrink-0`}>
        {/* Top Crown / Special Badge */}
        {borderDef.topBadge && (
          <span
            className={`absolute ${sizeMap.topBadge} left-1/2 -translate-x-1/2 z-30 leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pointer-events-none`}
          >
            {borderDef.topBadge}
          </span>
        )}

        {/* Border Ring */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-300 ${
            hasGradient ? '' : 'ring-1 ring-white/10'
          } ${animClass}`}
          style={getRingStyle()}
        />

        {/* Shimmer overlay across border if defined */}
        {(borderDef.hasShimmer || bingkaiType === 'berlian') && (
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-[5]">
            <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent animate-shimmer" />
          </div>
        )}

        {/* Inner Dark Separator + User Avatar */}
        <div className={`relative z-10 ${sizeMap.inner} rounded-full overflow-hidden bg-[#141414] ring-[2px] ring-[#0A0A0A]`}>
          <img
            src={foto || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(nama || 'user')}`}
            alt={nama}
            className="w-full h-full object-cover rounded-full"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(nama || 'user')}`;
            }}
          />
        </div>

        {/* Corner Sticker */}
        {stickerSymbol && (
          <span
            className={`absolute z-20 ${sizeMap.sticker} leading-none text-[#D4AF37] drop-shadow-sm select-none pointer-events-none`}
          >
            {stickerSymbol}
          </span>
        )}
      </div>

      {/* Custom Text below border */}
      {showCustomText && customText && (
        <span
          className={`font-heading font-bold uppercase tracking-tighter text-stone-200 ${sizeMap.textSize} ${sizeMap.textMargin} max-w-[120px] truncate text-center leading-tight drop-shadow-sm`}
        >
          {customText}
        </span>
      )}
    </div>
  );
};
