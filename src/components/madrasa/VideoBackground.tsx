'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * VideoBackground — cinematic video layer used in place of static images.
 *
 * Behaviour contract:
 * - Source priority: DB URL (admin-controlled) → bundled default video.
 * - Autoplay, muted, loop, playsInline — no controls, no sound.
 * - Lazy: video file is only fetched when near the viewport (IntersectionObserver).
 * - Reduced motion: video is never loaded; a designed static gradient is shown.
 * - Never broken: if the video fails to load/play, the static gradient remains.
 * - No loading screen: the gradient renders instantly, the video fades in when ready.
 */

interface VideoBackgroundProps {
  /** Admin-configured video URL from the database (optional). */
  dbUrl?: string | null;
  /** Bundled default video path used when no DB URL is set. */
  defaultSrc: string;
  /** Extra classes for the wrapper (positioning handled by parent). */
  className?: string;
  /** Classes for the static fallback gradient layer. */
  fallbackClassName?: string;
}

export default function VideoBackground({
  dbUrl,
  defaultSrc,
  className = '',
  fallbackClassName = 'bg-gradient-to-br from-islamic-dark via-islamic to-islamic-light',
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Neutral initial values keep the first (SSR + hydration) render deterministic.
  // Browser-only reads (IntersectionObserver support, reduced-motion) happen in
  // the effect below, after mount.
  const [nearViewport, setNearViewport] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const src = dbUrl && dbUrl.trim() !== '' ? dbUrl.trim() : defaultSrc;

  // After mount: read browser-only values, then subscribe to changes. The
  // initial reads are deferred to a microtask to avoid a synchronous setState
  // inside the effect (cascading renders) while still applying the real values
  // right after mount — the first (hydration) render stays deterministic.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    queueMicrotask(() => {
      // No IntersectionObserver (ancient browsers): load the video immediately.
      if (typeof IntersectionObserver === 'undefined') setNearViewport(true);
      setReducedMotion(mq.matches);
    });
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Lazy activation: only mount the <video> when near the viewport.
  useEffect(() => {
    if (reducedMotion || nearViewport) return;
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          setNearViewport(true);
        }
      },
      { rootMargin: '250px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion, nearViewport]);

  // Play/pause with visibility so off-screen videos don't burn CPU/battery.
  useEffect(() => {
    if (reducedMotion) return;
    const video = videoRef.current;
    if (!video) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((en) => en.isIntersecting);
        if (visible) {
          video.play().catch(() => setFailed(true));
        } else {
          video.pause();
        }
      },
      { threshold: 0.05 }
    );
    io.observe(video);
    return () => io.disconnect();
  }, [reducedMotion, nearViewport, ready]);

  const showVideo = nearViewport && !reducedMotion && !failed;

  return (
    <div ref={wrapperRef} className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {/* Static fallback — always present, renders instantly (no loading screen). */}
      <div className={`absolute inset-0 ${fallbackClassName}`} />

      {showVideo && (
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          autoPlay
          playsInline
          preload="metadata"
          disablePictureInPicture
          onCanPlay={() => setReady(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}
