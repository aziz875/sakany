'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Listing, UserRole } from '@sakany/shared';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function LandlordListingsPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !token) {
      router.replace('/auth/login');
      return;
    }

    const authToken = token;

    if (user.role !== UserRole.LANDLORD) {
      setAccessDenied('Cet espace est reserve aux proprietaires.');
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      try {
        const data = await apiFetch<Listing[]>('/listings?mine=true');
        if (active) setListings(data);
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

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="h-40 animate-pulse rounded-2xl bg-sand" />
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-ink">Mes annonces</h1>
        <p className="mt-3 text-ink-soft">Connecte-toi pour voir et gerer tes annonces.</p>
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
              {listings.length} annonce{listings.length > 1 ? 's' : ''} publiee
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

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {!error && listings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-sand bg-white p-8 text-center">
          <p className="font-display text-2xl text-ink">Aucune annonce pour le moment</p>
          <p className="mt-2 text-ink-soft">
            Commence par ajouter ton premier logement pour le montrer aux etudiants.
          </p>
          <Link href="/landlord/new" className="btn-primary mt-6">
            Publier ma premiere annonce
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className="overflow-hidden rounded-2xl border border-sand bg-white p-4 transition-shadow hover:shadow-lg"
            >
              <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-sand">
                {listing.photos?.[0]?.url ? (
                  <Image
                    src={listing.photos[0].url}
                    alt={listing.title}
                    fill
                    className="object-cover"
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
          ))}
        </div>
      )}
    </div>
  );
}
