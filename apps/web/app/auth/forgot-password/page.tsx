'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6 text-center">
        <div className="rounded-lg bg-green-50 p-6">
          <h1 className="font-display text-2xl font-bold text-green-800">Email envoyé</h1>
          <p className="mt-3 text-sm text-green-700">
            Si un compte existe avec cette adresse, tu recevras un email avec un lien pour
            réinitialiser ton mot de passe.
          </p>
          <Link
            href="/auth/login"
            className="mt-4 inline-block text-sm font-medium text-door hover:text-door-deep"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">Mot de passe oublié</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Saisis ton email et on t'enverra un lien pour réinitialiser ton mot de passe.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-soft">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm focus:border-door"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Envoi…' : 'Envoyer le lien'}
        </button>

        <p className="text-center text-sm text-ink-soft">
          <Link href="/auth/login" className="text-door hover:text-door-deep">
            Retour à la connexion
          </Link>
        </p>
      </form>
    </div>
  );
}