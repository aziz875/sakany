'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { VerifyEmailSkeleton } from '@/components/LoadingStates';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Lien de vérification invalide.');
      return;
    }

    apiFetch<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
        setTimeout(() => router.push('/auth/login'), 3000);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Erreur de vérification.');
      });
  }, [token, router]);

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 text-center">
      {status === 'loading' && (
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Vérification en cours…</h1>
          <p className="mt-3 text-sm text-ink-soft">Patiente un instant.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="rounded-lg bg-green-50 p-6">
          <h1 className="font-display text-2xl font-bold text-green-800">Email vérifié !</h1>
          <p className="mt-3 text-sm text-green-700">{message}</p>
          <p className="mt-2 text-sm text-green-600">Tu vas être redirigé vers la connexion…</p>
          <Link
            href="/auth/login"
            className="mt-4 inline-block text-sm font-medium text-door hover:text-door-deep"
          >
            Se connecter
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-lg bg-red-50 p-6">
          <h1 className="font-display text-2xl font-bold text-red-800">Échec de la vérification</h1>
          <p className="mt-3 text-sm text-red-700" role="alert">{message}</p>
          <Link
            href="/auth/login"
            className="mt-4 inline-block text-sm font-medium text-door hover:text-door-deep"
          >
            Retour à la connexion
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailSkeleton />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
