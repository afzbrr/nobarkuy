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
  const theme = borderDef.themeStyle || 'default';
  const isLarge = size === 'lg' || size === 'xl' || size === '2xl';
  const isStarter = borderDef.id === 'pemula';

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
      inner: 'w-[52px] h-[52px]',
      textSize: 'text-[10.5px]',
      textMargin: 'mt-1.5',
      sticker: 'text-[11px] bottom-0.5 right-0.5',
      topBadge: 'text-sm -top-3',
    },
    xl: {
      outer: 'w-20 h-20',
      inner: 'w-[66px] h-[66px]',
      textSize: 'text-[11px]',
      textMargin: 'mt-2',
      sticker: 'text-[12px] bottom-1 right-1',
      topBadge: 'text-base -top-3.5',
    },
    '2xl': {
      outer: 'w-28 h-28',
      inner: 'w-[92px] h-[92px]',
      textSize: 'text-[12px]',
      textMargin: 'mt-2.5',
      sticker: 'text-[15px] bottom-1 right-1',
      topBadge: 'text-xl -top-4',
    },
  }[size];

  const bingkaiType = decorations?.bingkai || 'tipis';
  const animOverride = decorations?.animasi || 'none';
  const activeEffects = decorations?.efek || [];
  const customColorHex =
    decorations?.warna && decorations.warna !== 'default'
      ? DECORATION_OPTIONS.warna.find((w) => w.id === decorations.warna)?.hex
      : undefined;

  const stickerSymbol =
    decorations?.sticker && decorations.sticker.length > 0 && decorations.sticker[0] !== 'none'
      ? DECORATION_OPTIONS.sticker.find((s) => s.id === decorations.sticker[0])?.symbol
      : borderDef.cornerSticker || '';

  // Determine 3D/theme animation class
  let animClass = '';
  let container3DClass = '';
  if (animOverride === 'goyang') {
    animClass = 'animate-float-subtle';
  } else if (animOverride === 'kedip') {
    animClass = 'animate-subtle-pulse';
  } else if (animOverride === 'muter') {
    animClass = 'animate-spin-slow';
  } else if (theme === 'pinky' || theme === 'purple') {
    animClass = 'animate-spin-slow';
    if (isLarge) container3DClass = 'animate-kawaii-bounce-3d';
  } else if (theme === 'fire') {
    animClass = 'animate-fire-ember-3d';
    if (isLarge) container3DClass = 'animate-border-3d-tilt';
  } else if (theme === 'cyber' || theme === 'space' || theme === 'indonesia' || theme === 'ice' || theme === 'aurora' || theme === 'owner') {
    animClass = 'animate-spin-slow';
    if (isLarge) container3DClass = 'animate-border-3d-tilt';
  } else if (borderDef.animationType === 'pulse') {
    animClass = 'animate-border-pulse';
  } else if (borderDef.animationType === 'spin' || borderDef.animationType === 'spin-shimmer') {
    animClass = 'animate-spin-slow';
  }

  let ringShadow = borderDef.glowColor
    ? `0 0 ${isLarge ? '18px' : '11px'} ${borderDef.glowColor}, inset 0 2px 3px rgba(255,255,255,0.45), inset 0 -2px 4px rgba(0,0,0,0.6)`
    : undefined;

  if (bingkaiType === 'api') {
    ringShadow = '0 0 18px rgba(234, 88, 12, 0.8), inset 0 2px 3px rgba(255,255,255,0.45)';
  } else if (bingkaiType === 'berlian') {
    ringShadow = '0 0 18px rgba(103, 232, 249, 0.8), inset 0 2px 3px rgba(255,255,255,0.6)';
  } else if (bingkaiType === 'tebal-emas') {
    ringShadow = '0 0 18px rgba(212, 175, 55, 0.78), inset 0 2px 3px rgba(255,255,255,0.5)';
  }

  const hasGradient = !customColorHex && Boolean(borderDef.conicGradient || borderDef.linearGradient);

  const getRingStyle = (): React.CSSProperties => {
    if (customColorHex) {
      return {
        background: customColorHex,
        boxShadow: ringShadow || `0 0 12px ${customColorHex}88`,
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
      <div className={`relative ${sizeMap.outer} flex items-center justify-center shrink-0 ${container3DClass}`}>
        {/* Outer 3D Atmospheric Aura (for non-starter borders) */}
        {!isStarter && (
          <div
            className="absolute -inset-1 rounded-full blur-[6px] opacity-55 pointer-events-none"
            style={{ background: borderDef.glowColor || borderDef.warnaUtama }}
          />
        )}

        {/* Theme-specific 3D Orbital / Counter-Rotating Secondary Rings */}
        {!isStarter && theme === 'space' && isLarge && (
          <div className="absolute -inset-3 rounded-full border-[2px] border-cyan-300/75 shadow-[0_0_12px_rgba(34,211,238,0.6)] animate-orbit-ring-3d pointer-events-none z-20" />
        )}

        {!isStarter && theme === 'cyber' && (
          <div className="absolute -inset-1 rounded-full border-[1.5px] border-dashed border-sky-300/80 animate-spin-reverse-slow pointer-events-none z-20" />
        )}

        {!isStarter && (theme === 'purple' || theme === 'pinky') && (
          <div
            className={`absolute -inset-1 rounded-full border-[1.5px] border-dotted animate-spin-reverse-slow pointer-events-none z-20 ${
              theme === 'pinky' ? 'border-pink-200/85' : 'border-purple-200/85'
            }`}
          />
        )}

        {!isStarter && theme === 'fire' && isLarge && (
          <div className="absolute -inset-1.5 rounded-full border-2 border-dashed border-amber-400/70 animate-spin-reverse-slow pointer-events-none z-[15]" />
        )}

        {!isStarter && theme === 'owner' && (
          <div className="absolute -inset-1 rounded-full border-[1.5px] border-dashed border-[#FDE047]/80 animate-spin-reverse-slow pointer-events-none z-20" />
        )}

        {/* Top Crown / Special Badge */}
        {borderDef.topBadge && (
          <span
            className={`absolute ${sizeMap.topBadge} left-1/2 -translate-x-1/2 z-30 leading-none drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)] pointer-events-none ${
              isLarge ? 'animate-float-subtle' : ''
            }`}
          >
            {borderDef.topBadge}
          </span>
        )}

        {/* Main 3D Metallic Border Ring */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-300 ${
            hasGradient ? '' : 'ring-1 ring-white/10'
          } ${animClass}`}
          style={getRingStyle()}
        />

        {/* 3D Glossy Top-Left Specular Bevel */}
        {!isStarter && (
          <div
            className="absolute inset-[1px] rounded-full pointer-events-none z-[4]"
            style={{
              background:
                'linear-gradient(145deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.04) 38%, rgba(0,0,0,0.35) 100%)',
            }}
          />
        )}

        {/* Shimmer sweep across border */}
        {(borderDef.hasShimmer || bingkaiType === 'berlian') && (
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-[6]">
            <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/45 to-transparent animate-shimmer" />
          </div>
        )}

        {/* Theme Floating Particles for Large Previews */}
        {isLarge && !isStarter && (
          <div className="absolute -inset-2 pointer-events-none z-20">
            {theme === 'pinky' && (
              <>
                <span className="absolute top-1 -left-1 text-[9px] animate-particle-up">🩷</span>
                <span className="absolute bottom-2 -right-1 text-[9px] animate-sparkle">✨</span>
              </>
            )}
            {theme === 'purple' && (
              <>
                <span className="absolute top-0 -right-1 text-[9px] animate-sparkle">✦</span>
                <span className="absolute bottom-1 -left-1 text-[9px] animate-particle-up">💜</span>
              </>
            )}
            {theme === 'space' && (
              <>
                <span className="absolute top-0 -left-1 text-[9px] text-cyan-200 animate-sparkle">✦</span>
                <span className="absolute bottom-1 -right-1 text-[9px] text-violet-200 animate-sparkle" style={{ animationDelay: '0.7s' }}>★</span>
              </>
            )}
            {theme === 'fire' && (
              <>
                <span className="absolute top-1 -right-1 text-[9px] animate-particle-up">🔥</span>
                <span className="absolute bottom-2 -left-1 text-[8px] text-amber-300 animate-sparkle">✦</span>
              </>
            )}
            {theme === 'ice' && (
              <>
                <span className="absolute top-1 -left-1 text-[9px] text-cyan-200 animate-sparkle">❄</span>
                <span className="absolute bottom-1 -right-1 text-[9px] text-white animate-sparkle" style={{ animationDelay: '0.6s' }}>✦</span>
              </>
            )}
            {theme === 'indonesia' && (
              <>
                <span className="absolute top-1 -left-1 text-[8px] text-amber-300 animate-sparkle">★</span>
                <span className="absolute bottom-2 -right-1 text-[8px] text-red-400 animate-sparkle" style={{ animationDelay: '0.5s' }}>✦</span>
              </>
            )}
          </div>
        )}

        {/* Decoration Effects (from Hias Border Lu) */}
        {isLarge && activeEffects.length > 0 && (
          <div className="absolute -inset-3 pointer-events-none z-30">
            {activeEffects.includes('bintang') && (
              <span className="absolute -top-1 left-2 text-[10px] text-amber-300 animate-sparkle">★</span>
            )}
            {activeEffects.includes('salju') && (
              <span className="absolute top-2 -right-1 text-[10px] text-cyan-200 animate-dust">❄</span>
            )}
            {activeEffects.includes('hati') && (
              <span className="absolute bottom-2 -left-1 text-[10px] animate-particle-up">❤️</span>
            )}
            {activeEffects.includes('petir') && (
              <span className="absolute -top-1 right-2 text-[10px] text-yellow-300 animate-subtle-pulse">⚡</span>
            )}
            {activeEffects.includes('gelembung') && (
              <span className="absolute bottom-0 right-2 text-[9px] text-sky-200 animate-particle-up">🫧</span>
            )}
            {activeEffects.includes('confetti') && (
              <span className="absolute top-3 -left-1 text-[10px] animate-sparkle">🎊</span>
            )}
            {activeEffects.includes('kembang-api') && (
              <span className="absolute -bottom-1 left-2 text-[10px] animate-sparkle">🎆</span>
            )}
          </div>
        )}

        {/* Inner Dark Separator + User Avatar */}
        <div className={`relative z-10 ${sizeMap.inner} rounded-full overflow-hidden bg-[#141414] ring-[2px] ring-[#0A0A0A] shadow-inner`}>
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
            className={`absolute z-30 ${sizeMap.sticker} leading-none text-[#D4AF37] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] select-none pointer-events-none`}
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
