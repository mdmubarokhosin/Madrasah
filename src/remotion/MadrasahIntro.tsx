'use client';

/**
 * MadrasahIntro — cinematic Remotion composition for the hero film.
 *
 * A code-generated film (zero video download):
 *   Beat 1  — deep-emerald night, rising gold dust, Bismillah bloom (RTL)
 *   Beat 2  — the eight-point star draws itself stroke by stroke
 *   Beat ∞  — the frame breathes as a living background (gold dust, glow,
 *             slow ken-burns) while the HTML hero type performs over it
 *
 * Site text intentionally lives in the accessible HTML overlay (i18n-aware,
 * admin-editable, SEO-visible) — the film sets the world, the type performs
 * in it. All randomness is seeded: renders identically on every device.
 */

import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/* ---------------- Deterministic seeded particle field ---------------- */

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface Particle {
  x: number; // 0..100 (%)
  size: number; // px
  drift: number; // px of horizontal sway
  speed: number; // rise speed multiplier
  phase: number; // 0..2π breathing offset
  opacity: number; // base opacity
}

const PARTICLES: Particle[] = (() => {
  const rand = seededRandom(20260214);
  return Array.from({ length: 34 }, () => ({
    x: rand() * 100,
    size: 1.5 + rand() * 3.5,
    drift: (rand() - 0.5) * 60,
    speed: 0.5 + rand() * 1.2,
    phase: rand() * Math.PI * 2,
    opacity: 0.25 + rand() * 0.45,
  }));
})();

/* ---------------- Gold dust layer ---------------- */

const DUST_CYCLE = 420; // frames per particle rise (at speed 1)

function GoldDust({ frame, height }: { frame: number; height: number }) {
  return (
    <AbsoluteFill aria-hidden="true">
      {PARTICLES.map((p, i) => {
        const cycle = DUST_CYCLE / p.speed;
        const localT = ((frame + i * 37) % cycle) / cycle; // 0..1 rise cycle
        const y = height * (1.08 - localT * 1.16);
        const x = p.x + Math.sin(localT * Math.PI * 2 + p.phase) * (p.drift / 12);
        const breathe = 0.55 + 0.45 * Math.sin(frame / 14 + p.phase);
        const fadeEdge = Math.min(localT * 6, (1 - localT) * 6, 1);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: y,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: 'radial-gradient(circle, color-mix(in oklab, var(--warning) 60%, white) 0%, var(--warning) 55%, transparent 75%)',
              opacity: p.opacity * breathe * fadeEdge,
              boxShadow: '0 0 8px color-mix(in oklab, var(--warning) 50%, transparent)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}

/* ---------------- Eight-point Islamic star (stroke-draw) ---------------- */

const STAR_PATH =
  'M50 2 L59 26 L83 17 L74 41 L98 50 L74 59 L83 83 L59 74 L50 98 L41 74 L17 83 L26 59 L2 50 L26 41 L17 17 L41 26 Z';

function DrawnStar({ frame }: { frame: number }) {
  const progress = interpolate(frame, [0, 46], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(frame, [0, 18], [0, 0.9], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg
      viewBox="0 0 100 100"
      width={120}
      height={120}
      style={{
        opacity,
        transform: `rotate(${frame * 0.12}deg)`,
        filter: 'drop-shadow(0 0 18px color-mix(in oklab, var(--warning) 35%, transparent))',
      }}
      aria-hidden="true"
    >
      <path
        d={STAR_PATH}
        fill="none"
        stroke="color-mix(in oklab, var(--warning) 90%, transparent)"
        strokeWidth="1.2"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 420,
          strokeDashoffset: 420 * (1 - progress),
        }}
      />
      <circle
        cx="50"
        cy="50"
        r="14"
        fill="none"
        stroke="color-mix(in oklab, var(--warning) 50%, transparent)"
        strokeWidth="1"
        style={{
          strokeDasharray: 88,
          strokeDashoffset: 88 * (1 - Math.max(0, progress - 0.35) / 0.65),
        }}
      />
      <circle cx="50" cy="50" r="5" fill="color-mix(in oklab, var(--warning) 85%, transparent)" opacity={progress} />
    </svg>
  );
}

/* ---------------- Bismillah scene ---------------- */

function Bismillah() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [6, 26, 86, 106], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const blur = interpolate(frame, [6, 26], [10, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const tracking = interpolate(frame, [6, 40], [0.9, 0.28], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(frame, [6, 32], [-26, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const glow = interpolate(frame, [20, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (opacity <= 0) return <AbsoluteFill />;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
        filter: `blur(${blur}px)`,
        transform: `translateY(${y}px)`,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <p
          dir="rtl"
          style={{
            fontFamily: "'Noto Serif Bengali', 'Noto Naskh Arabic', serif",
            fontSize: 64,
            color: 'var(--warning)',
            letterSpacing: tracking,
            textShadow: `0 0 ${28 * glow}px color-mix(in oklab, var(--warning) 55%, transparent), 0 2px 14px color-mix(in oklab, var(--accent) 55%, transparent)`,
            margin: 0,
          }}
        >
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <div
          style={{
            margin: '26px auto 0',
            width: interpolate(frame, [24, 52], [0, 220], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            height: 1,
            background:
              'linear-gradient(90deg, transparent, color-mix(in oklab, var(--warning) 90%, transparent), transparent)',
          }}
        />
      </div>
    </AbsoluteFill>
  );
}

/* ---------------- Root composition ---------------- */

export const MADRASAH_INTRO_FPS = 30;
export const MADRASAH_INTRO_DURATION = 430; // frames — ~14.3s
/** Frame where the identity/ambient beat begins (bismillah finished). */
export const MADRASAH_INTRO_AMBIENT_FRAME = 118;

export const MadrasahIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, height } = useVideoConfig();

  // Master background — layered emerald night, slowly breathing
  const bgBreath = Math.sin(frame / 55) * 0.5 + 0.5;
  // Gentle ken-burns drift across the whole film
  const drift = interpolate(frame, [0, durationInFrames], [0, -24]);
  const zoom = interpolate(frame, [0, durationInFrames], [1.04, 1.14]);

  return (
    <AbsoluteFill style={{ backgroundColor: 'var(--accent)' }}>
      {/* Bright HeroUI accent sky — snow-lit upper-left bloom, accent-hover
          breathing glow lower-right. Light-theme design, zero dark scenes. */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(120% 90% at 30% 20%, color-mix(in oklab, var(--snow) 30%, var(--accent)) 0%, var(--accent) 45%, color-mix(in oklab, var(--accent) 86%, var(--accent-foreground)) 100%)',
          transform: `scale(${zoom}) translateY(${drift}px)`,
        }}
      />
      {/* Breathing light glow */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(60% 45% at 72% 68%, color-mix(in oklab, var(--snow) 42%, transparent) 0%, transparent 70%)',
          opacity: 0.45 + bgBreath * 0.25,
        }}
      />
      {/* Soft light vignette — bright framing, never black */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(105% 105% at 50% 50%, transparent 55%, color-mix(in oklab, var(--accent-hover) 45%, transparent) 100%)',
        }}
      />

      <GoldDust frame={frame} height={height} />

      {/* The star draws itself right after the Bismillah and stays as a quiet
          rotating ornament above the hero title area */}
      <Sequence from={104} name="StarDraw">
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', paddingTop: '7%' }}>
          <DrawnStar frame={frame - 104} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={0} durationInFrames={112} name="Bismillah">
        <Bismillah />
      </Sequence>
    </AbsoluteFill>
  );
};

export default MadrasahIntro;
