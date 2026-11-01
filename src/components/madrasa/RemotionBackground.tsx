'use client';

/**
 * RemotionBackground — cinematic code-generated film layer (Remotion Player)
 * used exactly like VideoBackground, but the film is composed in code:
 *
 * Behaviour contract (mirrors VideoBackground):
 * - Zero network cost: the film is rendered by React — no MP4 to download.
 * - Lazy: the Player mounts only when near the viewport (IntersectionObserver).
 * - Reduced motion: the Player never mounts; a designed static gradient stays.
 * - No loading screen: the gradient renders instantly, the film fades in.
 * - Autoplay, muted, loop, no controls — pure ambient cinema.
 * - Session-aware: the full Bismillah opening plays once per browser session;
 *   repeat views resume straight into the ambient identity beat.
 */

import { useEffect, useRef, useState } from 'react';
import { Player } from '@remotion/player';
import {
  MadrasahIntro,
  MADRASAH_INTRO_FPS,
  MADRASAH_INTRO_DURATION,
  MADRASAH_INTRO_AMBIENT_FRAME,
} from '@/remotion/MadrasahIntro';
import {
  MadrasahAmbient,
  MADRASAH_AMBIENT_FPS,
  MADRASAH_AMBIENT_DURATION,
} from '@/remotion/MadrasahAmbient';

const INTRO_SESSION_KEY = 'madrasah-intro-played';

type FilmKind = 'intro' | 'ambient';

interface RemotionBackgroundProps {
  /** Which code-film to play. */
  kind?: FilmKind;
  /** Classes for the static fallback gradient layer. */
  fallbackClassName?: string;
  className?: string;
}

export default function RemotionBackground({
  kind = 'intro',
  fallbackClassName = 'bg-gradient-to-br from-night via-emerald-deep to-night-2',
  className = '',
}: RemotionBackgroundProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [initialFrame, setInitialFrame] = useState(0);

  const showFilm = nearViewport && !reducedMotion;

  // After mount: read browser-only values (hydration-safe, deterministic SSR).
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    let markTimer: ReturnType<typeof setTimeout> | undefined;
    queueMicrotask(() => {
      if (typeof IntersectionObserver === 'undefined') setNearViewport(true);
      setReducedMotion(mq.matches);
      // Session-aware intro: the full opening plays once, then ambient only.
      // NOTE: the flag is written AFTER the opening completes (deferred), never
      // during mount — child effects run before parent effects (the Hero reads
      // this key on mount to choose its entrance timing), so an immediate write
      // here would race the Hero and the Bismillah beat would never wait.
      try {
        if (kind === 'intro' && sessionStorage.getItem(INTRO_SESSION_KEY)) {
          setInitialFrame(MADRASAH_INTRO_AMBIENT_FRAME);
        } else if (kind === 'intro') {
          markTimer = setTimeout(() => {
            try {
              sessionStorage.setItem(INTRO_SESSION_KEY, '1');
            } catch {
              // storage unavailable — every visit plays the full intro
            }
          }, 5600); // Bismillah beat + star draw fully performed
        }
      } catch {
        // storage unavailable — always play the full intro
      }
    });
    mq.addEventListener('change', onChange);
    return () => {
      mq.removeEventListener('change', onChange);
      if (markTimer) clearTimeout(markTimer);
    };
  }, [kind]);

  // Lazy activation: mount the Player only when near the viewport.
  useEffect(() => {
    if (reducedMotion || nearViewport) return;
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) setNearViewport(true);
      },
      { rootMargin: '250px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion, nearViewport]);

  // The Player renders synchronously once mounted — fade the film in on the
  // next frame (no loading screen, deterministic).
  useEffect(() => {
    if (!showFilm) return;
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, [showFilm, initialFrame]);

  return (
    <div ref={wrapperRef} className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {/* Static fallback — always present, renders instantly (no loading screen). */}
      <div className={`absolute inset-0 ${fallbackClassName}`} />

      {showFilm &&
        (kind === 'intro' ? (
          <div
            className={`absolute inset-0 transition-opacity duration-1000 ${
              ready ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Player
              component={MadrasahIntro}
              durationInFrames={MADRASAH_INTRO_DURATION}
              fps={MADRASAH_INTRO_FPS}
              compositionWidth={1920}
              compositionHeight={1080}
              initialFrame={initialFrame}
              loop
              autoPlay
              controls={false}
              clickToPlay={false}
              spaceKeyToPlayOrPause={false}
              doubleClickToFullscreen={false}
              allowFullscreen={false}
              numberOfSharedAudioTags={0}
              initiallyMuted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              acknowledgeRemotionLicense
            />
          </div>
        ) : (
          <div
            className={`absolute inset-0 transition-opacity duration-1000 ${
              ready ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Player
              component={MadrasahAmbient}
              durationInFrames={MADRASAH_AMBIENT_DURATION}
              fps={MADRASAH_AMBIENT_FPS}
              compositionWidth={1920}
              compositionHeight={1080}
              loop
              autoPlay
              controls={false}
              clickToPlay={false}
              spaceKeyToPlayOrPause={false}
              doubleClickToFullscreen={false}
              allowFullscreen={false}
              numberOfSharedAudioTags={0}
              initiallyMuted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              acknowledgeRemotionLicense
            />
          </div>
        ))}
    </div>
  );
}
