'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Photo } from '@sakany/shared';

interface PhotoGalleryProps {
  title: string;
  photos: Photo[];
}

export function PhotoGallery({ title, photos }: PhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    setActiveIndex(0);
    setLightboxIndex(null);
  }, [photos]);

  const activePhoto = photos[activeIndex];

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setLightboxIndex(activeIndex)}
          className="arch-frame-lg relative block aspect-[16/10] w-full overflow-hidden bg-sand"
        >
          {activePhoto ? (
            <Image
              src={activePhoto.url}
              alt={title}
              fill
              className="object-cover"
              priority
              sizes="(max-width:1024px) 100vw, 60vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-soft">
              Pas de photo disponible
            </div>
          )}
        </button>

        {photos.length > 1 && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => {
                  setActiveIndex(index);
                  setLightboxIndex(index);
                }}
                className={`arch-frame relative aspect-[4/3] overflow-hidden bg-sand ring-offset-2 transition ${
                  index === activeIndex ? 'ring-2 ring-door' : 'hover:opacity-90'
                }`}
              >
                <Image src={photo.url} alt="" fill className="object-cover" sizes="180px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-black shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-2 text-sm font-medium text-ink shadow-sm"
            >
              Fermer
            </button>
            <div className="relative aspect-[16/10] bg-black">
              <Image
                src={photos[lightboxIndex].url}
                alt={title}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-sm text-white">
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((current) => (current === null ? current : (current - 1 + photos.length) % photos.length))
                }
                className="rounded-full bg-white/10 px-3 py-2 hover:bg-white/20"
              >
                Précédente
              </button>
              <span>
                {lightboxIndex + 1} / {photos.length}
              </span>
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((current) => (current === null ? current : (current + 1) % photos.length))
                }
                className="rounded-full bg-white/10 px-3 py-2 hover:bg-white/20"
              >
                Suivante
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
