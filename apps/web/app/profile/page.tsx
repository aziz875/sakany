'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserRole } from '@sakany/shared';
import { useAuth } from '@/lib/auth-context';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="h-40 animate-pulse rounded-2xl bg-sand" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-ink-soft">Mon profil</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">{user.fullName}</h1>
        <p className="mt-1 text-ink-soft">{user.email}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-sand/40 p-4">
            <p className="text-sm text-ink-soft">Rôle</p>
            <p className="mt-1 font-medium text-ink">
              {user.role === UserRole.LANDLORD ? 'Propriétaire' : 'Étudiant'}
            </p>
          </div>
          <div className="rounded-2xl bg-sand/40 p-4">
            <p className="text-sm text-ink-soft">Téléphone</p>
            <p className="mt-1 font-medium text-ink">{user.phone}</p>
          </div>
          <div className="rounded-2xl bg-sand/40 p-4">
            <p className="text-sm text-ink-soft">Email vérifié</p>
            <p className="mt-1 font-medium text-ink">
              {user.isEmailVerified ? 'Oui' : 'Non'}
            </p>
          </div>
          <div className="rounded-2xl bg-sand/40 p-4">
            <p className="text-sm text-ink-soft">Compte</p>
            <p className="mt-1 font-medium text-ink">Connecté</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {user.role === UserRole.LANDLORD && (
            <Link href="/landlord/listings" className="btn-primary px-5 py-2.5 text-sm">
              Mes annonces
            </Link>
          )}
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push('/');
            }}
            className="rounded-full border border-sand px-5 py-2.5 text-sm font-medium text-ink-soft hover:border-door hover:text-door"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}
