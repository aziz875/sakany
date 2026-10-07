'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Photo } from '@sakany/shared';
import { BrandImageFallback } from './BrandImageFallback';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface FeaturedPhotoCardProps {
  title: string;
  photos: Photo[];
  href?: string;
}

export function FeaturedPhotoCard({ title, photos, href }: FeaturedPhotoCardProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [broken, setBroken] = useState<Set<string>>(new Set());

  const photo = photos[index];
  const total = photos.length;

  function prev(e: React.MouseEvent) {
    e.stopPropagation();
    setIndex((i) => (i - 1 + total) % total);
  }
  function next(e: React.MouseEvent) {
    e.stopPropagation();
    setIndex((i) => (i + 1) % total);
  }

  function handleMainClick() {
    if (href) {
      router.push(href);
    } else {
      setLightbox(true);
    }
  }

  return (
    <>
      {/* Photo card with arrows */}
      <div
        className="relative w-full aspect-[4/3] sm:aspect-auto sm:h-[260px] overflow-hidden rounded-2xl bg-sand cursor-pointer group"
        onClick={handleMainClick}
      >
        {photo && !broken.has(photo.id) ? (
          <Image
            src={photo.url}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(max-width:640px) 100vw, 320px"
            priority
            onError={() => setBroken((b) => new Set([...b, photo.id]))}
          />
        ) : (
          <BrandImageFallback title={title} className="absolute inset-0" />
        )}

        {/* Prev arrow */}
        {total > 1 && (
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition"
            aria-label="Photo précédente"
          >
            <ChevronLeft size={18} className="text-ink" />
          </button>
        )}

        {/* Next arrow */}
        {total > 1 && (
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition"
            aria-label="Photo suivante"
          >
            <ChevronRight size={18} className="text-ink" />
          </button>
        )}

        {/* Dot indicators */}
        {total > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {photos.slice(0, Math.min(total, 5)).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
        >
          <div className="relative w-full max-w-4xl px-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(false)}
              className="absolute -top-12 right-4 flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 transition"
            >
              <X size={15} /> Fermer
            </button>
            <p className="absolute -top-12 left-4 text-sm text-white/60">{index + 1} / {total}</p>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black">
              {photo && !broken.has(photo.id) ? (
                <Image src={photo.url} alt={title} fill className="object-contain" sizes="100vw"
                  onError={() => setBroken((b) => new Set([...b, photo.id]))} />
              ) : (
                <BrandImageFallback title={title} className="absolute inset-0" />
              )}
            </div>
            {total > 1 && (
              <div className="flex justify-between mt-4">
                <button onClick={(e) => prev(e)} className="rounded-full bg-white/10 px-5 py-2.5 text-sm text-white hover:bg-white/20 transition">← Précédente</button>
                <button onClick={(e) => next(e)} className="rounded-full bg-white/10 px-5 py-2.5 text-sm text-white hover:bg-white/20 transition">Suivante →</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
