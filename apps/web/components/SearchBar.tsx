'use client';

import { ListingFilters } from '@sakany/shared';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useCallback } from 'react';
import { ROOM_TYPE_OPTIONS, UNIVERSITY_SEED_DATA } from '@/lib/constants';
import { Search, GraduationCap } from 'lucide-react';

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

      const fields: (keyof ListingFilters)[] = ['query', 'maxPrice', 'roomType'];

      for (const key of fields) {
        const val = form.get(key)?.toString();
        if (val) next.set(key, val);
      }

      router.push(`/?${next.toString()}`);
    },
    [router],
  );

  return (
    <form 
      onSubmit={onSubmit}
      className="mx-auto flex max-w-[850px] items-center justify-between rounded-full border border-sand bg-white shadow-lg transition-shadow hover:shadow-xl sm:h-16"
    >
      <div className="flex w-full items-center divide-x divide-sand h-full">
        
        {/* Université */}
        <label className="flex h-full w-1/3 flex-col justify-center rounded-l-full px-6 py-2 hover:bg-sand/30 cursor-pointer transition-colors">
          <span className="text-xs font-bold text-ink flex items-center gap-1">
            <GraduationCap size={14} className="text-door" />
            Université
          </span>
          <select
            name="query"
            defaultValue={getParam('query')}
            className="w-full cursor-pointer appearance-none bg-transparent text-sm text-ink-soft outline-none truncate font-medium"
          >
            <option value="">Toutes les universités</option>
            {UNIVERSITY_SEED_DATA.map((uni) => (
              <option key={uni.name} value={uni.shortName || uni.name}>
                {uni.name}
              </option>
            ))}
          </select>
        </label>

        {/* Budget Max */}
        <label className="flex h-full w-1/3 flex-col justify-center px-6 py-2 hover:bg-sand/30 cursor-pointer transition-colors">
          <span className="text-xs font-bold text-ink">Budget Max</span>
          <input
            name="maxPrice"
            type="number"
            defaultValue={getParam('maxPrice')}
            placeholder="Budget max (DT)"
            className="w-full bg-transparent text-sm text-ink-soft outline-none placeholder:text-ink-soft/60"
          />
        </label>

        {/* Type de Logement */}
        <label className="flex h-full w-1/3 flex-col justify-center px-6 py-2 hover:bg-sand/30 cursor-pointer transition-colors">
          <span className="text-xs font-bold text-ink">Type</span>
          <select
            name="roomType"
            defaultValue={getParam('roomType')}
            className="w-full cursor-pointer appearance-none bg-transparent text-sm text-ink-soft outline-none"
          >
            <option value="">Tous les types</option>
            {ROOM_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

      </div>

      <div className="pr-2">
        <button
          type="submit"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-door text-white transition-transform hover:scale-105 shadow-md shadow-door/20"
          aria-label="Rechercher"
        >
          <Search size={20} strokeWidth={3} />
        </button>
      </div>
    </form>
  );
}
