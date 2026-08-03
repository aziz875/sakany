'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState, Suspense } from 'react';
import { AuthResponse } from '@sakany/shared';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { login } = useAuth();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Lien invalide</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Le lien de réinitialisation est invalide ou a expiré.
        </p>
      </div>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8 || !/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      setError('Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre.');
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch<AuthResponse>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });

      login(data);
      setSuccess(true);
      setTimeout(() => router.push('/'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6 text-center">
        <div className="rounded-lg bg-green-50 p-6">
          <h1 className="font-display text-2xl font-bold text-green-800">Mot de passe réinitialisé</h1>
          <p className="mt-3 text-sm text-green-700">
            Ton mot de passe a été modifié. Tu es connecté automatiquement.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">Nouveau mot de passe</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Choisis un nouveau mot de passe pour ton compte.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-soft">Nouveau mot de passe</label>
          <div className="relative mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm pr-10 focus:border-door"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-soft hover:text-ink"
              tabIndex={-1}
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            Minimum 8 caractères, au moins une lettre et un chiffre.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Réinitialisation…' : 'Réinitialiser mon mot de passe'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-12 text-center text-ink-soft">Chargement…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}