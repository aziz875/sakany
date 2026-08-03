'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';

interface PhoneRevealProps {
  listingId: string;
}

export function PhoneReveal({ listingId }: PhoneRevealProps) {
  const { user, loading: authLoading } = useAuth();
  const [phone, setPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reveal() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ phone: string; landlordName: string }>(
        `/listings/${listingId}`,
        { method: 'POST' },
      );
      setPhone(data.phone);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de récupérer le numéro.');
    } finally {
      setLoading(false);
    }
  }

  if (phone) {
    return (
      <a
        href={`tel:${phone.replace(/\s/g, '')}`}
        className="font-display text-2xl font-semibold text-door hover:text-door-deep"
      >
        {phone}
      </a>
    );
  }

  if (authLoading) {
    return (
      <button type="button" disabled className="btn-secondary w-full sm:w-auto disabled:opacity-50">
        Chargement…
      </button>
    );
  }

  if (!user) {
    return (
      <div>
        <Link href="/auth/login" className="btn-secondary w-full sm:w-auto">
          Connecte-toi pour afficher le numéro
        </Link>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={reveal}
        disabled={loading}
        className="btn-secondary w-full sm:w-auto"
      >
        {loading ? 'Chargement…' : 'Afficher le numéro'}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}