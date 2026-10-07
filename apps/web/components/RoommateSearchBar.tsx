'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useCallback, useState } from 'react';
import {
  TUNISIAN_REGIONS_WITH_CITIES,
  TUNISIAN_UNIVERSITIES,
  GENDER_PREFERENCE_OPTIONS,
  SLEEP_SCHEDULE_OPTIONS,
  CLEANLINESS_OPTIONS,
  SMOKING_OPTIONS,
} from '@/lib/constants';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface RoommateSearchBarProps {
  initialParams: Record<string, string | string[] | undefined>;
}

export function RoommateSearchBar({ initialParams }: RoommateSearchBarProps) {
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const getParam = (key: string) => {
    const value = initialParams[key];
    return typeof value === 'string' ? value : '';
  };

  const [city, setCity] = useState(getParam('city'));
  const [university, setUniversity] = useState(getParam('university'));
  const [budgetMax, setBudgetMax] = useState(getParam('budgetMax'));
  const [gender, setGender] = useState(getParam('gender'));
  const [smokingPolicy, setSmokingPolicy] = useState(getParam('smokingPolicy'));
  const [cleanlinessLevel, setCleanlinessLevel] = useState(getParam('cleanlinessLevel'));
  const [sleepSchedule, setSleepSchedule] = useState(getParam('sleepSchedule'));

  const applyFilters = useCallback(
    (e?: FormEvent) => {
      if (e) e.preventDefault();
      const params = new URLSearchParams();

      if (city) params.set('city', city);
      if (university) params.set('university', university);
      if (budgetMax) params.set('budgetMax', budgetMax);
      if (gender) params.set('gender', gender);
      if (smokingPolicy) params.set('smokingPolicy', smokingPolicy);
      if (cleanlinessLevel) params.set('cleanlinessLevel', cleanlinessLevel);
      if (sleepSchedule) params.set('sleepSchedule', sleepSchedule);

      const qs = params.toString();
      router.push(`/colocataires${qs ? `?${qs}` : ''}`);
      setFiltersOpen(false);
    },
    [city, university, budgetMax, gender, smokingPolicy, cleanlinessLevel, sleepSchedule, router],
  );

  const resetFilters = () => {
    setCity('');
    setUniversity('');
    setBudgetMax('');
    setGender('');
    setSmokingPolicy('');
    setCleanlinessLevel('');
    setSleepSchedule('');
    router.push('/colocataires');
  };

  const activeFiltersCount = [
    gender,
    smokingPolicy,
    cleanlinessLevel,
    sleepSchedule,
  ].filter(Boolean).length;

  return (
    <div className="mx-auto w-full max-w-[900px]">
      {/* Main Search Bar */}
      <form
        onSubmit={applyFilters}
        className="flex flex-col sm:flex-row items-center rounded-2xl sm:rounded-full border border-sand bg-white shadow-lg transition-shadow hover:shadow-xl sm:h-16 p-2 sm:p-0"
      >
        <div className="flex w-full flex-col sm:flex-row items-center divide-y sm:divide-y-0 sm:divide-x divide-sand h-full">
          {/* Ville Cible */}
          <label className="flex h-full w-full sm:w-1/3 flex-col justify-center rounded-l-full px-5 py-2 hover:bg-sand/30 cursor-pointer transition-colors">
            <span className="text-xs font-bold text-ink">Ville / Gouvernorat</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full cursor-pointer appearance-none bg-transparent text-sm text-ink-soft outline-none truncate font-medium"
            >
              <option value="">Toute la Tunisie</option>
              {TUNISIAN_REGIONS_WITH_CITIES.map((region) => (
                <optgroup key={region.group} label={`📍 ${region.group}`}>
                  {region.cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          {/* Université / Campus */}
          <label className="flex h-full w-full sm:w-1/3 flex-col justify-center px-5 py-2 hover:bg-sand/30 cursor-pointer transition-colors">
            <span className="text-xs font-bold text-ink">Campus / Université</span>
            <select
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full cursor-pointer appearance-none bg-transparent text-sm text-ink-soft outline-none truncate font-medium"
            >
              <option value="">Toutes les universités</option>
              {TUNISIAN_UNIVERSITIES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>

          {/* Budget Max */}
          <label className="flex h-full w-full sm:w-1/4 flex-col justify-center px-5 py-2 hover:bg-sand/30 cursor-pointer transition-colors">
            <span className="text-xs font-bold text-ink">Budget Max (DT)</span>
            <input
              type="number"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              placeholder="Ex: 400"
              className="w-full bg-transparent text-sm text-ink-soft outline-none placeholder:text-ink-soft/60"
            />
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 p-2 sm:pr-3 w-full sm:w-auto justify-end">
          {/* More filters button */}
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2.5 text-xs font-semibold transition ${
              activeFiltersCount > 0
                ? 'border-door bg-door/10 text-door'
                : 'border-sand bg-sand/20 text-ink-soft hover:bg-sand/40'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span className="hidden md:inline">Mode de vie</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-door text-[10px] text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Search CTA */}
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-full bg-door p-3 text-white transition hover:bg-door-deep sm:h-12 sm:px-6"
            aria-label="Rechercher des colocataires"
          >
            <Search size={18} />
            <span className="hidden sm:inline text-sm font-semibold">Trouver</span>
          </button>
        </div>
      </form>

      {/* Advanced Lifestyle Filters Drawer */}
      {filtersOpen && (
        <div className="mt-3 rounded-2xl border border-sand bg-white p-5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-sand/60 pb-3 mb-4">
            <h4 className="font-semibold text-ink text-sm flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-door" />
              Critères & Préférences de vie
            </h4>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-ink-soft hover:text-door underline"
              >
                Réinitialiser
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="text-ink-soft hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Genre */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Genre / Coloc</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-xl border border-sand bg-sand/10 p-2 text-xs text-ink outline-none focus:border-door"
              >
                {GENDER_PREFERENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sommeil */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Rythme de vie</label>
              <select
                value={sleepSchedule}
                onChange={(e) => setSleepSchedule(e.target.value)}
                className="w-full rounded-xl border border-sand bg-sand/10 p-2 text-xs text-ink outline-none focus:border-door"
              >
                <option value="">Tous les rythmes</option>
                {SLEEP_SCHEDULE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Propreté */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Niveau de propreté</label>
              <select
                value={cleanlinessLevel}
                onChange={(e) => setCleanlinessLevel(e.target.value)}
                className="w-full rounded-xl border border-sand bg-sand/10 p-2 text-xs text-ink outline-none focus:border-door"
              >
                <option value="">Tous niveaux</option>
                {CLEANLINESS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tabac */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Politique tabac</label>
              <select
                value={smokingPolicy}
                onChange={(e) => setSmokingPolicy(e.target.value)}
                className="w-full rounded-xl border border-sand bg-sand/10 p-2 text-xs text-ink outline-none focus:border-door"
              >
                <option value="">Peu importe</option>
                {SMOKING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => applyFilters()}
              className="rounded-full bg-door px-5 py-2 text-xs font-semibold text-white hover:bg-door-deep transition"
            >
              Appliquer les critères
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
