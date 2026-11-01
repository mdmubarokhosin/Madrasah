'use client';

/**
 * MadrasahAmbient — calm, living geometry loop for the About section film.
 *
 * A slow eight-point-star lattice drifts across an emerald field while soft
 * gold bokeh breathes — designed as a quiet backdrop that never competes
 * with the About text laid over it. Fully deterministic (seeded), loops
 * seamlessly at 8 s / 30 fps.
 */

import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
  opacity: number;
}

const STARS: Star[] = (() => {
  const rand = seededRandom(561970);
  return Array.from({ length: 7 }, () => ({
    x: rand() * 110 - 5,
    y: rand() * 110 - 5,
    size: 90 + rand() * 190,
    speed: 0.6 + rand() * 0.9,
    phase: rand() * Math.PI * 2,
    opacity: 0.05 + rand() * 0.1,
  }));
})();

const BOKEH = (() => {
  const rand = seededRandom(731120);
  return Array.from({ length: 16 }, () => ({
    x: rand() * 100,
    y: rand() * 100,
    size: 8 + rand() * 26,
    phase: rand() * Math.PI * 2,
    speed: 0.7 + rand() * 1.3,
  }));
})();

function StarOrnament({ size, opacity }: { size: number; opacity: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ opacity }}
      aria-hidden="true"
    >
      <path
        d="M50 2 L59 26 L83 17 L74 41 L98 50 L74 59 L83 83 L59 74 L50 98 L41 74 L17 83 L26 59 L2 50 L26 41 L17 17 L41 26 Z"
        fill="none"
        stroke="color-mix(in oklab, var(--warning) 80%, transparent)"
        strokeWidth="1"
      />
      <circle cx="50" cy="50" r="14" fill="none" stroke="color-mix(in oklab, var(--warning) 45%, transparent)" strokeWidth="0.8" />
      <circle cx="50" cy="50" r="4" fill="color-mix(in oklab, var(--warning) 60%, transparent)" />
    </svg>
  );
}

export const MADRASAH_AMBIENT_FPS = 30;
export const MADRASAH_AMBIENT_DURATION = 240; // 8 s loop

export const MadrasahAmbient: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const t = frame / durationInFrames; // 0..1 loop position

  // Seamless lattice drift: two half-cycles so end meets start
  const panX = Math.sin(t * Math.PI * 2) * 40;
  const panY = Math.cos(t * Math.PI * 2) * 26;
  const breathe = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);

  return (
    <AbsoluteFill style={{ backgroundColor: 'var(--accent)' }}>
      {/* Bright HeroUI accent sky — snow-lit top-right, accent-hover depth at
          the far edge. Zero dark surfaces anywhere (light-theme design). */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(115% 95% at 68% 24%, color-mix(in oklab, var(--snow) 26%, var(--accent)) 0%, var(--accent) 46%, color-mix(in oklab, var(--accent) 86%, var(--accent-foreground)) 100%)',
        }}
      />
      {/* Drifting star lattice */}
      <AbsoluteFill style={{ transform: `translate(${panX}px, ${panY}px)` }} aria-hidden="true">
        {STARS.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${s.x}%`,
              top: `${s.y}%`,
              transform: `rotate(${frame * 0.08 * s.speed + s.phase}deg)`,
              opacity: s.opacity + breathe * 0.05,
            }}
          >
            <StarOrnament size={s.size} opacity={1} />
          </div>
        ))}
      </AbsoluteFill>
      {/* Gold bokeh */}
      <AbsoluteFill aria-hidden="true">
        {BOKEH.map((b, i) => {
          const bl = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(frame / (16 * b.speed) + b.phase));
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${b.x}%`,
                top: `${b.y}%`,
                width: b.size,
                height: b.size,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle, color-mix(in oklab, var(--warning) 60%, white) 0%, color-mix(in oklab, var(--warning) 35%, transparent) 55%, transparent 75%)',
                opacity: bl * 0.4,
                filter: 'blur(1px)',
              }}
            />
          );
        })}
      </AbsoluteFill>
      {/* Soft light vignette + snow wash — bright framing, never dark */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(110% 110% at 50% 45%, transparent 45%, color-mix(in oklab, var(--accent-hover) 55%, transparent) 100%)',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, color-mix(in oklab, var(--snow) 30%, transparent) 0%, transparent 30%, transparent 62%, color-mix(in oklab, var(--accent) 40%, transparent) 100%)',
        }}
      />
      {/* Width/height referenced so both dims always resolve in every composition size */}
      <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        {`${width}x${height}`}
      </div>
    </AbsoluteFill>
  );
};

export default MadrasahAmbient;
