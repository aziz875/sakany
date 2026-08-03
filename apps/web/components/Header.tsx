'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserRole } from '@sakany/shared';
import { useAuth } from '@/lib/auth-context';

export function Header() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <header className="border-b border-sand bg-whitewash/90 backdrop-blur" role="banner">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-2xl font-bold text-door"
          aria-label="Sakany — Retour à l'accueil"
        >
          Sakany
        </Link>

        <nav className="flex items-center gap-3 text-sm" aria-label="Navigation principale">
          {loading ? (
            <span
              className="h-9 w-40 animate-pulse rounded-full bg-sand/60"
              aria-hidden="true"
              role="status"
              aria-label="Chargement..."
            />
          ) : user ? (
            <>
              <Link href="/favorites" className="text-ink-soft hover:text-door focus-visible:outline-door">
                Favoris
              </Link>
              {user.role === UserRole.LANDLORD && (
                <>
                  <Link
                    href="/landlord/listings"
                    className="text-ink-soft hover:text-door focus-visible:outline-door"
                  >
                    Mes annonces
                  </Link>
                  <Link
                    href="/landlord/new"
                    className="btn-primary px-4 py-2 text-sm focus-visible:outline-door"
                  >
                    Publier une annonce
                  </Link>
                </>
              )}

              <Link
                href="/profile"
                className="rounded-full bg-sand px-3 py-2 text-ink-soft hover:text-door focus-visible:outline-door"
                aria-label={`Mon profil — ${user.fullName}`}
              >
                {user.fullName}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="text-ink-soft hover:text-door focus-visible:outline-door"
                aria-label="Se déconnecter"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/favorites" className="text-ink-soft hover:text-door focus-visible:outline-door">
                Favoris
              </Link>
              <Link href="/auth/login" className="text-ink-soft hover:text-door focus-visible:outline-door">
                Connexion
              </Link>
              <Link
                href="/auth/register"
                className="btn-primary px-4 py-2 text-sm focus-visible:outline-door"
              >
                Créer un compte
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
