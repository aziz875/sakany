'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, FormEvent } from 'react';
import { User, UserRole } from '@sakany/shared';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { ProfileSkeleton } from '@/components/LoadingStates';
import { User as UserIcon, Lock, Phone, Mail, Shield, CheckCircle2, AlertCircle, Loader2, LogOut, KeyRound } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout, logoutAllDevices, updateUser } = useAuth();

  // Profile Edit State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
    if (user) {
      setFullName(user.fullName);
      setPhone(user.phone);
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return <ProfileSkeleton />;
  }

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setProfileLoading(true);

    try {
      const updated = await apiFetch<User>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ fullName, phone }),
      });
      updateUser(updated);
      setProfileSuccess('Vos informations ont été mises à jour avec succès.');
    } catch (err: any) {
      setProfileError(err.message || 'Erreur lors de la mise à jour du profil.');
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('Le nouveau mot de passe et la confirmation ne correspondent pas.');
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await apiFetch<{ message: string }>('/users/me/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPasswordSuccess(res.message || 'Mot de passe modifié avec succès.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Erreur lors du changement de mot de passe.');
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl border border-sand bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-door/10 text-door font-display text-2xl font-bold">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">{user.fullName}</h1>
                {user.schoolVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    <Shield size={12} />
                    ESPRIT Vérifié
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-soft flex items-center gap-1.5 mt-1">
                <Mail size={14} />
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-sand/60 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-ink-soft">
              {user.role === UserRole.ADMIN ? 'Administrateur' : user.role === UserRole.LANDLORD ? 'Propriétaire' : 'Étudiant'}
            </span>
          </div>
        </div>

        {/* Quick info row */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-sand/60 pt-6">
          <div className="rounded-xl bg-sand/20 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">Rôle</p>
            <p className="mt-1 font-semibold text-ink text-sm">
              {user.role === UserRole.ADMIN ? 'Admin' : user.role === UserRole.LANDLORD ? 'Propriétaire' : 'Étudiant'}
            </p>
          </div>
          <div className="rounded-xl bg-sand/20 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">Téléphone</p>
            <p className="mt-1 font-semibold text-ink text-sm">{user.phone}</p>
          </div>
          <div className="rounded-xl bg-sand/20 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">Email vérifié</p>
            <p className="mt-1 font-semibold text-sm flex items-center gap-1">
              {user.isEmailVerified ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 size={14} /> Oui
                </span>
              ) : (
                <span className="text-amber-700 font-bold">En attente</span>
              )}
            </p>
          </div>
          <div className="rounded-xl bg-sand/20 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">Membre depuis</p>
            <p className="mt-1 font-semibold text-ink text-sm">
              {new Date(user.createdAt).toLocaleDateString('fr-TN', { month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Forms Grid: Left = Edit Profile, Right = Change Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* EDIT PROFILE CARD */}
        <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-sand/60">
              <UserIcon size={18} className="text-door" />
              <h2 className="font-display text-lg font-bold text-ink">Modifier mes coordonnées</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="mt-5 space-y-4">
              {profileError && (
                <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              {profileSuccess && (
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-700">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-1.5">
                  Nom complet
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-2xl border border-sand bg-white py-2.5 px-3.5 text-sm font-medium text-ink focus:border-door focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-1.5">
                  Numéro de téléphone
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+21612345678"
                    className="w-full rounded-2xl border border-sand bg-white py-2.5 px-3.5 text-sm font-medium text-ink focus:border-door focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-ink-soft mt-1">Ex: +21612345678 ou 12345678</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-1.5">
                  Adresse email
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full rounded-2xl border border-sand bg-sand/30 py-2.5 px-3.5 text-sm font-medium text-ink-soft cursor-not-allowed"
                />
                <p className="text-[11px] text-ink-soft mt-1">L&apos;adresse email ne peut pas être modifiée directement.</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="btn-primary w-full py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  {profileLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <span>Enregistrer les modifications</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* CHANGE PASSWORD CARD */}
        <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-sand/60">
              <KeyRound size={18} className="text-door" />
              <h2 className="font-display text-lg font-bold text-ink">Changer de mot de passe</h2>
            </div>

            <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
              {passwordError && (
                <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-700">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-1.5">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-2xl border border-sand bg-white py-2.5 px-3.5 text-sm font-medium text-ink focus:border-door focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-1.5">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 caractères (lettre + chiffre)"
                  className="w-full rounded-2xl border border-sand bg-white py-2.5 px-3.5 text-sm font-medium text-ink focus:border-door focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-1.5">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-2xl border border-sand bg-white py-2.5 px-3.5 text-sm font-medium text-ink focus:border-door focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading || !currentPassword || !newPassword}
                  className="btn-primary w-full py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Modification...</span>
                    </>
                  ) : (
                    <span>Mettre à jour le mot de passe</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* Account Actions Bar */}
      <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
        <h3 className="font-display text-base font-bold text-ink mb-4">Actions du compte</h3>
        
        <div className="flex flex-wrap gap-3">
          {user.role === UserRole.LANDLORD && (
            <Link href="/landlord" className="btn-primary px-5 py-2.5 text-sm">
              Tableau de bord Propriétaire
            </Link>
          )}

          {user.role === UserRole.LANDLORD && (
            <Link href="/landlord/listings" className="btn-secondary px-5 py-2.5 text-sm">
              Gérer mes annonces
            </Link>
          )}

          {user.role === UserRole.ADMIN && (
            <Link href="/admin" className="btn-primary px-5 py-2.5 text-sm">
              Panneau d&apos;administration
            </Link>
          )}

          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push('/');
            }}
            className="inline-flex items-center gap-2 rounded-full border border-sand px-5 py-2.5 text-sm font-medium text-ink-soft hover:border-door hover:text-door transition"
          >
            <LogOut size={16} />
            <span>Se déconnecter</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              if (confirm('Voulez-vous vous déconnecter de tous vos appareils ?')) {
                await logoutAllDevices();
                router.push('/');
              }
            }}
            className="inline-flex items-center gap-2 rounded-full border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition"
          >
            <Lock size={15} />
            <span>Déconnexion de tous les appareils</span>
          </button>
        </div>
      </div>
    </div>
  );
}
