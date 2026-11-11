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

  // Sizes in pixels
  const sizeMap = {
    xs: { outer: 'w-7 h-7', inner: 'w-6 h-6', textSize: 'text-[8px]', textMargin: '-mt-0.5', sticker: 'text-[8px] -bottom-0.5 -right-0.5' },
    sm: { outer: 'w-9 h-9', inner: 'w-8 h-8', textSize: 'text-[9px]', textMargin: 'mt-0.5', sticker: 'text-[9px] bottom-0 right-0' },
    md: { outer: 'w-12 h-12', inner: 'w-10 h-10', textSize: 'text-[10px]', textMargin: 'mt-1', sticker: 'text-[10px] bottom-0 right-0' },
    lg: { outer: 'w-16 h-16', inner: 'w-14 h-14', textSize: 'text-[10.5px]', textMargin: 'mt-1.5', sticker: 'text-[11px] bottom-0.5 right-0.5' },
    xl: { outer: 'w-20 h-20', inner: 'w-[72px] h-[72px]', textSize: 'text-[11px]', textMargin: 'mt-2', sticker: 'text-[12px] bottom-1 right-1' },
    '2xl': { outer: 'w-28 h-28', inner: 'w-24 h-24', textSize: 'text-[12px]', textMargin: 'mt-2.5', sticker: 'text-[14px] bottom-1.5 right-1.5' },
  }[size];

  // Decoration styles
  const bingkaiType = decorations?.bingkai || 'tipis';
  const animType = decorations?.animasi || 'none';
  const customColor = decorations?.warna
    ? DECORATION_OPTIONS.warna.find((w) => w.id === decorations.warna)?.hex
    : undefined;
  const stickerSymbol = decorations?.sticker?.[0]
    ? DECORATION_OPTIONS.sticker.find((s) => s.id === decorations.sticker[0])?.symbol
    : borderDef.cornerSticker || '';

  // Animation classes
  let animClass = '';
  if (animType === 'goyang') animClass = 'animate-float-subtle';
  else if (animType === 'kedip') animClass = 'animate-subtle-pulse';
  else if (animType === 'muter' || borderDef.conicGradient) animClass = 'animate-spin-slow';

  // Dynamic Border Color
  const activeBorderColor = customColor || borderDef.warnaUtama || '#27272A';

  // Border frame style
  const getBorderBoxStyle = () => {
    if (borderDef.conicGradient) {
      return {
        background: borderDef.conicGradient,
        boxShadow: borderDef.glowColor ? `0 0 12px ${borderDef.glowColor}` : undefined,
      };
    }
    return {
      borderColor: activeBorderColor,
      boxShadow: borderDef.glowColor ? `0 0 10px ${borderDef.glowColor}` : undefined,
    };
  };

  const isConic = Boolean(borderDef.conicGradient);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Avatar Container */}
      <div className={`relative ${sizeMap.outer} flex items-center justify-center shrink-0`}>
        {/* Border Ring */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-300 ${
            isConic ? '' : 'border-2'
          } ${animClass}`}
          style={getBorderBoxStyle()}
        />

        {/* Shimmer light bar across border if defined */}
        {(borderDef.hasShimmer || bingkaiType === 'berlian') && (
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
            <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" />
          </div>
        )}

        {/* User Image */}
        <div className={`relative z-10 ${sizeMap.inner} rounded-full overflow-hidden bg-[#141414]`}>
          <img
            src={foto || `https://api.dicebear.com/7.x/identicon/svg?seed=${nama}`}
            alt={nama}
            className="w-full h-full object-cover rounded-full"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${nama}`;
            }}
          />
        </div>

        {/* Subtle Corner Sticker (Max 12px, clean, bottom right) */}
        {stickerSymbol && (
          <span
            className={`absolute z-20 ${sizeMap.sticker} leading-none text-[#D4AF37] drop-shadow-sm select-none pointer-events-none`}
          >
            {stickerSymbol}
          </span>
        )}
      </div>

      {/* Custom Text below border (Space Grotesk Bold, Uppercase, Tracking Rapat) */}
      {showCustomText && customText && (
        <span
          className={`font-heading font-bold uppercase tracking-tighter text-stone-200 ${sizeMap.textSize} ${sizeMap.textMargin} max-w-[110px] truncate text-center leading-tight drop-shadow-sm`}
        >
          {customText}
        </span>
      )}
    </div>
  );
};
