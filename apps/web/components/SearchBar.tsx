'use client';

import { ListingFilters, RoomType } from '@sakany/shared';
import { useRouter } from 'next/navigation';
import { FormEvent, useCallback } from 'react';
import { ROOM_TYPE_OPTIONS } from '@/lib/constants';

type SearchBarProps = {
  initialParams: Record<string, string | string[] | undefined>;
};

export function SearchBar({ initialParams }: SearchBarProps) {
  const router = useRouter();

  const getParam = (key: keyof ListingFilters) => {
    const value = initialParams[key];
    return typeof value === 'string' ? value : '';
  };

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      const next = new URLSearchParams();

      const fields: (keyof ListingFilters)[] = [
        'minPrice',
        'maxPrice',
        'roomType',
        'maxDistanceKm',
      ];

      for (const key of fields) {
        const val = form.get(key)?.toString();
        if (val) next.set(key, val);
      }
      if (form.get('furnished') === 'on') next.set('furnished', 'true');
      if (form.get('verifiedOnly') === 'on') next.set('verifiedOnly', 'true');

      router.push(`/?${next.toString()}`);
    },
    [router],
  );

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-sand bg-white/80 p-4 shadow-sm backdrop-blur sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink-soft">Prix min (DT/mois)</span>
          <input
            name="minPrice"
            type="number"
            defaultValue={getParam('minPrice')}
            placeholder="200"
            className="rounded-lg border border-sand bg-whitewash px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink-soft">Prix max (DT/mois)</span>
          <input
            name="maxPrice"
            type="number"
            defaultValue={getParam('maxPrice')}
            placeholder="800"
            className="rounded-lg border border-sand bg-whitewash px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink-soft">Type de logement</span>
          <select
            name="roomType"
            defaultValue={getParam('roomType')}
            className="rounded-lg border border-sand bg-whitewash px-3 py-2"
          >
            <option value="">Tous</option>
            {ROOM_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink-soft">Distance max (km)</span>
          <input
            name="maxDistanceKm"
            type="number"
            step="0.1"
            defaultValue={getParam('maxDistanceKm')}
            placeholder="3"
            className="rounded-lg border border-sand bg-whitewash px-3 py-2"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            name="furnished"
            type="checkbox"
            defaultChecked={getParam('furnished') === 'true'}
            className="accent-door"
          />
          Meublé uniquement
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            name="verifiedOnly"
            type="checkbox"
            defaultChecked={getParam('verifiedOnly') === 'true'}
            className="accent-door"
          />
          Annonces vérifiées
        </label>
        <button type="submit" className="btn-primary ml-auto">
          Rechercher
        </button>
      </div>
    </form>
  );
}
