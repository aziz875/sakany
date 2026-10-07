'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { AuthResponse, UserRole } from '@sakany/shared';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'generic' | 'unverified' | 'locked' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorType(null);

    const form = new FormData(e.currentTarget);
    const submittedEmail = (form.get('email') as string).toLowerCase().trim();
    setEmail(submittedEmail);

    try {
      const data = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: submittedEmail,
          password: form.get('password'),
          rememberMe,
        }),
      });

      login(data);
      if (data.user.role === UserRole.ADMIN) {
        router.push('/admin');
      } else if (data.user.role === UserRole.LANDLORD) {
        router.push('/landlord/listings');
      } else {
        router.push('/');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connexion impossible.';

      // Detect specific error types
      if (message.toLowerCase().includes('vérifié') || message.toLowerCase().includes('verify')) {
        setErrorType('unverified');
        setError('Veuillez vérifier votre email avant de vous connecter.');
      } else if (message.toLowerCase().includes('tentatives') || message.toLowerCase().includes('réessaie')) {
        setErrorType('locked');
        setError(message);
      } else {
        setErrorType('generic');
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    if (!email) return;
    setLoading(true);
    try {
      await apiFetch('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setError('Email de vérification renvoyé. Vérifie ta boîte de réception.');
      setErrorType(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du renvoi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">Connexion</h1>
      <p className="mt-2 text-ink-soft">
        Pas encore de compte ?{' '}
        <Link href="/auth/register" className="text-door hover:text-door-deep">
          S'inscrire
        </Link>
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-ink-soft">Email</label>
          <input
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm focus:border-door"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-ink-soft">Mot de passe</label>
          <div className="relative mt-1">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
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
        </div>

        {/* Remember me + Forgot password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-sand text-door focus:ring-door"
            />
            Se souvenir de moi
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-sm text-door hover:text-door-deep"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className={`rounded-lg p-3 text-sm ${
              errorType === 'unverified'
                ? 'bg-amber-50 text-amber-700'
                : errorType === 'locked'
                ? 'bg-red-50 text-red-600'
                : 'bg-red-50 text-red-600'
            }`}
          >
            <p>{error}</p>
            {errorType === 'unverified' && (
              <button
                type="button"
                onClick={resendVerification}
                disabled={loading}
                className="mt-2 text-sm font-medium text-door hover:text-door-deep underline"
              >
                Renvoyer l'email de vérification
              </button>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}