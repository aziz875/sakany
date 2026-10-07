'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { Listing, UserRole } from '@sakany/shared';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ListingGridSkeleton } from '@/components/LoadingStates';
import { FriendlyEmptyState } from '@/components/FriendlyEmptyState';

type OwnerListing = Pick<Listing, 'id' | 'title' | 'pricePerMonth' | 'distanceToCampus' | 'photos'>;

export default function LandlordListingsPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<OwnerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !token) {
      router.replace('/auth/login');
      return;
    }

    if (user.role !== UserRole.LANDLORD) {
      setAccessDenied('Cet espace est réservé aux propriétaires.');
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      try {
        const data = await apiFetch<{ listings: OwnerListing[] }>('/listings?mine=true&view=owner');
        if (active) setListings(data.listings);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Impossible de charger tes annonces.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [authLoading, token, user, router]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Supprimer définitivement l'annonce « ${title} » ?\n\nCette action est irréversible. Tous les avis, photos et candidatures associés seront aussi supprimés.`)) {
      return;
    }

    setDeletingId(id);
    try {
      await apiFetch(`/listings/${id}`, { method: 'DELETE' });
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression.');
    } finally {
      setDeletingId(null);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <ListingGridSkeleton count={6} />
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-ink">Mes annonces</h1>
        <p className="mt-3 text-ink-soft">Connecte-toi pour voir et gérer tes annonces.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/auth/login" className="btn-primary">
            Se connecter
          </Link>
          <Link href="/landlord/new" className="btn-secondary">
            Publier une annonce
          </Link>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-ink">Mes annonces</h1>
        <p className="mt-3 text-ink-soft">{accessDenied}</p>
        <div className="mt-6 flex gap-3">
          <Link href="/profile" className="btn-primary">
            Voir mon profil
          </Link>
          <Link href="/auth/login" className="btn-secondary">
            Changer de compte
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Mes annonces</h1>
          <p className="mt-2 text-ink-soft">
            {listings.length} annonce{listings.length > 1 ? 's' : ''} publiée
            {listings.length > 1 ? 's' : ''} sur Sakany.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/landlord" className="btn-secondary">
            Tableau de bord
          </Link>
          <Link href="/landlord/new" className="btn-primary">
            Nouvelle annonce
          </Link>
        </div>
      </div>

      {error && <p className="mt-6 text-sm text-red-600" role="alert">{error}</p>}

      {!error && listings.length === 0 ? (
        <div className="mt-8">
          <FriendlyEmptyState
            title="Aucune annonce pour le moment"
            description="Commence par ajouter ton premier logement pour le montrer aux étudiants."
            actionLabel="Publier ma première annonce"
            actionHref="/landlord/new"
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing, index) => (
            <div
              key={listing.id}
              className="card-enter overflow-hidden rounded-2xl border border-sand bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col"
              style={{ '--card-delay': `${index * 70}ms` } as CSSProperties}
            >
              <Link href={`/listings/${listing.id}`} className="block mb-4">
                <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-sand">
                  {listing.photos?.[0]?.url ? (
                    <Image
                      src={listing.photos[0].url}
                      alt={listing.title}
                      fill
                      className="object-cover transition-transform duration-300 ease-out hover:scale-[1.05]"
                      sizes="(max-width:768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-ink-soft">
                      Pas de photo
                    </div>
                  )}
                </div>
                <h2 className="font-display text-lg font-semibold text-ink">{listing.title}</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  {listing.pricePerMonth} DT/mois - {listing.distanceToCampus} km d&apos;ESPRIT
                </p>
              </Link>
              <div className="mt-auto border-t border-sand pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => handleDelete(listing.id, listing.title)}
                  disabled={deletingId === listing.id}
                  className="pressable rounded-full border border-red-200 px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === listing.id ? 'Suppression...' : 'Supprimer'}
                </button>
                <Link
                  href={`/landlord/listings/${listing.id}/edit`}
                  className="pressable rounded-full border border-sand px-4 py-1.5 text-sm font-medium text-ink hover:bg-sand/30"
                >
                  Modifier
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

