import { Suspense } from 'react';
import Link from 'next/link';
import { RoommateSearchBar } from '@/components/RoommateSearchBar';
import { RoommateCard } from '@/components/RoommateCard';
import { getRoommateProfiles } from '@/lib/server-queries';
import { Users, Sparkles, PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/Skeleton';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const revalidate = 30;

function parseParam(val: string | string[] | undefined): string | undefined {
  if (Array.isArray(val)) return val[0];
  return val;
}

export default async function ColocatairesPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  const city = parseParam(resolvedParams.city);
  const university = parseParam(resolvedParams.university);
  const budgetMax = parseParam(resolvedParams.budgetMax);
  const gender = parseParam(resolvedParams.gender);
  const smokingPolicy = parseParam(resolvedParams.smokingPolicy);
  const cleanlinessLevel = parseParam(resolvedParams.cleanlinessLevel);
  const sleepSchedule = parseParam(resolvedParams.sleepSchedule);

  const { profiles, total } = await getRoommateProfiles({
    city,
    university,
    budgetMax,
    gender,
    smokingPolicy,
    cleanlinessLevel,
    sleepSchedule,
  });

  return (
    <div className="min-h-screen bg-whitewash pb-24">
      {/* Hero Header Section */}
      <section className="relative overflow-hidden border-b border-sand bg-gradient-to-b from-sand/30 via-sand/10 to-transparent py-10 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sand bg-white/80 backdrop-blur px-4 py-1.5 text-xs font-semibold text-door shadow-sm mb-4">
            <Sparkles size={14} />
            <span>Colocation & Matchmaking Étudiant en Tunisie</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-ink">
            Trouve ton futur <span className="text-door">colocataire idéal</span>
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-ink-soft">
            Explore les profils d&apos;étudiants par université, budget et compatibilité de mode de vie (sommeil, propreté, invités).
          </p>

          {/* Quick CTA to create profile */}
          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/colocataires/profile"
              className="inline-flex items-center gap-2 rounded-full bg-door px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-door-deep transition"
            >
              <PlusCircle size={16} />
              Créer mon profil colocataire
            </Link>
          </div>

          {/* Interactive Search Bar */}
          <div className="mt-8">
            <RoommateSearchBar initialParams={resolvedParams} />
          </div>
        </div>
      </section>

      {/* Main Roommate Feed */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-10">
        {/* Results Counter */}
        <div className="flex items-center justify-between pb-6 border-b border-sand/60">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-door" />
            <h2 className="text-lg font-bold text-ink">
              {total} profil{total > 1 ? 's' : ''} disponible{total > 1 ? 's' : ''}
            </h2>
          </div>
          <span className="text-xs sm:text-sm text-ink-soft">
            {city ? `À ${city}` : 'Toute la Tunisie'}
          </span>
        </div>

        {/* Profile Grid */}
        {profiles.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {profiles.map((profile, index) => (
              <RoommateCard key={profile.id} profile={profile} index={index} />
            ))}
          </div>
        ) : (
          <div className="mt-16 flex flex-col items-center justify-center rounded-3xl border border-dashed border-sand bg-white p-12 text-center shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sand/40 text-3xl">
              👥
            </div>
            <h3 className="mt-4 text-lg font-bold text-ink">Aucun colocataire trouvé</h3>
            <p className="mt-1.5 max-w-md text-sm text-ink-soft">
              Essaie d&apos;élargir tes critères de recherche ou sois le premier à publier ton profil dans cette zone !
            </p>
            <Link
              href="/colocataires/profile"
              className="mt-6 rounded-full bg-door px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-door-deep"
            >
              Publier mon profil
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
