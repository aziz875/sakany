'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Photo } from '@sakany/shared';
import { BrandImageFallback } from './BrandImageFallback';
import { Grid2X2, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PhotoGalleryProps {
  title: string;
  photos: Photo[];
}

export function PhotoGallery({ title, photos }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [brokenPhotoIds, setBrokenPhotoIds] = useState<string[]>([]);

  useEffect(() => {
    setLightboxIndex(null);
    setBrokenPhotoIds([]);
  }, [photos]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i === null ? 0 : (i + 1) % photos.length));
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i === null ? 0 : (i - 1 + photos.length) % photos.length));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, photos.length]);

  const brokenSet = useMemo(() => new Set(brokenPhotoIds), [brokenPhotoIds]);
  function markBroken(id?: string) {
    if (!id) return;
    setBrokenPhotoIds((c) => (c.includes(id) ? c : [...c, id]));
  }

  function renderImg(photo: Photo | undefined, className: string, priority = false, sizes = '50vw') {
    if (!photo || brokenSet.has(photo.id)) {
      return <BrandImageFallback title={title} className={className} />;
    }
    return (
      <Image
        src={photo.url}
        alt={title}
        fill
        className="object-cover"
        priority={priority}
        sizes={sizes}
        onError={() => markBroken(photo.id)}
      />
    );
  }

  const [p0, p1, p2, p3, p4] = photos;

  return (
    <>
      {/* ── Desktop: Airbnb 5-image mosaic ── */}
      <div className="relative hidden md:grid grid-cols-[2fr_1fr_1fr] grid-rows-2 gap-2 h-[400px] lg:h-[480px] rounded-2xl overflow-hidden">
        {/* Main big image: spans 1 col × 2 rows */}
        <button
          type="button"
          className="row-span-2 relative overflow-hidden bg-sand cursor-zoom-in"
          onClick={() => setLightboxIndex(0)}
        >
          {renderImg(p0, 'absolute inset-0', true, '50vw')}
        </button>
        {/* Top-right 4 grid images */}
        {[p1, p2, p3, p4].map((photo, i) => (
          <button
            key={photo?.id ?? i}
            type="button"
            className="relative overflow-hidden bg-sand cursor-zoom-in"
            onClick={() => setLightboxIndex(i + 1)}
          >
            {renderImg(photo, 'absolute inset-0', false, '25vw')}
          </button>
        ))}

        {/* "Show all photos" pill */}
        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl border border-ink/20 bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-md hover:bg-sand/60 transition-colors"
        >
          <Grid2X2 size={15} />
          Afficher toutes les photos
        </button>
      </div>

      {/* ── Mobile: single photo ── */}
      <div className="relative md:hidden w-full aspect-[4/3] rounded-2xl overflow-hidden bg-sand">
        {renderImg(p0, 'absolute inset-0', true, '100vw')}
        {photos.length > 1 && (
          <button
            onClick={() => setLightboxIndex(0)}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
          >
            <Grid2X2 size={13} /> {photos.length} photos
          </button>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="relative w-full max-w-5xl px-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-12 right-0 flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 transition"
            >
              <X size={15} /> Fermer
            </button>
            <p className="absolute -top-12 left-0 text-sm text-white/60">{lightboxIndex + 1} / {photos.length}</p>

            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-black">
              {brokenSet.has(photos[lightboxIndex].id) ? (
                <BrandImageFallback title={title} className="absolute inset-0" />
              ) : (
                <Image
                  src={photos[lightboxIndex].url}
                  alt={title}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  onError={() => markBroken(photos[lightboxIndex].id)}
                />
              )}
            </div>

            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxIndex((i) => (i === null ? 0 : (i - 1 + photos.length) % photos.length))}
                  className="absolute left-7 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setLightboxIndex((i) => (i === null ? 0 : (i + 1) % photos.length))}
                  className="absolute right-7 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
