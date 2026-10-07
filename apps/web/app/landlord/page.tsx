'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RoomType, ROOM_TYPE_LABELS, UserRole } from '@sakany/shared';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { LandlordApplications } from '@/components/LandlordApplications';
import { DashboardSkeleton } from '@/components/LoadingStates';
import { FriendlyEmptyState } from '@/components/FriendlyEmptyState';

interface ListingStat {
  id: string;
  title: string;
  pricePerMonth: number;
  roomType: RoomType;
  verified: boolean;
  featured: boolean;
  createdAt: string;
  reviewCount: number;
  averageRating: number | null;
}

interface StatsData {
  totalListings: number;
  verifiedListings: number;
  featuredListings: number;
  totalReviews: number;
  totalPhotos: number;
  averageRating: number | null;
  averagePrice: number;
  recentListings: number;
  listings: ListingStat[];
}

function StatCard({
  label,
  value,
  subtext,
  accent = false,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border ${
        accent ? 'border-door bg-door/5' : 'border-sand bg-white'
      } p-5 shadow-sm`}
    >
      <p className="text-sm text-ink-soft">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${accent ? 'text-door' : 'text-ink'}`}>
        {value}
      </p>
      {subtext && <p className="mt-1 text-xs text-ink-soft">{subtext}</p>}
    </div>
  );
}

export default function LandlordDashboardPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) {
      router.replace('/auth/login');
      return;
    }

    if (user.role !== UserRole.LANDLORD) {
      setError('Cet espace est réservé aux propriétaires.');
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      try {
        const data = await apiFetch<StatsData>('/landlord/stats');
        if (active) setStats(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Erreur de chargement.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [authLoading, token, user, router]);

  if (authLoading || loading) {
    return <DashboardSkeleton />;
  }

  if (!user || !token) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-ink">Tableau de bord</h1>
        <p className="mt-3 text-ink-soft">Connecte-toi pour accéder à ton tableau de bord.</p>
        <Link href="/auth/login" className="btn-primary mt-6 inline-block">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Tableau de bord</h1>
          <p className="mt-2 text-ink-soft">
            Bienvenue, {user.fullName} · Vue d'ensemble de tes annonces
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/landlord/listings" className="btn-secondary">
            Mes annonces
          </Link>
          <Link href="/landlord/new" className="btn-primary">
            Nouvelle annonce
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {!error && stats && (
        <>
          {/* Metrics grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Annonces" value={stats.totalListings} accent />
            <StatCard
              label="Revenu mensuel estimé"
              value={`${stats.averagePrice} DT`}
              subtext="Prix moyen par logement"
            />
            <StatCard
              label="Avis reçus"
              value={stats.totalReviews}
              subtext={
                stats.averageRating !== null
                  ? `Moyenne ${stats.averageRating}/5`
                  : 'Aucune évaluation'
              }
            />
            <StatCard
              label="Photos"
              value={stats.totalPhotos}
              subtext={` sur ${stats.totalListings} annonce${stats.totalListings > 1 ? 's' : ''}`}
            />
          </div>

          {/* Secondary metrics */}
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-sand bg-white p-4">
              <p className="text-sm text-ink-soft">Vérifiées</p>
              <p className="mt-1 font-display text-xl font-semibold text-green-700">
                {stats.verifiedListings}/{stats.totalListings}
              </p>
            </div>
            <div className="rounded-xl border border-sand bg-white p-4">
              <p className="text-sm text-ink-soft">En vedette</p>
              <p className="mt-1 font-display text-xl font-semibold text-amber-700">
                {stats.featuredListings}/{stats.totalListings}
              </p>
            </div>
            <div className="rounded-xl border border-sand bg-white p-4">
              <p className="text-sm text-ink-soft">Nouvelles (30 jours)</p>
              <p className="mt-1 font-display text-xl font-semibold text-door">
                {stats.recentListings}
              </p>
            </div>
          </div>

          <LandlordApplications />

          {/* Listings table */}
          {stats.listings.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-xl font-semibold text-ink">Mes annonces</h2>
              <div className="mt-4 overflow-hidden rounded-2xl border border-sang bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-sand/50 text-ink-soft">
                    <tr>
                      <th className="px-4 py-3 font-medium">Titre</th>
                      <th className="px-4 py-3 font-medium">Prix</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Avis</th>
                      <th className="px-4 py-3 font-medium">Statut</th>
                      <th className="px-4 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand">
                    {stats.listings.map((l) => (
                      <tr key={l.id} className="hover:bg-sand/20">
                        <td className="px-4 py-3 font-medium text-ink">{l.title}</td>
                        <td className="px-4 py-3 text-ink-soft">{l.pricePerMonth} DT</td>
                        <td className="px-4 py-3 text-ink-soft">
                          {ROOM_TYPE_LABELS[l.roomType as keyof typeof ROOM_TYPE_LABELS] ?? l.roomType}
                        </td>
                        <td className="px-4 py-3 text-ink-soft">
                          {l.reviewCount > 0
                            ? `${l.averageRating}/5 (${l.reviewCount})`
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {l.verified ? (
                            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                              Vérifié
                            </span>
                          ) : (
                            <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs text-ink-soft">
                              Standard
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/listings/${l.id}`}
                            className="text-sm text-door hover:text-door-deep"
                          >
                            Voir →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {!error && !stats && (
        <div className="mt-12">
          <FriendlyEmptyState
            title="Bienvenue sur Sakany"
            description="Commence par publier ta première annonce pour voir tes statistiques."
            actionLabel="Publier une annonce"
            actionHref="/landlord/new"
          />
        </div>
      )}
    </div>
  );
}
