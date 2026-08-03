import { Suspense } from 'react';
import { ListingFilters } from '@sakany/shared';
import { ListingCard } from '@/components/ListingCard';
import { SearchBar } from '@/components/SearchBar';
import { BrassDivider } from '@/components/BrassDivider';
import { getListings } from '@/lib/server-queries';

interface HomeProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function buildQuery(params: Record<string, string | string[] | undefined>): Record<string, string> {
  const filters: Record<string, string> = {};
  const keys: (keyof ListingFilters)[] = [
    'minPrice',
    'maxPrice',
    'roomType',
    'maxDistanceKm',
    'furnished',
    'verifiedOnly',
  ];

  for (const key of keys) {
    const val = params[key];
    if (typeof val === 'string' && val) filters[key] = val;
  }

  return filters;
}

async function ListingGrid({ params }: { params: Record<string, string | string[] | undefined> }) {
  try {
    const filters = buildQuery(params);
    const { listings } = await getListings({ ...filters, page: 1, pageSize: 12 });

    if (listings.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-sand bg-sand/30 p-12 text-center">
          <p className="font-display text-xl text-ink">Aucune annonce pour l'instant</p>
          <p className="mt-2 text-ink-soft">
            Essaie d'élargir tes filtres ou reviens bientôt, de nouvelles annonces arrivent.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    );
  } catch {
    return (
      <div className="rounded-2xl border border-dashed border-sand bg-sand/30 p-12 text-center">
        <p className="font-display text-xl text-ink">Le serveur n'est pas encore disponible</p>
        <p className="mt-2 text-ink-soft">
          Recharge la page dans quelques instants.
        </p>
      </div>
    );
  }
}

// ISR: revalidate the home page every 60s for fast navigation.
export const revalidate = 60;

export default async function HomePage({ searchParams }: HomeProps) {
  const params = await searchParams;

  return (
    <div>
      <section className="border-b border-sand bg-sand/40">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-sm font-medium uppercase tracking-wider text-door">
            Logement étudiant · ESPRIT Tunis
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
            Trouve ton chez-toi près du campus
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-soft">
            Chambres, studios et appartements en location mensuelle. Contact direct avec le
            propriétaire - pas de frais pour les étudiants.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-sand" />}>
          <SearchBar initialParams={params} />
        </Suspense>

        <BrassDivider />

        <Suspense
          fallback={
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-2xl bg-sand" />
              ))}
            </div>
          }
        >
          <ListingGrid params={params} />
        </Suspense>
      </div>
    </div>
  );
}