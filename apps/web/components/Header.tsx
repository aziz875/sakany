'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserRole } from '@sakany/shared';
import { useAuth } from '@/lib/auth-context';
import { Skeleton } from './Skeleton';
import { useState, useRef, useEffect } from 'react';
import { Menu, X, User, MessageSquare } from 'lucide-react';
import { NotificationBell } from './NotificationBell';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    setMobileMenuOpen(false);
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-50 border-b border-sand bg-whitewash/90 backdrop-blur" role="banner">
      <div className="flex w-full items-center justify-between px-6 py-4 xl:px-20 relative">
        <Link
          href="/"
          className="font-display text-2xl font-bold text-door"
          aria-label="Sakany — Retour à l'accueil"
          onClick={() => setMobileMenuOpen(false)}
        >
          Sakany
        </Link>

        {/* Mobile menu toggle button */}
        <button
          type="button"
          className="p-2 sm:hidden text-ink-soft hover:text-door"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop Right Navigation */}
        <nav className="hidden sm:flex items-center gap-3 text-sm" aria-label="Navigation utilisateur">
          {user ? (
            <>
              <Link
                href="/messages"
                className="font-medium text-ink hover:bg-sand/30 px-3.5 py-2 rounded-full transition-colors inline-flex items-center gap-1.5"
              >
                <MessageSquare size={16} className="text-door" />
                <span>Messages</span>
              </Link>

              {user.role === UserRole.LANDLORD && (
                <Link href="/landlord/new" className="font-medium text-ink hover:bg-sand/30 px-4 py-2.5 rounded-full transition-colors hidden lg:block">
                  Publier une annonce
                </Link>
              )}
              {user.role === UserRole.STUDENT && (
                <Link href="/favorites" className="font-medium text-ink hover:bg-sand/30 px-4 py-2.5 rounded-full transition-colors hidden lg:block">
                  Mes favoris
                </Link>
              )}

              {/* Notification Bell with Badge and Dropdown */}
              <NotificationBell />
            </>
          ) : (
            <Link href="/auth/register" className="font-medium text-ink hover:bg-sand/30 px-4 py-2.5 rounded-full transition-colors hidden lg:block">
              Créer un compte
            </Link>
          )}

          {/* User Dropdown Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-full border border-sand bg-white p-[0.35rem] pl-3.5 transition-shadow hover:shadow-md focus:outline-none"
              aria-label="Menu utilisateur"
            >
              <Menu size={18} className="text-ink-soft" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-door text-white font-semibold overflow-hidden">
                {user ? (
                  <span className="text-sm">{user.fullName[0].toUpperCase()}</span>
                ) : (
                  <User size={18} />
                )}
              </div>
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 top-[120%] mt-1 w-64 rounded-xl border border-sand/50 bg-white py-2 shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
                {loading ? (
                  <div className="px-4 py-3 flex flex-col gap-2">
                    <Skeleton className="h-4 w-full bg-sand/60" />
                    <Skeleton className="h-4 w-3/4 bg-sand/60" />
                  </div>
                ) : user ? (
                  <>
                    <div className="px-4 py-2 text-sm font-semibold text-ink border-b border-sand/30 mb-2 truncate">
                      {user.fullName}
                    </div>

                    <Link href="/messages" className="block px-4 py-2.5 text-sm font-medium text-ink hover:bg-sand/30 transition-colors" onClick={() => setUserMenuOpen(false)}>
                      Messagerie & Discussions
                    </Link>

                    <Link href="/favorites" className="block px-4 py-2.5 text-sm text-ink-soft hover:bg-sand/30 hover:text-ink transition-colors" onClick={() => setUserMenuOpen(false)}>
                      Mes favoris
                    </Link>

                    {user.role === UserRole.LANDLORD && (
                      <>
                        <Link href="/landlord/listings" className="block px-4 py-2.5 text-sm text-ink-soft hover:bg-sand/30 hover:text-ink transition-colors" onClick={() => setUserMenuOpen(false)}>
                          Mes annonces
                        </Link>
                        <Link href="/landlord/applications" className="block px-4 py-2.5 text-sm text-ink-soft hover:bg-sand/30 hover:text-ink transition-colors" onClick={() => setUserMenuOpen(false)}>
                          Candidatures reçues
                        </Link>
                      </>
                    )}

                    {user.role === UserRole.ADMIN && (
                      <Link href="/admin" className="block px-4 py-2.5 text-sm font-semibold text-door hover:bg-sand/30 hover:text-door-deep transition-colors" onClick={() => setUserMenuOpen(false)}>
                        Tableau de bord Admin
                      </Link>
                    )}

                    <div className="my-1 h-px bg-sand/50" />

                    <Link href="/profile" className="block px-4 py-2.5 text-sm text-ink-soft hover:bg-sand/30 hover:text-ink transition-colors" onClick={() => setUserMenuOpen(false)}>
                      Paramètres du compte
                    </Link>

                    <button
                      onClick={() => {
                        handleLogout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-ink-soft hover:bg-sand/30 hover:text-ink transition-colors"
                    >
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/register" className="block px-4 py-3 text-sm font-semibold text-ink hover:bg-sand/30 transition-colors" onClick={() => setUserMenuOpen(false)}>
                      Créer un compte
                    </Link>
                    <Link href="/auth/login" className="block px-4 py-3 text-sm text-ink hover:bg-sand/30 transition-colors" onClick={() => setUserMenuOpen(false)}>
                      Connexion
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <nav className="sm:hidden border-t border-sand bg-whitewash px-4 py-4 shadow-lg" aria-label="Navigation mobile">
          <div className="flex flex-col gap-4 text-base">
            {loading ? (
              <div className="flex flex-col gap-4">
                <Skeleton className="h-8 w-1/2 rounded bg-sand/60" />
                <Skeleton className="h-8 w-1/3 rounded bg-sand/60" />
              </div>
            ) : user ? (
              <>
                <Link
                  href="/profile"
                  className="font-medium text-ink focus-visible:outline-door"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mon profil ({user.fullName})
                </Link>
                <Link
                  href="/messages"
                  className="font-medium text-door focus-visible:outline-door"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Messagerie & Discussions
                </Link>
                <Link
                  href="/favorites"
                  className="text-ink-soft focus-visible:outline-door"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mes favoris
                </Link>
                {user.role === UserRole.LANDLORD && (
                  <>
                    <Link
                      href="/landlord/listings"
                      className="text-ink-soft focus-visible:outline-door"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Mes annonces
                    </Link>
                    <Link
                      href="/landlord/applications"
                      className="text-ink-soft focus-visible:outline-door"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Candidatures reçues
                    </Link>
                    <Link
                      href="/landlord/new"
                      className="text-door font-medium focus-visible:outline-door"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Publier une annonce
                    </Link>
                  </>
                )}
                {user.role === UserRole.ADMIN && (
                  <Link
                    href="/admin"
                    className="text-door font-semibold focus-visible:outline-door"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Tableau de bord Admin
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-left text-ink-soft focus-visible:outline-door mt-2 border-t border-sand pt-4"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-ink-soft focus-visible:outline-door"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Connexion
                </Link>
                <Link
                  href="/auth/register"
                  className="btn-primary block text-center px-4 py-2 mt-2 focus-visible:outline-door"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Créer un compte
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
