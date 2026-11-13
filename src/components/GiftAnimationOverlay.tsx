import React, { useEffect } from 'react';
import { GiftEventPayload } from '../types';
import { getGiftById } from '../data/gifts';
import { UserAvatar } from './UserAvatar';

interface GiftIcon3DProps {
  giftId: string;
  emoji?: string;
  size?: 'xs' | 'sm' | 'md' | 'hero';
}

export const GiftIcon3D: React.FC<GiftIcon3DProps> = ({ giftId, emoji, size = 'sm' }) => {
  const giftDef = getGiftById(giftId);
  const resolvedEmoji = emoji || giftDef?.emoji || '🎁';
  const accent = giftDef?.accentColor || '#D4AF37';
  const glow = giftDef?.glowColor || 'rgba(212,175,55,0.6)';
  const bg = giftDef?.bgGradient || 'linear-gradient(135deg, #D4AF37, #F59E0B)';

  const sizeClass =
    size === 'hero'
      ? 'w-24 h-24 rounded-3xl text-5xl'
      : size === 'md'
      ? 'w-11 h-11 rounded-2xl text-2xl'
      : size === 'xs'
      ? 'w-6 h-6 rounded-lg text-sm'
      : 'w-9 h-9 rounded-xl text-xl';

  const isHeartGlasses = giftId === 'kacamata-love';

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 select-none ${sizeClass}`}
      style={{
        background: bg,
        boxShadow:
          size === 'hero'
            ? `0 18px 36px rgba(0,0,0,0.65), 0 0 32px ${glow}, inset 0 3px 6px rgba(255,255,255,0.45), inset 0 -6px 10px rgba(0,0,0,0.4)`
            : `0 4px 10px rgba(0,0,0,0.45), 0 0 12px ${glow}, inset 0 1.5px 3px rgba(255,255,255,0.45), inset 0 -2px 4px rgba(0,0,0,0.35)`,
        border: `1.5px solid ${accent}`,
      }}
    >
      {/* Top 3D specular gloss highlight */}
      <div
        className="absolute inset-x-1 top-0.5 h-1/3 rounded-t-[inherit] pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%)',
        }}
      />

      {isHeartGlasses ? (
        <svg
          viewBox="0 0 64 40"
          className={
            size === 'hero'
              ? 'w-16 h-12 drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)] relative z-10'
              : size === 'md'
              ? 'w-8 h-6 relative z-10'
              : size === 'xs'
              ? 'w-4 h-3 relative z-10'
              : 'w-6 h-5 relative z-10'
          }
          fill="none"
        >
          {/* Bridge & temples */}
          <path d="M27 15C30 12 34 12 37 15" stroke="#FFF1F2" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M4 13L10 15" stroke="#FFF1F2" strokeWidth="3" strokeLinecap="round" />
          <path d="M60 13L54 15" stroke="#FFF1F2" strokeWidth="3" strokeLinecap="round" />
          {/* Left heart rim */}
          <path
            d="M17.5 32C17.5 32 6 24.5 6 15.2C6 10.6 9.6 7.5 13.5 7.5C15.9 7.5 17.5 9 17.5 9C17.5 9 19.1 7.5 21.5 7.5C25.4 7.5 29 10.6 29 15.2C29 24.5 17.5 32 17.5 32Z"
            fill="#4C0519"
            stroke="#FFF1F2"
            strokeWidth="2.8"
          />
          {/* Right heart rim */}
          <path
            d="M46.5 32C46.5 32 35 24.5 35 15.2C35 10.6 38.6 7.5 42.5 7.5C44.9 7.5 46.5 9 46.5 9C46.5 9 48.1 7.5 50.5 7.5C54.4 7.5 58 10.6 58 15.2C58 24.5 46.5 32 46.5 32Z"
            fill="#4C0519"
            stroke="#FFF1F2"
            strokeWidth="2.8"
          />
          {/* Glossy lens reflections */}
          <path d="M10.5 13.5C11.5 11.5 13.5 11 15 11.8" stroke="#F9A8D4" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M39.5 13.5C40.5 11.5 42.5 11 44 11.8" stroke="#F9A8D4" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      ) : (
        <span
          className="relative z-10 leading-none"
          style={{
            filter:
              size === 'hero'
                ? 'drop-shadow(0 8px 12px rgba(0,0,0,0.55))'
                : 'drop-shadow(0 2px 4px rgba(0,0,0,0.45))',
          }}
        >
          {resolvedEmoji}
        </span>
      )}
    </div>
  );
};

interface GiftAnimationOverlayProps {
  giftEvent: GiftEventPayload | null;
  onComplete: (eventId: string) => void;
}

const PARTICLE_OFFSETS = [
  { tx: '-88px', ty: '-105px', rot: '-45deg', delay: '0s' },
  { tx: '88px', ty: '-100px', rot: '50deg', delay: '0.12s' },
  { tx: '-115px', ty: '-35px', rot: '-85deg', delay: '0.24s' },
  { tx: '115px', ty: '-30px', rot: '90deg', delay: '0.18s' },
  { tx: '-55px', ty: '-130px', rot: '-30deg', delay: '0.32s' },
  { tx: '60px', ty: '-128px', rot: '35deg', delay: '0.28s' },
  { tx: '-75px', ty: '55px', rot: '-120deg', delay: '0.15s' },
  { tx: '78px', ty: '52px', rot: '115deg', delay: '0.22s' },
  { tx: '0px', ty: '-142px', rot: '180deg', delay: '0.08s' },
  { tx: '-25px', ty: '75px', rot: '-160deg', delay: '0.35s' },
];

export const GiftAnimationOverlay: React.FC<GiftAnimationOverlayProps> = ({
  giftEvent,
  onComplete,
}) => {
  useEffect(() => {
    if (!giftEvent) return;
    const timer = window.setTimeout(() => {
      onComplete(giftEvent.id);
    }, 3400);
    return () => window.clearTimeout(timer);
  }, [giftEvent, onComplete]);

  if (!giftEvent) return null;

  const giftDef = getGiftById(giftEvent.gift_id);
  const tier = giftDef?.tier || (giftEvent.gift_harga >= 200 ? 'luxury' : giftEvent.gift_harga >= 100 ? 'special' : 'standard');
  const accent = giftDef?.accentColor || '#D4AF37';
  const glow = giftDef?.glowColor || 'rgba(212,175,55,0.75)';
  const ringGradient = giftDef?.ringGradient || 'conic-gradient(from 0deg, #FDE047, #F59E0B, #FDE047)';
  const particles = giftDef?.particles || [giftEvent.gift_emoji, '✨', '🪙', '💫'];
  const tagline = giftDef?.tagline || `Mengirim ${giftEvent.gift_nama} spesial buat Host!`;

  const particleCount = tier === 'luxury' ? 10 : tier === 'special' ? 8 : 6;

  return (
    <div
      key={giftEvent.id}
      className="absolute inset-0 z-40 pointer-events-none flex flex-col items-center justify-center px-4 overflow-hidden"
    >
      {/* Ambient radial stage backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background:
            tier === 'luxury'
              ? `radial-gradient(circle at 50% 44%, ${glow.replace(/[\d.]+\)$/, '0.35)')} 0%, rgba(0,0,0,0.68) 68%)`
              : `radial-gradient(circle at 50% 44%, ${glow.replace(/[\d.]+\)$/, '0.24)')} 0%, rgba(0,0,0,0.45) 65%)`,
        }}
      />

      {/* 3D Animated Center Stage */}
      <div className="relative flex flex-col items-center justify-center animate-gift-stage">
        {/* Tier label pill */}
        <div
          className="mb-3 px-3 py-0.5 rounded-full text-[9.5px] font-heading font-extrabold uppercase tracking-[0.2em] border backdrop-blur-md shadow-lg"
          style={{
            backgroundColor: 'rgba(12,12,12,0.85)',
            borderColor: accent,
            color: accent,
            boxShadow: `0 0 18px ${glow}`,
          }}
        >
          {tier === 'luxury'
            ? '👑 ROYAL 3D GIFT • 200 COIN'
            : tier === 'special'
            ? '✨ SPECIAL 3D GIFT • 100 COIN'
            : '🎁 3D GIFT • 50 COIN'}
        </div>

        {/* 3D Volumetric Pedestal + Orbiting Rings + Particles */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Shockwave 3D Halo */}
          <div
            className="absolute w-40 h-40 rounded-full border-2 animate-gift-shockwave"
            style={{ borderColor: accent, boxShadow: `0 0 24px ${glow}` }}
          />
          {tier !== 'standard' && (
            <div
              className="absolute w-32 h-32 rounded-full border animate-gift-shockwave"
              style={{
                borderColor: '#FFFFFF',
                animationDelay: '0.5s',
              }}
            />
          )}

          {/* Rotating Conic Volumetric Aura */}
          <div
            className="absolute w-36 h-36 rounded-full opacity-75 blur-[1px] animate-spin-medium"
            style={{
              background: ringGradient,
              maskImage: 'radial-gradient(circle, transparent 54%, black 56%, black 100%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 54%, black 56%, black 100%)',
            }}
          />

          {/* 3D Orbital Tilted Ring */}
          <div
            className="absolute w-44 h-44 rounded-full border-2 border-dashed animate-orbit-ring-3d"
            style={{
              borderColor: accent,
              boxShadow: `0 0 16px ${glow}`,
            }}
          />

          {tier === 'luxury' && (
            <div
              className="absolute w-48 h-48 rounded-full border border-white/60 animate-spin-reverse-slow"
              style={{
                transform: 'rotateX(72deg) rotateY(22deg)',
              }}
            />
          )}

          {/* Bursting 3D Particles */}
          {PARTICLE_OFFSETS.slice(0, particleCount).map((p, idx) => (
            <span
              key={idx}
              className="absolute text-xl animate-gift-particle select-none"
              style={
                {
                  '--tx': p.tx,
                  '--ty': p.ty,
                  '--rot': p.rot,
                  animationDelay: p.delay,
                  filter: `drop-shadow(0 0 8px ${glow})`,
                } as React.CSSProperties
              }
            >
              {particles[idx % particles.length]}
            </span>
          ))}

          {/* Main 3D Hero Gift Emblem */}
          <div className={tier === 'luxury' ? 'animate-gift-luxury' : 'animate-gift-hero'}>
            <GiftIcon3D
              giftId={giftEvent.gift_id}
              emoji={giftEvent.gift_emoji}
              size="hero"
            />
          </div>
        </div>

        {/* Sender -> Host Banner */}
        <div
          className="mt-2 w-[290px] max-w-[90vw] rounded-2xl p-2.5 bg-[#101010]/90 backdrop-blur-md border shadow-2xl animate-gift-banner"
          style={{
            borderColor: accent,
            boxShadow: `0 12px 30px rgba(0,0,0,0.7), 0 0 24px ${glow}`,
          }}
        >
          <div className="flex items-center gap-2.5">
            <UserAvatar
              foto={giftEvent.sender_foto}
              nama={giftEvent.sender_nama}
              borderId={giftEvent.sender_border}
              size="xs"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-heading font-extrabold text-white truncate max-w-[120px]">
                  {giftEvent.sender_nama}
                </span>
                <span className="text-[10px] text-stone-400 truncate">
                  @{giftEvent.sender_username}
                </span>
              </div>
              <div className="text-[11px] font-bold mt-0.5" style={{ color: accent }}>
                Kirim {giftEvent.gift_nama} ke {giftEvent.host_nama}!
              </div>
              <div className="text-[9.5px] text-stone-400 truncate">{tagline}</div>
            </div>
            <div
              className="px-2 py-1 rounded-xl text-[10px] font-heading font-extrabold shrink-0 border"
              style={{
                backgroundColor: 'rgba(212,175,55,0.14)',
                borderColor: 'rgba(212,175,55,0.45)',
                color: '#FDE047',
              }}
            >
              🪙 {giftEvent.gift_harga}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
