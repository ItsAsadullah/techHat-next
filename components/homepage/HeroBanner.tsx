'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HomepageBanner } from '@/lib/homepage-types';

// ─── YouTube helpers ───────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/\s]+)/);
  return m?.[1] ?? '';
}

// ─── YouTube panel (muted autoplay, click to pause/resume, no UI chrome) ──────

function YouTubePanel({ banner }: { banner: HomepageBanner }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playing, setPlaying] = useState(true);
  const videoId = extractYouTubeId(banner.youtubeUrl!);

  const embedUrl =
    `https://www.youtube.com/embed/${videoId}` +
    `?autoplay=1&mute=1&controls=0&showinfo=0&rel=0` +
    `&modestbranding=1&loop=1&playlist=${videoId}` +
    `&iv_load_policy=3&disablekb=1&enablejsapi=1`;

  const sendCommand = (func: string) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args: [] }),
      '*',
    );
  };

  const handleClick = () => {
    sendCommand(playing ? 'pauseVideo' : 'playVideo');
    setPlaying((p) => !p);
  };

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden cursor-pointer" onClick={handleClick}>
      {/* Iframe scaled up ~1.4× from center so letterbox bars are hidden */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={banner.title}
        allow="autoplay; encrypted-media"
        className="absolute inset-0 w-full h-full"
        style={{
          border: 'none',
          pointerEvents: 'none',
          transform: 'scale(1.4)',
          transformOrigin: 'center',
        }}
      />

      {/* Pause indicator */}
      {!playing && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-5 h-5 text-white ml-0.5" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Standard image/video banner panel ────────────────────────────────────────

function BannerPanel({
  banner,
  priority = false,
  sizes,
  compact = false,
}: {
  banner: HomepageBanner;
  priority?: boolean;
  sizes?: string;
  compact?: boolean;
}) {
  // Delegate YouTube banners
  if (banner.youtubeUrl) return <YouTubePanel banner={banner} />;

  const inner = (
    <>
      {banner.video ? (
        <video
          src={banner.video}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          autoPlay muted loop playsInline
        />
      ) : banner.image ? (
        <Image
          src={banner.image}
          alt={banner.title}
          fill
          sizes={sizes ?? (compact ? '33vw' : '66vw')}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          priority={priority}
          quality={85}
        />
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      <div className={cn('absolute inset-0 flex flex-col justify-end', compact ? 'p-3' : 'p-4 md:p-5 lg:p-6')}>
        <div className="space-y-1">
          {banner.badge && (
            <span className="inline-block px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wide">
              {banner.badge}
            </span>
          )}
          <h2 className={cn(
            'font-extrabold text-white leading-tight',
            compact ? 'text-sm sm:text-base' : 'text-base sm:text-xl md:text-2xl lg:text-3xl',
          )}>
            {banner.title}
          </h2>
          {!compact && banner.subtitle && (
            <p className="text-xs sm:text-sm text-white/80 line-clamp-2 hidden sm:block">{banner.subtitle}</p>
          )}
          {banner.ctaText && (
            <div className="pt-1">
              <span className={cn(
                'inline-flex items-center bg-blue-600 text-white font-semibold rounded-full shadow-md',
                compact ? 'px-3 py-1 text-xs' : 'px-5 py-2 text-sm',
              )}>
                {banner.ctaText}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const cls = 'relative w-full h-full overflow-hidden rounded-xl group block';
  if (banner.ctaLink) return <Link href={banner.ctaLink} className={cls}>{inner}</Link>;
  return <div className={cls}>{inner}</div>;
}

// ─── Shared carousel (used for all three slots) ────────────────────────────────

function BannerCarousel({
  banners,
  compact = false,
}: {
  banners: HomepageBanner[];
  compact?: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const [hovered, setHovered] = useState(false);

  const next = useCallback(() => setCurrent((c) => (c + 1) % banners.length), [banners.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + banners.length) % banners.length), [banners.length]);

  // Reset index if banners list changes
  useEffect(() => { setCurrent(0); }, [banners.length]);

  useEffect(() => {
    if (hovered || banners.length <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next, hovered, banners.length]);

  return (
    <div
      className="relative w-full h-full rounded-xl overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {banners.map((banner, i) => (
        <div
          key={banner.id}
          className={cn(
            'absolute inset-0 transition-opacity duration-700',
            i === current ? 'opacity-100 z-10' : 'opacity-0 z-0',
          )}
        >
          <BannerPanel banner={banner} priority={i === 0} compact={compact} />
        </div>
      ))}

      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            style={{ opacity: hovered ? 1 : 0 }}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all',
              compact ? 'left-1.5 w-7 h-7' : 'left-3 w-9 h-9',
            )}
            aria-label="Previous"
          >
            <ChevronLeft className={compact ? 'w-4 h-4 text-white' : 'w-5 h-5 text-white'} />
          </button>
          <button
            onClick={next}
            style={{ opacity: hovered ? 1 : 0 }}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all',
              compact ? 'right-1.5 w-7 h-7' : 'right-3 w-9 h-9',
            )}
            aria-label="Next"
          >
            <ChevronRight className={compact ? 'w-4 h-4 text-white' : 'w-5 h-5 text-white'} />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  'rounded-full transition-all',
                  compact
                    ? (i === current ? 'w-3 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/75')
                    : (i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/75'),
                )}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function HeroBanner({ banners }: { banners: HomepageBanner[] }) {
  const active = banners.filter((b) => b.isActive && (b.image || b.video || b.youtubeUrl));

  const mainBanners        = active.filter((b) => !b.slot || b.slot === 'main');
  const topRightBanners    = active.filter((b) => b.slot === 'right-top');
  const bottomRightBanners = active.filter((b) => b.slot === 'right-bottom');

  if (!mainBanners.length && !topRightBanners.length && !bottomRightBanners.length) return null;

  const hasRight = topRightBanners.length > 0 || bottomRightBanners.length > 0;

  // ── No side panels: full-width carousel ──
  if (!hasRight) {
    return (
      <div className="h-[200px] sm:h-[260px] md:h-[340px] lg:h-[400px] xl:h-[440px] w-full">
        {mainBanners.length > 0 ? <BannerCarousel banners={mainBanners} /> : null}
      </div>
    );
  }

  // ── Grid: carousel left + stacked carousels right ──
  return (
    <div className="flex gap-2 sm:gap-2.5 h-[200px] sm:h-[260px] md:h-[340px] lg:h-[400px] xl:h-[440px]">
      {/* Left: main carousel (2/3 width) */}
      <div className="flex-[2] min-w-0">
        {mainBanners.length > 0
          ? <BannerCarousel banners={mainBanners} />
          : <div className="w-full h-full rounded-xl bg-gray-100 dark:bg-gray-800" />}
      </div>

      {/* Right column (1/3 width): two stacked carousels */}
      <div className="flex-1 flex flex-col gap-2 sm:gap-2.5 min-w-0">
        <div className="flex-1 min-h-0">
          {topRightBanners.length > 0
            ? <BannerCarousel banners={topRightBanners} compact />
            : <div className="w-full h-full rounded-xl bg-gray-100 dark:bg-gray-800" />}
        </div>
        <div className="flex-1 min-h-0">
          {bottomRightBanners.length > 0
            ? <BannerCarousel banners={bottomRightBanners} compact />
            : <div className="w-full h-full rounded-xl bg-gray-100 dark:bg-gray-800" />}
        </div>
      </div>
    </div>
  );
}
